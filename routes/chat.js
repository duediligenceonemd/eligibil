'use strict';

/**
 * routes/chat.js — AI Grant Advisor chat endpoint
 *
 *   POST /api/chat
 *   Body: { message: string, grantId?: string, history?: [{role, content}], language?: 'ro'|'en' }
 *   Response: { reply: string, via: 'bedrock'|'anthropic', grantId: string|null }
 *
 * Priority: AWS Bedrock (Haiku — cheap, fast) → Anthropic direct → 503
 * Auth: optional — profile context added when logged in.
 */

const express         = require('express');
const db              = require('../db/users-supabase');
const { getSupabase } = require('../db/supabase');
const { isBedrockEnabled, bedrockChat, DEFAULT_CHAT_MODEL } = require('../lib/bedrock');
const { reportError } = require('../instrument');

const router = express.Router();

// ── Model config ─────────────────────────────────────────────────────────────
// Use Haiku for chat (10× cheaper than Sonnet) — fast, accurate enough for Q&A
const BEDROCK_CHAT_MODEL  = process.env.AWS_HAIKU_MODEL  || 'anthropic.claude-haiku-4-5-20251001-v1:0';
const DIRECT_CHAT_MODEL   = process.env.ANTHROPIC_CHAT_MODEL || 'claude-haiku-4-5-20251001';

const MAX_HISTORY_TURNS = 8;   // keep last 8 turns (16 messages)
const MAX_MSG_CHARS     = 1200; // per message content cap

// ── System prompt builder ────────────────────────────────────────────────────
function buildSystem(grant, startup, lang) {
  const isEn = lang === 'en';

  const base = isEn
    ? `You are an AI grant advisor for eligibil.org. You help startups in Moldova, Romania and the EU find, evaluate, and apply for funding grants. Be concise (3–4 paragraphs max), practical, and actionable. Focus on eligibility, required documents, application steps, and success tips. Never fabricate data — if you don't know something, say so clearly.`
    : `Ești un consilier AI de granturi pentru eligibil.org. Ajuți startup-uri din Moldova, România și UE să găsească, evalueze și aplice pentru granturi de finanțare. Fii concis (max 3–4 paragrafe), practic și orientat spre acțiune. Concentrează-te pe eligibilitate, documente necesare, pași de aplicare și sfaturi de succes. Nu inventa date — dacă nu știi ceva, spune-o clar.`;

  const grantCtx = grant ? `

## ${isEn ? 'Current grant' : 'Grant curent'}
- ${isEn ? 'Name' : 'Nume'}: ${grant.nume_program || ''}
- ${isEn ? 'Organization' : 'Organizație'}: ${grant.organizatie || grant.funder_name || ''}
- ${isEn ? 'Amount' : 'Sumă'}: ${
    grant.suma_min && grant.suma_max
      ? `€${Number(grant.suma_min).toLocaleString()} – €${Number(grant.suma_max).toLocaleString()}`
      : grant.suma_max ? `${isEn ? 'up to' : 'până la'} €${Number(grant.suma_max).toLocaleString()}` : (isEn ? 'unspecified' : 'nespecificată')
  }
- Deadline: ${grant.deadline || (isEn ? 'unspecified' : 'nespecificat')}
- ${isEn ? 'Eligible stage' : 'Stadiu eligibil'}: ${grant.stadiu || ''}
- ${isEn ? 'Sector' : 'Sector'}: ${grant.sector || 'general'}
- ${isEn ? 'Requirements' : 'Cerințe'}: ${(grant.cerinte || '').slice(0, 600)}
- ${isEn ? 'Description' : 'Descriere'}: ${(grant.short_summary_ro || grant.short_summary_en || grant.descriere || '').slice(0, 400)}
${grant.eligibility_rules && Array.isArray(grant.eligibility_rules) && grant.eligibility_rules.length
    ? `- ${isEn ? 'Eligibility rules' : 'Reguli eligibilitate'}: ${JSON.stringify(grant.eligibility_rules).slice(0, 500)}`
    : ''}` : '';

  const startupCtx = startup ? `

## ${isEn ? 'Startup profile' : 'Profilul startupului'}
- ${isEn ? 'Sector' : 'Sector'}: ${startup.sector || (isEn ? 'unspecified' : 'nespecificat')}
- ${isEn ? 'Stage' : 'Stadiu'}: ${startup.stage || (isEn ? 'unspecified' : 'nespecificat')}
- ${isEn ? 'Country' : 'Țară'}: ${startup.country || 'Moldova/Romania'}
- TRL: ${startup.trl || (isEn ? 'unspecified' : 'nespecificat')}
- Pitch: ${(startup.pitch || '').slice(0, 300)}` : '';

  const langNote = isEn ? 'Respond in English.' : 'Răspunde în română.';

  return `${base}${grantCtx}${startupCtx}

${langNote}`;
}

// ── POST /api/chat ────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { message, grantId, history = [], language = 'ro' } = req.body || {};

  // ── Input validation ────────────────────────────────────────────────────────
  if (!message || typeof message !== 'string' || message.trim().length < 2) {
    return res.status(400).json({ error: 'Mesaj invalid sau prea scurt.' });
  }
  if (message.length > 1500) {
    return res.status(400).json({ error: 'Mesajul depășește 1500 caractere.' });
  }
  const lang = ['ro', 'en', 'ru', 'ua'].includes(language) ? language : 'ro';

  const sb = getSupabase();

  // ── Load grant context (non-fatal) ─────────────────────────────────────────
  let grant = null;
  if (grantId && sb) {
    try {
      const { data } = await sb
        .from('grants')
        .select('id, nume_program, organizatie, funder_name, suma_min, suma_max, stadiu, sector, deadline, cerinte, descriere, short_summary_ro, short_summary_en, eligibility_rules, website')
        .eq('id', String(grantId))
        .maybeSingle();
      grant = data || null;
    } catch (err) {
      console.error('[chat] grant load error:', err.message);
    }
  }

  // ── Load startup profile (non-fatal) ───────────────────────────────────────
  let startup = null;
  if (req.session?.userId && sb) {
    try {
      startup = await db.findOne('startups', { user_id: req.session.userId });
    } catch {}
  }

  // ── Build messages array with history ──────────────────────────────────────
  const safeHistory = Array.isArray(history) ? history.slice(-MAX_HISTORY_TURNS * 2) : [];
  const messages = [
    ...safeHistory
      .filter(h => h && ['user', 'assistant'].includes(h.role) && h.content)
      .map(h => ({
        role: h.role,
        content: String(h.content).slice(0, MAX_MSG_CHARS),
      })),
    { role: 'user', content: message.trim() },
  ];

  const systemPrompt = buildSystem(grant, startup, lang);

  let reply = null;
  let via   = null;

  // ── 1. Try AWS Bedrock (primary) ────────────────────────────────────────────
  if (isBedrockEnabled('chat')) {
    try {
      const result = await bedrockChat({
        model:     BEDROCK_CHAT_MODEL,
        maxTokens: 1500,
        system:    systemPrompt,
        messages,
      });
      reply = result.text;
      via   = 'bedrock';
    } catch (err) {
      reportError(err, { tags: { area: 'chat', via: 'bedrock' } });
      console.error('[chat] Bedrock error, falling back:', err.message);
    }
  }

  // ── 2. Fallback: Anthropic direct ──────────────────────────────────────────
  if (!reply && process.env.ANTHROPIC_API_KEY) {
    try {
      const Anthropic = require('@anthropic-ai/sdk');
      const client    = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const resp      = await client.messages.create({
        model:      DIRECT_CHAT_MODEL,
        max_tokens: 1500,
        system:     systemPrompt,
        messages,
      });
      reply = resp.content[0]?.text || '';
      via   = 'anthropic';
    } catch (err) {
      reportError(err, { tags: { area: 'chat', via: 'anthropic' } });
      console.error('[chat] Anthropic error:', err.message);
    }
  }

  // ── No provider available ───────────────────────────────────────────────────
  if (!reply) {
    return res.status(503).json({
      error: 'AI chat indisponibil. Configurează AWS_ACCESS_KEY_ID sau ANTHROPIC_API_KEY.',
    });
  }

  res.json({
    reply,
    via,
    grantId: grant?.id || null,
  });
});

module.exports = router;

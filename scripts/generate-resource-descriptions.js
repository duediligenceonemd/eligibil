'use strict';

require('dotenv').config();

const { OpenAI } = require('openai');
const { getSupabase } = require('../db/supabase');

const DEFAULT_MODEL = process.env.RESOURCE_DESCRIPTION_MODEL || 'gpt-4.1-mini';
const DEFAULT_LIMIT = Math.max(parseInt(process.env.RESOURCE_DESCRIPTION_LIMIT || '20', 10) || 20, 1);
const DESCRIPTION_SOURCE = `openai:${DEFAULT_MODEL}`;

function buildPrompt(row) {
  return [
    'Generate concise bilingual descriptions in an institutional tone for a startup funding resource.',
    'Return strict JSON with keys: short_summary_ro, short_summary_en, description_ro, description_en.',
    'Tone requirements:',
    '- institutional, neutral, and factual',
    '- no promotional language',
    '- no exaggerated claims',
    '- no calls to action',
    '- avoid speculation unless clearly marked as likely or inferred',
    '- write as if for a public funding and information platform',
    'Content requirements:',
    '- short summaries should be 1 sentence, maximum 160 characters',
    '- long descriptions should be 2-3 sentences',
    '- explain what the program or resource is',
    '- explain who it is relevant for',
    '- explain what kind of support, funding, access, or information it appears to provide',
    '- if the data is incomplete, remain cautious and do not invent details',
    '- if inference is necessary, use careful phrasing such as "appears to", "is likely intended for", or "suggests"',
    'Resource-type guidance:',
    '- for government_program, emphasize the program objective, public or institutional context, and likely eligibility profile',
    '- for technical_resource, emphasize operational support, expertise, tools, infrastructure, or implementation assistance',
    '- for capital_resource, emphasize investor access, capital availability, financial networks, or funding relationships',
    '- for funding_resource and grant_database, emphasize the informational, directory, or discovery role of the resource',
    '- for resource_directory, emphasize that it aggregates useful programs, links, or references',
    '',
    `Title: ${row.title || ''}`,
    `Category: ${row.category || ''}`,
    `Amount: ${row.amount_raw || ''}`,
    `Sheet: ${row.sheet_name || ''}`,
    `Region group: ${row.region_group || ''}`,
    `Resource type: ${row.resource_type || ''}`,
    `Grant-like: ${row.is_grant_like === true ? 'yes' : 'no'}`,
    `Raw description: ${row.description || ''}`,
    `Website: ${row.website || ''}`,
  ].join('\n');
}

function parseJsonObject(raw) {
  const text = String(raw || '').trim();
  if (!text) throw new Error('Model returned empty content');
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first === -1 || last === -1 || last < first) {
    throw new Error('Model did not return a JSON object');
  }
  return JSON.parse(text.slice(first, last + 1));
}

function normalizeGenerated(obj) {
  const clean = (value) => {
    if (value == null) return null;
    const text = String(value).trim().replace(/\s+/g, ' ');
    return text || null;
  };
  return {
    short_summary_ro: clean(obj.short_summary_ro),
    short_summary_en: clean(obj.short_summary_en),
    description_ro: clean(obj.description_ro),
    description_en: clean(obj.description_en),
  };
}

async function generateOne(client, model, row) {
  const completion = await client.chat.completions.create({
    model,
    temperature: 0.3,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'You generate high-signal bilingual descriptions for startup funding resources.',
      },
      {
        role: 'user',
        content: buildPrompt(row),
      },
    ],
  });

  const content = completion.choices?.[0]?.message?.content || '';
  return normalizeGenerated(parseJsonObject(content));
}

async function fetchRows(supabase, { ids, limit, overwrite }) {
  let query = supabase
    .from('funding_resources')
    .select('id, title, amount_raw, category, description, website, region_group, resource_type, sheet_name, is_grant_like')
    .order('sheet_name', { ascending: true })
    .order('row_number', { ascending: true });

  if (Array.isArray(ids) && ids.length) {
    query = query.in('id', ids);
  } else if (!overwrite) {
    query = query.or('short_summary_ro.is.null,short_summary_en.is.null,description_ro.is.null,description_en.is.null');
  }

  if (!ids?.length) query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw new Error(`Nu pot citi funding_resources: ${error.message}`);
  return data || [];
}

async function persistGenerated(supabase, rowId, payload, model) {
  const update = {
    ...payload,
    description_source: `openai:${model}`,
    description_generated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('funding_resources')
    .update(update)
    .eq('id', rowId);

  if (error) throw new Error(`Nu pot salva descrierea pentru ${rowId}: ${error.message}`);
}

async function generateDescriptions(options = {}) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY lipsește. Generatorul de descrieri nu poate rula.');
  }

  const model = options.model || DEFAULT_MODEL;
  const overwrite = !!options.overwrite;
  const limit = Math.max(parseInt(String(options.limit || DEFAULT_LIMIT), 10) || DEFAULT_LIMIT, 1);
  const ids = Array.isArray(options.ids) ? options.ids.filter(Boolean) : [];
  const dryRun = !!options.dryRun;

  const supabase = getSupabase();
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const rows = await fetchRows(supabase, { ids, limit, overwrite });

  const results = [];
  for (const row of rows) {
    const generated = await generateOne(client, model, row);
    results.push({ id: row.id, title: row.title, ...generated });
    if (!dryRun) {
      await persistGenerated(supabase, row.id, generated, model);
    }
  }

  return {
    model,
    overwrite,
    dryRun,
    processed: results.length,
    results,
  };
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const overwrite = process.argv.includes('--overwrite');
  const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
  const idsArg = process.argv.find((arg) => arg.startsWith('--ids='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : DEFAULT_LIMIT;
  const ids = idsArg ? idsArg.split('=')[1].split(',').map((item) => item.trim()).filter(Boolean) : [];

  const summary = await generateDescriptions({ dryRun, overwrite, limit, ids });

  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║ eligibil.org — Resource Description Generator     ║');
  console.log('╚════════════════════════════════════════════════════╝');
  console.log(`Model     : ${summary.model}`);
  console.log(`Dry run   : ${summary.dryRun ? 'DA' : 'nu'}`);
  console.log(`Overwrite : ${summary.overwrite ? 'DA' : 'nu'}`);
  console.log(`Processed : ${summary.processed}`);
  console.log('');
  summary.results.slice(0, 5).forEach((item) => {
    console.log(`- ${item.title}`);
    console.log(`  RO: ${item.short_summary_ro || '-'}`);
    console.log(`  EN: ${item.short_summary_en || '-'}`);
  });
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`\n✗ ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  DESCRIPTION_SOURCE,
  generateDescriptions,
};

'use strict';

/**
 * obsidian.js — Two-way sync between Supabase grants and Obsidian vault
 *
 * Vault structure:
 *   eligibil-grants/
 *     drafts/      ← AI writes here (status='pending')
 *     published/   ← approved & live in Supabase grants table
 *     applied/     ← user applied (linked to pipeline)
 *     ignored/     ← rejected
 *     _index.md    ← auto-generated dashboard
 */

const fs   = require('fs');
const path = require('path');

const VAULT_ROOT = process.env.OBSIDIAN_VAULT
  || path.join(process.env.USERPROFILE || process.env.HOME || '.', 'eligibil-grants');

const FOLDERS = ['drafts', 'published', 'applied', 'ignored'];

function ensureVault() {
  if (!fs.existsSync(VAULT_ROOT)) fs.mkdirSync(VAULT_ROOT, { recursive: true });
  for (const f of FOLDERS) {
    const dir = path.join(VAULT_ROOT, f);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
  return VAULT_ROOT;
}

function slugify(s) {
  return String(s || 'untitled')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

function fileNameFor(grant) {
  const date = (grant.extracted_at || new Date().toISOString()).slice(0, 10);
  const funder = slugify(grant.organizatie || grant.tara || 'unknown');
  const title = slugify(grant.nume_program || 'grant');
  return `${date}_${funder}_${title}.md`;
}

function fmtAmount(min, max) {
  if (!min && !max) return 'De verificat';
  if (min && max && min !== max) return `€${min.toLocaleString()} – €${max.toLocaleString()}`;
  return `€${(max || min).toLocaleString()}`;
}

function frontmatterToYaml(obj) {
  const lines = ['---'];
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined || v === '') continue;
    if (Array.isArray(v)) {
      lines.push(`${k}:`);
      v.forEach(item => lines.push(`  - ${item}`));
    } else if (typeof v === 'string' && (v.includes(':') || v.includes('\n'))) {
      lines.push(`${k}: |`);
      v.split('\n').forEach(ln => lines.push(`  ${ln}`));
    } else {
      lines.push(`${k}: ${v}`);
    }
  }
  lines.push('---');
  return lines.join('\n');
}

/**
 * Write a grant to Obsidian as markdown with YAML frontmatter.
 * Returns the relative path inside the vault.
 */
function writeGrantNote(grant, opts = {}) {
  ensureVault();
  const folder = opts.folder || 'drafts';
  const name = fileNameFor(grant);
  const relPath = path.join(folder, name);
  const fullPath = path.join(VAULT_ROOT, relPath);

  const fm = {
    id:               grant.id || grant.fingerprint?.slice(0, 12),
    fingerprint:      grant.fingerprint,
    nume_program:     grant.nume_program,
    organizatie:      grant.organizatie,
    tara:             grant.tara,
    tip:              grant.tip,
    dilutiv:          grant.dilutiv,
    suma_min:         grant.suma_min,
    suma_max:         grant.suma_max,
    stadiu:           grant.stadiu,
    sector:           grant.sector,
    deadline:         grant.deadline,
    dificultate:      grant.dificultate,
    website:          grant.website,
    relevance_score:  grant.relevance_score,
    status:           grant.status || 'pending',
    source_type:      grant.source_type,
    source_subject:   grant.source_subject,
    extracted_at:     grant.extracted_at,
    tags: [
      'grant',
      grant.tara ? `country/${slugify(grant.tara)}` : null,
      grant.tip ? `type/${slugify(grant.tip)}` : null,
      grant.dilutiv ? 'dilutive' : 'non-dilutive',
    ].filter(Boolean),
  };

  const score = grant.relevance_score || 0;
  const scoreEmoji = score >= 85 ? '🔥' : score >= 70 ? '🟢' : score >= 50 ? '🟡' : '⚪';

  const body = [
    frontmatterToYaml(fm),
    '',
    `# ${grant.nume_program || 'Untitled Grant'}`,
    '',
    `> ${scoreEmoji} **Relevance: ${score}/100** · Status: \`${grant.status || 'pending'}\``,
    '',
    '## Detalii',
    '',
    `- **Organizație:** ${grant.organizatie || 'De verificat'}`,
    `- **Țară:** ${grant.tara || 'De verificat'}`,
    `- **Tip:** ${grant.tip || 'De verificat'}`,
    `- **Sumă:** ${fmtAmount(grant.suma_min, grant.suma_max)}`,
    `- **Stadiu eligibil:** ${grant.stadiu || 'De verificat'}`,
    `- **Sector:** ${grant.sector || 'De verificat'}`,
    `- **Deadline:** ${grant.deadline || 'De verificat'}`,
    `- **Dilutiv:** ${grant.dilutiv ? 'Da (cedezi % din firmă)' : 'Nu (grant)'}`,
    `- **Dificultate:** ${grant.dificultate || '?'}/3`,
    grant.website ? `- **Website:** [link](${grant.website})` : null,
    '',
    '## Cerințe',
    '',
    grant.cerinte || '_De verificat pe site-ul finanțatorului._',
    '',
    '## Descriere',
    '',
    grant.descriere || '_De verificat pe site-ul finanțatorului._',
    '',
    grant.source_subject ? '## Sursă' : null,
    grant.source_subject ? '' : null,
    grant.source_subject ? `- **Email:** ${grant.source_subject}` : null,
    grant.source_url ? `- **URL:** ${grant.source_url}` : null,
    grant.source_snippet ? '\n```\n' + grant.source_snippet.slice(0, 500) + '\n```' : null,
    '',
    '## Acțiuni',
    '',
    '- [ ] Verifică pe site-ul oficial',
    '- [ ] Confirmă deadline',
    '- [ ] Decide: Aplic / Ignor',
    '- [ ] Adaugă în pipeline dacă aplici',
    '',
    '---',
    `*Generated by eligibil.eu @ ${new Date().toISOString()}*`,
  ].filter(l => l !== null).join('\n');

  fs.writeFileSync(fullPath, body, 'utf8');
  return relPath;
}

/**
 * Move a note between folders (draft → published, etc.)
 */
function moveNote(relPath, toFolder) {
  ensureVault();
  const fileName = path.basename(relPath);
  const src = path.join(VAULT_ROOT, relPath);
  const dst = path.join(VAULT_ROOT, toFolder, fileName);
  if (!fs.existsSync(src)) return null;
  fs.renameSync(src, dst);
  return path.join(toFolder, fileName);
}

/**
 * Parse YAML frontmatter from an .md file
 */
function parseNote(relPath) {
  const fullPath = path.join(VAULT_ROOT, relPath);
  if (!fs.existsSync(fullPath)) return null;
  const raw = fs.readFileSync(fullPath, 'utf8');
  const m = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const fm = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].replace(/^["']|["']$/g, '');
  }
  return fm;
}

/**
 * Write/update the _index.md dashboard
 */
function writeIndex(stats) {
  ensureVault();
  const lines = [
    '---',
    'tags: [dashboard]',
    `updated: ${new Date().toISOString()}`,
    '---',
    '',
    '# eligibil.eu — Grants Dashboard',
    '',
    `> Last updated: ${new Date().toLocaleString('ro-RO')}`,
    '',
    '## Stats',
    '',
    `- 📥 **Drafts** (în review): ${stats.drafts || 0}`,
    `- ✅ **Published** (live în Supabase): ${stats.published || 0}`,
    `- 📤 **Applied**: ${stats.applied || 0}`,
    `- ❌ **Ignored**: ${stats.ignored || 0}`,
    '',
    '## Quick links',
    '',
    '- [[drafts]] — granturi noi de revizuit',
    '- [[published]] — granturi active în catalog',
    '- [[applied]] — aplicații în curs',
    '',
    '## Procesare',
    '',
    'Rulează din terminal:',
    '```bash',
    'npm run grants:process    # citește emails noi',
    'npm run grants:sync       # sync Supabase ↔ Obsidian',
    '```',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(VAULT_ROOT, '_index.md'), lines, 'utf8');
}

/**
 * Count notes per folder
 */
function getStats() {
  ensureVault();
  const stats = {};
  for (const f of FOLDERS) {
    const dir = path.join(VAULT_ROOT, f);
    stats[f] = fs.existsSync(dir)
      ? fs.readdirSync(dir).filter(x => x.endsWith('.md')).length
      : 0;
  }
  return stats;
}

module.exports = {
  VAULT_ROOT,
  ensureVault,
  writeGrantNote,
  moveNote,
  parseNote,
  writeIndex,
  getStats,
  fileNameFor,
};

// Translate _missing_ro.json via Google Cloud Translation v3.
// Usage: node _translate_missing.js <target>   (en | ru | uk)
const fs = require('fs');
const { execSync } = require('child_process');

const target = process.argv[2] || 'en';
const project = 'sanction-duediligence';

const list = JSON.parse(fs.readFileSync('_missing_ro.json', 'utf8'));
console.error(`Translating ${list.length} strings to ${target}...`);

const token = execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim();

const BATCH = 50;
const out = {};

async function translateBatch(batch) {
  const body = {
    contents: batch,
    sourceLanguageCode: 'ro',
    targetLanguageCode: target,
    mimeType: 'text/plain',
  };
  const res = await fetch(
    `https://translation.googleapis.com/v3/projects/${project}/locations/global:translateText`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-goog-user-project': project,
      },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`HTTP ${res.status}: ${t}`);
  }
  const data = await res.json();
  return data.translations.map(t => t.translatedText);
}

(async () => {
  for (let i = 0; i < list.length; i += BATCH) {
    const batch = list.slice(i, i + BATCH);
    try {
      const translated = await translateBatch(batch);
      for (let j = 0; j < batch.length; j++) {
        out[batch[j]] = translated[j];
      }
      console.error(`  ${i + batch.length}/${list.length}`);
    } catch (e) {
      console.error(`  batch ${i} failed: ${e.message}`);
    }
  }
  const outfile = `_translations_${target}.json`;
  fs.writeFileSync(outfile, JSON.stringify(out, null, 2));
  console.error(`Wrote ${outfile} (${Object.keys(out).length} pairs)`);
})();

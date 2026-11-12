#!/usr/bin/env node
/**
 * Download one Sketchfab model we are allowed to copy, and print its credit.
 *
 *   node tools/data/fetch-sketchfab.mjs <uid> <out.glb>
 *
 * Only CC0 and CC BY models are fetched; anything else (including models
 * offered for download under NC or ND terms) is refused, because the map and
 * the website serve the file itself, not an embed. The token comes from
 * SKETCHFAB_API_TOKEN in the environment or in .env.tools.local (git-ignored)
 * and is never printed.
 *
 * The file is written as Sketchfab exports it, unmodified. Add the printed
 * credit to LICENCES.md, and wherever the model is shown.
 */
import { Buffer } from 'node:buffer';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const ALLOWED = new Set(['cc0', 'by']);

function token() {
  if (process.env.SKETCHFAB_API_TOKEN) return process.env.SKETCHFAB_API_TOKEN.trim();
  try {
    const line = readFileSync(resolve(ROOT, '.env.tools.local'), 'utf8')
      .split('\n')
      .find((l) => l.startsWith('SKETCHFAB_API_TOKEN='));
    if (line) return line.slice('SKETCHFAB_API_TOKEN='.length).trim();
  } catch {
    // No local env file: fall through to the error below.
  }
  throw new Error('SKETCHFAB_API_TOKEN is not set (environment or .env.tools.local).');
}

async function api(path, auth) {
  const res = await fetch(`https://api.sketchfab.com/v3/${path}`, {
    headers: { Authorization: `Token ${auth}`, 'User-Agent': 'saksi-tools' },
  });
  if (!res.ok) throw new Error(`Sketchfab ${path}: HTTP ${res.status}`);
  return res.json();
}

const [uid, out] = process.argv.slice(2);
if (!/^[0-9a-f]{32}$/.test(uid ?? '') || !out?.endsWith('.glb')) {
  console.error('Usage: node tools/data/fetch-sketchfab.mjs <32-hex uid> <out.glb>');
  process.exit(2);
}

const auth = token();
const model = await api(`models/${uid}`, auth);
const slug = model.license?.slug;
if (!model.isDownloadable || !ALLOWED.has(slug)) {
  console.error(`Refused: "${model.name}" is ${model.isDownloadable ? `licensed ${model.license?.label ?? 'without a licence'}` : 'not offered for download'}. Only CC0 and CC BY may be copied.`);
  process.exit(1);
}

const links = await api(`models/${uid}/download`, auth);
if (!links.glb?.url) throw new Error('No glb download offered for this model.');
const res = await fetch(links.glb.url);
if (!res.ok) throw new Error(`Download: HTTP ${res.status}`);
const bytes = Buffer.from(await res.arrayBuffer());
if (bytes.subarray(0, 4).toString('latin1') !== 'glTF') throw new Error('The download is not a binary glTF.');
writeFileSync(resolve(out), bytes);

const author = model.user?.displayName || model.user?.username;
console.log(`Wrote ${out} (${(bytes.length / 1e6).toFixed(1)} MB, ${model.faceCount} faces).`);
console.log('Credit for LICENCES.md:');
console.log(`- "${model.name}" by ${author} (${model.viewerUrl}), ${model.license.label}, unmodified, at \`${out}\`.`);

#!/usr/bin/env node
/**
 * Automatické generování obrázků přes OpenAI-kompatibilní API.
 *
 * Čte build/image-prompts.json (vytvoří `gen-image-prompts.mjs`), pro každý
 * chybějící obrázek zavolá /images/generations a výsledek uloží PŘÍMO na
 * cílovou cestu v build/assets/. Web ho po dalším buildu zobrazí automaticky
 * — nic se nikam ručně neukládá.
 *
 * Konfigurace (env):
 *   IMAGE_API_KEY   – API klíč (fallback: OPENAI_API_KEY)
 *   IMAGE_API_BASE  – základ API (výchozí https://api.openai.com/v1);
 *                     funguje s KAŽDÝM OpenAI-kompatibilním endpointem
 *   IMAGE_MODEL     – model (výchozí gpt-image-1)
 *   IMAGE_QUALITY   – low | medium | high (výchozí medium — hlídá náklady)
 *
 * Použití:
 *   node build/generate-images.mjs --layer=banners --limit=10
 *   node build/generate-images.mjs --layer=all --limit=40 --quality=high
 *   node build/generate-images.mjs --dry-run          (jen vypíše plán)
 *   node build/generate-images.mjs --force            (přegeneruje i existující)
 *
 * Vrstvy (--layer), v prioritním pořadí = výchozí pořadí zpracování:
 *   og, banners, technologies, procedures, skin-types, age-groups,
 *   face-yoga, products, ingredients, problems, articles, anatomy, all
 *
 * Bez závislostí (Node 22 fetch). Ikony (.svg) API neumí — přeskakují se.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS = join(__dirname, 'assets');

/* ---- konfigurace ---- */
const API_KEY = process.env.IMAGE_API_KEY || process.env.OPENAI_API_KEY || '';
const API_BASE = (process.env.IMAGE_API_BASE || 'https://api.openai.com/v1').replace(/\/$/, '');
const MODEL = process.env.IMAGE_MODEL || 'gpt-image-1';

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] ?? true] : [a, true];
}));
const QUALITY = args.quality || process.env.IMAGE_QUALITY || 'medium';
const LIMIT = args.limit ? +args.limit : 10; // výchozí opatrný strop na jeden běh
const DRY = !!args['dry-run'];
const FORCE = !!args.force;
const LAYER = args.layer || 'all';

/* ---- vrstvy: klíč → skupina v image-prompts.json (pořadí = priorita) ---- */
const LAYERS = [
  ['og', 'Výchozí sdílecí náhled'],
  ['banners', 'Sekční bannery'],
  ['technologies', 'Technologie'],
  ['procedures', 'Procedury'],
  ['skin-types', 'Typy pleti (hero)'],
  ['age-groups', 'Věkové skupiny (hero)'],
  ['face-yoga', 'Face yoga (série)'],
  ['products', 'Produkty (AI fallback)'],
  ['ingredients', 'Ingredience'],
  ['problems', 'Problémy (banner)'],
  ['articles', 'Články (hero)'],
  ['anatomy', 'Anatomie svalů'],
];
const layerKeys = LAYERS.map(([k]) => k);
if (LAYER !== 'all' && !layerKeys.includes(LAYER)) {
  console.error(`Neznámá vrstva "${LAYER}". Možnosti: all, ${layerKeys.join(', ')}`);
  process.exit(1);
}

/* ---- rozměr podle skupiny (gpt-image-1: 1024x1024 | 1536x1024 | 1024x1536) ---- */
const SIZE = {
  'Výchozí sdílecí náhled': '1536x1024',
  'Sekční bannery': '1536x1024',
  'Technologie': '1536x1024',
  'Procedury': '1536x1024',
  'Problémy (banner)': '1536x1024',
  'Články (hero)': '1536x1024',
  'Typy pleti (hero)': '1024x1024',
  'Věkové skupiny (hero)': '1024x1024',
  'Face yoga (série)': '1024x1024',
  'Produkty (AI fallback)': '1024x1024',
  'Ingredience': '1024x1024',
  'Anatomie svalů': '1024x1024',
};
const FMT = { '.jpg': 'jpeg', '.jpeg': 'jpeg', '.png': 'png', '.webp': 'webp' };

/* ---- načtení plánu ---- */
const promptsPath = join(__dirname, 'image-prompts.json');
if (!existsSync(promptsPath)) {
  console.error('Chybí build/image-prompts.json — nejdřív spusť: node build/gen-image-prompts.mjs');
  process.exit(1);
}
const map = JSON.parse(readFileSync(promptsPath, 'utf8'));
const wantGroups = LAYER === 'all' ? LAYERS.map(([, g]) => g) : [LAYERS.find(([k]) => k === LAYER)[1]];

let queue = [];
for (const g of wantGroups) {
  for (const [path, v] of Object.entries(map)) {
    if (v.group !== g) continue;
    const ext = extname(path).toLowerCase();
    if (ext === '.svg') continue; // ikony API neumí — řeší se zvlášť
    const exists = existsSync(join(ASSETS, path));
    if (exists && !FORCE) continue;
    queue.push({ path, ext, group: g, title: v.title, prompt: v.prompt });
  }
}
const totalMissing = queue.length;
queue = queue.slice(0, LIMIT);

console.log(`Model: ${MODEL} @ ${API_BASE} · kvalita: ${QUALITY}`);
console.log(`Vrstva: ${LAYER} · chybí ${totalMissing}, v tomto běhu: ${queue.length} (limit ${LIMIT})`);
if (!queue.length) { console.log('Nic ke generování — hotovo.'); process.exit(0); }
if (DRY) { queue.forEach((q, i) => console.log(`  ${i + 1}. ${q.path}  [${SIZE[q.group]}, ${FMT[q.ext]}]  — ${q.title}`)); process.exit(0); }
if (!API_KEY) { console.error('Chybí IMAGE_API_KEY (nebo OPENAI_API_KEY).'); process.exit(1); }

/* ---- volání API s retry ---- */
async function generate(item) {
  const body = { model: MODEL, prompt: item.prompt, n: 1, size: SIZE[item.group] || '1024x1024' };
  // gpt-image-* podporuje quality/output_format; jiné kompatibilní API je ignorují nebo odmítnou → pošleme jen u gpt-image
  if (/gpt-image/.test(MODEL)) { body.quality = QUALITY; body.output_format = FMT[item.ext] || 'webp'; }
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(`${API_BASE}/images/generations`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${API_KEY}` },
        body: JSON.stringify(body),
      });
      if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
      if (!res.ok) { console.error(`  ✗ ${item.path}: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`); return false; }
      const data = await res.json();
      const d = data.data && data.data[0];
      let buf;
      if (d && d.b64_json) buf = Buffer.from(d.b64_json, 'base64');
      else if (d && d.url) buf = Buffer.from(await (await fetch(d.url)).arrayBuffer());
      else { console.error(`  ✗ ${item.path}: neočekávaná odpověď API`); return false; }
      const out = join(ASSETS, item.path);
      mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, buf);
      console.log(`  ✓ ${item.path} (${(buf.length / 1024).toFixed(0)} kB)`);
      return true;
    } catch (err) {
      const wait = 2000 * 2 ** (attempt - 1);
      if (attempt === 4) { console.error(`  ✗ ${item.path}: ${err.message}`); return false; }
      console.log(`  … retry ${attempt}/3 za ${wait / 1000}s (${err.message.slice(0, 80)})`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  return false;
}

let ok = 0, fail = 0;
for (const [i, item] of queue.entries()) {
  console.log(`[${i + 1}/${queue.length}] ${item.title}`);
  (await generate(item)) ? ok++ : fail++;
  await new Promise((r) => setTimeout(r, 500)); // šetrné tempo
}
console.log(`\nHotovo: ${ok} vygenerováno, ${fail} selhalo, zbývá ~${totalMissing - ok}.`);
if (ok) console.log('Spusť `node build/build.mjs` — web obrázky zobrazí automaticky.');
process.exit(fail && !ok ? 1 : 0);

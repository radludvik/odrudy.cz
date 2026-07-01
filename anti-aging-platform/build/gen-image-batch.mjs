#!/usr/bin/env node
/**
 * Vytvoří dávkový export IMAGE-BATCH-01.md — prvních 40 nejdůležitějších
 * obrázků z prioritního pořadí, každý s promptem, cílovou cestou, formátem,
 * poměrem stran a názvem souboru. Určeno pro ruční generování v GPT Image / Flux.
 * Spouštět po gen-image-prompts.mjs.  node build/gen-image-batch.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ASSETS = join(__dirname, 'assets');
const map = JSON.parse(readFileSync(join(__dirname, 'image-prompts.json'), 'utf8'));
const get = (g) => Object.entries(map).filter(([, v]) => v.group === g).map(([path, v]) => ({ path, ...v }));

// doporučený formát + poměr + rozměr pro každou vrstvu
const LAYERS = [
  { title: '1) Výchozí sdílecí náhled (og:image)', group: 'Výchozí sdílecí náhled', format: 'JPG', ratio: '1,91:1', size: '1200 × 630 px', note: 'Sdílecí náhled na sítě; nech střed volný pro logo/titulek.' },
  { title: '2) Homepage / sekční bannery', group: 'Sekční bannery', format: 'WEBP', ratio: '4:1 (široký banner)', size: '1600 × 400 px', note: 'Široký hero pruh sekce; volný prostor po jedné straně pro titulek. Homepage hero může použít nejreprezentativnější z nich.' },
  { title: '3) Technologie', group: 'Technologie', format: 'WEBP', ratio: '4:3', size: '1600 × 1200 px', note: 'Zařízení jasně, čistá klinická estetika, bez osoby. Použije se v detail hero i na kartě.' },
  { title: '4) Procedury', group: 'Procedury', format: 'WEBP', ratio: '4:3', size: '1600 × 1200 px', note: 'Světlá klinika, ruce + zařízení, nedramatické.' },
];
const LIMIT = 40;

let md = `# AntiAgeLab — dávka obrázků 01 (prvních ${LIMIT})\n\n`;
md += `Praktický workflow: procházej položky shora, generuj v GPT Image / Flux podle **promptu**, ukládej **přesně na cílovou cestu** (soubor už tam patří — generátor webu ho pak automaticky zobrazí). Styl viz [VISUAL-STYLE.md](VISUAL-STYLE.md).\n\n`;
md += `> Poměr/rozměr je doporučení; web obrázky ořízne (object-fit: cover), takže drobná odchylka nevadí. Formát WEBP kvůli velikosti; JPG jen u og-default kvůli kompatibilitě sítí.\n\n`;

const dirs = new Set();
let n = 0;
for (const L of LAYERS) {
  if (n >= LIMIT) break;
  const arr = get(L.group);
  if (!arr.length) continue;
  md += `\n## ${L.title} — ${Math.min(arr.length, LIMIT - n)} ks\n\n`;
  md += `**Formát:** ${L.format} · **Poměr stran:** ${L.ratio} · **Rozměr:** ${L.size}\n\n_${L.note}_\n\n`;
  for (const e of arr) {
    if (n >= LIMIT) break;
    n++;
    dirs.add(join(ASSETS, dirname(e.path)));
    md += `### ${n}. ${e.title}\n\n`;
    md += `- **Cílová cesta:** \`build/assets/${e.path}\`\n`;
    md += `- **Název souboru:** \`${basename(e.path)}\`\n`;
    md += `- **Formát:** ${L.format} · **Poměr:** ${L.ratio} · **Rozměr:** ${L.size}\n`;
    if (e.note) md += `- **Pozn.:** ${e.note}\n`;
    md += `\n**Prompt:**\n\n\`\`\`\n${e.prompt}\n\`\`\`\n\n`;
  }
}
md += `\n---\n\nHotovo: ${n} položek. Po uložení obrázků spusť \`node build/build.mjs\`. Další dávka: uprav \`LIMIT\`/vrstvy v \`build/gen-image-batch.mjs\`.\n`;

// vytvoř složky
for (const d of dirs) mkdirSync(d, { recursive: true });
writeFileSync(join(ROOT, 'IMAGE-BATCH-01.md'), md);
console.log(`IMAGE-BATCH-01.md: ${n} položek, složky ověřeny (${dirs.size}).`);

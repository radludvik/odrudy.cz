#!/usr/bin/env node
/**
 * Sestaví prioritní pořadí generování obrázků (IMAGE-PRIORITY.md) z
 * build/image-prompts.json. Pořadí dle produktového zadání:
 *   og-default → sekční bannery → technologie → procedury → typy pleti →
 *   věkové skupiny → face yoga → produkty → (zbytek).
 * Spouštět po `gen-image-prompts.mjs`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const map = JSON.parse(readFileSync(join(__dirname, 'image-prompts.json'), 'utf8'));
const entries = Object.entries(map).map(([path, v]) => ({ path, ...v }));

// prioritní vrstvy: [titulek, filtr]
const LAYERS = [
  ['1) Výchozí sdílecí náhled (og:image)', (e) => e.group === 'Výchozí sdílecí náhled'],
  ['2) Homepage / sekční bannery', (e) => e.group === 'Sekční bannery'],
  ['3) Technologie', (e) => e.group === 'Technologie'],
  ['4) Procedury', (e) => e.group === 'Procedury'],
  ['5) Typy pleti', (e) => e.group === 'Typy pleti (hero)'],
  ['6) Věkové skupiny', (e) => e.group === 'Věkové skupiny (hero)'],
  ['7) Face yoga', (e) => e.group === 'Face yoga (série)'],
  ['8) Produkty', (e) => e.group === 'Produkty (AI fallback)'],
];
const used = new Set();
let md = `# AntiAgeLab — prioritní pořadí generování obrázků\n\n`;
md += `Doporučené pořadí, v jakém dodat vizuály (největší vizuální dopad / nejrychlejší „oživení" webu jako první). Prompty ke každé položce jsou v [IMAGE-PROMPTS.md](IMAGE-PROMPTS.md); styl v [VISUAL-STYLE.md](VISUAL-STYLE.md). Hotové soubory vkládej do \`build/assets/<path>\`.\n\n`;
const total = entries.length;
const doneAll = entries.filter((e) => e.exists).length;
md += `**Celkem:** ${total} položek · hotovo ${doneAll} · zbývá ${total - doneAll}.\n`;

let order = 1;
for (const [title, filt] of LAYERS) {
  const arr = entries.filter((e) => filt(e) && !used.has(e.path));
  arr.forEach((e) => used.add(e.path));
  if (!arr.length) continue;
  const done = arr.filter((e) => e.exists).length;
  md += `\n## ${title} — ${arr.length} ks (${done} hotovo)\n\n`;
  md += `| # | soubor | co |\n|--:|---|---|\n`;
  arr.forEach((e, i) => { md += `| ${i + 1} | \`${e.path}\`${e.exists ? ' ✅' : ''} | ${e.title} |\n`; });
}
// zbytek (ingredience, problémy-bannery, články-hero, ikony, anatomie)
const rest = entries.filter((e) => !used.has(e.path));
if (rest.length) {
  const byGroup = {};
  for (const e of rest) (byGroup[e.group] ||= []).push(e);
  md += `\n## 9) Zbývající vrstvy (dle kapacity)\n\n`;
  for (const [g, arr] of Object.entries(byGroup)) md += `- **${g}** — ${arr.length} ks (${arr.filter((e) => e.exists).length} hotovo)\n`;
}
md += `\n---\n\n**Workflow:** vyber vrstvu → vygeneruj obrázky podle promptů z IMAGE-PROMPTS.md v externím nástroji → ulož do \`build/assets/img/...\` → \`node build/build.mjs\`. Web je automaticky zobrazí; co chybí, drží elegantní placeholder.\n`;
writeFileSync(join(ROOT, 'IMAGE-PRIORITY.md'), md);
console.log(`IMAGE-PRIORITY.md hotovo (${total} položek).`);

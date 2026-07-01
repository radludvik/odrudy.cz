#!/usr/bin/env node
/**
 * Generátor promptů pro vizuální obsah AntiAgeLab.
 *
 * Čte data/*.json a pro každou entitu, banner, ikonu, face-yoga cvik a
 * anatomickou ilustraci vytvoří deterministický prompt pro externí generátor
 * obrázků (GPT Image / Flux / apod.) tak, aby byl zachován JEDNOTNÝ vizuální
 * styl (viz VISUAL-STYLE.md).
 *
 * Výstup:
 *   build/image-prompts.json   — strojově čitelné (path → prompt) pro automatizaci
 *   IMAGE-PROMPTS.md           — přehled pro člověka
 *
 * Idempotentní: spusť kdykoli po přidání nové položky, prompty se přegenerují.
 * Spouštět:  node build/gen-image-prompts.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA = join(ROOT, 'data');
const ASSETS = join(__dirname, 'assets');
const load = (f) => { const p = join(DATA, f + '.json'); return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : []; };

/* --- Jednotný styl: sdílená kotva do každého promptu (konzistence, bod 13) --- */
const STYLE = 'Premium minimalist anti-aging platform aesthetic. Soft diffused natural light, light neutral palette (warm porcelain #FBFAF7, ivory #F3EEE6, sand #E8DFD2, muted copper-gold #B08D57 accents). Clean, medically credible, editorial, uncluttered. Photorealistic. Shallow depth of field. No text, no logos, no watermarks, no visible brand names, no kitschy beauty-ad styling.';
const NEG = 'Negative: text, watermark, logo, brand name, oversaturated colors, harsh flash, plastic skin, heavy retouching, cluttered background, stock-photo look, collage, borders, frames.';
// Zamčené atributy pro série s modelkami (aby to působilo jako jedna série)
const MODEL_LOCK = 'Same recurring female model across the whole series: mid-length natural brown hair, bare clean skin, no makeup or minimal natural makeup, calm neutral expression, plain warm-ivory seamless studio background, identical soft frontal key light, shot on 85mm lens, head-and-shoulders framing.';
const FY_LOCK = 'Consistent face-yoga illustration series: SAME female model, SAME plain ivory background, SAME soft frontal lighting, SAME 85mm frontal head-and-shoulders camera angle, SAME neutral top. Only the hand position, facial expression and the highlighted muscle change between images. Subtle copper-gold directional arrows indicating the movement; the engaged muscle gently highlighted in translucent copper-gold.';

const A = (type) => `${type} ${STYLE} ${NEG}`;

const jobs = []; // { path, group, title, prompt, note? }
const add = (path, group, title, prompt, note) => jobs.push({ path, group, title, prompt, note });
const asset = (p) => existsSync(join(ASSETS, p));

/* 0. Výchozí sdílecí náhled (og:image) */
add('img/og-default.jpg', 'Výchozí sdílecí náhled', 'og-default (1200×630)',
  A('Website social-share cover image (1200x630) for a premium Czech anti-aging knowledge platform: elegant abstract composition of soft serum textures and light molecular bokeh on a warm porcelain background, generous empty space in the center for a logo/headline overlay.'));

/* 1. Produkty — AI fallback (oficiální fotky se řeší ručně, viz sourcing report) */
for (const p of load('products')) {
  const cat = p.category || p.type || 'skincare product';
  add(`img/products/${p.slug}.webp`, 'Produkty (AI fallback)', p.name,
    A(`Studio product photograph of a generic, unbranded ${cat} (${p.form || 'serum/cream'}) representing the category, standing on a warm ivory surface with a soft shadow.`),
    'Přednostně nahradit OFICIÁLNÍ fotkou výrobce (viz OFFICIAL-PHOTO-SOURCING.md).');
}
/* 2. Technologie */
for (const t of load('technologies')) {
  add(`img/technologies/${t.slug}.webp`, 'Technologie', t.name,
    A(`Editorial photograph of a modern at-home ${t.name} skincare device on an ivory surface, clean clinical aesthetic, device shown clearly, no person.`));
}
/* 3. Procedury */
for (const pr of load('procedures')) {
  add(`img/procedures/${pr.slug}.webp`, 'Procedury', pr.name,
    A(`Calm clinical scene representing the aesthetic procedure "${pr.name}": modern bright dermatology clinic, professional performing a facial treatment, tasteful and non-graphic, focus on hands and device, patient relaxed.`));
}
/* 4. Ingredience — textury, kapky, pipety, molekulární ilustrace (žádné vzorce) */
for (const i of load('ingredients')) {
  add(`img/ingredients/${i.slug}.webp`, 'Ingredience', i.name,
    A(`Macro cosmetic still-life evoking the skincare ingredient "${i.name}": glossy serum texture, droplets and a laboratory glass pipette on an ivory surface, pharmaceutical/dermatological look, abstract molecular light bokeh. Do NOT render chemical formulas.`));
}
/* 5. Typy pleti — hero, stejná série modelek */
for (const s of load('skin-types')) {
  add(`img/skin-types/${s.slug}.webp`, 'Typy pleti (hero)', s.name,
    A(`Close-up beauty portrait representing ${s.name} skin. ${MODEL_LOCK} Skin shown honestly and naturally for this skin type.`));
}
/* 6. Věkové skupiny — jedna série, bez přehnané retuše */
for (const a of load('age-groups')) {
  add(`img/age-groups/${a.slug}.webp`, 'Věkové skupiny (hero)', a.name,
    A(`Natural, dignified beauty portrait of a woman representing the ${a.name} age group. ${MODEL_LOCK.replace('Same recurring female model', 'Consistent series of women, same styling and lighting')} Age-appropriate, natural skin with visible real texture, NOT heavily retouched.`));
}
/* 7. Řešené problémy — bannery s decentním zvýrazněním oblasti */
for (const p of load('problems')) {
  add(`img/problems/${p.slug}.webp`, 'Problémy (banner)', p.name,
    A(`Wide editorial banner subtly highlighting the facial concern "${p.name}". ${MODEL_LOCK} The relevant facial area gently emphasized with soft focus and a delicate copper-gold indicator; respectful, non-clinical, aspirational-but-honest. Banner composition with negative space on one side for overlay text.`));
}
/* 8. Face yoga — jednotná série ilustrací */
for (const f of load('face-yoga')) {
  const area = f.area || f.zone || 'face';
  const muscle = f.muscle || f.targetMuscle || 'facial muscles';
  add(`img/face-yoga/${f.slug}.webp`, 'Face yoga (série)', f.name,
    `Face-yoga exercise "${f.name}" targeting the ${area} (${muscle}). ${FY_LOCK} ${STYLE} ${NEG}`);
}
/* 9. Sekční hero bannery */
const SECTIONS = [
  ['ingredients', 'Ingredience', 'macro serum textures, droplets, glass pipettes, molecular bokeh'],
  ['technologies', 'Technologie', 'modern at-home skincare devices arranged minimally'],
  ['products', 'Produkty', 'row of unbranded premium skincare bottles and jars'],
  ['procedures', 'Procedury', 'bright modern dermatology clinic interior detail'],
  ['supplements', 'Doplňky stravy', 'unbranded supplement capsules and a glass of water, clean nutrition still-life'],
  ['face-yoga', 'Obličejová jóga', 'serene woman touching her face, wellness studio light'],
  ['articles', 'Průvodci / Magazín', 'open editorial layout feel, calm desk with skincare and soft light'],
  ['skola', 'Anti-aging škola', 'abstract science-meets-beauty still life, light and molecular bokeh'],
  ['routines', 'Rutiny', 'morning and evening skincare flat-lay on ivory'],
  ['comparisons', 'Porovnání produktů', 'two unbranded skincare products side by side, balanced composition'],
];
for (const [slug, label, desc] of SECTIONS) {
  add(`img/banners/${slug}.webp`, 'Sekční bannery', label,
    A(`Wide website hero banner (approx 1600x400) for the "${label}" section: ${desc}. Generous negative space for an overlaid headline, unified with the whole site's look.`));
}
/* 10. Články — unikátní hero fotka pro každý */
for (const ar of load('articles')) {
  add(`img/articles/${ar.slug}.webp`, 'Články (hero)', ar.name,
    A(`Unique editorial hero image (16:9) for the guide "${ar.name}". Concept: ${ar.excerpt || ar.metaDescription || ar.name}. Photorealistic, on-topic, calm and premium, no text.`));
}
/* 11. Ikony — jednotná sada (SVG, line style) */
const ICONS = ['ingredience', 'produkty', 'technologie', 'studie', 'rutiny', 'bezpecnost', 'typ-pleti', 'vek', 'ucinnost', 'kontraindikace', 'kompatibilita', 'dukazy'];
for (const ic of ICONS) {
  add(`img/icons/${ic}.svg`, 'Ikony (jednotná sada)', ic,
    `Minimal single-color line icon representing "${ic}" (skincare/dermatology context). 24x24 viewBox, 1.5px stroke, rounded caps, no fill, color #8A6D3F, consistent geometric style across the whole icon set, transparent background. Deliver as clean SVG.`);
}
/* 12. Anatomické ilustrace obličejových svalů */
const MUSCLES = ['frontalis', 'orbicularis-oculi', 'corrugator-supercilii', 'zygomaticus', 'orbicularis-oris', 'buccinator', 'masseter', 'platysma', 'levator-labii', 'depressor-anguli-oris'];
for (const m of MUSCLES) {
  add(`img/anatomy/${m}.webp`, 'Anatomie svalů', m,
    A(`Clean medical-illustration of the human facial muscle "${m.replace(/-/g, ' ')}" shown in isolation on a light anatomical head, soft copper-gold highlight on the target muscle, textbook dermatology style, consistent across the series.`));
}

/* --- Zápis výstupů --- */
const done = jobs.filter((j) => asset(j.path));
const todo = jobs.filter((j) => !asset(j.path));

const map = {};
for (const j of jobs) map[j.path] = { group: j.group, title: j.title, prompt: j.prompt, note: j.note || null, exists: asset(j.path) };
writeFileSync(join(__dirname, 'image-prompts.json'), JSON.stringify(map, null, 2) + '\n');

// Přehled pro člověka, seskupený
const byGroup = {};
for (const j of jobs) (byGroup[j.group] ||= []).push(j);
let md = `# AntiAgeLab — prompty pro vizuální obsah\n\n> Generováno \`build/gen-image-prompts.mjs\` z databáze. **Neupravovat ručně** — přegeneruje se.\n> Styl viz [VISUAL-STYLE.md](VISUAL-STYLE.md). Hotové obrázky vkládej do \`build/assets/<path>\`; generátor webu je pak automaticky zobrazí.\n\n**Stav:** ${done.length} hotovo · ${todo.length} zbývá · ${jobs.length} celkem.\n\n`;
for (const [group, arr] of Object.entries(byGroup)) {
  md += `\n## ${group} (${arr.filter((j) => asset(j.path)).length}/${arr.length})\n\n`;
  for (const j of arr) {
    md += `### ${j.title}\n\`${j.path}\`${asset(j.path) ? ' ✅' : ''}\n\n`;
    if (j.note) md += `> ${j.note}\n\n`;
    md += '```\n' + j.prompt + '\n```\n\n';
  }
}
writeFileSync(join(ROOT, 'IMAGE-PROMPTS.md'), md);

console.log(`Prompty: ${jobs.length} položek (${done.length} hotovo, ${todo.length} zbývá).`);
console.log('→ build/image-prompts.json');
console.log('→ IMAGE-PROMPTS.md');

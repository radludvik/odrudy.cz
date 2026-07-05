#!/usr/bin/env node
/**
 * Aevia — generátor statické znalostní platformy.
 *
 * Pipeline:  data/*.json  →  znalostní graf (obousměrné vztahy)  →  site/*.html
 *
 * Bez závislostí. Spouštět: `node build/build.mjs`
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, cpSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA = join(ROOT, 'data');
const OUT = join(ROOT, 'site');
const ASSETS_SRC = join(ROOT, 'build', 'assets');

// Base path pro nasazení do podsložky (GitHub Pages project site = "/odrudy.cz").
// Lokálně prázdné → web běží z kořene. Nastaví se přes env BASE_PATH.
const BASE = (process.env.BASE_PATH || '').replace(/\/$/, '');

// Cache-busting: verze podle obsahu CSS+JS. Připojí se k /assets/*.css|js jako ?v=…,
// takže po každé změně stylů/skriptů prohlížeč načte novou verzi (ne starou z cache).
const ASSET_VER = (() => {
  const h = createHash('md5');
  const walk = (d) => { for (const f of (existsSync(d) ? readdirSync(d, { withFileTypes: true }) : [])) { const p = join(d, f.name); if (f.isDirectory()) walk(p); else if (/\.(css|js)$/.test(f.name)) h.update(readFileSync(p)); } };
  walk(ASSETS_SRC);
  return h.digest('hex').slice(0, 8);
})();
const ORIGIN = process.env.SITE_ORIGIN || 'https://aevia.cz';

const SITE = {
  name: 'antiagelab.cz',
  tagline: 'Věda o mladší pleti',
  description: 'Nejkomplexnější česká znalostní databáze o neinvazivním anti-agingu — encyklopedie, magazín a inteligentní doporučovací systém.',
  url: ORIGIN + BASE,
  lang: 'cs',
};

/* ----------------------------------------------------------------------------
 * Konfigurace typů entit: URL základ, popisky, vztahový klíč
 * ------------------------------------------------------------------------- */
const TYPES = {
  ingredient: { base: '/ingredience/',            one: 'Ingredience', many: 'Ingredience',       relKey: 'ingredients',  icon: 'flask' },
  technology: { base: '/technologie/',            one: 'Technologie', many: 'Technologie',       relKey: 'technologies', icon: 'wave'  },
  supplement: { base: '/doplnky-stravy/',         one: 'Doplněk stravy', many: 'Doplňky stravy', relKey: 'supplements',  icon: 'pill'  },
  product:    { base: '/produkty/',               one: 'Produkt',     many: 'Produkty',          relKey: 'products',     icon: 'bottle'},
  procedure:  { base: '/procedury/',              one: 'Procedura',   many: 'Procedury',         relKey: 'procedures',   icon: 'needle'},
  study:      { base: '/studie/',                 one: 'Studie',      many: 'Klinické studie',   relKey: 'studies',      icon: 'doc'   },
  skinType:   { base: '/pece-podle-typu-pleti/',  one: 'Typ pleti',   many: 'Péče podle typu pleti', relKey: 'skinTypes', icon: 'drop' },
  problem:    { base: '/pece-podle-problemu/',     one: 'Problém',     many: 'Péče podle problému', relKey: 'problems',   icon: 'target'},
  ageGroup:   { base: '/pece-podle-veku/',         one: 'Věk',         many: 'Péče podle věku',   relKey: 'ageGroups',    icon: 'clock' },
  routine:    { base: '/rutiny/',                  one: 'Rutina',      many: 'Rutiny',            relKey: 'routines',     icon: 'list'  },
  faceYoga:   { base: '/oblicejova-joga/',         one: 'Cvik obličejové jógy', many: 'Obličejová jóga', relKey: 'faceYoga', icon: 'face' },
  comparison: { base: '/porovnani/',               one: 'Porovnání',   many: 'Porovnání',         relKey: 'comparisons',  icon: 'scale' },
  term:       { base: '/slovnik/',                 one: 'Pojem',       many: 'Slovník pojmů',     relKey: 'terms',        icon: 'book'  },
  article:    { base: '/clanky/',                  one: 'Průvodce',     many: 'Průvodci',           relKey: 'articles',     icon: 'pen'   },
  review:     { base: '/recenze/',                 one: 'Recenze',     many: 'Recenze',           relKey: 'reviews',      icon: 'star'  },
};
const REL_TO_TYPE = Object.fromEntries(Object.entries(TYPES).map(([t, c]) => [c.relKey, t]));

const EVIDENCE = {
  strong:      { label: 'Silné důkazy',    cls: 'ev--strong',      dot: '🟢' },
  moderate:    { label: 'Středně silné',   cls: 'ev--moderate',    dot: '🟡' },
  limited:     { label: 'Omezené důkazy',  cls: 'ev--limited',     dot: '🟠' },
  preliminary: { label: 'Předběžné',       cls: 'ev--preliminary', dot: '⚪' },
};

/* ----------------------------------------------------------------------------
 * Načtení dat + sestavení indexu
 * ------------------------------------------------------------------------- */
function loadAll() {
  const files = readdirSync(DATA).filter((f) => f.endsWith('.json'));
  const entities = [];
  for (const f of files) {
    const arr = JSON.parse(readFileSync(join(DATA, f), 'utf8'));
    for (const e of arr) entities.push(e);
  }
  return entities;
}

const entities = loadAll();
const bySlug = new Map();            // "type:slug" -> entity   (slug není globálně unikátní napříč typy → klíčujeme typem)
const bySlugLoose = new Map();       // slug -> entity (poslední vyhrává; pro relace, kde typ určuje relKey)
for (const e of entities) {
  bySlug.set(`${e.type}:${e.slug}`, e);
  bySlugLoose.set(e.slug, e);
  e._rel = {};                       // rozřešené vztahy: typ -> Set(slug)
}

function resolveTarget(relKey, slug) {
  const type = REL_TO_TYPE[relKey];
  if (!type) return null;
  return bySlug.get(`${type}:${slug}`) || null;
}

/* Obousměrné rozřešení vztahů (knowledge graph edges) */
function addRel(entity, type, slug) {
  if (!entity._rel[type]) entity._rel[type] = new Set();
  entity._rel[type].add(slug);
}
for (const e of entities) {
  const rel = e.relations || {};
  for (const [relKey, slugs] of Object.entries(rel)) {
    const targetType = REL_TO_TYPE[relKey];
    if (!targetType || !Array.isArray(slugs)) continue;
    for (const slug of slugs) {
      const target = resolveTarget(relKey, slug);
      if (!target || target === e) continue;
      addRel(e, targetType, slug);                 // dopředný odkaz
      addRel(target, e.type, e.slug);              // zpětný odkaz
    }
  }
}

/* Metodika AntiAgeLab: celkové skóre = transparentní vážený průměr dílčích kritérií.
   Váhy jsou veřejné na /metodika-hodnoceni/. Počítá se automaticky při buildu. */
const SCORE_WEIGHTS = {
  product:    { evidence: 0.30, quality: 0.20, potency: 0.15, sensitive: 0.15, value: 0.15, innovation: 0.05 },
  technology: { evidence: 0.30, quality: 0.20, safety: 0.15, ease: 0.10, innovation: 0.10, value: 0.15 },
  supplement: { evidence: 0.30, skinBenefit: 0.25, safety: 0.15, supplementing: 0.15, value: 0.15 },
};
function computeWeightedOverall(e) {
  const w = SCORE_WEIGHTS[e.type]; if (!w || !e.scores) return;
  let sum = 0, wsum = 0, n = 0;
  for (const [k, wt] of Object.entries(w)) { const v = e.scores[k]; if (v && typeof v.score === 'number') { sum += v.score * wt; wsum += wt; n++; } }
  if (n < 2 || !wsum) return;                       // málo dat → ponecháme původní redakční overall
  e.scores.overall = e.scores.overall || {};
  e.scores.overall.score = Math.round((sum / wsum) * 10) / 10;
  e.scores.overall.computed = true;
}
for (const e of entities) computeWeightedOverall(e);

const urlOf = (e) => `${TYPES[e.type].base}${e.slug}/`;
const entitiesByType = (type) => entities.filter((e) => e.type === type);

/* ----------------------------------------------------------------------------
 * HTML helpers
 * ------------------------------------------------------------------------- */
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const attr = (s) => esc(s);
const slugify = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

function evidenceBadge(level) {
  const ev = EVIDENCE[level];
  if (!ev) return '';
  return `<span class="ev ${ev.cls}" title="Úroveň vědecké evidence">${ev.dot} ${esc(ev.label)}</span>`;
}

// Bod 11 — nadpisy jako otázky orientované na uživatele (normalizace při buildu).
const HEADING_MAP = {
  'mechanismus účinku': 'Jak to funguje?',
  'indikace': 'Pro koho je vhodné?',
  'kontraindikace': 'Kdy není vhodné?',
  'pro koho': 'Pro koho je vhodné?',
  'pro koho je vhodný': 'Pro koho je vhodné?',
  'pro koho je vhodná': 'Pro koho je vhodné?',
};
function normalizeHeading(h) {
  if (!h) return h;
  const key = h.trim().toLowerCase();
  if (HEADING_MAP[key]) return HEADING_MAP[key];
  // „Co je …", „Jak …", „Proč …", „Kdy …" bez otazníku → doplň otazník
  if (/^(co je |jak |proč |kdy |kolik |na co )/i.test(h) && !/[?!:]$/.test(h.trim())) return h.trim() + '?';
  return h;
}
function renderBlocks(blocks = []) {
  let html = '';
  for (const b of blocks) {
    if (b.h2) html += `<h2>${esc(normalizeHeading(b.h2))}</h2>`;
    else if (b.h3) html += `<h3>${esc(normalizeHeading(b.h3))}</h3>`;
    else if (b.p) html += `<p>${esc(b.p)}</p>`;
    else if (b.list) html += `<ul class="rich-list">${b.list.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
    else if (b.quote) html += `<blockquote>${esc(b.quote)}</blockquote>`;
    else if (b.note) html += `<div class="callout">${b.evidence ? evidenceBadge(b.evidence) : ''}<p>${esc(b.note)}</p></div>`;
    else if (b.table) {
      const t = b.table;
      html += `<div class="table-wrap"><table><thead><tr>${t.head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${t.rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    }
  }
  return html;
}

function renderFaq(faq = []) {
  if (!faq.length) return '';
  return `<section class="section-block"><h2>Časté otázky</h2><div class="faq">${faq
    .map((q) => `<details class="faq-item"><summary>${esc(q.q)}</summary><div class="faq-a"><p>${esc(q.a)}</p></div></details>`)
    .join('')}</div></section>`;
}

/* ---- Zdroje hodnocení: transparentní agregace důkazní základny ----
   Typy zdrojů seřazené podle kvality důkazů (vyšší rank = silnější důkaz). */
const SRC_META = {
  'meta-analysis':     { rank: 7, forms: ['metaanalýza', 'metaanalýzy', 'metaanalýz'] },
  'systematic-review': { rank: 6, forms: ['systematický přehled', 'systematické přehledy', 'systematických přehledů'] },
  'guideline':         { rank: 5, forms: ['doporučený postup', 'doporučené postupy', 'doporučených postupů'] },
  'consensus':         { rank: 5, forms: ['konsenzus odborné společnosti', 'konsenzy odborných společností', 'konsenzů odborných společností'] },
  'rct':               { rank: 4, forms: ['randomizovaná klinická studie', 'randomizované klinické studie', 'randomizovaných klinických studií'] },
  'prospective':       { rank: 3, forms: ['prospektivní studie', 'prospektivní studie', 'prospektivních studií'] },
  'clinical':          { rank: 2, forms: ['klinická studie', 'klinické studie', 'klinických studií'] },
  'review':            { rank: 2, forms: ['přehledový článek', 'přehledové články', 'přehledových článků'] },
  'regulation':        { rank: 1, forms: ['regulační dokument', 'regulační dokumenty', 'regulačních dokumentů'] },
  'other':             { rank: 0, forms: ['další zdroj', 'další zdroje', 'dalších zdrojů'] },
};
const SRC_ORDER = ['meta-analysis', 'systematic-review', 'guideline', 'consensus', 'rct', 'prospective', 'clinical', 'review', 'regulation', 'other'];
function srcNorm(t) {
  t = String(t || '').toLowerCase();
  if (/meta/.test(t)) return 'meta-analysis';
  if (/syst/.test(t)) return 'systematic-review';
  if (/guideline|doporu/.test(t)) return 'guideline';
  if (/consensus|konsen/.test(t)) return 'consensus';
  if (/rct|randomiz/.test(t)) return 'rct';
  if (/prospekt/.test(t)) return 'prospective';
  if (/regulation|naříz|legis|regula/.test(t)) return 'regulation';
  if (/review|přehled/.test(t)) return 'review';
  if (/clinic|klinic|kohort|cohort/.test(t)) return 'clinical';
  return 'other';
}
function srcPlural(key, n) { const f = SRC_META[key].forms; return n === 1 ? f[0] : (n >= 2 && n <= 4 ? f[1] : f[2]); }
function srcRefLink(s) {
  if (s.url) return s.url;
  if (s.doi) return `https://doi.org/${encodeURIComponent(s.doi)}`;
  if (s.pmid) return `https://pubmed.ncbi.nlm.nih.gov/${encodeURIComponent(s.pmid)}/`;
  return '';
}
function collectSources(e) {
  const items = [], seen = new Set();
  const push = (o) => {
    if (!o.title) return;
    const k1 = o.title.toLowerCase().slice(0, 60);
    const jn = String(o.journal || '').toLowerCase().replace(/[^a-z]/g, '').slice(0, 5);
    const k2 = o.year && jn ? `${o.year}|${jn}` : null; // stejná studie pod jiným názvem (CZ vs EN apod.)
    if (seen.has(k1) || (k2 && seen.has(k2))) return;
    seen.add(k1); if (k2) seen.add(k2); items.push(o);
  };
  (e.sources || []).forEach((s) => push({ title: s.title, journal: s.journal, year: s.year, type: srcNorm(s.type), doi: s.doi, pmid: s.pmid, url: s.url }));
  // napojené centrální studie (relations.studies)
  for (const slug of (e._rel && e._rel.study ? e._rel.study : [])) {
    const st = bySlug.get(`study:${slug}`); if (!st) continue;
    push({ title: st.name, journal: st.journal, year: st.year, type: srcNorm(st.design || st.type), doi: st.doi, pmid: st.pmid, url: urlOf(st) });
  }
  return items;
}
function sourcesBlock(e) {
  const items = collectSources(e);
  if (!items.length) return '';
  const counts = {};
  items.forEach((s) => { counts[s.type] = (counts[s.type] || 0) + 1; });
  const summary = SRC_ORDER.filter((k) => counts[k]).map((k) => `<strong>${counts[k]} ${esc(srcPlural(k, counts[k]))}</strong>`).join(' · ');
  const sorted = items.slice().sort((a, b) => (SRC_META[b.type].rank - SRC_META[a.type].rank) || ((b.year || 0) - (a.year || 0)));
  const list = sorted.map((s) => {
    const link = srcRefLink(s);
    const title = link ? `<a href="${attr(link)}" rel="nofollow noopener" target="_blank">${esc(s.title)} ↗</a>` : esc(s.title);
    const ref = (s.pmid ? `PMID ${esc(s.pmid)}` : s.doi ? `DOI ${esc(s.doi)}` : '');
    return `<li><span class="src-badge src-badge--${s.type}">${esc(SRC_META[s.type].forms[0])}</span> ${title}${s.journal ? `, <em>${esc(s.journal)}</em>` : ''}${s.year ? ` (${s.year})` : ''}${ref ? ` · <span class="muted small">${ref}</span>` : ''}</li>`;
  }).join('');
  const notes = [];
  if (items.length <= 2) notes.push('U tohoto tématu je důkazní základna zatím užší — průběžně ji rozšiřujeme o systematické přehledy a metaanalýzy.');
  if (e.evidenceLevel === 'preliminary') notes.push('Jde převážně o předběžné a experimentální výsledky, ne o potvrzené klinické důkazy.');
  if (e.evidenceLevel === 'limited') notes.push('Důkazy jsou zatím omezené; silná doporučení proto neuvádíme.');
  if (e.conflicting) notes.push('Výsledky studií se různí — přínos zatím není jednoznačný.');
  notes.push('Rozlišujeme kvalitní klinické důkazy, předběžné výsledky a experimentální výzkum. Pokud se objeví novější systematický přehled nebo metaanalýza, má přednost a hodnocení podle ní upravujeme.');
  return `<section class="section-block sources">
    <h2>Zdroje hodnocení</h2>
    <p class="src-summary">Toto hodnocení vychází z: ${summary}.</p>
    <details class="src-details"><summary>Zobrazit kompletní seznam zdrojů (${items.length})</summary><ul class="src-list">${list}</ul></details>
    ${notes.map((n) => `<p class="muted small">${esc(n)}</p>`).join('')}
  </section>`;
}

/* ----------------------------------------------------------------------------
 * Vizuální systém: obrázky entit s elegantním fallbackem a atribucí zdroje
 * Konvence cesty:  build/assets/img/<složka>/<slug>.<ext>
 * Přepis v datech: e.image = { file|src, alt, source, sourceUrl }
 * ------------------------------------------------------------------------- */
const IMG_EXTS = ['webp', 'avif', 'jpg', 'jpeg', 'png'];
const IMG_DIR = {
  product: 'products', technology: 'technologies', ingredient: 'ingredients',
  procedure: 'procedures', supplement: 'supplements', skinType: 'skin-types',
  ageGroup: 'age-groups', problem: 'problems', article: 'articles',
  faceYoga: 'face-yoga', comparison: 'comparisons', study: 'studies',
  routine: 'routines', term: 'terms', review: 'reviews',
};
const IMG_GLYPH = {
  product: '◈', technology: '❖', ingredient: '⬡', procedure: '✚', supplement: '⬤',
  skinType: '❀', ageGroup: '◷', problem: '◎', article: '❦', faceYoga: '☺',
  comparison: '⇄', routine: '☰', study: '※', term: '¶', review: '★',
};
// Typy, u nichž má hlavní/kartový obrázek vizuální smysl
const HERO_IMG_TYPES = new Set(['product', 'technology', 'procedure', 'ingredient', 'skinType', 'ageGroup', 'problem', 'article', 'supplement']);

function imgRel(dir, name) {
  for (const ext of IMG_EXTS) {
    const rel = `img/${dir}/${name}.${ext}`;
    if (existsSync(join(ASSETS_SRC, rel))) return '/assets/' + rel;
  }
  return null;
}
// existuje lokální /assets soubor?  (http/https bereme jako platné bez kontroly)
function assetOk(src) {
  if (!src) return false;
  if (/^https?:/.test(src)) return true;
  const rel = src.replace(/^\/?assets\//, '');
  return existsSync(join(ASSETS_SRC, rel));
}
function entityImageSrc(e) {
  // 1) explicitní přepis v datech — jen pokud soubor skutečně existuje
  if (e.image && typeof e.image === 'object' && (e.image.src || e.image.file)) {
    const dir = IMG_DIR[e.type] || e.type;
    const s = e.image.src || `/assets/img/${dir}/${e.image.file}`;
    if (assetOk(s)) {
      return {
        src: s, alt: e.image.alt || e.name,
        source: e.image.source || (e.image.official ? 'výrobce (oficiální)' : undefined),
        sourceUrl: e.image.sourceUrl || e.image.official,
      };
    }
  }
  // 2) face yoga fotografie
  if (e.type === 'faceYoga' && Array.isArray(e.photos) && e.photos.length && assetOk(e.photos[0])) {
    return { src: e.photos[0], alt: e.name };
  }
  // 3) konvence img/<dir>/<slug>.<ext>
  const rel = imgRel(IMG_DIR[e.type] || e.type, e.slug);
  if (rel) return { src: rel, alt: e.imageAlt || e.name, source: e.imageSource, sourceUrl: e.imageSourceUrl };
  return null;
}
function entityImage(e, { cls = '' } = {}) {
  const data = entityImageSrc(e);
  if (data) {
    const cap = data.source
      ? `<figcaption class="ent-img-src">${data.sourceUrl
          ? `Zdroj: <a href="${attr(data.sourceUrl)}" rel="nofollow noopener" target="_blank">${esc(data.source)}</a>`
          : 'Zdroj: ' + esc(data.source)}</figcaption>`
      : '';
    return `<figure class="ent-img ${cls}"><img src="${attr(data.src)}" alt="${attr(data.alt)}" loading="lazy" decoding="async">${cap}</figure>`;
  }
  const g = IMG_GLYPH[e.type] || '◈';
  return `<figure class="ent-img ent-img--ph ${cls}" data-type="${esc(e.type)}" aria-hidden="true"><span class="ent-img-glyph">${g}</span><span class="ent-img-mono">${esc((e.name || '?').slice(0, 1))}</span></figure>`;
}
function bannerImage(type) {
  const rel = imgRel('banners', IMG_DIR[type] || type);
  return rel ? `<div class="listing-banner"><img src="${attr(rel)}" alt="" loading="eager" decoding="async"></div>` : '';
}
function ogImageFor(e) {
  const data = e ? entityImageSrc(e) : null;
  const rel = data ? data.src : '/assets/img/og-default.jpg';
  return /^https?:/.test(rel) ? rel : ORIGIN + BASE + rel;
}

function entityCard(e) {
  const ev = e.evidenceLevel ? evidenceBadge(e.evidenceLevel) : '';
  const img = HERO_IMG_TYPES.has(e.type) ? entityImage(e, { cls: 'card-img' }) : '';
  return `<a class="card${img ? ' card--has-img' : ''}" href="${urlOf(e)}">
    ${img}
    <span class="card-type">${esc(TYPES[e.type].one)}</span>
    <h3 class="card-title">${esc(e.name)}</h3>
    <p class="card-excerpt">${esc(e.excerpt || '')}</p>
    <span class="card-foot">${ev}<span class="card-arrow">→</span></span>
  </a>`;
}

/* Sekce „znalostní graf" — související entity seskupené podle typu */
function relatedSection(e) {
  const order = ['ingredient', 'technology', 'product', 'procedure', 'problem', 'skinType', 'ageGroup', 'routine', 'study', 'comparison', 'review', 'article', 'term'];
  let groups = '';
  for (const type of order) {
    const set = e._rel[type];
    if (!set || !set.size) continue;
    const items = [...set].map((slug) => bySlug.get(`${type}:${slug}`)).filter(Boolean);
    if (!items.length) continue;
    groups += `<div class="rel-group"><h3 class="rel-h">${esc(TYPES[type].many)}</h3><div class="chips">${items
      .map((it) => `<a class="chip" href="${urlOf(it)}">${esc(it.name)}</a>`)
      .join('')}</div></div>`;
  }
  if (!groups) return '';
  return `<section class="section-block graph"><div class="graph-head"><span class="eyebrow">Znalostní graf</span><h2>Související obsah</h2><p class="muted">Vše na platformě je propojené. Pokračujte v objevování.</p></div>${groups}</section>`;
}

/* ----------------------------------------------------------------------------
 * Navigace + layout
 * ------------------------------------------------------------------------- */
const NAV = [
  { label: 'Ingredience', href: '/ingredience/' },
  { label: 'Technologie', href: '/technologie/' },
  { label: 'Doplňky stravy', href: '/doplnky-stravy/' },
  { label: 'Produkty', href: '/produkty/' },
  { label: 'Procedury', href: '/procedury/' },
  { label: 'Péče', children: [
    { label: 'Podle věku', href: '/pece-podle-veku/' },
    { label: 'Podle typu pleti', href: '/pece-podle-typu-pleti/' },
    { label: 'Podle problému', href: '/pece-podle-problemu/' },
    { label: 'Rutiny', href: '/rutiny/' },
    { label: 'Obličejová jóga', href: '/oblicejova-joga/' },
  ]},
  { label: 'Studie', href: '/studie/' },
  { label: 'Průvodci', href: '/clanky/' },
  { label: 'Nástroje', href: '/nastroje/' },
];

function navHtml() {
  const items = NAV.map((n) => {
    if (n.children) {
      return `<li class="has-sub"><button class="nav-sub-toggle" aria-haspopup="true">${esc(n.label)} <span class="caret">▾</span></button><ul class="sub">${n.children
        .map((c) => `<li><a href="${c.href}">${esc(c.label)}</a></li>`).join('')}</ul></li>`;
    }
    return `<li><a href="${n.href}">${esc(n.label)}</a></li>`;
  }).join('');
  return `<ul class="nav-links">${items}</ul>`;
}

function breadcrumb(trail) {
  const items = trail.map((t, i) => {
    const last = i === trail.length - 1;
    return last ? `<li aria-current="page">${esc(t.label)}</li>` : `<li><a href="${t.href}">${esc(t.label)}</a></li>`;
  }).join('<li class="sep">/</li>');
  return `<nav class="breadcrumb" aria-label="Drobečková navigace"><ul>${items}</ul></nav>`;
}

function layout({ title, description, canonical, body, jsonld = [], breadcrumbTrail, image }) {
  const ogImage = image || (ORIGIN + BASE + '/assets/img/og-default.jpg');
  const ld = jsonld.map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('');
  return `<!doctype html>
<html lang="${SITE.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${attr(description)}">
<link rel="canonical" href="${SITE.url}${canonical}">
<meta property="og:title" content="${attr(title)}">
<meta property="og:description" content="${attr(description)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${attr(SITE.name)}">
<meta property="og:image" content="${attr(ogImage)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${attr(ogImage)}">
<meta name="theme-color" content="#FBFAF7">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Inter:wght@400;500;600&display=swap">
<link rel="stylesheet" href="/assets/css/style.css">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<script>window.AEVIA_BASE=${JSON.stringify(BASE)};</script>
${ld}
</head>
<body>
<a class="skip" href="#main">Přeskočit na obsah</a>
<header class="site-header">
  <div class="container nav">
    <a class="brand" href="/"><span class="brand-mark">${esc(SITE.name)}</span></a>
    <nav class="primary-nav" aria-label="Hlavní navigace">${navHtml()}</nav>
    <div class="nav-right">
      <a class="search-link" href="/hledat/" aria-label="Hledat">⌕</a>
      <button class="nav-toggle" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button>
    </div>
  </div>
</header>
<main id="main">
${breadcrumbTrail ? `<div class="container">${breadcrumb(breadcrumbTrail)}</div>` : ''}
${body}
</main>
<footer class="site-footer">
  <div class="container footer-grid">
    <div class="footer-brand">
      <div class="brand-mark">${esc(SITE.name)}</div>
      <p class="muted">${esc(SITE.description)}</p>
    </div>
    <div><h4>Databáze</h4><ul><li><a href="/ingredience/">Ingredience</a></li><li><a href="/technologie/">Technologie</a></li><li><a href="/doplnky-stravy/">Doplňky stravy</a></li><li><a href="/produkty/">Produkty</a></li><li><a href="/procedury/">Procedury</a></li><li><a href="/studie/">Studie</a></li><li><a href="/metodika-hodnoceni/">Jak hodnotíme</a></li></ul></div>
    <div><h4>Péče</h4><ul><li><a href="/pece-podle-veku/">Podle věku</a></li><li><a href="/pece-podle-typu-pleti/">Podle typu pleti</a></li><li><a href="/pece-podle-problemu/">Podle problému</a></li><li><a href="/rutiny/">Rutiny</a></li><li><a href="/oblicejova-joga/">Obličejová jóga</a></li><li><a href="/slovnik/">Slovník pojmů</a></li></ul></div>
    <div><h4>Nástroje</h4><ul><li><a href="/nastroje/poradce/">Anti-aging poradce</a></li><li><a href="/nastroje/builder-rutiny/">Builder rutiny</a></li><li><a href="/nastroje/kompatibilita/">Kompatibilita látek</a></li><li><a href="/nastroje/vyhledavac-ingredienci/">Vyhledávač ingrediencí</a></li></ul></div>
  </div>
  <div class="container footer-legal">
    <p class="muted small">Veškerá hodnocení na ${esc(SITE.name)} představují <strong>redakční odbornou analýzu</strong> založenou na veřejně dostupných vědeckých zdrojích a jednotné <a href="/metodika-hodnoceni/">metodice hodnocení</a>. Nejde o laboratorní testování, oficiální certifikaci ani lékařské doporučení. Výsledná skóre vyjadřují redakční názor ${esc(SITE.name)} podle transparentně zveřejněných kritérií a mohou se měnit s přibývajícími kvalitními vědeckými důkazy.</p>
    <p class="muted small">© ${new Date().getFullYear()} ${esc(SITE.name)}. Obsah má vzdělávací charakter a nenahrazuje odbornou lékařskou ani dermatologickou konzultaci. Některé odkazy mohou být affiliate.</p>
  </div>
</footer>
<script src="/assets/js/main.js" defer></script>
</body>
</html>`;
}

/* ----------------------------------------------------------------------------
 * Zápis souborů
 * ------------------------------------------------------------------------- */
// Prefixuje všechny vnitřní absolutní odkazy (href|src|action="/...") base cestou.
// Externí odkazy (https://) ani fragmenty (#) nezasahuje.
function applyBase(html) {
  if (!BASE) return html;
  return html.replace(/(href|src|action)="\/(?!\/)/g, `$1="${BASE}/`);
}

// Připojí ?v=HASH ke všem /assets/*.css a *.js (cache-busting).
function versionAssets(html) {
  return html.replace(/(\/assets\/[^"'?]+\.(?:css|js))(["'])/g, `$1?v=${ASSET_VER}$2`);
}
function writePage(url, html) {
  const dir = join(OUT, url.replace(/^\//, ''));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), versionAssets(applyBase(html)));
}

/* ----------------------------------------------------------------------------
 * Renderery konkrétních typů
 * ------------------------------------------------------------------------- */
function detailExtras(e) {
  let html = '';
  // Ingredient specifika
  if (e.type === 'ingredient') {
    html += decisionTop(e);                                                   // 1–3. Je to pro vás? / Co očekávat / Co bychom doporučili
    html += twoCol(listBlock('Na co pomáhá', e.indications), listBlock('Kdy není vhodné', e.contraindications)); // 4–5. Výhody / Omezení
    html += recommendPicks(e);                                                // 6. Jednotná doporučovací sekce
    if (e.mechanism) html += `<section class="section-block"><h2>Jak to funguje?</h2><p>${esc(e.mechanism)}</p></section>`; // 7. Jak funguje
    const rows = [];
    if (e.concentrations) rows.push(['Doporučené koncentrace', e.concentrations]);
    if (e.inci) rows.push(['INCI', e.inci]);
    html += quickFacts(rows);
    html += listBlock('Nežádoucí účinky', e.sideEffects);                     // 8. Detailní odborné informace
    if (e.compatibility?.length) html += compatibilityBlock(e.compatibility);
  }
  if (e.type === 'technology') {
    html += decisionTop(e);                                                   // 1–3.
    html += effectivenessBlock(e);                                            // Na co funguje
    html += twoCol(listBlock('Výhody', e.pros), listBlock('Nevýhody', e.cons)); // 4–5. Výhody + Nevýhody vedle sebe
    html += listBlock('Kdy není vhodné / kontraindikace', e.contraindications); // hned pod dvojicí
    html += recommendPicks(e);                                                // 6. Jednotná doporučovací sekce
    html += techAdvisor(e);
    const rows = [];
    if (e.principle) rows.push(['Jak to funguje', e.principle]);              // 7. Jak funguje
    if (e.history) rows.push(['Historie', e.history]);
    if (e.frequency) rows.push(['Doporučená frekvence', e.frequency]);
    if (e.sessionLength) rows.push(['Délka procedury', e.sessionLength]);
    if (e.timeToResults) rows.push(['Doba výsledků', e.timeToResults]);
    if (e.homeUse) rows.push(['Domácí použití', e.homeUse]);
    html += quickFacts(rows);
    html += evidenceBlock(e);                                                 // 8. Detailní / důkazy
    html += scorecardBlock(e, TECH_SCORE_LABELS);
    html += techCombine(e);
    html += techComparisons(e);
  }
  if (e.type === 'supplement') {
    html += decisionTop(e);                                                   // 1–3.
    html += suppAdvisor(e);
    if (e.whatIs) html += `<section class="section-block"><h2>Co to je</h2><p>${esc(e.whatIs)}</p></section>`;
    if (e.source) html += `<section class="section-block"><h2>Přirozené zdroje a forma</h2><p>${esc(e.source)}</p></section>`;
    html += suppEffectivenessBlock(e);
    html += evidenceBlock(e);
    html += listBlock('Na co se podle výzkumu zkoumá', e.benefits);
    html += listBlock('Hranice a co výzkum (zatím) nepotvrzuje', e.limits);
    const dLbl = { dose: 'Obvyklé dávkování', when: 'Kdy užívat', duration: 'Doba do efektu', form: 'Forma' };
    const dosingRows = [];
    if (e.dosing) for (const [k, v] of Object.entries(e.dosing)) dosingRows.push([dLbl[k] || k, v]);
    html += dosingRows.length ? `<section class="section-block"><h2>Dávkování a užívání</h2>${quickFacts(dosingRows)}</section>` : '';
    html += twoCol(listBlock('Možné nežádoucí účinky', e.sideEffects), listBlock('Kdy být opatrný / kontraindikace', e.contraindications));
    html += scorecardBlock(e, SUPP_SCORE_LABELS);
    html += legalBlock(e);
    html += techCombine(e);
    html += suppComparisons(e);
    html += recommendPicks(e);                                                // Jednotná doporučovací sekce
  }
  if (e.type === 'product') {
    const rows = [];
    if (e.brand && e.brand !== '—') rows.push(['Značka', e.brand]);
    if (e.manufacturer && e.manufacturer !== '—' && e.manufacturer !== e.brand) rows.push(['Výrobce', e.manufacturer]);
    if (e.category) rows.push(['Kategorie', categoryLabel(e.category)]);
    if (e.productType) rows.push(['Typ produktu', e.productType]);
    if (e.country) rows.push(['Země původu', e.country]);
    if (e.volume) rows.push(['Objem', e.volume]);
    if (e.price) rows.push(['Doporučená cena', e.price]);
    if (e.suppFacts) {
      const sf = e.suppFacts;
      if (sf.forma) rows.push(['Forma', sf.forma]);
      if (sf.davka) rows.push(['Dávkování', sf.davka]);
      if (sf.pocet) rows.push(['Vystačí na', sf.pocet]);
      if (sf.cenaZaDen) rows.push(['Cena za denní dávku', sf.cenaZaDen]);
      if (sf.puvod) rows.push(['Původ surovin', sf.puvod]);
      if (sf.certifikace) rows.push(['Certifikace / poznámky', sf.certifikace]);
    } else if (e.usage) rows.push(['Doporučené použití', e.usage]);
    html += quickFacts(rows);
    html += productDisclaimer();
    html += activesBlock(e);
    html += howItWorksBlock(e);
    html += twoCol(listBlock('Pro koho je vhodný', e.suitableFor), listBlock('Kdy není vhodný', e.notSuitable || e.contraindications));
    html += scorecardBlock(e, isDeviceProduct(e) ? DEVICE_SCORE_LABELS : SCORE_LABELS);
    html += twoCol(listBlock('Silné stránky', e.strengths || e.pros), listBlock('Slabé stránky', e.weaknesses || e.cons));
    html += recommendationBlock(e);
    html += alternativesBlock(e);
    html += productCompareBlock(e);
    html += inciBlock(e);
    if (e.affiliate?.length) html += affiliateBlock(e.affiliate);
  }
  if (e.type === 'procedure') {
    html += decisionTop(e);                                                   // 1–3.
    const rows = [];
    if (e.principle) rows.push(['Jak to funguje', e.principle]);              // 7. Jak funguje
    if (e.invasiveness) rows.push(['Invazivita', e.invasiveness]);
    if (e.downtime) rows.push(['Rekonvalescence', e.downtime]);
    if (e.frequency) rows.push(['Frekvence', e.frequency]);
    if (e.results) rows.push(['Výsledky', e.results]);
    if (e.priceRange) rows.push(['Cena', e.priceRange]);
    html += quickFacts(rows);
    html += listBlock('Kdy není vhodné / rizika', e.risks);
    html += recommendPicks(e);                                                // Jednotná doporučovací sekce (pokud jsou produkty)
  }
  if (e.type === 'study') {
    const rows = [];
    if (e.design) rows.push(['Design', e.design]);
    if (e.sampleSize) rows.push(['Vzorek', e.sampleSize]);
    if (e.journal) rows.push(['Časopis', e.journal]);
    if (e.year) rows.push(['Rok', String(e.year)]);
    if (e.outcome) rows.push(['Výsledek', e.outcome]);
    html += quickFacts(rows);
    if (e.practicalTakeaway) html += `<div class="callout callout--accent"><strong>Praktický závěr:</strong> <p>${esc(e.practicalTakeaway)}</p></div>`;
  }
  if (e.type === 'ageGroup') {
    const g = e.guide || {};
    const facts = [];
    if (e.decade) facts.push(['Dekáda', e.decade]);
    if (e.focus) facts.push(['Hlavní zaměření', e.focus]);
    html += quickFacts(facts);
    if (g.whatsHappening) html += `<section class="section-block"><h2>Co se v pleti děje</h2><p>${esc(g.whatsHappening)}</p></section>`;
    html += listBlock('Priority péče v této dekádě', g.priorities);
    html += careRoutine(g.am, g.pm);
    html += listBlock('Na co se zaměřit', g.focusActives);
    html += listBlock('Čemu se vyhnout', g.avoid);
    html += recommendPicks(e);
    if (g.expectations) html += careCallout('accent', 'Realistická očekávání', g.expectations);
    if (g.whenPro) html += careCallout('', 'Kdy zvážit odborníka', g.whenPro);
  }
  if (e.type === 'skinType') {
    const g = e.guide || {};
    html += listBlock('Jak ji poznáte', g.howToTell);
    html += twoCol(listBlock('Charakteristika', e.characteristics), listBlock('Čemu se vyhnout', e.avoid));
    html += listBlock('Cíle péče', g.goals);
    html += listBlock('Nejvhodnější látky', g.bestActives);
    html += careRoutine(g.am, g.pm);
    html += listBlock('Časté chyby', g.mistakes);
    html += recommendPicks(e);
    if (e.routineHints) html += careCallout('accent', 'Tip na rutinu', e.routineHints);
    if (g.note) html += careCallout('', 'Důležité', g.note);
  }
  if (e.type === 'problem') {
    const g = e.guide || {};
    const facts = []; if (e.area) facts.push(['Typicky se objevuje', e.area]);
    if (g.whatIsIt) html += `<section class="section-block"><h2>Co to je</h2><p>${esc(g.whatIsIt)}</p></section>`;
    html += quickFacts(facts);
    html += listBlock('Příčiny', e.causes);
    html += whatHelpsBlock(g.whatHelps);
    html += careRoutine(g.am, g.pm);
    html += recommendPicks(e);
    if (g.expectations) html += careCallout('accent', 'Realistická očekávání', g.expectations);
    html += listBlock('Prevence', g.prevention);
    if (g.whenPro) html += careCallout('', 'Kdy vyhledat lékaře', g.whenPro);
  }
  if (e.type === 'routine' && e.steps?.length) {
    html += `<section class="section-block"><h2>Kroky rutiny</h2><ol class="steps">${e.steps
      .map((s) => `<li><strong>${esc(s.step)}</strong>${s.note ? `<span class="muted"> — ${esc(s.note)}</span>` : ''}</li>`).join('')}</ol></section>`;
  }
  if (e.type === 'comparison' && e.items?.length) {
    html += comparisonTable(e);
    if (e.verdict) html += `<div class="callout callout--accent"><strong>Verdikt:</strong> <p>${esc(e.verdict)}</p></div>`;
  }
  if (e.type === 'review') {
    if (e.rating) html += `<div class="rating">Hodnocení: <strong>${e.rating} / 5</strong></div>`;
    if (e.methodology) html += `<div class="callout"><strong>Naše metodika:</strong> <p>${esc(e.methodology)}</p></div>`;
    html += twoCol(listBlock('Klady', e.pros), listBlock('Zápory', e.cons));
    if (e.verdict) html += `<div class="callout callout--accent"><strong>Verdikt:</strong> <p>${esc(e.verdict)}</p></div>`;
  }
  if (e.type === 'term' && e.definition) {
    html = `<div class="callout callout--accent"><p>${esc(e.definition)}</p></div>` + html;
  }
  if (e.type === 'article') {
    let top = '';
    if (e.keyPoints && e.keyPoints.length) top += `<section class="section-block key-points"><h2>Ve zkratce</h2><ul class="rich-list">${e.keyPoints.map((p) => `<li>${esc(p)}</li>`).join('')}</ul></section>`;
    if (e.quickAnswer) top += `<div class="callout callout--accent quick-answer"><strong>Stručná odpověď</strong><p>${esc(e.quickAnswer)}</p></div>`;
    html = top + html;
  }
  return html;
}

function quickFacts(rows) {
  if (!rows.length) return '';
  return `<section class="section-block facts"><dl>${rows.map(([k, v]) => `<div class="fact"><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></section>`;
}
function listBlock(title, items) {
  if (!items || !items.length) return '';
  return `<div class="list-block"><h3>${esc(title)}</h3><ul class="rich-list">${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul></div>`;
}
function twoCol(a, b) {
  if (!a && !b) return '';
  return `<div class="two-col">${a}${b}</div>`;
}

/* ============================================================================
 * PRŮVODCE ROZHODOVÁNÍM — bloky, které mění web z encyklopedie na rádce.
 * Fungují automaticky z existujících dat; kurátorská pole (verdict, whoFor,
 * whoNot, timeline, scenario, recommend, maybeInstead) je obohatí, když jsou.
 * ==========================================================================*/
const CTA_LABEL = {
  poradce:     ['Vyzkoušet Anti-aging poradce', '/nastroje/poradce/'],
  produkty:    ['Porovnat produkty',            '/nastroje/porovnani-produktu/'],
  rutina:      ['Sestavit rutinu',              '/nastroje/builder-rutiny/'],
  technologie: ['Porovnat technologie',         '/nastroje/doporuceni-technologii/'],
};
function fitsBlock(e) {
  const yes = e.whoFor || e.indications || e.suitableFor;
  const no = e.whoNot || e.notSuitable || e.contraindications;
  const col = (title, cls, items) => (items && items.length)
    ? `<div class="fits-col fits--${cls}"><h3>${title}</h3><ul>${items.slice(0, 6).map((i) => `<li>${esc(i)}</li>`).join('')}</ul></div>` : '';
  const y = col('Ano, pokud', 'yes', yes), n = col('Spíše ne, pokud', 'no', no);
  if (!y && !n) return '';
  return `<div class="fits">${y}${n}</div>`;
}
function verdictCard(e) {
  const text = e.verdict || '';   // kurátorský verdikt; excerpt je už v hero, neopakujeme
  const fits = fitsBlock(e);
  if (!text && !fits) return '';
  return `<section class="section-block verdict-card"><span class="eyebrow">Rychlé doporučení</span><h2>Je to řešení pro vás?</h2>${text ? `<p class="verdict-lead">${esc(text)}</p>` : ''}${fits}</section>`;
}
const TL_ROWS = [['w2', 'Po 2 týdnech'], ['w4', 'Po 4 týdnech'], ['w8', 'Po 8 týdnech'], ['m3', 'Po 3 měsících']];
function timelineBlock(e) {
  const t = e.timeline; if (!t) return '';
  const rows = TL_ROWS.filter(([k]) => t[k]).map(([k, l]) => `<div class="tl-row"><span class="tl-when">${l}</span><span class="tl-what">${esc(t[k])}</span></div>`).join('');
  if (!rows) return '';
  return `<section class="section-block timeline-block"><h2>Co můžete realisticky očekávat</h2><div class="timeline">${rows}</div>${t.note ? `<p class="muted small">${esc(t.note)}</p>` : ''}</section>`;
}
function recommendBlock(e) {
  if (!e.recommend || !e.recommend.length) return '';
  return `<section class="section-block reco-steps"><div class="graph-head"><span class="eyebrow">Doporučení redakce</span><h2>Co doporučuje AntiAgeLab</h2><p class="muted small">Redakční doporučení podle metodiky AntiAgeLab, ne lékařská rada.</p></div><ol class="reco-list">${e.recommend.map((s) => `<li>${esc(s)}</li>`).join('')}</ol></section>`;
}
function scenarioBlock(e) {
  let text = e.scenario;
  if (!text) {
    const ind = (e.indications || e.whoFor || [])[0];
    const w = { strong: 'nejlépe prozkoumané', moderate: 'slušně podložené', limited: 'méně prozkoumané', preliminary: 'zatím experimentální' }[e.evidenceLevel];
    if (ind && w) text = `Pokud řešíte ${String(ind).toLowerCase()}, ${e.name} patří mezi ${w} možnosti. Začali bychom pozvolna, sledovali snášenlivost a spojili to s každodenní ochranou před sluncem (SPF).`;
  }
  if (!text) return '';
  return `<section class="section-block scenario"><div class="graph-head"><span class="eyebrow">Osobní doporučení</span><h2>Co bychom doporučili ve vaší situaci</h2></div><p>${esc(text)}</p><p class="muted small">Redakční doporučení podle metodiky AntiAgeLab, ne lékařská rada.</p></section>`;
}
function decisionTop(e) { return verdictCard(e) + timelineBlock(e) + recommendBlock(e) + scenarioBlock(e); }
function maybeInstead(e) {
  const chips = []; const seen = new Set([`${e.type}:${e.slug}`]);
  const push = (it) => { if (it && !seen.has(`${it.type}:${it.slug}`)) { seen.add(`${it.type}:${it.slug}`); chips.push(`<a class="chip" href="${urlOf(it)}">${esc(it.name)}</a>`); return true; } return false; };
  [...(e._rel?.comparison || [])].forEach((s) => push(bySlug.get(`comparison:${s}`)));
  (e.maybeInstead || e.alternativeTech || e.alternativeSupps || e.alternatives || []).forEach((s) => push(bySlug.get(`technology:${s}`)) || push(bySlug.get(`ingredient:${s}`)) || push(bySlug.get(`supplement:${s}`)));
  [...(e._rel?.[e.type] || [])].slice(0, 4).forEach((s) => push(bySlug.get(`${e.type}:${s}`)));
  if (chips.length < 2) { const other = e.type === 'ingredient' ? 'technology' : 'ingredient'; [...(e._rel?.[other] || [])].slice(0, 3).forEach((s) => push(bySlug.get(`${other}:${s}`))); }
  if (!chips.length) return '';
  return `<section class="section-block maybe-instead"><h2>Možná hledáte spíše</h2><div class="chips">${chips.slice(0, 6).join('')}</div></section>`;
}
function nextStep(e) {
  const keys = e.type === 'procedure' ? ['poradce', 'technologie'] : e.type === 'technology' ? ['poradce', 'technologie', 'rutina'] : ['poradce', 'produkty', 'rutina'];
  const btns = keys.map((k) => { const [l, h] = CTA_LABEL[k]; return `<a class="btn btn--ghost" href="${h}">${esc(l)} →</a>`; }).join('');
  return `<section class="section-block next-step"><div class="graph-head"><span class="eyebrow">Váš další krok</span><h2>Kam pokračovat</h2></div><div class="next-row">${btns}</div></section>`;
}
/* ---- Péče (věk / typ pleti / problém): bloky detailního návodu ---- */
function careCallout(variant, title, text) {
  if (!text) return '';
  return `<div class="callout${variant ? ' callout--' + variant : ''}"><strong>${esc(title)}:</strong> <p>${esc(text)}</p></div>`;
}
function careRoutine(am, pm) {
  const col = (title, steps) => (steps && steps.length) ? `<div class="care-col"><h3>${title}</h3><ol class="steps">${steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol></div>` : '';
  const a = col('Ranní rutina', am), p = col('Večerní rutina', pm);
  if (!a && !p) return '';
  return `<section class="section-block"><h2>Rutina krok za krokem</h2><div class="two-col">${a}${p}</div></section>`;
}
function whatHelpsBlock(arr) {
  if (!arr || !arr.length) return '';
  const items = arr.map((x, i) => `<div class="help-row"><span class="help-rank">${i + 1}</span><div><strong>${esc(x.label)}</strong>${x.note ? `<p class="muted small">${esc(x.note)}</p>` : ''}</div></div>`).join('');
  return `<section class="section-block"><h2>Co s tím — podle síly důkazů</h2><p class="muted small">Seřazeno přibližně podle síly důkazů a praktického přínosu. Detaily a zdroje najdete na stránkách jednotlivých látek a technologií.</p><div class="help-list">${items}</div></section>`;
}
/* Doporučené produkty na stránce péče — z databáze, seřazené podle skóre AntiAgeLab */
function careProducts(e, opts = {}) {
  const set = e._rel && e._rel.product;
  let prods = set ? [...set].map((s) => bySlug.get(`product:${s}`)).filter(Boolean) : [];
  if (opts.cosmeticsOnly !== false) prods = prods.filter((p) => p.category !== 'doplnky-stravy');
  const sc = (p) => (p.scores && p.scores.overall ? p.scores.overall.score : 0);
  prods.sort((a, b) => sc(b) - sc(a));
  const top = prods.slice(0, 6);
  const moreHref = e.type === 'problem' ? `/produkty/?problem=${e.slug}` : e.type === 'skinType' ? `/produkty/?skintype=${e.slug}` : '/produkty/';
  if (!top.length) return '';
  const cards = top.map((p) => {
    const score = (p.scores && p.scores.overall) ? `<span class="care-prod-score">${fmtScore(p.scores.overall.score)}/10</span>` : '';
    const meta = [(p.brand && p.brand !== '—') ? p.brand : '', categoryLabel(p.category)].filter(Boolean).join(' · ');
    return `<a class="care-prod" href="${urlOf(p)}"><span class="care-prod-meta">${esc(meta)}</span><strong class="care-prod-name">${esc(p.name)}</strong><span class="care-prod-foot">${score}<span class="card-arrow">→</span></span></a>`;
  }).join('');
  return `<section class="section-block">
    <div class="graph-head"><span class="eyebrow">Doporučení redakce</span><h2>Doporučené produkty podle metodiky AntiAgeLab</h2>
    <p class="muted small">Vybráno z naší databáze a seřazeno podle <a href="/metodika-hodnoceni/">skóre AntiAgeLab</a>. Jde o redakční doporučení, ne o oficiální pořadí trhu.</p></div>
    <div class="care-prod-grid">${cards}</div>
    <p><a class="btn btn--ghost btn--sm" href="${moreHref}">Zobrazit všechny vhodné produkty →</a></p>
  </section>`;
}

/* ============================================================================
 * JEDNOTNÁ DOPORUČOVACÍ SEKCE — jedna silná sekce napříč celým webem.
 * „Co bychom dnes doporučili?" s kurátorskými výběry (nejlepší celkově, poměr
 * cena/výkon, začátečníci, prémiová, nejdostupnější) + jedno CTA do databáze.
 * Nahrazuje careProducts, techDevices i suppProducts.
 * ==========================================================================*/
const PICK_META = [
  ['best',     '🏆', 'Nejlepší celkově',             'Nejvyšší skóre podle metodiky AntiAgeLab'],
  ['value',    '💰', 'Nejlepší poměr cena/výkon',    'Nejvíc kvality za vynaloženou cenu'],
  ['beginner', '🌱', 'Doporučeno pro začátečníky',   'Bezpečný a dostupný start'],
  ['premium',  '💎', 'Prémiová / nejvýkonnější volba', 'Pro náročné a maximální efekt'],
  ['cheapest', '👍', 'Cenově nejdostupnější',         'Nejnižší cena z doporučených'],
];
function recoMoreHref(e) {
  if (e.type === 'problem') return `/produkty/?problem=${e.slug}`;
  if (e.type === 'skinType') return `/produkty/?skintype=${e.slug}`;
  if (e.type === 'ingredient') return `/produkty/?ingredient=${e.slug}`;
  if (e.type === 'technology') return `/produkty/?category=${(e.deviceCategories && e.deviceCategories[0]) || ''}`;
  if (e.type === 'supplement') return '/produkty/?category=doplnky-stravy';
  return '/produkty/';
}
function recommendPicks(e) {
  let pool = [];
  const relSet = e._rel && e._rel.product;
  if (relSet) for (const s of relSet) { const p = bySlug.get(`product:${s}`); if (p) pool.push(p); }
  if (e.type === 'technology' && e.deviceCategories) for (const p of entitiesByType('product')) if (e.deviceCategories.includes(p.category) && pool.indexOf(p) < 0) pool.push(p);
  if (e.type !== 'supplement') pool = pool.filter((p) => p.category !== 'doplnky-stravy');
  pool = [...new Set(pool)];
  if (!pool.length) return '';
  const sc = (p) => (p.scores && p.scores.overall ? p.scores.overall.score : 0);
  const pot = (p) => (p.scores && (p.scores.potency || p.scores.quality) ? (p.scores.potency || p.scores.quality).score : 0);
  const priceNum = (p) => { const m = String(p.price || '').replace(/\s/g, '').match(/\d+/); return m ? +m[0] : Infinity; };
  // Kurátorské výběry počítáme jen z ohodnocených produktů; neohodnocené (nově
  // doplněné přístroje) zůstávají v databázi a v CTA, ale netvoří prázdné karty.
  const rated = pool.filter((p) => sc(p) > 0);
  const pickPool = rated.length ? rated : pool;
  const seen = new Set();
  const take = (fn, filter) => { const p = [...pickPool].filter((x) => !seen.has(x.slug) && (!filter || filter(x))).sort(fn)[0]; if (p) seen.add(p.slug); return p; };
  const chosen = {
    best: take((a, b) => sc(b) - sc(a)),
    value: take((a, b) => (sc(b) / Math.max(1, priceNum(b))) - (sc(a) / Math.max(1, priceNum(a)))),
    beginner: take((a, b) => priceNum(a) - priceNum(b), (x) => sc(x) >= 6),
    premium: take((a, b) => pot(b) - pot(a) || priceNum(b) - priceNum(a)),
    cheapest: take((a, b) => priceNum(a) - priceNum(b)),
  };
  const isSubstance = e.type === 'ingredient' || e.type === 'supplement';
  const cards = PICK_META.map(([key, emoji, label, sub]) => {
    const p = chosen[key]; if (!p) return '';
    const subtitle = (key === 'premium' && isSubstance) ? 'Nejkomplexnější složení' : sub;
    const score = (p.scores && p.scores.overall && typeof p.scores.overall.score === 'number') ? `<span class="rp-score">${fmtScore(p.scores.overall.score)}/10${p.provisional ? ' <span class="rp-prov">předběžné</span>' : ''}</span>` : '';
    const meta = [(p.brand && p.brand !== '—') ? p.brand : '', categoryLabel(p.category)].filter(Boolean).join(' · ');
    const price = p.price ? `<span class="rp-price">${esc(p.price)}</span>` : '';
    return `<a class="rp-card" href="${urlOf(p)}">
      <span class="rp-badge">${emoji} ${esc(label)}</span>
      <strong class="rp-name">${esc(p.name)}</strong>
      ${meta ? `<span class="rp-meta">${esc(meta)}</span>` : ''}
      <span class="rp-reason">${esc(subtitle)}</span>
      <span class="rp-foot">${price}${score}<span class="card-arrow">→</span></span>
    </a>`;
  }).filter(Boolean).join('');
  const heading = e.type === 'technology' ? 'Jaké zařízení bychom dnes doporučili?' : 'Co bychom dnes doporučili?';
  const ctaLabel = e.type === 'technology' ? 'Zobrazit všechna zařízení' : 'Zobrazit všechny produkty';
  return `<section class="section-block reco-picks"><div class="graph-head"><span class="eyebrow">Doporučení redakce</span><h2>${heading}</h2>
    <p class="muted small">Vybrali jsme z databáze podle jednotné <a href="/metodika-hodnoceni/">metodiky AntiAgeLab</a> — hodnocení zohledňuje kvalitu produktu, sílu vědeckých důkazů, poměr cena/výkon, bezpečnost i celkovou uživatelskou hodnotu. Jde o nezávislé redakční doporučení, ne o oficiální pořadí trhu.</p></div>
    <div class="rp-grid">${cards}</div>
    <p><a class="btn btn--ghost" href="${recoMoreHref(e)}">${ctaLabel} →</a></p>
  </section>`;
}

function compatibilityBlock(list) {
  const lvl = { good: ['Vhodné', 'ok'], caution: ['Opatrně', 'warn'], avoid: ['Nekombinovat', 'bad'] };
  return `<section class="section-block"><h3>Kompatibilita s dalšími látkami</h3><div class="compat-list">${list
    .map((c) => {
      const target = bySlug.get(`ingredient:${c.with}`);
      const name = target ? `<a href="${urlOf(target)}">${esc(target.name)}</a>` : esc(c.with);
      const [lab, cls] = lvl[c.level] || ['', ''];
      return `<div class="compat compat--${cls}"><div class="compat-top"><span class="compat-name">${name}</span><span class="compat-badge ${cls}">${lab}</span></div><p class="muted small">${esc(c.note)}</p></div>`;
    }).join('')}</div></section>`;
}
function affiliateBlock(list) {
  return `<section class="section-block affiliate"><h3>Kde koupit</h3><div class="aff-row">${list
    .map((a) => `<a class="btn btn--primary" href="${attr(a.url)}" rel="nofollow sponsored noopener" target="_blank">${esc(a.label)} ↗</a>`).join('')}</div><p class="muted small">Odkazy mohou být affiliate — nákupem přes ně podpoříte provoz platformy bez vlivu na cenu.</p></section>`;
}

/* ---- Produktové bloky (odborná databáze) ---- */
const PRODUCT_CATEGORIES = {
  'sera': 'Séra', 'vitamin-c': 'Vitamin C séra', 'retinoly': 'Retinoidy', 'peptidy': 'Peptidová séra',
  'spf': 'Opalovací krémy (SPF)', 'noeni-kremy': 'Noční krémy', 'ocni-kremy': 'Oční krémy',
  'hydratace': 'Hydratační péče', 'exfolianty': 'Exfolianty', 'led-masky': 'LED masky',
  'microcurrent': 'Microcurrent přístroje', 'radiofrekvence': 'RF zařízení', 'domaci-lasery': 'Domácí lasery', 'ems': 'EMS přístroje',
  'microneedling-zarizeni': 'Microneedling přístroje', 'dermaroller': 'Dermarollery', 'gua-sha': 'Gua sha', 'face-roller': 'Obličejové válečky',
  'silikonove-naplasti': 'Silikonové náplasti', 'kryo-nastroje': 'Kryo nástroje', 'ultrazvuk-zarizeni': 'Ultrazvuková zařízení',
  'galvanicka-zarizeni': 'Galvanická zařízení', 'ipl-zarizeni': 'IPL zařízení', 'hifu-zarizeni': 'HIFU zařízení',
  'doplnky-stravy': 'Doplňky stravy',
};
const SCORE_LABELS = { evidence: 'Klinické důkazy o složení', quality: 'Kvalita složení', potency: 'Síla aktivních látek', sensitive: 'Bezpečnost a snášenlivost', value: 'Poměr cena/výkon', innovation: 'Inovativnost formulace' };
const ALT_KIND = { better: 'Lepší varianta', cheaper: 'Levnější varianta', stronger: 'Výkonnější varianta', gentler: 'Šetrnější varianta', similar: 'Podobná varianta' };

function categoryLabel(c) { return PRODUCT_CATEGORIES[c] || c; }
function productDisclaimer() {
  return `<div class="callout callout--disclaimer"><p class="small"><strong>Redakční analýza.</strong> Tato stránka obsahuje redakční odbornou analýzu vytvořenou na základě veřejně dostupných informací o produktu, složení a vědeckých poznatků o použitých ingrediencích. Nejedná se o laboratorní test ani o osobní zkušenost redakce.</p></div>`;
}
function activesBlock(e) {
  if (!e.activeIngredients || !e.activeIngredients.length) return '';
  const conc = e.concentrations || {};
  const items = e.activeIngredients.map((slug) => {
    const it = bySlug.get(`ingredient:${slug}`);
    const name = it ? `<a href="${urlOf(it)}">${esc(it.name)}</a>` : esc(slug);
    const c = conc[slug] ? ` <span class="muted">— ${esc(conc[slug])}</span>` : '';
    return `<li>${name}${c}</li>`;
  }).join('');
  const note = (!e.concentrations || !Object.keys(e.concentrations).length) ? '<p class="muted small">Přesné koncentrace výrobce neuvádí — uvádíme pouze složení bez odhadů.</p>' : '';
  return `<section class="section-block"><h2>Aktivní látky</h2><ul class="rich-list">${items}</ul>${note}</section>`;
}
function howItWorksBlock(e) {
  if (!e.howItWorks || !e.howItWorks.length) return '';
  const items = e.howItWorks.map((h) => {
    const it = bySlug.get(`ingredient:${h.ingredient}`);
    const name = it ? `<a href="${urlOf(it)}">${esc(it.name)}</a>` : '';
    return `<li>${name ? `<strong>${name}:</strong> ` : ''}${esc(h.text)}</li>`;
  }).join('');
  return `<section class="section-block"><h2>Jak funguje</h2><ul class="rich-list">${items}</ul></section>`;
}
const TECH_SCORE_LABELS = { quality: 'Kvalita technologie', innovation: 'Inovativnost', evidence: 'Vědecké důkazy', value: 'Poměr cena/výkon', ease: 'Snadnost použití', safety: 'Bezpečnost' };
// Přístroje používají stejné klíče jako produkty (kvůli výpočtu vah), ale device-popisky.
const DEVICE_SCORE_LABELS = { evidence: 'Vědecká opora technologie', quality: 'Kvalita zpracování a výbava', potency: 'Výkon a účinnost přístroje', sensitive: 'Bezpečnost a šetrnost', value: 'Poměr cena/výkon', innovation: 'Inovace a funkce' };
const DEVICE_CATEGORIES = new Set(['led-masky', 'microcurrent', 'radiofrekvence', 'domaci-lasery', 'ems', 'microneedling-zarizeni', 'dermaroller', 'gua-sha', 'face-roller', 'silikonove-naplasti', 'kryo-nastroje', 'ultrazvuk-zarizeni', 'galvanicka-zarizeni', 'ipl-zarizeni', 'hifu-zarizeni']);
function isDeviceProduct(e) { return e.productType === 'Beauty zařízení' || DEVICE_CATEGORIES.has(e.category); }
const SUPP_SCORE_LABELS = { evidence: 'Síla vědeckých důkazů', safety: 'Bezpečnost a snášenlivost', skinBenefit: 'Opora pro přínos v oblasti pleti', supplementing: 'Smysl doplňování', value: 'Poměr cena/přínos', overall: 'Celkové hodnocení' };
const CONCERN_LABEL = { 'jemne-vrasky': 'Jemné vrásky', 'hluboke-vrasky': 'Hluboké vrásky', 'povolena-plet': 'Povolená pleť', 'kontury': 'Kontury obličeje', 'pigmentace': 'Pigmentace', 'akne': 'Akné', 'zarudnuti': 'Zarudnutí', 'jizvy': 'Jizvy', 'elasticita': 'Elasticita', 'hydratace': 'Hydratace', 'pevnost': 'Pevnost pleti', 'vlasy': 'Vlasy', 'nehty': 'Nehty', 'hojeni': 'Hojení a regenerace', 'imunita': 'Imunita', 'antioxidace': 'Antioxidační ochrana' };
function stars(n, max = 5) { n = Math.max(0, Math.min(max, n | 0)); return `<span class="stars" aria-label="${n} z ${max}">${'★'.repeat(n)}${'☆'.repeat(max - n)}</span>`; }

function scorecardBlock(e, labels = SCORE_LABELS) {
  if (!e.scores) return '';
  const s = e.scores;
  const rows = Object.keys(labels).filter((k) => s[k]).map((k) => {
    const v = s[k];
    return `<div class="score-row"><div class="score-top"><span class="score-label">${esc(labels[k])}</span><span class="score-num">${v.score}/10</span></div><div class="score-bar"><span style="width:${Math.max(0, Math.min(10, v.score)) * 10}%"></span></div>${v.note ? `<p class="muted small score-note">${esc(v.note)}</p>` : ''}</div>`;
  }).join('');
  const o = s.overall;
  const overall = o ? `<div class="score-overall"><span>Celkové skóre</span><strong>${fmtScore(o.score)}/10</strong></div>${o.computed ? `<p class="muted small">Vážený průměr níže uvedených kritérií podle metodiky AntiAgeLab.</p>` : ''}${o.note ? `<p class="muted small">${esc(o.note)}</p>` : ''}` : '';
  const prov = e.provisional ? '<span class="prov-badge">Předběžné</span>' : '';
  return `<section class="section-block scorecard-wrap"><h2>Hodnocení AntiAgeLab ${prov}</h2><p class="muted small">Skóre je výsledkem <strong>redakčního hodnocení podle metodiky AntiAgeLab</strong> z veřejně dostupných informací (0–10), každé kritérium je slovně zdůvodněné. Nejde o laboratorní test ani oficiální certifikaci. <a href="/metodika-hodnoceni/">Jak hodnotíme →</a></p>${overall}<div class="scorecard">${rows}</div></section>`;
}
function fmtScore(n) { return (Math.round(n * 10) / 10).toString().replace('.', ','); }
function recommendationBlock(e) {
  if (!e.recommendation) return '';
  const r = e.recommendation;
  return `<section class="section-block"><h2>Doporučení</h2><div class="two-col reco-grid">${r.yes ? `<div class="reco reco--yes"><h3>Komu doporučujeme</h3><p>${esc(r.yes)}</p></div>` : ''}${r.no ? `<div class="reco reco--no"><h3>Komu nedoporučujeme</h3><p>${esc(r.no)}</p></div>` : ''}</div></section>`;
}
function alternativesBlock(e) {
  if (!e.alternatives || !e.alternatives.length) return '';
  const items = e.alternatives.map((a) => {
    const it = bySlug.get(`product:${a.slug}`);
    const name = it ? `<a href="${urlOf(it)}">${esc(it.name)}</a>` : esc(a.name || a.slug);
    return `<div class="alt"><span class="alt-kind">${esc(ALT_KIND[a.kind] || a.kind)}</span><div class="alt-name">${name}</div>${a.note ? `<p class="muted small">${esc(a.note)}</p>` : ''}</div>`;
  }).join('');
  return `<section class="section-block"><h2>Alternativy</h2><div class="alt-grid">${items}</div></section>`;
}
function productCompareBlock(e) {
  if (!e.compare || !e.compare.items || !e.compare.dimensions) return '';
  const items = e.compare.items.map((s) => bySlug.get(`product:${s}`) || { name: s });
  const head = ['Parametr', ...items.map((it) => it.slug ? `<a href="${urlOf(it)}">${esc(it.name)}</a>` : esc(it.name))];
  const rows = e.compare.dimensions.map((d) => [d.name, ...d.values]);
  return `<section class="section-block"><h2>Srovnání s podobnými produkty</h2><div class="table-wrap"><table class="compare"><thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows
    .map((r) => `<tr>${r.map((c, i) => i === 0 ? `<th scope="row">${esc(c)}</th>` : `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></section>`;
}
function inciBlock(e) {
  if (!e.inci) return '';
  return `<section class="section-block"><details class="faq-item inci"><summary>Kompletní INCI složení</summary><div class="faq-a"><p class="small">${esc(e.inci)}</p></div></details></section>`;
}

/* ---- Technologie: encyklopedické bloky ---- */
function techAdvisor(e) {
  const data = { name: e.name, effectiveness: e.effectiveness || {}, home: e.homeUse || '', cost: (e.compareAttrs && e.compareAttrs.naklady) || '', ages: [...(e._rel.ageGroup || [])], skins: [...(e._rel.skinType || [])] };
  return `<section class="section-block tech-advisor" data-tech="${attr(JSON.stringify(data))}">
    <h2>Je tato technologie vhodná právě pro vás?</h2>
    <div class="ta-controls"></div>
    <div class="ta-result"></div>
  </section>`;
}
function effectivenessBlock(e) {
  if (!e.effectiveness || !Object.keys(e.effectiveness).length) return '';
  const entries = Object.entries(e.effectiveness).sort((a, b) => b[1] - a[1]);
  const rows = entries.map(([k, v]) => `<tr><td>${esc(CONCERN_LABEL[k] || k)}</td><td class="stars-cell">${stars(v)}</td></tr>`).join('');
  return `<section class="section-block"><h2>Na co technologie funguje</h2><div class="table-wrap"><table class="eff-table"><tbody>${rows}</tbody></table></div><p class="muted small">★ = nízká účinnost, ★★★★★ = vysoká. Vychází z dostupných důkazů a klinické praxe.</p></section>`;
}
function evidenceBlock(e) {
  if (!e.evidenceStars) return '';
  return `<section class="section-block"><h2>Síla vědeckých důkazů</h2><p class="ev-stars">${stars(e.evidenceStars)} <strong>${esc(e.evidenceWord || '')}</strong></p>${e.evidenceSummary ? `<p class="muted">${esc(e.evidenceSummary)}</p>` : ''}</section>`;
}
function techCombine(e) {
  const groups = [['ingredient', 'Ingredience'], ['product', 'Produkty'], ['procedure', 'Procedury'], ['routine', 'Rutiny'], ['skinType', 'Typy pleti'], ['problem', 'Problémy']];
  let inner = '';
  for (const [t, label] of groups) {
    const set = e._rel[t]; if (!set || !set.size) continue;
    const items = [...set].map((s) => bySlug.get(`${t}:${s}`)).filter(Boolean);
    if (!items.length) continue;
    inner += `<div class="rel-group"><h3 class="rel-h">${label}</h3><div class="chips">${items.map((it) => `<a class="chip" href="${urlOf(it)}">${esc(it.name)}</a>`).join('')}</div></div>`;
  }
  if (!inner) return '';
  return `<section class="section-block"><h2>Jak kombinovat</h2><p class="muted small">Technologii propojte s těmito látkami, produkty a postupy pro lepší a komplexnější výsledky.</p>${inner}</section>`;
}
function techDevices(e) {
  const cats = e.deviceCategories || [];
  let prods = entitiesByType('product').filter((p) => cats.includes(p.category));
  const relSet = e._rel.product;
  if (relSet) for (const s of relSet) { const p = bySlug.get(`product:${s}`); if (p && prods.indexOf(p) < 0) prods.push(p); }
  if (!prods.length) return `<section class="section-block"><h2>Doporučená zařízení</h2><p class="muted">Konkrétní zařízení pro tuto technologii zatím doplňujeme do databáze.</p></section>`;
  const sc = (p) => (p.scores && p.scores.overall ? p.scores.overall.score : 0);
  const pot = (p) => (p.scores && p.scores.potency ? p.scores.potency.score : 0);
  const priceNum = (p) => { const m = String(p.price || '').replace(/\s/g, '').match(/\d+/); return m ? +m[0] : Infinity; };
  const best = [...prods].sort((a, b) => sc(b) - sc(a))[0];
  const cheapest = [...prods].sort((a, b) => priceNum(a) - priceNum(b))[0];
  const value = [...prods].sort((a, b) => (sc(b) / Math.max(1, priceNum(b))) - (sc(a) / Math.max(1, priceNum(a))))[0];
  const powerful = [...prods].sort((a, b) => pot(b) - pot(a) || priceNum(b) - priceNum(a))[0];
  const beginner = [...prods].sort((a, b) => priceNum(a) - priceNum(b)).find((p) => sc(p) >= 6) || cheapest;
  const picks = [['Nejvyšší skóre podle metodiky AntiAgeLab', best], ['Nejlepší poměr cena/výkon', value], ['Doporučeno pro začátečníky', beginner], ['Nejvýkonnější / profi', powerful], ['Nejdostupnější doporučená', cheapest]];
  const cards = picks.filter(([, p]) => p).map(([label, p]) => `<div class="pick"><span class="pick-label">${esc(label)}</span><a class="pick-card" href="${urlOf(p)}"><strong>${esc(p.name)}</strong><span class="muted small">${esc(p.price || '')}${p.scores && p.scores.overall ? ' · ' + p.scores.overall.score + '/10' : ''}</span></a></div>`).join('');
  const all = prods.map((p) => `<a class="chip" href="${urlOf(p)}">${esc(p.name)}</a>`).join('');
  return `<section class="section-block"><h2>Doporučená zařízení</h2><p class="muted small">Produkty jsou až poslední vrstvou — nejdřív pochopte technologii, pak vybírejte zařízení. Tipy podle účelu:</p><div class="picks">${cards}</div><h3>Všechna zařízení v databázi</h3><div class="chips">${all}</div></section>`;
}
function techComparisons(e) {
  const alts = (e.alternativeTech || []).map((s) => bySlug.get(`technology:${s}`)).filter(Boolean);
  if (!alts.length || !e.compareAttrs) return '';
  const tables = alts.map((alt) => {
    const ca = e.compareAttrs || {}, cb = alt.compareAttrs || {};
    const dims = [
      ['Hloubka působení', ca.hloubka, cb.hloubka],
      ['Bolestivost', ca.bolestivost, cb.bolestivost],
      ['Doba regenerace', ca.regenerace, cb.regenerace],
      ['Domácí použití', ca.domaci, cb.domaci],
      ['Vhodnost pro citlivou pleť', ca.citliva, cb.citliva],
      ['Rychlost výsledků', ca.rychlost, cb.rychlost],
      ['Finanční náročnost', ca.naklady, cb.naklady],
      ['Síla důkazů', e.evidenceStars ? stars(e.evidenceStars) : '—', alt.evidenceStars ? stars(alt.evidenceStars) : '—'],
    ];
    const rows = dims.map(([n, a, b]) => `<tr><th scope="row">${esc(n)}</th><td>${a || '—'}</td><td>${b || '—'}</td></tr>`).join('');
    return `<h3>${esc(e.name)} vs ${esc(alt.name)}</h3><div class="table-wrap"><table class="compare"><thead><tr><th>Parametr</th><th><a href="${urlOf(e)}">${esc(e.name)}</a></th><th><a href="${urlOf(alt)}">${esc(alt.name)}</a></th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }).join('');
  return `<section class="section-block"><h2>Porovnání s jinými technologiemi</h2>${tables}</section>`;
}
function techFinalReco(e) {
  const pick = (t, n) => [...(e._rel[t] || [])].map((s) => bySlug.get(`${t}:${s}`)).filter(Boolean).slice(0, n);
  const row = (label, items) => items.length ? `<div class="rel-group"><h3 class="rel-h">${label}</h3><div class="chips">${items.map((it) => `<a class="chip" href="${urlOf(it)}">${esc(it.name)}</a>`).join('')}</div></div>` : '';
  const blocks = [
    row('Vhodné ingredience', pick('ingredient', 5)),
    row('Doporučené rutiny', pick('routine', 3)),
    row('Související procedury', pick('procedure', 4)),
    row('Související články', pick('article', 3)),
    row('Alternativní technologie', (e.alternativeTech || []).map((s) => bySlug.get(`technology:${s}`)).filter(Boolean)),
  ].join('');
  if (!blocks.trim()) return '';
  return `<section class="section-block final-reco"><div class="graph-head"><span class="eyebrow">Shrnutí</span><h2>Pokud jste dočetli až sem…</h2><p class="muted">Tady je vše, co k této technologii doporučujeme prozkoumat dál.</p></div>${blocks}</section>`;
}
/* ---- Doplňky stravy: encyklopedické bloky + právní compliance ---- */
function suppAdvisor(e) {
  const data = { name: e.name, effectiveness: e.effectiveness || {}, ages: [...(e._rel.ageGroup || [])], skins: [...(e._rel.skinType || [])] };
  return `<section class="section-block supp-advisor" data-supp="${attr(JSON.stringify(data))}">
    <h2>Je tento doplněk vhodný právě pro vás?</h2>
    <p class="muted small">Orientační průvodce. Nejde o lékařskou radu — doplněk stravy nenahrazuje pestrou stravu, zdravý životní styl ani lékařskou péči.</p>
    <div class="ta-controls"></div>
    <div class="ta-result"></div>
  </section>`;
}
function suppEffectivenessBlock(e) {
  if (!e.effectiveness || !Object.keys(e.effectiveness).length) return '';
  const entries = Object.entries(e.effectiveness).sort((a, b) => b[1] - a[1]);
  const rows = entries.map(([k, v]) => `<tr><td>${esc(CONCERN_LABEL[k] || k)}</td><td class="stars-cell">${stars(v)}</td></tr>`).join('');
  return `<section class="section-block"><h2>Na co se podle dostupného výzkumu zkoumá</h2><div class="table-wrap"><table class="eff-table"><tbody>${rows}</tbody></table></div><p class="muted small">★ = slabá/nejistá opora ve výzkumu, ★★★★★ = silná. Jde o míru vědecké opory pro danou oblast, nikoli o příslib výsledku ani léčebné tvrzení.</p></section>`;
}
function legalBlock(e) {
  const l = e.legal;
  if (!l) return '';
  const approved = (l.approved && l.approved.length)
    ? `<div class="legal-col legal--ok"><h3>Schválená zdravotní tvrzení (EU)</h3><ul class="rich-list">${l.approved.map((a) => `<li>${esc(a)}</li>`).join('')}</ul></div>`
    : `<div class="legal-col legal--none"><h3>Schválená zdravotní tvrzení (EU)</h3><p>Pro tuto látku <strong>neexistuje žádné zdravotní tvrzení schválené Evropskou komisí</strong> v souvislosti s pletí či anti-agingem. Konkrétní zdravotní přínos proto nelze uvádět jako fakt.</p></div>`;
  const notAllowed = (l.notAllowed && l.notAllowed.length)
    ? `<div class="legal-col legal--bad"><h3>Tvrzení, která nelze použít</h3><ul class="rich-list">${l.notAllowed.map((a) => `<li>${esc(a)}</li>`).join('')}</ul></div>` : '';
  const wording = l.safeWording ? `<div class="legal-row"><h3>Bezpečná formulace</h3><p>${esc(l.safeWording)}</p></div>` : '';
  const limits = l.limits ? `<div class="legal-row"><h3>Limity důkazů</h3><p>${esc(l.limits)}</p></div>` : '';
  const disc = l.disclaimer ? `<p class="legal-disclaimer small">${esc(l.disclaimer)}</p>` : '';
  return `<section class="section-block legal-block">
    <div class="graph-head"><span class="eyebrow">Transparentnost</span><h2>Legislativní kontrola tvrzení</h2>
    <p class="muted">Řídíme se nařízeními EU č. 1924/2006 a 432/2012. Používáme pouze zdravotní tvrzení schválená Evropskou komisí a nikdy léčebná tvrzení.</p></div>
    <div class="legal-grid">${approved}${notAllowed}</div>${wording}${limits}${disc}</section>`;
}
function suppComparisons(e) {
  const alts = (e.alternativeSupps || []).map((s) => bySlug.get(`supplement:${s}`)).filter(Boolean);
  if (!alts.length || !e.compareAttrs) return '';
  const tables = alts.map((alt) => {
    const ca = e.compareAttrs || {}, cb = alt.compareAttrs || {};
    const dims = [
      ['Mechanismus', ca.mechanismus, cb.mechanismus],
      ['Hlavní oblast', ca.oblast, cb.oblast],
      ['Rychlost projevu', ca.rychlost, cb.rychlost],
      ['Bezpečnost', ca.bezpecnost, cb.bezpecnost],
      ['Cena', ca.cena, cb.cena],
      ['Síla důkazů', e.evidenceStars ? stars(e.evidenceStars) : '—', alt.evidenceStars ? stars(alt.evidenceStars) : '—'],
    ];
    const rows = dims.map(([n, a, b]) => `<tr><th scope="row">${esc(n)}</th><td>${a || '—'}</td><td>${b || '—'}</td></tr>`).join('');
    return `<h3>${esc(e.name)} vs ${esc(alt.name)}</h3><div class="table-wrap"><table class="compare"><thead><tr><th>Parametr</th><th><a href="${urlOf(e)}">${esc(e.name)}</a></th><th><a href="${urlOf(alt)}">${esc(alt.name)}</a></th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }).join('');
  return `<section class="section-block"><h2>Srovnání s podobnými doplňky</h2>${tables}</section>`;
}
function suppProducts(e) {
  const relSet = e._rel.product;
  let prods = [];
  if (relSet) for (const s of relSet) { const p = bySlug.get(`product:${s}`); if (p) prods.push(p); }
  if (!prods.length) return `<section class="section-block"><h2>Doporučené přípravky</h2><p class="muted">Konkrétní přípravky s touto látkou zatím doplňujeme do databáze.</p></section>`;
  const sc = (p) => (p.scores && p.scores.overall ? p.scores.overall.score : 0);
  const ql = (p) => (p.scores && p.scores.quality ? p.scores.quality.score : 0);
  const priceNum = (p) => { const m = String(p.price || '').replace(/\s/g, '').match(/\d+/); return m ? +m[0] : Infinity; };
  // Každé kritérium dostane odlišný produkt (nejlepší dosud nevybraný)
  const seen = new Set();
  const take = (sortFn) => { const p = [...prods].filter((x) => !seen.has(x.slug)).sort(sortFn)[0]; if (p) seen.add(p.slug); return p; };
  const picks = [
    ['Nejvyšší skóre podle metodiky AntiAgeLab', take((a, b) => sc(b) - sc(a))],
    ['Nejlepší poměr cena/přínos', take((a, b) => (sc(b) / Math.max(1, priceNum(b))) - (sc(a) / Math.max(1, priceNum(a))))],
    ['Nejčistší složení', take((a, b) => ql(b) - ql(a))],
    ['Nejdostupnější', take((a, b) => priceNum(a) - priceNum(b))],
  ];
  const cards = picks.filter(([, p]) => p).map(([label, p]) => `<div class="pick"><span class="pick-label">${esc(label)}</span><a class="pick-card" href="${urlOf(p)}"><strong>${esc(p.name)}</strong><span class="muted small">${esc(p.price || '')}${p.scores && p.scores.overall ? ' · ' + p.scores.overall.score + '/10' : ''}</span></a></div>`).join('');
  const all = prods.map((p) => `<a class="chip" href="${urlOf(p)}">${esc(p.name)}</a>`).join('');
  return `<section class="section-block"><h2>Doporučené přípravky</h2><p class="muted small">Přípravky jsou poslední vrstvou — nejdřív pochopte látku a důkazy, pak vybírejte konkrétní produkt. Tipy podle účelu:</p><div class="picks">${cards}</div><h3>Všechny přípravky v databázi</h3><div class="chips">${all}</div></section>`;
}

/* ---- Obličejová jóga: animovaný SVG náčrtek (bez fotek/videí) ---- */
const FY_GOLD = 'var(--gold-deep,#b8893a)';
// Souřadnice partií v prostoru portrétu (viewBox 0 0 300 360)
const FY_ZONES = {
  celo: [{ cx: 150, cy: 100, rx: 40, ry: 16 }],
  oboci: [{ cx: 150, cy: 124, rx: 14, ry: 8 }],
  oci: [{ cx: 127, cy: 142, rx: 20, ry: 11 }, { cx: 173, cy: 142, rx: 20, ry: 11 }],
  tvare: [{ cx: 122, cy: 172, rx: 17, ry: 16 }, { cx: 178, cy: 172, rx: 17, ry: 16 }],
  usta: [{ cx: 150, cy: 196, rx: 26, ry: 14 }],
  celist: [{ cx: 118, cy: 212, rx: 15, ry: 13 }, { cx: 182, cy: 212, rx: 15, ry: 13 }],
  podbradek: [{ cx: 150, cy: 232, rx: 24, ry: 11 }],
  krk: [{ cx: 150, cy: 265, rx: 24, ry: 22 }],
};
const FY_LINE = '#8a6f57', FY_LIP = '#c98f7e';
// Realistický editorial portrét (jednotné defs s pevnými id — identické napříč SVG)
const FY_DEFS = `<defs>
<linearGradient id="fySkin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6ddc4"/><stop offset="1" stop-color="#e6c0a0"/></linearGradient>
<linearGradient id="fyHair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c79c63"/><stop offset="1" stop-color="#9c7641"/></linearGradient>
<radialGradient id="fyBlush" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#e9b59c" stop-opacity="0.6"/><stop offset="1" stop-color="#e9b59c" stop-opacity="0"/></radialGradient>
<linearGradient id="fyHand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6ddc4"/><stop offset="1" stop-color="#ecc6a6"/></linearGradient>
</defs>`;
const FY_PORTRAIT = `
<path d="M150 36 C96 36 64 78 64 150 C64 210 70 268 84 320 L116 320 C100 270 96 220 100 176 C150 150 150 150 200 176 C204 220 200 270 184 320 L216 320 C230 268 236 210 236 150 C236 78 204 36 150 36 Z" fill="url(#fyHair)"/>
<path d="M126 224 L122 288 C122 300 136 306 150 306 C164 306 178 300 178 288 L174 224 Z" fill="url(#fySkin)" stroke="${FY_LINE}" stroke-width="1.4"/>
<path d="M128 250 C140 262 160 262 172 250" fill="none" stroke="${FY_LINE}" stroke-width="1" opacity="0.5"/>
<path d="M60 352 C84 312 110 298 150 298 C190 298 216 312 240 352" fill="none" stroke="${FY_LINE}" stroke-width="1.4"/>
<path d="M150 64 C110 64 92 96 92 142 C92 190 110 226 150 238 C190 226 208 190 208 142 C208 96 190 64 150 64 Z" fill="url(#fySkin)" stroke="${FY_LINE}" stroke-width="1.5"/>
<path d="M92 146 C84 144 82 156 90 162" fill="url(#fySkin)" stroke="${FY_LINE}" stroke-width="1.3"/>
<path d="M208 146 C216 144 218 156 210 162" fill="url(#fySkin)" stroke="${FY_LINE}" stroke-width="1.3"/>
<path d="M92 142 C90 100 108 60 150 56 C192 60 210 100 208 142 C206 120 196 92 168 84 C160 100 140 100 132 84 C104 92 94 120 92 142 Z" fill="url(#fyHair)"/>
<ellipse cx="118" cy="170" rx="16" ry="11" fill="url(#fyBlush)"/><ellipse cx="182" cy="170" rx="16" ry="11" fill="url(#fyBlush)"/>
<path d="M110 128 Q126 119 144 126" fill="none" stroke="${FY_LINE}" stroke-width="2.4" stroke-linecap="round"/>
<path d="M156 126 Q174 119 190 128" fill="none" stroke="${FY_LINE}" stroke-width="2.4" stroke-linecap="round"/>
<path d="M112 142 Q126 132 142 142 Q126 150 112 142 Z" fill="#fff" stroke="${FY_LINE}" stroke-width="1.5"/>
<path d="M158 142 Q174 132 188 142 Q174 150 158 142 Z" fill="#fff" stroke="${FY_LINE}" stroke-width="1.5"/>
<circle cx="127" cy="142" r="4.4" fill="#6b4f3a"/><circle cx="173" cy="142" r="4.4" fill="#6b4f3a"/>
<path d="M112 142 Q126 131 142 141" fill="none" stroke="${FY_LINE}" stroke-width="2" stroke-linecap="round"/>
<path d="M158 141 Q174 131 188 142" fill="none" stroke="${FY_LINE}" stroke-width="2" stroke-linecap="round"/>
<path d="M150 146 L144 176 Q150 182 156 176" fill="none" stroke="${FY_LINE}" stroke-width="1.4" stroke-linecap="round"/>
<path d="M134 196 Q142 189 150 193 Q158 189 166 196 Q158 203 150 203 Q142 203 134 196 Z" fill="${FY_LIP}" stroke="${FY_LINE}" stroke-width="1.2"/>
<path d="M134 196 Q150 199 166 196" fill="none" stroke="${FY_LINE}" stroke-width="1"/>`;
const fyN = (n) => (+n).toFixed(1);
// Ruce
function fyHbar(x1, x2, y, t) { const r = t / 2; return `<rect x="${fyN(Math.min(x1, x2))}" y="${fyN(y - r)}" width="${fyN(Math.abs(x2 - x1))}" height="${t}" rx="${r}" fill="url(#fyHand)" stroke="${FY_LINE}" stroke-width="1.2"/>`; }
function fyVf(x, yBase, L, t) { const r = t / 2; return `<rect x="${fyN(x - r)}" y="${fyN(yBase - L)}" width="${t}" height="${fyN(L)}" rx="${r}" fill="url(#fyHand)" stroke="${FY_LINE}" stroke-width="1.2"/>`; }
function fyPalm(cx, cy, rx, ry, rot = 0) { return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${cx} ${cy})" fill="url(#fyHand)" stroke="${FY_LINE}" stroke-width="1.3"/>`; }
function fySide(palmX, palmY, reachX, ys, t, rot) { let s = fyPalm(palmX, palmY, 16, 21, rot); for (const y of ys) s += fyHbar(palmX, reachX, y, t); return s; }
const FY_POSE = {
  celo: () => fySide(92, 114, 150, [104, 114, 124], 7, 12) + fySide(208, 114, 150, [104, 114, 124], 7, -12),
  oboci: () => fySide(92, 120, 150, [114, 124], 7, 10) + fySide(208, 120, 150, [114, 124], 7, -10),
  oci: () => fySide(90, 140, 120, [136, 146], 6.5, 6) + fySide(210, 140, 180, [136, 146], 6.5, -6),
  tvare: () => fySide(88, 176, 126, [168, 178, 188], 7, 4) + fySide(212, 176, 174, [168, 178, 188], 7, -4),
  usta: () => fySide(92, 196, 134, [193, 201], 6.5, 4) + fySide(208, 196, 166, [193, 201], 6.5, -4),
  celist: () => fyPalm(116, 256, 16, 20, -6) + fyPalm(184, 256, 16, 20, 6) + fyVf(112, 234, 28, 7) + fyVf(126, 236, 26, 7) + fyVf(174, 236, 26, 7) + fyVf(188, 234, 28, 7),
  podbradek: () => fyPalm(150, 300, 28, 22, 0) + fyHbar(130, 170, 242, 9) + fyHbar(132, 168, 252, 9),
  krk: () => fyPalm(150, 320, 30, 20, 0) + fyVf(132, 304, 42, 7) + fyVf(144, 300, 46, 7) + fyVf(156, 300, 46, 7) + fyVf(168, 304, 42, 7),
};
function fyArrow(x1, y1, x2, y2) {
  const a = Math.atan2(y2 - y1, x2 - x1), h = 8, w = 0.5;
  const hx1 = x2 - h * Math.cos(a - w), hy1 = y2 - h * Math.sin(a - w);
  const hx2 = x2 - h * Math.cos(a + w), hy2 = y2 - h * Math.sin(a + w);
  return `<path class="fy-arrow" d="M${fyN(x1)} ${fyN(y1)} L${fyN(x2)} ${fyN(y2)}"/><path class="fy-head" d="M${fyN(hx1)} ${fyN(hy1)} L${fyN(x2)} ${fyN(y2)} L${fyN(hx2)} ${fyN(hy2)}"/>`;
}
function fyMotion(zoneKey, move) {
  const centers = FY_ZONES[zoneKey] || FY_ZONES.tvare;
  let out = '';
  for (const c of centers) {
    const sign = c.cx < 147 ? -1 : c.cx > 153 ? 1 : 0;
    const central = sign === 0;
    if (move === 'up') out += fyArrow(c.cx, c.cy + c.ry + 16, c.cx, c.cy - c.ry - 16);
    else if (move === 'down') out += fyArrow(c.cx, c.cy - c.ry - 11, c.cx, c.cy + c.ry + 22);
    else if (move === 'out') {
      if (central) { out += fyArrow(c.cx - c.rx, c.cy, c.cx - c.rx - 26, c.cy); out += fyArrow(c.cx + c.rx, c.cy, c.cx + c.rx + 26, c.cy); }
      else out += fyArrow(c.cx + sign * c.rx, c.cy, c.cx + sign * (c.rx + 28), c.cy);
    } else if (move === 'in') {
      if (central) { out += fyArrow(c.cx - c.rx - 26, c.cy, c.cx - c.rx - 3, c.cy); out += fyArrow(c.cx + c.rx + 26, c.cy, c.cx + c.rx + 3, c.cy); }
      else out += fyArrow(c.cx + sign * (c.rx + 28), c.cy, c.cx + sign * (c.rx + 3), c.cy);
    } else if (move === 'smile') {
      out += fyArrow(c.cx - 26, c.cy + 8, c.cx - 38, c.cy - 14);
      out += fyArrow(c.cx + 26, c.cy + 8, c.cx + 38, c.cy - 14);
    } else if (move === 'circle') {
      const r = Math.max(c.rx, c.ry) + 11;
      out += `<circle class="fy-circle" cx="${c.cx}" cy="${c.cy}" r="${fyN(r)}" fill="none"/>`;
      out += fyArrow(c.cx + r - 0.1, c.cy - 5, c.cx + r + 0.1, c.cy + 5);
    } else if (move === 'pulse') {
      const r0 = Math.max(c.rx, c.ry);
      for (const b of ['0s', '0.95s']) out += `<circle cx="${c.cx}" cy="${c.cy}" r="${fyN(r0)}" fill="none" stroke="${FY_GOLD}" class="fy-ringline"><animate attributeName="r" from="${fyN(r0)}" to="${fyN(r0 + 20)}" dur="1.9s" begin="${b}" repeatCount="indefinite"/><animate attributeName="opacity" from="0.65" to="0" dur="1.9s" begin="${b}" repeatCount="indefinite"/></circle>`;
    } else if (move === 'press') {
      out += fyArrow(c.cx, c.cy - c.ry - 20, c.cx, c.cy - c.ry - 5);
    }
  }
  return out;
}
// phase: 'start' (portrét+ruce) · 'move' (+partie+šipky) · 'hold' (+partie) · 'anim' (partie+šipky, bez rukou)
function faceYogaSvg(e, opts = {}) {
  if (typeof opts === 'string') opts = { cls: opts };
  const { cls = '', phase = 'hold', animated = true } = opts;
  const il = e.illu || {};
  const hands = phase !== 'anim' ? (FY_POSE[il.zone] ? FY_POSE[il.zone]() : '') : '';
  const showZone = phase !== 'start';
  const showArrows = phase === 'move' || phase === 'anim';
  const zones = showZone ? (FY_ZONES[il.zone] || []).map((c) => `<ellipse class="fy-zone" cx="${c.cx}" cy="${c.cy}" rx="${c.rx}" ry="${c.ry}"/>`).join('') : '';
  const motion = showArrows ? fyMotion(il.zone, il.move) : '';
  const title = esc(`Ilustrace cviku: ${e.name}`);
  const klass = `fy-illu ${cls}${animated ? '' : ' fy-illu--static'}`.trim();
  return `<svg class="${klass}" viewBox="0 0 300 360" role="img" aria-label="${title}" xmlns="http://www.w3.org/2000/svg"><title>${title}</title>${FY_DEFS}${FY_PORTRAIT}${zones}${motion}${hands}</svg>`;
}

/* Zapojené svaly — portrét se zvýrazněním svalu (korálově) */
const FY_MUSCLE = {
  celo: { name: 'Frontalis (čelní sval)', desc: 'Zvedá obočí a vytváří vodorovné vrásky na čele.', shape: '<rect x="112" y="84" width="28" height="36" rx="13"/><rect x="160" y="84" width="28" height="36" rx="13"/>' },
  oboci: { name: 'Corrugator a procerus (mračicí svaly)', desc: 'Stahují obočí k sobě a tvoří svislou „lví" vrásku.', shape: '<rect x="142" y="116" width="16" height="22" rx="6"/><ellipse cx="132" cy="126" rx="6" ry="9"/><ellipse cx="168" cy="126" rx="6" ry="9"/>' },
  oci: { name: 'Orbicularis oculi (kruhový oční sval)', desc: 'Zavírá víčka a podílí se na vějířcích v koutcích očí.', shape: '<ellipse cx="127" cy="142" rx="22" ry="15"/><ellipse cx="173" cy="142" rx="22" ry="15"/>' },
  tvare: { name: 'Zygomatické svaly (lícní svaly)', desc: 'Zvedají koutky úst a tváře při úsměvu.', shape: '<ellipse cx="120" cy="168" rx="12" ry="24" transform="rotate(26 120 168)"/><ellipse cx="180" cy="168" rx="12" ry="24" transform="rotate(-26 180 168)"/>' },
  usta: { name: 'Orbicularis oris (kruhový sval ústní)', desc: 'Obkružuje ústa a řídí mimiku rtů.', shape: '<ellipse cx="150" cy="196" rx="26" ry="17"/>' },
  celist: { name: 'Masseter (žvýkací sval)', desc: 'Mohutný sval podél čelisti; ovlivňuje její linii a napětí.', shape: '<ellipse cx="112" cy="200" rx="12" ry="24" transform="rotate(20 112 200)"/><ellipse cx="188" cy="200" rx="12" ry="24" transform="rotate(-20 188 200)"/>' },
  podbradek: { name: 'Suprahyoidní svaly a platysma', desc: 'Svaly dna úst a krku, které formují linii podbradku.', shape: '<ellipse cx="150" cy="230" rx="26" ry="13"/>' },
  krk: { name: 'Platysma (krční sval)', desc: 'Plochý krční sval ovlivňující přední stranu krku a čelist.', shape: '<rect x="124" y="240" width="52" height="46" rx="14"/>' },
};
function faceMuscleSvg(zoneKey) {
  const m = FY_MUSCLE[zoneKey] || FY_MUSCLE.celo;
  return `<svg class="fy-illu" viewBox="0 0 300 360" role="img" aria-label="${esc('Zapojený sval: ' + m.name)}" xmlns="http://www.w3.org/2000/svg"><title>${esc(m.name)}</title>${FY_DEFS}${FY_PORTRAIT}<g class="fy-muscle-shape">${m.shape}</g></svg>`;
}

/* Malé ikony pro layout (clock/refresh/check/x/calendar/play/info/kombinace) */
const FYI = {
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v4h-4"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 9h16M8 3v4M16 3v4"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M10 8.5l5 3.5-5 3.5z" fill="currentColor" stroke="none"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="8" r="1" fill="currentColor" stroke="none"/></svg>',
  dropper: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="18" y="16" width="12" height="22" rx="3"/><path d="M21 16v-3h6v3"/><path d="M21 23h6"/></svg>',
  mask: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c-2 2-3 6-3 11s2 11 12 11 12-6 12-11-1-9-3-11c-3 2-6 3-9 3s-6-1-9-3z"/><g fill="currentColor" stroke="none"><circle cx="19" cy="23" r=".9"/><circle cx="24" cy="23" r=".9"/><circle cx="29" cy="23" r=".9"/></g></svg>',
  jar: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="14" y="18" width="20" height="18" rx="3"/><path d="M18 18v-3h12v3"/><path d="M20 27c2.5-2 5.5-2 8 0"/></svg>',
  sun: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="24" cy="24" r="8"/><path d="M24 8v5M24 35v5M8 24h5M35 24h5M13 13l3.5 3.5M31.5 31.5L35 35M35 13l-3.5 3.5M16.5 31.5L13 35"/></svg>',
  roller: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="18" cy="18" rx="8" ry="5" transform="rotate(-35 18 18)"/><path d="M22 22L33 33"/><circle cx="34" cy="34" r="2"/></svg>',
};
const FY_COMBINE_DESC = {
  retinol: 'Podpora obnovy pokožky', retinal: 'Rychlejší obnova pokožky', bakuchiol: 'Šetrná alternativa retinolu',
  peptidy: 'Podpora tvorby kolagenu', 'kyselina-hyaluronova': 'Hydratace a vypnutí pleti', 'vitamin-c': 'Antioxidant a rozjasnění',
  niacinamid: 'Zklidnění a posílení bariéry', kofein: 'Zmírnění otoků', aha: 'Jemná exfoliace a hladkost',
  'led-terapie': 'Stimulace kolagenu a elasticity', microneedling: 'Podpora tvorby kolagenu',
};
function fyCombineIcon(it) {
  if (it.slug === 'spf' || /spf|opalov/i.test(it.name)) return FYI.sun;
  if (it.type === 'technology') return FYI.mask;
  if (it.type === 'product') return /gua|roller|váleč|kámen/i.test(it.name) ? FYI.roller : FYI.jar;
  return FYI.dropper;
}
const FY_MOVE_MISTAKE = { up: ['Krčení očí nebo mračení'], smile: ['Vrásčení kolem očí'], circle: ['Příliš rychlé tření, které pleť dráždí'], pulse: ['Zadržování dechu a křeč'], press: ['Příliš silný a bolestivý tlak'], down: ['Předsun hlavy dopředu'], out: [], in: [] };
const FY_MOVE_HINT = { up: 'procvičovaná partie se zvedá nahoru', out: 'pohyb směřuje od středu do stran', in: 'pohyb směřuje dovnitř ke středu', down: 'tah směřuje dolů', smile: 'koutky se zvedají nahoru a ven', circle: 'veďte plynulý krouživý pohyb', pulse: 'opakované napětí a uvolnění', press: 'prsty přidržují, partie pracuje proti odporu' };
const FY_RESULTS = 'První změny můžete zaznamenat po 2–4 týdnech pravidelného cvičení. Výraznější zlepšení se dostavuje obvykle po 8–12 týdnech. Klíčová je pravidelnost a jemnost.';
function fyMistakes(e) {
  const move = e.illu?.move, usesFingers = (e.illu?.points || 0) > 0 || ['press', 'out', 'in', 'smile', 'up'].includes(move);
  const list = [e.mistake, ...(FY_MOVE_MISTAKE[move] || []), usesFingers ? 'Přitahování kůže prsty – prsty mají pohyb jen stabilizovat' : null, 'Zadržování dechu'];
  return [...new Set(list.filter(Boolean))].slice(0, 4);
}
function fyEvidence(e) {
  if (e.area === 'tvare') return { n: 3, word: 'Střední', desc: 'Randomizovaná studie (Alam, 2018) zaznamenala u pravidelného cvičení mírné zlepšení plnosti tváří. Celkově jsou ale důkazy zatím omezené.' };
  return { n: 2, word: 'Omezené', desc: 'Studie naznačují, že pravidelná obličejová jóga může zlepšit tonus svalů a vzhled pleti, přímých důkazů je ale zatím málo.' };
}
function fyCombineItems(e) {
  const out = [], seen = new Set();
  const add = (it) => { if (it && !seen.has(it.slug)) { seen.add(it.slug); out.push(it); } };
  for (const t of ['ingredient', 'technology', 'product']) {
    for (const s of (e._rel[t] || [])) { const it = bySlug.get(`${t}:${s}`); if (it) add(it); }
  }
  let items = out.slice(0, 3);
  // SPF je univerzální anti-aging priorita — přidáme vždy
  if (!items.some((it) => /spf|opalov/i.test(it.name))) {
    const spf = bySlug.get('product:spf-50-denni') || entitiesByType('product').find((p) => p.category === 'spf');
    items.push(spf ? { ...spf, _spf: true } : { name: 'SPF', slug: 'spf', type: 'product', _href: '/produkty/' });
  }
  return items.slice(0, 4).map((it) => ({
    name: /spf|opalov/i.test(it.name) ? (it.name.length > 16 ? 'SPF' : it.name) : it.name,
    href: it._href || urlOf(it),
    icon: fyCombineIcon(it),
    desc: /spf|opalov/i.test(it.name) ? 'Ochrana a prevence před fotostárnutím' : (FY_COMBINE_DESC[it.slug] || (it.type === 'technology' ? 'Doplňková technologie' : it.type === 'product' ? 'Vhodná pomůcka k masáži' : 'Vhodná aktivní látka')),
  }));
}
function renderFaceYoga(e) {
  const il = e.illu || {};
  const muscle = FY_MUSCLE[il.zone] || FY_MUSCLE.celo;
  const ev = fyEvidence(e);
  const stat = (icon, label, val) => `<div class="fy-stat"><span class="fy-stat-ic">${icon}</span><span class="fy-stat-tx"><span class="fy-stat-l">${esc(label)}</span><strong>${esc(val)}</strong></span></div>`;
  const steps = e.steps || [];
  const phaseTitles = ['Výchozí pozice', 'Proveďte pohyb', 'Vydržte a uvolněte'];
  const phaseKeys = ['start', 'move', 'hold'];
  const hasPhotos = Array.isArray(e.photos) && e.photos.length >= 3;
  const stepCards = [0, 1, 2].map((i) => {
    const text = i < 2 ? (steps[i] || steps[steps.length - 1]) : steps[steps.length - 1];
    const visual = hasPhotos
      ? `<img class="fy-step-photo" src="${attr(e.photos[i])}" alt="${attr(phaseTitles[i] + ' — ' + e.name)}" loading="lazy" width="340" height="382">`
      : faceYogaSvg(e, { cls: 'fy-illu--step', phase: phaseKeys[i], animated: false });
    return `<div class="fy-step"><span class="fy-step-illu${hasPhotos ? ' fy-step-illu--photo' : ''}">${visual}<span class="fy-step-num">${i + 1}</span></span><h3>${esc(phaseTitles[i])}</h3><p>${esc(typeof text === 'string' ? text : text.step)}</p></div>`;
  }).join('');
  const check = (items) => `<ul class="fy-list fy-list--check">${(items || []).map((x) => `<li><span class="fy-li-ic">${FYI.check}</span>${esc(x)}</li>`).join('')}</ul>`;
  const xlist = (items) => `<ul class="fy-list fy-list--x">${(items || []).map((x) => `<li><span class="fy-li-ic">${FYI.x}</span>${esc(x)}</li>`).join('')}</ul>`;
  const combine = fyCombineItems(e).map((c) => `<a class="fy-combine-item" href="${c.href}"><span class="fy-combine-ic">${c.icon}</span><strong>${esc(c.name)}</strong><span class="muted small">${esc(c.desc)}</span></a>`).join('');
  const desc = `Cvik aktivuje ${muscle.name.toLowerCase()} a cílí především na ${(e.targets && e.targets[0] ? e.targets[0].toLowerCase() : 'danou partii')}. Provádějte ho pomalu, jemně a pravidelně — efekt je postupný.`;

  return `<div class="container fy-sheet">
  <div class="fy-band fy-band--top">
    <section class="fy-cell fy-intro">
      <span class="eyebrow">Face yoga</span>
      <h1>${esc(e.h1 || e.name)}</h1>
      <p class="fy-sub">${esc(e.excerpt || '')}</p>
      <div class="fy-stats">
        ${stat(FYI.clock, 'Délka cviku', e.duration || '1–2 minuty')}
        ${stat(FYI.refresh, 'Opakování', e.frequency || e.reps || '')}
      </div>
      <p class="fy-desc">${esc(desc)}</p>
    </section>
    <section class="fy-cell fy-steps">
      <span class="eyebrow">Jak cvik provádět</span>
      <div class="fy-step-grid">${stepCards}</div>
    </section>
    <section class="fy-cell fy-muscle">
      <span class="eyebrow">Zapojené svaly</span>
      <div class="fy-muscle-illu${e.muscleImg ? ' fy-muscle-illu--photo' : ''}">${e.muscleImg ? `<img src="${attr(e.muscleImg)}" alt="${attr('Zapojený sval: ' + muscle.name)}" loading="lazy">` : faceMuscleSvg(il.zone)}</div>
      <div class="fy-muscle-legend"><span class="fy-dot"></span><strong>${esc(muscle.name)}</strong></div>
      <p class="muted small">${esc(muscle.desc)}</p>
    </section>
  </div>
  <div class="fy-band fy-band--mid">
    <section class="fy-cell"><span class="eyebrow">Benefity</span>${check(e.benefits)}</section>
    <section class="fy-cell"><span class="eyebrow">Časté chyby</span>${xlist(fyMistakes(e))}</section>
    <section class="fy-cell"><span class="eyebrow">Kdy očekávat výsledky</span><div class="fy-icontext"><span class="fy-it-ic">${FYI.calendar}</span><p>${esc(FY_RESULTS)}</p></div></section>
    <section class="fy-cell"><span class="eyebrow">Síla vědeckých důkazů</span><p class="fy-stars">${stars(ev.n)}</p><strong class="fy-ev-word">${esc(ev.word)}</strong><p class="muted small">${esc(ev.desc)}</p></section>
  </div>
  <div class="fy-band fy-band--low">
    <section class="fy-cell fy-anim">
      <span class="eyebrow">Animace cviku</span>
      <div class="fy-anim-illu">${faceYogaSvg(e, { cls: 'fy-illu--anim', phase: 'anim', animated: true })}</div>
      <div class="fy-icontext fy-play"><span class="fy-it-ic">${FYI.play}</span><p>Sledujte pohyb: ${esc(FY_MOVE_HINT[il.move] || 'sledujte směr šipek')}.</p></div>
    </section>
    <section class="fy-cell fy-combine">
      <span class="eyebrow">Kombinujte s</span>
      <div class="fy-combine-grid">${combine}</div>
    </section>
  </div>
  <div class="fy-note"><span class="fy-it-ic">${FYI.info}</span><div><strong>Důležité upozornění</strong><p class="muted small">Obličejová jóga nenahrazuje odbornou péči ani léčbu. Má zatím omezenou vědeckou oporu — berte ji jako příjemný doplněk dobré péče, hydratace a hlavně SPF. Při bolestech, kožních onemocněních nebo po estetických zákrocích se poraďte s lékařem.</p></div></div>
  ${renderFaq(e.faq)}
</div>`;
}

/* ---- Pilíře (pillar content) + propojení průvodce s databází ---- */
const PILLARS = {
  skola: 'Anti-aging škola', ingredience: 'Ingredience do hloubky', technologie: 'Technologie do hloubky',
  rutiny: 'Rutiny', problemy: 'Konkrétní problémy', srovnani: 'Srovnání',
};
function articleResources(e) {
  const groups = [['ingredient', 'Ingredience'], ['technology', 'Technologie'], ['product', 'Produkty'], ['supplement', 'Doplňky stravy'], ['procedure', 'Procedury'], ['routine', 'Rutiny'], ['comparison', 'Porovnání'], ['problem', 'Konkrétní problémy'], ['skinType', 'Typy pleti'], ['ageGroup', 'Péče podle věku'], ['study', 'Studie']];
  let inner = '';
  for (const [t, label] of groups) {
    const set = e._rel[t]; if (!set || !set.size) continue;
    const items = [...set].map((s) => bySlug.get(`${t}:${s}`)).filter(Boolean);
    if (!items.length) continue;
    inner += `<div class="rel-group"><h3 class="rel-h">${label}</h3><div class="chips">${items.map((it) => `<a class="chip" href="${urlOf(it)}">${esc(it.name)}</a>`).join('')}</div></div>`;
  }
  if (!inner) return '';
  return `<section class="section-block final-reco"><div class="graph-head"><span class="eyebrow">Z databáze AntiAgeLab</span><h2>Prozkoumejte do hloubky</h2><p class="muted">Tento průvodce je propojený s celou naší databází — pokračujte na detailní, ozdrojované stránky.</p></div>${inner}</section>`;
}

function comparisonTable(e) {
  const items = e.items.map((slug) => bySlugLoose.get(slug)).filter(Boolean);
  const names = items.map((it) => it ? `<a href="${urlOf(it)}">${esc(it.name)}</a>` : '');
  const head = ['Parametr', ...names];
  const rows = (e.dimensions || []).map((d) => [d.name, ...d.values]);
  return `<div class="table-wrap"><table class="compare"><thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows
    .map((r) => `<tr>${r.map((c, i) => i === 0 ? `<th scope="row">${esc(c)}</th>` : `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function renderDetail(e) {
  const tc = TYPES[e.type];
  const trail = [{ label: 'Domů', href: '/' }, { label: tc.many, href: tc.base }, { label: e.name, href: urlOf(e) }];
  if (e.type === 'faceYoga') {
    const faqLd = (e.faq && e.faq.length) ? { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: e.faq.map((q) => ({ '@type': 'Question', name: q.q, acceptedAnswer: { '@type': 'Answer', text: q.a } })) } : null;
    const pageLd = { '@context': 'https://schema.org', '@type': 'HowTo', name: e.name, description: e.metaDescription, url: SITE.url + urlOf(e), step: (e.steps || []).map((s, i) => ({ '@type': 'HowToStep', position: i + 1, text: typeof s === 'string' ? s : s.step })) };
    return layout({
      title: e.title || `${e.name} | ${SITE.name}`,
      description: e.metaDescription || e.excerpt || SITE.description,
      canonical: urlOf(e),
      breadcrumbTrail: trail,
      image: ogImageFor(e),
      jsonld: [pageLd, faqLd].filter(Boolean),
      body: renderFaceYoga(e) + `<div class="container fy-related">${relatedSection(e)}</div>`,
    });
  }
  const heroImg = HERO_IMG_TYPES.has(e.type) ? entityImage(e, { cls: 'detail-hero-img' }) : '';
  const hero = `<section class="detail-hero${heroImg ? ' has-img' : ''}"><div class="container detail-hero-grid">
    <div class="detail-hero-copy">
      <span class="eyebrow">${esc(tc.one)}</span>
      <div class="detail-hero-top">
        <h1>${esc(e.h1 || e.name)}</h1>
        ${e.evidenceLevel ? evidenceBadge(e.evidenceLevel) : ''}
      </div>
      <p class="lead">${esc(e.excerpt || '')}</p>
    </div>
    ${heroImg}
  </div></section>`;

  const article = `<div class="container detail-layout">
    <article class="detail-main">
      ${detailExtras(e)}
      ${e.body ? renderBlocks(e.body) : ''}
      ${e.type === 'article' ? articleResources(e) : ''}
      ${renderFaq(e.faq)}
      ${sourcesBlock(e)}
      ${e.type === 'technology' ? techFinalReco(e) : ''}
      ${e.type === 'supplement' ? suppFinalReco(e) : ''}
      ${['ingredient', 'procedure'].includes(e.type) ? maybeInstead(e) : ''}
      ${['ingredient', 'technology', 'supplement', 'procedure', 'article'].includes(e.type) ? nextStep(e) : ''}
    </article>
    <aside class="detail-aside">
      ${relatedSection(e)}
    </aside>
  </div>`;

  const faqLd = (e.faq && e.faq.length) ? {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: e.faq.map((q) => ({ '@type': 'Question', name: q.q, acceptedAnswer: { '@type': 'Answer', text: q.a } })),
  } : null;
  let pageLd;
  if (e.type === 'product') {
    pageLd = { '@context': 'https://schema.org', '@type': 'Product', name: e.name, description: e.metaDescription, url: SITE.url + urlOf(e), category: categoryLabel(e.category || '') };
    if (e.brand && e.brand !== '—') pageLd.brand = { '@type': 'Brand', name: e.brand };
    if (e.scores && e.scores.overall) pageLd.review = { '@type': 'Review', reviewRating: { '@type': 'Rating', ratingValue: e.scores.overall.score, bestRating: 10 }, author: { '@type': 'Organization', name: SITE.name }, reviewBody: e.scores.overall.note || e.excerpt || '' };
  } else {
    pageLd = { '@context': 'https://schema.org', '@type': e.type === 'article' ? 'Article' : 'MedicalWebPage', name: e.name, description: e.metaDescription, url: SITE.url + urlOf(e) };
  }

  return layout({
    title: e.title || `${e.name} | ${SITE.name}`,
    description: e.metaDescription || e.excerpt || SITE.description,
    canonical: urlOf(e),
    breadcrumbTrail: trail,
    image: ogImageFor(e),
    jsonld: [pageLd, faqLd].filter(Boolean),
    body: hero + article + (e.type === 'technology' ? '<script src="/assets/js/tech-advisor.js" defer></script>' : e.type === 'supplement' ? '<script src="/assets/js/supplement-advisor.js" defer></script>' : ''),
  });
}
function suppFinalReco(e) {
  const pick = (t, n) => [...(e._rel[t] || [])].map((s) => bySlug.get(`${t}:${s}`)).filter(Boolean).slice(0, n);
  const row = (label, items) => items.length ? `<div class="rel-group"><h3 class="rel-h">${label}</h3><div class="chips">${items.map((it) => `<a class="chip" href="${urlOf(it)}">${esc(it.name)}</a>`).join('')}</div></div>` : '';
  const blocks = [
    row('Související ingredience pro pleť', pick('ingredient', 5)),
    row('Doporučené rutiny', pick('routine', 3)),
    row('Vhodné pro problém', pick('problem', 4)),
    row('Alternativní doplňky', (e.alternativeSupps || []).map((s) => bySlug.get(`supplement:${s}`)).filter(Boolean)),
  ].join('');
  if (!blocks.trim()) return '';
  return `<section class="section-block final-reco"><div class="graph-head"><span class="eyebrow">Shrnutí</span><h2>Co s tímto doplňkem dál</h2><p class="muted">Pleť se buduje zvenčí i zevnitř — doplněk je jen jedním dílkem. Tady je, co k němu doporučujeme prozkoumat.</p></div>${blocks}</section>`;
}

/* Magazín jako pillar content — výpis seskupený do 6 pilířů */
function articleListingInner(items) {
  const intro = `<div class="callout callout--accent supp-intro"><p><strong>Pillar content, ne blog.</strong> Místo stovek krátkých článků stavíme špičkové, ozdrojované průvodce propojené s celou databází — ingrediencemi, technologiemi, produkty i klinickými studiemi. Každý průvodce má jednotnou strukturu: stručná odpověď, co říká věda, jak to funguje, pro koho (ne)je, realistické výsledky, limity a doporučení z naší databáze.</p></div>`;
  let groups = '';
  for (const [key, label] of Object.entries(PILLARS)) {
    const inPil = items.filter((a) => a.pillar === key);
    if (!inPil.length) continue;
    groups += `<div class="fy-group"><h2 class="fy-group-h">${esc(label)} <span class="muted small">· ${inPil.length}</span></h2><div class="card-grid">${inPil.map(entityCard).join('')}</div></div>`;
  }
  const rest = items.filter((a) => !a.pillar || !PILLARS[a.pillar]);
  if (rest.length) groups += `<div class="fy-group"><h2 class="fy-group-h">Další průvodci</h2><div class="card-grid">${rest.map(entityCard).join('')}</div></div>`;
  return intro + groups;
}

/* ----------------------------------------------------------------------------
 * Výpisové (listing) stránky
 * ------------------------------------------------------------------------- */
function renderListing(type) {
  const tc = TYPES[type];
  const items = entitiesByType(type);
  const trail = [{ label: 'Domů', href: '/' }, { label: tc.many, href: tc.base }];
  const inner = type === 'product'
    ? productListingInner(items)
    : type === 'technology'
      ? techListingInner(items)
      : type === 'supplement'
        ? supplementListingInner(items)
        : type === 'faceYoga'
          ? faceYogaListingInner(items)
          : type === 'ingredient'
            ? '<div id="ingredientDb" class="cmp-app"></div>'
            : type === 'article'
              ? articleListingInner(items)
              : `<div class="card-grid">${items.map(entityCard).join('')}</div>`;
  const banner = bannerImage(type);
  const body = `<section class="listing-hero${banner ? ' has-banner' : ''}">${banner}<div class="container">
      <span class="eyebrow">Databáze</span>
      <h1>${esc(tc.many)}</h1>
      <p class="lead">${esc(listingIntro(type))}</p>
    </div></section>
    <section class="section"><div class="container">
      ${inner}
    </div></section>`;
  return layout({
    title: `${tc.many} | ${SITE.name}`,
    description: listingIntro(type),
    canonical: tc.base,
    breadcrumbTrail: trail,
    body: body + (type === 'product' ? '<script src="/assets/js/products-filter.js" defer></script>' : type === 'technology' ? '<script src="/assets/js/tech-finder.js" defer></script>' : type === 'supplement' ? '<script src="/assets/js/supplement-finder.js" defer></script>' : type === 'faceYoga' ? '<script src="/assets/js/face-yoga-finder.js" defer></script>' : type === 'ingredient' ? '<script src="/assets/js/ingredients-filter.js" defer></script>' : ''),
  });
}

/* ---- Obličejová jóga: landing s náčrtky a výběrem partie ---- */
const FY_AREAS = [
  ['celo', 'Čelo a vrásky mezi obočím'], ['oci', 'Oční okolí'], ['tvare', 'Tváře a lícní kosti'],
  ['usta', 'Ústa a nasolabální rýhy'], ['celist', 'Čelist a podbradek'], ['krk', 'Krk a dekolt'],
];
function faceYogaCard(e) {
  const thumb = (Array.isArray(e.photos) && e.photos.length)
    ? `<img class="fy-card-photo" src="${attr(e.photos[0])}" alt="${attr(e.name)}" loading="lazy">`
    : faceYogaSvg(e, 'fy-illu--sm');
  return `<a class="card fy-card" href="${urlOf(e)}" data-area="${attr(e.area || '')}">
    <span class="fy-card-illu${(Array.isArray(e.photos) && e.photos.length) ? ' fy-card-illu--photo' : ''}">${thumb}</span>
    <span class="card-type">${esc(e.areaLabel || 'Obličejová jóga')}</span>
    <h3 class="card-title">${esc(e.name)}</h3>
    <p class="card-excerpt">${esc(e.excerpt || '')}</p>
    <span class="card-foot"><span class="muted small">${esc(e.frequency || '')}</span><span class="card-arrow">→</span></span>
  </a>`;
}
function faceYogaListingInner(items) {
  const btns = FY_AREAS.map(([v, l]) => `<button type="button" class="opt" data-area="${v}">${esc(l)}</button>`).join('');
  const intro = `<div class="callout callout--accent supp-intro"><p><strong>Poctivě o účincích.</strong> Obličejová jóga má zatím omezenou vědeckou oporu (jedna randomizovaná studie, Alam 2018, ukázala po 20 týdnech mírné zlepšení plnosti tváří). Cviky jsou příjemným doplňkem péče, prokrvení a relaxace — ne náhradou SPF a prokázaných postupů. U každého cviku najdete animovaný náčrtek, takže nepotřebujete žádné video.</p></div>`;
  const guide = `<div class="tech-finder" id="fyFinder">
    <span class="eyebrow">Vyberte partii</span>
    <h2>Co chcete procvičit?</h2>
    <div class="opts" id="fyAreas">${btns}</div>
    <p class="muted small" id="fyHint">Vyberte partii obličeje a zobrazíme nejúčinnější cviky pro ni.</p>
  </div>`;
  // seskupení podle partií
  let groups = '';
  for (const [v, l] of FY_AREAS) {
    const inArea = items.filter((e) => e.area === v);
    if (!inArea.length) continue;
    groups += `<div class="fy-group" data-area-group="${v}"><h2 class="fy-group-h">${esc(l)} <span class="muted small">· ${inArea.length} cviků</span></h2><div class="card-grid">${inArea.map(faceYogaCard).join('')}</div></div>`;
  }
  return intro + guide + `<div id="fyGroups">${groups}</div>`;
}

/* ---- Doplňky stravy: landing s evidencí a průvodcem „Co chcete podpořit?" ---- */
function suppCard(e) {
  const eff = JSON.stringify(e.effectiveness || {});
  const ev = e.evidenceStars ? stars(e.evidenceStars) : '';
  const tier = e.evidenceStars >= 4 ? 'Silná opora' : e.evidenceStars === 3 ? 'Slušná opora' : e.evidenceStars === 2 ? 'Omezená opora' : 'Experimentální';
  return `<a class="card tech-card supp-card card--has-img" href="${urlOf(e)}" data-effectiveness="${attr(eff)}" data-ev="${e.evidenceStars || 0}">
    ${entityImage(e, { cls: 'card-img' })}
    <span class="card-type">Doplněk stravy · ${esc(tier)}</span>
    <h3 class="card-title">${esc(e.name)}</h3>
    <p class="card-excerpt">${esc(e.excerpt || '')}</p>
    <span class="card-foot"><span class="muted small">${ev}</span><span class="card-arrow">→</span></span>
  </a>`;
}
function supplementListingInner(items) {
  const concernSet = new Map();
  items.forEach((e) => Object.keys(e.effectiveness || {}).forEach((k) => concernSet.set(k, CONCERN_LABEL[k] || k)));
  const btns = [...concernSet.entries()].sort((a, b) => a[1].localeCompare(b[1], 'cs')).map(([v, l]) => `<button type="button" class="opt" data-concern="${v}">${esc(l)}</button>`).join('');
  const intro = `<div class="callout callout--accent supp-intro"><p><strong>Bez hype.</strong> Doplňky řadíme podle <em>síly skutečných důkazů</em>, ne podle popularity. U dobře prozkoumaných látek (kolagen, vitamin C, omega-3, zinek) je opora výrazně silnější než u trendy „longevity" molekul (NMN, spermidin, resveratrol), kde jde zatím převážně o experimentální data — a podle toho je hodnotíme.</p></div>`;
  const guide = `<div class="tech-finder" id="suppFinder">
    <span class="eyebrow">Interaktivní průvodce</span>
    <h2>Co chcete podpořit?</h2>
    <div class="opts" id="sfConcerns">${btns}</div>
    <div class="opts opts--pref" id="sfEv"><button type="button" class="opt is-active" data-ev="0">Vše</button><button type="button" class="opt" data-ev="4">Jen silně podložené</button><button type="button" class="opt" data-ev="3">Slušně podložené a lepší</button></div>
    <p class="muted small" id="sfHint">Vyberte oblast a doporučíme doplňky s nejlepší vědeckou oporou.</p>
  </div>`;
  // řazení podle síly důkazů sestupně
  const sorted = [...items].sort((a, b) => (b.evidenceStars || 0) - (a.evidenceStars || 0));
  return intro + guide + `<div class="card-grid" id="suppGrid">${sorted.map(suppCard).join('')}</div>`;
}

/* ---- Technologie: landing s interaktivním průvodcem „Co chcete řešit?" ---- */
function techCard(e) {
  const eff = JSON.stringify(e.effectiveness || {});
  const ev = e.evidenceStars ? stars(e.evidenceStars) : '';
  return `<a class="card tech-card card--has-img" href="${urlOf(e)}" data-effectiveness="${attr(eff)}" data-home="${attr(e.homeUse || '')}">
    ${entityImage(e, { cls: 'card-img' })}
    <span class="card-type">Technologie</span>
    <h3 class="card-title">${esc(e.name)}</h3>
    <p class="card-excerpt">${esc(e.excerpt || '')}</p>
    <span class="card-foot"><span class="muted small">${ev}</span><span class="card-arrow">→</span></span>
  </a>`;
}
function techListingInner(items) {
  const concerns = Object.entries(CONCERN_LABEL);
  const btns = concerns.map(([v, l]) => `<button type="button" class="opt" data-concern="${v}">${esc(l)}</button>`).join('');
  const guide = `<div class="tech-finder" id="techFinder">
    <span class="eyebrow">Interaktivní průvodce</span>
    <h2>Co chcete řešit?</h2>
    <div class="opts" id="tfConcerns">${btns}</div>
    <div class="opts opts--pref" id="tfPref"><button type="button" class="opt is-active" data-pref="">Doma i profesionálně</button><button type="button" class="opt" data-pref="ano">Jen domácí péče</button><button type="button" class="opt" data-pref="profesionální">Jen profesionální</button></div>
    <p class="muted small" id="tfHint">Vyberte problém a doporučíme nejvhodnější technologie.</p>
  </div>`;
  return guide + `<div class="card-grid" id="techGrid">${items.map(techCard).join('')}</div>`;
}

/* ---- Produktový výpis s filtrem (problém, značka, kategorie, typ pleti,
   aktivní látka, cena, hodnocení redakce, síla důkazů) ---- */
const EV_RANK = { strong: 3, moderate: 2, limited: 1, preliminary: 0 };
function priceBucket(price) {
  if (!price) return 'na';
  const m = String(price).replace(/\s/g, '').match(/\d+/);
  if (!m) return 'na';
  const n = +m[0];
  if (n < 400) return 'low';
  if (n < 1000) return 'mid';
  if (n < 2500) return 'high';
  return 'premium';
}
function productListingInner(items) {
  // sběr faset pro select boxy
  const brands = new Map(), cats = new Map(), problems = new Map(), skins = new Map(), ings = new Map();
  const annotated = items.map((e) => {
    const probs = [...(e._rel.problem || [])];
    const skn = [...(e._rel.skinType || [])];
    const ai = (e.activeIngredients || []).filter((s) => bySlug.get(`ingredient:${s}`));
    const brandSlug = e.brand && e.brand !== '—' ? slugify(e.brand) : '';
    if (brandSlug) brands.set(brandSlug, e.brand);
    if (e.category) cats.set(e.category, categoryLabel(e.category));
    probs.forEach((p) => { const t = bySlug.get(`problem:${p}`); if (t) problems.set(p, t.name); });
    skn.forEach((s) => { const t = bySlug.get(`skinType:${s}`); if (t) skins.set(s, t.name); });
    ai.forEach((s) => { const t = bySlug.get(`ingredient:${s}`); if (t) ings.set(s, t.name); });
    const score = e.scores && e.scores.overall ? e.scores.overall.score : '';
    const ev = EV_RANK[e.evidenceLevel] ?? '';
    const data = `data-brand="${attr(brandSlug)}" data-category="${attr(e.category || '')}" data-problems="${attr(probs.join(' '))}" data-skintypes="${attr(skn.join(' '))}" data-ingredients="${attr(ai.join(' '))}" data-price="${priceBucket(e.price)}" data-score="${score}" data-ev="${ev}"`;
    return productCard(e, data);
  }).join('');

  const sortMap = (m) => [...m.entries()].sort((a, b) => a[1].localeCompare(b[1], 'cs'));
  const opts = (m) => sortMap(m).map(([v, l]) => `<option value="${attr(v)}">${esc(l)}</option>`).join('');
  const sel = (key, label, optionsHtml) => `<div class="filter-field"><label>${esc(label)}</label><select data-filter="${key}"><option value="">Vše</option>${optionsHtml}</select></div>`;

  const filterbar = `<form class="filterbar" id="productFilter" aria-label="Filtr produktů">
    ${sel('problem', 'Řešený problém', opts(problems))}
    ${sel('brand', 'Značka', opts(brands))}
    ${sel('category', 'Kategorie', opts(cats))}
    ${sel('skintype', 'Typ pleti', opts(skins))}
    ${sel('ingredient', 'Aktivní látka', opts(ings))}
    ${sel('price', 'Cena', '<option value="low">do 400 Kč</option><option value="mid">400–1 000 Kč</option><option value="high">1 000–2 500 Kč</option><option value="premium">nad 2 500 Kč</option>')}
    ${sel('score', 'Hodnocení redakce', '<option value="9">9+/10</option><option value="8">8+/10</option><option value="7">7+/10</option><option value="6">6+/10</option>')}
    ${sel('ev', 'Síla vědeckých důkazů', '<option value="3">Silné</option><option value="2">Středně silné a lepší</option><option value="1">Omezené a lepší</option>')}
    <button type="button" class="btn btn--ghost filter-reset" id="filterReset">Zrušit filtry</button>
  </form>`;

  // Na mobilu jsou filtry sbalené za tlačítko, aby byly produkty hned vidět.
  const toggle = `<button type="button" class="filter-toggle" id="filterToggle" aria-expanded="false" aria-controls="productFilter">Filtrovat a řadit<span class="filter-toggle-caret">▾</span></button>`;
  const count = `<p class="filter-count"><strong id="fcount">${items.length}</strong> z ${items.length} produktů</p>`;
  const script = `<script>(function(){var t=document.getElementById('filterToggle'),f=document.getElementById('productFilter');if(!t||!f)return;t.addEventListener('click',function(){var o=f.classList.toggle('is-open');t.setAttribute('aria-expanded',o);t.classList.toggle('is-open',o);});})();</script>`;

  return `${toggle}${filterbar}${count}<div class="card-grid" id="productGrid">${annotated}</div><p class="empty" id="filterEmpty" hidden>Žádný produkt neodpovídá zvoleným filtrům. Zkuste uvolnit kritéria.</p>${script}`;
}
function productCard(e, dataAttrs) {
  const ev = e.evidenceLevel ? evidenceBadge(e.evidenceLevel) : '';
  const score = e.scores && e.scores.overall ? `<span class="card-score">${e.scores.overall.score}/10</span>` : '';
  return `<a class="card product-card card--has-img" href="${urlOf(e)}" ${dataAttrs}>
    ${entityImage(e, { cls: 'card-img' })}
    <span class="card-type">${esc(e.brand && e.brand !== '—' ? e.brand : TYPES.product.one)}</span>
    <h3 class="card-title">${esc(e.name)}</h3>
    <p class="card-excerpt">${esc(e.excerpt || '')}</p>
    <span class="card-foot">${ev}${score}</span>
  </a>`;
}
function listingIntro(type) {
  const m = {
    ingredient: 'Chytrý vyhledávač účinných látek. Nevíte, co hledat? Začněte problémem, typem pleti nebo tolerancí — filtr vám ukáže přesně to, co dává smysl.',
    technology: 'Přehled neinvazivních technologií — princip, mechanismus, výhody, nevýhody a důkazní základna.',
    supplement: 'Zjistěte, které doplňky stravy mají podle současných vědeckých poznatků největší potenciál podpořit zdraví pokožky a přispět k mladistvějšímu vzhledu pleti.',
    product: 'Produkty propojené s ingrediencemi, technologiemi a studiemi. Transparentně a s ohledem na evidenci.',
    procedure: 'Estetické procedury — princip, výsledky, rizika a realistická očekávání.',
    study: 'Databáze klinických studií se shrnutím, sílou důkazů a praktickými závěry.',
    skinType: 'Cílená péče podle typu pleti — vhodné látky, technologie a rutiny.',
    problem: 'Péče podle konkrétního problému — od jemných vrásek po pigmentaci.',
    ageGroup: 'Doporučení podle věku — co má v které dekádě největší smysl.',
    routine: 'Hotové rutiny krok za krokem, propojené s ingrediencemi a produkty.',
    faceYoga: 'Obličejová jóga: nejúčinnější cviky na každou partii s animovanými náčrtky, postupem a poctivým pohledem na důkazy. Bez nutnosti videa.',
    comparison: 'Přehledná porovnání nejčastějších voleb v anti-agingu.',
    term: 'Encyklopedie odborných pojmů srozumitelně vysvětlených.',
    article: 'Pillar content — špičkoví, ozdrojovaní průvodci anti-agingem, plně propojení s databází. Šest pilířů: škola, ingredience, technologie, rutiny, problémy a srovnání.',
    review: 'Nezávislé recenze podle transparentní metodiky.',
  };
  return m[type] || '';
}

/* ----------------------------------------------------------------------------
 * Domovská stránka
 * ------------------------------------------------------------------------- */
function pick(type, n) { return entitiesByType(type).slice(0, n); }

/* Trust bar — benefity pro návštěvníka: „Co mi tento web přinese?" (ne vlastnosti webu).
   Desktop: 4 stejné sloupce. Mobil: horizontální carousel s tečkami. Karty jsou klikací. */
function trustBar() {
  const TI = {
    tailor: '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="20" cy="20" r="13"/><circle cx="20" cy="20" r="6.5"/><circle cx="20" cy="20" r="1.5" fill="currentColor" stroke="none"/></svg>',
    product: '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="14.5" y="15" width="11" height="17" rx="3"/><path d="M17.5 15v-2.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V15"/><path d="M17.5 21h5"/></svg>',
    science: '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="18" r="8.5"/><path d="M24 24l6 6"/><path d="M14.4 18l2.3 2.3 4.4-4.7"/></svg>',
    routine: '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13h13M18 20h13M18 27h13"/><path d="M9 12.3l1.4 1.4L13 11"/><path d="M9 19.3l1.4 1.4L13 18"/><path d="M9 26.3l1.4 1.4L13 25"/></svg>',
  };
  const items = [
    { href: '/nastroje/poradce/', icon: 'tailor', title: 'Najděte péči na míru', desc: 'Podle věku, typu pleti a konkrétního problému.' },
    { href: '/produkty/', icon: 'product', title: 'Vyberte správné produkty', desc: 'Porovnejte kosmetiku, technologie i doplňky stravy na jednom místě.' },
    { href: '/ingredience/', icon: 'science', title: 'Zjistěte, co má skutečně smysl', desc: 'Srozumitelně vysvětlené ingredience, technologie a postupy podle současných vědeckých poznatků.' },
    { href: '/rutiny/', icon: 'routine', title: 'Sestavte si funkční rutinu', desc: 'Praktická doporučení a kombinace produktů pro dlouhodobou péči o pleť.' },
  ];
  const cards = items.map((it) => `<a class="trust-card" href="${it.href}">
      <span class="trust-icon">${TI[it.icon]}</span>
      <span class="trust-title">${esc(it.title)}</span>
      <span class="trust-desc">${esc(it.desc)}</span>
    </a>`).join('');
  const dots = items.map((_, i) => `<span${i === 0 ? ' class="is-active"' : ''}></span>`).join('');
  return `<section class="trustbar" aria-label="Co vám platforma přinese"><div class="container">
    <div class="trust-track" id="trustTrack">${cards}</div>
    <div class="trust-dots" id="trustDots" aria-hidden="true">${dots}</div>
  </div>
  <script>(function(){var t=document.getElementById('trustTrack'),d=document.getElementById('trustDots');if(!t||!d)return;var dots=d.children;function upd(){var f=t.firstElementChild;if(!f)return;var w=f.getBoundingClientRect().width+14;var i=Math.round(t.scrollLeft/w);for(var k=0;k<dots.length;k++)dots[k].classList.toggle('is-active',k===i);}t.addEventListener('scroll',upd,{passive:true});for(var k=0;k<dots.length;k++)(function(k){dots[k].addEventListener('click',function(){var c=t.children[k];if(c)t.scrollTo({left:c.offsetLeft-t.offsetLeft,behavior:'smooth'});});})(k);})();</script>
  </section>`;
}

function heroBanner() {
  // Ikony (line-art, dědí currentColor). USP = trojice pod titulkem, HC = kategorie na fotce.
  const I = {
    flask: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6M10 3v6.5L5.5 18a2 2 0 0 0 1.8 3h9.4a2 2 0 0 0 1.8-3L14 9.5V3"/><path d="M8 15h8"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M8.5 12.2l2.4 2.4 4.6-5"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 2.5v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10v-5z"/><path d="M9 12l2 2 4-4"/></svg>',
    molecule: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="8" r="2.2"/><circle cx="16.5" cy="7" r="2.2"/><circle cx="12" cy="16.5" r="2.2"/><path d="M9.3 9.2l1.6 5.4M14.6 8.5l-1.6 6M9.6 7.6l4.6-.4"/></svg>',
    device: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="8.5" y="3.5" width="7" height="17" rx="2.5"/><path d="M10.5 6.5h3"/><path d="M2.5 12h2l1.5-3 2 6 1.2-2h1.3"/></svg>',
    dropper: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13.5 4.5l6 6"/><path d="M15.5 8.5l-8.2 8.2a2.5 2.5 0 0 1-1.4.7l-2.4.4.4-2.4a2.5 2.5 0 0 1 .7-1.4L12.7 5.7"/><path d="M10.5 10.5l3 3"/></svg>',
    pill: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8.5" width="18" height="7" rx="3.5" transform="rotate(-40 12 12)"/><path d="M9.3 6.5l5.4 5.4"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4l2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4L7.5 17.7l.9-5L4.8 9.2l5-.7z"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M19 8a7 7 0 0 0-12-1.5M5 5v4h4"/><path d="M5 16a7 7 0 0 0 12 1.5M19 19v-4h-4"/></svg>',
  };
  const usp = [
    ['flask', 'Vědecké důkazy', 'Každé doporučení má oporu ve studiích.'],
    ['check', 'Praktické doporučení', 'Řešení šitá na míru vašim potřebám.'],
    ['shield', 'Bezpečně a srozumitelně', 'Férové informace bez marketingových triků.'],
  ].map(([ic, t, d]) => `<li><span class="u-ic">${I[ic]}</span><span class="u-tx"><b>${esc(t)}</b>${esc(d)}</span></li>`).join('');

  const cats = [
    ['molecule', 'Ingredience', 'Retinol, Peptidy, Vitamin C a více', '/ingredience/'],
    ['device', 'Technologie', 'LED, RF, HIFU a další', '/technologie/'],
    ['dropper', 'Procedury', 'Botox, Laser, Microneedling', '/procedury/'],
    ['pill', 'Doplňky stravy', 'Kolagen, Omega-3, Vitaminy a minerály', '/doplnky-stravy/'],
  ].map(([ic, t, d, href]) => `<li><a class="hc" href="${href}"><span class="hc-ic">${I[ic]}</span><span class="hc-tx"><b>${esc(t)}</b><span class="hc-sub">${esc(d)}</span></span><span class="hc-arr" aria-hidden="true">›</span></a></li>`).join('');

  const trust = [
    ['shield', 'Nezávislé', 'doporučení bez sponzorovaného obsahu'],
    ['flask', 'Ověřené studie', 'každé tvrzení má oporu ve zdrojích'],
    ['refresh', 'Aktuální informace', 'obsah pravidelně aktualizujeme'],
  ].map(([ic, t, d]) => `<li><span class="t-ic">${I[ic]}</span><span><b>${esc(t)}</b> — ${esc(d)}</span></li>`).join('');

  return `<section class="hero2" aria-label="Úvod">
    <div class="container hero2-inner">
      <div class="hero2-copy">
        <span class="eyebrow">${esc(SITE.tagline)}</span>
        <h1 class="hero2-title">Vědecky ověřená anti-aging řešení, <span class="g">která dávají smysl</span></h1>
        <p class="hero2-lead">Srozumitelně, na jednom místě. Vyberte to, co vaší pleti opravdu pomůže.</p>
        <ul class="hero2-usp">${usp}</ul>
      </div>
      <div class="hero2-visual">
        <picture class="hero2-pic">
          <source media="(max-width:640px)" srcset="${BASE}/assets/img/banners/hero-home-mobile.jpg">
          <img class="hero2-photo" src="/assets/img/banners/hero-home.jpg" alt="Žena pečující o pleť" width="760" height="1040" fetchpriority="high">
        </picture>
      </div>
      <ul class="hero2-cards">${cats}</ul>
      <div class="hero2-cta">
        <a class="btn btn--gold btn--lg" href="/nastroje/poradce/">Najít řešení pro můj problém <span aria-hidden="true">→</span></a>
        <a class="btn btn--ghost btn--lg" href="/technologie/">Prozkoumat technologie</a>
      </div>
    </div>
    <div class="hero2-trust"><div class="container hero2-trust-inner">
      <span class="h2t-lead">Proč nám můžete věřit</span>
      <ul class="h2t-list">${trust}</ul>
    </div></div>
  </section>`;
}

function homepage() {
  const featTech = pick('technology', 3).map(entityCard).join('');
  const featIng = pick('ingredient', 4).map(entityCard).join('');
  const featProd = pick('product', 3).map(entityCard).join('');
  const featStudy = pick('study', 3).map(entityCard).join('');
  const featCompare = pick('comparison', 4).map(entityCard).join('');
  const featArticle = pick('article', 2).map(entityCard).join('');

  const hubTiles = Object.entries(TYPES).filter(([t]) => !['term', 'review'].includes(t)).map(([t, c]) =>
    `<a class="hub-tile" href="${c.base}"><span class="hub-label">${esc(c.many)}</span><span class="hub-count">${entitiesByType(t).length}</span></a>`).join('');

  // Sekce „Najděte si péči na míru" — 6 očíslovaných karet (1:1 na interaktivní nástroje)
  const ICONS = {
    face: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M16 13c-2 1.5-3 4-3 7 0 6 4 12 11 12s11-6 11-12c0-3-1-5.5-3-7"/><path d="M16 13c1-3.5 4.5-5 8-5s7 1.5 8 5"/><circle cx="20.5" cy="22" r="1"/><circle cx="27.5" cy="22" r="1"/><path d="M21 27.5c1.5 1.3 4.5 1.3 6 0"/><path d="M37.5 13.5l.9 2 2 .9-2 .9-.9 2-.9-2-2-.9 2-.9z"/></svg>',
    bottle: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="13" y="16" width="12" height="22" rx="3"/><path d="M16.5 16v-3h5v3"/><path d="M16.5 23h9"/><path d="M34 38c-.3-6 1.5-9.5 6-11.5-.6 5.5-1.8 9.5-6 11.5z"/><path d="M34 38c-3-2-4.2-5-4-9 3 2 4.2 5 4 9z"/></svg>',
    molecule: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="24" cy="13" r="3"/><circle cx="13" cy="27" r="3"/><circle cx="35" cy="27" r="3"/><circle cx="24" cy="37" r="3"/><path d="M22 15.5l-6.5 9M26 15.5l6.5 9M15.5 29l6.5 6M32.5 29l-6.5 6"/></svg>',
    mask: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 13c-2 2-3 6-3 11s2 11 12 11 12-6 12-11-1-9-3-11c-3 2-6 3-9 3s-6-1-9-3z"/><g fill="currentColor" stroke="none"><circle cx="19" cy="22" r=".9"/><circle cx="24" cy="22" r=".9"/><circle cx="29" cy="22" r=".9"/><circle cx="21.5" cy="27" r=".9"/><circle cx="26.5" cy="27" r=".9"/></g></svg>',
    search: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="21" cy="21" r="9"/><path d="M27.5 27.5L36 36"/></svg>',
    target: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M17 15c-2 1.3-3 3.5-3 6.5 0 5.5 4 11 10 11s10-5.5 10-11c0-3-1-5.2-3-6.5"/><path d="M17 15c1-3 4-4.5 7-4.5s6 1.5 7 4.5"/><circle cx="21" cy="22" r="1"/><circle cx="27" cy="22" r="1"/><path d="M22 27c1 1 3 1 4 0"/><path d="M11 13v-2.5h2.5M37 13v-2.5h-2.5M11 35v2.5h2.5M37 35v2.5h-2.5"/></svg>',
  };
  const toolSteps = [
    { href: '/nastroje/poradce/', icon: 'face', title: 'Najděte ideální péči', desc: 'Doporučíme ingredience, technologie, produkty i procedury na míru vašemu věku, typu pleti a hlavnímu problému.', cta: 'Začít doporučení' },
    { href: '/nastroje/builder-rutiny/', icon: 'bottle', title: 'Sestavte si rutinu', desc: 'Vytvoříme pro vás ranní i večerní rutinu podle vašich cílů, typu pleti a používaných aktivních látek.', cta: 'Sestavit rutinu' },
    { href: '/nastroje/kompatibilita/', icon: 'molecule', title: 'Zkontrolujte kombinace látek', desc: 'Zjistěte, zda se vaše aktivní látky snášejí a jak je nejlépe kombinovat pro maximální účinek a bezpečnost.', cta: 'Ověřit kombinaci' },
    { href: '/nastroje/doporuceni-technologii/', icon: 'mask', title: 'Vyberte správnou technologii', desc: 'Porovnáme technologie a doporučíme nejvhodnější řešení podle vašich potřeb, rozpočtu a očekávaných výsledků.', cta: 'Najít technologii' },
    { href: '/nastroje/porovnani-produktu/', icon: 'search', title: 'Porovnejte produkty', desc: 'Srovnejte kosmetiku i zařízení podle složení, účinnosti, studií, ceny a zkušeností uživatelů.', cta: 'Porovnat produkty' },
    { href: '/nastroje/vyhledavac-ingredienci/', icon: 'target', title: 'Najděte řešení svého problému', desc: 'Vyberte oblast, která vás trápí, a zobrazíme nejúčinnější ingredience, technologie, produkty i doporučenou péči.', cta: 'Najít řešení' },
  ];
  const toolStepsHtml = toolSteps.map((s, i) => `<a class="step-card" href="${s.href}">
      <span class="step-icon">${ICONS[s.icon]}</span>
      <span class="step-body">
        <h3><span class="step-num">${i + 1}.</span> ${esc(s.title)}</h3>
        <p>${esc(s.desc)}</p>
        <span class="step-cta">${esc(s.cta)}<span class="step-arrow">→</span></span>
      </span>
    </a>`).join('');

  const body = `
  ${heroBanner()}

  ${trustBar()}

  <section class="section"><div class="container">
    <div class="sec-head"><span class="eyebrow">Inteligentní nástroje</span><h2>Najděte si péči na míru</h2></div>
    <div class="steps-grid">${toolStepsHtml}</div>
  </div></section>

  <section class="section section--ivory"><div class="container">
    <div class="hub">${hubTiles}</div>
  </div></section>

  <section class="section"><div class="container">
    <div class="sec-head"><span class="eyebrow">Doporučené technologie</span><h2>Přístroje a metody</h2><a class="sec-more" href="/technologie/">Všechny technologie →</a></div>
    <div class="card-grid">${featTech}</div>
  </div></section>

  <section class="section section--ivory"><div class="container">
    <div class="sec-head"><span class="eyebrow">Doporučené ingredience</span><h2>Účinné látky</h2><a class="sec-more" href="/ingredience/">Všechny ingredience →</a></div>
    <div class="card-grid">${featIng}</div>
  </div></section>

  <section class="section"><div class="container">
    <div class="sec-head"><span class="eyebrow">Aktuální studie</span><h2>Co říká věda</h2><a class="sec-more" href="/studie/">Databáze studií →</a></div>
    <div class="card-grid">${featStudy}</div>
  </div></section>

  <section class="section section--ivory"><div class="container">
    <div class="sec-head"><span class="eyebrow">Oblíbená porovnání</span><h2>Co si vybrat</h2><a class="sec-more" href="/porovnani/">Všechna porovnání →</a></div>
    <div class="card-grid">${featCompare}</div>
  </div></section>

  <section class="section"><div class="container">
    <div class="sec-head"><span class="eyebrow">Doporučené produkty</span><h2>Vybíráme pro vás</h2><a class="sec-more" href="/produkty/">Všechny produkty →</a></div>
    <div class="card-grid">${featProd}</div>
  </div></section>

  <section class="section section--ivory"><div class="container">
    <div class="sec-head"><span class="eyebrow">Z magazínu</span><h2>Nejnovější články</h2><a class="sec-more" href="/clanky/">Celý magazín →</a></div>
    <div class="card-grid">${featArticle}</div>
  </div></section>`;

  const ld = {
    '@context': 'https://schema.org', '@type': 'WebSite', name: SITE.name, url: SITE.url,
    description: SITE.description,
    potentialAction: { '@type': 'SearchAction', target: `${SITE.url}/hledat/?q={query}`, 'query-input': 'required name=query' },
  };
  return layout({ title: `${SITE.name} — ${SITE.tagline}`, description: SITE.description, canonical: '/', jsonld: [ld], body });
}

/* ----------------------------------------------------------------------------
 * Nástroje (interaktivní) — rozcestník + jednotlivé stránky
 * ------------------------------------------------------------------------- */
function toolPage(slug, title, intro, mount, extraJs = '') {
  const trail = [{ label: 'Domů', href: '/' }, { label: 'Nástroje', href: '/nastroje/' }, { label: title, href: `/nastroje/${slug}/` }];
  const body = `<section class="listing-hero"><div class="container"><span class="eyebrow">Interaktivní nástroj</span><h1>${esc(title)}</h1><p class="lead">${esc(intro)}</p></div></section>
  <section class="section"><div class="container tool-wrap">${mount}</div></section>`;
  const html = layout({ title: `${title} | ${SITE.name}`, description: intro, canonical: `/nastroje/${slug}/`, breadcrumbTrail: trail, body: body + `<script src="/assets/js/tools.js" defer></script>${extraJs}` });
  writePage(`/nastroje/${slug}/`, html);
}

function toolsHub() {
  const tiles = [
    ['poradce', 'Anti-aging poradce', 'Komplexní doporučení podle věku, typu pleti, problému, citlivosti a rozpočtu.'],
    ['builder-rutiny', 'Builder rutiny', 'Sestavení ranní a večerní rutiny na míru.'],
    ['kompatibilita', 'Kompatibilita látek', 'Kontrola, zda se aktivní látky snesou.'],
    ['vyhledavac-ingredienci', 'Vyhledávač ingrediencí', 'Najděte látku podle problému, typu pleti nebo cíle.'],
    ['porovnani-produktu', 'Porovnání produktů', 'Postavte produkty vedle sebe a porovnejte parametry.'],
    ['doporuceni-technologii', 'Doporučení technologií', 'Vyberte nejvhodnější technologii podle potřeb.'],
  ];
  const body = `<section class="listing-hero"><div class="container"><span class="eyebrow">Interaktivní nástroje</span><h1>Nástroje</h1><p class="lead">Inteligentní pomocníci, kteří z databáze sestaví doporučení na míru.</p></div></section>
  <section class="section"><div class="container"><div class="card-grid tools-grid">${tiles
    .map(([s, t, d]) => `<a class="tool-card" href="/nastroje/${s}/"><h3>${esc(t)}</h3><p>${esc(d)}</p><span class="card-arrow">→</span></a>`).join('')}</div></div></section>`;
  writePage('/nastroje/', layout({ title: `Nástroje | ${SITE.name}`, description: 'Interaktivní anti-aging nástroje.', canonical: '/nastroje/', breadcrumbTrail: [{ label: 'Domů', href: '/' }, { label: 'Nástroje', href: '/nastroje/' }], body }));
}

function searchPage() {
  const body = `<section class="listing-hero"><div class="container"><span class="eyebrow">Vyhledávání</span><h1>Hledat v databázi</h1><p class="lead">Prohledejte ingredience, technologie, produkty, studie i články.</p>
    <form class="hero-search" id="searchForm"><input type="search" id="searchInput" name="q" placeholder="Zadejte hledaný výraz…" aria-label="Hledat" autofocus><button class="btn btn--primary" type="submit">Hledat</button></form>
  </div></section>
  <section class="section"><div class="container"><div id="searchResults" class="card-grid"></div></div></section>`;
  writePage('/hledat/', layout({ title: `Hledat | ${SITE.name}`, description: `Fulltextové vyhledávání v databázi ${SITE.name}.`, canonical: '/hledat/', breadcrumbTrail: [{ label: 'Domů', href: '/' }, { label: 'Hledat', href: '/hledat/' }], body: body + `<script src="/assets/js/search.js" defer></script>` }));
}

/* ----------------------------------------------------------------------------
 * Exporty dat pro klientské nástroje
 * ------------------------------------------------------------------------- */
/* ----------------------------------------------------------------------------
 * Porovnávač produktů — normalizovaná datová vrstva
 * ------------------------------------------------------------------------- */
const CMP_DEVICE_CATS = new Set(['led-masky', 'microcurrent', 'radiofrekvence', 'domaci-lasery', 'ems', 'microneedling-zarizeni', 'dermaroller', 'gua-sha', 'face-roller', 'silikonove-naplasti', 'kryo-nastroje', 'ultrazvuk-zarizeni', 'galvanicka-zarizeni', 'ipl-zarizeni', 'hifu-zarizeni']);
const CMP_CAT_MAP = { retinoly: 'retinoidy', 'vitamin-c': 'vitamin-c', peptidy: 'peptidy', spf: 'spf', 'ocni-kremy': 'ocni-pece', 'led-masky': 'led-masky', radiofrekvence: 'radiofrekvence', microcurrent: 'microcurrent' };
const CMP_ACT_FROM_ING = { retinal: 'retinal', retinol: 'retinol', 'vitamin-c': 'vitamin-c', niacinamid: 'niacinamid', peptidy: 'peptidy', ceramidy: 'ceramidy' };
const CMP_DEVICE_ACT = { 'led-masky': 'led', radiofrekvence: 'rf', microcurrent: 'microcurrent', 'domaci-lasery': 'led', 'ipl-zarizeni': 'led' };
const CMP_PROBLEM_MAP = { 'jemne-vrasky': 'jemne-vrasky', 'hluboke-vrasky': 'hluboke-vrasky', pigmentace: 'pigmentace', 'povolena-plet': 'povolena-plet', rosacea: 'zarudnuti', 'matna-plet': 'nerovnomerny-ton', textura: 'nerovnomerny-ton' };
const CMP_AGE_MAP = { '20-plus': 25, '30-plus': 30, '40-plus': 40, '50-plus': 50, '60-plus': 60 };
const CMP_ACT_LABEL = { retinal: 'Retinal', retinol: 'Retinol', 'vitamin-c': 'Vitamin C', niacinamid: 'Niacinamid', peptidy: 'Peptidy', ceramidy: 'Ceramidy', led: 'LED', rf: 'Radiofrekvence', microcurrent: 'Microcurrent', spf: 'SPF', kolagen: 'Kolagen' };
const CMP_TYPE_LABEL = { kosmetika: 'Kosmetika', zarizeni: 'Beauty zařízení', doplnek: 'Doplněk stravy', procedura: 'Procedura' };
const CMP_CAT_LABEL = { retinoidy: 'Retinoidy', 'vitamin-c': 'Vitamin C', peptidy: 'Peptidy', spf: 'SPF', 'ocni-pece': 'Oční péče', 'led-masky': 'LED masky', radiofrekvence: 'Radiofrekvence', microcurrent: 'Microcurrent', kolagen: 'Kolagen', antioxidanty: 'Antioxidanty' };
function cmpPriceNum(s) { const m = String(s || '').replace(/\s/g, '').match(/\d+/); return m ? +m[0] : null; }
function cmpPriceBucket(n) { if (n == null) return 'na'; if (n < 500) return 'lt500'; if (n < 1500) return 'b1'; if (n < 3000) return 'b2'; if (n < 8000) return 'b3'; return 'gt8000'; }
function compareItem(e) {
  const rel = e._rel || {};
  let type, catKey = null, actives = [];
  const probs = new Set(), skins = [...(rel.skinType || [])], ages = [...(rel.ageGroup || [])].map((a) => CMP_AGE_MAP[a]).filter(Boolean);
  [...(rel.problem || [])].forEach((p) => { if (CMP_PROBLEM_MAP[p]) probs.add(CMP_PROBLEM_MAP[p]); });
  if (e.type === 'procedure') {
    type = 'procedura';
  } else { // product
    if (CMP_DEVICE_CATS.has(e.category)) type = 'zarizeni';
    else if (e.category === 'doplnky-stravy') type = 'doplnek';
    else type = 'kosmetika';
    catKey = CMP_CAT_MAP[e.category] || null;
    (e.activeIngredients || []).forEach((s) => { if (CMP_ACT_FROM_ING[s]) actives.push(CMP_ACT_FROM_ING[s]); });
    if (CMP_DEVICE_ACT[e.category]) actives.push(CMP_DEVICE_ACT[e.category]);
    if (e.category === 'spf') actives.push('spf');
    if (e.category === 'ocni-kremy') probs.add('vrasky-kolem-oci');
    if (skins.includes('sucha')) probs.add('suchost');
    if (skins.includes('aknozni')) probs.add('akne');
    if (type === 'doplnek') {
      const sup = (e.relations && e.relations.supplements) || [];
      if (sup.includes('kolagen')) { catKey = 'kolagen'; actives.push('kolagen'); }
      else if (sup.some((s) => ['vitamin-c', 'astaxanthin', 'koenzym-q10', 'resveratrol', 'selen'].includes(s))) catKey = 'antioxidanty';
      if (sup.includes('vitamin-c')) actives.push('vitamin-c');
    }
  }
  actives = [...new Set(actives)];
  const priceNum = cmpPriceNum(e.price || e.priceRange);
  const score = e.scores && e.scores.overall ? e.scores.overall.score : null;
  const alt = (e.alternatives && e.alternatives[0]) ? (() => { const t = bySlug.get(`product:${e.alternatives[0].slug}`); return t ? { name: t.name, url: urlOf(t) } : (e.alternatives[0].name ? { name: e.alternatives[0].name, url: '' } : null); })() : null;
  return {
    id: e.slug, name: e.name, url: urlOf(e),
    type, typeLabel: CMP_TYPE_LABEL[type],
    brand: (e.brand && e.brand !== '—') ? e.brand : '',
    cat: catKey, catLabel: catKey ? CMP_CAT_LABEL[catKey] : (e.category ? categoryLabel(e.category) : (type === 'procedura' ? 'Procedura' : '')),
    actives, activeLabels: actives.map((a) => CMP_ACT_LABEL[a] || a),
    problems: [...probs], skins, minAge: ages.length ? Math.min(...ages) : null, sensitive: skins.includes('citliva'),
    price: e.price || e.priceRange || '', priceNum, priceBucket: cmpPriceBucket(priceNum),
    score, evidence: e.evidenceLevel || '', evRank: EV_RANK[e.evidenceLevel] ?? null,
    pros: (e.strengths || e.pros || []).slice(0, 5),
    cons: (e.weaknesses || e.cons || e.risks || []).slice(0, 5),
    suitableFor: (e.suitableFor || []).slice(0, 4),
    notSuitable: (e.notSuitable || e.contraindications || []).slice(0, 4),
    alt,
  };
}
function exportCompareData() {
  const items = [...entitiesByType('product'), ...entitiesByType('procedure')].map(compareItem);
  mkdirSync(join(OUT, 'assets', 'data'), { recursive: true });
  writeFileSync(join(OUT, 'assets', 'data', 'compare-data.json'), JSON.stringify(items));
}

/* ----------------------------------------------------------------------------
 * Databáze ingrediencí — obohacení o filtrovatelné atributy
 * ------------------------------------------------------------------------- */
const ING_META = {
  retinol: { types: ['retinoidy'], effects: ['vrasky', 'textura', 'pigmentace', 'elasticita'], tol: ['irritation', 'pregnancy', 'spf'], routine: ['pm', 'postupne'], risk: 'high', alt: 'vitamin A retinol' },
  retinal: { types: ['retinoidy'], effects: ['vrasky', 'textura', 'pigmentace'], tol: ['irritation', 'pregnancy', 'spf'], routine: ['pm', 'postupne'], risk: 'high', alt: 'retinaldehyd retinal' },
  bakuchiol: { types: ['rostlinne', 'retinoidy'], effects: ['vrasky', 'citlivost', 'textura'], tol: ['beginner', 'sensitive'], routine: ['am', 'pm', 'denne'], risk: 'low', alt: 'bakuchiol rostlinný retinol psoralea' },
  'vitamin-c': { types: ['antioxidanty', 'rozjasnujici'], effects: ['pigmentace', 'rozjasneni', 'prevence-fotostarnuti', 'vrasky'], tol: ['beginner', 'spf'], routine: ['am', 'denne'], risk: 'medium', alt: 'kyselina askorbová ascorbic vitamín C L-askorbová' },
  niacinamid: { types: ['rozjasnujici', 'zklidnujici'], effects: ['pigmentace', 'rozjasneni', 'bariera', 'akne', 'textura'], tol: ['beginner', 'sensitive'], routine: ['am', 'pm', 'denne'], risk: 'low', alt: 'niacinamid vitamin B3 nikotinamid' },
  peptidy: { types: ['peptidy'], effects: ['elasticita', 'vrasky'], tol: ['beginner', 'sensitive'], routine: ['am', 'pm', 'denne'], risk: 'low', alt: 'peptidy signální peptidy' },
  'kyselina-hyaluronova': { types: ['hydratacni'], effects: ['hydratace', 'vrasky'], tol: ['beginner', 'sensitive'], routine: ['am', 'pm', 'denne'], risk: 'low', alt: 'kyselina hyaluronová hyaluronan HA hyaluronic' },
  aha: { types: ['kyseliny'], effects: ['rozjasneni', 'pigmentace', 'textura', 'vrasky'], tol: ['irritation', 'spf'], routine: ['pm', 'dvakrat'], risk: 'high', alt: 'AHA alfahydroxykyseliny glykolová mléčná kyselina' },
  bha: { types: ['kyseliny'], effects: ['akne', 'textura'], tol: ['irritation', 'pregnancy', 'spf'], routine: ['pm', 'dvakrat'], risk: 'high', alt: 'BHA salicylová kyselina beta hydroxy' },
  'azelaova-kyselina': { types: ['kyseliny', 'rozjasnujici', 'zklidnujici'], effects: ['zarudnuti', 'pigmentace', 'akne', 'rozjasneni'], tol: ['beginner', 'sensitive'], routine: ['am', 'pm', 'denne'], risk: 'medium', alt: 'azelaová kyselina azelaic' },
  ceramidy: { types: ['barierove-lipidy'], effects: ['bariera', 'hydratace', 'citlivost'], tol: ['beginner', 'sensitive'], routine: ['am', 'pm', 'denne'], risk: 'low', alt: 'ceramidy ceramides' },
  pha: { types: ['kyseliny'], effects: ['rozjasneni', 'textura', 'citlivost'], tol: ['beginner', 'sensitive', 'spf'], routine: ['pm', 'denne'], risk: 'medium', alt: 'PHA polyhydroxykyseliny glukonolakton' },
  'tranexamova-kyselina': { types: ['rozjasnujici'], effects: ['pigmentace', 'rozjasneni'], tol: ['beginner', 'sensitive'], routine: ['am', 'pm', 'denne'], risk: 'low', alt: 'tranexamová kyselina tranexamic' },
  matrixyl: { types: ['peptidy'], effects: ['vrasky', 'elasticita'], tol: ['beginner', 'sensitive'], routine: ['am', 'pm', 'denne'], risk: 'low', alt: 'matrixyl palmitoyl peptid' },
  'copper-peptides': { types: ['peptidy'], effects: ['elasticita', 'vrasky'], tol: ['beginner', 'sensitive'], routine: ['pm', 'denne'], risk: 'low', alt: 'měděné peptidy copper GHK-Cu' },
  argireline: { types: ['peptidy'], effects: ['vrasky'], tol: ['beginner'], routine: ['am', 'pm', 'denne'], risk: 'low', alt: 'argireline acetyl hexapeptid' },
  centella: { types: ['zklidnujici', 'rostlinne'], effects: ['zarudnuti', 'citlivost', 'bariera'], tol: ['beginner', 'sensitive'], routine: ['am', 'pm', 'denne'], risk: 'low', alt: 'centella asiatica cica madecassoside pupečník' },
  panthenol: { types: ['zklidnujici', 'hydratacni'], effects: ['hydratace', 'bariera', 'citlivost', 'zarudnuti'], tol: ['beginner', 'sensitive'], routine: ['am', 'pm', 'denne'], risk: 'low', alt: 'panthenol provitamin B5 dexpanthenol' },
  resveratrol: { types: ['antioxidanty', 'rostlinne'], effects: ['rozjasneni', 'prevence-fotostarnuti'], tol: ['beginner'], routine: ['am', 'denne'], risk: 'low', alt: 'resveratrol polyfenol' },
  'koenzym-q10': { types: ['antioxidanty'], effects: ['vrasky', 'rozjasneni', 'prevence-fotostarnuti'], tol: ['beginner', 'sensitive'], routine: ['am', 'denne'], risk: 'low', alt: 'koenzym Q10 ubichinon CoQ10 ubiquinone' },
  'ferulova-kyselina': { types: ['antioxidanty'], effects: ['rozjasneni', 'pigmentace', 'prevence-fotostarnuti'], tol: ['beginner', 'spf'], routine: ['am', 'denne'], risk: 'low', alt: 'ferulová kyselina ferulic' },
  'alfa-arbutin': { types: ['rozjasnujici'], effects: ['pigmentace', 'rozjasneni'], tol: ['beginner', 'sensitive'], routine: ['am', 'pm', 'denne'], risk: 'low', alt: 'alfa arbutin arbutin' },
  pdrn: { types: ['exosomy-pdrn', 'rustove-faktory'], effects: ['elasticita', 'vrasky'], tol: ['sensitive'], routine: ['pm', 'dvakrat'], risk: 'low', alt: 'PDRN polydeoxyribonukleotidy lososová DNA' },
  exosomy: { types: ['exosomy-pdrn'], effects: ['elasticita'], tol: [], routine: ['pm', 'dvakrat'], risk: 'low', alt: 'exosomy exosomes' },
  egf: { types: ['rustove-faktory'], effects: ['elasticita'], tol: [], routine: ['pm', 'denne'], risk: 'low', alt: 'EGF epidermální růstový faktor growth factor' },
  skvalan: { types: ['barierove-lipidy', 'hydratacni'], effects: ['hydratace', 'bariera'], tol: ['beginner', 'sensitive'], routine: ['am', 'pm', 'denne'], risk: 'low', alt: 'skvalan squalane skvalen' },
};
const ING_EV_TIER = { strong: 'silne', moderate: 'dobre', limited: 'omezene', preliminary: 'experimentalni' };
const ING_EFFECT_L = { vrasky: 'Vrásky', pigmentace: 'Pigmentace', hydratace: 'Hydratace', elasticita: 'Elasticita', bariera: 'Bariéra pleti', akne: 'Akné', zarudnuti: 'Zarudnutí', citlivost: 'Citlivost', textura: 'Textura pleti', rozjasneni: 'Rozjasnění', 'prevence-fotostarnuti': 'Prevence fotostárnutí' };
function exportIngredientData() {
  const items = entitiesByType('ingredient').map((e) => {
    const m = ING_META[e.slug] || { types: [], effects: [], tol: [], routine: [], risk: 'low', alt: '' };
    const skins = [...(e._rel.skinType || [])];
    const probs = [...(e._rel.problem || [])];
    if (probs.includes('rosacea') || (m.effects || []).includes('zarudnuti')) { if (skins.indexOf('rosacea') < 0) skins.push('rosacea'); }
    const ages = [...(e._rel.ageGroup || [])].map((a) => CMP_AGE_MAP[a]).filter(Boolean);
    const tol = m.tol.slice();
    const evTier = ING_EV_TIER[e.evidenceLevel] || 'experimentalni';
    const effectLabels = (m.effects || []).map((k) => ING_EFFECT_L[k] || k);
    const imgData = entityImageSrc(e);
    return {
      id: e.slug, name: e.name, url: urlOf(e), excerpt: e.excerpt || '',
      img: imgData ? imgData.src : null,
      types: m.types || [], effects: m.effects || [], effectLabels,
      skins, minAge: ages.length ? Math.min(...ages) : null,
      evidence: evTier, evRank: EV_RANK[e.evidenceLevel] ?? 0,
      risk: m.risk || 'low', tol, routine: m.routine || [],
      beginner: tol.indexOf('beginner') > -1, sensitive: tol.indexOf('sensitive') > -1,
      search: (e.name + ' ' + (m.alt || '') + ' ' + effectLabels.join(' ') + ' ' + skins.join(' ') + ' ' + (e.excerpt || '')).toLowerCase(),
    };
  });
  mkdirSync(join(OUT, 'assets', 'data'), { recursive: true });
  writeFileSync(join(OUT, 'assets', 'data', 'ingredients-data.json'), JSON.stringify(items));
}

function exportToolData() {
  const slim = (e, fields) => { const o = { slug: e.slug, name: e.name, url: urlOf(e), type: e.type }; for (const f of fields) if (e[f] !== undefined) o[f] = e[f]; return o; };
  const data = {
    ingredients: entitiesByType('ingredient').map((e) => ({ ...slim(e, ['excerpt', 'evidenceLevel', 'indications', 'suitableSkinTypes', 'suitableAgeGroups', 'compatibility', 'concentrations']), problems: [...(e._rel.problem || [])] })),
    technologies: entitiesByType('technology').map((e) => ({ ...slim(e, ['excerpt', 'evidenceLevel', 'pros', 'cons']), problems: [...(e._rel.problem || [])], ageGroups: [...(e._rel.ageGroup || [])] })),
    products: entitiesByType('product').map((e) => ({ ...slim(e, ['excerpt', 'evidenceLevel', 'category', 'price', 'activeIngredients']), pros: e.strengths || e.pros || [], cons: e.weaknesses || e.cons || [], problems: [...(e._rel.problem || [])], ageGroups: [...(e._rel.ageGroup || [])] })),
    problems: entitiesByType('problem').map((e) => slim(e, ['excerpt'])),
    skinTypes: entitiesByType('skinType').map((e) => slim(e, ['excerpt'])),
    ageGroups: entitiesByType('ageGroup').map((e) => slim(e, ['excerpt', 'decade'])),
    routines: entitiesByType('routine').map((e) => slim(e, ['timeOfDay', 'steps'])),
  };
  mkdirSync(join(OUT, 'assets', 'data'), { recursive: true });
  writeFileSync(join(OUT, 'assets', 'data', 'tools-data.json'), JSON.stringify(data));
}

function exportSearchIndex() {
  const idx = entities.map((e) => ({ name: e.name, type: TYPES[e.type].one, typeKey: e.type, url: urlOf(e), excerpt: e.excerpt || '', keywords: [e.name, ...(e.indications || []), ...(e.relations?.problems || [])].join(' ').toLowerCase() }));
  mkdirSync(join(OUT, 'assets', 'data'), { recursive: true });
  writeFileSync(join(OUT, 'assets', 'data', 'search-index.json'), JSON.stringify(idx));
}

function exportSitemap() {
  const urls = ['/', '/nastroje/', '/hledat/', '/slovnik/', '/metodika-hodnoceni/', ...Object.values(TYPES).map((c) => c.base), ...entities.map(urlOf),
    ...['poradce', 'builder-rutiny', 'kompatibilita', 'vyhledavac-ingredienci', 'porovnani-produktu', 'doporuceni-technologii'].map((s) => `/nastroje/${s}/`)];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...new Set(urls)]
    .map((u) => `  <url><loc>${SITE.url}${u}</loc></url>`).join('\n')}\n</urlset>\n`;
  writeFileSync(join(OUT, 'sitemap.xml'), xml);
  writeFileSync(join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE.url}/sitemap.xml\n`);
}

/* ----------------------------------------------------------------------------
 * Metodika hodnocení + živý přehled důkazní základny
 * ------------------------------------------------------------------------- */
function evidenceStats() {
  const tally = {}; let total = 0; let covered = 0, strong = 0;
  const TYPES_COUNT = ['ingredient', 'technology', 'supplement', 'procedure', 'product'];
  for (const e of entities) {
    if (!TYPES_COUNT.includes(e.type)) continue;
    const items = collectSources(e);
    if (items.length) { covered++; if (items.some((s) => s.type === 'meta-analysis' || s.type === 'systematic-review')) strong++; }
    items.forEach((s) => { tally[s.type] = (tally[s.type] || 0) + 1; total++; });
  }
  return { tally, total, covered, strong };
}
function methodologyPage() {
  const st = evidenceStats();
  const trail = [{ label: 'Domů', href: '/' }, { label: 'Metodika hodnocení', href: '/metodika-hodnoceni/' }];
  const ladder = SRC_ORDER.filter((k) => k !== 'other').map((k, i) => {
    const desc = {
      'meta-analysis': 'Statisticky sloučí výsledky více studií — nejvyšší úroveň důkazů.',
      'systematic-review': 'Systematicky shrne veškerou dostupnou evidenci podle předem daného protokolu.',
      'guideline': 'Doporučený postup odborné společnosti.',
      'consensus': 'Konsenzuální stanovisko panelu odborníků.',
      'rct': 'Randomizovaná kontrolovaná studie — zlatý standard jednotlivé studie.',
      'prospective': 'Prospektivní klinické sledování bez randomizace.',
      'clinical': 'Další klinická / kohortová studie.',
      'review': 'Přehledový (narativní) článek.',
      'regulation': 'Regulační či legislativní dokument (např. schválená zdravotní tvrzení EU).',
    }[k] || '';
    const n = st.tally[k] || 0;
    return `<div class="ev-tier"><span class="src-badge src-badge--${k}">${esc(SRC_META[k].forms[0])}</span><p>${esc(desc)}</p><span class="ev-tier-n">${n}×</span></div>`;
  }).join('');
  const chips = SRC_ORDER.filter((k) => st.tally[k]).map((k) => `<div class="ev-stat"><strong>${st.tally[k]}</strong><span>${esc(srcPlural(k, st.tally[k]))}</span></div>`).join('');
  const W = [
    ['Klinické důkazy o složení a technologii', '30 %'],
    ['Kvalita složení / technických parametrů', '20 %'],
    ['Síla a účinnost aktivních složek', '15 %'],
    ['Bezpečnost a snášenlivost', '15 %'],
    ['Poměr cena/výkon', '15 %'],
    ['Inovativnost', '5 %'],
  ];
  const wRows = W.map((r) => `<tr><td>${esc(r[0])}</td><td class="mw-w">${esc(r[1])}</td></tr>`).join('');
  const body = `<section class="listing-hero"><div class="container">
      <span class="eyebrow">Transparentnost</span>
      <h1>Jak hodnotíme</h1>
      <p class="lead">AntiAgeLab vytváří <strong>vlastní redakční hodnocení</strong> produktů, technologií, ingrediencí, procedur i doplňků stravy podle předem definované, jednotné a veřejné metodiky. Nejde o laboratorní testování ani oficiální certifikaci — jde o odbornou redakční analýzu na základě současných vědeckých poznatků a veřejně dostupných informací.</p>
    </div></section>
    <section class="section"><div class="container detail-layout"><article class="detail-main">
      <section class="section-block">
        <h2>Jak počítáme skóre produktů</h2>
        <p class="muted">Každý produkt hodnotíme podle jednotných kritérií. Celkové skóre (0–10) je <strong>vážený průměr</strong> těchto kritérií — počítá se automaticky a u každé položky je každé kritérium slovně zdůvodněné.</p>
        <div class="table-wrap"><table class="compare mw-weights"><thead><tr><th>Kritérium</th><th>Váha</th></tr></thead><tbody>${wRows}</tbody></table></div>
        <p class="muted small">Příklad: produkt se silnými klinickými důkazy, kvalitním složením a dobrým poměrem cena/výkon získá např. <strong>9,2 / 10</strong>. Technologie a doplňky stravy mají vlastní, analogickou sadu kritérií se stejnou filozofií (u doplňků navíc hodnotíme kvalitu surovin, biologickou dostupnost a transparentnost výrobce — vždy v souladu s evropskou legislativou a bez léčebných tvrzení).</p>
        <p class="muted small">Skóre vyjadřuje <strong>redakční názor AntiAgeLab podle této metodiky</strong>, nikoli objektivní nebo oficiální pořadí trhu. S přibývajícími kvalitními důkazy se může měnit.</p>
      </section>
      <section class="section-block">
        <h2>Důkazní základna v číslech</h2>
        <p class="muted">Živý přehled — počítá se automaticky z napojených zdrojů při každém sestavení webu.</p>
        <div class="ev-dash">
          <div class="ev-stat ev-stat--big"><strong>${st.total}</strong><span>odkazů na zdroje</span></div>
          <div class="ev-stat ev-stat--big"><strong>${st.covered}</strong><span>témat se zdroji</span></div>
          <div class="ev-stat ev-stat--big"><strong>${st.strong}</strong><span>témat s metaanalýzou / systematickým přehledem</span></div>
        </div>
        <div class="ev-dash">${chips}</div>
      </section>
      <section class="section-block">
        <h2>Hierarchie kvality důkazů</h2>
        <p class="muted">Zdroje řadíme podle síly. Čím výš, tím větší váha při hodnocení.</p>
        <div class="ev-ladder">${ladder}</div>
      </section>
      <section class="section-block">
        <h2>Pravidla, kterými se řídíme</h2>
        <ul class="rich-list">
          <li><strong>Přednost má nejsilnější důkaz.</strong> Pokud existuje kvalitní systematický přehled nebo metaanalýza, má přednost před jednotlivými studiemi a podle ní hodnocení upravujeme.</li>
          <li><strong>Novější kvalitní přehled vítězí.</strong> Objeví-li se aktuálnější systematická review/metaanalýza, nahradí starší a hodnocení se podle ní přepočítá.</li>
          <li><strong>Otevřeně přiznáváme slabá místa.</strong> Pokud jsou důkazy omezené nebo experimentální, výslovně to uvádíme a neformulujeme silná doporučení.</li>
          <li><strong>Rozlišujeme úrovně poznání:</strong> kvalitní klinické důkazy · předběžné výsledky · experimentální výzkum · hypotézy.</li>
          <li><strong>Rozporné výsledky uvádíme jako rozporné</strong> — nezamlčujeme je.</li>
          <li><strong>Žádné vymyšlené citace.</strong> Každý zdroj odkazuje na reálný záznam (PubMed/PMC/DOI).</li>
        </ul>
      </section>
      <section class="section-block">
        <h2>Jak databáze roste</h2>
        <p>Studie i přehledy jsou uložené jako strukturovaná data a propojené s tématy (ingredience, technologie, doplňky, procedury, produkty). Každý zdroj nese typ studie, a tím i svou váhu. Blok <strong>„Zdroje hodnocení"</strong> na každé stránce se počítá automaticky — přidáním nové studie se okamžitě promítne do počtů, pořadí i transparentního výpisu napříč celou platformou. Jedna studie může být relevantní pro více témat současně.</p>
        <p class="muted small">Databázi průběžně rozšiřujeme o nově publikované systematické přehledy a metaanalýzy.</p>
      </section>
      <section class="section-block">
        <h2>Jak formulujeme doporučení</h2>
        <p>Vyhýbáme se absolutním tvrzením typu „nejlepší na trhu" nebo „jediná správná volba". Místo toho uvádíme, že produkt získal vysoké skóre <strong>podle metodiky AntiAgeLab</strong> a vždy vysvětlíme proč. Ocenění jako „Nejvyšší skóre podle metodiky AntiAgeLab", „Doporučení redakce", „Nejlepší poměr cena/výkon" nebo „Doporučeno pro začátečníky" jsou redakční a vždy doplněná zdůvodněním.</p>
      </section>
      <section class="section-block callout callout--disclaimer">
        <h2>Právní informace</h2>
        <p class="small">Veškerá hodnocení na ${esc(SITE.name)} představují redakční odbornou analýzu založenou na veřejně dostupných vědeckých zdrojích a jednotné metodice hodnocení. Nejedná se o laboratorní testování, oficiální certifikaci ani lékařské doporučení. Výsledná skóre vyjadřují redakční názor ${esc(SITE.name)} vytvořený podle transparentně zveřejněných kritérií a mohou se měnit s přibývajícími kvalitními vědeckými důkazy. Obsah má vzdělávací charakter a nenahrazuje odbornou lékařskou ani dermatologickou konzultaci.</p>
      </section>
    </article></div></section>`;
  return layout({ title: `Metodika hodnocení důkazů | ${SITE.name}`, description: 'Jak vzniká hodnocení na antiagelab.cz: hierarchie kvality důkazů, pravidla transparentnosti a živý přehled důkazní základny.', canonical: '/metodika-hodnoceni/', breadcrumbTrail: trail, body });
}

/* ----------------------------------------------------------------------------
 * BUILD
 * ------------------------------------------------------------------------- */
function build() {
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

  // statická aktiva
  if (existsSync(ASSETS_SRC)) cpSync(ASSETS_SRC, join(OUT, 'assets'), { recursive: true });

  // kořenové soubory pro vlastní hosting (.htaccess apod.) — build/static/* → site/
  const STATIC_ROOT = join(ROOT, 'build', 'static');
  if (existsSync(STATIC_ROOT)) cpSync(STATIC_ROOT, OUT, { recursive: true });

  // domovská stránka
  writePage('/', homepage());

  // listing + detaily
  for (const type of Object.keys(TYPES)) {
    writePage(TYPES[type].base, renderListing(type));
    for (const e of entitiesByType(type)) writePage(urlOf(e), renderDetail(e));
  }

  // nástroje
  toolsHub();
  toolPage('poradce', 'Anti-aging poradce', 'Zadejte parametry a sestavíme doporučení ingrediencí, technologií, produktů, rutiny i procedur.', `<div id="advisor" class="tool-app"></div>`);
  toolPage('builder-rutiny', 'Builder rutiny', 'Sestavíme ranní a večerní rutinu podle vašich parametrů.', `<div id="routineBuilder" class="tool-app"></div>`);
  toolPage('kompatibilita', 'Kompatibilita látek', 'Vyberte dvě a více aktivních látek a zkontrolujte jejich kombinaci.', `<div id="compatChecker" class="tool-app"></div>`);
  toolPage('vyhledavac-ingredienci', 'Vyhledávač ingrediencí', 'Filtrovat ingredience podle problému, typu pleti a věku.', `<div id="ingredientFinder" class="tool-app"></div>`);
  toolPage('porovnani-produktu', 'Porovnání produktů', 'Nejdřív si vyfiltrujte, co hledáte, pak vyberte 2–4 položky a porovnejte je vedle sebe.', `<div id="compareApp" class="compare-app"></div>`, `<script src="/assets/js/compare.js" defer></script>`);
  toolPage('doporuceni-technologii', 'Doporučení technologií', 'Najděte technologii podle problému a věku.', `<div id="techRecommender" class="tool-app"></div>`);

  // vyhledávání
  searchPage();

  // metodika hodnocení (transparentnost)
  writePage('/metodika-hodnoceni/', methodologyPage());

  // 404 stránka (GitHub Pages i Apache ErrorDocument)
  writeFileSync(join(OUT, '404.html'), applyBase(layout({
    title: `Stránka nenalezena | ${SITE.name}`,
    description: 'Stránka nebyla nalezena.',
    canonical: '/404.html',
    body: `<section class="section"><div class="container" style="text-align:center;padding:80px 28px">
      <span class="eyebrow">Chyba 404</span>
      <h1>Stránka nenalezena</h1>
      <p class="lead" style="margin:0 auto 2rem">Tahle stránka neexistuje nebo byla přesunuta. Zkuste hledání, nebo pokračujte na hlavní stránku.</p>
      <p><a class="btn btn--primary" href="/">Zpět na úvod</a> &nbsp; <a class="btn btn--ghost" href="/hledat/">Hledat</a></p>
    </div></section>`,
  })));

  // exporty
  exportCompareData();
  exportIngredientData();
  exportToolData();
  exportSearchIndex();
  exportSitemap();

  const count = entities.length;
  const pages = count + Object.keys(TYPES).length + 9;
  console.log(`✓ Aevia build hotov: ${count} entit, ~${pages} stránek → ${OUT}`);
}

build();

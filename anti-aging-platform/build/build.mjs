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

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA = join(ROOT, 'data');
const OUT = join(ROOT, 'site');
const ASSETS_SRC = join(ROOT, 'build', 'assets');

// Base path pro nasazení do podsložky (GitHub Pages project site = "/odrudy.cz").
// Lokálně prázdné → web běží z kořene. Nastaví se přes env BASE_PATH.
const BASE = (process.env.BASE_PATH || '').replace(/\/$/, '');
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
  product:    { base: '/produkty/',               one: 'Produkt',     many: 'Produkty',          relKey: 'products',     icon: 'bottle'},
  procedure:  { base: '/procedury/',              one: 'Procedura',   many: 'Procedury',         relKey: 'procedures',   icon: 'needle'},
  study:      { base: '/studie/',                 one: 'Studie',      many: 'Klinické studie',   relKey: 'studies',      icon: 'doc'   },
  skinType:   { base: '/pece-podle-typu-pleti/',  one: 'Typ pleti',   many: 'Péče podle typu pleti', relKey: 'skinTypes', icon: 'drop' },
  problem:    { base: '/pece-podle-problemu/',     one: 'Problém',     many: 'Péče podle problému', relKey: 'problems',   icon: 'target'},
  ageGroup:   { base: '/pece-podle-veku/',         one: 'Věk',         many: 'Péče podle věku',   relKey: 'ageGroups',    icon: 'clock' },
  routine:    { base: '/rutiny/',                  one: 'Rutina',      many: 'Rutiny',            relKey: 'routines',     icon: 'list'  },
  comparison: { base: '/porovnani/',               one: 'Porovnání',   many: 'Porovnání',         relKey: 'comparisons',  icon: 'scale' },
  term:       { base: '/slovnik/',                 one: 'Pojem',       many: 'Slovník pojmů',     relKey: 'terms',        icon: 'book'  },
  article:    { base: '/clanky/',                  one: 'Článek',      many: 'Magazín',           relKey: 'articles',     icon: 'pen'   },
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

const urlOf = (e) => `${TYPES[e.type].base}${e.slug}/`;
const entitiesByType = (type) => entities.filter((e) => e.type === type);

/* ----------------------------------------------------------------------------
 * HTML helpers
 * ------------------------------------------------------------------------- */
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const attr = (s) => esc(s);

function evidenceBadge(level) {
  const ev = EVIDENCE[level];
  if (!ev) return '';
  return `<span class="ev ${ev.cls}" title="Úroveň vědecké evidence">${ev.dot} ${esc(ev.label)}</span>`;
}

function renderBlocks(blocks = []) {
  let html = '';
  for (const b of blocks) {
    if (b.h2) html += `<h2>${esc(b.h2)}</h2>`;
    else if (b.h3) html += `<h3>${esc(b.h3)}</h3>`;
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

function renderSources(sources = []) {
  if (!sources.length) return '';
  return `<section class="section-block sources"><h2>Odborné zdroje</h2><ul class="rich-list">${sources
    .map((s) => `<li>${esc(s.title)}${s.journal ? `, <em>${esc(s.journal)}</em>` : ''}${s.year ? ` (${s.year})` : ''}${s.type ? ` — ${esc(s.type)}` : ''}</li>`)
    .join('')}</ul><p class="muted small">Informace mají vzdělávací charakter a nenahrazují odbornou konzultaci.</p></section>`;
}

function entityCard(e) {
  const ev = e.evidenceLevel ? evidenceBadge(e.evidenceLevel) : '';
  return `<a class="card" href="${urlOf(e)}">
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
  { label: 'Produkty', href: '/produkty/' },
  { label: 'Procedury', href: '/procedury/' },
  { label: 'Péče', children: [
    { label: 'Podle věku', href: '/pece-podle-veku/' },
    { label: 'Podle typu pleti', href: '/pece-podle-typu-pleti/' },
    { label: 'Podle problému', href: '/pece-podle-problemu/' },
    { label: 'Rutiny', href: '/rutiny/' },
  ]},
  { label: 'Studie', href: '/studie/' },
  { label: 'Magazín', href: '/clanky/' },
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

function layout({ title, description, canonical, body, jsonld = [], breadcrumbTrail }) {
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
    <div><h4>Databáze</h4><ul><li><a href="/ingredience/">Ingredience</a></li><li><a href="/technologie/">Technologie</a></li><li><a href="/produkty/">Produkty</a></li><li><a href="/procedury/">Procedury</a></li><li><a href="/studie/">Studie</a></li></ul></div>
    <div><h4>Péče</h4><ul><li><a href="/pece-podle-veku/">Podle věku</a></li><li><a href="/pece-podle-typu-pleti/">Podle typu pleti</a></li><li><a href="/pece-podle-problemu/">Podle problému</a></li><li><a href="/rutiny/">Rutiny</a></li><li><a href="/slovnik/">Slovník pojmů</a></li></ul></div>
    <div><h4>Nástroje</h4><ul><li><a href="/nastroje/poradce/">Anti-aging poradce</a></li><li><a href="/nastroje/builder-rutiny/">Builder rutiny</a></li><li><a href="/nastroje/kompatibilita/">Kompatibilita látek</a></li><li><a href="/nastroje/vyhledavac-ingredienci/">Vyhledávač ingrediencí</a></li></ul></div>
  </div>
  <div class="container footer-legal">
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

function writePage(url, html) {
  const dir = join(OUT, url.replace(/^\//, ''));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), applyBase(html));
}

/* ----------------------------------------------------------------------------
 * Renderery konkrétních typů
 * ------------------------------------------------------------------------- */
function detailExtras(e) {
  let html = '';
  // Ingredient specifika
  if (e.type === 'ingredient') {
    const rows = [];
    if (e.mechanism) rows.push(['Mechanismus účinku', e.mechanism]);
    if (e.concentrations) rows.push(['Doporučené koncentrace', e.concentrations]);
    if (e.inci) rows.push(['INCI', e.inci]);
    html += quickFacts(rows);
    html += listBlock('Indikace', e.indications);
    html += listBlock('Kontraindikace', e.contraindications);
    html += listBlock('Nežádoucí účinky', e.sideEffects);
    if (e.compatibility?.length) html += compatibilityBlock(e.compatibility);
  }
  if (e.type === 'technology') {
    const rows = [];
    if (e.principle) rows.push(['Princip fungování', e.principle]);
    if (e.mechanism) rows.push(['Mechanismus účinku', e.mechanism]);
    if (e.evidenceSummary) rows.push(['Shrnutí důkazů', e.evidenceSummary]);
    html += quickFacts(rows);
    html += twoCol(listBlock('Výhody', e.pros), listBlock('Nevýhody', e.cons));
    html += listBlock('Kontraindikace', e.contraindications);
  }
  if (e.type === 'product') {
    const rows = [];
    if (e.brand && e.brand !== '—') rows.push(['Značka', e.brand]);
    if (e.category) rows.push(['Kategorie', e.category]);
    if (e.price) rows.push(['Cena', e.price]);
    if (e.usage) rows.push(['Doporučené použití', e.usage]);
    html += quickFacts(rows);
    html += twoCol(listBlock('Výhody', e.pros), listBlock('Nevýhody', e.cons));
    if (e.affiliate?.length) html += affiliateBlock(e.affiliate);
  }
  if (e.type === 'procedure') {
    const rows = [];
    if (e.principle) rows.push(['Princip', e.principle]);
    if (e.invasiveness) rows.push(['Invazivita', e.invasiveness]);
    if (e.downtime) rows.push(['Rekonvalescence', e.downtime]);
    if (e.frequency) rows.push(['Frekvence', e.frequency]);
    if (e.results) rows.push(['Výsledky', e.results]);
    if (e.priceRange) rows.push(['Cena', e.priceRange]);
    html += quickFacts(rows);
    html += listBlock('Rizika', e.risks);
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
  if (e.type === 'skinType') {
    html += twoCol(listBlock('Charakteristika', e.characteristics), listBlock('Čemu se vyhnout', e.avoid));
    if (e.routineHints) html += `<div class="callout callout--accent"><strong>Tip na rutinu:</strong> <p>${esc(e.routineHints)}</p></div>`;
  }
  if (e.type === 'problem') {
    html += listBlock('Příčiny', e.causes);
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
  const hero = `<section class="detail-hero"><div class="container">
    <span class="eyebrow">${esc(tc.one)}</span>
    <div class="detail-hero-top">
      <h1>${esc(e.h1 || e.name)}</h1>
      ${e.evidenceLevel ? evidenceBadge(e.evidenceLevel) : ''}
    </div>
    <p class="lead">${esc(e.excerpt || '')}</p>
  </div></section>`;

  const article = `<div class="container detail-layout">
    <article class="detail-main">
      ${detailExtras(e)}
      ${e.body ? renderBlocks(e.body) : ''}
      ${renderFaq(e.faq)}
      ${renderSources(e.sources)}
    </article>
    <aside class="detail-aside">
      ${relatedSection(e)}
    </aside>
  </div>`;

  const faqLd = (e.faq && e.faq.length) ? {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: e.faq.map((q) => ({ '@type': 'Question', name: q.q, acceptedAnswer: { '@type': 'Answer', text: q.a } })),
  } : null;
  const pageLd = {
    '@context': 'https://schema.org',
    '@type': e.type === 'product' ? 'Product' : e.type === 'article' ? 'Article' : 'MedicalWebPage',
    name: e.name, description: e.metaDescription, url: SITE.url + urlOf(e),
  };

  return layout({
    title: e.title || `${e.name} | ${SITE.name}`,
    description: e.metaDescription || e.excerpt || SITE.description,
    canonical: urlOf(e),
    breadcrumbTrail: trail,
    jsonld: [pageLd, faqLd].filter(Boolean),
    body: hero + article,
  });
}

/* ----------------------------------------------------------------------------
 * Výpisové (listing) stránky
 * ------------------------------------------------------------------------- */
function renderListing(type) {
  const tc = TYPES[type];
  const items = entitiesByType(type);
  const trail = [{ label: 'Domů', href: '/' }, { label: tc.many, href: tc.base }];
  const cards = items.map(entityCard).join('');
  const body = `<section class="listing-hero"><div class="container">
      <span class="eyebrow">Databáze</span>
      <h1>${esc(tc.many)}</h1>
      <p class="lead">${esc(listingIntro(type))}</p>
    </div></section>
    <section class="section"><div class="container">
      <div class="card-grid">${cards}</div>
    </div></section>`;
  return layout({
    title: `${tc.many} | ${SITE.name}`,
    description: listingIntro(type),
    canonical: tc.base,
    breadcrumbTrail: trail,
    body,
  });
}
function listingIntro(type) {
  const m = {
    ingredient: 'Databáze účinných látek s mechanismem účinku, koncentracemi, kompatibilitou a úrovní vědeckých důkazů.',
    technology: 'Přehled neinvazivních technologií — princip, mechanismus, výhody, nevýhody a důkazní základna.',
    product: 'Produkty propojené s ingrediencemi, technologiemi a studiemi. Transparentně a s ohledem na evidenci.',
    procedure: 'Estetické procedury — princip, výsledky, rizika a realistická očekávání.',
    study: 'Databáze klinických studií se shrnutím, sílou důkazů a praktickými závěry.',
    skinType: 'Cílená péče podle typu pleti — vhodné látky, technologie a rutiny.',
    problem: 'Péče podle konkrétního problému — od jemných vrásek po pigmentaci.',
    ageGroup: 'Doporučení podle věku — co má v které dekádě největší smysl.',
    routine: 'Hotové rutiny krok za krokem, propojené s ingrediencemi a produkty.',
    comparison: 'Přehledná porovnání nejčastějších voleb v anti-agingu.',
    term: 'Encyklopedie odborných pojmů srozumitelně vysvětlených.',
    article: 'Odborný magazín — dlouhodobě hodnotné články propojené s celou databází.',
    review: 'Nezávislé recenze podle transparentní metodiky.',
  };
  return m[type] || '';
}

/* ----------------------------------------------------------------------------
 * Domovská stránka
 * ------------------------------------------------------------------------- */
function pick(type, n) { return entitiesByType(type).slice(0, n); }

function homepage() {
  const featTech = pick('technology', 3).map(entityCard).join('');
  const featIng = pick('ingredient', 4).map(entityCard).join('');
  const featProd = pick('product', 3).map(entityCard).join('');
  const featStudy = pick('study', 3).map(entityCard).join('');
  const featCompare = pick('comparison', 4).map(entityCard).join('');
  const featArticle = pick('article', 2).map(entityCard).join('');

  const hubTiles = Object.entries(TYPES).filter(([t]) => !['term', 'review'].includes(t)).map(([t, c]) =>
    `<a class="hub-tile" href="${c.base}"><span class="hub-label">${esc(c.many)}</span><span class="hub-count">${entitiesByType(t).length}</span></a>`).join('');

  const body = `
  <section class="hero">
    <div class="container hero-inner">
      <span class="eyebrow">${esc(SITE.tagline)}</span>
      <h1 class="hero-title">Najděte anti-aging řešení, která opravdu fungují.</h1>
      <p class="lead hero-lead">Vyberte si vhodné ingredience, technologie, produkty i rutinu podle svého věku, typu pleti a konkrétního problému. Každé doporučení vychází z dostupných vědeckých důkazů.</p>
      <form class="hero-search" action="/hledat/" method="get" role="search">
        <input type="search" name="q" placeholder="Hledejte ingredienci, technologii, problém…" aria-label="Hledat">
        <button type="submit" class="btn btn--primary">Hledat</button>
      </form>
      <div class="hero-quick">
        <a href="/nastroje/poradce/">Anti-aging poradce</a>
        <a href="/nastroje/kompatibilita/">Kontrola kombinací</a>
        <a href="/pece-podle-veku/">Péče podle věku</a>
      </div>
    </div>
  </section>

  <section class="section"><div class="container">
    <div class="sec-head"><span class="eyebrow">Inteligentní nástroje</span><h2>Najděte si péči na míru</h2></div>
    <div class="card-grid tools-grid">
      <a class="tool-card" href="/nastroje/poradce/"><h3>Anti-aging poradce</h3><p>Zadejte věk, typ pleti a cíl. Doporučíme ingredience, technologie i rutinu.</p><span class="card-arrow">→</span></a>
      <a class="tool-card" href="/nastroje/builder-rutiny/"><h3>Builder rutiny</h3><p>Sestavíme ranní i večerní péči podle vašich parametrů.</p><span class="card-arrow">→</span></a>
      <a class="tool-card" href="/nastroje/kompatibilita/"><h3>Kompatibilita látek</h3><p>Zkontrolujte, zda se vaše aktivní látky snesou.</p><span class="card-arrow">→</span></a>
      <a class="tool-card" href="/nastroje/vyhledavac-ingredienci/"><h3>Vyhledávač ingrediencí</h3><p>Najděte látku podle problému, typu pleti nebo cíle.</p><span class="card-arrow">→</span></a>
    </div>
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
    <div class="sec-head"><span class="eyebrow">Z magazínu</span><h2>Nejnovější články</h2><a class="sec-more" href="/clanky/">Celý magazín →</a></div>
    <div class="card-grid">${featArticle}${featProd}</div>
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
function exportToolData() {
  const slim = (e, fields) => { const o = { slug: e.slug, name: e.name, url: urlOf(e), type: e.type }; for (const f of fields) if (e[f] !== undefined) o[f] = e[f]; return o; };
  const data = {
    ingredients: entitiesByType('ingredient').map((e) => ({ ...slim(e, ['excerpt', 'evidenceLevel', 'indications', 'suitableSkinTypes', 'suitableAgeGroups', 'compatibility', 'concentrations']), problems: [...(e._rel.problem || [])] })),
    technologies: entitiesByType('technology').map((e) => ({ ...slim(e, ['excerpt', 'evidenceLevel', 'pros', 'cons']), problems: [...(e._rel.problem || [])], ageGroups: [...(e._rel.ageGroup || [])] })),
    products: entitiesByType('product').map((e) => ({ ...slim(e, ['excerpt', 'evidenceLevel', 'category', 'price', 'pros', 'cons', 'activeIngredients']), problems: [...(e._rel.problem || [])], ageGroups: [...(e._rel.ageGroup || [])] })),
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
  const urls = ['/', '/nastroje/', '/hledat/', '/slovnik/', ...Object.values(TYPES).map((c) => c.base), ...entities.map(urlOf),
    ...['poradce', 'builder-rutiny', 'kompatibilita', 'vyhledavac-ingredienci', 'porovnani-produktu', 'doporuceni-technologii'].map((s) => `/nastroje/${s}/`)];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...new Set(urls)]
    .map((u) => `  <url><loc>${SITE.url}${u}</loc></url>`).join('\n')}\n</urlset>\n`;
  writeFileSync(join(OUT, 'sitemap.xml'), xml);
  writeFileSync(join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE.url}/sitemap.xml\n`);
}

/* ----------------------------------------------------------------------------
 * BUILD
 * ------------------------------------------------------------------------- */
function build() {
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

  // statická aktiva
  if (existsSync(ASSETS_SRC)) cpSync(ASSETS_SRC, join(OUT, 'assets'), { recursive: true });

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
  toolPage('porovnani-produktu', 'Porovnání produktů', 'Vyberte produkty a porovnejte je vedle sebe.', `<div id="productCompare" class="tool-app"></div>`);
  toolPage('doporuceni-technologii', 'Doporučení technologií', 'Najděte technologii podle problému a věku.', `<div id="techRecommender" class="tool-app"></div>`);

  // vyhledávání
  searchPage();

  // exporty
  exportToolData();
  exportSearchIndex();
  exportSitemap();

  const count = entities.length;
  const pages = count + Object.keys(TYPES).length + 9;
  console.log(`✓ Aevia build hotov: ${count} entit, ~${pages} stránek → ${OUT}`);
}

build();

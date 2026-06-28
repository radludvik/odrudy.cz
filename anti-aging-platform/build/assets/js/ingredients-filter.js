/* antiagelab.cz — Databáze ingrediencí: vyhledávání, filtry, rychlé vstupy */
(function () {
  var app = document.getElementById('ingredientDb');
  if (!app) return;
  var BASE = window.AEVIA_BASE || '';

  var EFFECT_L = { vrasky: 'Vrásky', pigmentace: 'Pigmentace', hydratace: 'Hydratace', elasticita: 'Elasticita', bariera: 'Bariéra pleti', akne: 'Akné', zarudnuti: 'Zarudnutí', citlivost: 'Citlivost', textura: 'Textura pleti', rozjasneni: 'Rozjasnění', 'prevence-fotostarnuti': 'Prevence fotostárnutí' };
  var TYPE_L = { retinoidy: 'Retinoidy', antioxidanty: 'Antioxidanty', peptidy: 'Peptidy', kyseliny: 'Kyseliny', hydratacni: 'Hydratační látky', 'barierove-lipidy': 'Bariérové lipidy', rozjasnujici: 'Rozjasňující látky', zklidnujici: 'Zklidňující látky', 'rustove-faktory': 'Růstové faktory', fermenty: 'Fermenty', 'exosomy-pdrn': 'Exosomy / PDRN', rostlinne: 'Rostlinné alternativy' };
  var SKIN_L = { sucha: 'Suchá', citliva: 'Citlivá', mastna: 'Mastná', smisena: 'Smíšená', zrala: 'Zralá', aknozni: 'Aknózní', rosacea: 'Rosacea' };
  var AGE_L = { '25': '25+', '30': '30+', '35': '35+', '40': '40+', '45': '45+', '50': '50+', '60': '60+' };
  var EV_L = { silne: 'Silné důkazy', dobre: 'Dobré důkazy', omezene: 'Omezené důkazy', experimentalni: 'Experimentální', none: 'Nedostatek důkazů' };
  var EV_DOT = { silne: '🟢', dobre: '🟡', omezene: '🟠', experimentalni: '⚪', none: '⚪' };
  var TOL_L = { beginner: 'Vhodné pro začátečníky', sensitive: 'Vhodné pro citlivou pleť', irritation: 'Vyšší riziko podráždění', pregnancy: 'Nevhodné v těhotenství', spf: 'Nutné používat SPF' };
  var ROUT_L = { am: 'Ráno', pm: 'Večer', denne: 'Denně', dvakrat: '2–3× týdně', postupne: 'Jen postupně zavádět' };
  var RISK_ORDER = { low: 0, medium: 1, high: 2 };
  var SORTS = [['evidence', 'Nejsilnější důkazy'], ['beginner', 'Pro začátečníky'], ['sensitive', 'Pro citlivou pleť'], ['wrinkles', 'Nejúčinnější proti vráskám'], ['risk', 'Nejnižší riziko podráždění'], ['alpha', 'Abecedně']];
  var QUICK = [
    ['Chci řešit vrásky', { effect: ['vrasky'] }],
    ['Mám citlivou pleť', { skin: ['citliva'] }],
    ['Chci začít s retinoidy', { type: ['retinoidy'] }],
    ['Hledám hydrataci', { effect: ['hydratace'] }],
    ['Chci rozjasnit pleť', { effect: ['rozjasneni'] }],
    ['Nechci podráždění', { tol: ['sensitive'] }],
  ];

  var items = [], filters = {}, sort = 'evidence', searchTerm = '', GROUPS = [];

  fetch(BASE + '/assets/data/ingredients-data.json').then(function (r) { return r.json(); }).then(function (d) {
    items = d; buildGroups(); render();
  }).catch(function () { app.innerHTML = '<p class="empty">Data se nepodařilo načíst.</p>'; });

  function buildGroups() {
    GROUPS = [
      { key: 'effect', label: 'Hlavní účinek', opts: ['vrasky', 'pigmentace', 'hydratace', 'elasticita', 'bariera', 'akne', 'zarudnuti', 'citlivost', 'textura', 'rozjasneni', 'prevence-fotostarnuti'].map(function (v) { return [v, EFFECT_L[v]]; }) },
      { key: 'type', label: 'Typ látky', opts: ['retinoidy', 'antioxidanty', 'peptidy', 'kyseliny', 'hydratacni', 'barierove-lipidy', 'rozjasnujici', 'zklidnujici', 'rustove-faktory', 'fermenty', 'exosomy-pdrn', 'rostlinne'].map(function (v) { return [v, TYPE_L[v]]; }) },
      { key: 'skin', label: 'Typ pleti', opts: ['sucha', 'citliva', 'mastna', 'smisena', 'zrala', 'aknozni', 'rosacea'].map(function (v) { return [v, SKIN_L[v]]; }) },
      { key: 'age', label: 'Věk', opts: ['25', '30', '35', '40', '45', '50', '60'].map(function (v) { return [v, AGE_L[v]]; }) },
      { key: 'evidence', label: 'Síla důkazů', opts: ['silne', 'dobre', 'omezene', 'experimentalni', 'none'].map(function (v) { return [v, EV_L[v]]; }) },
      { key: 'tol', label: 'Tolerance', opts: ['beginner', 'sensitive', 'irritation', 'pregnancy', 'spf'].map(function (v) { return [v, TOL_L[v]]; }) },
      { key: 'routine', label: 'Denní rutina', opts: ['am', 'pm', 'denne', 'dvakrat', 'postupne'].map(function (v) { return [v, ROUT_L[v]]; }) },
    ];
  }
  function labelFor(key, v) { return ({ effect: EFFECT_L, type: TYPE_L, skin: SKIN_L, age: AGE_L, evidence: EV_L, tol: TOL_L, routine: ROUT_L }[key] || {})[v] || v; }
  function active(k) { return filters[k] || []; }
  function toggle(k, v) { var a = filters[k] || []; var i = a.indexOf(v); if (i > -1) a.splice(i, 1); else a.push(v); if (a.length) filters[k] = a; else delete filters[k]; }
  function countActive() { var n = 0; Object.keys(filters).forEach(function (k) { n += filters[k].length; }); return n; }

  function matches(it) {
    if (active('effect').length && !active('effect').some(function (v) { return it.effects.indexOf(v) > -1; })) return false;
    if (active('type').length && !active('type').some(function (v) { return it.types.indexOf(v) > -1; })) return false;
    if (active('skin').length && !active('skin').some(function (v) { return it.skins.indexOf(v) > -1; })) return false;
    if (active('age').length) { var maxA = Math.max.apply(null, active('age').map(Number)); if (it.minAge != null && it.minAge > maxA) return false; }
    if (active('evidence').length && active('evidence').indexOf(it.evidence) < 0) return false;
    if (active('tol').length && !active('tol').some(function (v) { return it.tol.indexOf(v) > -1; })) return false;
    if (active('routine').length && !active('routine').some(function (v) { return it.routine.indexOf(v) > -1; })) return false;
    if (searchTerm && it.search.indexOf(searchTerm) < 0) return false;
    return true;
  }
  function sortFn(a, b) {
    switch (sort) {
      case 'beginner': return (b.beginner - a.beginner) || (b.evRank - a.evRank);
      case 'sensitive': return (b.sensitive - a.sensitive) || (b.evRank - a.evRank);
      case 'wrinkles': return ((b.effects.indexOf('vrasky') > -1) - (a.effects.indexOf('vrasky') > -1)) || (b.evRank - a.evRank);
      case 'risk': return (RISK_ORDER[a.risk] - RISK_ORDER[b.risk]) || (b.evRank - a.evRank);
      case 'alpha': return a.name.localeCompare(b.name, 'cs');
      default: return (b.evRank - a.evRank) || a.name.localeCompare(b.name, 'cs');
    }
  }
  function filtered() { return items.filter(matches).sort(sortFn); }

  function render() {
    app.innerHTML =
      '<div class="cmp-quick"><span class="cmp-quick-l">Rychlý start:</span>' + QUICK.map(function (q, i) { return '<button type="button" class="cmp-qbtn" data-i="' + i + '">' + esc(q[0]) + '</button>'; }).join('') + '</div>' +
      '<div class="cmp-toolbar">' +
        '<input type="search" class="cmp-search" placeholder="Hledat ingredienci nebo problém…" aria-label="Hledat">' +
        '<button type="button" class="btn btn--ghost cmp-filter-btn">Filtry<span class="cmp-fbadge"></span></button>' +
        '<span class="cmp-count"></span>' +
        '<label class="cmp-sort-wrap">Řadit: <select class="cmp-sort">' + SORTS.map(function (s) { return '<option value="' + s[0] + '"' + (s[0] === sort ? ' selected' : '') + '>' + s[1] + '</option>'; }).join('') + '</select></label>' +
      '</div>' +
      '<div class="cmp-body">' +
        '<aside class="cmp-filters" aria-label="Filtry"><div class="cmp-filters-head"><strong>Filtry</strong><button type="button" class="cmp-fclose" aria-label="Zavřít">×</button></div>' +
          '<div class="cmp-groups">' + GROUPS.map(groupHtml).join('') + '</div>' +
          '<div class="cmp-filters-foot"><button type="button" class="btn btn--ghost cmp-clear">Vymazat filtry</button><button type="button" class="btn btn--primary cmp-show">Zobrazit výsledky</button></div></aside>' +
        '<div class="cmp-overlay"></div>' +
        '<div class="cmp-main"><div class="cmp-chips"></div><div class="cmp-grid"></div></div>' +
      '</div>';
    bind(); update();
  }
  function groupHtml(g) {
    return '<div class="cmp-group"><h4>' + g.label + '</h4><div class="cmp-pills" data-group="' + g.key + '">' +
      g.opts.map(function (o) { return '<button type="button" class="cmp-pill" data-v="' + escA(o[0]) + '">' + esc(o[1]) + '</button>'; }).join('') + '</div></div>';
  }
  function bind() {
    app.querySelector('.cmp-sort').addEventListener('change', function () { sort = this.value; update(); });
    app.querySelector('.cmp-search').addEventListener('input', function () { searchTerm = this.value.trim().toLowerCase(); update(); });
    app.querySelectorAll('.cmp-pills').forEach(function (grp) { grp.addEventListener('click', function (e) { var b = e.target.closest('.cmp-pill'); if (!b) return; toggle(grp.getAttribute('data-group'), b.getAttribute('data-v')); update(); }); });
    app.querySelector('.cmp-clear').addEventListener('click', function () { filters = {}; update(); });
    app.querySelector('.cmp-filter-btn').addEventListener('click', openModal);
    app.querySelector('.cmp-fclose').addEventListener('click', closeModal);
    app.querySelector('.cmp-show').addEventListener('click', closeModal);
    app.querySelector('.cmp-overlay').addEventListener('click', closeModal);
    app.querySelectorAll('.cmp-qbtn').forEach(function (b) { b.addEventListener('click', function () { var preset = QUICK[+b.getAttribute('data-i')][1]; filters = {}; Object.keys(preset).forEach(function (k) { filters[k] = preset[k].slice(); }); update(); app.querySelector('.cmp-main').scrollIntoView({ behavior: 'smooth', block: 'start' }); }); });
  }
  function openModal() { app.querySelector('.cmp-filters').classList.add('is-open'); app.querySelector('.cmp-overlay').classList.add('is-open'); document.body.style.overflow = 'hidden'; }
  function closeModal() { app.querySelector('.cmp-filters').classList.remove('is-open'); app.querySelector('.cmp-overlay').classList.remove('is-open'); document.body.style.overflow = ''; }

  function update() {
    app.querySelectorAll('.cmp-pills').forEach(function (grp) { var k = grp.getAttribute('data-group'); grp.querySelectorAll('.cmp-pill').forEach(function (b) { b.classList.toggle('is-active', active(k).indexOf(b.getAttribute('data-v')) > -1); }); });
    app.querySelectorAll('.cmp-qbtn').forEach(function (b) { var preset = QUICK[+b.getAttribute('data-i')][1]; var on = Object.keys(preset).every(function (k) { return active(k).indexOf(preset[k][0]) > -1; }); b.classList.toggle('is-active', on); });
    var list = filtered();
    var n = countActive();
    app.querySelector('.cmp-fbadge').textContent = n ? ' (' + n + ')' : '';
    app.querySelector('.cmp-count').textContent = list.length + ' ' + plural(list.length, 'ingredience', 'ingredience', 'ingrediencí');
    renderChips(); renderGrid(list);
  }
  function renderChips() {
    var wrap = app.querySelector('.cmp-chips'); var chips = [];
    Object.keys(filters).forEach(function (k) { filters[k].forEach(function (v) { chips.push([k, v]); }); });
    if (!chips.length) { wrap.innerHTML = ''; return; }
    wrap.innerHTML = chips.map(function (c) { return '<button type="button" class="cmp-chip" data-k="' + c[0] + '" data-v="' + escA(c[1]) + '">' + esc(labelFor(c[0], c[1])) + ' <span>×</span></button>'; }).join('') + '<button type="button" class="cmp-chip cmp-chip--clear">Vymazat vše</button>';
    wrap.querySelectorAll('.cmp-chip').forEach(function (ch) { ch.addEventListener('click', function () { if (ch.classList.contains('cmp-chip--clear')) filters = {}; else toggle(ch.getAttribute('data-k'), ch.getAttribute('data-v')); update(); }); });
  }
  function renderGrid(list) {
    var grid = app.querySelector('.cmp-grid');
    if (!list.length) { grid.innerHTML = emptyHtml(); bindEmpty(); return; }
    grid.innerHTML = list.map(cardHtml).join('');
  }
  function routineLine(it) {
    var t = ''; var am = it.routine.indexOf('am') > -1, pm = it.routine.indexOf('pm') > -1;
    if (am && pm) t = 'Ráno i večer'; else if (am) t = 'Ráno'; else if (pm) t = 'Večer';
    var extra = [];
    if (it.routine.indexOf('dvakrat') > -1) extra.push('2–3× týdně');
    if (it.routine.indexOf('postupne') > -1) extra.push('postupně');
    if (it.tol.indexOf('spf') > -1) extra.push('SPF nutné');
    return [t].concat(extra).filter(Boolean).join(' · ');
  }
  function cardHtml(it) {
    var meta = [TYPE_L[it.types[0]] || ''].concat(it.effectLabels.slice(0, 3)).filter(Boolean).join(' · ');
    var riskTxt = it.risk === 'high' ? '⚠️ Vyšší riziko podráždění' : it.risk === 'medium' ? '⚠️ Střední riziko podráždění' : '✓ Nízké riziko podráždění';
    var skins = it.skins.slice(0, 4).map(function (s) { return SKIN_L[s] || s; }).join(', ');
    return '<article class="cmp-card ing-card">' +
      '<span class="cmp-card-type">' + esc(meta) + '</span>' +
      '<h3 class="cmp-card-name"><a href="' + it.url + '">' + esc(it.name) + '</a></h3>' +
      (skins ? '<p class="ing-skins"><span class="muted small">Vhodné pro:</span> ' + esc(skins) + '</p>' : '') +
      '<p class="ing-ev">' + EV_DOT[it.evidence] + ' ' + esc(EV_L[it.evidence]) + '</p>' +
      '<p class="ing-risk ing-risk--' + it.risk + '">' + riskTxt + '</p>' +
      '<p class="ing-rout">' + esc(routineLine(it)) + '</p>' +
      '<a class="btn btn--ghost btn--sm ing-cta" href="' + it.url + '">Zobrazit detail →</a>' +
    '</article>';
  }
  function emptyHtml() {
    return '<div class="cmp-empty"><p class="empty">Pro tuto kombinaci filtrů jsme nenašli žádnou ingredienci.</p>' +
      '<div class="cmp-empty-actions"><button type="button" class="btn btn--ghost cmp-e-last">Odebrat poslední filtr</button><button type="button" class="btn btn--ghost cmp-e-clear">Vymazat filtry</button><button type="button" class="btn btn--ghost cmp-e-similar">Zobrazit podobné ingredience</button></div></div>';
  }
  function bindEmpty() {
    var last = app.querySelector('.cmp-e-last'); if (last) last.addEventListener('click', function () { var keys = Object.keys(filters); if (keys.length) { var k = keys[keys.length - 1]; filters[k].pop(); if (!filters[k].length) delete filters[k]; } update(); });
    var cl = app.querySelector('.cmp-e-clear'); if (cl) cl.addEventListener('click', function () { filters = {}; update(); });
    var sim = app.querySelector('.cmp-e-similar'); if (sim) sim.addEventListener('click', function () { var e = filters.effect; filters = {}; if (e) filters.effect = e; update(); });
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function escA(s) { return esc(s).replace(/'/g, '&#39;'); }
  function plural(n, a, b, c) { return n === 1 ? a : (n >= 2 && n <= 4 ? b : c); }
})();

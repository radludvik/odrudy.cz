/* antiagelab.cz — Porovnávač produktů: filtr → výběr → porovnání (vanilla JS) */
(function () {
  var app = document.getElementById('compareApp');
  if (!app) return;
  var BASE = window.AEVIA_BASE || '';

  var TYPE_L = { kosmetika: 'Kosmetika', zarizeni: 'Technologie / beauty zařízení', doplnek: 'Doplňky stravy', procedura: 'Procedury' };
  var CAT_L = { retinoidy: 'Retinoidy', 'vitamin-c': 'Vitamin C', peptidy: 'Peptidy', spf: 'SPF', 'ocni-pece': 'Oční péče', 'led-masky': 'LED masky', radiofrekvence: 'Radiofrekvence', microcurrent: 'Microcurrent', kolagen: 'Kolagen', antioxidanty: 'Antioxidanty' };
  var SKIN_L = { sucha: 'Suchá', citliva: 'Citlivá', mastna: 'Mastná', smisena: 'Smíšená', zrala: 'Zralá', aknozni: 'Aknózní' };
  var PROB_L = { 'jemne-vrasky': 'Jemné vrásky', 'hluboke-vrasky': 'Hluboké vrásky', 'vrasky-kolem-oci': 'Vrásky kolem očí', pigmentace: 'Pigmentace', 'povolena-plet': 'Povolená pleť', suchost: 'Suchost', akne: 'Akné', zarudnuti: 'Zarudnutí', 'nerovnomerny-ton': 'Nerovnoměrný tón' };
  var ACT_L = { retinal: 'Retinal', retinol: 'Retinol', 'vitamin-c': 'Vitamin C', niacinamid: 'Niacinamid', peptidy: 'Peptidy', ceramidy: 'Ceramidy', led: 'LED', rf: 'RF', microcurrent: 'Microcurrent', spf: 'SPF' };
  var PRICE_L = { lt500: 'do 500 Kč', b1: '500–1 500 Kč', b2: '1 500–3 000 Kč', b3: '3 000–8 000 Kč', gt8000: '8 000 Kč+' };
  var RATE_L = { '9': '9+', '8': '8+', '7': '7+', '6': '6+' };
  var EV_L = { strong: 'Silné důkazy', moderate: 'Dobré důkazy', limited: 'Omezené důkazy', preliminary: 'Experimentální' };
  var AGE_L = { '25': '25+', '30': '30+', '35': '35+', '40': '40+', '45': '45+', '50': '50+', '60': '60+' };
  var SORTS = [['rating', 'Nejlepší hodnocení'], ['price-asc', 'Nejnižší cena'], ['price-desc', 'Nejvyšší cena'], ['value', 'Nejlepší cena/výkon'], ['sensitive', 'Nejvhodnější pro citlivou pleť'], ['evidence', 'Nejsilnější důkazy'], ['popular', 'Nejoblíbenější']];

  var items = [], filters = {}, sort = 'rating', selected = [], MAX = 4;
  var GROUPS = []; // built after data load

  fetch(BASE + '/assets/data/compare-data.json').then(function (r) { return r.json(); }).then(function (data) {
    items = data;
    buildGroups();
    render();
  }).catch(function () { app.innerHTML = '<p class="empty">Data porovnávače se nepodařilo načíst.</p>'; });

  function uniqSorted(arr) { var seen = {}, out = []; arr.forEach(function (v) { if (v && !seen[v]) { seen[v] = 1; out.push(v); } }); return out.sort(function (a, b) { return String(a).localeCompare(String(b), 'cs'); }); }

  function buildGroups() {
    var brands = uniqSorted(items.map(function (i) { return i.brand; }).filter(Boolean));
    GROUPS = [
      { key: 'type', label: 'Typ položky', opts: ['kosmetika', 'zarizeni', 'doplnek', 'procedura'].map(function (v) { return [v, TYPE_L[v]]; }) },
      { key: 'cat', label: 'Kategorie', opts: ['retinoidy', 'vitamin-c', 'peptidy', 'spf', 'ocni-pece', 'led-masky', 'radiofrekvence', 'microcurrent', 'kolagen', 'antioxidanty'].map(function (v) { return [v, CAT_L[v]]; }) },
      { key: 'brand', label: 'Značka', opts: brands.map(function (b) { return [b, b]; }) },
      { key: 'skin', label: 'Typ pleti', opts: ['sucha', 'citliva', 'mastna', 'smisena', 'zrala', 'aknozni'].map(function (v) { return [v, SKIN_L[v]]; }) },
      { key: 'age', label: 'Věk', opts: ['25', '30', '35', '40', '45', '50', '60'].map(function (v) { return [v, AGE_L[v]]; }) },
      { key: 'problem', label: 'Řešený problém', opts: ['jemne-vrasky', 'hluboke-vrasky', 'vrasky-kolem-oci', 'pigmentace', 'povolena-plet', 'suchost', 'akne', 'zarudnuti', 'nerovnomerny-ton'].map(function (v) { return [v, PROB_L[v]]; }) },
      { key: 'active', label: 'Aktivní látka / technologie', opts: ['retinal', 'retinol', 'vitamin-c', 'niacinamid', 'peptidy', 'ceramidy', 'led', 'rf', 'microcurrent', 'spf'].map(function (v) { return [v, ACT_L[v]]; }) },
      { key: 'price', label: 'Cena', opts: ['lt500', 'b1', 'b2', 'b3', 'gt8000'].map(function (v) { return [v, PRICE_L[v]]; }) },
      { key: 'rating', label: 'Redakční hodnocení', opts: ['9', '8', '7', '6'].map(function (v) { return [v, RATE_L[v]]; }) },
      { key: 'evidence', label: 'Síla důkazů', opts: ['strong', 'moderate', 'limited', 'preliminary'].map(function (v) { return [v, EV_L[v]]; }) },
    ];
  }

  function labelFor(key, v) {
    return ({ type: TYPE_L, cat: CAT_L, brand: null, skin: SKIN_L, age: AGE_L, problem: PROB_L, active: ACT_L, price: PRICE_L, rating: RATE_L, evidence: EV_L }[key] || {})[v] || v;
  }

  function active(key) { return filters[key] || []; }
  function toggle(key, v) {
    var a = filters[key] || [];
    var i = a.indexOf(v);
    if (i > -1) a.splice(i, 1); else a.push(v);
    if (a.length) filters[key] = a; else delete filters[key];
  }
  function countActive() { var n = 0; Object.keys(filters).forEach(function (k) { n += filters[k].length; }); return n; }

  function matches(it) {
    if (active('type').length && active('type').indexOf(it.type) < 0) return false;
    if (active('cat').length && active('cat').indexOf(it.cat) < 0) return false;
    if (active('brand').length && active('brand').indexOf(it.brand) < 0) return false;
    if (active('skin').length && !active('skin').some(function (v) { return it.skins.indexOf(v) > -1; })) return false;
    if (active('age').length) { var maxA = Math.max.apply(null, active('age').map(Number)); if (it.minAge != null && it.minAge > maxA) return false; }
    if (active('problem').length && !active('problem').some(function (v) { return it.problems.indexOf(v) > -1; })) return false;
    if (active('active').length && !active('active').some(function (v) { return it.actives.indexOf(v) > -1; })) return false;
    if (active('price').length && active('price').indexOf(it.priceBucket) < 0) return false;
    if (active('rating').length) { var minR = Math.min.apply(null, active('rating').map(Number)); if (it.score == null || it.score < minR) return false; }
    if (active('evidence').length && active('evidence').indexOf(it.evidence) < 0) return false;
    return true;
  }

  function sortFn(a, b) {
    var sa = a.score == null ? -1 : a.score, sb = b.score == null ? -1 : b.score;
    var pa = a.priceNum == null ? Infinity : a.priceNum, pb = b.priceNum == null ? Infinity : b.priceNum;
    switch (sort) {
      case 'price-asc': return pa - pb;
      case 'price-desc': return (pb === Infinity ? -1 : pb) - (pa === Infinity ? -1 : pa);
      case 'value': return (sb / (pb || 1e9)) - (sa / (pa || 1e9));
      case 'sensitive': return (b.sensitive - a.sensitive) || (sb - sa);
      case 'evidence': return ((b.evRank == null ? -1 : b.evRank) - (a.evRank == null ? -1 : a.evRank)) || (sb - sa);
      default: return sb - sa; // rating / popular
    }
  }

  function filtered() { return items.filter(matches).sort(sortFn); }

  /* ---------- render ---------- */
  function render() {
    app.innerHTML =
      '<div class="cmp-toolbar">' +
        '<input type="search" class="cmp-search" placeholder="Hledat název nebo značku…" aria-label="Hledat">' +
        '<button type="button" class="btn btn--ghost cmp-filter-btn">Filtry<span class="cmp-fbadge"></span></button>' +
        '<span class="cmp-count"></span>' +
        '<label class="cmp-sort-wrap">Řadit: <select class="cmp-sort">' + SORTS.map(function (s) { return '<option value="' + s[0] + '"' + (s[0] === sort ? ' selected' : '') + '>' + s[1] + '</option>'; }).join('') + '</select></label>' +
      '</div>' +
      '<div class="cmp-body">' +
        '<aside class="cmp-filters" aria-label="Filtry">' +
          '<div class="cmp-filters-head"><strong>Filtry</strong><button type="button" class="cmp-fclose" aria-label="Zavřít">×</button></div>' +
          '<div class="cmp-groups">' + GROUPS.map(groupHtml).join('') + '</div>' +
          '<div class="cmp-filters-foot"><button type="button" class="btn btn--ghost cmp-clear">Vymazat filtry</button><button type="button" class="btn btn--primary cmp-show">Zobrazit výsledky</button></div>' +
        '</aside>' +
        '<div class="cmp-overlay"></div>' +
        '<div class="cmp-main"><div class="cmp-chips"></div><div class="cmp-grid"></div></div>' +
      '</div>' +
      '<div class="cmp-tray" hidden></div>' +
      '<div class="cmp-compare"></div>';
    bind();
    update();
  }
  function groupHtml(g) {
    if (g.key === 'brand') {
      return '<div class="cmp-group"><h4>' + g.label + '</h4><select class="cmp-brand" aria-label="Značka"><option value="">Všechny značky</option>' +
        g.opts.map(function (o) { return '<option value="' + escAttr(o[0]) + '">' + esc(o[1]) + '</option>'; }).join('') + '</select></div>';
    }
    return '<div class="cmp-group"><h4>' + g.label + '</h4><div class="cmp-pills" data-group="' + g.key + '">' +
      g.opts.map(function (o) { return '<button type="button" class="cmp-pill" data-v="' + escAttr(o[0]) + '">' + esc(o[1]) + '</button>'; }).join('') +
      '</div></div>';
  }

  var searchTerm = '';
  function bind() {
    app.querySelector('.cmp-sort').addEventListener('change', function () { sort = this.value; update(); });
    app.querySelector('.cmp-search').addEventListener('input', function () { searchTerm = this.value.trim().toLowerCase(); update(); });
    app.querySelectorAll('.cmp-pills').forEach(function (grp) {
      grp.addEventListener('click', function (e) {
        var b = e.target.closest('.cmp-pill'); if (!b) return;
        toggle(grp.getAttribute('data-group'), b.getAttribute('data-v'));
        update();
      });
    });
    var bsel = app.querySelector('.cmp-brand');
    if (bsel) bsel.addEventListener('change', function () { if (this.value) filters.brand = [this.value]; else delete filters.brand; update(); });
    app.querySelector('.cmp-clear').addEventListener('click', function () { filters = {}; update(); });
    app.querySelector('.cmp-filter-btn').addEventListener('click', openModal);
    app.querySelector('.cmp-fclose').addEventListener('click', closeModal);
    app.querySelector('.cmp-show').addEventListener('click', closeModal);
    app.querySelector('.cmp-overlay').addEventListener('click', closeModal);
  }
  function openModal() { app.querySelector('.cmp-filters').classList.add('is-open'); app.querySelector('.cmp-overlay').classList.add('is-open'); document.body.style.overflow = 'hidden'; }
  function closeModal() { app.querySelector('.cmp-filters').classList.remove('is-open'); app.querySelector('.cmp-overlay').classList.remove('is-open'); document.body.style.overflow = ''; }

  function update() {
    // pill active states
    var bsel = app.querySelector('.cmp-brand'); if (bsel) bsel.value = active('brand')[0] || '';
    app.querySelectorAll('.cmp-pills').forEach(function (grp) {
      var key = grp.getAttribute('data-group');
      grp.querySelectorAll('.cmp-pill').forEach(function (b) {
        b.classList.toggle('is-active', active(key).indexOf(b.getAttribute('data-v')) > -1);
      });
    });
    var list = filtered();
    if (searchTerm) list = list.filter(function (i) { return (i.name + ' ' + i.brand).toLowerCase().indexOf(searchTerm) > -1; });
    var n = countActive();
    app.querySelector('.cmp-fbadge').textContent = n ? ' (' + n + ')' : '';
    app.querySelector('.cmp-count').textContent = list.length + ' ' + plural(list.length, 'výsledek', 'výsledky', 'výsledků');
    renderChips();
    renderGrid(list);
    renderTray();
  }

  function renderChips() {
    var wrap = app.querySelector('.cmp-chips');
    var chips = [];
    Object.keys(filters).forEach(function (k) { filters[k].forEach(function (v) { chips.push([k, v]); }); });
    if (!chips.length) { wrap.innerHTML = ''; return; }
    wrap.innerHTML = chips.map(function (c) { return '<button type="button" class="cmp-chip" data-k="' + c[0] + '" data-v="' + escAttr(c[1]) + '">' + esc(labelFor(c[0], c[1])) + ' <span>×</span></button>'; }).join('') +
      '<button type="button" class="cmp-chip cmp-chip--clear">Vymazat vše</button>';
    wrap.querySelectorAll('.cmp-chip').forEach(function (ch) {
      ch.addEventListener('click', function () {
        if (ch.classList.contains('cmp-chip--clear')) { filters = {}; }
        else { toggle(ch.getAttribute('data-k'), ch.getAttribute('data-v')); }
        update();
      });
    });
  }

  function renderGrid(list) {
    var grid = app.querySelector('.cmp-grid');
    if (!list.length) { grid.innerHTML = emptyHtml(); bindEmpty(); return; }
    grid.innerHTML = list.map(cardHtml).join('');
    grid.querySelectorAll('.cmp-add').forEach(function (btn) {
      btn.addEventListener('click', function () { toggleSelect(btn.getAttribute('data-id')); });
    });
  }
  function cardHtml(it) {
    var isSel = selected.indexOf(it.id) > -1;
    var main = it.activeLabels[0] || it.catLabel || '—';
    var probs = it.problems.slice(0, 3).map(function (p) { return PROB_L[p] || p; }).join(', ');
    return '<article class="cmp-card' + (isSel ? ' is-selected' : '') + '">' +
      '<span class="cmp-card-type">' + esc(it.typeLabel) + (it.brand ? ' · ' + esc(it.brand) : '') + '</span>' +
      '<h3 class="cmp-card-name"><a href="' + it.url + '">' + esc(it.name) + '</a></h3>' +
      '<dl class="cmp-card-meta">' +
        row('Aktivní látka / tech.', main) +
        (probs ? row('Vhodný na', probs) : '') +
        (it.score != null ? row('Hodnocení', it.score + '/10') : '') +
        (it.price ? row('Cena', esc(it.price)) : '') +
      '</dl>' +
      '<button type="button" class="btn ' + (isSel ? 'btn--ghost' : 'btn--primary') + ' cmp-add" data-id="' + escAttr(it.id) + '">' + (isSel ? '✓ Vybráno' : 'Přidat k porovnání') + '</button>' +
    '</article>';
  }
  function row(k, v) { return '<div><dt>' + k + '</dt><dd>' + v + '</dd></div>'; }

  function emptyHtml() {
    return '<div class="cmp-empty"><p class="empty">Pro tuto kombinaci filtrů jsme nenašli žádné produkty.</p>' +
      '<div class="cmp-empty-actions">' +
        '<button type="button" class="btn btn--ghost cmp-e-last">Odebrat poslední filtr</button>' +
        '<button type="button" class="btn btn--ghost cmp-e-clear">Vymazat všechny filtry</button>' +
        '<button type="button" class="btn btn--ghost cmp-e-similar">Zobrazit podobné produkty</button>' +
      '</div></div>';
  }
  function bindEmpty() {
    var last = app.querySelector('.cmp-e-last'); if (last) last.addEventListener('click', function () { var keys = Object.keys(filters); if (keys.length) { var k = keys[keys.length - 1]; filters[k].pop(); if (!filters[k].length) delete filters[k]; } update(); });
    var cl = app.querySelector('.cmp-e-clear'); if (cl) cl.addEventListener('click', function () { filters = {}; update(); });
    var sim = app.querySelector('.cmp-e-similar'); if (sim) sim.addEventListener('click', function () { var t = filters.type; filters = {}; if (t) filters.type = t; update(); });
  }

  /* ---------- výběr a porovnání ---------- */
  function toggleSelect(id) {
    var i = selected.indexOf(id);
    if (i > -1) selected.splice(i, 1);
    else { if (selected.length >= MAX) { flashTray(); return; } selected.push(id); }
    update();
  }
  function byId(id) { for (var i = 0; i < items.length; i++) if (items[i].id === id) return items[i]; }
  function renderTray() {
    var tray = app.querySelector('.cmp-tray');
    if (!selected.length) { tray.hidden = true; tray.innerHTML = ''; return; }
    tray.hidden = false;
    tray.innerHTML = '<div class="cmp-tray-items">' + selected.map(function (id) { var it = byId(id); return '<span class="cmp-tray-item">' + esc(it.name) + '<button type="button" class="cmp-tray-x" data-id="' + escAttr(id) + '" aria-label="Odebrat">×</button></span>'; }).join('') +
      '</div><div class="cmp-tray-actions"><span class="muted small">' + selected.length + '/' + MAX + '</span>' +
      '<button type="button" class="btn btn--ghost cmp-tray-clear">Zrušit výběr</button>' +
      '<button type="button" class="btn btn--primary cmp-tray-go"' + (selected.length < 2 ? ' disabled' : '') + '>Porovnat (' + selected.length + ')</button></div>';
    tray.querySelectorAll('.cmp-tray-x').forEach(function (b) { b.addEventListener('click', function () { toggleSelect(b.getAttribute('data-id')); }); });
    tray.querySelector('.cmp-tray-clear').addEventListener('click', function () { selected = []; closeCompare(); update(); });
    var go = tray.querySelector('.cmp-tray-go'); if (go && !go.disabled) go.addEventListener('click', renderCompare);
  }
  function flashTray() { var t = app.querySelector('.cmp-tray'); if (t) { t.classList.add('cmp-tray--flash'); setTimeout(function () { t.classList.remove('cmp-tray--flash'); }, 500); } }

  var COMPARE_ROWS = [
    ['Značka', function (it) { return esc(it.brand || '—'); }],
    ['Typ', function (it) { return esc(it.typeLabel); }],
    ['Kategorie', function (it) { return esc(it.catLabel || '—'); }],
    ['Cena', function (it) { return esc(it.price || '—'); }],
    ['Aktivní látky / technologie', function (it) { return it.activeLabels.length ? esc(it.activeLabels.join(', ')) : '—'; }],
    ['Vhodné pro', function (it) { var p = it.problems.map(function (x) { return PROB_L[x] || x; }); return (it.suitableFor.length ? it.suitableFor.map(esc).join('; ') : (p.length ? p.map(esc).join(', ') : '—')); }],
    ['Nevhodné pro', function (it) { return it.notSuitable.length ? it.notSuitable.map(esc).join('; ') : '—'; }],
    ['Výhody', function (it) { return it.pros.length ? '<ul>' + it.pros.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '—'; }],
    ['Nevýhody', function (it) { return it.cons.length ? '<ul>' + it.cons.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '—'; }],
    ['Redakční hodnocení', function (it) { return it.score != null ? '<strong>' + it.score + '/10</strong>' : '—'; }],
    ['Síla důkazů', function (it) { return it.evidence ? esc(EV_L[it.evidence] || it.evidence) : '—'; }],
    ['Nejlepší alternativa', function (it) { return it.alt ? (it.alt.url ? '<a href="' + it.alt.url + '">' + esc(it.alt.name) + '</a>' : esc(it.alt.name)) : '—'; }],
    ['Detail', function (it) { return '<a class="btn btn--ghost btn--sm" href="' + it.url + '">Otevřít →</a>'; }],
  ];
  function renderCompare() {
    var sel = selected.map(byId);
    var head = '<th scope="col">Parametr</th>' + sel.map(function (it) { return '<th scope="col">' + esc(it.name) + '</th>'; }).join('');
    var body = COMPARE_ROWS.map(function (r) {
      return '<tr><th scope="row">' + r[0] + '</th>' + sel.map(function (it) { return '<td>' + r[1](it) + '</td>'; }).join('') + '</tr>';
    }).join('');
    var box = app.querySelector('.cmp-compare');
    box.innerHTML = '<div class="cmp-compare-head"><h2>Porovnání (' + sel.length + ')</h2><button type="button" class="btn btn--ghost cmp-compare-close">Zavřít porovnání</button></div>' +
      '<div class="cmp-table-wrap"><table class="cmp-table"><thead><tr>' + head + '</tr></thead><tbody>' + body + '</tbody></table></div>';
    box.querySelector('.cmp-compare-close').addEventListener('click', closeCompare);
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function closeCompare() { var box = app.querySelector('.cmp-compare'); if (box) box.innerHTML = ''; }

  /* ---------- utils ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function escAttr(s) { return esc(s).replace(/'/g, '&#39;'); }
  function plural(n, a, b, c) { return n === 1 ? a : (n >= 2 && n <= 4 ? b : c); }
})();

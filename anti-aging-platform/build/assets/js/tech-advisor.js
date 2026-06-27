/* antiagelab.cz — „Je tato technologie vhodná právě pro vás?" (per-page widget) */
(function () {
  var BASE = window.AEVIA_BASE || '';
  var CL = { 'jemne-vrasky': 'Jemné vrásky', 'hluboke-vrasky': 'Hluboké vrásky', 'povolena-plet': 'Povolená pleť', 'kontury': 'Kontury obličeje', 'pigmentace': 'Pigmentace', 'akne': 'Akné', 'zarudnuti': 'Zarudnutí', 'jizvy': 'Jizvy', 'elasticita': 'Elasticita', 'hydratace': 'Hydratace' };
  var SKIN = [['', 'Vyberte'], ['sucha', 'Suchá'], ['citliva', 'Citlivá'], ['mastna', 'Mastná'], ['smisena', 'Smíšená'], ['zrala', 'Zralá'], ['aknozni', 'Aknózní'], ['normalni', 'Normální']];
  var AGE = [['', 'Vyberte'], ['20-plus', '20+'], ['30-plus', '30+'], ['40-plus', '40+'], ['50-plus', '50+'], ['60-plus', '60+']];
  var costRank = { 'nízká': 1, 'střední': 2, 'vysoká': 3, 'velmi vysoká': 4 };

  document.querySelectorAll('.tech-advisor').forEach(function (el) {
    var data; try { data = JSON.parse(el.getAttribute('data-tech')); } catch (e) { return; }
    var eff = data.effectiveness || {};
    var concernOpts = Object.keys(eff).sort(function (a, b) { return eff[b] - eff[a]; })
      .map(function (k) { return '<option value="' + k + '">' + (CL[k] || k) + '</option>'; }).join('');
    function sel(id, label, opts) { return '<div class="filter-field"><label>' + label + '</label><select id="' + id + '">' + opts + '</select></div>'; }
    el.querySelector('.ta-controls').innerHTML =
      '<div class="ta-grid">' +
      sel('ta-problem', 'Co řešíte', '<option value="">Vyberte problém</option>' + concernOpts) +
      sel('ta-age', 'Věk', AGE.map(function (a) { return '<option value="' + a[0] + '">' + a[1] + '</option>'; }).join('')) +
      sel('ta-skin', 'Typ pleti', SKIN.map(function (s) { return '<option value="' + s[0] + '">' + s[1] + '</option>'; }).join('')) +
      sel('ta-budget', 'Rozpočet', '<option value="">Vyberte</option><option value="1">Nižší</option><option value="2">Střední</option><option value="3">Vyšší</option>') +
      sel('ta-pref', 'Preference', '<option value="">Domácí i profi</option><option value="ano">Domácí</option><option value="profesionální">Profesionální</option>') +
      '</div>';
    var out = el.querySelector('.ta-result');
    function val(id) { var n = el.querySelector('#' + id); return n ? n.value : ''; }
    function compute() {
      var problem = val('ta-problem');
      if (!problem) { out.innerHTML = '<p class="muted small">Vyberte alespoň problém, který chcete řešit.</p>'; return; }
      var score = eff[problem] || 0;
      var verdict, cls;
      if (score >= 4) { verdict = 'Výborná volba na ' + (CL[problem] || problem).toLowerCase(); cls = 'ta-good'; }
      else if (score === 3) { verdict = 'Dobrá volba na ' + (CL[problem] || problem).toLowerCase(); cls = 'ta-ok'; }
      else if (score >= 1) { verdict = 'Spíše doplňková technologie na ' + (CL[problem] || problem).toLowerCase(); cls = 'ta-mid'; }
      else { verdict = 'Na tento problém není tato technologie ideální'; cls = 'ta-bad'; }
      var stars = '★★★★★☆☆☆☆☆'.slice(5 - score, 10 - score);
      var notes = [];
      var pref = val('ta-pref');
      if (pref === 'ano' && data.home === 'profesionální') notes.push('Pozor: tato technologie je primárně profesionální, ne pro domácí použití.');
      if (pref === 'profesionální' && data.home === 'ano') notes.push('Tato technologie je naopak ideální pro domácí použití.');
      var age = val('ta-age');
      if (age && data.ages && data.ages.length) notes.push(data.ages.indexOf(age) > -1 ? 'Pro váš věk se obvykle hodí.' : 'Pro váš věk bývá relevantnější jiná technologie, přesto může pomoci.');
      var skin = val('ta-skin');
      if (skin && data.skins && data.skins.length) notes.push(data.skins.indexOf(skin) > -1 ? 'Vhodná i pro váš typ pleti.' : 'U vašeho typu pleti postupujte opatrněji.');
      var budget = val('ta-budget');
      if (budget && data.cost && costRank[data.cost]) notes.push(costRank[data.cost] <= +budget ? 'Vejde se do vašeho rozpočtu.' : 'Finančně je nad zvoleným rozpočtem (' + data.cost + ' náročnost).');
      out.innerHTML = '<div class="ta-box ' + cls + '"><p class="ta-verdict">' + stars + ' &nbsp;' + verdict + '</p>' +
        (notes.length ? '<ul class="rich-list">' + notes.map(function (n) { return '<li>' + n + '</li>'; }).join('') + '</ul>' : '') +
        '<p class="muted small">Doporučení je orientační; rozhodující je individuální stav pleti a případná konzultace s odborníkem.</p></div>';
    }
    el.querySelectorAll('select').forEach(function (s) { s.addEventListener('change', compute); });
  });
})();

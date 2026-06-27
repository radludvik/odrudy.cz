/* antiagelab.cz — „Je tento doplněk vhodný právě pro vás?" (per-page widget) */
(function () {
  var CL = { 'jemne-vrasky': 'Jemné vrásky', 'hluboke-vrasky': 'Hluboké vrásky', 'povolena-plet': 'Povolená pleť', 'kontury': 'Kontury obličeje', 'pigmentace': 'Pigmentace', 'akne': 'Akné', 'zarudnuti': 'Zarudnutí', 'jizvy': 'Jizvy', 'elasticita': 'Elasticita', 'hydratace': 'Hydratace', 'pevnost': 'Pevnost pleti', 'vlasy': 'Vlasy', 'nehty': 'Nehty', 'hojeni': 'Hojení a regenerace', 'imunita': 'Imunita', 'antioxidace': 'Antioxidační ochrana' };
  var SKIN = [['', 'Vyberte'], ['sucha', 'Suchá'], ['citliva', 'Citlivá'], ['mastna', 'Mastná'], ['smisena', 'Smíšená'], ['zrala', 'Zralá'], ['aknozni', 'Aknózní'], ['normalni', 'Normální']];
  var AGE = [['', 'Vyberte'], ['20-plus', '20+'], ['30-plus', '30+'], ['40-plus', '40+'], ['50-plus', '50+'], ['60-plus', '60+']];

  document.querySelectorAll('.supp-advisor').forEach(function (el) {
    var data; try { data = JSON.parse(el.getAttribute('data-supp')); } catch (e) { return; }
    var eff = data.effectiveness || {};
    var concernOpts = Object.keys(eff).sort(function (a, b) { return eff[b] - eff[a]; })
      .map(function (k) { return '<option value="' + k + '">' + (CL[k] || k) + '</option>'; }).join('');
    function sel(id, label, opts) { return '<div class="filter-field"><label>' + label + '</label><select id="' + id + '">' + opts + '</select></div>'; }
    el.querySelector('.ta-controls').innerHTML =
      '<div class="ta-grid">' +
      sel('sa-goal', 'Co chcete podpořit', '<option value="">Vyberte oblast</option>' + concernOpts) +
      sel('sa-age', 'Věk', AGE.map(function (a) { return '<option value="' + a[0] + '">' + a[1] + '</option>'; }).join('')) +
      sel('sa-skin', 'Typ pleti', SKIN.map(function (s) { return '<option value="' + s[0] + '">' + s[1] + '</option>'; }).join('')) +
      '</div>';
    var out = el.querySelector('.ta-result');
    function val(id) { var n = el.querySelector('#' + id); return n ? n.value : ''; }
    function compute() {
      var goal = val('sa-goal');
      if (!goal) { out.innerHTML = '<p class="muted small">Vyberte alespoň oblast, kterou chcete podpořit.</p>'; return; }
      var score = eff[goal] || 0;
      var verdict, cls;
      if (score >= 4) { verdict = 'Patří k nejlépe podloženým volbám pro: ' + (CL[goal] || goal).toLowerCase(); cls = 'ta-good'; }
      else if (score === 3) { verdict = 'Rozumná doplňková volba pro: ' + (CL[goal] || goal).toLowerCase(); cls = 'ta-ok'; }
      else if (score >= 1) { verdict = 'Spíše okrajová / experimentální opora pro: ' + (CL[goal] || goal).toLowerCase(); cls = 'ta-mid'; }
      else { verdict = 'Pro tuto oblast nemá tento doplněk relevantní oporu'; cls = 'ta-bad'; }
      var stars = '★★★★★☆☆☆☆☆'.slice(5 - score, 10 - score);
      var notes = [];
      var age = val('sa-age');
      if (age && data.ages && data.ages.length) notes.push(data.ages.indexOf(age) > -1 ? 'Pro váš věk bývá relevantní.' : 'Pro váš věk může být přínos menší, ale neškodí.');
      var skin = val('sa-skin');
      if (skin && data.skins && data.skins.length) notes.push(data.skins.indexOf(skin) > -1 ? 'Často se hodí i pro váš typ pleti.' : 'U vašeho typu pleti nejde o prioritní volbu.');
      out.innerHTML = '<div class="ta-box ' + cls + '"><p class="ta-verdict">' + stars + ' &nbsp;' + verdict + '</p>' +
        (notes.length ? '<ul class="rich-list">' + notes.map(function (n) { return '<li>' + n + '</li>'; }).join('') + '</ul>' : '') +
        '<p class="muted small">Orientační vodítko o síle vědecké opory — nejde o léčebné tvrzení ani o příslib výsledku. Doplněk stravy nenahrazuje pestrou stravu, životní styl ani lékařskou péči.</p></div>';
    }
    el.querySelectorAll('select').forEach(function (s) { s.addEventListener('change', compute); });
  });
})();

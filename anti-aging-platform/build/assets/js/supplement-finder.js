/* antiagelab.cz — „Co chcete podpořit?" průvodce doplňky stravy (landing) */
(function () {
  var CL = { 'jemne-vrasky': 'Jemné vrásky', 'hluboke-vrasky': 'Hluboké vrásky', 'povolena-plet': 'Povolená pleť', 'kontury': 'Kontury obličeje', 'pigmentace': 'Pigmentace', 'akne': 'Akné', 'zarudnuti': 'Zarudnutí', 'jizvy': 'Jizvy', 'elasticita': 'Elasticita', 'hydratace': 'Hydratace', 'pevnost': 'Pevnost pleti', 'vlasy': 'Vlasy', 'nehty': 'Nehty', 'hojeni': 'Hojení a regenerace', 'imunita': 'Imunita', 'antioxidace': 'Antioxidační ochrana' };
  var finder = document.getElementById('suppFinder');
  var grid = document.getElementById('suppGrid');
  if (!finder || !grid) return;
  var hint = document.getElementById('sfHint');
  var cards = Array.prototype.slice.call(grid.querySelectorAll('.supp-card'));
  cards.forEach(function (c) { try { c._eff = JSON.parse(c.getAttribute('data-effectiveness') || '{}'); } catch (e) { c._eff = {}; } c._ev = +(c.getAttribute('data-ev') || 0); });
  var concern = '', minEv = 0;

  function render() {
    var list = cards.slice();
    if (concern) {
      // primárně podle účinnosti na zvolenou oblast, sekundárně podle síly důkazů
      list.sort(function (a, b) { return ((b._eff[concern] || 0) - (a._eff[concern] || 0)) || (b._ev - a._ev); });
    } else {
      list.sort(function (a, b) { return b._ev - a._ev; });
    }
    list.forEach(function (c) { grid.appendChild(c); });
    var shown = 0, recommended = 0;
    list.forEach(function (card) {
      var score = concern ? (card._eff[concern] || 0) : 1;
      var ok = score > 0 && card._ev >= minEv;
      card.hidden = !ok;
      card.classList.remove('is-recommended');
      if (ok) { shown++; if (concern && recommended < 3 && score >= 3 && card._ev >= 3) { card.classList.add('is-recommended'); recommended++; } }
    });
    if (hint) {
      if (concern) hint.innerHTML = 'Doplňky s nejlepší oporou pro <strong>' + (CL[concern] || concern) + '</strong>' + (minEv >= 4 ? ' (jen silně podložené)' : minEv >= 3 ? ' (slušně podložené a lepší)' : '') + ' — řazeno podle účinnosti a síly důkazů. Zobrazeno ' + shown + '.';
      else if (minEv > 0) hint.textContent = 'Zobrazeny doplňky s vyšší silou důkazů (' + shown + ').';
      else hint.textContent = 'Vyberte oblast a doporučíme doplňky s nejlepší vědeckou oporou.';
    }
  }

  finder.querySelectorAll('#sfConcerns .opt').forEach(function (b) {
    b.addEventListener('click', function () {
      var v = b.getAttribute('data-concern');
      if (concern === v) { concern = ''; b.classList.remove('is-active'); }
      else { concern = v; finder.querySelectorAll('#sfConcerns .opt').forEach(function (x) { x.classList.remove('is-active'); }); b.classList.add('is-active'); }
      render();
    });
  });
  finder.querySelectorAll('#sfEv .opt').forEach(function (b) {
    b.addEventListener('click', function () {
      minEv = +(b.getAttribute('data-ev') || 0);
      finder.querySelectorAll('#sfEv .opt').forEach(function (x) { x.classList.remove('is-active'); });
      b.classList.add('is-active');
      render();
    });
  });
})();

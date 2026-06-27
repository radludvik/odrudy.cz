/* antiagelab.cz — „Co chcete řešit?" průvodce technologiemi (landing) */
(function () {
  var CL = { 'jemne-vrasky': 'Jemné vrásky', 'hluboke-vrasky': 'Hluboké vrásky', 'povolena-plet': 'Povolená pleť', 'kontury': 'Kontury obličeje', 'pigmentace': 'Pigmentace', 'akne': 'Akné', 'zarudnuti': 'Zarudnutí', 'jizvy': 'Jizvy', 'elasticita': 'Elasticita', 'hydratace': 'Hydratace' };
  var finder = document.getElementById('techFinder');
  var grid = document.getElementById('techGrid');
  if (!finder || !grid) return;
  var hint = document.getElementById('tfHint');
  var cards = Array.prototype.slice.call(grid.querySelectorAll('.tech-card'));
  cards.forEach(function (c) { try { c._eff = JSON.parse(c.getAttribute('data-effectiveness') || '{}'); } catch (e) { c._eff = {}; } c._home = c.getAttribute('data-home') || ''; });
  var concern = '', pref = '';

  function prefOk(card) {
    if (!pref) return true;
    if (pref === 'ano') return card._home === 'ano' || card._home === 'částečně';
    if (pref === 'profesionální') return card._home === 'profesionální' || card._home === 'částečně';
    return true;
  }

  function render() {
    var list = cards.slice();
    if (concern) {
      list.sort(function (a, b) { return (b._eff[concern] || 0) - (a._eff[concern] || 0); });
      list.forEach(function (c) { grid.appendChild(c); }); // reorder DOM
    }
    var shown = 0, recommended = 0;
    list.forEach(function (card) {
      var score = concern ? (card._eff[concern] || 0) : 1;
      var ok = prefOk(card) && score > 0;
      card.hidden = !ok;
      card.classList.remove('is-recommended');
      if (ok) { shown++; if (concern && recommended < 3 && score >= 3) { card.classList.add('is-recommended'); recommended++; } }
    });
    if (hint) {
      if (concern) hint.innerHTML = 'Nejvhodnější technologie na <strong>' + (CL[concern] || concern) + '</strong>' + (pref ? ' (' + (pref === 'ano' ? 'domácí' : 'profesionální') + ')' : '') + ' — řazeno podle účinnosti. Zobrazeno ' + shown + '.';
      else hint.textContent = 'Vyberte problém a doporučíme nejvhodnější technologie.';
    }
  }

  finder.querySelectorAll('#tfConcerns .opt').forEach(function (b) {
    b.addEventListener('click', function () {
      var v = b.getAttribute('data-concern');
      if (concern === v) { concern = ''; b.classList.remove('is-active'); }
      else { concern = v; finder.querySelectorAll('#tfConcerns .opt').forEach(function (x) { x.classList.remove('is-active'); }); b.classList.add('is-active'); }
      render();
    });
  });
  finder.querySelectorAll('#tfPref .opt').forEach(function (b) {
    b.addEventListener('click', function () {
      pref = b.getAttribute('data-pref') || '';
      finder.querySelectorAll('#tfPref .opt').forEach(function (x) { x.classList.remove('is-active'); });
      b.classList.add('is-active');
      render();
    });
  });
})();

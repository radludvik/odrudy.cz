/* antiagelab.cz — textové vyhledávání ve výpisu procedur */
(function () {
  var input = document.getElementById('procSearch');
  var grid = document.getElementById('procGrid');
  if (!input || !grid) return;
  var cards = Array.prototype.slice.call(grid.querySelectorAll('.card'));
  cards.forEach(function (c) { c._text = (c.textContent || '').toLowerCase(); });
  var countEl = document.getElementById('procCount');
  var emptyEl = document.getElementById('procEmpty');

  function apply() {
    var t = input.value.trim().toLowerCase();
    var n = 0;
    cards.forEach(function (c) { var ok = !t || c._text.indexOf(t) > -1; c.hidden = !ok; if (ok) n++; });
    if (countEl) countEl.textContent = n;
    if (emptyEl) emptyEl.hidden = n !== 0;
  }
  input.addEventListener('input', apply);
  apply();
})();

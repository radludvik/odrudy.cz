/* antiagelab.cz — filtr produktové databáze (klientský, nad staticky vykreslenými kartami) */
(function () {
  var form = document.getElementById('productFilter');
  var grid = document.getElementById('productGrid');
  if (!form || !grid) return;
  var cards = Array.prototype.slice.call(grid.querySelectorAll('.product-card'));
  var selects = Array.prototype.slice.call(form.querySelectorAll('select[data-filter]'));
  var countEl = document.getElementById('fcount');
  var emptyEl = document.getElementById('filterEmpty');
  var total = cards.length;

  // tokenová shoda (mezerou oddělené sloty v data atributu)
  function has(card, attr, val) {
    var v = card.getAttribute('data-' + attr) || '';
    return (' ' + v + ' ').indexOf(' ' + val + ' ') > -1;
  }

  function apply() {
    var f = {};
    selects.forEach(function (s) { if (s.value) f[s.getAttribute('data-filter')] = s.value; });
    var visible = 0;
    cards.forEach(function (card) {
      var ok = true;
      if (f.problem && !has(card, 'problems', f.problem)) ok = false;
      if (ok && f.brand && card.getAttribute('data-brand') !== f.brand) ok = false;
      if (ok && f.category && card.getAttribute('data-category') !== f.category) ok = false;
      if (ok && f.skintype && !has(card, 'skintypes', f.skintype)) ok = false;
      if (ok && f.ingredient && !has(card, 'ingredients', f.ingredient)) ok = false;
      if (ok && f.price && card.getAttribute('data-price') !== f.price) ok = false;
      if (ok && f.score) { var sc = card.getAttribute('data-score'); if (sc === '' || +sc < +f.score) ok = false; }
      if (ok && f.ev) { var ev = card.getAttribute('data-ev'); if (ev === '' || +ev < +f.ev) ok = false; }
      card.hidden = !ok;
      if (ok) visible++;
    });
    if (countEl) countEl.textContent = visible;
    if (emptyEl) emptyEl.hidden = visible !== 0;
    syncUrl(f);
  }

  function syncUrl(f) {
    var q = new URLSearchParams();
    Object.keys(f).forEach(function (k) { q.set(k, f[k]); });
    var qs = q.toString();
    history.replaceState(null, '', qs ? '?' + qs : location.pathname);
  }

  // přednastavení z URL (deep-link např. /produkty/?problem=pigmentace)
  (function initFromUrl() {
    var q = new URLSearchParams(location.search);
    selects.forEach(function (s) {
      var k = s.getAttribute('data-filter');
      if (q.has(k)) s.value = q.get(k);
    });
  })();

  selects.forEach(function (s) { s.addEventListener('change', apply); });
  var reset = document.getElementById('filterReset');
  if (reset) reset.addEventListener('click', function () { selects.forEach(function (s) { s.value = ''; }); apply(); });

  apply();
})();

/* Aevia — klientské fulltextové vyhledávání nad search-index.json */
(function () {
  var input = document.getElementById('searchInput');
  var form = document.getElementById('searchForm');
  var results = document.getElementById('searchResults');
  if (!input || !results) return;

  var index = [];
  fetch('/assets/data/search-index.json').then(function (r) { return r.json(); }).then(function (data) {
    index = data;
    var q = new URLSearchParams(location.search).get('q');
    if (q) { input.value = q; run(q); }
  });

  function card(item) {
    return '<a class="card" href="' + item.url + '"><span class="card-type">' + item.type +
      '</span><h3 class="card-title">' + item.name + '</h3><p class="card-excerpt">' +
      (item.excerpt || '') + '</p><span class="card-foot"><span></span><span class="card-arrow">→</span></span></a>';
  }

  function run(q) {
    q = (q || '').trim().toLowerCase();
    if (!q) { results.innerHTML = '<p class="empty">Zadejte hledaný výraz.</p>'; return; }
    var terms = q.split(/\s+/);
    var hits = index.map(function (item) {
      var hay = (item.name + ' ' + item.excerpt + ' ' + item.keywords + ' ' + item.type).toLowerCase();
      var score = 0;
      terms.forEach(function (t) {
        if (item.name.toLowerCase().indexOf(t) > -1) score += 3;
        else if (hay.indexOf(t) > -1) score += 1;
      });
      return { item: item, score: score };
    }).filter(function (h) { return h.score > 0; }).sort(function (a, b) { return b.score - a.score; });

    if (!hits.length) { results.innerHTML = '<p class="empty">Nic jsme nenašli. Zkuste obecnější výraz.</p>'; return; }
    results.innerHTML = hits.slice(0, 40).map(function (h) { return card(h.item); }).join('');
  }

  if (form) form.addEventListener('submit', function (e) { e.preventDefault(); run(input.value); });
  input.addEventListener('input', function () { run(input.value); });
})();

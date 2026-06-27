/* antiagelab.cz — „Co chcete procvičit?" výběr partie obličejové jógy */
(function () {
  var LABEL = { celo: 'Čelo a vrásky mezi obočím', oci: 'Oční okolí', tvare: 'Tváře a lícní kosti', usta: 'Ústa a nasolabální rýhy', celist: 'Čelist a podbradek', krk: 'Krk a dekolt' };
  var finder = document.getElementById('fyFinder');
  var wrap = document.getElementById('fyGroups');
  if (!finder || !wrap) return;
  var hint = document.getElementById('fyHint');
  var groups = Array.prototype.slice.call(wrap.querySelectorAll('.fy-group'));
  var area = '';

  function render() {
    var shown = 0;
    groups.forEach(function (g) {
      var ok = !area || g.getAttribute('data-area-group') === area;
      g.hidden = !ok;
      if (ok) shown += g.querySelectorAll('.fy-card').length;
    });
    if (hint) hint.innerHTML = area ? 'Nejúčinnější cviky na <strong>' + (LABEL[area] || area) + '</strong> — zobrazeno ' + shown + '.' : 'Vyberte partii obličeje a zobrazíme nejúčinnější cviky pro ni.';
  }

  finder.querySelectorAll('#fyAreas .opt').forEach(function (b) {
    b.addEventListener('click', function () {
      var v = b.getAttribute('data-area');
      if (area === v) { area = ''; b.classList.remove('is-active'); }
      else { area = v; finder.querySelectorAll('#fyAreas .opt').forEach(function (x) { x.classList.remove('is-active'); }); b.classList.add('is-active'); }
      render();
    });
  });
})();

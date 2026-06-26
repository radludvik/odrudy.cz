/* Aevia — interaktivní nástroje (poradce, builder, kompatibilita, vyhledávač, porovnání, technologie)
   Data: /assets/data/tools-data.json (generováno z datového modelu). */
(function () {
  var DATA = null;
  var mounts = ['advisor', 'routineBuilder', 'compatChecker', 'ingredientFinder', 'productCompare', 'techRecommender'];
  if (!mounts.some(function (id) { return document.getElementById(id); })) return;

  fetch('/assets/data/tools-data.json').then(function (r) { return r.json(); }).then(function (d) {
    DATA = d;
    if (document.getElementById('advisor')) initAdvisor();
    if (document.getElementById('routineBuilder')) initRoutineBuilder();
    if (document.getElementById('compatChecker')) initCompat();
    if (document.getElementById('ingredientFinder')) initFinder();
    if (document.getElementById('productCompare')) initCompare();
    if (document.getElementById('techRecommender')) initTech();
  });

  /* ---------- helpers ---------- */
  var EV = { strong: '🟢 Silné důkazy', moderate: '🟡 Středně silné', limited: '🟠 Omezené', preliminary: '⚪ Předběžné' };
  function link(item) { return '<a class="chip" href="' + item.url + '">' + item.name + (item.evidenceLevel ? ' <span class="muted small">' + (EV[item.evidenceLevel] || '').slice(0, 2) + '</span>' : '') + '</a>'; }
  function chips(items) { return items.length ? '<div class="chips">' + items.map(link).join('') + '</div>' : '<p class="empty">Žádné položky.</p>'; }
  function optionGroup(name, opts, multi) {
    return '<div class="opts" data-group="' + name + '" data-multi="' + (multi ? '1' : '') + '">' +
      opts.map(function (o) { return '<button type="button" class="opt" data-value="' + o.v + '">' + o.l + '</button>'; }).join('') + '</div>';
  }
  function bindOpts(root) {
    root.querySelectorAll('.opts').forEach(function (group) {
      var multi = group.getAttribute('data-multi');
      group.querySelectorAll('.opt').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (multi) { btn.classList.toggle('is-active'); }
          else { group.querySelectorAll('.opt').forEach(function (b) { b.classList.remove('is-active'); }); btn.classList.add('is-active'); }
          if (group.dataset.onchange === '1') group.dispatchEvent(new CustomEvent('opts:change'));
        });
      });
    });
  }
  function getVal(root, name) { var b = root.querySelector('.opts[data-group="' + name + '"] .opt.is-active'); return b ? b.getAttribute('data-value') : null; }
  function getVals(root, name) { return Array.prototype.map.call(root.querySelectorAll('.opts[data-group="' + name + '"] .opt.is-active'), function (b) { return b.getAttribute('data-value'); }); }

  var SKIN = [['sucha', 'Suchá'], ['citliva', 'Citlivá'], ['mastna', 'Mastná'], ['smisena', 'Smíšená'], ['zrala', 'Zralá'], ['aknozni', 'Aknózní'], ['normalni', 'Normální']].map(function (x) { return { v: x[0], l: x[1] }; });
  var AGES = [['20-plus', '20+'], ['30-plus', '30+'], ['40-plus', '40+'], ['50-plus', '50+'], ['60-plus', '60+']].map(function (x) { return { v: x[0], l: x[1] }; });

  function problemOpts() { return DATA.problems.map(function (p) { return { v: p.slug, l: p.name }; }); }

  /* ---------- 1. Poradce ---------- */
  function initAdvisor() {
    var el = document.getElementById('advisor');
    el.innerHTML =
      '<div class="tool-grid">' +
      '<div class="field"><label>Věk</label>' + optionGroup('age', AGES) + '</div>' +
      '<div class="field"><label>Typ pleti</label>' + optionGroup('skin', SKIN) + '</div>' +
      '</div>' +
      '<div class="field"><label>Hlavní problém</label>' + optionGroup('problem', problemOpts()) + '</div>' +
      '<div class="tool-grid">' +
      '<div class="field"><label>Citlivost</label>' + optionGroup('sens', [{ v: 'low', l: 'Nízká' }, { v: 'mid', l: 'Střední' }, { v: 'high', l: 'Vysoká' }]) + '</div>' +
      '<div class="field"><label>Preference péče</label>' + optionGroup('pref', [{ v: 'home', l: 'Domácí' }, { v: 'pro', l: 'Profesionální' }, { v: 'both', l: 'Obojí' }]) + '</div>' +
      '<div class="field"><label>Rozpočet</label>' + optionGroup('budget', [{ v: 'low', l: 'Nižší' }, { v: 'mid', l: 'Střední' }, { v: 'high', l: 'Vyšší' }]) + '</div>' +
      '</div>' +
      '<button class="btn btn--primary" id="advRun">Sestavit doporučení</button>' +
      '<div id="advOut"></div>';
    bindOpts(el);
    el.querySelector('#advRun').addEventListener('click', function () {
      var age = getVal(el, 'age'), skin = getVal(el, 'skin'), problem = getVal(el, 'problem'),
        sens = getVal(el, 'sens'), pref = getVal(el, 'pref') || 'both';
      if (!age || !skin || !problem) { el.querySelector('#advOut').innerHTML = '<div class="result-block"><p class="empty">Vyberte prosím alespoň věk, typ pleti a hlavní problém.</p></div>'; return; }

      var ings = DATA.ingredients.filter(function (i) {
        var byProblem = (i.problems || []).indexOf(problem) > -1;
        var bySkin = !i.suitableSkinTypes || i.suitableSkinTypes.indexOf(skin) > -1;
        var byAge = !i.suitableAgeGroups || i.suitableAgeGroups.indexOf(age) > -1;
        return byProblem && bySkin && byAge;
      });
      if (ings.length < 3) { // doplnit dle problému i bez shody věku/pleti
        DATA.ingredients.forEach(function (i) { if ((i.problems || []).indexOf(problem) > -1 && ings.indexOf(i) < 0) ings.push(i); });
      }
      if (sens === 'high') ings.sort(function (a, b) { return (a.slug === 'bakuchiol' || a.slug === 'niacinamid' ? -1 : 0); });

      var techs = DATA.technologies.filter(function (t) { return (t.problems || []).indexOf(problem) > -1 && (!t.ageGroups || t.ageGroups.indexOf(age) > -1); });
      if (pref === 'home') techs = techs.filter(function (t) { return ['led-terapie', 'microcurrent', 'radiofrekvence', 'ems', 'microneedling'].indexOf(t.slug) > -1; });
      var prods = DATA.products.filter(function (p) { return (p.problems || []).indexOf(problem) > -1 || (p.activeIngredients || []).some(function (a) { return ings.some(function (i) { return i.slug === a; }); }); });

      var out = '<div class="result-block">';
      out += '<h3>Doporučené ingredience</h3>' + chips(ings.slice(0, 6));
      out += '<h3>Technologie</h3>' + chips(techs.slice(0, 5));
      out += '<h3>Produkty</h3>' + chips(prods.slice(0, 5));
      out += '<h3>Rutina</h3><p class="muted">Doporučujeme začít ranní rutinou (ochrana + SPF) a večerní rutinou s aktivní látkou. <a href="/rutiny/ranni-rutina/">Ranní rutina</a> · <a href="/rutiny/vecerni-rutina/">Večerní rutina</a></p>';
      if (pref !== 'home') {
        var procs = DATA.technologies; // procedury jsou v jiné sekci; odkážeme na péči podle problému
        out += '<h3>Profesionální péče</h3><p class="muted">Zvažte odbornou konzultaci. Přehled procedur podle problému najdete na stránce <a href="/pece-podle-problemu/' + problem + '/">' + (DATA.problems.find(function (p) { return p.slug === problem; }) || {}).name + '</a>.</p>';
      }
      out += '<p class="muted small" style="margin-top:1.2rem">Doporučení má vzdělávací charakter. Při zdravotních potížích konzultujte dermatologa.</p>';
      out += '</div>';
      el.querySelector('#advOut').innerHTML = out;
    });
  }

  /* ---------- 2. Builder rutiny ---------- */
  function initRoutineBuilder() {
    var el = document.getElementById('routineBuilder');
    el.innerHTML =
      '<div class="tool-grid">' +
      '<div class="field"><label>Typ pleti</label>' + optionGroup('skin', SKIN) + '</div>' +
      '<div class="field"><label>Věk</label>' + optionGroup('age', AGES) + '</div>' +
      '<div class="field"><label>Zkušenost s aktivními látkami</label>' + optionGroup('lvl', [{ v: 'beg', l: 'Začátečník' }, { v: 'adv', l: 'Pokročilý' }]) + '</div>' +
      '</div>' +
      '<button class="btn btn--primary" id="rbRun">Sestavit rutinu</button><div id="rbOut"></div>';
    bindOpts(el);
    el.querySelector('#rbRun').addEventListener('click', function () {
      var skin = getVal(el, 'skin') || 'normalni', age = getVal(el, 'age') || '30-plus', lvl = getVal(el, 'lvl') || 'beg';
      function find(slug) { return DATA.ingredients.find(function (i) { return i.slug === slug; }); }
      var am = ['Jemné čištění', 'Antioxidant (vitamin C)', 'Hydratace' + (skin === 'sucha' ? ' (bohatší krém)' : ''), 'SPF 50'];
      var active = lvl === 'beg' ? (skin === 'citliva' ? 'bakuchiol' : 'retinal') : 'retinol';
      var pm = ['Odličení / dvojí čištění', 'Aktivní látka: ' + (find(active) ? find(active).name : active) + (lvl === 'beg' ? ' (2× týdně, postupně navyšovat)' : ' (dle tolerance)'), 'Hydratace / výživa'];
      if (skin === 'mastna' || skin === 'aknozni') pm.splice(1, 0, 'BHA do T-zóny (ve dnech bez retinoidu)');
      var out = '<div class="result-block"><h3>☀️ Ranní rutina</h3><ol class="steps">' + am.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ol>' +
        '<h3>🌙 Večerní rutina</h3><ol class="steps">' + pm.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ol>' +
        '<p class="muted">Podrobně: <a href="/rutiny/ranni-rutina/">Ranní rutina</a> · <a href="/rutiny/vecerni-rutina/">Večerní rutina</a>. Nikdy nekombinujte více silných aktivních látek naráz.</p></div>';
      el.querySelector('#rbOut').innerHTML = out;
    });
  }

  /* ---------- 3. Kompatibilita ---------- */
  function initCompat() {
    var el = document.getElementById('compatChecker');
    var opts = DATA.ingredients.map(function (i) { return { v: i.slug, l: i.name }; });
    el.innerHTML = '<div class="field"><label>Vyberte aktivní látky (2 a více)</label>' + optionGroup('ings', opts, true) + '</div><div id="cpOut"></div>';
    var grp = el.querySelector('.opts[data-group="ings"]'); grp.dataset.onchange = '1';
    bindOpts(el);
    grp.addEventListener('opts:change', render);
    function lvlInfo(l) { return l === 'good' ? ['Vhodné', 'ok'] : l === 'caution' ? ['Opatrně', 'warn'] : ['Nekombinovat', 'bad']; }
    function render() {
      var sel = getVals(el, 'ings');
      if (sel.length < 2) { el.querySelector('#cpOut').innerHTML = '<div class="result-block"><p class="empty">Vyberte alespoň dvě látky.</p></div>'; return; }
      var rows = '';
      for (var a = 0; a < sel.length; a++) for (var b = a + 1; b < sel.length; b++) {
        var ia = DATA.ingredients.find(function (x) { return x.slug === sel[a]; });
        var ib = DATA.ingredients.find(function (x) { return x.slug === sel[b]; });
        var rule = (ia.compatibility || []).find(function (c) { return c.with === sel[b]; }) || (ib.compatibility || []).find(function (c) { return c.with === sel[a]; });
        var info = rule ? lvlInfo(rule.level) : ['Neznámé', 'warn'];
        var note = rule ? rule.note : 'Pro tuto kombinaci nemáme konkrétní pravidlo — obecně zaveďte látky postupně a sledujte reakci pleti.';
        rows += '<div class="compat compat--' + info[1] + '"><div class="compat-top"><span class="compat-name">' + ia.name + ' + ' + ib.name + '</span><span class="compat-badge ' + info[1] + '">' + info[0] + '</span></div><p class="muted small">' + note + '</p></div>';
      }
      el.querySelector('#cpOut').innerHTML = '<div class="result-block"><h3>Výsledek kombinace</h3><div class="compat-list">' + rows + '</div></div>';
    }
  }

  /* ---------- 4. Vyhledávač ingrediencí ---------- */
  function initFinder() {
    var el = document.getElementById('ingredientFinder');
    el.innerHTML =
      '<div class="field"><label>Problém</label>' + optionGroup('problem', [{ v: '', l: 'Vše' }].concat(problemOpts())) + '</div>' +
      '<div class="tool-grid"><div class="field"><label>Typ pleti</label>' + optionGroup('skin', [{ v: '', l: 'Vše' }].concat(SKIN)) + '</div>' +
      '<div class="field"><label>Věk</label>' + optionGroup('age', [{ v: '', l: 'Vše' }].concat(AGES)) + '</div></div>' +
      '<div id="fdOut"></div>';
    el.querySelectorAll('.opts').forEach(function (g) { g.dataset.onchange = '1'; });
    bindOpts(el);
    el.querySelectorAll('.opts').forEach(function (g) { g.addEventListener('opts:change', render); });
    function render() {
      var problem = getVal(el, 'problem'), skin = getVal(el, 'skin'), age = getVal(el, 'age');
      var res = DATA.ingredients.filter(function (i) {
        if (problem && (i.problems || []).indexOf(problem) < 0) return false;
        if (skin && i.suitableSkinTypes && i.suitableSkinTypes.indexOf(skin) < 0) return false;
        if (age && i.suitableAgeGroups && i.suitableAgeGroups.indexOf(age) < 0) return false;
        return true;
      });
      el.querySelector('#fdOut').innerHTML = '<div class="result-block"><h3>' + res.length + ' ingrediencí</h3>' + chips(res) + '</div>';
    }
    render();
  }

  /* ---------- 5. Porovnání produktů ---------- */
  function initCompare() {
    var el = document.getElementById('productCompare');
    var opts = DATA.products.map(function (p) { return { v: p.slug, l: p.name }; });
    el.innerHTML = '<div class="field"><label>Vyberte produkty</label>' + optionGroup('prods', opts, true) + '</div><div id="pcOut"></div>';
    var grp = el.querySelector('.opts[data-group="prods"]'); grp.dataset.onchange = '1'; bindOpts(el);
    grp.addEventListener('opts:change', render);
    function render() {
      var sel = getVals(el, 'prods').map(function (s) { return DATA.products.find(function (p) { return p.slug === s; }); });
      if (sel.length < 2) { el.querySelector('#pcOut').innerHTML = '<div class="result-block"><p class="empty">Vyberte alespoň dva produkty.</p></div>'; return; }
      var rows = [['Kategorie', 'category'], ['Cena', 'price'], ['Evidence', 'evidenceLevel']];
      var html = '<div class="table-wrap"><table class="compare"><thead><tr><th>Parametr</th>' + sel.map(function (p) { return '<th><a href="' + p.url + '">' + p.name + '</a></th>'; }).join('') + '</tr></thead><tbody>';
      rows.forEach(function (r) {
        html += '<tr><th scope="row">' + r[0] + '</th>' + sel.map(function (p) { var v = p[r[1]]; if (r[1] === 'evidenceLevel') v = EV[v] || v; return '<td>' + (v || '—') + '</td>'; }).join('') + '</tr>';
      });
      html += '<tr><th scope="row">Klady</th>' + sel.map(function (p) { return '<td>' + (p.pros || []).join(', ') + '</td>'; }).join('') + '</tr>';
      html += '<tr><th scope="row">Zápory</th>' + sel.map(function (p) { return '<td>' + (p.cons || []).join(', ') + '</td>'; }).join('') + '</tr>';
      html += '</tbody></table></div>';
      el.querySelector('#pcOut').innerHTML = '<div class="result-block"><h3>Srovnání</h3>' + html + '</div>';
    }
  }

  /* ---------- 6. Doporučení technologií ---------- */
  function initTech() {
    var el = document.getElementById('techRecommender');
    el.innerHTML =
      '<div class="field"><label>Problém</label>' + optionGroup('problem', problemOpts()) + '</div>' +
      '<div class="field"><label>Věk</label>' + optionGroup('age', [{ v: '', l: 'Vše' }].concat(AGES)) + '</div>' +
      '<div id="trOut"></div>';
    el.querySelectorAll('.opts').forEach(function (g) { g.dataset.onchange = '1'; });
    bindOpts(el);
    el.querySelectorAll('.opts').forEach(function (g) { g.addEventListener('opts:change', render); });
    function render() {
      var problem = getVal(el, 'problem'), age = getVal(el, 'age');
      if (!problem) { el.querySelector('#trOut').innerHTML = '<div class="result-block"><p class="empty">Vyberte problém.</p></div>'; return; }
      var res = DATA.technologies.filter(function (t) { return (t.problems || []).indexOf(problem) > -1 && (!age || !t.ageGroups || t.ageGroups.indexOf(age) > -1); });
      el.querySelector('#trOut').innerHTML = '<div class="result-block"><h3>Doporučené technologie</h3>' + chips(res) + '</div>';
    }
  }
})();

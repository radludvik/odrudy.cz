/* Aevia — interaktivní nástroje (poradce, builder, kompatibilita, vyhledávač, porovnání, technologie)
   Data: /assets/data/tools-data.json (generováno z datového modelu). */
(function () {
  var BASE = window.AEVIA_BASE || '';
  var DATA = null;
  var mounts = ['advisor', 'routineBuilder', 'compatChecker', 'ingredientFinder', 'productCompare', 'techRecommender'];
  if (!mounts.some(function (id) { return document.getElementById(id); })) return;

  fetch(BASE + '/assets/data/tools-data.json').then(function (r) { return r.json(); }).then(function (d) {
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
  function link(item) { return '<a class="chip" href="' + BASE + item.url + '">' + item.name + (item.evidenceLevel ? ' <span class="muted small">' + (EV[item.evidenceLevel] || '').slice(0, 2) + '</span>' : '') + '</a>'; }
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

  /* ===================================================================
     Sdílený engine pro rutinu (používá Poradce i Builder rutiny)
     =================================================================== */
  function ing(slug) { return DATA.ingredients.find(function (i) { return i.slug === slug; }); }
  function actChips(slugs) {
    var html = slugs.map(function (s) {
      if (s.indexOf(':') === 0) return '<span class="chip chip--static">' + s.slice(1) + '</span>'; // ":Text" = nelinkovaný štítek
      var it = ing(s); return it ? '<a class="chip" href="' + BASE + it.url + '">' + it.name + '</a>' : '<span class="chip chip--static">' + s + '</span>';
    }).join('');
    return html ? '<div class="routine-chips">' + html + '</div>' : '';
  }
  function skinMoisturizer(skin) {
    if (skin === 'sucha') return 'bohatší krém s ceramidy a cholesterolem, ideálně na ještě vlhkou pleť';
    if (skin === 'mastna' || skin === 'aknozni') return 'lehký nekomedogenní gel-krém';
    if (skin === 'citliva') return 'jednoduchý krém pro citlivou pleť s ceramidy, bez parfemace';
    if (skin === 'smisena') return 'střední emulze, T-zónu lehčeji, tváře bohatěji';
    return 'hydratační krém odpovídající ročnímu období';
  }
  function cleanseAm(skin) {
    if (skin === 'sucha' || skin === 'citliva') return 'ráno stačí opláchnout vlažnou vodou — odpustíte bariéře zbytečné mytí';
    return 'jemný čisticí gel nebo jen vlažná voda; vyhněte se agresivním mýdlům, která narušují bariéru';
  }

  function composeRoutine(o) {
    var skin = o.skin || 'normalni', age = o.age || '30-plus', lvl = o.lvl || 'beg',
      sens = o.sens || 'mid', problem = o.problem || '', preg = !!o.preg;
    var gentle = preg || sens === 'high' || skin === 'citliva';

    // Hlavní noční aktivní látka
    var active, activeNote;
    if (preg) { active = 'bakuchiol'; activeNote = 'retinoidy jsou v těhotenství a při kojení vyloučené — bakuchiol je bezpečná rostlinná alternativa'; }
    else if (sens === 'high' || skin === 'citliva') { active = 'bakuchiol'; activeNote = 'šetrný start; po zvládnutí tolerance lze přejít na retinal'; }
    else if (lvl === 'beg') { active = 'retinal'; activeNote = 'začněte nízkou koncentrací (retinal 0,05 % / retinol 0,2–0,3 %)'; }
    else if (lvl === 'int') { active = 'retinol'; activeNote = 'střední koncentrace (retinol 0,3–0,5 %)'; }
    else { active = 'retinol'; activeNote = 'vyšší koncentrace (0,5–1 %) dle tolerance'; }

    // Exfoliant
    var exf, exfNote;
    if (preg || sens === 'high') { exf = 'aha'; exfNote = 'jen jemná exfoliace (PHA nebo nízké % laktové kyseliny)'; }
    else if (skin === 'mastna' || skin === 'aknozni' || skin === 'smisena') { exf = 'bha'; exfNote = 'BHA proniká do pórů — ideální pro mastnou a aknózní pleť'; }
    else { exf = 'aha'; exfNote = 'AHA na povrchu zlepšuje jas a texturu'; }

    // Cílené sérum podle problému
    var targetAm = null, targetPm = null, targetLabel = '';
    var P = {
      'pigmentace': { am: 'vitamin-c', pm: 'azelaova-kyselina', label: 'pigmentace a tónu' },
      'matna-plet': { am: 'vitamin-c', pm: null, label: 'jasu pleti' },
      'rozsirene-pory': { am: 'niacinamid', pm: null, label: 'pórů a mazu' },
      'rosacea': { am: 'niacinamid', pm: 'azelaova-kyselina', label: 'zarudnutí' },
      'povolena-plet': { am: 'peptidy', pm: 'peptidy', label: 'pevnosti pleti' },
      'jemne-vrasky': { am: null, pm: 'peptidy', label: 'vrásek' },
      'hluboke-vrasky': { am: 'peptidy', pm: 'peptidy', label: 'vrásek' },
      'textura': { am: null, pm: null, label: 'textury' }
    };
    if (P[problem]) { targetAm = P[problem].am; targetPm = P[problem].pm; targetLabel = P[problem].label; }

    // --- Ranní rutina (ochrana) ---
    var am = [];
    am.push({ name: 'Šetrné čištění', purpose: 'Připraví pleť, aniž by ji vysušilo.', how: cleanseAm(skin), freq: 'denně' });
    am.push({ name: 'Antioxidant', purpose: 'Neutralizuje volné radikály z UV a znečištění, podporuje kolagen a zesiluje ochranu SPF.',
      actives: [gentle ? ':Stabilní derivát vitaminu C (jemnější)' : 'vitamin-c'],
      how: 'na suchou pleť 4–5 kapek, nechte ~1 minutu vstřebat' + (gentle ? '; u citlivé pleti zvolte nižší koncentraci nebo derivát' : ''), freq: 'denně ráno' });
    if (targetAm && targetAm !== 'vitamin-c') am.push({ name: 'Cílené sérum (' + targetLabel + ')', purpose: 'Řeší váš hlavní cíl.', actives: [targetAm], freq: 'denně' });
    am.push({ name: 'Hydratace', purpose: 'Doplní vodu i lipidy a uzavře předchozí vrstvy.', actives: ['kyselina-hyaluronova'], how: skinMoisturizer(skin), freq: 'denně' });
    am.push({ name: 'Oční krém', purpose: 'Tenká pokožka okolo očí ocení cílenou hydrataci.', freq: 'volitelně' });
    am.push({ name: 'Opalovací krém SPF 50', purpose: 'Nejúčinnější anti-aging krok — bez něj ztrácejí retinoidy i kyseliny smysl.', actives: [':SPF 50, široké spektrum'], how: '~2 prsty na obličej a krk; venku reaplikujte každé 2 hodiny', freq: 'denně, celoročně' });

    // --- Večerní rutina (regenerace) ---
    var pm = [];
    pm.push({ name: 'První čištění (odličení)', purpose: 'Olej nebo balzám rozpustí SPF, make-up a maz.', how: 'jemně vmasírujte na suchou pleť a emulgujte vodou', freq: 'večer' });
    pm.push({ name: 'Druhé čištění', purpose: 'Jemný gel dočistí pleť pro lepší vstřebání aktivních látek.', how: 'krátce, vlažnou vodou', freq: 'večer' });
    pm.push({ name: 'Aktivní látka dne (dle týdenního rozvrhu)', purpose: 'Jádro anti-agingu. Střídejte retinoid a exfoliaci — nikdy ne ve stejný večer.',
      actives: [active, exf], how: 'množství velikosti hrášku na suchou pleť' + (gentle ? '; metoda „sandwich" (krém → aktivní látka → krém) sníží podráždění' : '') + '; vyhněte se očnímu okolí a koutkům nosu. ' + activeNote + '; ' + exfNote, freq: 'dle rozvrhu níže' });
    if (targetPm) pm.push({ name: 'Cílené ošetření (' + targetLabel + ')', purpose: 'Ve dnech bez silné aktivní látky.', actives: [targetPm], freq: 'recovery noci' });
    pm.push({ name: 'Hydratace / výživa', purpose: 'Podpoří noční regeneraci a bariéru.', how: skinMoisturizer(skin) + '; u retinoidu slouží i jako horní vrstva sandwiche', freq: 'večer' });
    pm.push({ name: 'Oční krém a balzám na rty', purpose: 'Dokončení a komfort přes noc.', freq: 'volitelně' });

    // --- Týdenní rozvrh nočních aktivních látek ---
    var aN = ing(active) ? ing(active).name : active, eN = ing(exf) ? ing(exf).name : exf;
    var R = 'Hydratace / regenerace', Pp = 'Hydratace + peptidy', M = 'Hydratace + maska';
    var weekly;
    if (preg || sens === 'high') {
      weekly = [['Po', aN], ['Út', R], ['St', aN], ['Čt', targetPm ? ing(targetPm).name : R], ['Pá', aN], ['So', eN + ' (jemně)'], ['Ne', M]];
    } else if (lvl === 'beg') {
      weekly = [['Po', aN + ' (nízká dávka)'], ['Út', R], ['St', Pp], ['Čt', aN], ['Pá', R], ['So', eN], ['Ne', M]];
    } else if (lvl === 'int') {
      weekly = [['Po', aN], ['Út', eN], ['St', aN], ['Čt', Pp], ['Pá', aN], ['So', R], ['Ne', M]];
    } else {
      weekly = [['Po', aN], ['Út', eN], ['St', aN], ['Čt', Pp], ['Pá', aN], ['So', eN], ['Ne', R]];
    }

    var principles = [
      'Vrstvěte od nejřidší po nejhustší konzistenci: voda → esence → sérum → emulze → krém → (ráno) SPF.',
      'Každou vrstvu nechte chvíli vstřebat (~1 min); po kyselinách ideálně 10–20 minut před dalším krokem.',
      'Zavádějte jednu novou aktivní látku po druhé (2–4 týdny) a vždy udělejte patch test na čelisti.',
      'Retinoidy a kyseliny nikdy ve stejný večer — řiďte se týdenním rozvrhem výše.',
      'Vitamin C patří ráno (ochrana), retinoidy večer (jsou fotolabilní).',
      'SPF každý den celoročně, i v zimě a uvnitř u oken — jinak roste pigmentace a fotostárnutí.',
      'Při retinizaci (zarudnutí, olupování) ubrat frekvenci a posílit bariéru (ceramidy, niacinamid), ne přidávat další aktiva.'
    ];
    var cautions = [];
    if (preg) cautions.push('V těhotenství a při kojení vynechte retinoidy a vysoké koncentrace kyselin. Bezpečné jsou bakuchiol, azelaová kyselina, niacinamid, vitamin C a kyselina hyaluronová.');
    if (skin === 'aknozni' || problem === 'rosacea') cautions.push('U aktivního akné nebo rozacey postupujte obzvlášť pozvolna; při zhoršení konzultujte dermatologa.');
    cautions.push('Jde o obecné vzdělávací doporučení sestavené z dostupných důkazů, nikoli o individuální lékařskou radu.');

    return { am: am, pm: pm, weekly: weekly, principles: principles, cautions: cautions };
  }

  function renderSteps(steps) {
    return '<ol class="steps routine-steps">' + steps.map(function (s) {
      return '<li><div class="rstep-head"><strong>' + s.name + '</strong>' + (s.freq ? '<span class="rfreq">' + s.freq + '</span>' : '') + '</div>' +
        (s.purpose ? '<p class="muted small rpurpose">' + s.purpose + '</p>' : '') +
        (s.actives && s.actives.length ? actChips(s.actives) : '') +
        (s.how ? '<p class="rhow small">' + s.how + '</p>' : '') + '</li>';
    }).join('') + '</ol>';
  }
  function renderRoutine(r, opts) {
    opts = opts || {};
    var weekly = '<div class="table-wrap"><table class="weekly-table"><thead><tr><th>Den</th><th>Večerní zaměření</th></tr></thead><tbody>' +
      r.weekly.map(function (d) { return '<tr><td>' + d[0] + '</td><td>' + d[1] + '</td></tr>'; }).join('') + '</tbody></table></div>';
    var html = '';
    html += '<div class="routine-cols">';
    html += '<div class="routine-col"><h3>☀️ Ranní rutina <span class="muted small">— ochrana</span></h3>' + renderSteps(r.am) + '</div>';
    html += '<div class="routine-col"><h3>🌙 Večerní rutina <span class="muted small">— regenerace</span></h3>' + renderSteps(r.pm) + '</div>';
    html += '</div>';
    html += '<h3>🗓️ Týdenní rozvrh aktivních látek</h3><p class="muted small">Aby se silné látky nepřekrývaly a bariéra měla čas na regeneraci.</p>' + weekly;
    if (!opts.compactPrinciples) {
      html += '<h3>📋 Zásady aplikace</h3><ul class="rich-list">' + r.principles.map(function (p) { return '<li>' + p + '</li>'; }).join('') + '</ul>';
    }
    html += '<div class="callout"><strong>Upozornění</strong><ul class="rich-list" style="margin-top:.4rem">' + r.cautions.map(function (c) { return '<li>' + c + '</li>'; }).join('') + '</ul></div>';
    html += '<p class="muted small">Podrobné encyklopedické stránky: <a href="' + BASE + '/rutiny/ranni-rutina/">Ranní rutina</a> · <a href="' + BASE + '/rutiny/vecerni-rutina/">Večerní rutina</a></p>';
    return html;
  }

  /* ---------- 1. Poradce ---------- */
  function fmtKc(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function pickList(items, hint) {
    if (!items.length) return '<p class="empty">' + (hint || 'Žádné položky.') + '</p>';
    return '<div class="adv-picks">' + items.map(function (it) {
      var p = it.p;
      var price = p.priceNum ? fmtKc(p.priceNum) + ' Kč' : (p.price && /\d/.test(p.price) ? p.price : 'cena dle značky');
      var sc = (typeof p.score === 'number') ? ' · ' + String(p.score).replace('.', ',') + '/10' : '';
      return '<a class="adv-pick" href="' + BASE + p.url + '">' +
        (it.tag ? '<span class="adv-pick-tag">' + it.tag + '</span>' : '') +
        '<span class="adv-pick-name">' + p.name + '</span>' +
        '<span class="adv-pick-meta muted small">· ' + price + sc + '</span></a>';
    }).join('') + '</div>';
  }
  // Vybere rozmanitou pětici v rámci rozpočtu: nejlepší, prémiová (nejdražší slušně
  // hodnocená), nejlepší poměr cena/výkon, nejdostupnější, zbytek podle skóre.
  function pickDiverse(pool) {
    var byScore = pool.slice().sort(function (a, b) { return (b.score || 0) - (a.score || 0) || (a.priceNum || 9e9) - (b.priceNum || 9e9); });
    var topScore = byScore.length ? (byScore[0].score || 0) : 0;
    var decent = pool.filter(function (p) { return p.priceNum && (p.score || 0) >= Math.max(6, topScore - 1.6); });
    var picks = [], seen = {};
    function add(p, tag) { if (p && !seen[p.slug]) { seen[p.slug] = 1; picks.push({ p: p, tag: tag }); } }
    add(byScore[0], '🏆 Nejlepší');
    add(decent.slice().sort(function (a, b) { return b.priceNum - a.priceNum; })[0], '💎 Prémiová volba');
    add(decent.slice().sort(function (a, b) { return (b.score / b.priceNum) - (a.score / a.priceNum); })[0], '💰 Nejlepší poměr cena/výkon');
    add(decent.slice().sort(function (a, b) { return a.priceNum - b.priceNum; })[0], '👍 Nejdostupnější');
    for (var i = 0; i < byScore.length && picks.length < 5; i++) add(byScore[i], '');
    return picks.slice(0, 5);
  }
  function initAdvisor() {
    var el = document.getElementById('advisor');
    var prices = DATA.products.map(function (p) { return p.priceNum; }).filter(function (n) { return n > 0; });
    var budgetMax = prices.length ? Math.min(20000, Math.ceil(Math.max.apply(null, prices) / 500) * 500) : 10000;
    el.innerHTML =
      '<div class="tool-grid">' +
      '<div class="field"><label>Věk</label>' + optionGroup('age', AGES) + '</div>' +
      '<div class="field"><label>Typ pleti</label>' + optionGroup('skin', SKIN) + '</div>' +
      '</div>' +
      '<div class="field"><label>Hlavní problém</label>' + optionGroup('problem', problemOpts()) + '</div>' +
      '<div class="tool-grid">' +
      '<div class="field"><label>Citlivost</label>' + optionGroup('sens', [{ v: 'low', l: 'Nízká' }, { v: 'mid', l: 'Střední' }, { v: 'high', l: 'Vysoká' }]) + '</div>' +
      '<div class="field"><label>Preference péče</label>' + optionGroup('pref', [{ v: 'home', l: 'Domácí' }, { v: 'pro', l: 'Profesionální' }, { v: 'both', l: 'Obojí' }]) + '</div>' +
      '</div>' +
      '<div class="field field--budget"><label>Maximální cena produktu <span class="budget-val" id="advBudgetVal">bez omezení</span></label>' +
      '<input type="range" class="range" id="advBudget" min="500" max="' + budgetMax + '" step="250" value="' + budgetMax + '" aria-label="Maximální cena produktu">' +
      '<div class="range-scale"><span>500 Kč</span><span>bez omezení</span></div></div>' +
      '<button class="btn btn--primary" id="advRun">Sestavit doporučení</button>' +
      '<div id="advOut"></div>';
    bindOpts(el);
    var slider = el.querySelector('#advBudget'), bval = el.querySelector('#advBudgetVal');
    function updB() { var v = +slider.value; bval.textContent = v >= budgetMax ? 'bez omezení' : ('do ' + fmtKc(v) + ' Kč'); }
    slider.addEventListener('input', updB); updB();
    el.querySelector('#advRun').addEventListener('click', function () {
      var age = getVal(el, 'age'), skin = getVal(el, 'skin'), problem = getVal(el, 'problem'),
        sens = getVal(el, 'sens'), pref = getVal(el, 'pref') || 'both';
      var budget = +slider.value, noBudget = budget >= budgetMax;
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
      // Produkty: cílené na problém = obsahují některou z doporučených aktivních látek
      // (ne pouhé SPF / čištění, které patří do rutiny), v rámci rozpočtu.
      var recSlugs = ings.map(function (i) { return i.slug; });
      function inBudget(p) { return noBudget || !p.priceNum || p.priceNum <= budget; }
      function relevance(p) { return (p.activeIngredients || []).filter(function (a) { return recSlugs.indexOf(a) > -1; }).length; }
      var prods = DATA.products.filter(function (p) { return inBudget(p) && relevance(p) > 0; });
      if (prods.length < 3) { // doplnit produkty tagované na problém, pokud cílených je málo
        DATA.products.forEach(function (p) { if (inBudget(p) && (p.problems || []).indexOf(problem) > -1 && prods.indexOf(p) < 0) prods.push(p); });
      }
      var picks = pickDiverse(prods);

      var out = '<div class="result-block">';
      out += '<h3>Doporučené ingredience</h3>' + chips(ings.slice(0, 6));
      out += '<h3>Technologie</h3>' + chips(techs.slice(0, 5));
      out += '<h3>Produkty' + (noBudget ? '' : ' do ' + fmtKc(budget) + ' Kč') + '</h3>' +
        pickList(picks, noBudget ? 'Pro zvolený problém jsme nenašli konkrétní produkt.' : 'Do zvoleného rozpočtu jsme nenašli vhodný produkt — zkuste zvýšit horní hranici ceny.');
      var routine = composeRoutine({ skin: skin, age: age, lvl: sens === 'high' ? 'beg' : 'int', sens: sens, problem: problem, preg: false });
      out += '<div class="routine-result"><h3>Rutina na míru</h3>' + renderRoutine(routine) + '</div>';
      if (pref !== 'home') {
        var procs = DATA.technologies; // procedury jsou v jiné sekci; odkážeme na péči podle problému
        out += '<h3>Profesionální péče</h3><p class="muted">Zvažte odbornou konzultaci. Přehled procedur podle problému najdete na stránce <a href="' + BASE + '/pece-podle-problemu/' + problem + '/">' + (DATA.problems.find(function (p) { return p.slug === problem; }) || {}).name + '</a>.</p>';
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
      '</div>' +
      '<div class="tool-grid">' +
      '<div class="field"><label>Zkušenost s aktivními látkami</label>' + optionGroup('lvl', [{ v: 'beg', l: 'Začátečník' }, { v: 'int', l: 'Středně pokročilý' }, { v: 'adv', l: 'Pokročilý' }]) + '</div>' +
      '<div class="field"><label>Citlivost pleti</label>' + optionGroup('sens', [{ v: 'low', l: 'Nízká' }, { v: 'mid', l: 'Střední' }, { v: 'high', l: 'Vysoká' }]) + '</div>' +
      '<div class="field"><label>Těhotenství / kojení</label>' + optionGroup('preg', [{ v: '', l: 'Ne' }, { v: '1', l: 'Ano' }]) + '</div>' +
      '</div>' +
      '<div class="field"><label>Hlavní cíl (volitelné)</label>' + optionGroup('problem', [{ v: '', l: 'Obecná prevence' }].concat(problemOpts())) + '</div>' +
      '<button class="btn btn--primary" id="rbRun">Sestavit rutinu</button><div id="rbOut"></div>';
    bindOpts(el);
    el.querySelector('#rbRun').addEventListener('click', function () {
      var o = { skin: getVal(el, 'skin') || 'normalni', age: getVal(el, 'age') || '30-plus', lvl: getVal(el, 'lvl') || 'beg',
        sens: getVal(el, 'sens') || 'mid', preg: !!getVal(el, 'preg'), problem: getVal(el, 'problem') || '' };
      var r = composeRoutine(o);
      el.querySelector('#rbOut').innerHTML = '<div class="result-block routine-result">' + renderRoutine(r) + '</div>';
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
      var html = '<div class="table-wrap"><table class="compare"><thead><tr><th>Parametr</th>' + sel.map(function (p) { return '<th><a href="' + BASE + p.url + '">' + p.name + '</a></th>'; }).join('') + '</tr></thead><tbody>';
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

/* ADHD bez chaosu — interakce */
(function () {
  'use strict';

  /* --- Mobilní navigace --- */
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* --- Blog filtr (jednoduchý, klientský) --- */
  var chips = document.querySelectorAll('.filter-row .chip');
  if (chips.length) {
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var cat = chip.getAttribute('data-cat');
        chips.forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        document.querySelectorAll('[data-post]').forEach(function (post) {
          var show = cat === 'all' || post.getAttribute('data-post') === cat;
          post.style.display = show ? '' : 'none';
        });
      });
    });
  }

  /* --- Kontaktní formulář (demo, neodesílá nikam) --- */
  var contactForm = document.querySelector('#contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      contactForm.style.display = 'none';
      var ok = document.querySelector('#contact-success');
      if (ok) ok.style.display = 'block';
    });
  }

  /* --- Orientační test --- */
  var quiz = document.querySelector('#quiz-form');
  if (quiz) {
    var questions = quiz.querySelectorAll('.quiz-question');
    var resultBox = document.querySelector('#quiz-result');
    var bandEl = document.querySelector('#result-band');
    var textEl = document.querySelector('#result-text');

    // klikatelné labely (vizuální stav)
    quiz.querySelectorAll('.quiz-options').forEach(function (group) {
      group.querySelectorAll('input').forEach(function (input) {
        input.addEventListener('change', function () {
          group.querySelectorAll('label').forEach(function (l) { l.classList.remove('selected'); });
          var lbl = group.querySelector('label[for="' + input.id + '"]');
          if (lbl) lbl.classList.add('selected');
        });
      });
    });

    quiz.addEventListener('submit', function (e) {
      e.preventDefault();
      var total = 0, answered = 0;
      questions.forEach(function (q, i) {
        var checked = q.querySelector('input:checked');
        if (checked) { answered++; total += parseInt(checked.value, 10); }
      });

      if (answered < questions.length) {
        alert('Prosím odpovězte na všechny otázky (zbývá ' + (questions.length - answered) + ').');
        return;
      }

      var max = questions.length * 3;
      var ratio = total / max;
      var band, text;

      if (ratio < 0.33) {
        band = 'Spíše málo projevů';
        text = 'Z vašich odpovědí nevyplývá výrazná shoda s typickými projevy ADHD. ' +
               'Pokud vás přesto něco dlouhodobě trápí, nebojte se to probrat s odborníkem. ' +
               'Tento výsledek není diagnóza.';
      } else if (ratio < 0.66) {
        band = 'Středně';
        text = 'Některé vaše odpovědi odpovídají projevům, které bývají spojované s ADHD. ' +
               'Nejde o diagnózu — může ale mít smysl zjistit si víc a zvážit konzultaci s odborníkem.';
      } else {
        band = 'Hodně projevů';
        text = 'Vaše odpovědi se ve více bodech shodují s projevy spojovanými s ADHD. ' +
               'Doporučujeme zvážit konzultaci s odborníkem (psychiatr nebo klinický psycholog). ' +
               'Tento výsledek není diagnóza.';
      }

      bandEl.textContent = band;
      textEl.textContent = text;
      resultBox.classList.add('show');
      resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
})();

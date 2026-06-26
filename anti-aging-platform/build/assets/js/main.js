/* Aevia — mobilní navigace */
(function () {
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.primary-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }
  // na mobilu rozbalí submenu klikem
  document.querySelectorAll('.nav-sub-toggle').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      if (window.innerWidth <= 820) {
        e.preventDefault();
        var sub = btn.nextElementSibling;
        if (sub) sub.style.display = sub.style.display === 'block' ? 'none' : 'block';
      }
    });
  });
})();

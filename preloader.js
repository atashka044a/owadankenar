(function () {
  'use strict';

  var root = document.documentElement;
  var el = document.getElementById('sitePreloader');
  if (
    !el ||
    sessionStorage.getItem('ok-loaded') === '1' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    root.classList.add('is-loaded');
    if (el) el.remove();
    return;
  }

  root.classList.add('is-loading');

  var fill = el.querySelector('.preloader__bar-fill');
  var bar = el.querySelector('.preloader__bar');
  var progress = 0;
  var tick = window.setInterval(function () {
    progress = Math.min(progress + Math.random() * 11 + 5, 90);
    if (fill) fill.style.width = progress + '%';
    if (bar) bar.setAttribute('aria-valuenow', String(Math.round(progress)));
  }, 110);

  var done = false;
  function finish() {
    if (done) return;
    done = true;
    window.clearInterval(tick);
    if (fill) fill.style.width = '100%';
    if (bar) bar.setAttribute('aria-valuenow', '100');
    root.classList.remove('is-loading');
    root.classList.add('is-loaded');
    el.classList.add('preloader--done');
    sessionStorage.setItem('ok-loaded', '1');
    window.setTimeout(function () {
      el.remove();
    }, 780);
  }

  var minDone = Date.now() + 900;
  window.addEventListener('load', function () {
    window.setTimeout(finish, Math.max(0, minDone - Date.now()));
  });
  window.setTimeout(finish, 4200);
})();

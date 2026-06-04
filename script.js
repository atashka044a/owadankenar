/**
 * Owadan Kenar — Page-specific scripts
 * Stats counter · testimonials slider · contact & quote forms · smooth anchors
 */
(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Stats counter ---------- */
  const statsSection = document.getElementById('stats');
  const statNumbers = document.querySelectorAll('.stat__number');

  function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }

  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1800;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      el.textContent = Math.round(easeOutQuart(progress) * target) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  if (statsSection && statNumbers.length) {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          statNumbers.forEach((el) => {
            if (prefersReducedMotion) {
              el.textContent = el.dataset.target + (el.dataset.suffix || '');
            } else {
              animateCounter(el);
            }
          });
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.5 }
    );
    obs.observe(statsSection);
  }

  /* ---------- Section spy ---------- */
  const sections = document.querySelectorAll('section[id]');
  const anchorLinks = document.querySelectorAll('.nav__link[href^="#"], .nav-drawer__link[href^="#"]');
  if (sections.length && anchorLinks.length) {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            anchorLinks.forEach((l) => {
              l.classList.toggle('active', l.getAttribute('href') === `#${id}`);
            });
          }
        });
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
    );
    sections.forEach((s) => obs.observe(s));
  }

  /* ---------- Smooth scroll for in-page anchors ---------- */
  const header = document.getElementById('header');
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - (header?.offsetHeight || 76);
      window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  });

  /* ---------- Testimonials carousel ---------- */
  function initTestimonials() {
    const track = document.querySelector('[data-testimonials-track]');
    if (!track) return;
    const prevBtn = document.querySelector('[data-testimonials-prev]');
    const nextBtn = document.querySelector('[data-testimonials-next]');
    const items = Array.from(track.children);
    if (!items.length) return;

    function getVisible() {
      const w = window.innerWidth;
      if (w <= 700) return 1;
      if (w <= 1024) return 2;
      return 3;
    }

    let index = 0;
    function maxIndex() { return Math.max(0, items.length - getVisible()); }

    function update() {
      const visible = getVisible();
      const cardWidth = items[0].getBoundingClientRect().width;
      const gap = parseFloat(getComputedStyle(track).gap) || 0;
      const offset = index * (cardWidth + gap);
      track.style.transform = `translateX(-${offset}px)`;
      if (prevBtn) prevBtn.disabled = index === 0;
      if (nextBtn) nextBtn.disabled = index >= maxIndex();
    }

    prevBtn?.addEventListener('click', () => { index = Math.max(0, index - 1); update(); });
    nextBtn?.addEventListener('click', () => { index = Math.min(maxIndex(), index + 1); update(); });

    window.addEventListener('resize', () => {
      index = Math.min(index, maxIndex());
      update();
    });

    /* Auto-advance every 6s, pause on hover */
    let timer;
    function start() {
      if (prefersReducedMotion) return;
      stop();
      timer = setInterval(() => {
        index = index >= maxIndex() ? 0 : index + 1;
        update();
      }, 6000);
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    track.addEventListener('mouseenter', stop);
    track.addEventListener('mouseleave', start);

    update();
    start();
  }
  initTestimonials();

  /* ---------- Contact form ---------- */
  function showToast(el, key, type) {
    if (!el) return;
    const lang = App.getLang();
    const msg = i18nGet(I18N[lang], `contact.${key}`) || i18nGet(I18N.en, `contact.${key}`);
    el.textContent = msg;
    el.className = `form-toast show ${type}`;
    setTimeout(() => el.classList.remove('show'), 4000);
  }

  function validateEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  const contactForm = document.getElementById('contactForm');
  const formToast = document.getElementById('formToast');
  if (contactForm && formToast) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('name');
      const email = document.getElementById('email');
      const message = document.getElementById('message');
      let valid = true;
      [name, email, message].forEach((f) => f?.classList.remove('error'));
      if (!name?.value.trim()) { name?.classList.add('error'); valid = false; }
      if (!email?.value.trim() || !validateEmail(email.value.trim())) {
        email?.classList.add('error'); valid = false;
      }
      if (!message?.value.trim()) { message?.classList.add('error'); valid = false; }
      if (!valid) { showToast(formToast, 'formError', 'error'); return; }
      showToast(formToast, 'formSuccess', 'success');
      contactForm.reset();
    });
    contactForm.querySelectorAll('input, textarea').forEach((f) => {
      f.addEventListener('input', () => f.classList.remove('error'));
    });
  }

  /* ---------- Online quote form ---------- */
  const quoteForm = document.getElementById('quoteForm');
  const quoteToast = document.getElementById('quoteToast');
  if (quoteForm && quoteToast) {
    quoteForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const lang = App.getLang();
      const msg = i18nGet(I18N[lang], 'quote.success') || i18nGet(I18N.en, 'quote.success');
      quoteToast.textContent = msg;
      quoteToast.className = 'form-toast show success';
      setTimeout(() => quoteToast.classList.remove('show'), 5000);
      quoteForm.reset();
    });
  }

  document.addEventListener('langchange', () => {
    [formToast, quoteToast].forEach((el) => {
      if (el && el.classList.contains('show')) {
        const isSuccess = el.classList.contains('success');
        if (el === formToast) showToast(el, isSuccess ? 'formSuccess' : 'formError', isSuccess ? 'success' : 'error');
      }
    });
  });
})();

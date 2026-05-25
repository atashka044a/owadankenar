/**
 * Owadan Kenar — Page-specific scripts (home counters, contact form)
 */
(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Stats counter (home) ---------- */
  const statsSection = document.getElementById('stats');
  const statNumbers = document.querySelectorAll('.stat__number');

  function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

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
    const counterObserver = new IntersectionObserver(
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
          counterObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.5 }
    );
    counterObserver.observe(statsSection);
  }

  /* ---------- Section spy (home only) ---------- */
  const sections = document.querySelectorAll('section[id]');
  const anchorNavLinks = document.querySelectorAll('.nav__link[href^="#"], .nav-drawer__link[href^="#"]');

  if (sections.length && anchorNavLinks.length) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            anchorNavLinks.forEach((link) => {
              link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
            });
          }
        });
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
    );
    sections.forEach((s) => sectionObserver.observe(s));
  }

  /* ---------- Smooth scroll (home anchors) ---------- */
  const header = document.getElementById('header');
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - (header?.offsetHeight || 72);
      window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  });

  /* ---------- Contact form ---------- */
  const contactForm = document.getElementById('contactForm');
  const formToast = document.getElementById('formToast');

  if (contactForm && formToast) {
    function showToast(key, type) {
      const lang = App.getLang();
      const msg = i18nGet(I18N[lang], `contact.${key}`) || i18nGet(I18N.en, `contact.${key}`);
      formToast.textContent = msg;
      formToast.className = `form-toast show ${type}`;
      setTimeout(() => formToast.classList.remove('show'), 4000);
    }

    function validateEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('name');
      const email = document.getElementById('email');
      const message = document.getElementById('message');
      let valid = true;

      [name, email, message].forEach((f) => f?.classList.remove('error'));
      if (!name?.value.trim()) { name?.classList.add('error'); valid = false; }
      if (!email?.value.trim() || !validateEmail(email.value.trim())) {
        email?.classList.add('error');
        valid = false;
      }
      if (!message?.value.trim()) { message?.classList.add('error'); valid = false; }

      if (!valid) {
        showToast('formError', 'error');
        return;
      }
      showToast('formSuccess', 'success');
      contactForm.reset();
    });

    contactForm.querySelectorAll('input, textarea').forEach((field) => {
      field.addEventListener('input', () => field.classList.remove('error'));
    });

    document.addEventListener('langchange', () => {
      if (formToast.classList.contains('show')) {
        const isSuccess = formToast.classList.contains('success');
        showToast(isSuccess ? 'formSuccess' : 'formError', isSuccess ? 'success' : 'error');
      }
    });
  }
})();

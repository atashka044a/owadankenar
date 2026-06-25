/**
 * Owadan Kenar — Shared app
 * i18n, navigation, scroll effects, magnetic buttons, 3D tilt, split-text, scroll progress
 */
document.documentElement.classList.add('js');

const App = (function () {
  'use strict';

  const STORAGE_KEY = 'ok-lang';
  const DEFAULT_LANG = 'ru';
  let currentLang = DEFAULT_LANG;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Language ---------- */
  function getLang() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && I18N[saved]) return saved;
    const browser = (navigator.language || '').slice(0, 2).toLowerCase();
    if (browser === 'tk' || browser === 'ru') return browser;
    return DEFAULT_LANG;
  }

  function setLang(lang) {
    if (!I18N[lang]) return;
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    applyTranslations(lang);
    document.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    document.documentElement.lang = lang === 'tk' ? 'tk' : lang;
  }

  function applyTranslations(lang) {
    const t = I18N[lang];
    if (!t) return;

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const val = i18nGet(t, el.dataset.i18n);
      if (val !== null && val !== undefined) el.textContent = val;
    });

    document.querySelectorAll('[data-i18n-html]').forEach((el) => {
      const val = i18nGet(t, el.dataset.i18nHtml);
      if (val !== null && val !== undefined) el.innerHTML = val;
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const val = i18nGet(t, el.dataset.i18nPlaceholder);
      if (val) el.placeholder = val;
    });

    document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      const val = i18nGet(t, el.dataset.i18nAria);
      if (val) el.setAttribute('aria-label', val);
    });

    const page = document.body.dataset.page;
    if (page && t.meta) {
      const titleKey = page + 'Title';
      const descKey = page + 'Desc';
      if (t.meta[titleKey]) document.title = t.meta[titleKey];
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc && t.meta[descKey]) metaDesc.setAttribute('content', t.meta[descKey]);
    }

    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
  }

  function initLangSwitcher() {
    document.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.addEventListener('click', () => setLang(btn.dataset.lang));
    });
    setLang(getLang());
  }

  /* ---------- Header scroll state ---------- */
  function initHeader() {
    const header = document.getElementById('header');
    if (!header) return;
    const isInner = header.classList.contains('header--inner');

    let ticking = false;
    function update() {
      if (!isInner) {
        if (window.scrollY > 60) header.classList.add('scrolled');
        else header.classList.remove('scrolled');
      }
      ticking = false;
    }
    if (isInner) header.classList.add('scrolled');

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
    update();
  }

  /* ---------- Scroll progress bar ---------- */
  function initScrollProgress() {
    const bar = document.getElementById('scrollProgress');
    if (!bar) return;
    let ticking = false;
    function update() {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
      bar.style.width = pct + '%';
      ticking = false;
    }
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
    update();
  }

  /* ---------- Mobile nav drawer ---------- */
  function initMobileNav() {
    const navToggle = document.getElementById('navToggle');
    const navOverlay = document.getElementById('navOverlay');
    const navDrawer = document.getElementById('navDrawer');
    if (!navToggle || !navDrawer) return;

    const t = () => I18N[currentLang]?.nav || I18N.en.nav;

    function openNav() {
      navToggle.classList.add('is-open');
      navToggle.setAttribute('aria-expanded', 'true');
      navToggle.setAttribute('aria-label', t().closeMenu);
      navOverlay?.classList.add('is-open');
      navOverlay?.setAttribute('aria-hidden', 'false');
      navDrawer.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }

    function closeNav() {
      navToggle.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', t().openMenu);
      navOverlay?.classList.remove('is-open');
      navOverlay?.setAttribute('aria-hidden', 'true');
      navDrawer.classList.remove('is-open');
      document.body.style.overflow = '';
    }

    navToggle.addEventListener('click', () => {
      navDrawer.classList.contains('is-open') ? closeNav() : openNav();
    });
    navOverlay?.addEventListener('click', closeNav);
    document.querySelectorAll('.nav-drawer__link, .nav-drawer__cta').forEach((l) => {
      l.addEventListener('click', closeNav);
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 1024) closeNav();
    });
  }

  /* ---------- Highlight active nav link ---------- */
  function initActiveNav() {
    let path = window.location.pathname.split('/').pop();
    if (!path || path === '') path = 'index.html';
    document.querySelectorAll('.nav__link, .nav-drawer__link').forEach((link) => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      const linkPath = href.split('/').pop();
      link.classList.toggle('active', linkPath === path);
    });
  }

  /* ---------- Reveal-on-scroll ---------- */
  function isInViewport(el) {
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    return r.top < vh * 0.92 && r.bottom > vh * 0.05;
  }

  function initReveal() {
    const els = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .split-text');
    if (!els.length) return;

    if (prefersReducedMotion) {
      els.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -20px 0px' }
    );

    els.forEach((el) => {
      if (isInViewport(el)) el.classList.add('is-visible');
      obs.observe(el);
    });

    window.addEventListener('load', () => {
      requestAnimationFrame(() => {
        els.forEach((el) => {
          if (!el.classList.contains('is-visible') && isInViewport(el)) {
            el.classList.add('is-visible');
          }
        });
      });
    }, { once: true });
  }

  /* ---------- Split-text setup (word-by-word) ---------- */
  function initSplitText() {
    if (prefersReducedMotion) return;
    document.querySelectorAll('[data-split]').forEach((el) => {
      const text = el.textContent || '';
      const parts = text.split(/(\s+)/);
      el.innerHTML = '';
      let i = 0;
      parts.forEach((part) => {
        if (part.trim() === '') {
          el.appendChild(document.createTextNode(part));
          return;
        }
        const w = document.createElement('span');
        w.className = 'split-word';
        const inner = document.createElement('span');
        inner.className = 'split-word__inner';
        inner.style.setProperty('--i', i);
        inner.textContent = part;
        w.appendChild(inner);
        el.appendChild(w);
        i++;
      });
      el.classList.add('split-text');
    });
  }

  /* ---------- Magnetic CTA buttons ---------- */
  function initMagnetic() {
    if (prefersReducedMotion) return;
    if (matchMedia('(hover: none)').matches) return;

    document.querySelectorAll('[data-magnetic]').forEach((btn) => {
      const strength = parseFloat(btn.dataset.magnetic) || 0.35;

      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  }

  /* ---------- 3D Card tilt ---------- */
  function initTilt() {
    if (prefersReducedMotion) return;
    if (matchMedia('(hover: none)').matches) return;

    document.querySelectorAll('[data-tilt]').forEach((card) => {
      const max = parseFloat(card.dataset.tilt) || 8;

      function onMove(e) {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        const rx = (0.5 - y) * max;
        const ry = (x - 0.5) * max;
        card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px)`;
        card.style.setProperty('--mx', `${x * 100}%`);
        card.style.setProperty('--my', `${y * 100}%`);
      }

      function reset() {
        card.style.transform = '';
        card.style.removeProperty('--mx');
        card.style.removeProperty('--my');
      }

      card.addEventListener('mousemove', onMove);
      card.addEventListener('mouseleave', reset);
    });
  }

  /* ---------- Marquee duplication (seamless loop) ---------- */
  function initMarquee() {
    document.querySelectorAll('.marquee__track').forEach((track) => {
      if (track.dataset.cloned) return;
      const clone = track.innerHTML;
      track.innerHTML += clone;
      track.dataset.cloned = '1';
    });
  }

  /* ---------- Icon sprite (fallback fetch if not inline) ---------- */
  function injectIconSprite() {
    const existing = document.getElementById('ok-icon-sprite');
    if (existing && existing.querySelector('#icon-handshake')) return;
    if (existing && !existing.querySelector('#icon-handshake')) {
      fetch('icons.svg')
        .then((res) => (res.ok ? res.text() : Promise.reject()))
        .then((svgText) => {
          const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
          doc.querySelectorAll('symbol').forEach((sym) => {
            if (!existing.querySelector('#' + sym.id)) existing.appendChild(sym.cloneNode(true));
          });
        })
        .catch(() => {});
      return;
    }
    fetch('icons.svg')
      .then((res) => (res.ok ? res.text() : Promise.reject()))
      .then((svgText) => {
        const holder = document.createElement('div');
        holder.id = 'ok-icon-sprite';
        holder.hidden = true;
        holder.innerHTML = svgText;
        const svg = holder.querySelector('svg');
        if (svg) {
          svg.id = 'ok-icon-sprite';
          svg.style.display = 'none';
          document.body.insertBefore(svg, document.body.firstChild);
        }
      })
      .catch(() => {});
  }

  function init() {
    injectIconSprite();
    currentLang = getLang();
    initSplitText();
    initLangSwitcher();
    initHeader();
    initScrollProgress();
    initMobileNav();
    initActiveNav();
    initReveal();
    initMagnetic();
    initTilt();
    initMarquee();
  }

  return { init, setLang, getLang: () => currentLang, applyTranslations };
})();

document.addEventListener('DOMContentLoaded', App.init);

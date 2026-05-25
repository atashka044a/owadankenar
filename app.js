/**
 * Owadan Kenar — Shared app: i18n, navigation, scroll effects
 */
const App = (function () {
  'use strict';

  const STORAGE_KEY = 'ok-lang';
  const DEFAULT_LANG = 'en';
  let currentLang = DEFAULT_LANG;

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

  function initHeader() {
    const header = document.getElementById('header');
    if (!header) return;

    let ticking = false;
    const isInner = header.classList.contains('header--inner');

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

  function initActiveNav() {
    let path = window.location.pathname.split('/').pop();
    if (!path || path === '') path = 'index.html';
    document.querySelectorAll('.nav__link, .nav-drawer__link').forEach((link) => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      const linkPath = href.split('/').pop();
      link.classList.toggle('active', linkPath === path || (path === '' && linkPath === 'index.html'));
    });
  }

  function initReveal() {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;

    if (prefersReduced) {
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
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    els.forEach((el) => obs.observe(el));
  }

  function injectIconSprite() {
    if (document.getElementById('ok-icon-sprite')) return; /* inline or already loaded */
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
    initLangSwitcher();
    initHeader();
    initMobileNav();
    initActiveNav();
    initReveal();
  }

  return { init, setLang, getLang: () => currentLang, applyTranslations };
})();

document.addEventListener('DOMContentLoaded', App.init);

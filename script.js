/**
 * Owadan Kenar — Page-specific scripts
 * Stats counter · testimonials slider · contact & quote forms · smooth anchors
 */
(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Stats counter ---------- */
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

  function initStatCounters(sectionId, selector) {
    const section = document.getElementById(sectionId);
    const numbers = section ? section.querySelectorAll(selector) : [];
    if (!section || !numbers.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          numbers.forEach((el) => {
            if (el.dataset.display) return;
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
    obs.observe(section);
  }

  initStatCounters('stats', '.stat__number');
  initStatCounters('perish-stats', '.perish-stat__number');

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

  /* ---------- World map (coverage section) ---------- */
  function initWorldMap() {
    const host = document.getElementById('worldMap');
    if (!host) return;

    /* Mercator metadata of images/world-map.svg (amCharts worldLow) */
    const MAP = { left: -169.6, right: 190.25, top: 83.68, bottom: -55.55 };
    /* Region of the world to display */
    const CROP = { lonMin: -18, lonMax: 150, latMin: -12, latMax: 72 };

    const POINTS = [
      { id: 'TM', key: 'hq',         lat: 37.95, lon: 58.38,  hq: true, label: 'right' },
      { id: 'RU', key: 'russia',     lat: 55.75, lon: 37.62,  label: 'top' },
      { id: 'BY', key: 'belarus',    lat: 53.90, lon: 27.56,  label: 'left' },
      { id: 'KZ', key: 'kazakhstan', lat: 48.00, lon: 68.00,  label: 'top' },
      { id: 'UZ', key: 'uzbekistan', lat: 41.31, lon: 69.28,  label: 'right' },
      { id: 'TR', key: 'turkey',     lat: 39.00, lon: 32.85,  label: 'left' },
      { id: 'GE', key: 'georgia',    lat: 41.72, lon: 44.78,  label: 'top' },
      { id: 'AZ', key: 'azerbaijan', lat: 40.41, lon: 49.87,  label: 'bottom' },
      { id: 'AE', key: 'uae',        lat: 25.20, lon: 55.27,  label: 'bottom' },
      { id: 'CN', key: 'china',      lat: 35.00, lon: 103.00, label: 'top' },
      { id: 'VN', key: 'vietnam',    lat: 14.00, lon: 108.00, label: 'right' },
      { id: 'MY', key: 'malaysia',   lat: 3.14,  lon: 101.69, label: 'right' }
    ];

    const mercX = (lon) => (lon * Math.PI) / 180;
    const mercY = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));

    fetch('images/world-map.svg')
      .then((res) => (res.ok ? res.text() : Promise.reject()))
      .then((text) => {
        const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
        const NS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        svg.classList.add('wmap');

        const gLand = document.createElementNS(NS, 'g');
        const countryEls = {};
        doc.querySelectorAll('path.land').forEach((p) => {
          const node = p.cloneNode(true);
          const code = node.getAttribute('id');
          node.removeAttribute('id');
          if (code) {
            node.dataset.c = code;
            countryEls[code] = node;
          }
          gLand.appendChild(node);
        });
        svg.appendChild(gLand);
        host.appendChild(svg);

        /* Pixel bounds of the full map → project lon/lat into svg coords */
        const bb = gLand.getBBox();
        const fx = (lon) => bb.x + ((mercX(lon) - mercX(MAP.left)) / (mercX(MAP.right) - mercX(MAP.left))) * bb.width;
        const fy = (lat) => bb.y + ((mercY(MAP.top) - mercY(lat)) / (mercY(MAP.top) - mercY(MAP.bottom))) * bb.height;

        const cx1 = fx(CROP.lonMin), cx2 = fx(CROP.lonMax);
        const cy1 = fy(CROP.latMax), cy2 = fy(CROP.latMin);
        const cw = cx2 - cx1, ch = cy2 - cy1;
        svg.setAttribute('viewBox', `${cx1} ${cy1} ${cw} ${ch}`);
        host.style.aspectRatio = `${cw} / ${ch}`;

        /* Highlight covered countries */
        POINTS.forEach((p) => {
          const el = countryEls[p.id];
          if (!el) return;
          el.classList.add('wmap__country');
          if (p.hq) el.classList.add('wmap__country--hq');
        });

        /* Animated route arcs from HQ to every destination */
        const hq = POINTS.find((p) => p.hq);
        const hqX = fx(hq.lon), hqY = fy(hq.lat);
        const gRoutes = document.createElementNS(NS, 'g');
        POINTS.filter((p) => !p.hq).forEach((p) => {
          const x = fx(p.lon), y = fy(p.lat);
          const mx = (hqX + x) / 2;
          const my = Math.min(hqY, y) - Math.abs(x - hqX) * 0.18 - cw * 0.012;
          const path = document.createElementNS(NS, 'path');
          path.setAttribute('d', `M ${hqX} ${hqY} Q ${mx} ${my} ${x} ${y}`);
          path.classList.add('wmap__route');
          path.style.strokeWidth = (cw / 420).toFixed(2);
          gRoutes.appendChild(path);
        });
        svg.appendChild(gRoutes);

        /* HTML markers positioned in % of the cropped view */
        const dict = I18N[App.getLang()] || I18N.en;
        const markers = {};
        POINTS.forEach((p, i) => {
          const m = document.createElement('div');
          m.className = `wmap-marker wmap-marker--label-${p.label}${p.hq ? ' wmap-marker--hq' : ''}`;
          m.style.left = (((fx(p.lon) - cx1) / cw) * 100).toFixed(2) + '%';
          m.style.top = (((fy(p.lat) - cy1) / ch) * 100).toFixed(2) + '%';
          m.style.setProperty('--i', i);
          m.dataset.country = p.id;
          const fallback = i18nGet(dict, 'routes.points.' + p.key) || i18nGet(I18N.en, 'routes.points.' + p.key);
          m.innerHTML =
            '<span class="wmap-marker__ring"></span>' +
            '<span class="wmap-marker__dot"></span>' +
            `<span class="wmap-marker__label" data-i18n="routes.points.${p.key}">${fallback || ''}</span>`;
          host.appendChild(m);
          markers[p.id] = m;
        });

        /* Hover sync: list item ⇄ map country + marker */
        document.querySelectorAll('.routes__point[data-country]').forEach((item) => {
          const code = item.dataset.country;
          const toggle = (on) => {
            countryEls[code]?.classList.toggle('is-hover', on);
            markers[code]?.classList.toggle('is-hover', on);
          };
          item.addEventListener('mouseenter', () => toggle(true));
          item.addEventListener('mouseleave', () => toggle(false));
        });
      })
      .catch(() => {});
  }
  initWorldMap();

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

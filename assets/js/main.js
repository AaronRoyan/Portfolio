/*
 * main.js — page behaviour: smooth scroll, intro, scroll reveals, nav,
 * cursor + project previews, live clock, copy-to-clipboard, mobile menu.
 * Everything here is progressive enhancement: the page reads fine without it.
 */
(function () {
  'use strict';

  window.__ready = true;

  const html = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  const introAllowed = html.classList.contains('js'); // false if the 3.5s failsafe already fired

  if (!hasGsap) html.classList.remove('js');

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const nav = $('[data-nav]');
  const end = $('.end');
  let lenis = null;

  /* ----------------------------- Live clock ------------------------------ */

  const timeFmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const zoneFmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', timeZoneName: 'short' });

  function tickClock() {
    const now = new Date();
    const [h, m] = timeFmt.format(now).split(':');
    const zone = (zoneFmt.formatToParts(now).find((p) => p.type === 'timeZoneName') || {}).value || '';
    for (const el of $$('[data-clock]')) {
      el.innerHTML = `${h}<span class="colon">:</span>${m} ${zone}`;
      el.setAttribute('datetime', now.toISOString());
    }
  }
  tickClock();
  setInterval(tickClock, 15000);

  for (const el of $$('[data-year]')) el.textContent = String(new Date().getFullYear());

  /* --------------------------- Copy email button -------------------------- */

  for (const btn of $$('[data-copy]')) {
    const labelEl = $('[data-copy-label]', btn);
    const status = $('[data-copy-status]');
    btn.addEventListener('click', async () => {
      const text = btn.dataset.copy;
      try {
        await navigator.clipboard.writeText(text);
      } catch (err) {
        window.location.href = `mailto:${text}`;
        return;
      }
      labelEl.textContent = 'Copied ✓';
      btn.dataset.state = 'copied';
      if (status) status.textContent = 'Email address copied to clipboard';
      clearTimeout(btn._reset);
      btn._reset = setTimeout(() => {
        labelEl.textContent = 'Copy email';
        delete btn.dataset.state;
        if (status) status.textContent = '';
      }, 2200);
    });
  }

  /* ------------------------------ Mobile menu ----------------------------- */

  const toggle = $('.nav__toggle');
  const menu = $('#menu');
  let menuOpen = false;

  function setMenu(open) {
    if (open === menuOpen) return;
    menuOpen = open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Close' : 'Menu';
    menu.hidden = !open;
    html.classList.toggle('menu-open', open);
    if (open) {
      nav.classList.remove('is-hidden', 'is-light');
      if (lenis) lenis.stop();
      if (hasGsap && !reduceMotion) {
        gsap.from($$('.menu__links a', menu), { yPercent: 40, autoAlpha: 0, duration: 0.8, stagger: 0.05, ease: 'expo.out' });
      }
      $('a', menu).focus();
    } else if (lenis) {
      lenis.start();
    }
  }

  toggle.addEventListener('click', () => setMenu(!menuOpen));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuOpen) {
      setMenu(false);
      toggle.focus();
    }
  });

  /* ------------------------------- Figures -------------------------------- */

  let heroFigure = null;
  if (window.Figures) {
    const stops = $('[data-stat="stops"]');
    const gain = $('[data-stat="gain"]');
    heroFigure = Figures.mount($('.hero__canvas'), 'route', {
      lineAlpha: 0.17,
      onStats(s) {
        stops.textContent = String(s.stops);
        gain.textContent = `${Math.round(s.gain * 100)}%`;
      },
    });
    for (const canvas of $$('canvas[data-figure]')) Figures.mount(canvas);
    if (Figures.reduceMotion) for (const el of $$('.live')) el.textContent = 'Still';
  }

  if (heroFigure) {
    const hero = $('.hero');
    hero.addEventListener('click', (e) => {
      if (e.target.closest('a, button')) return;
      const r = heroFigure.canvas.getBoundingClientRect();
      heroFigure.addStop(e.clientX - r.left, e.clientY - r.top);
    });
    $('[data-route="add"]').addEventListener('click', () => heroFigure.addRandomStop());
    $('[data-route="shuffle"]').addEventListener('click', () => {
      heroFigure.reset();
      if (Figures.reduceMotion) heroFigure.settle();
      heroFigure.render();
    });
  }

  /* --------------------------- In-page navigation ------------------------- */

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href');
    const target = id === '#top' ? $('#top') : id.length > 1 && document.getElementById(id.slice(1));
    if (!target) return;
    e.preventDefault();
    setMenu(false);

    if (lenis) {
      // Lenis already honours the CSS scroll-padding-top that clears the nav.
      lenis.scrollTo(id === '#top' ? 0 : target, { duration: 1.4 });
    } else {
      const y = id === '#top' ? 0 : target.getBoundingClientRect().top + window.scrollY - nav.offsetHeight;
      window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    history.replaceState(null, '', id === '#top' ? window.location.pathname : id);
  });

  /* ------------------------------ Nav state ------------------------------- */

  const navTargets = $$('[data-nav-link]').map((a) => ({ a, el: document.getElementById(a.dataset.navLink) }));
  let lastY = window.scrollY;

  function onScroll() {
    const y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 8);

    if (!menuOpen) {
      const delta = y - lastY;
      if (Math.abs(delta) > 4) {
        const hide = delta > 0 && y > window.innerHeight * 0.7 && !nav.contains(document.activeElement);
        nav.classList.toggle('is-hidden', hide);
        lastY = y;
      }
      nav.classList.toggle('is-light', end.getBoundingClientRect().top < nav.offsetHeight * 0.6);
    }

    let active = null;
    for (const t of navTargets) if (t.el && t.el.getBoundingClientRect().top < window.innerHeight * 0.4) active = t;
    for (const t of navTargets) t.a.classList.toggle('is-active', t === active);
  }

  let scrollQueued = false;
  window.addEventListener('scroll', () => {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(() => {
      scrollQueued = false;
      onScroll();
    });
  }, { passive: true });
  onScroll();

  if (!hasGsap) return;

  /* ============================== GSAP below ============================== */

  gsap.registerPlugin(ScrollTrigger);
  if (window.SplitText) gsap.registerPlugin(SplitText);

  if (reduceMotion) return;

  /* ----------------------------- Smooth scroll ---------------------------- */

  if (window.Lenis) {
    lenis = new Lenis({ autoRaf: false, lerp: 0.1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* --------------------------------- Intro -------------------------------- */

  if (introAllowed) {
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    // y: 0 overrides the px offset GSAP would otherwise parse from the CSS pre-hide transform.
    tl.fromTo('.hero__name .c', { yPercent: 110, y: 0 }, { yPercent: 0, y: 0, duration: 1.6, stagger: 0.045 }, 0.15)
      .fromTo('[data-intro]', { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 1.2, stagger: 0.1 }, 0.7)
      .from('.nav > *', { autoAlpha: 0, y: -10, duration: 1, stagger: 0.06 }, 0.4)
      .from('.hero__canvas', { autoAlpha: 0, duration: 2.2, ease: 'power2.out' }, 0.5);
  }

  /* ---------------------------- Scroll reveals ---------------------------- */

  const onEnter = (trigger, start = 'top 88%') => ({ trigger, start, once: true });

  if (window.SplitText) {
    for (const el of $$('[data-split]')) {
      SplitText.create(el, {
        type: 'lines',
        mask: 'lines',
        linesClass: 'line',
        autoSplit: true,
        onSplit: (self) => gsap.from(self.lines, {
          yPercent: 105,
          duration: 1.3,
          stagger: 0.08,
          ease: 'expo.out',
          scrollTrigger: onEnter(el),
        }),
      });
    }
  }

  for (const el of $$('[data-reveal]')) {
    gsap.from(el, { autoAlpha: 0, y: 28, duration: 1.2, ease: 'expo.out', scrollTrigger: onEnter(el, 'top 92%') });
  }

  gsap.from('.index__item', {
    autoAlpha: 0,
    y: 26,
    duration: 1.1,
    stagger: 0.07,
    ease: 'expo.out',
    scrollTrigger: onEnter('.index', 'top 85%'),
  });

  for (const frame of $$('.fig__frame')) {
    gsap.fromTo(frame,
      { clipPath: 'inset(0% 0% 100% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut', scrollTrigger: onEnter(frame, 'top 85%') });
  }

  for (const el of $$('[data-count]')) {
    const target = Number(el.dataset.count);
    const counter = { v: 0 };
    el.textContent = '0';
    gsap.to(counter, {
      v: target,
      duration: 1.8,
      ease: 'power3.out',
      scrollTrigger: onEnter(el, 'top 92%'),
      onUpdate: () => { el.textContent = String(Math.round(counter.v)); },
    });
  }

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());

  /* ------------------------ Cursor + project preview ---------------------- */

  if (!finePointer) return;
  html.classList.add('has-cursor');

  const cursor = $('.cursor');
  const cursorLabel = $('.cursor__label', cursor);
  const preview = $('.preview');
  const previewCanvas = $('.preview__canvas', preview);
  const previewLabel = $('[data-preview-label]', preview);

  gsap.set(cursor, { x: -100, y: -100 });
  gsap.set(preview, { x: -500, y: -500, scale: 0.96 });
  const cursorX = gsap.quickTo(cursor, 'x', { duration: 0.15, ease: 'power3' });
  const cursorY = gsap.quickTo(cursor, 'y', { duration: 0.15, ease: 'power3' });
  const previewX = gsap.quickTo(preview, 'x', { duration: 0.6, ease: 'power3' });
  const previewY = gsap.quickTo(preview, 'y', { duration: 0.6, ease: 'power3' });

  const pointer = { x: -100, y: -100 };
  let previewOn = false;
  let previewFigure = null;
  let previewType = null;

  function previewPosition() {
    const w = preview.offsetWidth;
    const h = preview.offsetHeight;
    let x = pointer.x + 32;
    if (x + w > window.innerWidth - 16) x = pointer.x - w - 32;
    const y = clamp(pointer.y - h / 2, 16, window.innerHeight - h - 16);
    return { x, y };
  }

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    cursorX(e.clientX);
    cursorY(e.clientY);
    if (previewOn) {
      const p = previewPosition();
      previewX(p.x);
      previewY(p.y);
    }
  }, { passive: true });

  document.addEventListener('pointerover', (e) => {
    const t = e.target;
    const interactive = t.closest('a, button');
    const add = !interactive && t.closest('[data-cursor="add"]');
    cursor.classList.toggle('is-link', !!interactive && !t.closest('.index__link'));
    cursor.classList.toggle('is-add', !!add);
    cursorLabel.textContent = add ? '+ Add stop' : '';
  });

  html.addEventListener('mouseleave', () => gsap.to(cursor, { autoAlpha: 0, duration: 0.2 }));
  html.addEventListener('mouseenter', () => gsap.to(cursor, { autoAlpha: 1, duration: 0.2 }));

  for (const item of $$('.index__item')) {
    item.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse' || !window.Figures) return;
      const type = item.dataset.preview;
      previewLabel.textContent = item.dataset.label;
      if (type !== previewType) {
        if (previewFigure) previewFigure.stop();
        previewFigure = Figures.create(type, previewCanvas, { compact: true });
        previewType = type;
      }
      if (previewFigure) previewFigure.start();
      if (!previewOn) {
        const p = previewPosition();
        gsap.set(preview, { x: p.x, y: p.y });
      }
      previewOn = true;
      gsap.to(preview, { autoAlpha: 1, scale: 1, duration: 0.45, ease: 'power3.out', overwrite: 'auto' });
    });
  }

  $('.index').addEventListener('pointerleave', () => {
    previewOn = false;
    gsap.to(preview, {
      autoAlpha: 0,
      scale: 0.96,
      duration: 0.3,
      ease: 'power2.out',
      overwrite: 'auto',
      onComplete: () => previewFigure && previewFigure.stop(),
    });
  });
})();

console.log(
  '%cAaron Royan%c\nSoftware engineer. You opened the console, so we will probably get on.\nThis site is plain HTML, CSS and JS — the figures live in assets/js/figures.js.\nSay hello: aaron.dom.royan@gmail.com',
  'font: italic 32px "Instrument Serif", Georgia, serif; color: #ff5a1f;',
  'font: 12px ui-monospace, Menlo, monospace; color: inherit; line-height: 1.6;'
);

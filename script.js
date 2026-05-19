/* ============================================================
   Lahiru Supun — portfolio
   Vanilla JS. Tweaks panel + theme persistence + small bits.
   ============================================================ */

(() => {
  'use strict';

  // ---- defaults (also the source-of-truth values for the tweaks UI) ----
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "theme": "dark",
    "accent": "lime",
    "font": "jetbrains",
    "bg": "spotlight"
  }/*EDITMODE-END*/;

  const STORAGE_KEY = 'lahiru.portfolio.tweaks.v1';

  // ---- state ----
  const loadStored = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...TWEAK_DEFAULTS, ...JSON.parse(raw) } : { ...TWEAK_DEFAULTS };
    } catch (_) {
      return { ...TWEAK_DEFAULTS };
    }
  };
  const saveStored = (state) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
  };

  let state = loadStored();

  // ---- apply state to DOM ----
  const apply = () => {
    const root = document.documentElement;
    root.setAttribute('data-theme', state.theme);
    root.setAttribute('data-accent', state.accent);
    root.setAttribute('data-font', state.font);
    root.setAttribute('data-bg', state.bg);
    // reflect active in the tweaks UI
    document.querySelectorAll('[data-tweak]').forEach((el) => {
      const key = el.getAttribute('data-tweak');
      const val = el.getAttribute('data-value');
      el.classList.toggle('is-active', state[key] === val);
      el.setAttribute('aria-pressed', state[key] === val ? 'true' : 'false');
    });
  };

  const setTweak = (key, value) => {
    state = { ...state, [key]: value };
    saveStored(state);
    apply();
    // also notify the host (if embedded) so it persists on disk
    try {
      window.parent.postMessage(
        { type: '__edit_mode_set_keys', edits: { [key]: value } },
        '*'
      );
    } catch (_) {}
  };

  // ---- init year ----
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // ---- tweaks panel wiring ----
  const panel = document.getElementById('tweaks-panel');
  const closeBtn = document.getElementById('tweaks-close');

  document.querySelectorAll('[data-tweak]').forEach((el) => {
    el.addEventListener('click', () => {
      const key = el.getAttribute('data-tweak');
      const val = el.getAttribute('data-value');
      setTweak(key, val);
    });
  });

  const toggleBtn = document.getElementById('tweaks-toggle');

  const openPanel = () => {
    panel.hidden = false;
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'true');
  };
  const closePanel = () => {
    panel.hidden = true;
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
    try { window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*'); } catch (_) {}
  };

  if (toggleBtn) toggleBtn.addEventListener('click', openPanel);
  if (closeBtn) closeBtn.addEventListener('click', closePanel);

  // ---- host edit-mode protocol (Tweaks toolbar toggle) ----
  // Register listener BEFORE announcing availability.
  window.addEventListener('message', (event) => {
    const t = event && event.data && event.data.type;
    if (t === '__activate_edit_mode') {
      openPanel();
    } else if (t === '__deactivate_edit_mode') {
      closePanel();
    }
  });

  try {
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
  } catch (_) {}

  // ---- initial paint ----
  apply();

  // ---- mouse-tracked spotlight (writes --mx / --my on <body>) ----
  // rAF-throttled so we update at most once per frame.
  (() => {
    const body = document.body;
    let mx = window.innerWidth / 2;
    let my = window.innerHeight * 0.3;
    let queued = false;

    const write = () => {
      queued = false;
      body.style.setProperty('--mx', mx + 'px');
      body.style.setProperty('--my', my + 'px');
    };
    write();

    const onMove = (clientX, clientY) => {
      mx = clientX;
      my = clientY;
      if (!queued) {
        queued = true;
        requestAnimationFrame(write);
      }
    };

    window.addEventListener('pointermove', (e) => onMove(e.clientX, e.clientY), { passive: true });
    window.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches[0]) onMove(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
  })();

  // ---- smooth-scroll for in-page anchors (with a hair of offset for sticky topbar) ----
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href').slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const y = target.getBoundingClientRect().top + window.scrollY - 56;
      window.scrollTo({ top: y, behavior: 'smooth' });
      history.replaceState(null, '', '#' + id);
    });
  });
})();

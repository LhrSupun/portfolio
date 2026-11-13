/* ============================================================
   Lahiru Supun — portfolio
   Vanilla JS. Tweaks panel + theme persistence + small bits of motion.
   Everything here is progressive enhancement: the page reads fine without it.
   ============================================================ */

(() => {
  'use strict';

  // ---- defaults (also the source-of-truth values for the tweaks UI) ----
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "theme": "dark",
    "accent": "lime",
    "font": "geist",
    "bg": "spotlight"
  }/*EDITMODE-END*/;

  // v2: the font options changed from mono-only to sans + mono pairings, so
  // older saved values are ignored. Keep this key in sync with the inline
  // script in index.html (it applies saved tweaks before first paint).
  const STORAGE_KEY = 'lahiru.portfolio.tweaks.v2';

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // each feature below is independent — one failing must not take the rest down
  const run = (feature) => {
    try { feature(); } catch (err) { console.error(err); }
  };

  // ---- state ----
  // a saved value only counts if the tweaks UI still offers it
  const optionsFor = (key) =>
    Array.from(document.querySelectorAll(`[data-tweak="${key}"]`), (el) => el.getAttribute('data-value'));

  const sanitize = (candidate) => {
    const clean = { ...TWEAK_DEFAULTS };
    Object.keys(TWEAK_DEFAULTS).forEach((key) => {
      const value = candidate && candidate[key];
      if (typeof value === 'string' && optionsFor(key).includes(value)) clean[key] = value;
    });
    return clean;
  };

  const loadStored = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? sanitize(JSON.parse(raw)) : { ...TWEAK_DEFAULTS };
    } catch (_) {
      return { ...TWEAK_DEFAULTS };
    }
  };
  const saveStored = (state) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
  };

  let state = loadStored();

  // ---- apply state to DOM ----
  const themeToggle = document.getElementById('theme-toggle');
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');

  const apply = () => {
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
    if (themeToggle) {
      themeToggle.setAttribute(
        'aria-label',
        state.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
      );
    }
    // keep the browser chrome in step with the page background
    if (themeColorMeta) {
      const bg = getComputedStyle(root).getPropertyValue('--bg').trim();
      if (bg) themeColorMeta.setAttribute('content', bg);
    }
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

  // ---- theme switch: circular reveal from the control that was clicked ----
  const switchTheme = (next, origin) => {
    if (next === state.theme) return;
    if (reduceMotion || !origin || typeof document.startViewTransition !== 'function') {
      setTweak('theme', next);
      return;
    }
    const rect = origin.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );
    const transition = document.startViewTransition(() => setTweak('theme', next));
    transition.ready
      .then(() => {
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: 520, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)', pseudoElement: '::view-transition-new(root)' }
        );
      })
      .catch(() => {});
  };

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      switchTheme(state.theme === 'dark' ? 'light' : 'dark', themeToggle);
    });
  }

  // ---- init year ----
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // ---- tweaks panel wiring ----
  const panel = document.getElementById('tweaks-panel');
  const closeBtn = document.getElementById('tweaks-close');
  const toggleBtn = document.getElementById('tweaks-toggle');

  document.querySelectorAll('[data-tweak]').forEach((el) => {
    el.addEventListener('click', () => {
      const key = el.getAttribute('data-tweak');
      const val = el.getAttribute('data-value');
      if (key === 'theme') switchTheme(val, el);
      else setTweak(key, val);
    });
  });

  const openPanel = () => {
    if (!panel) return;
    panel.hidden = false;
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'true');
  };
  const closePanel = () => {
    if (!panel) return;
    panel.hidden = true;
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
    try { window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*'); } catch (_) {}
  };

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      openPanel();
      // the toggle hides itself while the panel is open, so hand focus to the panel
      if (closeBtn) closeBtn.focus();
    });
  }
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      closePanel();
      if (toggleBtn) toggleBtn.focus();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !panel || panel.hidden) return;
    const hadFocus = panel.contains(document.activeElement);
    closePanel();
    if (hadFocus && toggleBtn) toggleBtn.focus();
  });

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

  // ---- scroll reveals ----
  // Only elements that start below the fold are hidden ("armed") and faded in,
  // so nothing already on screen flashes, and nothing stays hidden without JS.
  run(() => {
    const els = Array.from(document.querySelectorAll('[data-reveal]'));
    const release = (el) => {
      el.removeAttribute('data-reveal');
      el.classList.remove('is-in');
      el.style.removeProperty('--i');
    };

    if (reduceMotion || !('IntersectionObserver' in window)) {
      els.forEach(release);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      let order = 0;
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        observer.unobserve(el);
        const i = order++;   // stagger whatever enters together
        el.style.setProperty('--i', String(i));
        el.classList.add('is-in');
        // once it has played, hand the element back to its normal styles
        window.setTimeout(() => release(el), 1600 + i * 70);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });

    const fold = window.innerHeight * 0.92;
    els.forEach((el) => {
      if (el.getBoundingClientRect().top < fold) {
        release(el);
      } else {
        el.setAttribute('data-reveal', 'armed');
        observer.observe(el);
      }
    });
  });

  // ---- nav: sliding highlight + current-section tracking ----
  run(() => {
    const nav = document.querySelector('.nav');
    if (!nav) return;
    const pill = nav.querySelector('.nav__pill');
    const links = Array.from(nav.querySelectorAll('a[href^="#"]'));
    const sections = links.map((link) => document.getElementById(link.getAttribute('href').slice(1)));
    let active = null;    // link of the section currently in view
    let hovered = null;   // link under the pointer / keyboard focus

    const placePill = () => {
      const link = hovered || active;
      // offsetWidth is 0 for links hidden on small screens
      if (!pill || !link || !link.offsetWidth) {
        nav.classList.remove('has-pill');
        return;
      }
      const wasShown = nav.classList.contains('has-pill');
      nav.style.setProperty('--pill-x', `${link.offsetLeft}px`);
      nav.style.setProperty('--pill-w', `${link.offsetWidth}px`);
      if (!wasShown) {
        void pill.offsetWidth;   // commit the position first so it fades in place instead of sliding in
        nav.classList.add('has-pill');
      }
    };

    const spy = () => {
      const line = window.innerHeight * 0.38;
      let current = null;
      sections.forEach((section, i) => {
        if (section && section.getBoundingClientRect().top <= line) current = links[i];
      });
      // a short last section never reaches the line — the page bottom counts as "in it"
      const atBottom = window.innerHeight + window.scrollY >= root.scrollHeight - 2;
      if (atBottom && window.scrollY > 0) current = links[links.length - 1];
      if (current === active) return;

      if (active) active.removeAttribute('aria-current');
      active = current;
      if (active) {
        active.setAttribute('aria-current', 'location');
        // on narrow screens the links scroll sideways — keep the current one in view
        if (nav.scrollWidth > nav.clientWidth) {
          nav.scrollTo({
            left: active.offsetLeft - (nav.clientWidth - active.offsetWidth) / 2,
            behavior: reduceMotion ? 'auto' : 'smooth',
          });
        }
      }
      placePill();
    };

    let queued = false;
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        spy();
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => {
      spy();
      placePill();
    });

    if (finePointer) {
      links.forEach((link) => {
        link.addEventListener('pointerenter', () => {
          hovered = link;
          placePill();
        });
      });
      nav.addEventListener('pointerleave', () => {
        hovered = null;
        placePill();
      });
    }

    spy();
    // link widths change once the web font swaps in
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(placePill).catch(() => {});
  });

  // ---- cursor-tracked background spotlight ----
  // Eased follow, written as a transform on the element itself (compositor only).
  run(() => {
    const spot = document.querySelector('.fx__spot');
    if (!spot || reduceMotion) return;
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight * 0.3;
    let x = targetX;
    let y = targetY;
    let frame = 0;

    const step = () => {
      x += (targetX - x) * 0.16;
      y += (targetY - y) * 0.16;
      spot.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      frame = Math.abs(targetX - x) + Math.abs(targetY - y) > 0.5 ? requestAnimationFrame(step) : 0;
    };
    const onMove = (clientX, clientY) => {
      targetX = clientX;
      targetY = clientY;
      if (!frame) frame = requestAnimationFrame(step);
    };

    window.addEventListener('pointermove', (e) => onMove(e.clientX, e.clientY), { passive: true });
    window.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches[0]) onMove(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
  });

  // ---- card border glow that follows the cursor (writes --cx / --cy per card) ----
  run(() => {
    if (!finePointer) return;
    document.querySelectorAll('[data-glow]').forEach((group) => {
      let frame = 0;
      let x = 0;
      let y = 0;
      const paint = () => {
        frame = 0;
        group.querySelectorAll('.card').forEach((card) => {
          const rect = card.getBoundingClientRect();
          card.style.setProperty('--cx', `${(x - rect.left).toFixed(1)}px`);
          card.style.setProperty('--cy', `${(y - rect.top).toFixed(1)}px`);
        });
      };
      group.addEventListener('pointermove', (e) => {
        x = e.clientX;
        y = e.clientY;
        if (!frame) frame = requestAnimationFrame(paint);
      }, { passive: true });
    });
  });

  // ---- live local time (Sri Lanka) ----
  run(() => {
    const clocks = document.querySelectorAll('[data-clock]');
    if (!clocks.length) return;
    const format = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Colombo',
    });
    const tick = () => {
      const now = new Date();
      const text = format.format(now);
      clocks.forEach((el) => {
        el.textContent = text;
        el.setAttribute('datetime', now.toISOString());
        el.hidden = false;
      });
    };
    tick();
    // re-sync on each minute boundary
    window.setTimeout(() => {
      tick();
      window.setInterval(tick, 60000);
    }, 60000 - (Date.now() % 60000) + 50);
  });

  // ---- years of experience, counted from a start month (YYYY-MM) ----
  run(() => {
    document.querySelectorAll('[data-years-since]').forEach((el) => {
      const match = /^(\d{4})-(\d{2})$/.exec(el.getAttribute('data-years-since') || '');
      if (!match) return;
      const now = new Date();
      const months = (now.getFullYear() - Number(match[1])) * 12 + (now.getMonth() + 1 - Number(match[2]));
      const years = Math.floor(months / 12);
      if (years > 0) el.textContent = `${years}+`;
    });
  });

  // ---- copy-to-clipboard buttons ----
  run(() => {
    const legacyCopy = (text) => {
      const field = document.createElement('textarea');
      field.value = text;
      field.setAttribute('readonly', '');
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.appendChild(field);
      field.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (_) {}
      field.remove();
      return ok;
    };

    document.querySelectorAll('[data-copy]').forEach((btn) => {
      const label = btn.querySelector('[data-copy-label]');
      const idleText = label ? label.textContent : '';
      let timer = 0;

      btn.addEventListener('click', async () => {
        const text = btn.getAttribute('data-copy') || '';
        let ok = false;
        try {
          await navigator.clipboard.writeText(text);
          ok = true;
        } catch (_) {
          ok = legacyCopy(text);
        }
        btn.classList.toggle('is-copied', ok);
        if (label) label.textContent = ok ? 'copied' : 'copy failed';
        window.clearTimeout(timer);
        timer = window.setTimeout(() => {
          btn.classList.remove('is-copied');
          if (label) label.textContent = idleText;
        }, 1800);
      });
    });
  });
})();

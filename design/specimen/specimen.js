/* Specimen shell: theme/platform switching + token lookup. Load right after build/web/tokens.js, in <head>. */
(function () {
  'use strict';

  const store = {
    get(key) {
      try { return localStorage.getItem(key); } catch (_) { return null; }
    },
    set(key, value) {
      try { localStorage.setItem(key, value); } catch (_) { /* private mode: ignore */ }
    },
  };

  const data = window.DS_TOKENS;
  if (!data) {
    document.addEventListener('DOMContentLoaded', () => {
      document.body.innerHTML =
        '<p style="font:16px sans-serif;padding:24px">Missing build/web/tokens.js. Run <code>npm run tokens</code> in the project root.</p>';
    });
    return;
  }

  const root = document.documentElement;
  const params = new URLSearchParams(location.search);
  const pick = (name, allowed, fallback) => {
    const value = params.get(name) || store.get(`ds.${name}`);
    return allowed.includes(value) ? value : fallback;
  };

  root.dataset.theme = pick('theme', data.themes, data.defaults.theme);
  root.dataset.platform = pick('platform', data.platforms, data.defaults.platform);
  // UI copy locale: English by default; Vietnamese is the launch locale and the diacritics stress test.
  const LOCALES = ['en', 'vi'];
  root.lang = pick('locale', LOCALES, 'en');

  const listeners = [];
  const PLATFORM_LABELS = { web: 'Web', 'embedded-7in': 'Embedded 7"' };
  const THEME_LABELS = { dark: 'Dark', light: 'Light' };

  function set(name, value) {
    root.dataset[name] = value;
    store.set(`ds.${name}`, value);
    renderToolbar();
    listeners.forEach((fn) => fn());
  }

  function segmented(name, values, labels) {
    const group = document.createElement('div');
    group.className = 'ds-seg';
    group.setAttribute('role', 'radiogroup');
    group.setAttribute('aria-label', name);
    values.forEach((value) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ds-seg__item';
      btn.textContent = labels[value] || value;
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', String(root.dataset[name] === value));
      btn.addEventListener('click', () => set(name, value));
      group.appendChild(btn);
    });
    return group;
  }

  function renderToolbar() {
    const host = document.getElementById('ds-toolbar');
    if (!host) return;
    // Locale switch reloads: widget/system strings and number formats are resolved at render time.
    const localeGroup = document.createElement('div');
    localeGroup.className = 'ds-seg';
    localeGroup.setAttribute('role', 'radiogroup');
    localeGroup.setAttribute('aria-label', 'locale');
    LOCALES.forEach((value) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ds-seg__item';
      btn.textContent = value.toUpperCase();
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', String(root.lang === value));
      btn.addEventListener('click', () => {
        if (root.lang === value) return;
        store.set('ds.locale', value);
        const url = new URL(location.href);
        url.searchParams.delete('locale');
        location.href = url.toString();
      });
      localeGroup.appendChild(btn);
    });
    host.replaceChildren(
      segmented('theme', data.themes, THEME_LABELS),
      segmented('platform', data.platforms, PLATFORM_LABELS),
      localeGroup,
    );
  }

  const PAGES = [
    ['index.html', 'Index'],
    ['foundations.html', 'Foundations'],
    ['button.html', 'Button'],
    ['toggle.html', 'Toggle'],
    ['slider.html', 'Slider · Setpoint'],
    ['list-item.html', 'List item'],
    ['device-card.html', 'Device card'],
  ];

  function renderNav() {
    const host = document.getElementById('ds-nav');
    if (!host) return;
    const here = location.pathname.split('/').pop() || 'index.html';
    host.replaceChildren(...PAGES.map(([href, label]) => {
      const a = document.createElement('a');
      a.href = href;
      a.textContent = label;
      if (href === here) a.setAttribute('aria-current', 'page');
      return a;
    }));
  }

  window.DS = {
    data,
    theme: () => root.dataset.theme,
    platform: () => root.dataset.platform,
    isTouch: () => root.dataset.platform.startsWith('embedded'),
    /** Resolved tokens for the active theme/platform, keyed by public name (e.g. "button.height.md"). */
    tokens: () => data.combos[`${root.dataset.theme}/${root.dataset.platform}`],
    token: (name) => {
      const t = data.combos[`${root.dataset.theme}/${root.dataset.platform}`][name];
      if (!t) throw new Error(`Unknown token "${name}"`);
      return t;
    },
    onChange: (fn) => listeners.push(fn),
    /** Sample product copy per locale: DS.L({ en: 'Air conditioner', vi: 'Điều hoà' }). Falls back to English. */
    L: (copy) => copy[root.lang] ?? copy.en,
    /**
     * Geometry audit of the rendered page (playbook §15.1). Returns a list of failures; empty = pass.
     * Run it in the console (DS.audit()) or headless via `npm run test:browser`.
     *   hit-area     interactive widgets are at least hit-area.min in both dimensions
     *   containment  visible parts of a widget stay inside its content box, i.e. clear of padding and border
     *                (hit-area wrappers may spill into the padding)
     *   line-box     single-line values are exactly one line tall (smaller inline text must not grow the line)
     */
    audit() {
      const failures = [];
      const TOLERANCE = 0.5;
      const minHit = parseFloat(window.DS.token('hit-area.min').css);
      const shown = (n) => {
        const r = n.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && !n.closest('[hidden]');
      };
      const describe = (n) => {
        const cls = [...n.classList].find((c) => c.startsWith('nn-')) || n.tagName.toLowerCase();
        const text = (n.getAttribute('aria-label') || n.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 28);
        return text ? `${cls} "${text}"` : cls;
      };
      const fail = (rule, node, detail) => failures.push({ rule, el: describe(node), detail });

      document.querySelectorAll('.nn-button, .nn-toggle, .nn-slider, .nn-list-item--interactive, .nn-device-card--interactive').forEach((n) => {
        if (!shown(n)) return;
        const r = n.getBoundingClientRect();
        if (r.width < minHit - TOLERANCE || r.height < minHit - TOLERANCE) {
          fail('hit-area', n, `${Math.round(r.width)}x${Math.round(r.height)} is below ${minHit}px`);
        }
      });

      document.querySelectorAll('.nn-device-card, .nn-list, .nn-button, .nn-setpoint, .nn-slider').forEach((box) => {
        if (!shown(box)) return;
        // Compare against the padding box's inner edge (content box): parts may not sit in the padding or border.
        const rect = box.getBoundingClientRect();
        const cs = getComputedStyle(box);
        const inset = (side) => parseFloat(cs[`border${side}Width`]) + parseFloat(cs[`padding${side}`]);
        const outer = {
          left: rect.left + inset('Left'), right: rect.right - inset('Right'),
          top: rect.top + inset('Top'), bottom: rect.bottom - inset('Bottom'),
        };
        box.querySelectorAll('[class*="nn-"]').forEach((part) => {
          // .nn-toggle is a transparent hit-area wrapper: its surplus may spill; its track/thumb are checked.
          if (part.classList.contains('nn-toggle') || !shown(part)) return;
          // A rotating spinner's bounding box changes with its angle; measuring it would make the audit flaky.
          if (getComputedStyle(part).animationName !== 'none') return;
          const r = part.getBoundingClientRect();
          const over = Math.max(outer.left - r.left, r.right - outer.right, outer.top - r.top, r.bottom - outer.bottom);
          if (over > TOLERANCE) fail('containment', part, `overflows ${describe(box)} by ${Math.round(over * 10) / 10}px`);
        });
      });

      document.querySelectorAll('.nn-device-card__value, .nn-setpoint__value').forEach((n) => {
        if (!shown(n)) return;
        const line = parseFloat(getComputedStyle(n).lineHeight);
        const height = n.getBoundingClientRect().height;
        if (Number.isFinite(line) && Math.abs(height - line) > TOLERANCE) {
          fail('line-box', n, `height ${Math.round(height * 10) / 10}px is not one line (${line}px)`);
        }
      });

      return failures;
    },
    /** Table of resolved tokens whose public name starts with one of the prefixes. */
    tokenTable(...prefixes) {
      const rows = Object.entries(window.DS.tokens()).filter(([name]) => prefixes.some((p) => name.startsWith(`${p}.`)));
      const el = window.DS.el;
      return el('table', { class: 'ds-table' },
        el('thead', {}, el('tr', {}, ...['Token', 'Value', 'CSS', 'C (LVGL)'].map((h) => el('th', { text: h })))),
        el('tbody', {}, ...rows.map(([name, t]) => el('tr', {},
          el('td', { style: 'font-weight:600', text: name }),
          el('td', { class: 'ds-mono', text: t.css }),
          el('td', { class: 'ds-mono', text: t.cssVar }),
          el('td', { class: 'ds-mono', text: t.c })))));
    },
    el(tag, attrs = {}, ...children) {
      const node = document.createElement(tag);
      for (const [k, v] of Object.entries(attrs)) {
        if (v === undefined || v === null || v === false) continue;
        if (k === 'class') node.className = v;
        else if (k === 'text') node.textContent = v;
        else if (k === 'style') node.style.cssText = v;
        else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
        else node.setAttribute(k, v === true ? '' : v);
      }
      children.flat().forEach((c) => node.append(c instanceof Node ? c : document.createTextNode(String(c))));
      return node;
    },
  };

  document.addEventListener('DOMContentLoaded', () => {
    renderNav();
    renderToolbar();
  });
})();

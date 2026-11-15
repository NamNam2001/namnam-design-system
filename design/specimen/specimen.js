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

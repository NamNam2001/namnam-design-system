/*
 * Widget factories: DOM structure + behavior only. All visuals live in components/*.css.
 * Widgets are "dumb" (playbook §3.2): they render props and report user intent.
 * Device logic (desired vs reported, pending, timeout) lives in NN.command(), standing in for a Module.
 * Requires specimen.js (window.DS).
 */
(function () {
  'use strict';

  const el = (...args) => DS.el(...args);
  const icon = (name, cls) => el('span', { class: `${cls} material-symbols-rounded`, 'aria-hidden': 'true', text: name });
  const FORCED = ['hover', 'pressed', 'focused'];

  // ------------------------------------------------------------- Button
  function button({ variant = 'primary', size = 'md', state = 'default', label, icon: glyph, ariaLabel, onClick } = {}) {
    const classes = ['nn-button', `nn-button--${variant}`];
    if (size !== 'md') classes.push(`nn-button--${size}`);
    if (!label) classes.push('nn-button--icon');
    const b = el('button', {
      type: 'button',
      class: classes.join(' '),
      disabled: state === 'disabled',
      'aria-busy': state === 'loading' ? 'true' : null,
      'aria-label': label ? null : ariaLabel,
      'data-state': FORCED.includes(state) ? state : null,
      tabindex: state === 'default' ? null : '-1',
      onclick: onClick,
    });
    if (glyph) b.append(icon(glyph, 'nn-button__icon'));
    if (label) b.append(el('span', { class: 'nn-button__label', text: label }));
    b.append(el('span', { class: 'nn-button__spinner', 'aria-hidden': 'true' }));
    return b;
  }

  // ------------------------------------------------------------- Toggle
  /** onToggle(next, el) handles the change (e.g. NN.command). Without it, the toggle flips locally. */
  function toggle({ checked = false, state = 'default', label, onToggle } = {}) {
    const t = el('button', {
      type: 'button',
      class: 'nn-toggle',
      role: 'switch',
      'aria-checked': String(checked),
      'aria-label': label,
      'aria-busy': state === 'pending' ? 'true' : null,
      disabled: state === 'disabled',
      'data-state': FORCED.includes(state) ? state : null,
      tabindex: state === 'default' ? null : '-1',
    }, el('span', { class: 'nn-toggle__track' }, el('span', { class: 'nn-toggle__thumb' })));
    t.addEventListener('click', (e) => {
      e.stopPropagation();
      if (t.disabled || t.getAttribute('aria-busy') === 'true') return;
      const next = t.getAttribute('aria-checked') !== 'true';
      if (onToggle) onToggle(next, t);
      else t.setAttribute('aria-checked', String(next));
    });
    return t;
  }

  // ------------------------------------------------------------- Slider
  function slider({ min = 0, max = 100, step = 1, value = 50, normal, label, unit = '', state = 'default', onInput, onChange } = {}) {
    const fill = el('span', { class: 'nn-slider__fill' });
    const track = el('span', { class: 'nn-slider__track' }, fill);
    if (normal) {
      const [a, b] = normal;
      const pct = (v) => ((v - min) / (max - min)) * 100;
      track.append(el('span', { class: 'nn-slider__range', style: `left:${pct(a)}%; width:${pct(b) - pct(a)}%` }));
    }
    const thumb = el('span', { class: 'nn-slider__thumb' });
    const disabled = state === 'disabled';
    const root = el('div', {
      class: 'nn-slider',
      role: 'slider',
      tabindex: disabled ? null : '0',
      'aria-label': label,
      'aria-valuemin': min,
      'aria-valuemax': max,
      'aria-disabled': disabled ? 'true' : null,
      'data-state': FORCED.includes(state) ? state : null,
    }, track, thumb);

    let current = value;
    const clamp = (v) => Math.min(max, Math.max(min, Math.round(v / step) * step));
    function set(v, emit) {
      current = clamp(v);
      const pct = ((current - min) / (max - min)) * 100;
      root.style.setProperty('--_pct', `${pct}%`);
      // thumb is positioned relative to the root; map track % into root coordinates
      thumb.style.left = `calc(var(--nn-slider-thumb-size) / 2 + (100% - var(--nn-slider-thumb-size)) * ${pct / 100})`;
      root.setAttribute('aria-valuenow', current);
      root.setAttribute('aria-valuetext', `${current}${unit}`);
      if (emit && onInput) onInput(current);
    }
    set(value, false);
    root.setValue = (v) => set(v, false);
    root.getValue = () => current;

    if (!disabled) {
      const fromPointer = (e) => {
        const r = track.getBoundingClientRect();
        return min + ((e.clientX - r.left) / r.width) * (max - min);
      };
      root.addEventListener('pointerdown', (e) => {
        root.setPointerCapture(e.pointerId);
        root.dataset.state = 'pressed';
        set(fromPointer(e), true);
      });
      root.addEventListener('pointermove', (e) => {
        if (root.dataset.state === 'pressed') set(fromPointer(e), true);
      });
      const release = () => {
        if (root.dataset.state !== 'pressed') return;
        delete root.dataset.state;
        if (onChange) onChange(current);
      };
      root.addEventListener('pointerup', release);
      root.addEventListener('pointercancel', release);
      root.addEventListener('keydown', (e) => {
        const big = (max - min) / 10;
        const map = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step, PageUp: big, PageDown: -big };
        if (e.key in map) set(current + map[e.key], true);
        else if (e.key === 'Home') set(min, true);
        else if (e.key === 'End') set(max, true);
        else return;
        e.preventDefault();
        if (onChange) onChange(current);
      });
    }
    return root;
  }

  // ------------------------------------------------------------- Setpoint
  /** Stepper for a target value, with the reported reading and normal range as context. */
  function setpoint({ label, value, min, max, step = 0.5, unit = '', decimals = 1, current, normal, state = 'default', onCommit } = {}) {
    let desired = value;
    const valueEl = el('p', { class: 'nn-setpoint__value' });
    const meta = el('p', { class: 'nn-setpoint__meta', 'aria-live': 'polite' });
    const disabled = state === 'disabled';
    const dec = button({ variant: 'secondary', size: 'lg', icon: 'remove', ariaLabel: `Giảm ${label}`, state: disabled ? 'disabled' : 'default' });
    const inc = button({ variant: 'secondary', size: 'lg', icon: 'add', ariaLabel: `Tăng ${label}`, state: disabled ? 'disabled' : 'default' });
    const root = el('div', { class: 'nn-setpoint', role: 'group', 'aria-label': label, 'aria-disabled': disabled ? 'true' : null },
      el('p', { class: 'nn-setpoint__label', text: label }),
      el('div', { class: 'nn-setpoint__row' }, dec, valueEl, inc),
      meta);

    const fmt = (v) => Number(v).toFixed(decimals).replace('.', ',');
    const context = () => [current !== undefined && `Hiện tại ${fmt(current)}${unit}`, normal && `bình thường ${fmt(normal[0])}–${fmt(normal[1])}${unit}`]
      .filter(Boolean).join(' · ');

    function render() {
      valueEl.replaceChildren(fmt(desired), el('span', { class: 'nn-setpoint__unit', text: unit }));
      if (!disabled) {
        dec.disabled = desired <= min;
        inc.disabled = desired >= max;
      }
    }
    root.setMeta = (text) => { meta.textContent = text; };
    root.setPending = (on) => { if (on) root.setAttribute('aria-busy', 'true'); else root.removeAttribute('aria-busy'); };
    root.setError = (msg) => { if (msg) root.dataset.error = ''; else delete root.dataset.error; root.setMeta(msg || context()); };
    root.setValue = (v) => { desired = v; render(); };
    root.getValue = () => desired;
    root.setCurrent = (v) => { current = v; if (!root.hasAttribute('aria-busy') && !('error' in root.dataset)) root.setMeta(context()); };

    let timer = null;
    const nudge = (delta) => {
      desired = Math.min(max, Math.max(min, Math.round((desired + delta) / step) * step));
      render();
      root.setError(null);
      clearTimeout(timer);
      // debounce: send one command after the user stops tapping
      timer = setTimeout(() => onCommit && onCommit(desired, root), 600);
    };
    dec.addEventListener('click', () => nudge(-step));
    inc.addEventListener('click', () => nudge(step));

    render();
    if (state === 'pending') { root.setPending(true); root.setMeta('Đang gửi tới thiết bị…'); }
    else if (state === 'error') root.setError('Thiết bị không phản hồi · đã giữ giá trị cũ');
    else if (disabled) root.setMeta('Mất kết nối · không thể điều chỉnh');
    else root.setMeta(context());
    return root;
  }

  // ------------------------------------------------------------- List / ListItem
  function list({ header, items = [] } = {}) {
    return el('div', { class: 'nn-list', role: 'list' },
      header ? el('p', { class: 'nn-list__header', text: header }) : '',
      ...items);
  }

  function listItem({ icon: glyph, title, subtitle, trailing, interactive = false, chevron = interactive, disabled = false, state = 'default', onClick } = {}) {
    const children = [];
    if (glyph) children.push(icon(glyph, 'nn-list-item__leading'));
    children.push(el('span', { class: 'nn-list-item__content' },
      el('span', { class: 'nn-list-item__title', text: title }),
      subtitle ? el('span', { class: 'nn-list-item__subtitle', text: subtitle }) : ''));
    const trail = [];
    if (trailing !== undefined && trailing !== null) trail.push(trailing instanceof Node ? trailing : el('span', { text: trailing }));
    if (chevron) trail.push(icon('chevron_right', ''));
    if (trail.length) children.push(el('span', { class: 'nn-list-item__trailing' }, ...trail));

    return el(interactive ? 'button' : 'div', {
      type: interactive ? 'button' : null,
      role: interactive ? null : 'listitem',
      class: `nn-list-item${interactive ? ' nn-list-item--interactive' : ''}`,
      'aria-disabled': disabled ? 'true' : null,
      'data-state': FORCED.includes(state) ? state : null,
      tabindex: interactive && state !== 'default' ? '-1' : null,
      onclick: interactive && !disabled ? onClick : null,
    }, ...children);
  }

  // ------------------------------------------------------------- DeviceCard
  const STATUS_TEXT = {
    ok: 'Hoạt động bình thường',
    warning: 'Cảnh báo',
    critical: 'Lỗi',
    info: 'Thông tin',
    offline: 'Mất kết nối',
  };

  function deviceCard({ icon: glyph, title, value, unit, status = 'ok', statusText, active = false, control = 'toggle', compact = false, pending = false, state = 'default', onToggle, onClick } = {}) {
    const interactive = control === 'chevron';
    const classes = ['nn-device-card'];
    if (compact) classes.push('nn-device-card--compact');
    if (interactive) classes.push('nn-device-card--interactive');

    const header = el('div', { class: 'nn-device-card__header' }, icon(glyph, 'nn-device-card__icon'));
    let tgl = null;
    if (control === 'toggle') {
      tgl = toggle({ checked: active, label: title, state: status === 'offline' ? 'disabled' : pending ? 'pending' : 'default', onToggle });
      tgl.classList.add('nn-device-card__control');
      header.append(tgl);
    } else if (interactive) {
      header.append(el('span', { class: 'material-symbols-rounded', 'aria-hidden': 'true', style: 'color: var(--nn-device-card-meta-fg)', text: 'chevron_right' }));
    }

    const statusEl = el('p', { class: 'nn-device-card__status', 'aria-live': 'polite' });
    const valueEl = el('p', { class: 'nn-device-card__value' });

    const root = el(interactive ? 'button' : 'div', {
      type: interactive ? 'button' : null,
      class: classes.join(' '),
      'data-state': interactive && FORCED.includes(state) ? state : null,
      tabindex: interactive && state !== 'default' ? '-1' : null,
      onclick: interactive ? onClick : null,
    }, header, el('p', { class: 'nn-device-card__title', text: title }), valueEl, statusEl);

    root.update = (props) => {
      if ('status' in props) root.dataset.status = props.status;
      if ('active' in props) {
        root.dataset.active = String(props.active);
        if (tgl) tgl.setAttribute('aria-checked', String(props.active));
      }
      if ('pending' in props) {
        if (props.pending) root.setAttribute('aria-busy', 'true'); else root.removeAttribute('aria-busy');
        if (tgl) { if (props.pending) tgl.setAttribute('aria-busy', 'true'); else tgl.removeAttribute('aria-busy'); }
      }
      if (tgl && 'status' in props) tgl.disabled = props.status === 'offline';
      if ('value' in props) valueEl.replaceChildren(props.value ?? '—', props.unit ?? unit ? el('span', { class: 'nn-device-card__unit', text: props.unit ?? unit }) : '');
      if ('statusText' in props || 'status' in props) statusEl.textContent = props.statusText || STATUS_TEXT[root.dataset.status] || '';
    };
    root.update({ status, active, pending, value, unit, statusText });
    root.toggleEl = tgl;
    return root;
  }

  // ------------------------------------------------------------- Device command (stands in for a Module)
  /**
   * Simulated device round-trip. outcome: 'ack' | 'error' | 'timeout'.
   * Resolves on ack; rejects with the outcome otherwise. Real modules send MQTT and wait for the reported state.
   */
  function command(outcome = 'ack', latency = 900) {
    return new Promise((resolve, reject) => {
      const wait = outcome === 'timeout' ? latency * 3 : latency;
      setTimeout(() => (outcome === 'ack' ? resolve() : reject(outcome)), wait);
    });
  }

  /**
   * Desired/reported statechart for an on/off device (playbook §6.2):
   *   tap -> pending (show desired) -> ack: reported = desired | error/timeout: revert + message
   */
  function bindOnOff(card, { getOutcome, onActive }) {
    return (next) => {
      const before = card.dataset.active === 'true';
      card.update({ active: next, pending: true, statusText: next ? 'Đang bật…' : 'Đang tắt…' });
      command(getOutcome())
        .then(() => {
          card.update({ pending: false, statusText: next ? 'Đang chạy' : 'Đã tắt' });
          if (onActive) onActive(next);
        })
        .catch((reason) => card.update({
          active: before,
          pending: false,
          statusText: reason === 'timeout' ? 'Thiết bị không phản hồi · đã giữ trạng thái cũ' : 'Lệnh bị từ chối · đã giữ trạng thái cũ',
        }));
    };
  }

  /** Small radio group for specimen controls (simulation outcome etc). */
  function choice(name, options, current, onSelect) {
    const group = el('div', { class: 'ds-seg', role: 'radiogroup', 'aria-label': name });
    const render = (value) => {
      group.replaceChildren(...options.map(([v, text]) => el('button', {
        type: 'button', class: 'ds-seg__item', role: 'radio', 'aria-checked': String(v === value), text,
        onclick: () => { render(v); onSelect(v); },
      })));
    };
    render(current);
    return group;
  }

  window.NN = { button, toggle, slider, setpoint, list, listItem, deviceCard, command, bindOnOff, choice, icon };
})();

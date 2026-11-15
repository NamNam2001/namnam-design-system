# AGENTS.md: NamNam Design System

Instructions for any AI coding agent working in this repo. Read this file fully before doing anything.
The full rulebook is [`docs/PLAYBOOK.md`](docs/PLAYBOOK.md) (Vietnamese). Read the sections this file points to; don't load all of it by default.

## What this repo is

**NamNam** is a design system for IoT control UIs: one token source → embedded UI (LVGL on ESP32-P4, 7" 1024×600 touch panel for now) and web app.
Design philosophy: **Calm Control** (PLAYBOOK §1–§2): ISA-101 High-Performance HMI as the backbone (neutral UI, color only for abnormal states, state always visible), Apple HIG for refinement.

Current state: tokens + build pipeline + web specimens for 5 widgets (Button, Toggle, Slider/Setpoint, List/ListItem, DeviceCard).
**Not done yet:** LVGL widget code, real-board review, final font, final panel size (open questions: PLAYBOOK §18).

## Commands

```bash
npm run tokens          # build tokens -> build/ (CSS, JS, LVGL headers) + contrast audit
npm run tokens:check    # same, exits 1 if the contrast audit fails; run before every commit
```

No dependencies to install (Node >= 18). Specimens: open `design/specimen/index.html` in a browser (works from file://).

## Map

| Path | What | Edit? |
|---|---|---|
| `tokens/` | Source of truth, W3C DTCG JSON: `primitive.json` → `base.json` + `semantic/<theme>.json` + `modes/<platform>.json` → `component/<widget>.json` | **Yes: the only place values change** |
| `tools/tokens-build/build.mjs` | Zero-dependency build: resolve aliases, emit CSS/JS/C, run contrast audit. System prefix lives in `SYSTEM` | Yes, carefully |
| `build/` | GENERATED: `web/tokens.css`, `web/tokens.js`, `embedded/nn_theme*.h`, `audit.md` | **Never by hand**; regenerate and commit with `tokens/` |
| `design/specimen/components/*.css` | Widget styles (BEM, `nn-` prefix) | Yes |
| `design/specimen/components/widgets.js` | Widget factories `NN.*` + simulated device command | Yes |
| `design/specimen/*.html` | One specimen page per layer/widget | Yes |
| `docs/PLAYBOOK.md` | Rules, workflows, decision log | Yes: record every decision in §19 |

## Hard rules (never break these)

1. **Values only come from tokens.** No hex colors, no raw px in widget/screen CSS or code. Use `var(--nn-…)` / `NN_TK_…`. Private component vars start with `--_`.
2. **Layers** (PLAYBOOK §3.2): Tokens → Widgets → Modules → Screens. A layer only uses layers below it.
   Widgets are "dumb" (render props, report intent; no device/network knowledge). Modules own data + statecharts. Screens only compose and lay out.
3. **Naming** (PLAYBOOK §3.3, §11): BEM with prefix `nn-` (`.nn-device-card__status`, `.nn-button--danger`).
   **States are never in class names**: use `:disabled`, `aria-checked`, `aria-busy`, `aria-disabled`, `data-status`, `data-state` (specimen forcing only), `LV_STATE_*`.
4. **State model** (PLAYBOOK §6): every interactive widget supports default / pressed / focused / disabled (+ hover on web only, never on touch).
   Pressed = state layer at `opacity.state.pressed`; disabled = content at `opacity.state.disabled`.
   Device control always separates **desired vs reported** state: pending → ack / error / timeout (revert + message) / offline (disabled + label).
5. **ISA-101 color rule**: abnormal states change only the status row/icon (dot + color + text), never a whole card. Never convey state by color alone.
6. **Touch**: hit area ≥ `hit-area.min` / `control.height.md` for the platform; visible parts of a control never overflow their container's padding box (only the hit-area surplus may spill into padding, computed from tokens). Smaller inline text (units, badges) must not grow its line box.
7. **Embedded-first**: flat surfaces + 1px borders; no blur, glass or large shadows (they don't run on the MCU and the web must match).
8. **Contrast**: `npm run tokens:check` must pass. New status/indicator colors → add a pair to `AUDIT` in `build.mjs`.
9. **Vietnamese UI text**, decimal comma (`24,5°C`). Test the longest label.

## How to handle a request

Every request starts with **classification** (PLAYBOOK §16.6). Then follow that type's workflow and **stop at its review gate**. Do not pass a gate without the human's approval.

| Type | Example | Workflow |
|---|---|---|
| A. Design bug | control overflows a card | §16.7: root cause, fix at the lowest layer, re-measure everywhere, turn it into an audit rule |
| B. Token change | change accent color | §16.8 |
| C. New icon | | §16.9 (Material Symbols Rounded first) |
| D. Change a widget | add a size | §16.10 |
| E. New widget | ProgressBar, Dialog | §16.11: check it's really needed first; then token → CSS → `widgets.js` → specimen; stop at gate 2 |
| F. Pattern / module | alarms, connection state | §16.12: statechart first; specimen simulates every branch |
| G. New screen | Settings | §16.13: brief → have/missing analysis → screen spec, then **stop at gate 1** |
| H. New feature | schedules, OTA | §16.14: data contract before detailed design |
| I. New platform | 4.3" panel | §16.15 |
| J. Remove / deprecate | | §16.16 |

Templates (brief, RFC, screen spec, feature spec): PLAYBOOK §16.18.

## Definition of done (self-check before asking for review: PLAYBOOK §16.17)

- [ ] `npm run tokens:check` passes
- [ ] No hex/px in `design/specimen/components/*.css` or screen CSS
- [ ] Specimen shows every modifier × state, checked in dark + light and web + embedded-7in
- [ ] No overflow, hit areas OK, no line-box growth (measure with a script in the browser)
- [ ] No browser console errors
- [ ] Every statechart branch can be simulated and renders correctly
- [ ] Longest Vietnamese label doesn't break layout
- [ ] Updated: specimen nav (`PAGES` in `design/specimen/specimen.js`) + `index.html`, README widget table, PLAYBOOK §8.4 and §19 decision log

## Working style

- Small batches: one widget / one screen at a time. Report what you verified and how; say plainly what you did not verify.
- Ask the human only for decisions that are theirs (taste, scope, open questions in PLAYBOOK §18). Otherwise follow the playbook.
- Commit messages: imperative, scoped (`feat(toggle): add pending state`, `fix(device-card): keep toggle inside padding`).

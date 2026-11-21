# NamNam Design System

**Live specimens:** https://namnam2001.github.io/namnam-design-system/ (redeployed from `main` after CI passes)

Design tokens, widgets and specimens for IoT UI: embedded (LVGL on ESP32-P4) and web, from one source.
Design philosophy: **Calm Control** (ISA-101 backbone + Apple HIG refinement).

- Full rules and workflows: [`docs/PLAYBOOK.md`](docs/PLAYBOOK.md)
- Working with an AI agent (Claude Code, Codex, Cursor, Copilot...): it reads [`AGENTS.md`](AGENTS.md) first.

## Quick start

```bash
npm install             # once; only dev dependency is playwright-core (uses your installed Chrome)
npm run tokens          # build tokens + contrast audit
npm run check           # strict token build + static design lint
npm run test:browser    # geometry audit of every specimen (hit areas, containment, line boxes)
npm run verify          # everything above; CI runs the same (.github/workflows/check.yml)
```

Open `design/specimen/index.html` in a browser. Use the toolbar to switch **Dark/Light** and **Web/Embedded 7"**.
Fonts and icons load from Google Fonts; offline, text falls back to sans-serif and icons show their names.

## Using the tokens in a web app

Load `build/web/tokens.css` and set attributes on `<html>`: `data-theme="dark|light"` and `data-platform="web|embedded-7in"`.
Either attribute may be omitted: a missing theme falls back to `dark`, a missing platform to `web`.

## Figma

The Figma file is generated from the tokens by the NamNam Figma plugin (phase 1: variables + Foundations page).

1. `npm run tokens` (builds `build/figma/code.js` with the current tokens).
2. Figma **desktop** app, in the target file: **Plugins → Development → Import plugin from manifest…** → `build/figma/manifest.json` (once).
3. **Plugins → Development → NamNam Design System Sync**. It creates or updates the variable collections
   (`NN · Primitives / Base / Theme / Platform / Components`, aliases kept, `var(--nn-*)` code syntax) and regenerates
   the **NamNam · Foundations** page (dark and light side by side).

Re-run step 3 after every token change. Share the file with a view link for clients; devs use the specimens and `build/`.

## Naming (playbook §3.3)

Everything exported carries the system prefix, so NamNam can live inside other web apps or LVGL projects without collisions.

| Where | Pattern | Example |
|---|---|---|
| CSS custom property | `--nn-<token>` | `--nn-bg-canvas`, `--nn-button-height-md` |
| CSS class (BEM) | `nn-<block>[__element][--modifier]` | `.nn-button--danger`, `.nn-device-card__status` |
| C macro (LVGL) | `NN_TK_<TOKEN>` | `NN_TK_BG_CANVAS`, `NN_TK_BUTTON_HEIGHT_MD` |
| C header | `nn_theme.h` (+ `nn_theme_<theme>_<panel>.h`) | `#include "nn_theme.h"` |
| C function (LVGL widgets, planned) | `nn_<block>_<action>` | `nn_button_create()` |
| JS widget library | `NN.<widget>()` | `NN.toggle({ checked: true })` |

Private custom properties inside a component start with `--_` and are never exported.

## Layout

```
tokens/                      source of truth (W3C DTCG JSON), the only place values are edited
  primitive.json             raw palette, never used by UI code
  base.json                  shared semantic: space, radius, stroke, font, opacity, motion
  semantic/{dark,light}.json theme: color roles
  modes/{web,embedded-7in}.json  platform: type scale, control sizes, hit area
  component/*.json           component tokens (references only)
tools/tokens-build/build.mjs zero-dependency build (Node >= 18)
build/                       GENERATED, do not edit
  web/tokens.css             --nn-* custom properties per [data-theme][data-platform]
  web/tokens.js              window.DS_TOKENS for specimens
  embedded/nn_theme.h        include this in LVGL code; picks theme/panel by macro
  embedded/nn_theme_*.h      #define NN_TK_* (RGB888 + RGB565, px, ms, lv_opa_t, lv_anim paths)
  audit.md                   contrast report
design/specimen/             one page per layer/widget: every modifier x every state
  components/*.css           widget styles (BEM, nn- prefix), token custom properties only
  components/<block>.spec.json  machine-readable widget spec, cross-checked against the CSS by the lint
  components/widgets.js      widget factories (NN.*) + simulated device command / statechart
tools/design-lint/           lint.mjs (static rules) + browser-audit.mjs (DS.audit() on every specimen)
```

## Widgets so far

| Widget | Block(s) | Specimen | Notes |
|---|---|---|---|
| Button | `nn-button` | `button.html` | 4 variants, icon-only, loading keeps width |
| Toggle | `nn-toggle` | `toggle.html` | role=switch, pending state, desired/reported demo |
| Slider, Setpoint | `nn-slider`, `nn-setpoint` | `slider.html` | normal-range band, current reading, debounced commit |
| List, ListItem | `nn-list`, `nn-list-item` | `list-item.html` | interactive / with control / read-only |
| DeviceCard | `nn-device-card` | `device-card.html` | ok/warning/critical/offline/pending, 7" dashboard |

## Rules (playbook §4, §11, §15, §16)

1. Change values only in `tokens/`, then rebuild and commit `tokens/` and `build/` together.
2. UI code uses semantic/component tokens only: no hex, no px.
3. BEM with the `nn-` prefix. States are never in class names (`:disabled`, `aria-busy`, `LV_STATE_PRESSED`).
4. New request? Classify it first (playbook §16.6), then follow that type's workflow and stop at its review gate.
5. A widget is done when it is in a specimen with every modifier x state, the audit passes, and it was checked on the real board.

## LVGL usage

```c
#include "nn_theme.h"   /* -DNN_THEME_LIGHT for the light theme */

lv_obj_set_style_bg_color(btn, lv_color_hex(NN_TK_BUTTON_PRIMARY_BG), 0);
lv_obj_set_style_radius(btn, NN_TK_BUTTON_RADIUS, 0);
lv_obj_set_height(btn, NN_TK_BUTTON_HEIGHT_MD);
```

## Open decisions (playbook §18)

- Target panel: 7" 1024x600 assumed; 4.3" would need a `modes/embedded-4.3in.json`.
- Final font (Inter is a placeholder; must cover Vietnamese and allow embedding).
- Icon style: Material Symbols Rounded used for now.

## License

[MIT](LICENSE)

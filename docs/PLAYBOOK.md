# NamNam Design System: Playbook

> **NamNam** is the name of the design system (code prefix `nn`); **Calm Control** is the name of the design philosophy (§1).
> Design language and process for IoT products (embedded LVGL + web app + backend), so that every screen,
> on every platform, looks and behaves like **one unified operating system**, not a collection of disconnected screens.
> This is also the foundation document for **building the design team** (people + AI agents).

- Version: 0.4 (English translation; UI copy localized: en default, vi at launch). v0.3 added §16.6–§16.19: workflow by request type
- Last updated: 2026-11-15 (v0.1: 2026-11-13)
- Location: `docs/PLAYBOOK.md` in the NamNam repo (this is the only copy; all paths in this file are relative to the repo root)
- For AI agents: read `AGENTS.md` at the repo root first; read this file section by section as needed
- Owner: Nam
- Status: **philosophy + methodology decided**; waiting on the target display (§13) to fill in final numbers

---

## 0. How to use this file

1. This file is the **single source of truth** for the design language. Tokens, code and Figma must all point back here.
2. Lower layers are decided first, upper layers later: Philosophy → Tokens → States → Icons/Widgets → Modules → Screens.
3. Every decision must be a **number or a checkable rule**, never "whatever feels right".
4. Tick a checkbox `[ ]` only when there is a decision **and** an owner; record it in the Decision log (§19).
5. When going deep with the team/Claude: copy the relevant section into the chat instead of re-discussing from scratch.
6. **New request (bug fix, widget, screen, feature...) → start at §16.6: classify first, then follow the workflow for that type.**

---

## 1. Philosophy: "Calm Control"

### 1.1 Positioning

> The product is an **IoT control system** for **operators / technicians / end users**,
> and using it must feel like **a professional measuring instrument with the finish of a premium product**:
> calm, clear, instantly responsive, trustworthy.

- [ ] Adjust the positioning statement for the specific customer / domain (BMS, HVAC, factory, smart home...)

### 1.2 Four principles

| # | Principle | In practice | Forbidden |
|---|---|---|---|
| 1 | **State is always clear** | Every device is readable at a glance: on/off, sending command, error, offline | State shown by color alone |
| 2 | **Instant feedback** | Touch down → visual feedback < 50ms; never wait for the network before updating the UI | UI "frozen" while waiting for the device |
| 3 | **Color has meaning** | Neutral background; accent for the primary action; red/yellow only for abnormal conditions | Decorative color, gratuitous gradients |
| 4 | **One geometric rule** | All spacing, radius and stroke come from one scale | Arbitrary values (13px, 7px...) |

### 1.3 What we do NOT want

- Not like an AI template (purple-blue gradients, rounded cards everywhere, icons mixed from several sets)
- Not "default Material", no 1:1 copy of iOS/Windows
- No blur/glass, no large shadows (expensive on an MCU, and not used on web either; see §12)
- No attention-grabbing animation, no blinking (except controlled critical alarms)

---

## 2. Reference sources (decided)

**Formula: ISA-101 as the backbone + Apple HIG for refinement + our own geometric identity.**

| Source | What we take | What we don't take |
|---|---|---|
| **ISA-101 High-Performance HMI** | Neutral background, color only for abnormal conditions, fast-to-read state | The "old" gray look of legacy HMIs |
| **Siemens iX** (open-source, industrial) | Device state, alarm and operations dashboard patterns | Siemens brand identity |
| **Material 3** | **State layer model** (pressed/disabled/selected via opacity overlay), tonal palettes | Default "Material look" |
| **IBM Carbon** | Token structure, how to write component docs | Desktop density too high for small screens |
| **Apple HIG** | Type hierarchy, whitespace, meaningful motion | Liquid Glass / blur; SF Pro font, SF Symbols (license limits) |
| **Material Symbols** (Google) | Starter icon set, Fill/Weight axes (§7) | Dynamic color, ripple, Android look |
| **Nothing OS** (as a method reference) | Building identity from just a few geometric rules | Copying the original dot-matrix |

Theoretical foundation: Dieter Rams' 10 principles ("less, but better"), Swiss grid, Fitts / Hick / Gestalt laws.

---

## 3. Organizing methodology

### 3.1 Method stack

| Layer | Method | Solves |
|---|---|---|
| UX process | **Double Diamond** | Get the problem right before getting the solution right |
| Structure | **Tokens – Widgets – Modules – Screens** (Atomic Design spirit) | Build small to large, boundaries by responsibility |
| Source of truth | **Token-first**: 3 tiers + modes, DTCG standard | One place for every number |
| Naming | **BEM** (Modifier separate from State) | Designers, web devs and embedded devs use the same names |
| Data | **OOUX** from the device data contract | Same data fields on every platform |
| Behavior | **Statechart** for every interactive widget/module | One diagram = design spec + dev logic + QA test cases |
| Documentation | **Docs-as-code** | Specs live next to code, versioned, readable by agents |
| Quality | **Automated audit + specimen + visual regression** | Machines catch deviations from the standard |
| Governance | **Design system as a product**: semver, changelog, RFC | Nobody invents their own components |

### 3.2 Four layers and their boundaries

Keep the **mindset** of Atomic Design (build bottom-up, upper layers only compose lower layers), **drop the names** atoms/molecules/organisms.

| Layer | Contains | May know | **Must not** | Atomic equivalent |
|---|---|---|---|---|
| **Tokens** | Color, spacing, radius, stroke, font, motion | Only numbers | Contain logic | (none) |
| **Widgets** | Button, toggle, slider, card, list item, icon | Tokens + props passed in | Know about devices, network, MQTT | Atoms + Molecules |
| **Modules** | HvacPanel, RelayGroup, AlarmCenter | Widgets + device data + statechart | Set their own colors/sizes | Organisms |
| **Screens** | Compose modules into a screen | Layout, navigation | Contain control logic | Templates + Pages |

**Golden rule: Widgets are "dumb", Modules are "smart".** If a widget needs splitting → use a BEM element, don't create a new layer.

### 3.3 Name & prefix architecture

The root name **NamNam** is neutral (no hardware, product type or customer in it), so it can be used for any future product.
Every extension gets a child name following a fixed rule:

```
NamNam                        ← design system (code prefix: nn)
│   Philosophy: "Calm Control" ← principles (§1), not the system name
├── NamNam Tokens             ← Tokens layer
├── NamNam Icons              ← icon set (§7)
├── NamNam Widgets            ← Widgets layer
├── NamNam Patterns           ← alarms, connectivity, empty, loading...
├── NamNam Shell              ← "OS" layer: status bar, navigation, control center, notifications
├── Platform adapters: NamNam for LVGL · NamNam for Web · (NamNam for Flutter...)
├── Themes: Dark / Light · per-customer theme (white-label) if needed
└── Generations: NamNam 1, NamNam 2  ← on major visual language changes
```

| Where | Rule | Example |
|---|---|---|
| CSS variable (token) | `--nn-<token>` | `--nn-bg-canvas`, `--nn-button-height-md` |
| Component-internal CSS variable | `--_<name>` (not exported) | `--_bg`, `--_height` |
| CSS class (BEM) | `nn-<block>[__element][--modifier]` | `.nn-button--danger`, `.nn-device-card__status` |
| Keyframes / global CSS names | `nn-<name>` | `nn-spin` |
| C macro (token) | `NN_TK_<TOKEN>` | `NN_TK_BG_CANVAS` |
| C header | `nn_theme.h`, `nn_theme_<theme>_<panel>.h` | `nn_theme_dark_7in.h` |
| C config macro | `NN_<NAME>` | `NN_THEME_LIGHT`, `NN_PLATFORM_7IN` |
| C function (LVGL widget) | `nn_<block>_<action>` | `nn_button_create()`, `nn_toggle_set_pending()` |
| JS library | `NN.<widget>()` | `NN.toggle({...})` |
| Package (when split out) | `@namnam/<part>` | `@namnam/tokens`, `@namnam/web` |

The prefix lives in **one place**: `SYSTEM` in `tools/tokens-build/build.mjs`.
Public token names (`button.height.md`) carry no prefix; the prefix is only added when generating code.

---

## 4. Design Tokens

### 4.1 Three tiers + modes

```
Primitive  →  Semantic  →  Component
(raw value)   (role)        (local decision)
        ▲ modes layered over Semantic/Component:
          theme:    dark | light
          platform: web | embedded-7in | embedded-4.3in
```

| Tier | Example | Who may use it |
|---|---|---|
| Primitive | `color.gray.900 = #121417`, `color.red.500 = #EF4444`, `size.12 = 12px` | **Only** referenced by semantic/component tokens; code does not use them |
| Semantic | `bg.surface.card = {color.gray.900}`, `status.critical = {color.red.500}` | Web + embedded code |
| Component | `component.card.padding = {space.md}` | That widget's code |

Rules:
- Code **uses only semantic/component tokens**. No raw hex, no raw px in UI code.
- Platform differences are handled by **modes**; do not create a separate "platform" tier:
  `component.card.padding`: web = 24 | embedded-7in = 16 | embedded-4.3in = 12
- Padding/spacing may shrink per mode; **touch targets must not shrink** (computed in mm, §5).
- Name by role, not by value (`text.primary`, not `gray-900-text`).

### 4.2 Format (DTCG)

```json
{
  "color": {
    "gray": {
      "50":  { "$type": "color", "$value": "#F7F8F9" },
      "900": { "$type": "color", "$value": "#121417" }
    },
    "red":  { "500": { "$type": "color", "$value": "#EF4444" } }
  },
  "bg": {
    "surface": {
      "card": { "$type": "color", "$value": "{color.gray.900}" }
    }
  },
  "status": {
    "critical": { "$type": "color", "$value": "{color.red.500}" }
  }
}
```

- Design colors in OKLCH (perceptually even lightness), store/export as sRGB hex so every tool can read them.
- Files are split by tier and mode:

```
tokens/
  primitive.json
  semantic/  dark.json  light.json
  component/ *.json
  modes/     web.json  embedded-7in.json  embedded-4.3in.json
```

### 4.3 Pipeline

```
tokens/*.json (repo — primary source)
   │
   └── tools/tokens-build/build.mjs  (zero dependencies; `npm run tokens`)
         ├──► web:      build/web/tokens.css (--nn-* custom properties per theme x platform), tokens.js
         ├──► embedded: build/embedded/nn_theme.h + nn_theme_<theme>_<panel>.h
         │              (LVGL hex/RGB565 colors, px per mode, lv_opa_t, font macros, lv_anim paths)
         └──► build/audit.md (contrast report; `npm run tokens:check` fails the build on a miss)
```

- The build is in-house on purpose (small, no dependencies). Style Dictionary remains an option if more output formats are needed.

- The LVGL transform **must be written in-house** (RGB565, px per mode, fonts, `lv_anim` paths). Nothing off the shelf.
- Never hand-edit generated files. Change a token → run the pipeline → commit both.

### 4.4 Figma (currently on the free plan)

- **The repo `tokens/` is the primary source; Figma follows** (the free plan limits Variables modes and MCP calls).
- **Figma is generated, not hand-synced**: the NamNam Figma plugin (`tools/figma-plugin/`, built to `build/figma/`)
  creates or updates the Variables (collections NN · Primitives / Base / Theme / Platform / Components, aliases kept,
  WEB code syntax `var(--nn-*)`, primitives hidden) and regenerates the "NamNam · Foundations" page.
  Change tokens → `npm run tokens` → run the plugin again. Never edit the generated variables by hand.
  If the plan limits modes, the plugin splits Theme/Platform into one collection per mode.
  `npm run test:figma` runs the plugin against a fake Figma API in CI. Phase 2 (planned): components from `<block>.spec.json`.
- Designers change tokens via PR into `tokens/`, then re-run the plugin.
- Screen handoff to devs/agents: **PNG at native resolution (1x) + short notes** (sizes, spacing, touch behavior).
- Figma MCP: only for complex screens that need exact measurements (the free plan has only a few calls per month).
- When upgrading to paid Figma: Figma Variables + Tokens Studio can become the source, with two-way sync to the repo.

### 4.5 Versioning

- [ ] Tokens follow **semver**: rename/remove a token = major; add = minor; change a value = patch
- [ ] `tokens/CHANGELOG.md` for every release

---

## 5. Technical standards (decided numbers)

Physical unit conversion: **px = mm × DPI / 25.4**
Example: a 7" 1024×600 display ≈ 170 DPI; a 4.3" 480×272 display ≈ 128 DPI (to be confirmed against the actual panel).

| Item | Rule | Starting value (7" ~170 DPI) | Status |
|---|---|---|---|
| Grid | Multiples of 4, layout in multiples of 8 | 4 / 8 / 12 / 16 / 24 / 32 / 48 | [ ] |
| Touch target | ≥ 9mm (recommended), minimum 7mm | ≥ 60px (minimum 48px) | [ ] |
| Font size | 1.25 ratio scale, max 6 sizes | 16 / 20 / 24 / 30 / 38 / 48 | [ ] test on board |
| Font | One family, full Vietnamese diacritics coverage (localized UI, see below), subset for LVGL | <choose font> | [ ] |
| Radius | Fixed scale | sm 8 / md 12 / lg 20 / pill | [ ] |
| Nested radius | **outer radius = inner radius + padding** | card 20, padding 8 → button 12 | [ ] |
| Border | Hairline; prefer separating areas with background | 1px | [ ] |
| Icon stroke | ≈ text stroke weight at the same size | 2px @24; 2.5–3px @32–48 | [ ] |
| Depth | No shadows; use layered backgrounds + borders | surface-0 / 1 / 2 + 1px | [ ] |
| Color | 1 neutral ramp + 1 accent + 4 status (success/warning/critical/info) | — | [ ] |
| Theme | Dark + light built from the start (separate mappings, no auto-invert) | — | [ ] |
| Contrast | WCAG 2.2 AA, measured with a tool | text ≥ 4.5:1, UI ≥ 3:1 | [ ] |
| Motion | See §10 | 100 / 150 / 200 / 300ms | [ ] |
| Reduced motion | Mandatory | opacity/instant fallback | [ ] |

Localization: product UI copy is localized; launch locales are English (default) and Vietnamese. Specimens use English sample copy plus Vietnamese stress cases (diacritics, longest strings). Numbers and units are formatted per locale (`Intl.NumberFormat` on web, the equivalent in firmware); never hard-code decimal separators.

---

## 6. State model (applies to EVERY widget)

### 6.1 Interaction states

| State | Visual rule | Behavior | Web | Embedded |
|---|---|---|---|---|
| Default | Per component tokens | | ✓ | ✓ |
| Hover | State layer 8% | Only with a mouse | ✓ | ✗ |
| **Pressed** | State layer **12%** (the component's "on" color) | Shown on **touch down**, action on **release** | ✓ | ✓ |
| Focused | 2px ring, 2px offset | Required if there is a keyboard / rotary encoder | ✓ | if physical input exists |
| Selected / On | Accent background, on-accent text; **filled** icon | | ✓ | ✓ |
| **Disabled** | Content at **38%** opacity, no touch response | Still readable (≥ 3:1), with a reason if needed | ✓ | ✓ |
| **Loading** | **Keep the same size**, spinner replaces the label | Blocks repeat taps | ✓ | ✓ |
| **Error** | Critical border + icon + descriptive text | Never color alone | ✓ | ✓ |

LVGL: use the built-in states (`LV_STATE_PRESSED`, `LV_STATE_DISABLED`, `LV_STATE_CHECKED`, `LV_STATE_FOCUSED`).

### 6.2 IoT device state (desired vs reported)

The **desired** state (what the user just tapped) and the **actual** state (what the device reports) are always kept separate.

```
        tap
 off ────────► pending ──ack────────► on
  ▲              │
  │              ├── timeout / error ──► off + short error toast
  │              │
  └──────────────┘
 * ──device offline──► disabled + label "Offline"
 * ──device online───► back to reported state
```

- Pending: switch immediately to the new state in an "in progress" form (e.g. "Turning on…") + a small indicator; default timeout: [ ] <decide, e.g. 5s>.
- Every module that controls a device **must** include this statechart in its spec.

---

## 7. Icon system

### 7.1 Geometric rules

- 24×24 grid; keylines: circle 20, square 18, rectangle 20×16.
- Even stroke (per §5), 2px corners, round caps, prefer 90° and 45° angles.
- **Outline = default; Filled = on/active.** This is a meaningful rule, not decoration.
- One single set: bootstrap from **one** open-source set, then adjust to the rules. No mixing sets.

**Proposed starter set: Material Symbols (Google)**

| Criterion | Why |
|---|---|
| Built-in **Fill** axis (0 ↔ 1) | Matches the rule outline = default, filled = active exactly |
| **Weight** axis | Tune stroke weight to match §5 (e.g. heavier strokes on 32–48 icons on low-DPI displays) |
| **Grade** + **Optical size** (20–48) axes | Fine-tune visual weight by size and by dark/light background |
| Large library | Many device, system and IoT icons available |
| Open license (Apache 2.0) | Usable in commercial products — [ ] re-confirm the license before release |

- Choose **one style** only: [ ] Outlined / [ ] Rounded / [ ] Sharp. Suggestion: Rounded (soft, fits "Calm"), or Sharp for a more technical feel.
- Decide **one parameter set** for the whole system: Weight = [ ] (e.g. 400 @24, 500 @32–48), Grade = [ ] (e.g. 0 on light, −25 on dark), Optical size = per display size.
- **LVGL does not use variable axes at runtime** → pre-export each variant (outline/filled × each size) as static SVG, then build bitmap/font.
- Missing domain icons → draw them on **the same grid + parameters** as Material Symbols so the set stays consistent.
- Fallback if the look doesn't fit: Lucide / Phosphor / Tabler (also open license, but no Fill axis).

### 7.2 Source and output

```
icons/src/*.svg (source, viewBox 24, SVGO-optimized)
   ├──► web:      SVG sprite / component
   └──► embedded: icon font (lv_font_conv) or bitmap per size 24 / 32 / 48
```

- LVGL icon fonts are **bitmaps at fixed sizes** → each size costs its own flash; only generate sizes actually used.
- Naming: `<category>/<name>[-<variant>]` (e.g. `system/wifi-off`, `device/fan-filled`).

### 7.3 Starter set (~20 icons)

| Group | Icons | Status |
|---|---|---|
| Navigation | back, home, menu, close | [ ] |
| System | wifi (3 levels + off), power, settings, cloud-off | [ ] |
| Status | success, warning, critical, info | [ ] |
| Action | add, edit, delete, refresh | [ ] |
| Domain | <project devices: fan, relay, thermostat, sensor...> | [ ] |

---

## 8. Widget & Module spec

### 8.1 Template (one `*.spec.md` file per widget/module, next to the code)

**Widgets use a machine-readable spec: `design/specimen/components/<block>.spec.json`.** It is the single description of a
widget (block, elements, modifiers, defaults, state hooks, token prefixes, behavior, a11y, LVGL notes) and is consumed by
the design lint (cross-checked against the CSS), and later by the LVGL implementation and the Figma generator.
Change the spec and the CSS in the same commit; `npm run lint` fails when they disagree.
The prose template below is still the checklist of what a spec must cover, and is used as-is for modules.

```md
### <Name>  (BEM block: <block-name>)

Layer: Widget | Module
Purpose: <one sentence>
Anatomy (BEM elements): <block>__<element>, ...
Modifiers (static variants): <--variant / --size>
States: per §6.1 (+ statechart §6.2 if it is a device-control module)
Props / Data: <name, type, default>  (module: map to fields in the data contract)
Behavior: <tap, long-press 500ms, loading blocks tap, keyboard/encoder>
Tokens: <bg, fg, border, radius, padding, motion>
Content rules: <length, casing, localized copy (en default, vi), longest string + Vietnamese diacritics stress case, locale number/unit format>
Accessibility: <hit area, contrast, focus order, label>
Edge cases: <long text, empty value, offline, error>
Platform notes: <web vs embedded>
Specimen: <link to screenshots of every modifier × state>
```

### 8.2 Example: Button (Widget)

```md
### Button  (BEM: button)

Layer: Widget
Purpose: primary/secondary action within an area.
Anatomy: button__label, button__icon (optional)
Modifiers: --primary | --secondary | --ghost | --danger ; --sm | --md | --lg
States: default / pressed / focused / disabled / loading (+ hover on web)
Behavior: feedback on touch down, action on release; loading keeps the same width
Tokens: component.button.bg = {accent}, .fg = {on-accent}, .radius = {radius.md}
Content: sentence case, max 2 lines; icon-only requires an a11y label
Accessibility: touch target ≥ 60px (7"), disabled still ≥ 3:1
```

### 8.3 Example: DeviceCard (Widget) and HvacPanel (Module)

- `device-card`: elements `__icon`, `__title`, `__value`, `__status`, `__control`; modifiers `--compact | --regular`.
  A card is **either fully tappable or not at all**. Abnormal conditions only change `__status` / the icon, never the color of the whole card.
- `hvac-panel` (module): composes `device-card` + `slider` + `toggle`; data: current temperature, setpoint,
  fan mode (per the data contract, **identical on web and embedded**); has the §6.2 statechart.

### 8.4 Minimum list

Widgets (web specimen in `design/specimen/`; no LVGL version yet, not yet reviewed on board):
- [~] Button / IconButton: specimen done (2026-11-15)
- [~] Toggle: specimen done; Checkbox / Radio not started
- [~] Slider + Setpoint: specimen done; Arc not started
- [~] ListItem + List header: specimen done
- [~] DeviceCard: specimen done; StatTile not started
- [ ] Tabs / SegmentedControl
- [ ] Input / Select (if data entry is needed)
- [ ] Progress / Spinner / Skeleton
- [ ] Badge / StatusDot

Modules / Patterns:
- [ ] AppShell (status bar: time, Wi-Fi, alarms; navigation)
- [ ] Sheet / Dialog
- [ ] Toast / Banner / AlarmDialog (§9)
- [ ] ConnectionState (online / reconnecting / offline / OTA)
- [ ] EmptyState / ErrorState
- [ ] QuickSettings / ControlCenter
- [ ] Domain modules: <HvacPanel, RelayGroup, ...>

---

## 9. Event & alarm patterns

| Level | Form | Dismissed when | Sound/vibration |
|---|---|---|---|
| Info | Toast 3s | Auto-dismisses | No |
| Warning | Persistent banner at the top | The issue is resolved | Optional |
| Critical | Screen-blocking dialog + **requires acknowledgment** | User acknowledges | Yes (buzzer if available) |

- Every alarm: **icon + color + text** + timestamp; stored in the event history.
- Several alarms at once: sort by level → time; never stack dialogs.
- Connection state (Wi-Fi via ESP-Hosted can drop) is its own pattern: indicator in the status bar + affected modules switch to disabled.

---

## 10. Motion

### 10.1 Personality: **Snappy** (100–200ms, little spring) — suits control UIs and saves CPU.

### 10.2 Tokens

| Type | Duration | Easing (web) | LVGL path | Used for |
|---|---|---|---|---|
| Micro | 100ms | ease-out | `lv_anim_path_ease_out` | press, toggle |
| Enter | 200ms | cubic-bezier(.2,.8,.2,1) | `lv_anim_path_ease_out` | sheet, dialog |
| Exit | 150ms | cubic-bezier(.4,0,1,1) | `lv_anim_path_ease_in` | close, dismiss |
| Emphasis | 300ms | gentle spring | `lv_anim_path_overshoot` (sparingly) | screen transitions |
| Ambient | 1–2s loop | linear | `lv_anim_path_linear` | spinner |

- LVGL **has no physics spring** → map to path + duration as in the table above.
- Animate only position/opacity; avoid animating size/layout on embedded.
- Exit is 20–30% faster than enter; never let 2 animations compete for the same area.
- [ ] Measure real FPS on the board for 5 flows: open screen, switch tab, open sheet, toggle, alarm.

---

## 11. Naming conventions (adapted BEM)

### 11.1 Rules

1. **Block** is named by function (`device-card`), not by appearance (`blue-box`).
2. **Only one element level** (`card__title`, not `card__header__title`); need deeper → split into a widget.
3. **Modifier = static variant** chosen at design time (`--primary`, `--compact`, `--lg`).
4. **State is NOT in the name** (no `button--pressed`, `card--offline`); state is governed by §6.
5. **Modules** are named by domain (`hvac-panel`, `relay-group`, `alarm-center`).
6. **Every exported name carries the `nn` prefix** (§3.3). Specs and Figma use unprefixed names (`device-card`); generated/hand-written code always has the prefix.

### 11.2 Mapping table (one name, consistent everywhere)

| Part | Figma | Spec / token | Web | LVGL (C) |
|---|---|---|---|---|
| Block | `DeviceCard` | `device-card` | `.nn-device-card` / `NN.deviceCard()` | `nn_device_card_create()` |
| Element | `DeviceCard/Title` | `device-card__title` | `.nn-device-card__title` | `nn_device_card_title` (part pointer) |
| Modifier | property `Size=Compact` | `device-card--compact` | `.nn-device-card--compact` | `NN_DEVICE_CARD_SIZE_COMPACT` |
| State | property `State=Pressed` | (per §6) | `:active` / `[data-state]` / `aria-*` | `LV_STATE_PRESSED` |
| Token | variable `device-card/padding` | `component.device-card.padding` | `--nn-device-card-padding` | `NN_TK_DEVICE_CARD_PADDING` |

---

## 12. Web vs Embedded: "Embedded-first, web enhanced in a controlled way"

**Strictly shared:** tokens (differing via modes), visual language (flat + 1px borders), icons, BEM names,
data model (OOUX), state model + statecharts, alarm patterns.

**Allowed to differ:**
- Web has **hover** and keyboard focus; embedded has no hover.
- Web has large screens → different layout/density (e.g. bento grid); embedded 4.3" uses lists or one card per page.
- Web may have smoother motion, but with **the same personality** (§10).

Goal: a user moving from the control panel to a laptop sees **the same product**, not a pixel-identical copy.

---

## 13. Embedded constraints (Hardware budget)

| Item | Value | Status |
|---|---|---|
| SoC / module | ESP32-P4 + ESP32-C5 (e.g. Wireless-Tag WT01P4C5-S1-N16R32) | [ ] decide |
| Display | [ ] 4.3" 480×272 / [ ] 7" 1024×600 / other | [ ] **decide — blocks §5** |
| Actual DPI | <compute from panel> | [ ] |
| Touch | <capacitive / resistive, gloves?> | [ ] |
| Physical input | <none / rotary encoder / keys> | [ ] |
| Environment | <indoor / outdoor / dark control room> → decides default dark/light | [ ] |
| Flash for UI (fonts + icons + images) | <MB> | [ ] |
| PSRAM for frame buffer | <1 or 2 buffers, MB> | [ ] |
| Target FPS | <30 / 60> | [ ] |
| Vietnamese font | glyph subset with diacritics, only sizes actually used | [ ] |
| LVGL version / ESP-IDF version | <e.g. LVGL 9.x / IDF ≥ 5.5.3 for P4 rev v3.x> | [ ] |

---

## 14. Repo structure

```
design/
  DESIGN.md                ← condensed version of this playbook
  decisions/               ← ADRs / detailed decision log
  requests/                ← brief per request: <YYYY-MM-DD>-<slug>.md (§16.18)
  rfcs/                    ← RFCs for new widgets / patterns or breaking changes
  features/                ← <feature>.spec.md: flow, data contract, statechart
  screens/                 ← <screen>.spec.md + <screen>.html (compose widgets only, layout CSS only)
  specimen/                ← specimen page per layer/widget (exists)
    components/            ← <widget>.css (BEM nn-, var(--nn-…) only) + widgets.js (NN.* factories)
tokens/                    ← source of truth (§4)
  primitive.json  base.json  semantic/  component/  modes/  CHANGELOG.md
build/                     ← GENERATED, do not hand-edit: web/tokens.css|js, embedded/nn_theme*.h, audit.md
icons/
  src/*.svg   build/        ← generated for web + LVGL
tools/
  tokens-build/build.mjs   ← dependency-free build (DTCG → CSS/JS/LVGL + audit); may move to Style Dictionary later
  design-lint/lint.mjs     ← static design lint (§15.1)
  design-lint/browser-audit.mjs ← geometry audit of every specimen via DS.audit() (§15.1)
ui-embedded/               ← LVGL
  theme/                   ← generated from tokens, DO NOT hand-edit
  widgets/<name>/          <name>.c  <name>.h  <name>.spec.md
  modules/<name>/          <name>.c  <name>.h  <name>.spec.md (with statechart)
  screens/
  mock/                    ← fake device data for demo/PoC
  specimen/                ← screen showing every widget × modifier × state
  sim/                     ← PC simulator build (SDL)
ui-web/
  tokens.css  components/  (same BEM names)
```

---

## 15. Quality: automated audit & Definition of Done

### 15.1 Audit rules (design-lint, runs in CI)

`[x]` = enforced automatically. Commands: `npm run check` (token build + contrast + static lint), `npm run test:browser`
(geometry audit of every specimen in 2 themes x 2 platforms x 2 locales), `npm run verify` (both). CI: `.github/workflows/check.yml`.

- [x] No raw hex / px / ms / em in widget CSS (`lint: raw-value`). LVGL and web-app code are not covered yet.
- [x] Every `var(--nn-*)` in `design/` exists in the built tokens (`lint: token-ref`)
- [x] BEM with the `nn-` prefix; no state words in class names (`lint: naming`)
- [ ] Radius only from the §5 scale; check the concentric radius rule
- [x] Touch targets ≥ the mode's threshold (`test:browser: hit-area`)
- [x] Text/background color pairs meet AA (automated in `build.mjs`; `npm run tokens:check` exits with an error on failure)
- [x] Every widget has a `<block>.spec.json` that matches its CSS, tokens, factory and specimen (`lint: spec`)
- [ ] Every device-control module has a statechart
- [x] **No overflow**: the visible part of a control stays inside its container's padding box; only the extra touch area (hit-area − visible size) may extend into the padding. The overflow amount is computed from tokens, never hard-coded. *(Learned from the 2026-11-15 bug: toggle overflowed the device-card border.)* (`test:browser: containment`)
- [x] **No line-height bump**: smaller inline text (units, badges) must not increase the height of its line (`line-height: 1`). *(Bug 2026-11-15: value rows misaligned between cards with/without a unit; the audit then found the same bug in Setpoint.)* (`test:browser: line-box`)
- [x] Docs and code are English; Vietnamese only in locale catalogs (`lint: english`)
- [x] **Contrast is audited as composited**: pressed state layers under text, disabled content on the surface it sits on, status colors used as text at 4.5:1, indicators against their real neighbour (`AUDIT` in `build.mjs`). A new color role used as text or as an indicator gets an audit pair in the same commit.
- [x] A widget's CSS never uses another widget's component tokens (`lint: layering`); hover / pressed / focused each have a forced `[data-state]` hook (`lint: spec`)
- [x] Every theme file and every platform mode file define the same token names; no two tokens export under the same name (`build.mjs`)
- [ ] **Screens are layout only**: CSS in `screens/` may only use grid/flex/gap/area sizes via tokens; no colors, borders, radii or custom states.
- [ ] **All screen states**: every screen has loading / empty / error / offline (+ long-running operation if any)
- [ ] **Longest localized string** (Vietnamese stress cases: diacritics, longest strings) does not break the layout (truncate with "…" or wrap per spec); numbers/units are formatted per locale, with no hard-coded decimal separators

### 15.2 Visual regression

- Specimen runs on the PC simulator → screenshot → compare against approved baseline → report differences.
- Web: same approach with Playwright.

### 15.3 Definition of Done for a widget/module

1. Complete spec per the §8.1 template
2. Code uses tokens only
3. In the specimen with **every modifier × every state**
4. Audit green, visual regression approved
5. Reviewed on the **real board** (color, touch, FPS)
6. Designer approval + changelog entry

---

## 16. Design team (people + AI agents)

### 16.1 Human roles

| Role | Responsibilities | PoC phase |
|---|---|---|
| **Design lead** | Guards the philosophy, final approval, owns tokens + playbook | Nam / lead designer |
| **Product designer** | Flows, screens, Figma, specs | 1 person (may double as design lead) |
| **Design engineer (embedded UI)** | LVGL widgets/modules, token pipeline, specimen | 1 embedded dev |
| **Web UI dev** | Web components with the same BEM names | when web work starts |
| **QA / reviewer** | Tests on the real board, approves visual regression | part-time |

### 16.2 AI agents

| Agent | Owns | Output | Reviewer |
|---|---|---|---|
| Token agent | `tokens/`, `tools/tokens-build/` | tokens + `nn_theme.h` + `tokens.css` | Design lead |
| Icon agent | `icons/` | SVGs per the rules, web + LVGL builds, preview page | Designer |
| Widget agent | `ui-embedded/widgets/`, `ui-web/components/` | spec + code + specimen | Design engineer |
| Module agent | `ui-embedded/modules/` | spec + statechart + code + mock | Design engineer |
| Audit agent | `tools/design-lint/` | violation report, image diffs | Design lead |

Rules for agents:
- Each agent **only edits its own directories**; token/data contract changes must go through the design lead.
- Agents read the specs in the repo (docs-as-code); they do not guess from images when a spec exists.
- Pin versions (LVGL, ESP-IDF) in the agent definition to avoid invented APIs.
- Skills that may be used (re-check against the installed version): `ecc:design-system`, `make-interfaces-feel-better`, `accessibility`.

### 16.3 RACI

| Activity | Design lead | Designer | Design engineer | Agent |
|---|---|---|---|---|
| Philosophy / playbook | A/R | C | C | — |
| Tokens | A | R | C | R (code generation) |
| Icons | A | R | C | R (build) |
| Widget/module spec | A | R | C | support |
| Implement | C | C | A | R |
| Audit / visual regression | A | C | R | R |
| Review on real board | A | R | R | — |

R = responsible (does the work), A = accountable (final say), C = consulted.

### 16.4 Workflow for one widget/module

Summary (details per request type in §16.6–§16.19):

```
Short RFC (what is needed, why) → design lead approves
→ designer: Figma + spec.md (BEM, states, tokens)
→ agent/dev: tokens + CSS + specimen (+ statechart if it is a module)
→ strict build + audit + visual regression
→ review on the real board
→ design lead approves → merge → changelog
```

### 16.5 Cadence

- **Daily, 15 minutes:** simulator next to Figma, note deviations.
- **Weekly:** review on the real board; update the decision log.
- **Every token / name / data contract change:** via PR reviewed by the design lead.

### 16.6 Intake & request classification (mandatory, do this first)

Every request goes through **one entry point**: create `design/requests/<YYYY-MM-DD>-<slug>.md` using the brief template in §16.18.
The first step is always **classification**: the type determines the workflow, the number of review gates and the version bump.

| Type | Example | Workflow | Review gates | Version |
|---|---|---|---|---|
| **A. Design bug fix** | Toggle overflows the card, misaligned value row | §16.7 | 1 (after fix) | patch |
| **B. Token change** | Change the accent color, increase body font size | §16.8 | 1 | patch / minor / major |
| **C. Add icon** | "Air purifier" icon | §16.9 | 1 | minor |
| **D. Modify existing widget** | Add size `xl` to Button, add a state | §16.10 | 2 | minor (breaking = major) |
| **E. New widget** | ProgressBar, Dialog, RadioList | §16.11 | 2 | minor |
| **F. New pattern / module** | Toast/Banner/Alarm, ConnectionState | §16.12 | 2 (+3 if it touches devices) | minor |
| **G. New screen** | Settings screen | §16.13 | 1 → 2 → 3 | minor |
| **H. New feature** | On/off schedules, OTA firmware update | §16.14 | 1 → 2 → 3 → 4 | minor |
| **I. New platform / mode** | 4.3" 480×272 display, mobile web | §16.15 | 2 + 3 | minor |
| **J. Removal / deprecation** | Drop `button--ghost` | §16.16 | 1 | major |

**5 classification questions** (answer them in the brief):

1. Does it change **token values or names**? → if yes, B; renaming/removing also adds J.
2. Does it need a **widget that does not exist yet**? → do E/F **first**; never improvise one inside a screen.
3. Does it change **device data / the backend contract**? → it is H; tech lead/firmware/backend must be involved from gate 1.
4. How **many screens / platforms** are affected? → ≥ 2 requires an impact analysis.
5. Is there **safety risk / irreversibility** (device control, reset, OTA, data deletion)? → statechart + confirmation dialog + approval by the design lead **and** the tech lead are mandatory.

**Size** (record in the brief for planning):

| Size | Time | Approach |
|---|---|---|
| S | ≤ 2 hours | One PR, one gate |
| M | ≤ 2 days | Full workflow for the type |
| L | > 2 days | Split into batches; independent batches go to several agents in parallel |

A request is often a **combination of types** (e.g. Settings screen = G + 4×E + 1×F). Always work **bottom-up**: B/C → D/E → F → G → H.

### 16.7 A. Design bug fix

1. **Reproduce**: screenshot + theme + platform + frame size + page/screen.
2. **Find the root cause**, don't patch the symptom. Ask: wrong token? wrong layout formula? missing rule?
   *Real example:* the toggle overflowed the card because of a hard-coded 16px negative margin, while the horizontal touch area had **no slack**. The correct fix is to compute the overflow from tokens `(hit-area − width) / 2`, not to change 16 to 8.
3. **Fix at the lowest layer that has the bug**: token > widget CSS > screen layout.
4. **Re-measure with a script** everywhere the widget is used (specimen + screens + 7" frame), across both themes × platforms.
5. **Turn the bug into a rule**: if it can recur, add it to §15.1 (and to the automated audit when possible).
6. Changelog (patch). Record the "root cause" in one line.

### 16.8 B. Token change

1. **Pick the right tier**, change the **narrowest** tier that achieves the goal:

   | Want to | Change in |
   |---|---|
   | Change the brand color | primitive |
   | Change a role (e.g. accent uses a different blue) | semantic (`semantic/<theme>.json`) |
   | Change only one widget | component (`component/<widget>.json`) |
   | Change only one platform | mode (`modes/<platform>.json`) |

2. `npm run tokens:check`: the contrast audit **must pass**. If it fails, adjust again; do not lower the threshold.
3. **Impact analysis**: search for the variable names (`--nn-x-y`, `NN_TK_X_Y`) in `design/` and the LVGL code; open every affected specimen in both themes × platforms.
4. **Compare before/after images** (visual regression).
5. **Version**: value change = patch; new token = minor; rename/remove = major with an old → new name table.
6. Update Figma Variables to match (the repo is the source, §4.4).

Rule: **do not add a token for a single use** in one screen. Use an existing token, or explain in the PR why a new token is needed.

### 16.9 C. Add icon

1. Look in **Material Symbols** first, in the chosen style and parameter set (§7).
2. If it's not there, **draw it on the 24 grid** + keylines, same weight/grade; both outline and filled versions are required.
3. Name it `<category>/<name>`; add it to the foundations page (Icons section).
4. **View it at real sizes** 24/32/40 on the board: thin strokes get lost on low-DPI displays.
5. Build LVGL bitmap/font **only for sizes actually used** (flash budget §13).

### 16.10 D. Modify existing widget

1. **Short RFC** (template §16.18): what changes, why, who needs it, **is it breaking**.
2. **List where the widget is used** (screens, modules, specimen).
3. Update in order: spec → tokens → CSS → `widgets.js` → specimen (add rows/columns to the matrix) → LVGL.
4. **Keep the old behavior by default**: new modifiers/props must not change the look where it is already used. Breaking = major + migration guide.
5. Gate 2 (specimen review) → update affected screens → compare images.

### 16.11 E. New widget

**Check first: is a new widget really needed?**

- Can it be composed from existing widgets? (RadioList = List + ListItem + radio icon)
- Is it just a **modifier** of an existing widget? (icon-only = `button--icon`, not a new widget)
- Is it used in **≥ 2 places**? If only 1, keep it at the screen/module level first; promote it to a widget when a second use appears.

**Steps:**

1. **RFC** (template §16.18): purpose, BEM anatomy, modifiers, states, behavior, a11y, platform notes, why existing ones don't fit.
2. **References**: see how ISA-101 / Siemens iX / Material 3 / HIG solve it (per §2).
3. **Tokens** `tokens/component/<widget>.json`: reference semantic/mode tokens only. Sizes that differ per platform → add to `modes/*.json` (both files, same names).
4. **CSS** `specimen/components/<widget>.css`: BEM, `var(--…)` only, no state in class names.
5. **Factory** in `widgets.js`: DOM + behavior only; the widget does not know about devices.
6. **Specimen** `<widget>.html`:
   - Matrix of **every modifier × every state**, in both themes × platforms.
   - Edge cases (long text, empty, boundary values).
   - Token table (`DS.tokenTable`).
   - 7" frame if it helps show context.
   - Add to `PAGES` in `specimen.js` + `index.html`.
7. **Audit**: `npm run tokens:check`; new status indicator colors → add the pair to `AUDIT` in `build.mjs`; measure no-overflow + touch targets with a script.
8. **AI self-review** against the §16.17 checklist → **Gate 2**.
9. LVGL widget + LVGL specimen → board.
10. Update playbook §8.4, the widget table in the README, changelog (minor).

### 16.12 F. New pattern / module

*Pattern* = how a recurring situation is handled (alarms, offline, empty, loading).
*Module* = widgets + device data + statechart (e.g. HvacPanel).

1. **Statechart first**: every state, transition, timeout, error, offline. Draw it as text in the spec.
2. **Data**: which fields, where from (data contract), **who is the source of truth** (desired vs reported, §6.2).
3. **Priority rules**: what happens with several events at once (e.g. critical blocks the screen, warnings queue).
4. **Compose existing widgets only**; anything missing → do E first.
5. The specimen has **buttons to simulate each statechart branch** (like the device-card page: success / error / timeout / offline).
6. **Test behavior with a script**: each branch produces the correct UI (state, text, controls locked/unlocked).
7. Gate 2; add Gate 3 if it controls real devices.

### 16.13 G. New screen (7 steps, 3 gates)

```
1 Brief → 2 Have/missing analysis → 3 Screen spec ──► GATE 1
→ 4 Build missing widgets/patterns (E/F) ──► GATE 2
→ 5 Compose screen (specimen + 7" frame) → 6 LVGL + board ──► GATE 3
→ 7 Done
```

1. **Brief** (template §16.18): who uses it, purpose, sections, constraints.
2. **Have / missing analysis**: table "part of screen → widget needed → exists / missing".
   *Settings example:* List, ListItem, Slider, danger Button exist; missing RadioList (language), Sheet + Input + on-screen keyboard (Wi-Fi), ProgressBar (firmware), critical Dialog (reset), ConnectionState.
3. **Screen spec** `design/screens/<screen>.spec.md` (template §16.18):
   - Screen level per ISA-101 (1 overview / 2 area / 3 detail / 4 diagnostics).
   - Structure, navigation, data, **screen states**, statecharts for long flows, safety rules.
   - **GATE 1**: changes are cheapest here.
4. **Missing widgets/patterns**: per §16.11 / §16.12, can be assigned in parallel. **GATE 2** for each one.
5. **Compose the screen** `design/screens/<screen>.html`:
   - Compose existing widgets only; CSS is layout only, via tokens (§15.1).
   - Mock data + **buttons to simulate every screen state** (loading / empty / error / offline / long-running operation).
   - View in the 7" frame at 1x and in the web version (if web also needs this screen).
   - AI self-review (§16.17).
6. **LVGL**: build on the PC simulator, put screenshots next to the specimen to compare, then flash the board: real colors, touch, FPS, on-screen keyboard. **GATE 3**.
7. **Done** per §15.3 + changelog + decision log.

Hard rules for screens:

- **No improvised widgets, colors or px.** If something is missing, go back to step 4.
- **One touch target per row/card** (§8.3).
- **Dangerous actions always go through a critical Dialog** (reset, delete, system shutdown).
- **Long-running operations lock other actions** and show progress (e.g. while updating firmware, lock back/power).

### 16.14 H. New feature

*Feature* = several screens + new data + usually touches firmware/backend. Example: **on/off schedules for devices**.

1. **Feature brief**: user problem, main scenarios (Given / When / Then), **measurable acceptance criteria**.
2. **Short discovery** (condensed Double Diamond): who, where, when (dark control room? gloves? outdoors?) → settle the problem.
3. **Overall flow**: diagram of screens + navigation + entry/exit points (where the feature is opened from, where it exits to).
4. **Data contract, decided BEFORE detailed design**:
   - New fields, MQTT topics/schema, APIs, units, limits.
   - Owner: tech lead; firmware + backend confirm.
5. **Feature statechart** (e.g. schedule: draft → saved → syncing → running | conflict | error).
6. **Decompose** into B/C/E/F/G, plan in batches; independent batches run in parallel.
7. **Clickable prototype across screens** with mock data (HTML), running through every Given/When/Then scenario.
8. **GATE 4: demo to the product owner / customer** → only then build LVGL + connect the real backend.
9. **Done**: every screen Done + acceptance scenarios run on the board (real or simulated data).

### 16.15 I. New platform / mode (e.g. 4.3" 480×272 display)

1. Fill in the **hardware budget** (§13) for the new platform: resolution, actual DPI, touch, physical input.
2. Create `tokens/modes/<platform>.json` with **the same token names** as the existing modes; recompute sizes in mm (formula in §5). **Touch targets must not shrink.**
3. Add the platform to `PLATFORMS` in `build.mjs` → the new LVGL header is generated automatically; add a label to the `specimen.js` toolbar.
4. **Run every specimen in the new mode** → list broken widgets/screens → fix per A/D.
5. Screen layouts may differ (4.3": a list or one card per page instead of a grid) → record in the *Platform notes* of each screen spec.
6. Board test (Gate 3).

### 16.16 J. Removal / deprecation

1. Mark as **deprecated** in the spec + specimen (label) + changelog, naming the replacement.
2. Find and migrate every usage to the replacement.
3. Remove it entirely in the next **major version**; build/audit clean, no remaining references.

### 16.17 Review gates & self-review before a gate

| Gate | What is reviewed | Reviewer | Key questions |
|---|---|---|---|
| **1. Spec** | brief + screen/feature spec | Design lead (+ tech lead if data/safety is involved) | Right problem? All states? Safe? |
| **2. Specimen** | widget/pattern on the specimen page | Design lead + design engineer | Follows §5–§11? Every modifier × state? |
| **3. Board** | screen/widget on the real device | Design lead + QA | Color, touch, FPS, readable at real distance? |
| **4. Demo** | feature runs through all scenarios | Product owner / customer | Solves the right problem? Meets acceptance criteria? |

**AI self-review before every gate** (attach results to the PR / message):

- [ ] `npm run tokens:check` passes (contrast OK)
- [ ] No hex / px in `specimen/components/*.css` and `screens/*` (grep)
- [ ] Every modifier × state is in the specimen, checked in both themes × platforms
- [ ] No overflow, touch targets ≥ threshold, no line-height bump (measured with a script)
- [ ] No errors in the browser console
- [ ] Every statechart branch can be simulated and produces the correct UI
- [ ] Longest localized string (incl. Vietnamese stress cases) does not break the layout; numbers/units formatted per locale
- [ ] Spec, README (widget table), playbook (§8.4, decision log) updated

### 16.18 Document templates

**Brief** (`design/requests/<YYYY-MM-DD>-<slug>.md`):

```md
# <Request name>
Requested by: <who>        Date: <YYYY-MM-DD>
Type: <A–J, may be several>   Size: <S/M/L>
Problem / purpose: <1–3 sentences>
Who uses it, where: <role, environment: dark room, gloves, outdoors...>
Scope: <parts that are needed>
Out of scope: <what will NOT be done this time>
Constraints / safety: <confirmation, action lock, value limits...>
Data: <fields needed, available yet?>
Platform: <embedded-7in / web / both>
Done criteria: <measurable>
5 classification questions (§16.6): 1.<> 2.<> 3.<> 4.<> 5.<>
```

**Widget / pattern RFC** (`design/rfcs/<NNN>-<name>.md`):

```md
# RFC <NNN>: <Widget/Pattern>
Status: draft | approved | rejected      Type: E (new) | D (modify) | F (pattern)
Problem: <why it is needed>
Why not use an existing one: <...>
Where it is used (≥ 2 places): <...>
Anatomy (BEM): <block>, <block>__<element>...
Modifiers: <--a | --b>          States: <per §6.1 + custom if any>
Behavior: <touch, drag, keys, timeout...>
New tokens: <component/... ; mode/... if platform-specific>
A11y: <role, label, touch target, contrast>
Platform notes: <web vs embedded; how LVGL does it>
Breaking change: <no / yes → migration plan>
References: <ISA-101 / iX / M3 / HIG...>
```

**Screen spec** (`design/screens/<screen>.spec.md`):

```md
# Screen: <Name>
ISA-101 level: <1 overview | 2 area | 3 detail | 4 diagnostics>     Platform: <...>
Purpose: <1 sentence>
Structure: <AppShell › area › module/widget...>
Navigation: <entered from → exits to; child sheets/dialogs>
Data: <field → source (data contract); desired/reported>
Screen states: loading | empty | error | offline | <long-running operation>
Long-flow statechart: <e.g. FW: idle → downloading(%) → verifying → installing → rebooting | failed>
Safety rules: <confirmation dialog, action lock...>
Widgets used: <list, mark which are new>
Content: <labels (en default + vi), longest string (vi stress case), units, number format per locale (Intl.NumberFormat / firmware equivalent)>
Platform notes: <7" vs 4.3" vs web>
Done criteria: <...>
```

**Feature spec** (`design/features/<feature>.spec.md`):

```md
# Feature: <Name>
User problem: <...>
Scenarios (Given / When / Then):
  1. Given <...> When <...> Then <...>
Acceptance criteria: <measurable>
Flow: <screen A → screen B → ...; entry/exit points>
Data contract: <topic/API, fields, types, units, limits>   Owner: <tech lead>
Feature statechart: <...>
Decomposition: B <...> | E <...> | F <...> | G <...>
Batch plan: <batch 1 in parallel: ...; batch 2: ...>
Risks: <...>
```

### 16.19 Assigning work to AI (sample prompts)

| Type | Prompt |
|---|---|
| A | "Fix bug: <description + image>. Per §16.7: find the root cause, fix at the lowest layer, re-measure everywhere it is used, propose an audit rule." |
| B | "Change <token> to <value> per §16.8. Report impact + audit results before committing." |
| C | "Add icon <name> per §16.9, with outline + filled." |
| D | "Modify widget <x>: <change>. Per §16.10, write a short RFC first, stop at gate 2." |
| E | "Build widget <x> per §16.11. First check whether a new widget is needed. Stop at gate 2." |
| F | "Build pattern <x> per §16.12, statechart first, with buttons simulating every branch." |
| G | "Build screen <x> containing <...>, constraints <...>, per §16.13. Stop at gate 1 (spec) for my review." |
| H | "Feature <x>: <problem + scenarios>. Per §16.14, produce brief + flow + data contract, stop at gate 1." |
| I | "Add platform <x> (<resolution>, <size>) per §16.15, report the list of broken widgets." |
| J | "Deprecate <x>, replace with <y>, per §16.16." |

General principles when assigning work:

- Always state the **type** and **which gate to stop at**: AI never passes a gate without human approval.
- Give **specific** feedback: point to the spot, the number, a reference image. Never "make it nicer", "make it classier".
- **One screen or one small batch** at a time. Never assign "build the whole app".

---

## 17. PoC roadmap (2 weeks)

| Day | Work | Output |
|---|---|---|
| 1 | Decide §13 (display, input, environment) + positioning §1.1 | Hardware budget, decision log |
| 2–3 | Tokens + pipeline + specimen on the simulator | `tokens/`, `nn_theme.h`, specimen |
| 2–4 | 20 icons (in parallel) | `icons/` + preview |
| 4–7 | State model + 5 core widgets: Button, Toggle, Slider, ListItem, DeviceCard | spec + code + specimen |
| 8–9 | Patterns: AppShell, ConnectionState, Toast/Banner/AlarmDialog, pending | modules + statecharts |
| 10–12 | 3–4 demo screens + mock data + customer demo script | board build + video |
| 13–14 | Audit, real board testing, bug fixing | report + fix list |

---

## 18. Open questions

1. **Target display: 4.3" or 7"?** (blocks §5, §13)
2. Is there a rotary encoder / physical keys? (decides the focus state)
3. Device installation environment → dark or light as default?
4. Specific device domain for the PoC (HVAC, relay, BMS...)?
5. Which font (full Vietnamese diacritics coverage for the vi locale, commercial license)?
6. Which framework for the web app (to choose the token output: CSS vars / Tailwind)?
7. When to upgrade to paid Figma (move the token source to Figma)?
8. Who is the official design lead?

---

## 19. Decision log

| Date | Decision | Rationale | Decided by |
|---|---|---|---|
| 2026-11-15 | "Calm Control" philosophy: ISA-101 + Apple HIG + our own geometric identity | IoT control UI needs clear state and must be light on the MCU | Nam |
| 2026-11-15 | Tokens – Widgets – Modules – Screens structure (keep the Atomic spirit, drop the names) | Boundaries by responsibility, matches LVGL | Nam |
| 2026-11-15 | 3-tier tokens (Primitive/Semantic/Component) + modes for platform/theme | DTCG standard, avoids a separate "platform" tier | Nam |
| 2026-11-15 | Repo `tokens/` is the primary source, Figma follows | Currently on Figma free | Nam |
| 2026-11-15 | BEM for naming; Modifier ≠ State | Avoids name explosion, matches LVGL states | Nam |
| 2026-11-15 | Icons: SVG as source → web SVG + LVGL font/bitmap | One source, correct format for each platform | Nam |
| 2026-11-15 | Embedded-first; flat + 1px borders; no blur/large shadows | Consistent experience, light on the MCU | Nam |
| 2026-11-15 | Desired/reported statechart for every control module | IoT state always clear, shared by design/dev/QA | Nam |
| 2026-11-15 | Starter icon set: Material Symbols (one style, one parameter set); static export for LVGL | Fill axis matches the outline/filled rule, open license, many device icons | Nam |
| 2026-11-15 | Every request enters via a brief + A–J classification (§16.6); work bottom-up; 4 review gates | One workflow for every size of work, AI never skips a gate | Nam |
| 2026-11-15 | Screens may not improvise widgets/colors/px; screen CSS is layout only | Keeps the system consistent as the number of screens grows | Nam |
| 2026-11-15 | Design bugs must be fixed at the root cause and turned into audit rules (§15.1) | So the card-overflowing toggle / misaligned row bugs don't recur | Nam |
| 2026-11-15 | Design system name: **NamNam** (prefix `nn`); "Calm Control" kept as the philosophy name | Neutral root name for extension (Tokens/Icons/Widgets/Shell/adapters); "Keel" collides with many other design systems | Nam |
| 2026-11-15 | Every exported name is prefixed: `--nn-*`, `.nn-*`, `NN_TK_*`, `nn_theme.h`, `NN.*` (§3.3) | Embeddable in other apps/LVGL projects without conflicts; cheapest to add with only 5 widgets | Nam |
| 2026-11-15 | All documentation in English; UI copy localized (en default, vi at launch) | Repo is international; Vietnamese kept as a localization stress test | Nam |
| 2026-11-15 | Widget specs are machine-readable (`<block>.spec.json`), checked against CSS by the lint | One description feeds specimen, LVGL and the future Figma generator | Nam |
| 2026-11-15 | Quality gates automated: `npm run verify` + GitHub Actions (static lint + browser geometry audit) | Rules that are not checked by a machine drift; the audit immediately found a line-box bug in Setpoint | Nam |
| 2026-11-15 | Filled buttons use a dark state layer (`state.layer-fill`); secondary/ghost keep the content-color layer | A white layer on a blue fill dropped white text to 4.0:1 when pressed; found by an external review | Nam |
| 2026-11-15 | Light `status.warning` is amber.700; status colors used as text are audited at 4.5:1 | Warning text on a white card was 3.99:1 | Nam |
| 2026-11-15 | Slider track is a recessed well (`bg.canvas`) with a `border.strong` outline | Track was 1.7:1 against the card; an outline keeps the fill distinct from the track | Nam |
| 2026-11-15 | A failed device command marks the status row critical (`data-error`); pending adds a spinner and keeps the status dot | Playbook 6.1 error treatment and ISA-101 "state always visible" | Nam |
| 2026-11-15 | CSS tokens fall back when an attribute is missing: theme → dark, platform → web | A web app that set only `data-theme` got no tokens at all | Nam |
| 2026-11-15 | Not changed after review: secondary button boundary contrast (label identifies the control), RGB565 truncation (matches LVGL), disabled slider focusability | Judged design choices, not defects; revisit after the real-board review | Nam |
| 2026-11-22 | Figma is generated from tokens by an in-repo plugin (tools/figma-plugin), not drawn by AI or synced by hand | Deterministic and re-runnable at zero AI cost; keeps Figma identical to code across partners | Nam |

---

## 20. Glossary

- **Design token**: a named design variable; 3 tiers primitive / semantic / component.
- **Mode**: a set of replacement token values per theme (dark/light) or platform (web/embedded).
- **DTCG**: the token format of the W3C Design Tokens Community Group.
- **Widget**: a UI component that knows nothing about devices/data; it only receives props.
- **Module**: composes widgets + binds device data + statechart.
- **BEM**: Block – Element – Modifier, a naming convention.
- **State layer**: an opacity overlay expressing pressed/hover/selected.
- **Statechart**: a component's state diagram; it is the spec, the logic and the test cases at once.
- **Desired / reported state**: the state the user wants vs the state the device reports.
- **Specimen**: a screen/page showing every widget × modifier × state for review and screenshot comparison.
- **Visual regression**: comparing screenshots against baselines to catch unintended changes.
- **OOUX**: Object-Oriented UX — designing around data objects (devices) shared across all platforms.
- **ISA-101**: the industrial standard for high-performance HMI design.
- **Keyline**: icon construction shapes (circle/square/rectangle) that keep visual weight even.
- **RFC**: a short written proposal before adding a new component.

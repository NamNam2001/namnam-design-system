# NamNam Design System: Playbook

> **NamNam** là tên design system (tiền tố code `nn`); **Calm Control** là tên triết lý thiết kế (§1).
> Design language và quy trình cho sản phẩm IoT (embedded LVGL + web app + backend) — để mọi màn hình,
> trên mọi nền tảng, trông và hành xử như **một hệ điều hành thống nhất**, không phải tập hợp màn hình rời rạc.
> Đây cũng là tài liệu nền để **build team design** (người + AI agent).

- Version: 0.3 (thêm §16.6–§16.19: quy trình theo loại yêu cầu)
- Ngày cập nhật: 2026-11-15 (v0.1: 2026-11-13)
- Vị trí: `docs/PLAYBOOK.md` trong repo NamNam (đây là bản duy nhất; mọi đường dẫn trong file là tương đối với gốc repo)
- Cho AI agent: đọc `AGENTS.md` ở gốc repo trước; file này đọc theo mục khi cần
- Owner: Nam
- Trạng thái: **đã chốt triết lý + phương pháp**; còn chờ chốt màn hình đích (§13) để điền số cuối

---

## 0. Cách dùng file này

1. File này là **nguồn sự thật duy nhất** cho design language. Token, code, Figma đều phải trỏ về đây.
2. Tầng dưới chốt trước, tầng trên làm sau: Triết lý → Token → Trạng thái → Icon/Widget → Module → Screen.
3. Mọi quyết định phải là **con số hoặc luật kiểm tra được**, không để "tuỳ cảm hứng".
4. Checkbox `[ ]` chỉ đánh dấu khi đã có quyết định **và** người chịu trách nhiệm; ghi vào Decision log (§19).
5. Khi bàn sâu với team/Claude: copy mục tương ứng vào chat, không bàn lại từ đầu.
6. **Có yêu cầu mới (sửa lỗi, widget, màn hình, tính năng...) → bắt đầu ở §16.6: phân loại trước, rồi theo đúng quy trình của loại đó.**

---

## 1. Triết lý: "Calm Control"

### 1.1 Định vị

> Sản phẩm là **hệ thống điều khiển IoT** cho **người vận hành / kỹ thuật viên / người dùng cuối**,
> và cảm giác khi dùng phải giống **một thiết bị đo chuyên nghiệp có độ hoàn thiện của sản phẩm cao cấp**:
> bình tĩnh, rõ ràng, phản hồi tức thì, đáng tin.

- [ ] Chỉnh câu định vị theo khách hàng / domain cụ thể (BMS, HVAC, nhà máy, smart home...)

### 1.2 Bốn nguyên tắc

| # | Nguyên tắc | Nghĩa thực tế | Bị cấm |
|---|---|---|---|
| 1 | **Trạng thái luôn rõ** | Mọi thiết bị đọc được ngay: bật/tắt, đang gửi lệnh, lỗi, mất kết nối | Trạng thái chỉ thể hiện bằng màu |
| 2 | **Phản hồi tức thì** | Chạm xuống → phản hồi hình ảnh < 50ms; không chờ mạng mới đổi UI | UI "đứng im" trong lúc chờ thiết bị |
| 3 | **Màu có nghĩa** | Nền trung tính; accent cho hành động chính; đỏ/vàng chỉ cho bất thường | Màu trang trí, gradient vô cớ |
| 4 | **Một luật hình học** | Mọi spacing, radius, stroke lấy từ một thang số | Giá trị tuỳ hứng (13px, 7px...) |

### 1.3 Điều KHÔNG muốn

- Không giống template AI (gradient tím-xanh, card bo tròn vô tội vạ, icon trộn nhiều bộ)
- Không "Material mặc định", không copy 1:1 iOS/Windows
- Không blur/glass, không đổ bóng lớn (đắt trên MCU, và web cũng không dùng — xem §12)
- Không animation gây chú ý, không nhấp nháy (trừ cảnh báo critical có kiểm soát)

---

## 2. Nguồn tham chiếu (đã chốt)

**Công thức: ISA-101 làm xương sống + Apple HIG cho độ tinh tế + một bản sắc hình học riêng.**

| Nguồn | Lấy gì | Không lấy gì |
|---|---|---|
| **ISA-101 High-Performance HMI** | Nền trung tính, màu chỉ cho bất thường, trạng thái đọc nhanh | Giao diện xám "cổ" của HMI đời cũ |
| **Siemens iX** (open-source, công nghiệp) | Pattern trạng thái thiết bị, cảnh báo, dashboard vận hành | Bản sắc thương hiệu Siemens |
| **Material 3** | **Mô hình state layer** (pressed/disabled/selected bằng lớp phủ opacity), dải màu tonal | "Material look" mặc định |
| **IBM Carbon** | Cấu trúc token, cách viết tài liệu component | Mật độ desktop quá dày cho màn nhỏ |
| **Apple HIG** | Phân cấp chữ, khoảng trắng, chuyển động có ý nghĩa | Liquid Glass / blur; font SF Pro, SF Symbols (giới hạn license) |
| **Material Symbols** (Google) | Bộ icon khởi đầu, trục Fill/Weight (§7) | Dynamic color, ripple, look Android |
| **Nothing OS** (tham khảo cách làm) | Tạo bản sắc chỉ bằng vài luật hình học | Sao chép dot-matrix nguyên bản |

Nền tảng lý thuyết: 10 nguyên tắc Dieter Rams ("less, but better"), Swiss grid, luật Fitts / Hick / Gestalt.

---

## 3. Phương pháp tổ chức

### 3.1 Bộ phương pháp

| Tầng | Phương pháp | Giải quyết |
|---|---|---|
| Quy trình UX | **Double Diamond** | Làm đúng vấn đề trước khi làm đúng giải pháp |
| Cấu trúc | **Tokens – Widgets – Modules – Screens** (tinh thần Atomic Design) | Xây từ nhỏ lên lớn, ranh giới theo trách nhiệm |
| Nguồn sự thật | **Token-first**: 3 tầng + modes, chuẩn DTCG | Một chỗ chứa mọi con số |
| Đặt tên | **BEM** (tách Modifier khỏi State) | Designer, web dev, embedded dev gọi tên giống nhau |
| Dữ liệu | **OOUX** từ hợp đồng dữ liệu thiết bị | Cùng trường dữ liệu trên mọi nền tảng |
| Hành vi | **Statechart** cho mọi widget/module tương tác | Một sơ đồ = spec design + logic dev + test case QA |
| Tài liệu | **Docs-as-code** | Spec nằm cạnh code, có version, agent đọc được |
| Chất lượng | **Audit tự động + specimen + visual regression** | Máy bắt lỗi lệch chuẩn |
| Quản trị | **Design system as a product**: semver, changelog, RFC | Không ai tự chế component |

### 3.2 Bốn tầng và ranh giới

Giữ **tư duy** Atomic Design (xây từ nhỏ lên, tầng trên chỉ ghép từ tầng dưới), **bỏ bộ tên** atoms/molecules/organisms.

| Tầng | Chứa gì | Được biết gì | **Không được** | Tương đương Atomic |
|---|---|---|---|---|
| **Tokens** | Màu, spacing, radius, stroke, font, motion | Chỉ là con số | Chứa logic | (không có) |
| **Widgets** | Button, toggle, slider, card, list item, icon | Token + props truyền vào | Biết thiết bị, mạng, MQTT | Atoms + Molecules |
| **Modules** | HvacPanel, RelayGroup, AlarmCenter | Widget + dữ liệu thiết bị + statechart | Tự đặt màu/kích thước riêng | Organisms |
| **Screens** | Ghép module thành màn | Bố cục, điều hướng | Chứa logic điều khiển | Templates + Pages |

**Luật vàng: Widget "ngu", Module "khôn".** Widget cần chia nhỏ → dùng BEM element, không tạo tầng mới.

### 3.3 Kiến trúc tên & tiền tố

Tên gốc **NamNam** trung tính (không chứa phần cứng, loại sản phẩm hay khách hàng), nên dùng được cho mọi sản phẩm sau này.
Mọi phần mở rộng mang tên con theo một quy tắc cố định:

```
NamNam                        ← design system (tiền tố code: nn)
│   Triết lý: "Calm Control"  ← nguyên tắc (§1), không phải tên hệ thống
├── NamNam Tokens             ← tầng Tokens
├── NamNam Icons              ← bộ icon (§7)
├── NamNam Widgets            ← tầng Widgets
├── NamNam Patterns           ← cảnh báo, kết nối, rỗng, đang tải...
├── NamNam Shell              ← lớp "OS": status bar, điều hướng, control center, thông báo
├── Adapter nền tảng: NamNam for LVGL · NamNam for Web · (NamNam for Flutter...)
├── Theme: Dark / Light · theme theo khách hàng (white-label) nếu cần
└── Thế hệ: NamNam 1, NamNam 2  ← khi đổi lớn về ngôn ngữ thị giác
```

| Nơi | Quy tắc | Ví dụ |
|---|---|---|
| Biến CSS (token) | `--nn-<token>` | `--nn-bg-canvas`, `--nn-button-height-md` |
| Biến CSS nội bộ component | `--_<tên>` (không export) | `--_bg`, `--_height` |
| Class CSS (BEM) | `nn-<block>[__element][--modifier]` | `.nn-button--danger`, `.nn-device-card__status` |
| Keyframes / tên toàn cục CSS | `nn-<tên>` | `nn-spin` |
| Macro C (token) | `NN_TK_<TOKEN>` | `NN_TK_BG_CANVAS` |
| Header C | `nn_theme.h`, `nn_theme_<theme>_<panel>.h` | `nn_theme_dark_7in.h` |
| Macro cấu hình C | `NN_<TÊN>` | `NN_THEME_LIGHT`, `NN_PLATFORM_7IN` |
| Hàm C (widget LVGL) | `nn_<block>_<action>` | `nn_button_create()`, `nn_toggle_set_pending()` |
| Thư viện JS | `NN.<widget>()` | `NN.toggle({...})` |
| Package (khi tách) | `@namnam/<part>` | `@namnam/tokens`, `@namnam/web` |

Tiền tố nằm ở **một chỗ**: `SYSTEM` trong `tools/tokens-build/build.mjs`.
Tên public của token (`button.height.md`) không mang tiền tố; tiền tố chỉ thêm khi sinh code.

---

## 4. Design Tokens

### 4.1 Ba tầng + modes

```
Primitive  →  Semantic  →  Component
(giá trị thô)  (vai trò)     (quyết định cục bộ)
        ▲ modes đặt chồng lên Semantic/Component:
          theme:    dark | light
          platform: web | embedded-7in | embedded-4.3in
```

| Tầng | Ví dụ | Ai được dùng |
|---|---|---|
| Primitive | `color.gray.900 = #121417`, `color.red.500 = #EF4444`, `size.12 = 12px` | **Chỉ** semantic/component token tham chiếu; code không dùng |
| Semantic | `bg.surface.card = {color.gray.900}`, `status.critical = {color.red.500}` | Code web + embedded |
| Component | `component.card.padding = {space.md}` | Code của widget đó |

Quy tắc:
- Code **chỉ dùng semantic/component token**. Không hex, không px trực tiếp trong code UI.
- Khác biệt nền tảng xử lý bằng **mode**, không tạo tầng "platform" riêng:
  `component.card.padding`: web = 24 | embedded-7in = 16 | embedded-4.3in = 12
- Padding/spacing được co theo mode; **vùng chạm không được co** (tính theo mm, §5).
- Tên theo vai trò, không theo giá trị (`text.primary`, không `gray-900-text`).

### 4.2 Định dạng (DTCG)

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

- Thiết kế màu trong OKLCH (đều về độ sáng), lưu/export ra sRGB hex để mọi tool đọc được.
- File chia theo tầng và mode:

```
tokens/
  primitive.json
  semantic/  dark.json  light.json
  component/ *.json
  modes/     web.json  embedded-7in.json  embedded-4.3in.json
```

### 4.3 Pipeline

```
tokens/*.json (repo — nguồn chính)
   │
   ├── Style Dictionary ──► web:      tokens.css (CSS vars) / Tailwind theme
   │
   └── Style Dictionary + transform tự viết ──► embedded: nn_theme.h
                                                  (màu LVGL hex/RGB565, px theo mode,
                                                   macro font, hằng số motion)
```

- Transform cho LVGL **phải tự viết** (RGB565, px theo mode, font, `lv_anim` path). Không có sẵn.
- Không sửa tay file sinh ra. Đổi token → chạy pipeline → commit cả hai.

### 4.4 Figma (đang dùng bản free)

- **Repo `tokens/` là nguồn chính, Figma cập nhật theo** (bản free giới hạn mode của Variables và lượt gọi MCP).
- Designer sửa token qua PR vào `tokens/`, rồi cập nhật Figma Variables/Styles cho khớp (PoC chỉ ~20–40 token).
- Handoff màn hình cho dev/agent: **PNG đúng độ phân giải gốc (1x) + ghi chú ngắn** (kích thước, khoảng cách, hành vi chạm).
- Figma MCP: chỉ dùng cho màn phức tạp cần số đo chính xác (gói free chỉ có vài lượt/tháng).
- Khi nâng cấp Figma trả phí: có thể chuyển sang Figma Variables + Tokens Studio làm nguồn, sync 2 chiều với repo.

### 4.5 Version

- [ ] Token theo **semver**: đổi tên/xoá token = major; thêm = minor; chỉnh giá trị = patch
- [ ] `tokens/CHANGELOG.md` cho mỗi lần phát hành

---

## 5. Quy chuẩn kỹ thuật (số chốt)

Đổi đơn vị vật lý: **px = mm × DPI / 25.4**
Ví dụ màn 7" 1024×600 ≈ 170 DPI; màn 4.3" 480×272 ≈ 128 DPI (cần xác nhận theo panel thật).

| Hạng mục | Luật | Giá trị khởi đầu (7" ~170 DPI) | Trạng thái |
|---|---|---|---|
| Lưới | Bội số 4, bố cục bội số 8 | 4 / 8 / 12 / 16 / 24 / 32 / 48 | [ ] |
| Vùng chạm | ≥ 9mm (khuyến nghị), tối thiểu 7mm | ≥ 60px (tối thiểu 48px) | [ ] |
| Cỡ chữ | Thang tỉ lệ 1.25, tối đa 6 cỡ | 16 / 20 / 24 / 30 / 38 / 48 | [ ] test trên board |
| Font | Một họ chữ, đủ dấu tiếng Việt, subset cho LVGL | <chọn font> | [ ] |
| Radius | Thang cố định | sm 8 / md 12 / lg 20 / pill | [ ] |
| Radius lồng nhau | **bo ngoài = bo trong + padding** | card 20, padding 8 → nút 12 | [ ] |
| Border | Hairline; ưu tiên tách vùng bằng nền | 1px | [ ] |
| Icon stroke | ≈ độ dày nét chữ cùng cỡ | 2px @24; 2.5–3px @32–48 | [ ] |
| Độ sâu | Không shadow; dùng nền nhiều lớp + viền | surface-0 / 1 / 2 + 1px | [ ] |
| Màu | 1 dải trung tính + 1 accent + 4 status (success/warning/critical/info) | — | [ ] |
| Theme | Dark + light dựng từ đầu (mapping riêng, không auto-invert) | — | [ ] |
| Tương phản | WCAG 2.2 AA, đo bằng tool | text ≥ 4.5:1, UI ≥ 3:1 | [ ] |
| Motion | Xem §10 | 100 / 150 / 200 / 300ms | [ ] |
| Reduced motion | Bắt buộc | fallback opacity/instant | [ ] |

---

## 6. Mô hình trạng thái (áp cho MỌI widget)

### 6.1 Trạng thái tương tác

| State | Luật hình ảnh | Hành vi | Web | Embedded |
|---|---|---|---|---|
| Default | Theo token component | | ✓ | ✓ |
| Hover | State layer 8% | Chỉ khi có chuột | ✓ | ✗ |
| **Pressed** | State layer **12%** (màu "on" của component) | Hiện khi **chạm xuống**, hành động khi **nhấc tay** | ✓ | ✓ |
| Focused | Vòng 2px, offset 2px | Bắt buộc nếu có bàn phím / núm xoay | ✓ | nếu có input vật lý |
| Selected / On | Nền accent, chữ on-accent; icon **filled** | | ✓ | ✓ |
| **Disabled** | Nội dung **38%** opacity, không phản hồi chạm | Vẫn đọc được (≥ 3:1), có lý do nếu cần | ✓ | ✓ |
| **Loading** | **Giữ nguyên kích thước**, spinner thay nhãn | Chặn bấm lại | ✓ | ✓ |
| **Error** | Viền critical + icon + chữ mô tả | Không chỉ dùng màu | ✓ | ✓ |

LVGL: dùng state có sẵn (`LV_STATE_PRESSED`, `LV_STATE_DISABLED`, `LV_STATE_CHECKED`, `LV_STATE_FOCUSED`).

### 6.2 Trạng thái thiết bị IoT (desired vs reported)

Trạng thái **mong muốn** (người dùng vừa bấm) và trạng thái **thật** (thiết bị báo về) luôn tách bạch.

```
        tap
 off ────────► pending ──ack────────► on
  ▲              │
  │              ├── timeout / error ──► off + toast lỗi ngắn
  │              │
  └──────────────┘
 * ──device offline──► disabled + nhãn "Mất kết nối"
 * ──device online───► về trạng thái reported
```

- Pending: đổi ngay sang trạng thái mới ở dạng "đang…" + chỉ báo nhỏ; timeout mặc định: [ ] <chốt, vd 5s>.
- Mọi module điều khiển thiết bị **bắt buộc** có statechart này trong spec.

---

## 7. Icon system

### 7.1 Luật hình học

- Lưới 24×24; keyline: tròn 20, vuông 18, chữ nhật 20×16.
- Stroke đều (theo §5), góc 2px, đầu nét tròn, ưu tiên góc 90° và 45°.
- **Outline = mặc định; Filled = đang bật/active.** Đây là luật có nghĩa, không phải trang trí.
- Một bộ duy nhất: bootstrap từ **một** bộ open-source rồi chỉnh theo luật. Không trộn bộ.

**Bộ khởi đầu đề xuất: Material Symbols (Google)**

| Tiêu chí | Lý do chọn |
|---|---|
| Trục **Fill** (0 ↔ 1) có sẵn | Khớp đúng luật outline = mặc định, filled = active |
| Trục **Weight** | Chỉnh độ dày nét cho khớp §5 (vd nét dày hơn ở icon 32–48 trên màn DPI thấp) |
| Trục **Grade** + **Optical size** (20–48) | Tinh chỉnh độ đậm thị giác theo cỡ và theo nền tối/sáng |
| Thư viện lớn | Nhiều icon thiết bị, hệ thống, IoT có sẵn |
| License mở (Apache 2.0) | Dùng được cho sản phẩm thương mại — [ ] xác nhận lại license trước khi phát hành |

- Chọn **một style** duy nhất: [ ] Outlined / [ ] Rounded / [ ] Sharp. Gợi ý: Rounded (mềm, hợp "Calm"), hoặc Sharp nếu muốn cảm giác kỹ thuật.
- Chốt **một bộ tham số** cho toàn hệ thống: Weight = [ ] (vd 400 @24, 500 @32–48), Grade = [ ] (vd 0 nền sáng, −25 nền tối), Optical size = theo cỡ hiển thị.
- **LVGL không dùng trục variable lúc chạy** → xuất sẵn từng biến thể (outline/filled × từng cỡ) ra SVG tĩnh rồi build bitmap/font.
- Icon domain còn thiếu → tự vẽ theo **đúng lưới + tham số** của Material Symbols để không lệch bộ.
- Phương án dự phòng nếu không hợp thẩm mỹ: Lucide / Phosphor / Tabler (cũng license mở, nhưng không có trục Fill).

### 7.2 Nguồn và đầu ra

```
icons/src/*.svg (nguồn gốc, viewBox 24, đã SVGO)
   ├──► web:      SVG sprite / component
   └──► embedded: icon font (lv_font_conv) hoặc bitmap theo từng size 24 / 32 / 48
```

- Icon font cho LVGL là **bitmap theo từng cỡ cố định** → mỗi cỡ tốn flash riêng; chỉ sinh các cỡ thật sự dùng.
- Đặt tên: `<category>/<name>[-<variant>]` (vd `system/wifi-off`, `device/fan-filled`).

### 7.3 Bộ khởi đầu (~20 icon)

| Nhóm | Icon | Trạng thái |
|---|---|---|
| Navigation | back, home, menu, close | [ ] |
| System | wifi (3 mức + off), power, settings, cloud-off | [ ] |
| Status | success, warning, critical, info | [ ] |
| Action | add, edit, delete, refresh | [ ] |
| Domain | <thiết bị theo dự án: fan, relay, thermostat, sensor...> | [ ] |

---

## 8. Widget & Module spec

### 8.1 Template (mỗi widget/module một file `*.spec.md` cạnh code)

```md
### <Name>  (BEM block: <block-name>)

Layer: Widget | Module
Purpose: <một câu>
Anatomy (BEM elements): <block>__<element>, ...
Modifiers (biến thể tĩnh): <--variant / --size>
States: theo §6.1 (+ statechart §6.2 nếu là module điều khiển thiết bị)
Props / Data: <tên, kiểu, mặc định>  (module: map tới trường trong hợp đồng dữ liệu)
Behavior: <tap, long-press 500ms, loading chặn tap, keyboard/encoder>
Tokens: <bg, fg, border, radius, padding, motion>
Content rules: <độ dài, casing, tiếng Việt có dấu, i18n>
Accessibility: <hit area, contrast, focus order, label>
Edge cases: <text dài, giá trị rỗng, offline, lỗi>
Platform notes: <web vs embedded>
Specimen: <link ảnh chụp đủ modifier × state>
```

### 8.2 Ví dụ: Button (Widget)

```md
### Button  (BEM: button)

Layer: Widget
Purpose: hành động chính/phụ trong một vùng.
Anatomy: button__label, button__icon (tuỳ chọn)
Modifiers: --primary | --secondary | --ghost | --danger ; --sm | --md | --lg
States: default / pressed / focused / disabled / loading (+ hover trên web)
Behavior: phản hồi khi chạm xuống, hành động khi nhấc tay; loading giữ nguyên width
Tokens: component.button.bg = {accent}, .fg = {on-accent}, .radius = {radius.md}
Content: sentence case, tối đa 2 dòng; icon-only bắt buộc có label a11y
Accessibility: vùng chạm ≥ 60px (7"), disabled vẫn ≥ 3:1
```

### 8.3 Ví dụ: DeviceCard (Widget) và HvacPanel (Module)

- `device-card`: elements `__icon`, `__title`, `__value`, `__status`, `__control`; modifiers `--compact | --regular`.
  Card **hoặc bấm được toàn bộ, hoặc không**. Bất thường chỉ đổi `__status` / icon, không đổi màu cả card.
- `hvac-panel` (module): ghép `device-card` + `slider` + `toggle`; dữ liệu: nhiệt độ hiện tại, nhiệt độ cài đặt,
  chế độ quạt (theo hợp đồng dữ liệu, **giống hệt trên web và embedded**); có statechart §6.2.

### 8.4 Danh sách tối thiểu

Widgets (specimen web tại `design/specimen/`; chưa có bản LVGL, chưa duyệt trên board):
- [~] Button / IconButton: specimen xong (2026-11-15)
- [~] Toggle: specimen xong; Checkbox / Radio chưa làm
- [~] Slider + Setpoint: specimen xong; Arc chưa làm
- [~] ListItem + List header: specimen xong
- [~] DeviceCard: specimen xong; StatTile chưa làm
- [ ] Tabs / SegmentedControl
- [ ] Input / Select (nếu cần nhập liệu)
- [ ] Progress / Spinner / Skeleton
- [ ] Badge / StatusDot

Modules / Patterns:
- [ ] AppShell (status bar: giờ, Wi-Fi, cảnh báo; navigation)
- [ ] Sheet / Dialog
- [ ] Toast / Banner / AlarmDialog (§9)
- [ ] ConnectionState (online / reconnecting / offline / OTA)
- [ ] EmptyState / ErrorState
- [ ] QuickSettings / ControlCenter
- [ ] Module domain: <HvacPanel, RelayGroup, ...>

---

## 9. Pattern sự kiện & cảnh báo

| Mức | Hình thức | Biến mất khi | Âm thanh/rung |
|---|---|---|---|
| Info | Toast 3s | Tự biến mất | Không |
| Warning | Banner cố định trên cùng | Sự cố được xử lý | Tuỳ chọn |
| Critical | Dialog chặn màn hình + **yêu cầu xác nhận** | Người dùng xác nhận | Có (buzzer nếu có) |

- Mọi cảnh báo: **icon + màu + chữ** + thời điểm; lưu vào lịch sử sự kiện.
- Nhiều cảnh báo cùng lúc: xếp theo mức → thời gian; không chồng dialog.
- Trạng thái kết nối (Wi-Fi qua ESP-Hosted có thể rớt) là pattern riêng: chỉ báo trên status bar + module liên quan chuyển disabled.

---

## 10. Motion

### 10.1 Tính cách: **Snappy** (100–200ms, ít spring) — hợp UI điều khiển và tiết kiệm CPU.

### 10.2 Token

| Loại | Duration | Easing (web) | LVGL path | Dùng cho |
|---|---|---|---|---|
| Micro | 100ms | ease-out | `lv_anim_path_ease_out` | press, toggle |
| Enter | 200ms | cubic-bezier(.2,.8,.2,1) | `lv_anim_path_ease_out` | sheet, dialog |
| Exit | 150ms | cubic-bezier(.4,0,1,1) | `lv_anim_path_ease_in` | đóng, dismiss |
| Emphasis | 300ms | spring nhẹ | `lv_anim_path_overshoot` (hạn chế) | chuyển màn |
| Ambient | 1–2s loop | linear | `lv_anim_path_linear` | spinner |

- LVGL **không có spring vật lý** → map sang path + duration như bảng trên.
- Chỉ animate vị trí/opacity; tránh animate kích thước/layout trên embedded.
- Ra nhanh hơn vào 20–30%; không để 2 animation tranh nhau cùng vùng.
- [ ] Đo FPS thật trên board cho 5 flow: mở màn, chuyển tab, mở sheet, toggle, cảnh báo.

---

## 11. Quy ước đặt tên (BEM đã điều chỉnh)

### 11.1 Luật

1. **Block** đặt theo chức năng (`device-card`), không theo hình thức (`blue-box`).
2. **Chỉ một cấp element** (`card__title`, không `card__header__title`); cần sâu hơn → tách widget.
3. **Modifier = biến thể tĩnh** chọn lúc thiết kế (`--primary`, `--compact`, `--lg`).
4. **State KHÔNG nằm trong tên** (không `button--pressed`, `card--offline`); state do §6 quản lý.
5. **Module** đặt theo domain (`hvac-panel`, `relay-group`, `alarm-center`).
6. **Mọi tên export mang tiền tố `nn`** (§3.3). Trong spec và Figma viết tên không tiền tố (`device-card`); code sinh ra/viết tay luôn có tiền tố.

### 11.2 Bảng quy đổi (một tên, khớp mọi nơi)

| Phần | Figma | Spec / token | Web | LVGL (C) |
|---|---|---|---|---|
| Block | `DeviceCard` | `device-card` | `.nn-device-card` / `NN.deviceCard()` | `nn_device_card_create()` |
| Element | `DeviceCard/Title` | `device-card__title` | `.nn-device-card__title` | `nn_device_card_title` (con trỏ part) |
| Modifier | property `Size=Compact` | `device-card--compact` | `.nn-device-card--compact` | `NN_DEVICE_CARD_SIZE_COMPACT` |
| State | property `State=Pressed` | (theo §6) | `:active` / `[data-state]` / `aria-*` | `LV_STATE_PRESSED` |
| Token | variable `device-card/padding` | `component.device-card.padding` | `--nn-device-card-padding` | `NN_TK_DEVICE_CARD_PADDING` |

---

## 12. Web vs Embedded: "Embedded-first, web nâng cấp có kiểm soát"

**Dùng chung tuyệt đối:** token (khác nhau qua mode), ngôn ngữ thị giác (phẳng + viền 1px), icon, tên BEM,
mô hình dữ liệu (OOUX), mô hình trạng thái + statechart, pattern cảnh báo.

**Được khác:**
- Web có **hover**, focus bàn phím; embedded không có hover.
- Web có màn lớn → bố cục/mật độ khác (vd bento grid); embedded 4.3" dùng danh sách hoặc một thẻ/trang.
- Web có thể có chuyển động mượt hơn, nhưng **cùng tính cách** (§10).

Mục tiêu: người dùng đi từ màn điều khiển sang laptop thấy **cùng một sản phẩm**, không phải giống từng pixel.

---

## 13. Ràng buộc embedded (Hardware budget)

| Hạng mục | Giá trị | Trạng thái |
|---|---|---|
| SoC / module | ESP32-P4 + ESP32-C5 (vd Wireless-Tag WT01P4C5-S1-N16R32) | [ ] chốt |
| Màn hình | [ ] 4.3" 480×272 / [ ] 7" 1024×600 / khác | [ ] **chốt — chặn §5** |
| DPI thật | <tính theo panel> | [ ] |
| Cảm ứng | <capacitive / resistive, có găng tay?> | [ ] |
| Input vật lý | <không / núm xoay / phím> | [ ] |
| Môi trường | <trong nhà / ngoài trời / phòng điều khiển tối> → quyết định dark/light mặc định | [ ] |
| Flash cho UI (font + icon + ảnh) | <MB> | [ ] |
| PSRAM cho frame buffer | <1 hay 2 buffer, MB> | [ ] |
| FPS mục tiêu | <30 / 60> | [ ] |
| Font tiếng Việt | subset glyph có dấu, các cỡ dùng thật | [ ] |
| LVGL version / ESP-IDF version | <vd LVGL 9.x / IDF ≥ 5.5.3 cho P4 rev v3.x> | [ ] |

---

## 14. Cấu trúc repo

```
design/
  DESIGN.md                ← bản rút gọn của playbook này
  decisions/               ← ADR / decision log chi tiết
  requests/                ← brief từng yêu cầu: <YYYY-MM-DD>-<slug>.md (§16.18)
  rfcs/                    ← RFC widget / pattern mới hoặc thay đổi phá tương thích
  features/                ← <feature>.spec.md: flow, hợp đồng dữ liệu, statechart
  screens/                 ← <screen>.spec.md + <screen>.html (chỉ ghép widget, chỉ CSS bố cục)
  specimen/                ← trang specimen mỗi tầng/widget (đã có)
    components/            ← <widget>.css (BEM nn-, chỉ var(--nn-…)) + widgets.js (factory NN.*)
tokens/                    ← nguồn sự thật (§4)
  primitive.json  base.json  semantic/  component/  modes/  CHANGELOG.md
build/                     ← SINH RA, không sửa tay: web/tokens.css|js, embedded/nn_theme*.h, audit.md
icons/
  src/*.svg   build/        ← sinh ra cho web + LVGL
tools/
  tokens-build/build.mjs   ← build không phụ thuộc (DTCG → CSS/JS/LVGL + audit); có thể chuyển sang Style Dictionary sau
  design-lint/             ← audit tự động (§15)
ui-embedded/               ← LVGL
  theme/                   ← sinh từ tokens, KHÔNG sửa tay
  widgets/<name>/          <name>.c  <name>.h  <name>.spec.md
  modules/<name>/          <name>.c  <name>.h  <name>.spec.md (kèm statechart)
  screens/
  mock/                    ← dữ liệu thiết bị giả cho demo/PoC
  specimen/                ← màn xem mọi widget × modifier × state
  sim/                     ← build PC simulator (SDL)
ui-web/
  tokens.css  components/  (cùng tên BEM)
```

---

## 15. Chất lượng: audit tự động & Definition of Done

### 15.1 Luật audit (design-lint, chạy trong CI)

- [ ] Không có hex / px trực tiếp trong `ui-embedded/widgets|modules|screens` và `ui-web/components`
- [ ] Radius chỉ thuộc thang §5; kiểm tra luật bo đồng tâm
- [ ] Vùng chạm ≥ ngưỡng của mode
- [x] Cặp màu text/nền đạt AA (đã tự động trong `build.mjs`, `npm run tokens:check` thoát lỗi nếu fail)
- [ ] Mọi widget có `*.spec.md` + có mặt trong specimen
- [ ] Mọi module điều khiển thiết bị có statechart
- [ ] **Không tràn khung**: phần nhìn thấy của control nằm trong padding box của khung chứa; chỉ phần vùng chạm dư (hit-area − kích thước nhìn thấy) được tràn vào padding. Khoảng tràn tính từ token, không viết số cố định. *(Rút ra từ lỗi 2026-11-15: toggle tràn viền device-card.)*
- [ ] **Không đội dòng**: chữ inline nhỏ hơn (đơn vị, badge) không được làm cao dòng chứa nó (`line-height: 1`). *(Lỗi 2026-11-15: dòng giá trị lệch giữa card có/không có đơn vị.)*
- [ ] **Màn hình chỉ bố cục**: CSS trong `screens/` chỉ được grid/flex/gap/kích thước vùng bằng token; không màu, viền, bo góc, state riêng.
- [ ] **Đủ trạng thái màn**: mỗi màn có loading / empty / error / offline (+ thao tác dài nếu có)
- [ ] **Chữ tiếng Việt dài nhất** không vỡ bố cục (cắt "…" hoặc xuống dòng theo spec)

### 15.2 Visual regression

- Specimen chạy trên PC simulator → chụp ảnh → so với ảnh chuẩn đã duyệt → báo khác biệt.
- Web: cùng cách với Playwright.

### 15.3 Definition of Done cho một widget/module

1. Spec đầy đủ theo template §8.1
2. Code chỉ dùng token
3. Có trong specimen với **mọi modifier × mọi state**
4. Audit xanh, visual regression đã duyệt
5. Đã xem trên **board thật** (màu, chạm, FPS)
6. Designer duyệt + ghi vào changelog

---

## 16. Team design (người + AI agent)

### 16.1 Vai trò con người

| Vai trò | Trách nhiệm | Giai đoạn PoC |
|---|---|---|
| **Design lead** | Giữ triết lý, duyệt cuối, sở hữu token + playbook | Nam / designer chính |
| **Product designer** | Flow, màn hình, Figma, spec | 1 người (có thể kiêm design lead) |
| **Design engineer (embedded UI)** | Widget/module LVGL, pipeline token, specimen | 1 dev embedded |
| **Web UI dev** | Component web cùng tên BEM | khi bắt đầu web |
| **QA / reviewer** | Test trên board thật, duyệt visual regression | kiêm nhiệm |

### 16.2 AI agent

| Agent | Sở hữu | Đầu ra | Người duyệt |
|---|---|---|---|
| Token agent | `tokens/`, `tools/tokens-build/` | token + `nn_theme.h` + `tokens.css` | Design lead |
| Icon agent | `icons/` | SVG theo luật, build web + LVGL, trang preview | Designer |
| Widget agent | `ui-embedded/widgets/`, `ui-web/components/` | spec + code + specimen | Design engineer |
| Module agent | `ui-embedded/modules/` | spec + statechart + code + mock | Design engineer |
| Audit agent | `tools/design-lint/` | báo cáo vi phạm, so ảnh | Design lead |

Luật cho agent:
- Mỗi agent **chỉ sửa thư mục của mình**; đổi token/hợp đồng dữ liệu phải qua design lead.
- Agent đọc spec trong repo (docs-as-code), không đoán từ ảnh khi đã có spec.
- Ghim phiên bản trong định nghĩa agent (LVGL, ESP-IDF) để tránh bịa API.
- Skill có thể dùng (cần kiểm tra lại theo phiên bản cài đặt): `ecc:design-system`, `make-interfaces-feel-better`, `accessibility`.

### 16.3 RACI

| Hoạt động | Design lead | Designer | Design engineer | Agent |
|---|---|---|---|---|
| Triết lý / playbook | A/R | C | C | — |
| Token | A | R | C | R (sinh code) |
| Icon | A | R | C | R (build) |
| Widget/module spec | A | R | C | hỗ trợ |
| Implement | C | C | A | R |
| Audit / visual regression | A | C | R | R |
| Duyệt trên board thật | A | R | R | — |

R = làm, A = chịu trách nhiệm cuối, C = được hỏi ý kiến.

### 16.4 Quy trình một widget/module

Tóm tắt (chi tiết theo từng loại yêu cầu ở §16.6–§16.19):

```
RFC ngắn (cần gì, vì sao) → design lead duyệt
→ designer: Figma + spec.md (BEM, states, tokens)
→ agent/dev: token + CSS + specimen (+ statechart nếu là module)
→ build strict + audit + visual regression
→ xem trên board thật
→ design lead duyệt → merge → changelog
```

### 16.5 Nhịp làm việc

- **Hằng ngày 15 phút:** simulator đặt cạnh Figma, ghi điểm lệch.
- **Hằng tuần:** duyệt trên board thật; cập nhật decision log.
- **Mỗi thay đổi token / tên / hợp đồng dữ liệu:** qua PR có design lead review.

### 16.6 Tiếp nhận & phân loại yêu cầu (bắt buộc, làm đầu tiên)

Mọi yêu cầu đi qua **một cửa**: tạo `design/requests/<YYYY-MM-DD>-<slug>.md` theo mẫu brief §16.18.
Việc đầu tiên luôn là **phân loại**: loại quyết định quy trình, số cổng duyệt và cách tăng version.

| Loại | Ví dụ | Quy trình | Cổng duyệt | Version |
|---|---|---|---|---|
| **A. Sửa lỗi thiết kế** | Toggle tràn card, dòng giá trị lệch | §16.7 | 1 (sau sửa) | patch |
| **B. Chỉnh token** | Đổi màu accent, tăng cỡ chữ body | §16.8 | 1 | patch / minor / major |
| **C. Thêm icon** | Icon "máy lọc khí" | §16.9 | 1 | minor |
| **D. Sửa widget có sẵn** | Thêm size `xl` cho Button, thêm state | §16.10 | 2 | minor (phá tương thích = major) |
| **E. Widget mới** | ProgressBar, Dialog, RadioList | §16.11 | 2 | minor |
| **F. Pattern / module mới** | Toast/Banner/Alarm, ConnectionState | §16.12 | 2 (+3 nếu chạm thiết bị) | minor |
| **G. Màn hình mới** | Màn Settings | §16.13 | 1 → 2 → 3 | minor |
| **H. Tính năng mới** | Lịch hẹn giờ, cập nhật firmware OTA | §16.14 | 1 → 2 → 3 → 4 | minor |
| **I. Platform / mode mới** | Màn 4.3" 480×272, web mobile | §16.15 | 2 + 3 | minor |
| **J. Gỡ bỏ / deprecate** | Bỏ `button--ghost` | §16.16 | 1 | major |

**5 câu hỏi phân loại** (trả lời trong brief):

1. Có đổi **giá trị hoặc tên token** không? → có B; đổi tên/xoá thì thêm J.
2. Có cần **widget chưa tồn tại** không? → làm E/F **trước**, không tự chế trong màn hình.
3. Có đổi **dữ liệu thiết bị / hợp đồng backend** không? → là H, phải có tech lead/firmware/backend tham gia từ cổng 1.
4. Ảnh hưởng **bao nhiêu màn / platform**? → ≥ 2 thì bắt buộc phân tích ảnh hưởng (impact).
5. Có **rủi ro an toàn / không đảo ngược được** không (điều khiển thiết bị, reset, OTA, xoá dữ liệu)? → bắt buộc statechart + dialog xác nhận + design lead **và** tech lead duyệt.

**Cỡ việc** (ghi vào brief để lên kế hoạch):

| Cỡ | Thời gian | Cách làm |
|---|---|---|
| S | ≤ 2 giờ | Một PR, một cổng |
| M | ≤ 2 ngày | Theo đủ quy trình của loại |
| L | > 2 ngày | Chia lô; lô độc lập giao song song cho nhiều agent |

Một yêu cầu thường là **tổ hợp nhiều loại** (vd màn Settings = G + 4×E + 1×F). Luôn làm **từ tầng thấp lên**: B/C → D/E → F → G → H.

### 16.7 A. Sửa lỗi thiết kế

1. **Tái hiện**: ảnh chụp + theme + platform + kích thước khung + trang/màn hình.
2. **Tìm nguyên nhân gốc**, không vá triệu chứng. Hỏi: token sai? công thức bố cục sai? thiếu luật?
   *Ví dụ thật:* toggle tràn card vì margin âm viết cứng 16px, trong khi vùng chạm ngang **không dư**. Sửa đúng là tính khoảng tràn từ token `(hit-area − width) / 2`, không phải đổi 16 thành 8.
3. **Sửa ở tầng thấp nhất có lỗi**: token > CSS widget > bố cục màn hình.
4. **Đo lại bằng script** ở mọi nơi dùng widget (specimen + màn hình + khung 7"), cả 2 theme × platform.
5. **Biến lỗi thành luật**: nếu lỗi có thể lặp lại, thêm vào §15.1 (và vào audit tự động khi có thể).
6. Changelog (patch). Ghi "nguyên nhân gốc" một dòng.

### 16.8 B. Chỉnh token

1. **Chọn đúng tầng**, sửa ở tầng **hẹp nhất** đạt mục tiêu:

   | Muốn | Sửa ở |
   |---|---|
   | Đổi màu thương hiệu | primitive |
   | Đổi vai trò (vd accent dùng xanh khác) | semantic (`semantic/<theme>.json`) |
   | Chỉ một widget khác đi | component (`component/<widget>.json`) |
   | Chỉ một platform khác đi | mode (`modes/<platform>.json`) |

2. `npm run tokens:check`: audit tương phản **phải pass**. Fail thì chỉnh lại, không hạ ngưỡng.
3. **Phân tích ảnh hưởng**: tìm tên biến (`--nn-x-y`, `NN_TK_X_Y`) trong `design/` và code LVGL; mở mọi specimen bị ảnh hưởng ở 2 theme × platform.
4. **So ảnh trước/sau** (visual regression).
5. **Version**: đổi giá trị = patch; thêm token = minor; đổi tên/xoá = major kèm bảng tên cũ → mới.
6. Cập nhật Figma Variables cho khớp (repo là nguồn, §4.4).

Luật: **không thêm token chỉ để dùng một lần** trong một màn. Dùng token có sẵn, hoặc giải thích trong PR vì sao cần token mới.

### 16.9 C. Thêm icon

1. Tìm trong **Material Symbols** trước, đúng style và bộ tham số đã chốt (§7).
2. Không có thì **vẽ trên lưới 24** + keyline, cùng weight/grade; phải có cả bản outline và filled.
3. Đặt tên `<category>/<name>`; thêm vào trang foundations (mục Icons).
4. **Xem ở cỡ thật** 24/32/40 trên board: nét mảnh dễ mất trên màn DPI thấp.
5. Build bitmap/font cho LVGL **chỉ các cỡ thực dùng** (ngân sách flash §13).

### 16.10 D. Sửa widget có sẵn

1. **RFC ngắn** (mẫu §16.18): đổi gì, vì sao, ai cần, **có phá tương thích không**.
2. **Liệt kê nơi đang dùng** widget (màn hình, module, specimen).
3. Cập nhật theo thứ tự: spec → token → CSS → `widgets.js` → specimen (thêm hàng/cột vào ma trận) → LVGL.
4. **Mặc định giữ hành vi cũ**: modifier/props mới không làm đổi giao diện chỗ đang dùng. Phá tương thích = major + hướng dẫn chuyển đổi.
5. Cổng 2 (duyệt specimen) → cập nhật các màn bị ảnh hưởng → so ảnh.

### 16.11 E. Widget mới

**Kiểm tra trước: có thật cần widget mới không?**

- Ghép từ widget có sẵn được không? (RadioList = List + ListItem + icon radio)
- Có phải chỉ là **modifier** của widget có sẵn? (icon-only = `button--icon`, không phải widget mới)
- Có dùng ở **≥ 2 nơi** không? Mới 1 nơi thì để ở tầng màn/module trước, khi có nơi thứ 2 mới nâng lên thành widget.

**Các bước:**

1. **RFC** (mẫu §16.18): mục đích, anatomy BEM, modifiers, states, hành vi, a11y, platform notes, vì sao không dùng cái có sẵn.
2. **Tham chiếu**: xem ISA-101 / Siemens iX / Material 3 / HIG giải quyết ra sao (đúng §2).
3. **Token** `tokens/component/<widget>.json`: chỉ tham chiếu semantic/mode. Kích thước khác nhau giữa platform → thêm vào `modes/*.json` (cả hai file, cùng tên).
4. **CSS** `specimen/components/<widget>.css`: BEM, chỉ `var(--…)`, state không nằm trong tên class.
5. **Factory** trong `widgets.js`: chỉ DOM + hành vi; widget không biết thiết bị.
6. **Specimen** `<widget>.html`:
   - Ma trận **mọi modifier × mọi state**, ở 2 theme × platform.
   - Edge case (chữ dài, rỗng, giá trị biên).
   - Bảng token (`DS.tokenTable`).
   - Khung 7" nếu giúp thấy ngữ cảnh.
   - Thêm vào `PAGES` trong `specimen.js` + `index.html`.
7. **Audit**: `npm run tokens:check`; màu chỉ báo trạng thái mới → thêm cặp vào `AUDIT` trong `build.mjs`; đo không tràn khung + vùng chạm bằng script.
8. **AI tự soát** theo checklist §16.17 → **Cổng 2**.
9. LVGL widget + specimen LVGL → board.
10. Cập nhật playbook §8.4, bảng widget trong README, changelog (minor).

### 16.12 F. Pattern / module mới

*Pattern* = cách xử lý một tình huống lặp lại (cảnh báo, mất kết nối, rỗng, đang tải).
*Module* = widget + dữ liệu thiết bị + statechart (vd HvacPanel).

1. **Statechart trước tiên**: mọi trạng thái, chuyển tiếp, timeout, lỗi, offline. Vẽ dạng chữ trong spec.
2. **Dữ liệu**: trường nào, lấy từ đâu (hợp đồng dữ liệu), **ai là nguồn thật** (desired vs reported, §6.2).
3. **Luật ưu tiên**: nhiều sự kiện cùng lúc thì sao (vd critical chặn màn, warning xếp hàng).
4. **Chỉ ghép widget có sẵn**; thiếu → làm E trước.
5. Specimen có **nút mô phỏng từng nhánh** statechart (như trang device-card: thành công / lỗi / hết thời gian / mất kết nối).
6. **Kiểm thử hành vi bằng script**: mỗi nhánh cho ra đúng UI (trạng thái, chữ, khoá/mở control).
7. Cổng 2; thêm Cổng 3 nếu điều khiển thiết bị thật.

### 16.13 G. Màn hình mới (7 bước, 3 cổng)

```
1 Brief → 2 Phân tích có/thiếu → 3 Spec màn ──► CỔNG 1
→ 4 Làm widget/pattern còn thiếu (E/F) ──► CỔNG 2
→ 5 Ghép màn (specimen + khung 7") → 6 LVGL + board ──► CỔNG 3
→ 7 Done
```

1. **Brief** (mẫu §16.18): ai dùng, mục đích, các phần, ràng buộc.
2. **Phân tích có / thiếu**: bảng "phần trong màn → widget cần → đã có / thiếu".
   *Ví dụ Settings:* List, ListItem, Slider, Button danger đã có; thiếu RadioList (ngôn ngữ), Sheet + Input + bàn phím ảo (Wi-Fi), ProgressBar (firmware), Dialog critical (reset), ConnectionState.
3. **Spec màn** `design/screens/<screen>.spec.md` (mẫu §16.18):
   - Cấp màn theo ISA-101 (1 tổng quan / 2 khu vực / 3 chi tiết / 4 chẩn đoán).
   - Cấu trúc, điều hướng, dữ liệu, **trạng thái của màn**, statechart các luồng dài, quy tắc an toàn.
   - **CỔNG 1**: sửa ở đây rẻ nhất.
4. **Widget/pattern thiếu**: theo §16.11 / §16.12, giao song song được. **CỔNG 2** cho từng cái.
5. **Ghép màn** `design/screens/<screen>.html`:
   - Chỉ ghép widget có sẵn; CSS chỉ bố cục bằng token (§15.1).
   - Dữ liệu mock + **nút mô phỏng mọi trạng thái màn** (loading / empty / error / offline / thao tác dài).
   - Xem trong khung 7" 1x và ở bản web (nếu web cũng cần màn này).
   - AI tự soát (§16.17).
6. **LVGL**: dựng trên simulator PC, đặt ảnh chụp cạnh specimen để so, rồi nạp board: màu thật, chạm, FPS, bàn phím ảo. **CỔNG 3**.
7. **Done** theo §15.3 + changelog + decision log.

Luật cứng của màn hình:

- **Không tự chế widget, màu, px.** Thiếu thì quay về bước 4.
- **Một vùng chạm cho mỗi hàng/thẻ** (§8.3).
- **Hành động nguy hiểm luôn qua Dialog critical** (reset, xoá, tắt hệ thống).
- **Thao tác dài khoá thao tác khác** và có tiến trình (vd đang cập nhật firmware thì khoá quay lại/nguồn).

### 16.14 H. Tính năng mới

*Tính năng* = nhiều màn + dữ liệu mới + thường đụng firmware/backend. Ví dụ: **lịch hẹn giờ bật/tắt thiết bị**.

1. **Feature brief**: vấn đề người dùng, kịch bản chính (Given / When / Then), **tiêu chí nghiệm thu đo được**.
2. **Khám phá ngắn** (Double Diamond rút gọn): ai, ở đâu, khi nào (phòng điều khiển tối? găng tay? ngoài trời?) → chốt bài toán.
3. **Flow tổng**: sơ đồ các màn + điều hướng + điểm vào/ra (từ đâu mở tính năng, thoát về đâu).
4. **Hợp đồng dữ liệu, chốt TRƯỚC thiết kế chi tiết**:
   - Trường mới, MQTT topic/schema, API, đơn vị, giới hạn.
   - Owner: tech lead; firmware + backend xác nhận.
5. **Statechart của tính năng** (vd lịch: nháp → đã lưu → đang đồng bộ → đang chạy | xung đột | lỗi).
6. **Phân rã** thành B/C/E/F/G, lập kế hoạch theo lô; lô độc lập chạy song song.
7. **Prototype bấm được qua các màn** bằng dữ liệu mock (HTML), chạy hết kịch bản Given/When/Then.
8. **CỔNG 4: demo cho product owner / khách hàng** → rồi mới làm LVGL + nối backend thật.
9. **Done**: mọi màn Done + kịch bản nghiệm thu chạy được trên board (dữ liệu thật hoặc giả lập).

### 16.15 I. Platform / mode mới (vd màn 4.3" 480×272)

1. Điền **hardware budget** (§13) cho platform mới: độ phân giải, DPI thật, cảm ứng, input vật lý.
2. Tạo `tokens/modes/<platform>.json` **cùng tên token** với mode hiện có; tính lại kích thước theo mm (công thức §5). **Vùng chạm không được co.**
3. Thêm platform vào `PLATFORMS` trong `build.mjs` → header LVGL mới tự sinh; thêm nhãn vào toolbar `specimen.js`.
4. **Chạy mọi specimen ở mode mới** → lập danh sách widget/màn vỡ → sửa theo A/D.
5. Bố cục màn có thể khác (4.3": danh sách hoặc một thẻ/trang thay cho lưới) → ghi vào *Platform notes* của từng spec màn.
6. Board test (Cổng 3).

### 16.16 J. Gỡ bỏ / deprecate

1. Đánh dấu **deprecated** ở spec + specimen (nhãn) + changelog, nêu thứ thay thế.
2. Tìm và chuyển mọi nơi đang dùng sang thứ thay thế.
3. Gỡ hẳn ở **version major** tiếp theo; build/audit sạch, không còn tham chiếu.

### 16.17 Cổng duyệt & tự soát trước cổng

| Cổng | Duyệt cái gì | Ai duyệt | Câu hỏi chính |
|---|---|---|---|
| **1. Spec** | brief + spec màn/tính năng | Design lead (+ tech lead nếu có dữ liệu/an toàn) | Đúng bài toán? Đủ trạng thái? An toàn? |
| **2. Specimen** | widget/pattern trên trang specimen | Design lead + design engineer | Đúng luật §5–§11? Đủ modifier × state? |
| **3. Board** | màn/widget trên thiết bị thật | Design lead + QA | Màu, chạm, FPS, đọc được ở khoảng cách thật? |
| **4. Demo** | tính năng chạy hết kịch bản | Product owner / khách hàng | Giải quyết đúng vấn đề? Đạt tiêu chí nghiệm thu? |

**AI tự soát trước mỗi cổng** (đính kèm kết quả vào PR / tin nhắn):

- [ ] `npm run tokens:check` pass (tương phản đạt)
- [ ] Không có hex / px trong `specimen/components/*.css` và `screens/*` (grep)
- [ ] Mọi modifier × state có trong specimen, kiểm ở 2 theme × platform
- [ ] Không tràn khung, vùng chạm ≥ ngưỡng, không đội dòng (đo bằng script)
- [ ] Console trình duyệt không lỗi
- [ ] Mọi nhánh statechart mô phỏng được và cho đúng UI
- [ ] Chữ tiếng Việt dài nhất không vỡ bố cục
- [ ] Spec, README (bảng widget), playbook (§8.4, decision log) đã cập nhật

### 16.18 Mẫu tài liệu

**Brief** (`design/requests/<YYYY-MM-DD>-<slug>.md`):

```md
# <Tên yêu cầu>
Người yêu cầu: <ai>        Ngày: <YYYY-MM-DD>
Loại: <A–J, có thể nhiều>   Cỡ: <S/M/L>
Vấn đề / mục đích: <1–3 câu>
Ai dùng, ở đâu: <vai trò, môi trường: phòng tối, găng tay, ngoài trời...>
Phạm vi: <các phần cần có>
Ngoài phạm vi: <những gì KHÔNG làm lần này>
Ràng buộc / an toàn: <xác nhận, khoá thao tác, giới hạn giá trị...>
Dữ liệu: <trường cần, có sẵn chưa>
Platform: <embedded-7in / web / cả hai>
Tiêu chí xong: <đo được>
5 câu phân loại (§16.6): 1.<> 2.<> 3.<> 4.<> 5.<>
```

**RFC widget / pattern** (`design/rfcs/<NNN>-<name>.md`):

```md
# RFC <NNN>: <Widget/Pattern>
Trạng thái: nháp | duyệt | từ chối      Loại: E (mới) | D (sửa) | F (pattern)
Vấn đề: <vì sao cần>
Vì sao không dùng cái có sẵn: <...>
Dùng ở đâu (≥ 2 nơi): <...>
Anatomy (BEM): <block>, <block>__<element>...
Modifiers: <--a | --b>          States: <theo §6.1 + riêng nếu có>
Hành vi: <chạm, kéo, phím, timeout...>
Token mới: <component/... ; mode/... nếu khác platform>
A11y: <role, label, vùng chạm, tương phản>
Platform notes: <web vs embedded; LVGL làm thế nào>
Phá tương thích: <không / có → kế hoạch chuyển đổi>
Tham chiếu: <ISA-101 / iX / M3 / HIG...>
```

**Spec màn hình** (`design/screens/<screen>.spec.md`):

```md
# Screen: <Tên>
Cấp ISA-101: <1 tổng quan | 2 khu vực | 3 chi tiết | 4 chẩn đoán>     Platform: <...>
Mục đích: <1 câu>
Cấu trúc: <AppShell › vùng › module/widget...>
Điều hướng: <vào từ đâu → ra đâu; sheet/dialog con>
Dữ liệu: <trường → nguồn (hợp đồng dữ liệu); desired/reported>
Trạng thái màn: loading | empty | error | offline | <thao tác dài>
Statechart luồng dài: <vd FW: idle → downloading(%) → verifying → installing → rebooting | failed>
Quy tắc an toàn: <dialog xác nhận, khoá thao tác...>
Widget dùng: <danh sách, đánh dấu cái nào mới>
Nội dung: <nhãn, chữ dài nhất, đơn vị, định dạng số (dấu phẩy thập phân)>
Platform notes: <7" vs 4.3" vs web>
Tiêu chí xong: <...>
```

**Spec tính năng** (`design/features/<feature>.spec.md`):

```md
# Feature: <Tên>
Vấn đề người dùng: <...>
Kịch bản (Given / When / Then):
  1. Given <...> When <...> Then <...>
Tiêu chí nghiệm thu: <đo được>
Flow: <màn A → màn B → ...; điểm vào/ra>
Hợp đồng dữ liệu: <topic/API, trường, kiểu, đơn vị, giới hạn>   Owner: <tech lead>
Statechart tính năng: <...>
Phân rã: B <...> | E <...> | F <...> | G <...>
Kế hoạch lô: <lô 1 song song: ...; lô 2: ...>
Rủi ro: <...>
```

### 16.19 Giao việc cho AI (câu mẫu)

| Loại | Câu giao việc |
|---|---|
| A | "Sửa lỗi: <mô tả + ảnh>. Theo §16.7: tìm nguyên nhân gốc, sửa ở tầng thấp nhất, đo lại mọi nơi dùng, đề xuất luật audit." |
| B | "Đổi <token> thành <giá trị> theo §16.8. Báo ảnh hưởng + kết quả audit trước khi commit." |
| C | "Thêm icon <tên> theo §16.9, kèm outline + filled." |
| D | "Sửa widget <x>: <thay đổi>. Theo §16.10, viết RFC ngắn trước, dừng ở cổng 2." |
| E | "Làm widget <x> theo §16.11. Kiểm tra trước có cần widget mới không. Dừng ở cổng 2." |
| F | "Làm pattern <x> theo §16.12, statechart trước, có nút mô phỏng mọi nhánh." |
| G | "Làm màn <x> gồm <...>, ràng buộc <...>, theo §16.13. Dừng ở cổng 1 (spec) cho tôi duyệt." |
| H | "Tính năng <x>: <vấn đề + kịch bản>. Theo §16.14, làm brief + flow + hợp đồng dữ liệu, dừng ở cổng 1." |
| I | "Thêm platform <x> (<độ phân giải>, <kích thước>) theo §16.15, báo danh sách widget vỡ." |
| J | "Deprecate <x>, thay bằng <y>, theo §16.16." |

Nguyên tắc chung khi giao việc:

- Luôn ghi **loại** và **dừng ở cổng nào**: AI không tự đi qua cổng mà chưa có người duyệt.
- Góp ý **cụ thể**: chỉ chỗ, chỉ con số, chỉ hình tham khảo. Không dùng "đẹp hơn", "sang hơn".
- Mỗi lần **một màn hoặc một lô nhỏ**. Không giao "làm cả app".

---

## 17. Roadmap PoC (2 tuần)

| Ngày | Việc | Output |
|---|---|---|
| 1 | Chốt §13 (màn hình, input, môi trường) + định vị §1.1 | Hardware budget, decision log |
| 2–3 | Token + pipeline + specimen trên simulator | `tokens/`, `nn_theme.h`, specimen |
| 2–4 | 20 icon (song song) | `icons/` + preview |
| 4–7 | Mô hình trạng thái + 5 widget lõi: Button, Toggle, Slider, ListItem, DeviceCard | spec + code + specimen |
| 8–9 | Pattern: AppShell, ConnectionState, Toast/Banner/AlarmDialog, pending | module + statechart |
| 10–12 | 3–4 màn demo + dữ liệu mock + kịch bản demo khách hàng | build board + video |
| 13–14 | Audit, test board thật, sửa lỗi | báo cáo + fix list |

---

## 18. Câu hỏi mở

1. **Màn hình đích: 4.3" hay 7"?** (chặn §5, §13)
2. Có núm xoay / phím vật lý không? (quyết định focus state)
3. Môi trường đặt thiết bị → dark hay light làm mặc định?
4. Domain thiết bị cụ thể của PoC (HVAC, relay, BMS...)?
5. Font chữ nào (đủ tiếng Việt, license dùng thương mại)?
6. Web app dùng framework nào (để chọn đầu ra token: CSS vars / Tailwind)?
7. Khi nào nâng cấp Figma trả phí (đổi nguồn token sang Figma)?
8. Ai là design lead chính thức?

---

## 19. Decision log

| Ngày | Quyết định | Lý do | Người chốt |
|---|---|---|---|
| 2026-11-15 | Triết lý "Calm Control": ISA-101 + Apple HIG + bản sắc hình học riêng | UI điều khiển IoT cần trạng thái rõ, nhẹ trên MCU | Nam |
| 2026-11-15 | Cấu trúc Tokens – Widgets – Modules – Screens (giữ tinh thần Atomic, bỏ tên gọi) | Ranh giới theo trách nhiệm, khớp LVGL | Nam |
| 2026-11-15 | Token 3 tầng (Primitive/Semantic/Component) + modes cho platform/theme | Chuẩn DTCG, tránh tầng "platform" riêng | Nam |
| 2026-11-15 | Repo `tokens/` là nguồn chính, Figma đi theo | Đang dùng Figma free | Nam |
| 2026-11-15 | BEM cho đặt tên; Modifier ≠ State | Tránh bùng nổ tên, khớp LVGL state | Nam |
| 2026-11-15 | Icon: SVG làm nguồn → SVG web + font/bitmap LVGL | Một nguồn, đúng chuẩn mỗi nền tảng | Nam |
| 2026-11-15 | Embedded-first; phẳng + viền 1px; không blur/shadow lớn | Đồng nhất trải nghiệm, nhẹ trên MCU | Nam |
| 2026-11-15 | Statechart desired/reported cho mọi module điều khiển | Trạng thái IoT luôn rõ, chung cho design/dev/QA | Nam |
| 2026-11-15 | Bộ icon khởi đầu: Material Symbols (một style, một bộ tham số); xuất tĩnh cho LVGL | Trục Fill khớp luật outline/filled, license mở, nhiều icon thiết bị | Nam |
| 2026-11-15 | Mọi yêu cầu vào qua brief + phân loại A–J (§16.6); làm từ tầng thấp lên; 4 cổng duyệt | Một quy trình cho mọi cỡ việc, AI không tự vượt cổng | Nam |
| 2026-11-15 | Màn hình không được tự chế widget/màu/px; CSS màn chỉ bố cục | Giữ hệ thống nhất quán khi số màn tăng | Nam |
| 2026-11-15 | Lỗi thiết kế phải sửa ở nguyên nhân gốc và biến thành luật audit (§15.1) | Lỗi toggle tràn card / dòng lệch không lặp lại | Nam |
| 2026-11-15 | Tên design system: **NamNam** (tiền tố `nn`); "Calm Control" giữ làm tên triết lý | Tên gốc trung tính để mở rộng (Tokens/Icons/Widgets/Shell/adapter); "Keel" trùng nhiều design system khác | Nam |
| 2026-11-15 | Mọi tên export có tiền tố: `--nn-*`, `.nn-*`, `NN_TK_*`, `nn_theme.h`, `NN.*` (§3.3) | Nhúng được vào app/dự án LVGL khác không xung đột; thêm khi mới 5 widget là rẻ nhất | Nam |

---

## 20. Glossary

- **Design token**: biến thiết kế có tên; 3 tầng primitive / semantic / component.
- **Mode**: bộ giá trị thay thế cho token theo theme (dark/light) hoặc nền tảng (web/embedded).
- **DTCG**: định dạng token của W3C Design Tokens Community Group.
- **Widget**: thành phần UI không biết về thiết bị/dữ liệu; chỉ nhận props.
- **Module**: ghép widget + nối dữ liệu thiết bị + statechart.
- **BEM**: Block – Element – Modifier, quy ước đặt tên.
- **State layer**: lớp phủ opacity thể hiện pressed/hover/selected.
- **Statechart**: sơ đồ trạng thái của component; vừa là spec, vừa là logic, vừa là test case.
- **Desired / reported state**: trạng thái người dùng muốn vs trạng thái thiết bị báo về.
- **Specimen**: màn/trang hiển thị mọi widget × modifier × state để duyệt và chụp so sánh.
- **Visual regression**: so ảnh chụp với ảnh chuẩn để bắt thay đổi ngoài ý muốn.
- **OOUX**: Object-Oriented UX — thiết kế quanh đối tượng dữ liệu (thiết bị) dùng chung mọi nền tảng.
- **ISA-101**: chuẩn thiết kế HMI hiệu năng cao trong công nghiệp.
- **Keyline**: khung dựng icon (tròn/vuông/chữ nhật) để giữ độ nặng thị giác đều.
- **RFC**: đề xuất ngắn bằng văn bản trước khi thêm component mới.

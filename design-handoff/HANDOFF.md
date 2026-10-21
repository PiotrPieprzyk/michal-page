# Handoff: landing page for a tree-removal company (Arboryści / Wycinka drzew)

One-page landing site for a Polish family business of arborists with **20+ years in the trade**.
The feel should be **"solid local craftsmen", not "startup"**. All copy is in Polish (`<html lang="pl">`).

The chosen hero is **Hero A, "Ekipa w akcji"**. Hero B was dropped, so don't build it.

---

## 1. What's in this folder

```
design-handoff/
├── HANDOFF.md          ← this file (the spec)
├── mobile/             ← 375 px, designed first
│   ├── 01-hero.dc.html
│   ├── 02-services.dc.html
│   ├── 03-gallery.dc.html
│   ├── 04-pricing.dc.html
│   ├── 05-form-states.dc.html   (4 states side by side: reference only)
│   ├── 06-sticky-bar.dc.html
│   └── 07-footer.dc.html
└── desktop/            ← 1440 px
    ├── 01-hero.dc.html
    ├── 02-services.dc.html
    ├── 03-gallery.dc.html
    ├── 04-pricing.dc.html
    ├── 05-form.dc.html          (interactive, 5 states)
    ├── 06-sticky-header.dc.html
    └── 07-footer.dc.html
```

**How to read the `.dc.html` files.** Each one is a design mockup, not production code.
- The real markup sits inside `<x-dc>…</x-dc>`. All styles are inline, so read exact sizes, colours and spacing from them.
- `{{accent}}` means the accent colour, `#FF6B1A`.
- `<sc-for>` is a loop and `<sc-if>` is a condition. The `<script type="text/x-dc">` block shows the intended behaviour (slider position, form states).
- Ignore `support.js`, `<helmet>` and `data-props`. They belong to the design tool.
- The desktop files are fixed-width 1440 px mockups. **Build a fluid, responsive page**: max content width 1280 px, 80 px side padding on desktop, 16 px on mobile.

---

## 2. Design tokens

### Colours
| Token | Hex | Use |
|---|---|---|
| `--green-900` | `#14291D` | Header (Hero A), footer, darkest headings |
| `--green-800` | `#1F3D2B` | Main brand green: hero panel, CTA boxes, secondary buttons, icons |
| `--beige-200` | `#E9DCC6` | Badges, text accents on green, step numbers |
| `--beige-100` | `#F5EFE4` | Section background (services, pricing) |
| `--beige-50` | `#FAF6EF` | Table header, drop zone background |
| `--line` | `#E2D6C2` | Card borders, dividers |
| `--white` | `#FFFFFF` | Cards, gallery and form sections |
| `--ink` | `#1B1B1B` | Body text |
| `--ink-2` | `#3D3226` | Secondary text on light backgrounds |
| `--ink-3` | `#5C4A33` | Labels, meta, eyebrows (warm brown) |
| `--on-green` | `#EDE4D3` | Body text on green |
| `--input-border` | `#8A7A5F` | Form field borders (3:1 contrast against white) |
| `--accent` | `#FF6B1A` | **Safety orange, for CALL / SUBMIT buttons only.** Text on it is always `#1B1B1B`, never white. Alternative: yellow `#FFC20E` |
| `--error` | `#B3261E` | Error border and text; `#FDF3F2` error background, `#8C1D18` error body text |
| `--success-dot` | `#2E7D32` | The "Odbieramy teraz" indicator |
| `--highlight-row` | `#EEF2EA` | Free items in the pricing table |

**Rule:** the accent colour appears **only** on call-to-action buttons (call, submit). Never on headings, icons or decoration.

### Typography
- Font: **Archivo** (Google Fonts, weights 400/500/600/700/800). It has full Polish character support (ą ć ę ł ń ó ś ź ż). Fallback: `system-ui, sans-serif`.
- Headings use weight 800 with slightly negative letter-spacing (−0.01 to −0.02em).

| Role | Mobile | Desktop |
|---|---|---|
| H1 (hero) | 34px / 1.08 | 56px / 1.04 |
| H2 (section) | 30px / 1.1 | 48px / 1.05 |
| H3 (card) | 17px | 21px |
| Body | 16–17px / 1.5 | 18–19px / 1.55 |
| Small / meta | 13–14px | 14–15px |
| Eyebrow | 13px, 700, uppercase, letter-spacing 0.08em, `--ink-3` | 14px, 0.1em |

All form inputs use **16px** text, so iOS doesn't zoom in on focus.

### Shape and spacing
- Border radius: buttons 10–12px, cards 14–16px, chips and pills 999px, thumbnails 8–10px.
- Section padding: mobile 44px top, 32px bottom; desktop 96px top, 80px bottom.
- Gaps between cards: 12px on mobile, 24px on desktop.
- Shadows are minimal: only the hero badge, the slider handle, the sticky bar and the desktop form card have one.

### Buttons (hard requirement: minimum height 48px)
| Type | Look | Height |
|---|---|---|
| Primary / call | `--accent` background, `--ink` text, weight 800, phone icon | 56–62px |
| Secondary on green | 2px `--beige-200` outline, white text | 56–62px |
| Secondary on light | 2px `--green-800` outline, green text | 52–56px |
| Tertiary | Text link with an arrow icon, min-height 48px | 48px |

Every phone button is a `<a href="tel:+48600000000">`.

### Icons
Use simple stroke icons, 2px stroke, round caps (Feather or Lucide style): phone, camera, tree, alert-triangle, scissors, cylinder/stump, truck, wind, file-text, shield, clock, check, arrow-right, x, alert-circle. **No emoji.**

---

## 3. Page structure (in order)

| # | Section | Anchor | Background |
|---|---|---|---|
| 0 | Header | | `--green-900` |
| 1 | Hero A | | photo + `--green-800` panel |
| 2 | Trust row | | `--beige-100` |
| 3 | Services | `#uslugi` | `--beige-100` |
| 4 | Gallery (before/after) | `#realizacje` | white |
| 5 | Pricing | `#cennik` | `--beige-100` |
| 6 | Quote form | `#formularz` | white on mobile / `--green-800` on desktop |
| 7 | Footer | `#kontakt` | `--green-900` |
| + | Sticky bar (mobile) / sticky header (desktop) | | white |

### 0–2. Header, Hero A and trust row
Files: `mobile/01-hero`, `desktop/01-hero`.
- **Header, mobile (64px):** logo (tree icon + "[Nazwa Firmy]" + "Arboryści · od [ROK]") and a square 48×48 orange call button with an icon only. It needs `aria-label="Zadzwoń 600 000 000"`.
- **Header, desktop (84px):** logo, nav (Usługi, Realizacje, Cennik, Kontakt), opening hours with the number written out, and an orange "Zadzwoń" button.
- **Hero, mobile:** a 290px photo on top. A beige "20+ lat doświadczenia" badge overlaps the bottom edge of the photo. Below it, a green panel holds:
  - an eyebrow line
  - the H1
  - a lead paragraph
  - **"Zadzwoń: 600 000 000"** (full width, 60px, orange)
  - "Wyślij zdjęcie drzewa — wycena" (outline button, links to `#formularz`)
  - the hours line
- **Hero, desktop:** two columns. The green text panel on the left is 640px wide; the photo fills the rest on the right. The badge overlaps the left edge of the photo.
- **Trust row:** 3 items on mobile in a 3-column grid with the icon above the text. On desktop it's a 4-column row: 20+ lat w zawodzie · Ubezpieczenie OC · Własny sprzęt i ekipa · Sprzątamy po sobie.
- The phone number **must be visible in the hero**, at every breakpoint.

### 3. Services
Files: `*/02-services`.
- Section heading block. On desktop there's a "Zobacz cennik →" link on the right.
- **6 cards:** Wycinka drzew · Trudne miejsca · Pielęgnacja koron · Frezowanie pniaków · Rębakowanie i wywóz · Po wichurach.
  - Mobile: one column of horizontal cards, with a 92×108 photo on the left and an icon + title + 2-line description on the right.
  - Desktop: a 3×2 grid, with a 210px photo on top and the icon + title + description below.
- After the cards comes a note about permits ("Formalności też ogarniemy…"). Then a green CTA box with a call button: full-width box on mobile, horizontal strip on desktop.

### 4. Gallery: before/after
Files: `*/03-gallery`.
- Filter chips (Wszystkie, Wycinka, Pielęgnacja, Pniaki, Po wichurach) are real `<button>` elements with `aria-pressed`; the active one is green. On mobile they scroll sideways.
- **One large slider:** 300px tall on mobile, 728×520 on desktop. See the behaviour section below.
- **3 pairs side by side** (PRZED | PO) with a title and "[Miejscowość] · description". On desktop they stack in the right column next to the slider.
- "Zobacz więcej realizacji" outline button at the end.
- Labels: PRZED is a brown chip `#5C4A33`, PO is a green chip `#1F3D2B`, both with white text.

### 5. Pricing
Files: `*/04-pricing`.
- Build it as a real `<table>`: 2 columns on mobile (service + detail | price), 3 columns on desktop (Usługa | Zakres / jednostka | Cena).
- 7 priced rows, then 2 highlighted free rows (Wycena na miejscu 0 zł, Dojazd do [50] km 0 zł).
- A VAT note under the table.
- A "Co wpływa na cenę?" card with a 4-item checklist.
- A CTA: on mobile, an orange call button plus a link to the form. On desktop, a green side card with the call button.

### 6. Quote form with photo upload
Files: `mobile/05-form-states` (states reference), `desktop/05-form` (interactive).
- **Fields:** Imię (text) · Telefon (`type="tel"`, **required**) · Miejscowość · Opis (textarea, optional) · Zdjęcia (file input, `accept="image/*"`, `multiple`; on phones it should offer the camera) · consent checkbox (contact + privacy policy link) · submit button.
- **Desktop layout:** the left column has the H2, 3 numbered steps and a large phone number. The right column has a white form card, 640px wide, with Imię and Telefon side by side.
- **Upload limits shown to the user:** up to 5 photos, JPG/PNG/HEIC, max 10 MB each.
- The 5 states are described in the behaviour section below.
- Below the form: "Wolisz porozmawiać? **600 000 000**" (a tel: link).

### 7. Footer
Files: `*/07-footer`.
- **Desktop:**
  - a call strip on top ("Masz drzewo do wycięcia?" + orange button)
  - 4 columns: brand + description · Kontakt (phone, email, address, hours) · Obszar działania · Na stronie (links)
  - a bottom line: © 2026 [Nazwa Firmy] · NIP · Polityka prywatności
- **Mobile:** the same content stacked, with the phone in a green box with a call button. **Add 104px of bottom padding** so the sticky bar never covers the footer.

---

## 4. Behaviour

### Sticky mobile bar (`mobile/06-sticky-bar`)
- Fixed to the bottom of the screen on viewports **< 768px**.
- **Hidden while the hero's call button is on screen.** Show it once that button scrolls out of view, using an IntersectionObserver on the hero CTA. Slide it up over about 200ms, and respect `prefers-reduced-motion`.
- Contents:
  - a small line with a green dot and "Odbieramy teraz · do [19:00]"
  - two buttons in a row: orange **phone icon + "600 000 000"** (flex 1.7, 56px) and a green **"Zdjęcie"** with a camera icon (flex 1, links to `#formularz`)
- Wrap it in `<nav aria-label="Szybki kontakt">`. Pad the bottom with `env(safe-area-inset-bottom)` (at least 20px).
- Optional: outside working hours, change the line to "Zostaw zdjęcie — oddzwonimy rano" and swap the order so the photo button is the main one. Agree this with the client first.

### Sticky header (desktop, `desktop/06-sticky-header`)
- On viewports ≥ 768px, once the main header scrolls away, show a compact white header (72px tall, with a shadow). It contains the logo, nav, "Odbieramy teraz" and an orange "600 000 000" button.

### Before/after slider
- Two images stacked on top of each other. The "before" layer is clipped to the slider position (`clip-path: inset(0 X% 0 0)` or a width + overflow approach). It starts at 50%.
- A white vertical line plus a round handle (48px on mobile, 56px on desktop) with ‹ › arrows.
- Control it with a native `<input type="range">` (0–100, `aria-label="Porównaj zdjęcia przed i po"`). That gives keyboard support (arrow keys) and screen-reader support for free. The input can be invisible and stretched over the image, as in the mockup, but it **must show a visible focus ring** on the handle.
- Pointer dragging and tapping anywhere on the image should move the line.

### Form states
| State | Upload area | Submit button |
|---|---|---|
| `empty` | Dashed drop zone, camera icon, "Dodaj zdjęcia drzewa", limits, green "Wybierz zdjęcia" button. Desktop also supports drag and drop | Orange "Wyślij zgłoszenie" |
| `uploading` | One row per file: thumbnail, file name, progress bar plus % and size, × to cancel; queued files say "W kolejce"; finished files show ✓ "Gotowe" | Disabled, beige `#E7DFD0`, spinner, "Czekaj, wysyłamy zdjęcia…" |
| `ready` | Thumbnails plus "✓ 3 zdjęcia gotowe" plus "+ Dodaj" | Orange, enabled |
| `sent` | **The whole form is replaced** by a success panel in a `role="status"` region: green check circle, "Dziękujemy! Zgłoszenie wysłane.", "Mamy Twoje 3 zdjęcia. Oddzwonimy z wyceną [tego samego dnia roboczego]", thumbnails, orange "Pilne? Zadzwoń teraz", outline "Wyślij kolejne zgłoszenie" (resets the form) | n/a |
| `error` | Red 2px border. The failed file shows an alert icon, "IMG_xxxx.HEIC — nie wysłano", and the reason ("Plik jest za duży (14 MB). Maksymalnie 10 MB…"), plus "Spróbuj ponownie" and "Usuń plik" buttons | Orange, enabled |

**Field validation:** if the phone number is empty or invalid, give the field a red 2px border, the `#FDF3F2` background, `aria-invalid="true"`, and the message "Podaj numer — inaczej nie oddzwonimy." linked with `aria-describedby`. Validate when the user leaves the field (blur) and on submit, not on every keystroke.

**Uploads:** start uploading as soon as files are chosen; this is what the `uploading` state shows. Before uploading, check type and size on the device. Compressing images on the device (for example to a 2000px long edge) is recommended, because phone photos are large. Convert HEIC or accept it on the server.

**Backend:** none is specified. Use whatever the stack offers (a form endpoint, a serverless function or email). The submission must deliver the fields plus the photos to the owner, by email at minimum.

---

## 5. Accessibility and quality checklist
- [ ] Every tap target is ≥ 48px (call buttons 56px or more); chips are ≥ 44px.
- [ ] Text contrast is ≥ 4.5:1. The pairs in this file already pass; don't lighten the greys.
- [ ] Every input has a real `<label for>`; required fields are marked with `*` and `aria-required`.
- [ ] Icon-only buttons have an `aria-label`; decorative SVGs have `aria-hidden="true"`.
- [ ] Focus is visible on everything, including the slider handle and chips.
- [ ] Use proper landmarks: `header`, `nav`, `main`, `section` with a heading, `footer`.
- [ ] Polish characters render correctly (check ą ę ł ó ś ż ź ć ń in Archivo at weight 800).
- [ ] The layout has no horizontal scroll at 320px, 375px, 768px, 1024px and 1440px.
- [ ] Animations respect `prefers-reduced-motion`.

## 6. SEO and local business basics
- `<title>`: "Wycinka drzew [Miasto] — [Nazwa Firmy] | 20+ lat doświadczenia"
- A meta description in Polish, mentioning the city and the free quote.
- `LocalBusiness` JSON-LD with name, phone, address, `areaServed`, `openingHours` and `foundingDate`.
- An Open Graph image: a real team photo once the client supplies it.

## 7. Images (important)
- Use **only real photos** of the team, the equipment and their own jobs. **No stock photos** and no AI-generated images.
- Until the photos arrive, keep the striped placeholders with their labels. Each label says which shot is needed, so together they work as the photographer's shot list.
- Before/after pairs must be **taken from the same spot and angle**.
- Formats: AVIF or WebP with a JPG fallback, plus `srcset` and `loading="lazy"`, except the hero photo, which should be preloaded.
- Recommended ratios: hero 16:10 on desktop and roughly 4:3 on mobile; service cards 16:9; gallery pairs 4:3.

## 8. Placeholders to fill in (everything in [brackets])
`[Nazwa Firmy]` · `[ROK]` (year founded) · `[Miasto]` · `[Miejscowość]` (gallery captions, service area list) · `[50] km` (service radius) · phone `600 000 000` (a dummy; use the real number everywhere, including the tel: links) · `[pn–sob, 7:00–19:00]` and `[19:00]` · `[kontakt@twojadomena.pl]` · `[ul. Przykładowa 1, 00-000 Miasto]` · `[000-000-00-00]` (NIP) · all prices `od [___] zł` · `[brutto, z VAT]` · `[tego samego dnia roboczego]` (callback promise) · `[Imię Nazwisko]` · `[15] m` and other gallery details.

**Claims to confirm with the client before launch:** OC insurance, own equipment (lift, wood chipper, stump grinder), climbing work, the free on-site quote, free travel within the radius, 7-day emergency callouts after storms, and the callback promise.

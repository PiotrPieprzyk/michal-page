# Conventions

**Content.** Every visible string comes from `LandingContent` (`src/content/types.ts`). Sections get their slice plus `SiteSettings` as props and never import Sanity. `getContent()` (build time) merges Sanity over `seed.json`, so an empty CMS field falls back to the mockup copy. Use `fill(text, settings)` for `{tokens}` like `{telefon}`; build phone links with `telHref()`. When adding a field: `types.ts` → `seed.json` → `studio/schemas/index.ts` (same name, same nesting).

**Tokens.** Colours, shadows and utilities live in `src/app/globals.css` (`@theme`): `forest-900/800`, `beige-200/100/50`, `line`, `ink`, `ink-2`, `ink-3`, `on-green`, `accent`, `error*`. `bg-accent` is for call and submit buttons only. Use `container-page` for the 1280 px container with 16/32/80 px gutters and `section-pad` for section padding (44/32 → 96/80).

**Breakpoints.** Below `md` (768) is the mobile design. From `md` the sticky header replaces the sticky bar. `lg` (1024) switches to the desktop layouts from the mockups. Mobile/desktop copy variants are rendered as `<span class="lg:hidden">` / `<span class="hidden lg:inline">`.

**Primitives** (`src/components/ui`):
- `CallButton` is an orange `tel:` link; `track` names the place it sits, for analytics.
- `ArrowLink` is the tertiary link.
- `buttonStyles` holds the button looks.
- `SectionHeading` is the eyebrow + H2 + lead block.
- `Photo` shows a Sanity image, or the striped `Placeholder` with the shot label.
- `Icon` takes a fixed list of Lucide names and is always `aria-hidden`.
- `MultiLine` renders `\n` in CMS text as a line break.

**Analytics.** Don't call PostHog from server components. Add `data-call="<place>"` to tel: links or `data-photo-cta="<place>"` to form links; `Analytics.tsx` tracks them by delegation. Client components call `track()` from `src/lib/analytics.ts`.

**Accessibility.** Tap targets are ≥ 48 px (chips 44). Every input has a real `<label for>`. Errors are wired with `aria-invalid` and `aria-describedby`. Decorative SVGs are `aria-hidden`. Focus rings are global (`:focus-visible`; on green, wrap in `.on-dark`). Motion respects `prefers-reduced-motion`.

**Backend.** The upload limits (5 files, 10 MB, JPG/PNG/HEIC/WebP) appear in both `src/lib/image-compress.ts` and `functions/*`. Keep them in sync.

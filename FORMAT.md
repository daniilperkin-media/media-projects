# Section format v1

Every project contributes exactly one folder: `sections/<id>/`.
Use the repo folder name as `<id>` (e.g. `gta6-clipper`). Edit only your own folder — the build stamps everything into `index.html`, so nobody ever touches a shared file.

## Files

    sections/<id>/
      section.html   required — the whole section markup, starting with <section class="project" id="<id>">
      style.css      optional — auto-linked, section-scoped styles
      script.js      optional — auto-loaded (deferred) after the shared site.js
      assets/        your images (png/jpg/webp); reference as sections/<id>/assets/....png

`sections.json` already lists all five projects for the nav and placeholder cards — no edit needed: drop your `section.html` in, run `node build.mjs`, done.

## Look & feel

- Use the shared tokens (`var(--surface)`, `var(--text)`, `var(--accent)`, `var(--border)`, ...) from `assets/css/tokens.css`; light and dark themes are handled automatically.
- Light-theme tokens are WCAG-AA contrast-tuned (>=4.5:1); keep section colors on tokens instead of hardcoded hexes.
- `gta6-clipper` is the reference implementation — copy its section structure when in doubt.

## Components (shared CSS + JS)

- Image slot with caption + lightbox — any `.shot img` opens a click-to-zoom lightbox automatically:
      <figure class="shot"><img src="sections/<id>/assets/x.png" alt=""><figcaption>Caption</figcaption></figure>
- Image strip: wrap several `.shot`s in `<div class="strip">` (auto-fit grid).
- Two-column layout: `<div class="grid-2">` (stacks on mobile).
- Full-bleed media: add `class="bleed"` to a wrapper.
- Before/after slider (capture pairs):
      <div class="ba"><img class="a" src="before.png"><img class="b" src="after.png"><input type="range" value="50"></div>
      Give the range input an aria-label ("Original vs filtered"); a generic default is applied when missing.
- Stats row: `<div class="kpis"><div class="kpi"><b>123</b><span>label</span></div></div>`
- Code/console block: `<div class="card code"><h3>Title</h3><pre>...</pre></div>` — long lines scroll inside the card (grid children are `min-width:0`, so wide content never blows out the page).
- Interactive widget mount: `<div class="mount" id="..."></div>` — put markup + JS in your own files.

## Engine v2 — motion & identity (2026-10-09)

The contract above is unchanged; these are automatic and additive:

- **Reveal-on-scroll** — every top-level block of a section fades/slides in, staggered.
  Scripted captures must scroll the page (or call `window.__mpRevealAll()` first);
  `prefers-reduced-motion` disables the whole motion layer.
- **KPI count-ups** — a `<b>` starting with a plain integer (>1) counts up when
  scrolled into view; the final text is byte-identical. Suffixes starting with
  `-`, `/`, `.` or `,` (dates, ratios, decimals) stay static, as does anything
  non-numeric or containing an arrow pair (`215 → 43`); opt out per value with
  `<b data-static>`. `1080×1920` animates the leading number only.
- **Per-section hue** — the engine chrome (ghost chapter number, section hairline,
  KPI gradient, rail dot) uses `--sec`, mapped per section id in `tokens.css`;
  `--accent` stays the global brand accent. Use tokens, never hardcoded hexes.
- **Studio chrome** — scroll progress bar, section rail (>=1400px), scrollspy nav,
  `--grad` gradient token, bundled Space Grotesk + JetBrains Mono
  (`assets/css/fonts.css`, OFL licenses in `assets/fonts/`). Sections may still
  bundle their own fonts.
- **Before/after sliders** carry BEFORE/AFTER pill labels via CSS; the shared `.ba`
  markup and behaviour are unchanged.

## Engine v3 — studio UX (2026-10-18)

Additive; the section contract is unchanged.

- **Command palette** — `Ctrl/Cmd+K` (or `/`) opens a section jump list with the
  project's stack line; `↑/↓` move, `Enter` jumps, `Shift+Enter` copies a deep
  link, `Esc` closes. The nav's `Ctrl K` button opens it on touch.
- **Gallery lightbox** — every `.shot img` opens the section's images as a
  gallery: `←/→` step, `Home/End` jump, `Esc` closes, the counter and the
  figure's caption are shown; swipe on touch. Inner classes are `lb-*`; the
  overlay keeps a direct reference (no `.lb` querySelector).
- **Copy affordances** — every `.card pre` gets a Copy button; every section
  header gets a `#` permalink button. Both use the shared toast.
- **Skip link + `aria-current`** — keyboard users can skip the hero; the
  scrollspy marks the active nav/rail item.
- **Filmstrip containment** — `.strip.hscroll` now clips its `width:max-content`
  track (`overflow-x:clip`) so a 3+ image strip cannot widen the document. The
  sticky travel is unchanged.
- **Chapter-card gap** — `studio.js` inserts a 46 px spacer after the sticky
  chapter card unless the section already spaces its first block (e.g.
  daily-fact-poster's `.p-head + .chap + h3` rule). The card no longer covers
  the first heading at rest.
- **Parallax** — the capture parallax is now ±6 px at `scale(1.035)` (was
  ±16 px at `scale(1.07)`), so it no longer crops a visible edge band.
  Pixel-critical captures can opt out with `class="shot nopx"`.
- **Build metadata** — nav links carry `data-num` / `data-kind` for the palette;
  no section file needs an edit.
- **Theme** — the toggle crossfades through the View Transitions API where
  available; the `data-theme` attribute is still set synchronously.
- **Overlay state classes** — the body state classes are `pal-open` and
  `lb-open`; `.palette-open` is the nav button. Never reuse a component class
  on `body`: a shared name once turned the body into a flex container and
  widened the page to 11,679 px while every scripted check stayed green.

All new motion is gated by `prefers-reduced-motion`; the page remains
self-contained with zero external requests.

## Engine v4 — performance & navigation (2026-10-19)

- **WebP captures** — section images ship as WebP (quality 82) at roughly 2x their
  largest CSS display width; every `<img>` carries `width`/`height` plus
  `decoding="async"`, and everything below the first viewport is `loading="lazy"`.
  The first section's hero captures stay eager. When adding a capture: a 500 px
  slot wants a ~1000 px file, not the 1920 px original.
- **Section index** — the shell stamps a compact five-link index under the hero from
  `sections.json`, reusing the nav labels. It collapses to a summary row at 700 px
  and below (the shell's inline script drops `[open]` before first paint).
- **Back to top** — a fixed button appears once the hero has scrolled away; it
  returns to the top and focuses the `h1` for keyboard users.
- **Social/SEO head** — canonical URL, Open Graph + Twitter card, theme-color for
  both schemes and a real SVG favicon (`assets/favicon.svg`, plus a 180 px
  `assets/apple-touch-icon.png`) live in `shell/template.html`. `og:image` points
  at the OpenShorts source capture on the Pages URL (1200x675 WebP).
- **Image sizing** — width/height attributes are presentational hints: any CSS rule
  that sets `width` without `height` must also set `height:auto` (the `.ba`
  before/after slider needed it), or the attribute height wins and stretches the
  image.

## Rules

- UTF-8, no BOM; self-contained; no external requests (works offline on localhost).
- Rebuild after changing `section.html`: `node build.mjs`. Server: `node serve.mjs` → http://localhost:8124 (all other files are served live, no rebuild needed).

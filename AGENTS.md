# AGENTS.md — media-projects

Static showcase site for the five `daniilperkin-media` projects (`gta6-clipper`, `openshorts`, `daily-fact-poster`, `gothic-character-project`, `novel-translation`), deployed to GitHub Pages. See [`README.md`](./README.md) and [`FORMAT.md`](./FORMAT.md).

## Layout & Contract
- `shell/template.html` — page shell stamped by `build.mjs` (`@NAV@`, `@INDEX@`, `@INDEX_COUNT@`, `@SECTIONS@`, `@SECTION_STYLES@`, `@SECTION_SCRIPTS@`, `@TICKER@`)
- `assets/` — shared CSS tokens (`assets/css/tokens.css`, `base.css`, `components.css`), studio styles/motion (`studio.css`, `ui.css`, `site.js`, `studio.js`), local OFL fonts (`Space Grotesk`)
- `sections/<id>/` — one self-contained folder per project (`section.html` required, optional `style.css` / `script.js`, `assets/` WebP captures at ~2× CSS width)
- `sections/sections.json` — section order & metadata
- `index.html` — **generated output; never edit by hand**

## Rules
- Follow [`FORMAT.md`](./FORMAT.md) strictly (tokens instead of hardcoded hexes, `width`/`height` + `decoding="async"` on images, `loading="lazy"` below the fold, `prefers-reduced-motion` respected, self-contained with zero external requests).
- Edit only the target `sections/<id>/` folder unless changing shared engine behavior.
- UTF-8 without BOM.

## Build & CI Gates (`.github/workflows/pages.yml`)
```bash
node build.mjs                         # rebuild index.html from sections/
git diff --exit-code -- index.html     # CI fails if committed index.html is stale
node serve.mjs                         # local preview on http://localhost:8124
```

Always run `node build.mjs` after editing `sections/` or `shell/` and commit the regenerated `index.html` together with the source edits.

## Git
- Public repo: `origin` → `daniilperkin-media/media-projects`, branch `main` (pushing `main` deploys GitHub Pages).
- Plain English imperative commits; stage specific files only.

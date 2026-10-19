# media-projects

Showcase site for my Media workspace — one page, one section per project:
the GTA 6 clip pipeline, OpenShorts, the daily fact poster, the gothic
character project and the novel translation pipeline.

Built as the media sibling of `daniilperkin-media/uni-old-projects` — same
section contract and build — but with its own studio identity: bundled Space
Grotesk + JetBrains Mono (OFL), per-project accent hues, scroll-reveal
animations, KPI count-ups, a broadcast ticker, a section rail, a scroll
progress bar, a `Ctrl/Cmd+K` command palette, a gallery lightbox and copy
affordances, plus a compact section index and a back-to-top button. Captures
ship as WebP at 2x their display width with lazy loading below the fold.
Deploys to GitHub
Pages via Actions (`https://daniilperkin-media.github.io/media-projects/`
once the repo is pushed and Pages is enabled).

## Build & run

    node build.mjs            # stamps sections/<id>/section.html into index.html
    node serve.mjs            # serves this folder on http://localhost:8124

## Layout

- `shell/template.html` — page shell with `@NAV@` / `@SECTIONS@` / `@SECTION_STYLES@` / `@SECTION_SCRIPTS@` slots
- `assets/` — shared tokens, base styles, components, studio motion, the studio UX layer (`ui.css`: palette, gallery, copy, skip link), fonts (OFL), site.js (theme toggle, lightbox, before/after, reveals, rail, progress)
- `sections/<id>/` — one folder per project: `section.html` (required), optional `style.css` / `script.js`, `assets/` for images
- `sections/sections.json` — section order + placeholder metadata
- `index.html` — generated; never edit by hand

See `FORMAT.md` for the section contract.

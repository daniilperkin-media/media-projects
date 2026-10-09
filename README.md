# media-projects

Showcase site for my Media workspace — one page, one section per project:
the GTA 6 clip pipeline, OpenShorts, the daily fact poster, the gothic
character project and the novel translation pipeline.

Built as the media sibling of `daniilperkin-uni/uni-old-projects` — same
section contract and build — but with its own studio identity: bundled Space
Grotesk + JetBrains Mono (OFL), per-project accent hues, scroll-reveal
animations, KPI count-ups, a broadcast ticker, a section rail and a scroll
progress bar. Deploys to GitHub
Pages via Actions (`https://daniilperkin-media.github.io/media-projects/`
once the repo is pushed and Pages is enabled).

## Build & run

    node build.mjs            # stamps sections/<id>/section.html into index.html
    node serve.mjs            # serves this folder on http://localhost:8124

## Layout

- `shell/template.html` — page shell with `@NAV@` / `@SECTIONS@` / `@SECTION_STYLES@` / `@SECTION_SCRIPTS@` slots
- `assets/` — shared tokens, base styles, components, fonts (OFL), site.js (theme toggle, lightbox, before/after, reveals, rail, progress)
- `sections/<id>/` — one folder per project: `section.html` (required), optional `style.css` / `script.js`, `assets/` for images
- `sections/sections.json` — section order + placeholder metadata
- `index.html` — generated; never edit by hand

See `FORMAT.md` for the section contract.

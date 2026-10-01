# Quarto Reveal.js Themes

A collection of themes for [Quarto](https://quarto.org/) reveal.js presentations.
Every theme renders the same sample deck ([`template.qmd`](template.qmd)), so you
can compare them side by side on the
[live gallery](https://jansim.github.io/quarto-themes/).

| Theme | Format | Preview |
|-------|--------|---------|
| **Riso Zine**: two risograph inks on uncoated paper, with halftone fields and misregistered type | `riso-revealjs` | [![Riso Zine](screenshots/riso/overview.png)](https://jansim.github.io/quarto-themes/themes/riso.html) |

## Use

Add the themes to an existing project:

```bash
quarto add jansim/quarto-themes
```

then pick one in your document's front matter:

```yaml
format: riso-revealjs
```

Or start a new project from the sample deck:

```bash
quarto use template jansim/quarto-themes
```

## Repository layout

```
_extensions/<id>/      one Quarto extension per theme (contributes <id>-revealjs)
template.qmd           the shared sample deck every theme renders
themes/<id>.qmd        3-line page per theme: sets format, includes template.qmd
themes.yml             theme registry, drives the landing page listing
index.qmd              landing page (gallery of themes.yml)
_quarto.yml            website project: renders index.qmd + themes/*.qmd to _site/
scripts/screenshots.mjs  Playwright script: _site/themes/*.html -> screenshots/<id>/
scripts/new-theme.sh   scaffolds a new theme (extension, page, registry entry)
```

How the pieces fit together:

1. Each page in `themes/` only sets `format: <id>-revealjs` and pulls in the
   sample deck with `{{< include ../template.qmd >}}`. The page's `format` wins
   over the one in the template, so the same content renders with each theme.
2. `quarto render` builds the website: the landing page plus one deck per theme
   at `_site/themes/<id>.html`.
3. `npm run screenshots` opens each rendered deck in headless Chromium and
   captures the title, a section, the code and the table slides, plus a 2x2
   `overview.png`, into `screenshots/<id>/` (also copied into `_site/`).
4. The GitHub Actions workflow runs both steps and deploys `_site/` to
   GitHub Pages.

The template uses a fixed date and no executable code chunks, so renders are
deterministic and CI needs neither R nor Python.

## Development

Requirements: Quarto ≥ 1.4 and Node ≥ 18.

```bash
npm install
npx playwright install chromium   # once
npm run build                     # quarto render + screenshots
quarto preview                    # live preview while editing a theme
```

Commit the updated `screenshots/` so the README previews stay current.

### Adding a theme

```bash
scripts/new-theme.sh swiss "Swiss Grid"
```

This creates `_extensions/swiss/`, `themes/swiss.qmd` and a `themes.yml` entry.
Then style `_extensions/swiss/swiss.scss` and run `npm run build`.

Besides the usual Quarto/reveal.js elements, the sample deck uses a few classes
that every theme should style:

| Class | Used for |
|-------|----------|
| `[text]{.alert}` | strong emphasis in the accent colour |
| `[text]{.highlight}` | marker-style highlight |
| `[text]{.sticker}` | a small label or tag |

Section slides (`# Heading`) and the title slide are also worth giving a
distinct look.

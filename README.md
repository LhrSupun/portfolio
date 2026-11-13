# Lahiru Supun — Portfolio

A small, fast, dependency-free personal site. Pure HTML / CSS / JS. Ships well on
**GitHub Pages**.

## Structure

```
index.html            # all page content (semantic HTML)
styles.css            # design tokens + layout (CSS custom properties)
script.js             # tweaks panel, theme switch, scroll reveals, nav highlight, live clock
favicon.svg           # tab icon
apple-touch-icon.png  # home-screen icon (180×180)
og.png                # link-preview image (1200×630)
CNAME                 # custom domain for GitHub Pages
README.md
```

## How to edit content

Open **`index.html`** and edit text inline. Search for these markers:

| What                      | Where                                                         |
| ------------------------- | ------------------------------------------------------------- |
| Tagline / role            | `.hero__role`, the `<title>` tag and the meta descriptions    |
| "At a glance" panel       | `.panel__list` inside the hero (current role, location, …)    |
| About paragraphs          | `.lead` and `.about__body` inside `#about`                    |
| Quick facts / interests   | `.facts` `<dl>` block and `.interests` chips                  |
| Jobs                      | one `<li class="job">` per role inside `#experience`          |
| Stack groups              | `<article class="card bento__…">` blocks inside `#stack`      |
| Proficiency               | `.levels` list — add `class="on"` to as many pips as apply    |
| Education                 | `<li class="job">` inside `#education`                        |
| Email                     | `.contact__email` `href`/value and the copy button `data-copy` |
| Social / resume links     | `<ul class="links">` inside `#contact`, `.socials` in the hero |

Starting a new job? Update the first `.job`, the hero panel, the about paragraph
and `jobTitle` / `worksFor` in the JSON-LD block in `<head>`.

Two values keep themselves current: the years of experience (counted from
`data-years-since="2021-03"`) and the local time (Sri Lanka).

A **selected work** section is in `index.html` but commented out. Fill in the
cards, uncomment it and add a `work` link to the nav.

## How to change the look

Open **`styles.css`** — every visual decision is a CSS variable at the top
of the file under `:root`. Change `--accent`, `--bg`, `--fg`, fonts, spacing,
etc. and the rest of the page follows.

To add a new accent color, copy a `[data-accent="..."]` line and add a
matching swatch button in `index.html` (`<button class="swatch" ...>`).

The hero name is sized to span the page width. If you change the name or add a
font, re-measure `--name-fit`, `--name-fit-stacked` and `--name-shift` (see the
comment next to them).

## Theme / accent / font

The site supports **dark/light themes, accent colors, background effects and
font pairings**. They live as `data-` attributes on `<html>` and persist via
`localStorage`. The sun/moon button in the nav flips the theme; the Tweaks
panel lets visitors change the rest at runtime (it can be removed if you don't
want it on the live site). The "JetBrains Mono" font option is the original
all-monospace look.

## Preview locally

```
python3 -m http.server 4173
```

Then open <http://localhost:4173>.

## Hosting on GitHub Pages

1. Create a public repo (e.g. `your-username.github.io` for a user site,
   or any name for a project site).
2. Commit these files at the repo root.
3. In **Settings → Pages**, set the source to `main` / `/ (root)`.
4. Done — visit `https://<user>.github.io/` (or `https://<user>.github.io/<repo>/`).

After changing `styles.css` or `script.js`, bump the `?v=` number on their
tags in `index.html` so returning visitors get the new files.

No build step. No framework. Just files.

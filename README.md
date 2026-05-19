# Lahiru Supun — Portfolio

A small, fast, dependency-free personal site. Pure HTML / CSS / JS. Ships well on
**GitHub Pages**.

## Structure

```
index.html      # all page content (semantic HTML)
styles.css      # design tokens + layout (CSS custom properties)
script.js       # theme/accent/font tweaks + smooth scrolling
README.md
```

## How to edit content

Open **`index.html`** and edit text inline. Search for these markers:

| What                  | Where                                        |
| --------------------- | -------------------------------------------- |
| Tagline / role        | `.hero__role` and `<title>` tag              |
| About paragraphs      | `.about__body` inside `#about`               |
| Quick facts           | `.facts` `<dl>` block                        |
| Email                 | `.contact__email` `href` and value           |
| Social / resume links | `<ul class="links">` inside `#contact`       |

## How to change the look

Open **`styles.css`** — every visual decision is a CSS variable at the top
of the file under `:root`. Change `--accent`, `--bg`, `--fg`, fonts, spacing,
etc. and the rest of the page follows.

To add a new accent color, copy a `[data-accent="..."]` block and add a
matching swatch button in `index.html` (`<button class="swatch" ...>`).

## Theme / accent / font

The site supports **dark/light themes, accent colors, and font choices**.
They live as `data-` attributes on `<html>` and persist via `localStorage`.
A small Tweaks panel in `index.html` lets visitors change them at runtime
(can be removed if you don't want it on the live site).

## Hosting on GitHub Pages

1. Create a public repo (e.g. `your-username.github.io` for a user site,
   or any name for a project site).
2. Commit these files at the repo root.
3. In **Settings → Pages**, set the source to `main` / `/ (root)`.
4. Done — visit `https://<user>.github.io/` (or `https://<user>.github.io/<repo>/`).

No build step. No framework. Just files.

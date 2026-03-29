# nanoranch

A static single-page website for [nanoranch.org](https://nanoranch.org) — a rewilding platform promoting native habitat restoration at any scale.

## Project structure

```
index.html          Main (and only) page
css/main.css        All styles — single file, no build step
js/main.js          All scripts — colour bar, scroll, hamburger menu
_partials/          Reusable HTML fragments (nav.html, footer.html)
seed/               Reference/archived content (Being Lori memorial page)
memory/             Linked assets (e.g. PDF linked from the About section)
favicon.ico / .svg  Favicons
```

No build tools, no bundler, no framework. Everything ships as-is.

## Design system

**Fonts** — `Crimson Pro` (serif, headings) · `Outfit` (sans-serif, body)

**CSS variables** — theming is driven entirely by CSS custom properties on `:root`. The JS colour-bar swaps a small set of variables at runtime; never hardcode colours in component rules.

Key variables:
- `--black` / `--white` — primary background and surface colours (inverted in light theme)
- `--fg` — foreground/accent that opposes `--black`
- `--ink` — permanent dark text for light-background sections (Mission, Scale, Pillars); **never changes between themes**
- `--text-dark` — muted body text, always AAA-compliant against `--black`
- `--nav-bg` — semi-transparent nav background

**Colour bar** — nine swatches: black (default dark) · ROYGBIV hues · white (light). Each ROYGBIV theme derives its palette via `makeVars()` in `main.js`. Clicking the active non-default swatch resets to dark.

## Accessibility standards

This project targets **WCAG 2.1 AAA** throughout:
- Text contrast ≥ 7:1 (SC 1.4.6)
- Non-text contrast ≥ 3:1 (SC 1.4.11)
- Mobile menu has a full focus trap (SC 2.4.3)
- ARIA toolbar pattern on the colour bar (arrow-key navigation)
- `aria-pressed` state on colour swatches; `aria-expanded` + `aria-controls` on the hamburger toggle

Always verify contrast ratios when adding or changing colours. Comments in `main.css` and `main.js` document the computed ratios — keep them up to date.

## Mobile menu

The `.mobile-menu` overlay is a **sibling of `<nav>`**, not a child. This is intentional: `backdrop-filter` on the nav creates a containing block that clips fixed/absolute descendants to the nav's height. Do not move it inside `<nav>`.

## Conventions

- No external JS dependencies — vanilla ES5-compatible code only (IIFEs, `var`, no arrow functions).
- Prefer updating existing CSS variables over adding new ones.
- Section IDs (`#mission`, `#mosaic`, `#memory`, `#join`) are the anchor targets for both desktop and mobile nav links.
- Anchor clicks are intercepted in JS to scroll without writing a hash to the URL; `history.scrollRestoration = 'manual'` keeps refreshes landing at the top.

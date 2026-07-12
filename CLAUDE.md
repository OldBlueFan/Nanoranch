# nanoranch

A static single-page website for [nanoranch.org](https://nanoranch.org) — a personal rewilding project (soil / space / soul) with a symbolic typographic mark `};{` whose elements animate into each section, on a dusk/dawn cosmic backdrop.

The design source of truth is the handoff bundle at `~/Sites/nanoranch/design_handoff_nanoranch_homepage/` (README + `nanoranch.dc.html` behavioral reference + `design_system/`). The token files and SVG assets in this repo are verbatim copies from that bundle.

## Project structure

```
index.html          Main (and only) page
css/main.css        All component styles — imports css/tokens/
css/tokens/         Design tokens (fonts, colors, typography, spacing, motion) — copied verbatim from the design handoff; edit upstream, not ad hoc
js/main.js          All behavior — state machine (home|soil|space|soul), mark flight animations (FLIP), stars, focus management, scroll-in nav
assets/             labradorite.svg (animated horizon stone), navstone.svg (nav iridescence), grass.svg — from the handoff, used as-is
seed/               Reference/archived content (Being Lori memorial page)
memory/             Linked assets from the previous site (kept for inbound links)
hero-spike/         Earlier Vite+React hero exploration — superseded by the current site, not served
favicon.ico / .svg  Favicons
```

No build tools, no bundler, no framework. Everything ships as-is.

Note: `labradorite.svg` is fetched and inlined by `js/main.js` because its facet-flash/light-sweep animations reference page-level keyframes (`labFlashA/B`, `labSweep` in `main.css`) — as an `<img>` it renders static. `navstone.svg` is intentionally a static CSS `background-image` on the nav and teaser strip.

## Deployment

The live site is hosted on **Dreamhost** and serves the `main` branch. Deploying means getting your change onto `main` and pushing `main` to both remotes:

- `origin` — GitHub (`git@github.com:OldBlueFan/Nanoranch.git`)
- `dreamhost` — the live host (`ssh://malloy@pdx1-shared-a2-06.dreamhost.com/~/nanoranch.org.git`)

**If you're working directly on `main` with a clean tree**, the quick path is:

```sh
git add . && git commit -m 'describe change' && git push origin main && git push dreamhost main
```

**Active work usually happens on a feature branch** (e.g. `feat/welcome-screen-updates`) and the tree may have unrelated uncommitted WIP (the `seed/` app). In that case, don't `git add .` on `main` — it would sweep in the WIP. Instead:

```sh
# on your feature branch, commit only the files you want to ship
git add <files> && git commit -m 'describe change'

# stash anything still uncommitted so you can switch branches cleanly
git stash push -u -m 'WIP'

git checkout main
git pull --ff-only origin main      # main is often behind; fast-forward first
git merge <feature-branch>
git push origin main && git push dreamhost main

# return to your work and restore the WIP
git checkout <feature-branch>
git stash pop
```

Replace `describe change` with a real commit message. Both pushes target `main`.

## Design system

**Fonts** — `Crimson Pro` (variable, incl. italic; display AND body) · `Outfit` (strictly tracked-uppercase labels, buttons, nav, card titles). Loaded from Google Fonts via `css/tokens/fonts.css`.

**Tokens** — everything themes through the CSS custom properties in `css/tokens/` (sky scale, text/border alpha ladders, gold accent, typography, spacing, motion). Never hardcode a colour that a token covers; the gold accent (`--accent-gold*`) is the only foreground accent (focus rings, card hairlines, active-card strokes, in-card links).

**The mark `};{`** — always live type: Crimson Pro italic, weight 480, monochrome white. Its elements carry the brand animations: braces = butterfly wings / birds (SOUL), comma = sapling (SOIL), dot = star (SPACE). Tracked caps always pair `letter-spacing` with an equal `text-indent` to stay optically centered.

**Voice** — first person singular, compact poetic fragments, triads ("soil, space, and soul"), sentence case for prose, tracked FULL CAPS for wayfinding only, no emoji, no exclamation marks. Status copy: "In development — check back."

## Behavior (js/main.js)

- State machine: `home | soil | space | soul`. Section buttons/nav links call `go(mode)`; the lockup calls `goHome()`.
- Mark flights use FLIP: measure the glyph's live bounding rect, clone it fixed at that position, transition `transform: translate(...) scale(...)` to the section's home position (1.7s, `--ease-flight`), then loop an idle animation. Never hardcode flight positions.
- Section content reveals at 950ms mid-flight; nav shows when `scrollY > 60` or a section is active (cross-fading with the 10px navstone teaser strip).
- Stars are generated with a seeded LCG (seed 42, 150 stars) so the field is stable and matches the design reference.

## Accessibility standards (WCAG 2.2 AA — non-negotiable)

- Every interactive element shows the gold focus ring (`--focus-ring`, offset 3px; 8px inside cards). Never remove outlines without replacing them.
- Small text on the dusk sky uses white at ≥ .62 alpha (`--text-dim` floor ≈ 4.5:1). Nav text over navstone requires `--overlay-nav-protect` + `--shadow-nav-text`.
- Wordmark is the page `<h1>`; section labels are `<h2>`s; card toggles are real `<button>`s with `aria-expanded`; card notes are `aria-live="polite"`; a card's external link renders *outside* its button.
- Focus management: entering a section moves focus to its `<h2>`; returning home focuses the first hero button. Hidden UI also gets `visibility: hidden` / `display: none` so it can't be tabbed into.
- External links get the 11px new-window arrow (the brand's only icon) + "(opens in new window)" aria-label.
- `prefers-reduced-motion` snaps everything to final states (global rule in `css/tokens/motion.css`, plus the reduced branch in `go()`).

## Browser fallbacks (keep these)

- `.nr-vh` — `min-height: 100vh` class under an inline `100svh` style; browsers without `svh` fall back to the class.
- `@supports not (backdrop-filter …)` — `.nr-glass` solidifies glass surfaces; `.nr-glass-nav` darkens the navstone overlay.

## Conventions

- No external JS dependencies — vanilla JS, no framework, single IIFE in `js/main.js`.
- Prefer updating existing tokens over adding new variables.
- Responsive breakpoint is 700px (`--breakpoint-narrow`): section views become a scrollable column, cards stack full-width, the flown mark element drops behind content (`z-index` 15 < section layer 20).
- Local preview: `.claude/launch.json` serves the repo on :8917 (`site`) and the design handoff bundle on :8918 (`handoff-reference`).

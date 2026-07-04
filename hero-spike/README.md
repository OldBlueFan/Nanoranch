# nanoranch hero spike

Standalone spike for the nanoranch.org homepage hero: a scroll-driven
cinematic sequence that opens in **cosmic dark** and scrolls **into
daylight**. React + Vite + GSAP/ScrollTrigger, no backend, isolated from
the static site at the repo root.

```sh
npm install
npm run dev
```

## Status: foundation pass

- Design tokens in `src/styles/tokens.css` — three tiers: fixed **night**
  endpoints, fixed **day** endpoints (⚠ provisional, see the comment
  block), and the **live** set components actually use. The future
  night→day scroll tween animates only the live tokens.
- Static full-viewport night hero: gradient void, CSS-only iridescent
  shimmer, two-depth starfield, centered `};{` mark placeholder.
- GSAP + ScrollTrigger registered through `src/lib/motion.js`; all
  choreography gates behind `prefers-reduced-motion: no-preference`.

Not built yet (by design): the scroll-driven night→day tween, mark
entrance animation, content below the hero.

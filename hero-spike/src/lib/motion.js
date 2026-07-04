/* Single home for GSAP setup. Import gsap/ScrollTrigger from here,
   never directly, so plugin registration happens exactly once. */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const REDUCED = '(prefers-reduced-motion: reduce)';
export const NO_PREFERENCE = '(prefers-reduced-motion: no-preference)';

/* Layer 3: component-level branch for logic that isn't a tween
   (e.g. choosing a static composition over a sequenced one). */
export function prefersReducedMotion() {
  return window.matchMedia(REDUCED).matches;
}

/* Layer 2: every piece of scroll choreography registers inside
   mm.add(NO_PREFERENCE, ...) so reduced-motion users get the
   static composition automatically — including live changes if
   the OS setting flips while the page is open. */
export function createMotionContext() {
  return gsap.matchMedia();
}

/* dev-only handle so tests/tooling can inspect what registered */
if (import.meta.env.DEV) {
  window.__motion = { gsap, ScrollTrigger };
}

export { gsap, ScrollTrigger };

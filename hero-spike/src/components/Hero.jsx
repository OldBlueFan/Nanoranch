import { useEffect, useRef } from 'react';
import { ScrollTrigger, createMotionContext, NO_PREFERENCE } from '../lib/motion';
import Mark from './Mark';
import './hero.css';

/* Static night composition — foundation pass. The scroll-driven
 * night→day sequence lands in a later stage; this only proves the
 * ScrollTrigger pipeline and the reduced-motion gate it will use. */
export default function Hero() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const mm = createMotionContext();
    mm.add(NO_PREFERENCE, () => {
      // Smoke setup: no visual effect yet. Later stages replace this
      // with the night→day token tween on the same trigger shape.
      const trigger = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: 'bottom top',
      });
      return () => trigger.kill();
    });
    return () => mm.revert();
  }, []);

  return (
    <section className="hero" ref={sectionRef}>
      <div className="hero__shimmer" aria-hidden="true" />
      <div className="hero__stars hero__stars--far" aria-hidden="true" />
      <div className="hero__stars hero__stars--band" aria-hidden="true" />
      <div className="hero__stars hero__stars--mid" aria-hidden="true" />
      <div className="hero__stars hero__stars--near" aria-hidden="true" />
      <div className="hero__stars hero__stars--bright" aria-hidden="true" />
      <Mark />
    </section>
  );
}

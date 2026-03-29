/**
 * AnimatedBackground — subtle butterfly and bird silhouettes that drift
 * across the welcome screen. Pure CSS animations; no JS position calculations.
 *
 * Accessibility: entire container is aria-hidden and role="presentation".
 * Respects prefers-reduced-motion via CSS (see AnimatedBackground.css).
 */
import styles from './AnimatedBackground.module.css'

/* ── SVG shapes ── */

function Butterfly({ className, style }) {
  return (
    <div className={`${styles.creature} ${className}`} style={style} aria-hidden="true">
      <svg
        className={styles.butterflySvg}
        viewBox="0 0 48 32"
        xmlns="http://www.w3.org/2000/svg"
        focusable="false"
      >
        {/* Left upper wing */}
        <path className={`${styles.wing} ${styles.wingTopLeft}`}
          d="M24 14 C18 4, 4 2, 2 10 C0 18, 10 22, 24 18 Z" />
        {/* Left lower wing */}
        <path className={`${styles.wing} ${styles.wingBotLeft}`}
          d="M24 18 C14 20, 4 28, 6 30 C10 32, 20 28, 24 22 Z" />
        {/* Right upper wing */}
        <path className={`${styles.wing} ${styles.wingTopRight}`}
          d="M24 14 C30 4, 44 2, 46 10 C48 18, 38 22, 24 18 Z" />
        {/* Right lower wing */}
        <path className={`${styles.wing} ${styles.wingBotRight}`}
          d="M24 18 C34 20, 44 28, 42 30 C38 32, 28 28, 24 22 Z" />
        {/* Body */}
        <ellipse cx="24" cy="16" rx="1.5" ry="7"
          style={{ fill: 'var(--creature-stroke)' }} />
        {/* Antennae */}
        <path d="M23 9 Q20 4 18 2" stroke="var(--creature-stroke)"
          strokeWidth="0.8" fill="none" />
        <path d="M25 9 Q28 4 30 2" stroke="var(--creature-stroke)"
          strokeWidth="0.8" fill="none" />
      </svg>
    </div>
  )
}

function Bird({ className, style }) {
  return (
    <div className={`${styles.creature} ${className}`} style={style} aria-hidden="true">
      <svg
        className={styles.birdSvg}
        viewBox="0 0 50 24"
        xmlns="http://www.w3.org/2000/svg"
        focusable="false"
      >
        {/* Body */}
        <ellipse cx="22" cy="14" rx="10" ry="4"
          style={{ fill: 'var(--creature-fill)' }} />
        {/* Tail */}
        <path d="M12 14 L4 10 L4 18 Z"
          style={{ fill: 'var(--creature-fill)' }} />
        {/* Head */}
        <circle cx="31" cy="12" r="4"
          style={{ fill: 'var(--creature-fill)' }} />
        {/* Beak */}
        <path d="M35 11.5 L42 12 L35 12.5 Z"
          style={{ fill: 'var(--creature-stroke)' }} />
        {/* Wing */}
        <path className={styles.birdWing}
          d="M18 12 C20 4, 32 3, 34 10 C28 7, 20 10, 18 12 Z"
          style={{ fill: 'var(--creature-stroke)' }} />
      </svg>
    </div>
  )
}

/* ── Creature instances with staggered timing/positions ── */

const BUTTERFLIES = [
  { style: { '--tx': '8vw',  '--ty': '18vh', '--delay': '0s',    '--dur': '18s', '--scale': '0.7' } },
  { style: { '--tx': '55vw', '--ty': '60vh', '--delay': '-6s',   '--dur': '22s', '--scale': '0.5' } },
  { style: { '--tx': '80vw', '--ty': '30vh', '--delay': '-12s',  '--dur': '16s', '--scale': '0.9' } },
  { style: { '--tx': '30vw', '--ty': '75vh', '--delay': '-3s',   '--dur': '20s', '--scale': '0.6' } },
]

const BIRDS = [
  { style: { '--ty': '12vh', '--delay': '0s',   '--dur': '28s' } },
  { style: { '--ty': '42vh', '--delay': '-10s',  '--dur': '35s' } },
  { style: { '--ty': '70vh', '--delay': '-20s',  '--dur': '30s' } },
]

export default function AnimatedBackground() {
  return (
    <div
      className={styles.canvas}
      aria-hidden="true"
      role="presentation"
    >
      {BUTTERFLIES.map((b, i) => (
        <Butterfly key={i} className={styles.butterfly} style={b.style} />
      ))}
      {BIRDS.map((b, i) => (
        <Bird key={i} className={styles.bird} style={b.style} />
      ))}
    </div>
  )
}

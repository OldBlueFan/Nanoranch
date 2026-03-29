/**
 * ButtonSeeds — dandelion seeds that spawn from beneath the "Get Seeding"
 * button and drift across the full viewport in all 8 compass directions.
 *
 * The canvas is position:fixed so seeds escape their DOM container and
 * travel to the viewport edges. dx/dy are expressed in viewport units so
 * travel distance scales with screen size.
 */
import styles from './ButtonSeeds.module.css'

/* 8 seeds, one per compass direction.
   dx / dy use viewport units (strings) so seeds always reach the screen edges.
   Each has a unique duration, delay, and rotate for organic variety. */
const SEEDS = [
  { dx:  '0vw',   dy: '-52vh',  delay: '0s',    rot:  '8deg', dur: '6.0s' }, // N
  { dx:  '42vw',  dy: '-38vh',  delay: '1.1s',  rot: '-6deg', dur: '6.8s' }, // NE
  { dx:  '54vw',  dy:  '0vh',   delay: '2.0s',  rot: '16deg', dur: '6.2s' }, // E
  { dx:  '40vw',  dy:  '42vh',  delay: '0.5s',  rot: '-13deg',dur: '6.5s' }, // SE
  { dx:  '0vw',   dy:  '52vh',  delay: '1.4s',  rot:  '7deg', dur: '6.1s' }, // S
  { dx: '-40vw',  dy:  '42vh',  delay: '2.3s',  rot: '-9deg', dur: '6.7s' }, // SW
  { dx: '-54vw',  dy:  '0vh',   delay: '0.8s',  rot: '19deg', dur: '6.3s' }, // W
  { dx: '-42vw',  dy: '-38vh',  delay: '1.7s',  rot: '-11deg',dur: '6.6s' }, // NW
]

function SeedSVG() {
  return (
    <svg
      className={styles.svg}
      viewBox="0 0 20 32"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
    >
      {/* Pappus filaments */}
      <line x1="10" y1="10" x2="4"  y2="2"  />
      <line x1="10" y1="10" x2="7"  y2="1"  />
      <line x1="10" y1="10" x2="10" y2="0"  />
      <line x1="10" y1="10" x2="13" y2="1"  />
      <line x1="10" y1="10" x2="16" y2="2"  />
      <line x1="10" y1="10" x2="3"  y2="5"  />
      <line x1="10" y1="10" x2="17" y2="5"  />
      {/* Seed body */}
      <circle cx="10" cy="11" r="1.5" fill="currentColor" stroke="none" />
      {/* Stem */}
      <line x1="10" y1="12" x2="10" y2="28" strokeWidth="0.75" />
    </svg>
  )
}

export default function ButtonSeeds({ active }) {
  return (
    <div
      className={`${styles.canvas} ${active ? styles.active : ''}`}
      aria-hidden="true"
    >
      {SEEDS.map((s, i) => (
        <div
          key={i}
          className={styles.seed}
          style={{
            '--dx':    s.dx,
            '--dy':    s.dy,
            '--delay': s.delay,
            '--rot':   s.rot,
            '--dur':   s.dur,
          }}
        >
          <SeedSVG />
        </div>
      ))}
    </div>
  )
}

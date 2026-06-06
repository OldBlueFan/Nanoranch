import styles from './DandelionSeeds.module.css'

/* Five seeds with staggered positions and timings */
const SEEDS = [
  { x: '15%', delay: '0s',    drift: '-8px'  },
  { x: '30%', delay: '1.2s',  drift: '10px'  },
  { x: '55%', delay: '0.5s',  drift: '-6px'  },
  { x: '70%', delay: '2.1s',  drift: '12px'  },
  { x: '85%', delay: '1.7s',  drift: '-10px' },
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

export default function DandelionSeeds() {
  return (
    <div className={styles.canvas} aria-hidden="true">
      {SEEDS.map((s, i) => (
        <div
          key={i}
          className={styles.seed}
          style={{
            '--x':     s.x,
            '--delay': s.delay,
            '--drift': s.drift,
          }}
        >
          <SeedSVG />
        </div>
      ))}
    </div>
  )
}

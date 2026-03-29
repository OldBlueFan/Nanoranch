import styles from './DandelionSeeds.module.css'

/* Each seed: position + animation stagger */
const SEEDS = [
  { style: { '--x': '12%',  '--delay': '0s',    '--drift': '-8px'  } },
  { style: { '--x': '30%',  '--delay': '2.4s',  '--drift':  '6px'  } },
  { style: { '--x': '52%',  '--delay': '0.8s',  '--drift': '-5px'  } },
  { style: { '--x': '70%',  '--delay': '3.6s',  '--drift':  '10px' } },
  { style: { '--x': '88%',  '--delay': '1.6s',  '--drift': '-7px'  } },
]

function Seed({ style }) {
  return (
    <div className={styles.seed} style={style} aria-hidden="true">
      <svg viewBox="0 0 20 32" xmlns="http://www.w3.org/2000/svg"
           focusable="false" aria-hidden="true"
           className={styles.svg}
           fill="none" stroke="currentColor"
           strokeWidth="1" strokeLinecap="round">
        {/* Pappus filaments */}
        <line x1="10" y1="8" x2="10" y2="2" />
        <line x1="10" y1="8" x2="15" y2="3" />
        <line x1="10" y1="8" x2="17" y2="8" />
        <line x1="10" y1="8" x2="15" y2="13" />
        <line x1="10" y1="8" x2="5"  y2="13" />
        <line x1="10" y1="8" x2="3"  y2="8" />
        <line x1="10" y1="8" x2="5"  y2="3" />
        {/* Seed body */}
        <circle cx="10" cy="8" r="2.5" />
        {/* Stem */}
        <line x1="10" y1="10" x2="10" y2="28" />
      </svg>
    </div>
  )
}

export default function DandelionSeeds() {
  return (
    <div className={styles.canvas} aria-hidden="true" role="presentation">
      {SEEDS.map((s, i) => <Seed key={i} style={s.style} />)}
    </div>
  )
}

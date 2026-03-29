import styles from './CreatureIcons.module.css'

const CREATURES = [
  {
    label: 'Butterfly',
    // Top-view: two upper wings + two lower wings + slim body
    path: 'M16 12C13 4 2 3 2 9c0 5 7 8 14 6M16 12c3-8 14-9 14-3 0 5-7 8-14 6M16 18c-3 4-10 9-8 12 2 2 7-4 7-9M16 18c3 4 10 9 8 12-2 2-7-4-7-9',
    body: <line x1="16" y1="9" x2="16" y2="23" strokeWidth="1.5" strokeLinecap="round"/>,
  },
  {
    label: 'Bird',
    // Flying side silhouette: body + swept wing + tail
    path: 'M3 18c4-7 10-5 15-7 5-2 9 1 7 5-2 1-6-1-8 2-2 3 0 6-4 7-3 1-6-1-6-4 0-2 1-3 0-4-1-1-3 0-4 1M18 11c2-3 5-4 7-3',
    body: null,
  },
  {
    label: 'Possum',
    // Side profile: round body + pointed snout + curled tail
    path: 'M8 20c-2-4-1-10 3-12 3-2 8-1 11 2 2 2 2 5 0 7-1 1-3 2-5 2H8M19 17c2 1 4 3 3 5-1 2-3 0-3-2M5 20c0 2 1 4 3 4M8 10c-1-1-2-1-3 0',
    body: null,
  },
  {
    label: 'Caterpillar',
    // Bumpy segmented body with head + antennae
    path: 'M4 17c0-3 3-3 3 0s3 3 3 0 3-3 3 0 3-3 3 0 3-3 3 0c0 2-1 3-2 3H6c-1 0-2-1-2-3zM22 14c1-1 3-1 3 1M24 14l1-3M21 14l-1-3',
    body: null,
  },
  {
    label: 'Anole',
    // Slender lizard: long tapered body + legs + dewlap hint
    path: 'M4 18c0-4 4-6 9-5 4 1 7 0 10-3 2-2 4-2 5-1 1 1 0 3-2 3-1 0-3-1-4 1-1 2 0 5-3 6H8c-2 0-4-1-4-1zM8 19l-1 4M12 19l-1 4M6 13c-1-1-2-1-2 0',
    body: null,
  },
  {
    label: 'Hummingbird',
    // Round body + long beak + swept wings
    path: 'M9 15c0-4 3-6 7-5 3 1 5 3 5 5 0 3-2 5-5 5-4 0-7-2-7-5zM16 13c3-2 6-3 8-2M2 15h7M14 20l-1 4c-1 1 1 2 2 1l1-4',
    body: null,
  },
  {
    label: 'Moth',
    // Broad rounded wings + fat body + feathery antennae
    path: 'M16 13C13 6 2 6 2 11c0 4 6 7 14 6M16 13c3-7 14-7 14-2 0 4-6 7-14 6M16 19c-2 3-7 7-5 9 1 2 5-3 5-8M16 19c2 3 7 7 5 9-1 2-5-3-5-8M14 10c-1-2-3-3-4-2M18 10c1-2 3-3 4-2',
    body: <ellipse cx="16" cy="15" rx="1.5" ry="5" />,
  },
  {
    label: 'Owl',
    // Forward-facing: round head + ear tufts + big eyes + stout body
    path: 'M16 4c-5 0-9 4-9 9 0 6 4 10 9 11 5-1 9-5 9-11 0-5-4-9-9-9zM11 13c0-2 2-3 3-3s3 1 3 3-2 3-3 3-3-1-3-3zM17 13c0-2 2-3 3-3s3 1 3 3-2 3-3 3-3-1-3-3zM13 4c-1-2-2-2-3-1M19 4c1-2 2-2 3-1M15 16h2',
    body: null,
  },
]

export default function CreatureIcons() {
  return (
    <div className={styles.row} aria-label="Wildlife that benefits from rewilding" role="list">
      {CREATURES.map(({ label, path, body }) => (
        <div key={label} className={styles.icon} role="listitem" aria-label={label} title={label}>
          <svg
            viewBox="0 0 32 32"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            focusable="false"
            className={styles.svg}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={path} />
            {body}
          </svg>
          <span className={styles.label}>{label}</span>
        </div>
      ))}
    </div>
  )
}

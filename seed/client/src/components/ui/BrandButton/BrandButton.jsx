/**
 * BrandButton — renders the "nano};{ranch / [action]" button pattern.
 *
 * Variants:
 *   light — light-green background (secondary actions)
 *   dark  — deep-green background  (primary CTA)
 *
 * Can render as <button> or <a> (when `href` is provided).
 */
import styles from './BrandButton.module.css'

export default function BrandButton({
  variant = 'light',
  action,
  icon,        // 'play' | undefined
  href,
  external,    // true → opens in new tab + adds ↗ indicator
  onClick,
}) {
  const inner = (
    <>
      <span className={styles.prefix} aria-hidden="true">
        nano<span className={styles.glyph}>{'};{'}</span>ranch
      </span>
      <span className={styles.divider} aria-hidden="true">/</span>
      <span className={styles.action}>
        {icon === 'play' && (
          <span className={styles.playIcon} aria-hidden="true">▶</span>
        )}
        {action}
        {external && (
          <span className={styles.extIcon} aria-hidden="true">↗</span>
        )}
      </span>
      {/* Screen-reader-only context for external links */}
      {external && <span className="sr-only"> (opens in new tab)</span>}
    </>
  )

  const cls = `${styles.btn} ${styles[variant]}`

  if (href) {
    return (
      <a
        href={href}
        className={cls}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
      >
        {inner}
      </a>
    )
  }

  return (
    <button type="button" className={cls} onClick={onClick}>
      {inner}
    </button>
  )
}

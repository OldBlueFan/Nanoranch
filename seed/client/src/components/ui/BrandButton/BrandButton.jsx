/**
 * BrandButton — renders the "nano};{ranch / [action]" button pattern.
 *
 * Variants:
 *   light — light-green background (secondary actions)
 *   dark  — deep-green background  (primary CTA)
 *   blue  — muted blue background  (tertiary/login)
 *
 * Modifiers:
 *   large  — slightly larger padding and font (for primary CTA)
 *   suffix — appended after action label in muted text (e.g. "start", "login")
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
  large,       // boolean — larger sizing for primary CTA
  suffix,      // string — muted label after action text
  'aria-expanded': ariaExpanded,
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
        {suffix && (
          <span className={styles.suffix} aria-hidden="true">({suffix})</span>
        )}
        {external && (
          <span className={styles.extIcon} aria-hidden="true">↗</span>
        )}
      </span>
      {/* Screen-reader-only context for external links */}
      {external && <span className="sr-only"> (opens in new tab)</span>}
    </>
  )

  const cls = [
    styles.btn,
    styles[variant],
    large ? styles.large : '',
  ].filter(Boolean).join(' ')

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
    <button
      type="button"
      className={cls}
      onClick={onClick}
      aria-expanded={ariaExpanded}
    >
      {inner}
    </button>
  )
}

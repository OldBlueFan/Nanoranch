/**
 * BrandButton — stacked layout: wordmark on top, action below.
 *
 * Variants:  light | dark | blue
 * Modifiers: large — noticeably taller/bolder (primary CTA)
 * Props:     suffix — muted parenthetical after action label
 *            icon   — 'play' shows a ▶ before action text
 */
import styles from './BrandButton.module.css'

export default function BrandButton({
  variant = 'light',
  action,
  icon,
  href,
  external,
  onClick,
  large,
  suffix,
  'aria-expanded': ariaExpanded,
}) {
  const inner = (
    <>
      {/* Row 1 — brand wordmark */}
      <span className={styles.wordmark} aria-hidden="true">
        nano<span className={styles.glyph}>{'};{'}</span>ranch
      </span>

      {/* Row 2 — action label */}
      <span className={styles.action}>
        {icon === 'play' && (
          <span className={styles.playIcon} aria-hidden="true">▶</span>
        )}
        {action}
        {suffix && (
          <span className={styles.suffix} aria-hidden="true"> ({suffix})</span>
        )}
        {external && (
          <span className={styles.extIcon} aria-hidden="true">↗</span>
        )}
      </span>

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

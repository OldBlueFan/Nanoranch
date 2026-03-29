/**
 * AccessibilityPanel — floating bottom-right panel.
 *
 * Controls:
 *   • Color-vision deficiency simulation (none / protanopia / deuteranopia / tritanopia / achromatopsia)
 *   • Dyslexia-friendly font (Lexend)
 *   • Dark mode override
 *
 * Prefs are written to localStorage via useA11yPrefs (provided as props from App).
 * An aria-live region announces mode changes to screen readers.
 */
import { useState, useRef, useEffect, useId } from 'react'
import styles from './AccessibilityPanel.module.css'

const CVD_OPTIONS = [
  { value: null,              label: 'Default colours' },
  { value: 'protanopia',      label: 'Protanopia (red-blind)' },
  { value: 'deuteranopia',    label: 'Deuteranopia (green-blind)' },
  { value: 'tritanopia',      label: 'Tritanopia (blue-blind)' },
  { value: 'achromatopsia',   label: 'Greyscale' },
]

export default function AccessibilityPanel({ prefs, onChange }) {
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)
  const toggleRef = useRef(null)
  const panelId = useId()
  const announcerId = useId()
  const [announcement, setAnnouncement] = useState('')

  function announce(msg) {
    setAnnouncement('')
    requestAnimationFrame(() => setAnnouncement(msg))
  }

  /* Close on Escape */
  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (e.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  /* Click outside to close */
  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (!panelRef.current?.contains(e.target) && e.target !== toggleRef.current) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [open])

  function setCvd(value) {
    onChange({ cvdMode: value })
    const label = CVD_OPTIONS.find(o => o.value === value)?.label ?? 'Default'
    announce(`Colour mode: ${label}`)
  }

  function toggleDyslexia() {
    const next = !prefs.dyslexia
    onChange({ dyslexia: next })
    announce(next ? 'Dyslexia-friendly font on' : 'Dyslexia-friendly font off')
  }

  function toggleDark() {
    const next = !prefs.darkMode
    onChange({ darkMode: next })
    announce(next ? 'Dark mode on' : 'Light mode on')
  }

  return (
    <div className={styles.wrapper} ref={panelRef}>
      {/* Live region — hidden visually but read by screen readers */}
      <div
        id={announcerId}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement}
      </div>

      {/* Toggle button */}
      <button
        ref={toggleRef}
        type="button"
        className={styles.toggle}
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Accessibility options"
        title="Accessibility options"
      >
        <span aria-hidden="true">⚙</span>
        <span className="sr-only">Accessibility options</span>
        {/* Active indicator dot */}
        {(prefs.cvdMode || prefs.dyslexia || prefs.darkMode) && (
          <span className={styles.activeDot} aria-hidden="true" />
        )}
      </button>

      {/* Panel */}
      <div
        id={panelId}
        className={`${styles.panel} ${open ? styles.panelOpen : ''}`}
        role="dialog"
        aria-label="Accessibility options"
        aria-modal="false"
      >
        <h2 className={styles.panelTitle}>Accessibility</h2>

        {/* CVD mode radio group */}
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>Colour vision</legend>
          <div role="radiogroup" className={styles.radioGroup}>
            {CVD_OPTIONS.map(({ value, label }) => {
              const id = `cvd-${value ?? 'none'}`
              const checked = (prefs.cvdMode ?? null) === value
              return (
                <label key={id} className={styles.radioLabel} htmlFor={id}>
                  <input
                    type="radio"
                    id={id}
                    name="cvd-mode"
                    value={value ?? ''}
                    checked={checked}
                    onChange={() => setCvd(value)}
                    className={styles.radioInput}
                  />
                  {label}
                </label>
              )
            })}
          </div>
        </fieldset>

        {/* Dyslexia toggle */}
        <div className={styles.toggleRow}>
          <label htmlFor="dyslexia-toggle" className={styles.toggleLabel}>
            Dyslexia-friendly font
            <span className={styles.toggleSub}>(Lexend)</span>
          </label>
          <button
            id="dyslexia-toggle"
            type="button"
            role="switch"
            aria-checked={prefs.dyslexia}
            onClick={toggleDyslexia}
            className={`${styles.switchBtn} ${prefs.dyslexia ? styles.switchOn : ''}`}
          >
            <span className={styles.switchThumb} aria-hidden="true" />
            <span className="sr-only">{prefs.dyslexia ? 'On' : 'Off'}</span>
          </button>
        </div>

        {/* Dark mode toggle */}
        <div className={styles.toggleRow}>
          <label htmlFor="dark-toggle" className={styles.toggleLabel}>
            Dark mode
          </label>
          <button
            id="dark-toggle"
            type="button"
            role="switch"
            aria-checked={prefs.darkMode}
            onClick={toggleDark}
            className={`${styles.switchBtn} ${prefs.darkMode ? styles.switchOn : ''}`}
          >
            <span className={styles.switchThumb} aria-hidden="true" />
            <span className="sr-only">{prefs.darkMode ? 'On' : 'Off'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

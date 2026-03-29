import { useState } from 'react'
import DandelionSeeds from '../DandelionSeeds/DandelionSeeds'
import styles from './IntakeForm.module.css'

const SPACE_TYPES = [
  'Balcony / Patio',
  'Front or back yard',
  'Community / shared space',
  'Rural field or meadow',
  'Multiple acres',
  'Other',
]

const SIZES = [
  'Under 50 sq ft',
  '50–200 sq ft',
  '200–1,000 sq ft',
  '1,000–5,000 sq ft',
  'Over 5,000 sq ft',
]

export default function IntakeForm({ onSubmit }) {
  const [form, setForm] = useState({
    location: '',
    spaceType: '',
    size: '',
    description: '',
  })

  function set(field) {
    return e => setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit?.(form)
  }

  return (
    <div className={styles.wrapper}>
      <DandelionSeeds />

      <div className={styles.inner}>
        <p className={styles.intro}>
          Tell us a little about your space and we&rsquo;ll suggest native plants
          that belong there.
        </p>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.row}>
            <label className={styles.label} htmlFor="if-location">
              Where is it?
              <input
                id="if-location"
                className={styles.input}
                type="text"
                placeholder="City, region, or zip code"
                value={form.location}
                onChange={set('location')}
                autoComplete="postal-code"
              />
            </label>

            <label className={styles.label} htmlFor="if-type">
              What kind of space?
              <select
                id="if-type"
                className={styles.input}
                value={form.spaceType}
                onChange={set('spaceType')}
              >
                <option value="">Select one…</option>
                {SPACE_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
          </div>

          <label className={styles.label} htmlFor="if-size">
            Roughly how big?
            <select
              id="if-size"
              className={styles.input}
              value={form.size}
              onChange={set('size')}
            >
              <option value="">Select one…</option>
              {SIZES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>

          <label className={styles.label} htmlFor="if-desc">
            Describe it in your own words
            <textarea
              id="if-desc"
              className={`${styles.input} ${styles.textarea}`}
              placeholder="Sun or shade? Wet or dry? Any existing plants? What do you hope for?"
              value={form.description}
              onChange={set('description')}
              rows={4}
            />
          </label>

          <button type="submit" className={styles.submit}>
            <span className={styles.submitPrefix}>
              nano<span className={styles.glyph}>{'};{'}</span>ranch
            </span>
            <span className={styles.submitDivider} aria-hidden="true">/</span>
            Show me what belongs here
          </button>
        </form>
      </div>
    </div>
  )
}

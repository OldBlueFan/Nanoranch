import { useState } from 'react'
import CreatureIcons from '../CreatureIcons/CreatureIcons'
import IntakeForm from '../IntakeForm/IntakeForm'
import Modal from '../Modal/Modal'
import BrandButton from '../ui/BrandButton/BrandButton'
import ButtonSeeds from '../ButtonSeeds/ButtonSeeds'
import styles from './WelcomeScreen.module.css'

export default function WelcomeScreen() {
  const [showExplainer, setShowExplainer] = useState(false)
  const [showLogin,     setShowLogin]     = useState(false)
  const [showForm,      setShowForm]      = useState(false)

  return (
    <main id="main-content" className={styles.screen} tabIndex={-1}>
      {/* Radial seasonal glow */}
      <div className={styles.glow} aria-hidden="true" />

      {/* ── Upper zone: fills top half, content pushed to its bottom edge ── */}
      <div className={styles.upperZone}>
        <h1 className={styles.headline}>
          <strong className={styles.bold}>Tell us about your space.</strong>
          {/* Subtitle: two lines wrapped tightly together, set apart from bold */}
          <span className={styles.subtitle}>
            <span className={styles.line}>Then we&rsquo;ll know what wants to grow there,</span>
            <span className={styles.line}>and what will want to go there&hellip;</span>
          </span>
        </h1>

        <CreatureIcons />
      </div>

      {/* ── Center zone: buttons sit at the vertical midpoint ── */}
      <div className={styles.actions} role="group" aria-label="Get started options">

        {/* Button 1 — light green: Explainer */}
        <BrandButton
          variant="light"
          action="30s Explainer"
          icon="play"
          onClick={() => setShowExplainer(true)}
        />

        {/* Button 2 — dark green + large: Get Seeding.
            ButtonSeeds is position:fixed so it escapes this wrapper. */}
        <div className={styles.seedBtnWrap}>
          <ButtonSeeds active={showForm} />
          <BrandButton
            variant="dark"
            large
            action="Get Seeding"
            suffix="start"
            onClick={() => setShowForm(v => !v)}
            aria-expanded={showForm}
          />
        </div>

        {/* Button 3 — blue: Login */}
        <BrandButton
          variant="blue"
          action="Already Planted"
          suffix="login"
          onClick={() => setShowLogin(true)}
        />

      </div>

      {/* ── Lower zone: fills bottom half, form expands here ── */}
      <div className={styles.lowerZone}>
        <div
          className={`${styles.formArea} ${showForm ? styles.formOpen : ''}`}
          aria-hidden={!showForm}
        >
          {showForm && (
            <IntakeForm
              onSubmit={(data) => {
                console.log('Space data:', data)
                // TODO: POST to /api/plants
              }}
            />
          )}
        </div>
      </div>

      {/* Explainer modal */}
      <Modal
        isOpen={showExplainer}
        onClose={() => setShowExplainer(false)}
        title="nano};{ranch in 30 seconds"
      >
        <div className={styles.videoPlaceholder} role="img" aria-label="Explainer video placeholder">
          <div className={styles.videoIcon} aria-hidden="true">▶</div>
          <p>Explainer video here</p>
        </div>
      </Modal>

      {/* Login modal */}
      <Modal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        title="Welcome back"
      >
        <LoginForm onClose={() => setShowLogin(false)} />
      </Modal>
    </main>
  )
}

/* ── Inline login form (small enough to live here) ── */
function LoginForm({ onClose }) {
  const [email, setEmail] = useState('')
  const [sent,  setSent]  = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) return
    // TODO: POST to /api/auth/magic-link
    setSent(true)
  }

  if (sent) {
    return (
      <div className={styles.loginSent}>
        <p className={styles.loginSentIcon} aria-hidden="true">✉️</p>
        <p>Check your inbox — we sent a sign-in link to <strong>{email}</strong>.</p>
        <button className={styles.loginClose} onClick={onClose} type="button">
          Got it
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={styles.loginForm} noValidate>
      <p className={styles.loginHint}>
        Enter your email and we&rsquo;ll send you a magic sign-in link — no password needed.
      </p>
      <label className={styles.loginLabel} htmlFor="login-email">
        Email address
        <input
          id="login-email"
          type="email"
          className={styles.loginInput}
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
      </label>
      <button type="submit" className={styles.loginSubmit}>
        Send sign-in link
      </button>
    </form>
  )
}

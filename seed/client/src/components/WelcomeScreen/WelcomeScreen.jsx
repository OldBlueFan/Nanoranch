import AnimatedBackground from '../AnimatedBackground/AnimatedBackground'
import BrandButton from '../ui/BrandButton/BrandButton'
import styles from './WelcomeScreen.module.css'

export default function WelcomeScreen() {
  return (
    <main id="main-content" className={styles.screen} tabIndex={-1}>
      <AnimatedBackground />

      {/* Radial seasonal glow behind content */}
      <div className={styles.glow} aria-hidden="true" />

      <div className={styles.content}>
        {/* Logo */}
        <div className={styles.logo} aria-label="nano};{ranch">
          nano<span className={styles.glyph}>{'};{'}</span>ranch
        </div>

        {/* Headline */}
        <h1 className={styles.headline}>
          Rewilding within reach.{' '}
          <span className={styles.sub}>
            Tell us about your space, and let&rsquo;s figure out what it wants to
            grow there&mdash;and what wants to go there.
          </span>
        </h1>

        {/* CTA buttons */}
        <div
          className={styles.actions}
          role="group"
          aria-label="Get started options"
        >
          <BrandButton
            variant="light"
            action="in 30 seconds"
            icon="play"
            onClick={() => {/* TODO: open onboarding flow */}}
          />
          <BrandButton
            variant="light"
            action="Visit nanoranch.org"
            href="https://nanoranch.org"
            external
          />
          <BrandButton
            variant="dark"
            action="Let's Get Seeding"
            onClick={() => {/* TODO: navigate to space wizard */}}
          />
        </div>
      </div>
    </main>
  )
}

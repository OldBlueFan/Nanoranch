import { useState, useEffect } from 'react'

const STORAGE_KEY = 'nanoranch-a11y'

const DEFAULTS = {
  cvdMode:  null,       // null | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia'
  dyslexia: false,      // Lexend font
  darkMode: false,      // dark theme override (auto-detected from prefers-color-scheme if unset)
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : autoDefaults()
  } catch {
    return autoDefaults()
  }
}

function autoDefaults() {
  return {
    ...DEFAULTS,
    darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
  }
}

/**
 * Persists accessibility preferences to localStorage and returns
 * [prefs, setPrefs] where setPrefs accepts a partial update.
 */
export default function useA11yPrefs() {
  const [prefs, setPrefsRaw] = useState(load)

  /* Persist on every change */
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)) } catch {}
  }, [prefs])

  function setA11y(patch) {
    setPrefsRaw(prev => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) }))
  }

  return [prefs, setA11y]
}

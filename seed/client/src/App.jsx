import { useEffect } from 'react'
import useSeason from './hooks/useSeason'
import useA11yPrefs from './hooks/useA11yPrefs'
import WelcomeScreen from './components/WelcomeScreen/WelcomeScreen'
import AccessibilityPanel from './components/AccessibilityPanel/AccessibilityPanel'

/*
 * Inline SVG color-vision-deficiency filters.
 * display:none keeps them out of layout; they are referenced via
 * filter: url(#cvd-*) applied to #cvd-root by useA11yPrefs.
 */
const CVD_FILTERS = `
<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
     style="position:absolute;width:0;height:0;overflow:hidden">
  <defs>
    <filter id="cvd-protanopia" color-interpolation-filters="linearRGB">
      <feColorMatrix type="matrix" values="
        0.567 0.433 0     0 0
        0.558 0.442 0     0 0
        0     0.242 0.758 0 0
        0     0     0     1 0"/>
    </filter>
    <filter id="cvd-deuteranopia" color-interpolation-filters="linearRGB">
      <feColorMatrix type="matrix" values="
        0.625 0.375 0     0 0
        0.700 0.300 0     0 0
        0     0.300 0.700 0 0
        0     0     0     1 0"/>
    </filter>
    <filter id="cvd-tritanopia" color-interpolation-filters="linearRGB">
      <feColorMatrix type="matrix" values="
        0.950 0.050 0     0 0
        0     0.433 0.567 0 0
        0     0.475 0.525 0 0
        0     0     0     1 0"/>
    </filter>
    <filter id="cvd-achromatopsia" color-interpolation-filters="linearRGB">
      <feColorMatrix type="saturate" values="0"/>
    </filter>
  </defs>
</svg>`

export default function App() {
  const season = useSeason()
  const [a11y, setA11y] = useA11yPrefs()

  /* Apply season + theme + dyslexia as data attrs on <html> */
  useEffect(() => {
    const root = document.documentElement
    root.dataset.season   = season
    root.dataset.theme    = a11y.darkMode ? 'dark' : 'light'
    root.dataset.dyslexia = a11y.dyslexia ? 'true' : 'false'
  }, [season, a11y.darkMode, a11y.dyslexia])

  /* CVD filter applied to wrapper div to avoid Blink/WebKit root-filter bugs */
  const cvdFilter = a11y.cvdMode ? `url(#cvd-${a11y.cvdMode})` : undefined

  return (
    <>
      {/* SVG filter defs — must precede any consumer */}
      <div dangerouslySetInnerHTML={{ __html: CVD_FILTERS }} />

      <div id="cvd-root" style={cvdFilter ? { filter: cvdFilter } : undefined}>
        <WelcomeScreen />
        <AccessibilityPanel prefs={a11y} onChange={setA11y} />
      </div>
    </>
  )
}

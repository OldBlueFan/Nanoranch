/**
 * Returns the current meteorological season based on the calendar month.
 * Spring: Mar–May | Summer: Jun–Aug | Fall: Sep–Nov | Winter: Dec–Feb
 */
export default function useSeason() {
  const month = new Date().getMonth() // 0-based (0=Jan … 11=Dec)
  if (month >= 2 && month <= 4) return 'spring'
  if (month >= 5 && month <= 7) return 'summer'
  if (month >= 8 && month <= 10) return 'fall'
  return 'winter'
}

/**
 * Sharing — Web Share API with a copy-link fallback.
 */

export async function sharePage(toast) {
  const data = {
    title: document.title,
    text: 'Boston Begins — our family guide to Medford, Cambridge & Boston.',
    url: location.href.split('#')[0],
  };
  if (navigator.share) {
    try {
      await navigator.share(data);
      return;
    } catch (err) {
      if (err && err.name === 'AbortError') return; // user cancelled
    }
  }
  try {
    await navigator.clipboard.writeText(data.url);
    toast('Link copied — note that guests need an access code.');
  } catch {
    toast(data.url);
  }
}

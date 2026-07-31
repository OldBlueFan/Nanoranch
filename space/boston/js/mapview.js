/**
 * Interactive map — vendored Leaflet + OpenStreetMap tiles, lazily loaded the
 * first time the Map tab is opened. If tiles fail, markers and popups still
 * work over a plain background, and the server-rendered link list remains.
 */

const CATEGORY_STYLE = [
  { match: ['campus'], color: '#2E5D86', emoji: '🐘' },
  { match: ['baseball', 'music'], color: '#386641', emoji: '⚾' },
  { match: ['history'], color: '#9B4A3F', emoji: '🏛' },
  { match: ['food'], color: '#D7A84B', emoji: '🍝' },
  { match: ['waterfront'], color: '#3F7F83', emoji: '⛵' },
  { match: ['art'], color: '#6B4B3E', emoji: '🖼' },
];
const DEFAULT_STYLE = { color: '#2E5D86', emoji: '📍' };

let booted = false;

function styleFor(categories) {
  return CATEGORY_STYLE.find((s) => s.match.some((m) => categories.includes(m))) || DEFAULT_STYLE;
}

function loadLeaflet() {
  return new Promise((resolve, reject) => {
    if (window.L) { resolve(window.L); return; }
    const s = document.createElement('script');
    s.src = 'vendor/leaflet/leaflet.js';
    s.onload = () => resolve(window.L);
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function markerIcon(L, style, isHome) {
  const size = isHome ? 38 : 30;
  return L.divIcon({
    className: 'bb-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size + 4],
    html: `<div class="bb-marker-dot" style="background:${style.color};width:${size}px;height:${size}px"><span>${style.emoji}</span></div>`,
  });
}

function popupHtml(dest, clusterName) {
  const ll = `${dest.latitude},${dest.longitude}`;
  const apple = dest.appleMapsUrl || `https://maps.apple.com/?q=${encodeURIComponent(dest.name)}&ll=${ll}`;
  const google = dest.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ll)}`;
  const est = dest.fromHomeBase?.estimatedMinutes;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  return `
    <p class="popup-cluster">${esc(clusterName)}</p>
    <p class="popup-name">${esc(dest.name)}</p>
    <p class="popup-why">${esc(dest.whyGo)}</p>
    ${est ? `<p class="popup-meta">From home base: est. ${est.min}–${est.max} min · ${esc(dest.fromHomeBase.primaryMode)}</p>` : ''}
    <div class="popup-links">
      <a class="ext" href="#d-${esc(dest.id)}" data-popup-details>Open details</a>
      <a class="ext" href="${esc(apple)}" target="_blank" rel="noopener" aria-label="Apple Maps (opens in new window)">Apple Maps</a>
      <a class="ext" href="${esc(google)}" target="_blank" rel="noopener" aria-label="Google Maps (opens in new window)">Google Maps</a>
      <button class="ext" type="button" data-popup-save="${esc(dest.id)}">♥ Save</button>
    </div>`;
}

export async function initMapOnce({ store, toast }) {
  if (booted) return;
  booted = true;

  const host = document.getElementById('leaflet-map');
  const note = document.querySelector('[data-map-note]');
  if (!host) return;

  let L; let guide;
  try {
    [L, guide] = await Promise.all([
      loadLeaflet(),
      fetch('boston-guide.json').then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      }),
    ]);
  } catch {
    host.style.display = 'none';
    if (note) note.textContent = 'The interactive map couldn’t load here — use the Apple Maps and Google Maps links below instead.';
    return;
  }

  const map = L.map(host, { scrollWheelZoom: false, tap: true });
  const home = guide.homeBase;
  map.setView([home.latitude, home.longitude], 12);

  let tileFailures = 0;
  const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
  });
  tiles.on('tileerror', () => {
    tileFailures += 1;
    if (tileFailures === 6 && note) {
      note.textContent = 'Map tiles are unavailable right now — markers still work, and every listing links to Apple Maps and Google Maps.';
    }
  });
  tiles.addTo(map);

  const clusterName = (id) => (guide.clusters.find((c) => c.id === id) || {}).shortName || '';

  // Home base — generalized location, per the privacy rules.
  L.marker([home.latitude, home.longitude], {
    icon: markerIcon(window.L, { color: '#D7A84B', emoji: '🏠' }, true),
    title: home.label,
    zIndexOffset: 500,
  }).addTo(map).bindPopup(
    `<p class="popup-cluster">Home base</p><p class="popup-name">${home.label}</p><p class="popup-why">Walkable to campus; gateway to the Green and Red Lines.</p>`,
    { className: 'map-popup' },
  );

  const bounds = [[home.latitude, home.longitude]];
  guide.destinations.forEach((dest) => {
    bounds.push([dest.latitude, dest.longitude]);
    L.marker([dest.latitude, dest.longitude], {
      icon: markerIcon(window.L, styleFor(dest.category), false),
      title: dest.name,
      alt: dest.name,
    }).addTo(map).bindPopup(popupHtml(dest, clusterName(dest.clusterId)), { className: 'map-popup', maxWidth: 290 });
  });
  map.fitBounds(bounds, { padding: [28, 28] });

  // Popup actions
  map.on('popupopen', (e) => {
    const el = e.popup.getElement();
    el?.querySelector('[data-popup-save]')?.addEventListener('click', (ev) => {
      const id = ev.currentTarget.dataset.popupSave;
      const on = store.toggleSaved(id);
      toast(on ? 'Saved for the trip ♥' : 'Removed from saved');
      map.closePopup();
    });
    el?.querySelector('[data-popup-details]')?.addEventListener('click', () => map.closePopup());
  });

  // The host was hidden while the tab was inactive at least once; fix sizing.
  requestAnimationFrame(() => map.invalidateSize());
  document.addEventListener('bb:viewchange', (e) => {
    if (e.detail === 'map') requestAnimationFrame(() => map.invalidateSize());
  });
}

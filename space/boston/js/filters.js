/**
 * Destination filtering — chips on the Explore view plus the Home quick-mood
 * shortcuts. Filters toggle .filtered-out on server-rendered cards; nothing
 * is re-rendered.
 */

import { store } from './store.js';

const state = { cat: '', time: '', weather: '', energy: '', state: '', mood: null };

const cards = () => [...document.querySelectorAll('.dest')];
const clusters = () => [...document.querySelectorAll('.cluster')];

function matchesMood(card, match) {
  if (!match) return true;
  if (match.clusters) return match.clusters.includes(card.dataset.cluster);
  if (match.categories) return match.categories.some((c) => card.dataset.cats.split(' ').includes(c));
  if (match.weather) return match.weather.some((w) => card.dataset.weather.split(' ').includes(w));
  if (match.bestTime) return match.bestTime.some((t) => card.dataset.besttime.split(' ').includes(t));
  return true;
}

function matches(card) {
  if (state.cat && !card.dataset.cats.split(' ').includes(state.cat)) return false;
  if (state.time && card.dataset.time !== state.time) return false;
  if (state.weather && !card.dataset.weather.split(' ').includes(state.weather)) return false;
  if (state.energy && card.dataset.energy !== state.energy) return false;
  if (state.state === 'saved' && !store.isSaved(card.dataset.id)) return false;
  if (state.state === 'done' && !store.isDone(card.dataset.id)) return false;
  if (!matchesMood(card, state.mood)) return false;
  return true;
}

function apply() {
  let shown = 0;
  cards().forEach((card) => {
    const ok = matches(card);
    card.classList.toggle('filtered-out', !ok);
    if (ok) shown += 1;
  });

  // Hide clusters whose every card is filtered away.
  clusters().forEach((cl) => {
    const any = [...cl.querySelectorAll('.dest')].some((c) => !c.classList.contains('filtered-out'));
    cl.style.display = any ? '' : 'none';
  });

  const status = document.querySelector('[data-filter-status]');
  if (status) {
    const total = cards().length;
    const active = state.cat || state.time || state.weather || state.energy || state.state || state.mood;
    status.textContent = active
      ? `Showing ${shown} of ${total} places.`
      : '';
  }
}

function setChipPressed(group, value) {
  document.querySelectorAll(`.chip[data-f="${group}"]`).forEach((chip) => {
    chip.setAttribute('aria-pressed', String(chip.dataset.v === value));
  });
}

export function clearFilters({ silent = false } = {}) {
  Object.assign(state, { cat: '', time: '', weather: '', energy: '', state: '', mood: null });
  ['cat', 'time', 'weather', 'energy', 'state'].forEach((g) => setChipPressed(g, ''));
  if (!silent) apply();
}

/** Apply a Home quick-mood: clears other filters, jumps to Explore. */
export function applyMood(match) {
  clearFilters({ silent: true });
  state.mood = match;
  apply();
}

export function initFilters() {
  const wrap = document.querySelector('[data-filters]');
  if (!wrap) return;
  wrap.hidden = false;

  wrap.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip[data-f]');
    if (chip) {
      const group = chip.dataset.f;
      const value = chip.getAttribute('aria-pressed') === 'true' ? '' : chip.dataset.v;
      state[group] = value;
      state.mood = null; // manual chips supersede a quick-mood shortcut
      setChipPressed(group, value);
      apply();
      return;
    }
    if (e.target.closest('[data-clear-filters]')) clearFilters();
  });

  // Saved/done chips must re-evaluate when state changes elsewhere.
  document.addEventListener('bb:statechange', () => {
    if (state.state) apply();
  });
}

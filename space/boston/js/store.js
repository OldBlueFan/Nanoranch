/**
 * Device-local trip state (localStorage). Nothing syncs anywhere.
 * Shape: { saved:[], done:[], notes:{}, picks:{}, magic:[], after:{} }
 */

const KEY = 'bb-trip-v1';

const empty = () => ({ saved: [], done: [], notes: {}, picks: {}, magic: [], after: {} });

let cache = null;

function read() {
  if (cache) return cache;
  try {
    cache = { ...empty(), ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    cache = empty();
  }
  return cache;
}

function write() {
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* private mode / quota — state simply won't persist */
  }
  document.dispatchEvent(new CustomEvent('bb:statechange'));
}

export const store = {
  get: () => read(),

  isSaved: (id) => read().saved.includes(id),
  isDone: (id) => read().done.includes(id),

  toggleSaved(id) {
    const s = read();
    s.saved = s.saved.includes(id) ? s.saved.filter((x) => x !== id) : [...s.saved, id];
    write();
    return s.saved.includes(id);
  },

  toggleDone(id) {
    const s = read();
    s.done = s.done.includes(id) ? s.done.filter((x) => x !== id) : [...s.done, id];
    write();
    return s.done.includes(id);
  },

  note: (id) => read().notes[id] || '',
  setNote(id, text) {
    const s = read();
    if (text.trim()) s.notes[id] = text; else delete s.notes[id];
    write();
  },

  pick: (traveler) => read().picks[traveler] || null,
  setPick(traveler, id) {
    const s = read();
    if (s.picks[traveler] === id) delete s.picks[traveler]; else s.picks[traveler] = id;
    write();
    return s.picks[traveler] === id;
  },

  magicDone: (i) => read().magic.includes(i),
  setMagic(i, on) {
    const s = read();
    s.magic = on ? [...new Set([...s.magic, i])] : s.magic.filter((x) => x !== i);
    write();
  },

  after: (i) => read().after[i] || '',
  setAfter(i, text) {
    const s = read();
    if (text.trim()) s.after[i] = text; else delete s.after[i];
    write();
  },

  reset() {
    cache = empty();
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
    document.dispatchEvent(new CustomEvent('bb:statechange'));
  },
};

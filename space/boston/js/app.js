/**
 * Boston Begins — progressive enhancement layer.
 *
 * The document arrives fully rendered from the server. This module adds:
 * tab navigation + hash deep links, save/done/notes/picks on each card,
 * the tip rotator, filters, the map (lazy), share, and print modes.
 */

import { store } from './store.js';
import { initFilters, applyMood } from './filters.js';
import { initMapOnce } from './mapview.js';
import { sharePage } from './share.js';
import { initPrint } from './print.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Toast ---------- */

let toastTimer;
function toast(msg) {
  const el = $('[data-toast]');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

/* ---------- Tabs & routing ---------- */

const VIEWS = ['home', 'explore', 'map', 'transit', 'saved'];

function viewForHash(hash) {
  const id = hash.replace(/^#\/?/, '');
  if (VIEWS.includes(id)) return { view: id, target: null };
  const el = id && document.getElementById(id);
  if (!el) return { view: 'home', target: null };
  const container = el.closest('.view');
  return { view: container ? container.dataset.view : 'home', target: el };
}

function activateView(view) {
  $$('.view').forEach((v) => v.classList.toggle('active', v.dataset.view === view));
  $$('.tabbar a').forEach((a) => {
    if (a.dataset.tab === view) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  if (view === 'map') initMapOnce({ store, toast });
  if (view === 'saved') renderSaved();
  document.dispatchEvent(new CustomEvent('bb:viewchange', { detail: view }));
}

function route() {
  const { view, target } = viewForHash(location.hash);
  activateView(view);
  if (target) {
    // Reveal a deep-linked card: open its details, scroll, flash.
    const card = target.classList.contains('dest') ? target : target.closest('.dest');
    if (card) {
      card.classList.remove('filtered-out');
      const details = card.querySelector('details');
      if (details) details.open = true;
    }
    requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
      if (card) {
        card.classList.remove('flash');
        void card.offsetWidth;
        card.classList.add('flash');
      }
    });
  } else {
    // 'instant', not 'auto': tab switches must not smooth-scroll the
    // whole document (html has scroll-behavior: smooth).
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
}

/* ---------- Destination card decoration ---------- */

const HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';
const CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

let travelers = [];
try {
  travelers = JSON.parse(document.getElementById('bb-travelers')?.textContent || '[]');
} catch { travelers = []; }

function decorateCard(card) {
  const id = card.dataset.id;
  const name = $('.dest-name', card)?.textContent || 'this place';

  // Action buttons
  const actions = $('[data-actions]', card);
  if (actions) {
    actions.hidden = false;
    const save = document.createElement('button');
    save.type = 'button';
    save.className = 'act-btn act-save';
    save.innerHTML = HEART;
    const done = document.createElement('button');
    done.type = 'button';
    done.className = 'act-btn act-done';
    done.innerHTML = CHECK;

    const syncLabels = () => {
      save.setAttribute('aria-pressed', String(store.isSaved(id)));
      save.setAttribute('aria-label', `${store.isSaved(id) ? 'Remove' : 'Save'} ${name} ${store.isSaved(id) ? 'from' : 'to'} favorites`);
      done.setAttribute('aria-pressed', String(store.isDone(id)));
      done.setAttribute('aria-label', `Mark ${name} as ${store.isDone(id) ? 'not done' : 'done'}`);
      card.classList.toggle('is-saved', store.isSaved(id));
      card.classList.toggle('is-done', store.isDone(id));
    };

    save.addEventListener('click', () => {
      const on = store.toggleSaved(id);
      syncLabels();
      if (!reducedMotion) { save.classList.remove('pop'); void save.offsetWidth; save.classList.add('pop'); }
      toast(on ? 'Saved for the trip ♥' : 'Removed from saved');
    });
    done.addEventListener('click', () => {
      const on = store.toggleDone(id);
      syncLabels();
      if (!reducedMotion) { done.classList.remove('pop'); void done.offsetWidth; done.classList.add('pop'); }
      toast(on ? 'Another one for the memory page ✓' : 'Unmarked');
    });

    actions.append(save, done);
    syncLabels();
  }

  // Family pick row
  if (travelers.length) {
    const row = document.createElement('div');
    row.className = 'pick-row';
    row.setAttribute('role', 'group');
    row.setAttribute('aria-label', `Family picks for ${name}`);
    travelers.forEach((t) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pick-btn';
      b.textContent = `${t.emoji} ${t.pickLabel}`;
      const sync = () => b.setAttribute('aria-pressed', String(store.pick(t.id) === id));
      b.addEventListener('click', () => {
        const on = store.setPick(t.id, id);
        $$('.pick-btn').forEach((btn) => btn.dispatchEvent(new CustomEvent('bb:syncpick')));
        toast(on ? `${t.emoji} ${t.pickLabel}: ${name}` : `${t.pickLabel} cleared`);
      });
      b.addEventListener('bb:syncpick', sync);
      sync();
      row.append(b);
    });
    $('.dest-meta', card)?.after(row);
  }

  // Note field
  const slot = $('[data-note-slot]', card);
  if (slot) {
    slot.hidden = false;
    const label = document.createElement('label');
    label.textContent = 'Our note';
    label.htmlFor = `note-${id}`;
    const ta = document.createElement('textarea');
    ta.id = `note-${id}`;
    ta.placeholder = 'A restaurant pick, a memory, a plan…';
    ta.value = store.note(id);
    ta.addEventListener('change', () => {
      store.setNote(id, ta.value);
      toast('Note saved on this device');
    });
    slot.append(label, ta);
  }
}

/* ---------- Saved view ---------- */

function savedItem(id, extra = '') {
  const card = document.getElementById(`d-${id}`);
  if (!card) return null;
  const name = $('.dest-name', card)?.textContent || id;
  const cluster = card.closest('.cluster')?.querySelector('.cluster-name')?.textContent || '';
  const a = document.createElement('a');
  a.className = 'saved-item';
  a.href = `#d-${id}`;
  a.innerHTML = `<span class="si-emoji">${extra || '♥'}</span><span><span class="si-name">${name}</span><br><span class="si-meta">${cluster}${store.note(id) ? ' · has a note' : ''}</span></span>`;
  return a;
}

function fillList(el, ids, emoji, emptyMsg) {
  el.textContent = '';
  if (!ids.length) {
    const p = document.createElement('p');
    p.className = 'saved-empty';
    p.textContent = emptyMsg;
    el.append(p);
    return;
  }
  ids.forEach((id) => {
    const item = savedItem(id, emoji);
    if (item) el.append(item);
  });
}

function renderSaved() {
  const wrap = $('[data-saved-app]');
  if (!wrap) return;
  wrap.hidden = false;

  const s = store.get();
  const summary = $('[data-saved-summary]');
  if (summary) {
    const bits = [];
    bits.push(`${s.saved.length} saved`);
    bits.push(`${s.done.length} done`);
    const noteCount = Object.keys(s.notes).length;
    if (noteCount) bits.push(`${noteCount} note${noteCount === 1 ? '' : 's'}`);
    summary.innerHTML = `<strong>Our Boston so far:</strong> ${bits.join(' · ')}.`;
  }

  const picksList = $('[data-picks-list]');
  if (picksList) {
    picksList.textContent = '';
    let any = false;
    travelers.forEach((t) => {
      const id = s.picks[t.id];
      if (!id) return;
      const item = savedItem(id, t.emoji);
      if (item) { picksList.append(item); any = true; }
    });
    if (!any) {
      const p = document.createElement('p');
      p.className = 'saved-empty';
      p.textContent = 'No picks yet — each traveler can crown one place from any listing.';
      picksList.append(p);
    }
  }

  fillList($('[data-fav-list]'), s.saved, '♥', 'Nothing saved yet. Tap the heart on any place in Explore.');
  fillList($('[data-done-list]'), s.done, '✓', 'The “We did this” list starts once the trip does.');
}

/* ---------- Tip rotator ---------- */

function initTips() {
  const box = $('[data-tips]');
  if (!box) return;
  let tips = [];
  try { tips = JSON.parse(box.dataset.tips); } catch { return; }
  if (tips.length < 2) return;

  const text = $('[data-tip-text]', box);
  const next = $('[data-tip-next]', box);
  let i = 0;
  const show = (n) => { i = (n + tips.length) % tips.length; text.textContent = tips[i]; };

  if (next) {
    next.hidden = false;
    next.addEventListener('click', () => { show(i + 1); resetTimer(); });
  }

  let timer = null;
  const resetTimer = () => {
    if (reducedMotion) return;
    clearInterval(timer);
    timer = setInterval(() => show(i + 1), 10000);
  };
  resetTimer();
}

/* ---------- Memory page persistence ---------- */

function initMemory() {
  $$('[data-magic]').forEach((box) => {
    const i = Number(box.dataset.magic);
    box.checked = store.magicDone(i);
    box.addEventListener('change', () => store.setMagic(i, box.checked));
  });
  $$('[data-after]').forEach((ta) => {
    const i = Number(ta.dataset.after);
    ta.value = store.after(i);
    const grow = () => { ta.style.height = 'auto'; ta.style.height = `${ta.scrollHeight}px`; };
    ta.addEventListener('input', grow);
    ta.addEventListener('change', () => store.setAfter(i, ta.value));
    grow();
  });
}

/* ---------- Quick moods ---------- */

function initMoods() {
  $$('.mood-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      try {
        applyMood(JSON.parse(chip.dataset.match));
      } catch { /* fall through to plain #explore link */ }
    });
  });
}

/* ---------- Boot ---------- */

document.body.classList.add('js');

initFilters();
initMoods();
initTips();
initMemory();
initPrint({ store, toast });

$$('.dest').forEach(decorateCard);

$('[data-share-page]')?.addEventListener('click', () => sharePage(toast));
$('[data-reset-data]')?.addEventListener('click', () => {
  if (confirm('Reset local trip data? This clears saved places, completions, notes, picks, and memory-page answers on this device.')) {
    store.reset();
    $$('.dest').forEach((card) => {
      card.classList.remove('is-saved', 'is-done');
    });
    $$('.act-btn, .pick-btn').forEach((b) => b.setAttribute('aria-pressed', 'false'));
    $$('.dest-note textarea').forEach((ta) => { ta.value = ''; });
    initMemory();
    renderSaved();
    toast('Local trip data cleared');
  }
});

document.addEventListener('bb:statechange', () => {
  if ($('.view.active')?.dataset.view === 'saved') renderSaved();
});

window.addEventListener('hashchange', route);
route();

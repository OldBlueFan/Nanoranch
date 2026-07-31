/**
 * Print modes — the full keepsake guide (default) and the saved-only
 * shortlist. Both rely on the print stylesheet; this module only annotates
 * the DOM before printing and tidies up afterward.
 */

function openAllDetails() {
  const opened = [];
  document.querySelectorAll('details:not([open])').forEach((d) => {
    d.setAttribute('open', '');
    opened.push(d);
  });
  return opened;
}

function annotateShortlist(store) {
  const { saved, done } = store.get();
  const keep = new Set([...saved, ...done]);
  document.querySelectorAll('.cluster').forEach((cl) => {
    const any = [...cl.querySelectorAll('.dest')].some((d) => keep.has(d.dataset.id));
    cl.classList.toggle('no-saved', !any);
  });
}

export function initPrint({ store, toast }) {
  let opened = [];

  window.addEventListener('beforeprint', () => {
    opened = openAllDetails();
    if (document.body.classList.contains('print-shortlist')) annotateShortlist(store);
  });

  window.addEventListener('afterprint', () => {
    opened.forEach((d) => d.removeAttribute('open'));
    opened = [];
    document.body.classList.remove('print-shortlist');
    document.querySelectorAll('.cluster.no-saved').forEach((c) => c.classList.remove('no-saved'));
  });

  document.querySelector('[data-print-shortlist]')?.addEventListener('click', () => {
    const { saved, done } = store.get();
    if (!saved.length && !done.length) {
      toast('Nothing saved yet — tap the ♥ on a few places first.');
      return;
    }
    document.body.classList.add('print-shortlist');
    window.print();
  });
}

import { gsap } from './gsap.js';
import { media, qs } from './utils.js';

/** A small amber dot with a lagging ring that opens up with a label over media. */
export function initCursor({ reduced }) {
  const cursor = qs('.cursor');
  if (reduced || !media.finePointer.matches) {
    cursor.remove();
    return;
  }
  const dot = qs('.cursor__dot', cursor);
  const ring = qs('.cursor__ring', cursor);
  const label = qs('.cursor__label', cursor);

  const dotX = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' });
  const dotY = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' });
  const ringX = gsap.quickTo(ring, 'x', { duration: 0.5, ease: 'power3' });
  const ringY = gsap.quickTo(ring, 'y', { duration: 0.5, ease: 'power3' });

  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') return;
      cursor.classList.add('is-visible');
      dotX(e.clientX);
      dotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);
    },
    { passive: true },
  );
  document.documentElement.addEventListener('pointerleave', () => cursor.classList.remove('is-visible'));

  document.addEventListener('pointerover', (e) => {
    const labelled = e.target.closest('[data-cursor]');
    const interactive = e.target.closest('a, button, input, label');
    cursor.classList.toggle('is-label', Boolean(labelled));
    cursor.classList.toggle('is-hover', !labelled && Boolean(interactive));
    label.textContent = labelled ? labelled.dataset.cursor : '';
  });
}

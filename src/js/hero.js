import { gsap, SplitText } from './gsap.js';
import { FrameSequence } from './sequence.js';
import { qs, splitOptions } from './utils.js';
import manifest from '../media-manifest.json';

/**
 * Hero: a pinned stage whose canvas scrubs a frame sequence (camera pushing
 * towards the oculus) while the giant wordmark breaks apart around the viewer.
 */
export function initHero({ reduced }) {
  const section = qs('.hero');
  const stage = qs('.hero__stage', section);
  const canvas = qs('.hero__canvas', section);
  const word = qs('.hero__word', section);
  const shade = qs('.hero__shade', section);
  const ui = [qs('.hero__caption', section), qs('.hero__coords', section), qs('.hero__scroll', section)];

  const split = SplitText.create(word, splitOptions('chars', { mask: 'chars', aria: 'none' }));
  gsap.set(split.chars, { yPercent: 105 });
  gsap.set(ui, { autoAlpha: 0, y: 16 });

  const meta = manifest.sequences.hero;
  const sequence = !reduced && meta ? new FrameSequence({ canvas, name: 'hero', meta, focus: [0.5, 0.55] }) : null;
  const ready = sequence
    ? sequence.start().then(() => gsap.set(canvas, { autoAlpha: 1 }))
    : Promise.resolve();

  if (sequence) {
    gsap.set(stage, { scale: 1.3 });
    const mid = (split.masks.length - 1) / 2;
    gsap
      .timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => sequence.render(self.progress),
        },
      })
      // Letters drift outwards and dissolve as the camera flies through them.
      .to(
        split.masks,
        { x: (i) => (i - mid) * window.innerWidth * 0.11, scale: 1.35, autoAlpha: 0, duration: 0.42, ease: 'power2.in' },
        0,
      )
      .fromTo(ui, { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -24, duration: 0.1, immediateRender: false }, 0)
      .fromTo(shade, { opacity: 0.55 }, { opacity: 1, duration: 1 }, 0);
  }

  return {
    ready,
    /** Called when the preloader starts zooming through the oculus. */
    zoomIn() {
      if (sequence) gsap.to(stage, { scale: 1, duration: 2.6, ease: 'expo.out' });
    },
    /** Called once the hero is uncovered. */
    intro() {
      gsap.to(split.chars, { yPercent: 0, duration: 1.6, ease: 'expo.out', stagger: { each: 0.07, from: 'center' } });
      gsap.to(ui, { autoAlpha: 1, y: 0, duration: 1.2, stagger: 0.12, delay: 0.6 });
    },
  };
}

import { gsap, SplitText } from './gsap.js';
import { qs, qsa, splitOptions } from './utils.js';

/** Featured project: the image grows from a narrow slab into the whole screen. */
export function initFeatured({ reduced }) {
  const section = qs('.featured');
  const title = qs('.featured__title', section);
  const tag = qs('.featured__intro .tag', section);
  const media = qs('.featured__media', section);
  const clip = qs('.featured__clip', section);
  const img = qs('.featured__clip img', section);
  const facts = qsa('.featured__facts > div', section);

  if (reduced) return;

  const lines = SplitText.create(title, splitOptions('lines', { mask: 'lines', autoSplit: true, onSplit: (self) =>
    gsap.from(self.lines, {
      yPercent: 105,
      duration: 1.3,
      ease: 'expo.out',
      stagger: 0.1,
      scrollTrigger: { trigger: title, start: 'top 82%' },
    }),
  }));
  gsap.from(tag, { autoAlpha: 0, y: 12, duration: 1, scrollTrigger: { trigger: title, start: 'top 82%' } });

  gsap.fromTo(
    clip,
    { clipPath: 'inset(16% 31% 0% 31%)' },
    {
      clipPath: 'inset(0% 0% 0% 0%)',
      ease: 'power1.inOut',
      scrollTrigger: { trigger: media, start: 'top bottom', end: 'top top', scrub: true },
    },
  );
  gsap.fromTo(
    img,
    { scale: 1.4 },
    { scale: 1, ease: 'none', scrollTrigger: { trigger: media, start: 'top bottom', end: 'bottom bottom', scrub: true } },
  );
  gsap.from(facts, {
    autoAlpha: 0,
    y: 36,
    stagger: 0.12,
    ease: 'power2.out',
    scrollTrigger: { trigger: media, start: 'top top', end: '+=45%', scrub: true },
  });

  return lines;
}

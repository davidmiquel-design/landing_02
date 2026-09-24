import { gsap, SplitText } from './gsap.js';
import { qs, splitOptions } from './utils.js';

/** px inset() that draws a centred circle inside the element's box. */
const circleInset = (el, ratio = 0.8) => {
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  const d = Math.min(w, h) * ratio;
  const y = (h - d) / 2;
  const x = (w - d) / 2;
  return `inset(${y}px ${x}px ${y}px ${x}px round ${d / 2}px)`;
};

/** Horizontal offset that brings the element to the centre of its frame. */
const centreOffset = (el, frame) => frame.offsetWidth / 2 - (el.offsetLeft + el.offsetWidth / 2);

/**
 * Studio: a slab rises and widens; inside it the image opens as an oculus,
 * slides to its column and unfolds into a rectangle while the copy appears.
 */
export function initStudio({ reduced }) {
  const section = qs('.studio');
  const pin = qs('.studio__pin', section);
  const frame = qs('.studio__frame', section);
  const media = qs('.studio__media', section);
  const copy = qs('.studio__copy', section);
  const title = qs('.works-title', section);
  const words = [...title.querySelectorAll('.works-title__word')];
  const badge = qs('.works-title__badge', section);

  const titleSplit = SplitText.create(words, splitOptions('chars', { mask: 'chars' }));

  if (reduced) return;

  const mm = gsap.matchMedia();
  mm.add({ desktop: '(min-width: 900px)', mobile: '(max-width: 899px)' }, ({ conditions }) => {
    gsap.fromTo(
      frame,
      { clipPath: 'inset(24% 20% 0% 20%)' },
      {
        clipPath: 'inset(0% 0% 0% 0%)',
        ease: 'none',
        scrollTrigger: { trigger: section, start: 'top bottom', end: 'top top', scrub: true },
      },
    );

    if (conditions.desktop) {
      gsap
        .timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: pin,
            start: 'top top',
            end: '+=130%',
            pin: true,
            scrub: true,
            invalidateOnRefresh: true,
          },
        })
        .fromTo(
          media,
          { x: () => centreOffset(media, frame), clipPath: () => circleInset(media), scale: 1.08 },
          { x: 0, clipPath: 'inset(0px 0px 0px 0px round 0px)', scale: 1, duration: 1, ease: 'power2.inOut' },
          0,
        )
        .fromTo(media.querySelector('img'), { scale: 1.35 }, { scale: 1, duration: 1.2, ease: 'power1.out' }, 0)
        .from(copy.children, { autoAlpha: 0, y: 48, stagger: 0.08, duration: 0.45, ease: 'power2.out' }, 0.5)
        .to({}, { duration: 0.2 });
    } else {
      gsap.fromTo(
        media,
        { clipPath: () => circleInset(media, 0.9) },
        {
          clipPath: 'inset(0px 0px 0px 0px round 0px)',
          ease: 'power1.inOut',
          scrollTrigger: { trigger: media, start: 'top 90%', end: 'center 45%', scrub: true, invalidateOnRefresh: true },
        },
      );
      gsap.from(copy.children, {
        autoAlpha: 0,
        y: 32,
        stagger: 0.1,
        duration: 1,
        scrollTrigger: { trigger: copy, start: 'top 85%' },
      });
    }

    // "SELECTED ( ◎ ) WORKS" — letters rise from their masks, the badge rolls in.
    gsap
      .timeline({ scrollTrigger: { trigger: title, start: 'top 92%', end: 'bottom 55%', scrub: true } })
      .from(titleSplit.chars, { yPercent: 105, stagger: 0.035, ease: 'power2.out' }, 0)
      .from(badge, { scale: 0.2, rotate: -140, autoAlpha: 0, ease: 'power2.out' }, 0.1)
      .fromTo(title, { xPercent: 6 }, { xPercent: -2, ease: 'none' }, 0);
  });
}

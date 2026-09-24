import { gsap, ScrollTrigger, SplitText } from './gsap.js';
import { qs, qsa, splitOptions } from './utils.js';

/**
 * Works index: the list scrolls while a sticky frame swaps the active
 * building with a directional wipe (desktop). On small screens every item
 * keeps its own image.
 */
export function initWorks({ reduced }) {
  const section = qs('.works');
  const items = qsa('.work', section);
  const layers = qs('.works__layers', section);
  const label = qs('.works__label span', section);
  const current = qs('.works__current', section);
  const heading = qs('.works__heading', section);

  // The sticky frame reuses each item's <picture>.
  const pictures = items.map((item) => {
    const picture = qs('.work__media .pic', item).cloneNode(true);
    const img = picture.querySelector('img');
    img.alt = '';
    img.loading = 'eager';
    picture.classList.add('works__layer');
    layers.append(picture);
    return picture;
  });

  let active = 0;
  let depth = 1;
  let labelSwap;
  const setActive = (index, direction = 1) => {
    if (index === active) return;
    active = index;
    items.forEach((item, i) => item.classList.toggle('is-active', i === index));
    current.textContent = String(index + 1).padStart(2, '0');

    const picture = pictures[index];
    const img = picture.querySelector('img');
    gsap.set(picture, { zIndex: ++depth });
    gsap.fromTo(
      picture,
      { clipPath: direction > 0 ? 'inset(100% 0% 0% 0%)' : 'inset(0% 0% 100% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.15, ease: 'expo.out', overwrite: true },
    );
    gsap.fromTo(img, { scale: 1.3, yPercent: 8 * direction }, { scale: 1, yPercent: 0, duration: 1.6, ease: 'expo.out', overwrite: true });

    labelSwap?.kill();
    labelSwap = gsap
      .timeline()
      .to(label, { yPercent: -110 * direction, duration: 0.3, ease: 'power2.in' })
      .add(() => {
        label.textContent = items[index].dataset.label;
      })
      .fromTo(label, { yPercent: 110 * direction }, { yPercent: 0, duration: 0.8, ease: 'expo.out' });
  };

  items[0].classList.add('is-active');
  gsap.set(pictures, { clipPath: 'inset(100% 0% 0% 0%)' });
  gsap.set(pictures[0], { clipPath: 'inset(0% 0% 0% 0%)', zIndex: 1 });

  const headingSplit = SplitText.create(heading, splitOptions('words', { mask: 'words' }));

  if (reduced) {
    items.forEach((item, i) =>
      ScrollTrigger.create({ trigger: item, start: 'top 55%', end: 'bottom 55%', onToggle: (s) => s.isActive && setActive(i) }),
    );
    return;
  }

  gsap.from(headingSplit.words, {
    yPercent: 110,
    duration: 1.2,
    ease: 'expo.out',
    stagger: 0.08,
    scrollTrigger: { trigger: heading, start: 'top 85%' },
  });

  const mm = gsap.matchMedia();
  mm.add({ desktop: '(min-width: 900px)', mobile: '(max-width: 899px)' }, ({ conditions }) => {
    items.forEach((item, i) => {
      const name = qs('.work__name', item);
      gsap
        .timeline({ scrollTrigger: { trigger: item, start: 'top 88%' } })
        .from(item, { '--line': 0, duration: 1.4, ease: 'expo.out' }, 0)
        .from(name, { yPercent: 60, autoAlpha: 0, duration: 1.2, ease: 'expo.out' }, 0.05)
        .from(qsa('.work__num, .work__meta', item), { autoAlpha: 0, y: 16, duration: 0.8, stagger: 0.08 }, 0.2);

      if (conditions.desktop) {
        ScrollTrigger.create({
          trigger: item,
          start: 'top 55%',
          end: 'bottom 55%',
          onEnter: () => setActive(i, 1),
          onEnterBack: () => setActive(i, -1),
        });
      } else {
        const media = qs('.work__media', item);
        gsap.fromTo(
          media,
          { clipPath: 'inset(18% 10% 18% 10%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: media, start: 'top 95%', end: 'top 45%', scrub: true } },
        );
        gsap.fromTo(
          media.querySelector('img'),
          { yPercent: -8, scale: 1.2 },
          { yPercent: 8, scale: 1.2, ease: 'none', scrollTrigger: { trigger: media, start: 'top bottom', end: 'bottom top', scrub: true } },
        );
      }
    });
  });
}

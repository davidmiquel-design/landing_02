import { gsap, SplitText } from './gsap.js';
import { qs, splitOptions, wait } from './utils.js';

/**
 * The monolith mark rises, the counter runs while the hero loads, then the
 * mark's oculus opens and we zoom through it into the hero.
 */
export async function runPreloader({ ready, reduced, onZoom, onReveal }) {
  const root = qs('.preloader');
  const curtain = qs('.preloader__curtain', root);
  const mark = qs('.preloader__mark', root);
  const plug = qs('.preloader__plug', root);
  const word = qs('.preloader__word', root);
  const meta = qs('.preloader__meta', root);
  const count = qs('.preloader__count', root);

  if (reduced) {
    await ready;
    await gsap.to(root, { autoAlpha: 0, duration: 0.5, ease: 'none' });
    root.remove();
    onReveal?.();
    return;
  }

  const split = SplitText.create(word, splitOptions('chars', { mask: 'chars', aria: 'none' }));
  gsap.set(mark, { clipPath: 'inset(100% 0% 0% 0%)' });
  gsap.set(split.chars, { yPercent: 110 });
  gsap.set(meta, { autoAlpha: 0, y: 10 });

  const intro = gsap
    .timeline({ delay: 0.25 })
    .to(mark, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'expo.out' })
    .to(split.chars, { yPercent: 0, duration: 1, ease: 'expo.out', stagger: 0.05 }, 0.35)
    .to(meta, { autoAlpha: 1, y: 0, duration: 0.8 }, 0.6);

  const counter = { value: 0 };
  const renderCount = () => {
    count.textContent = String(Math.round(counter.value)).padStart(3, '0');
  };
  gsap.to(counter, { value: 86, duration: 2.4, ease: 'power2.out', onUpdate: renderCount });

  await Promise.all([ready, intro, wait(1900)]);
  await gsap.to(counter, { value: 100, duration: 0.45, ease: 'power2.inOut', onUpdate: renderCount, overwrite: true });

  // Geometry of the oculus (the plug sits exactly on the mark's hole).
  const box = plug.getBoundingClientRect();
  const cx = box.left + box.width / 2;
  const cy = box.top + box.height / 2;
  const r0 = box.width / 2;
  const cover = Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy)) + 40;
  gsap.set(curtain, { '--cx': `${cx}px`, '--cy': `${cy}px`, '--r': '0px' });

  const zoom = { s: 1 };
  const exit = gsap.timeline();
  exit
    .to([meta, split.chars], { autoAlpha: 0, duration: 0.35, ease: 'power2.in', stagger: 0.015 }, 0)
    // The plug drops away: the oculus now looks onto the hero.
    .to(plug, { scale: 0, duration: 0.55, ease: 'power3.in' }, 0.1)
    .to(curtain, { '--r': `${r0}px`, duration: 0.55, ease: 'power3.in' }, 0.1)
    .addLabel('zoom', 0.75)
    .add(() => onZoom?.(), 'zoom')
    .to(mark, { color: '#060606', duration: 0.45, ease: 'none' }, 'zoom')
    .to(
      zoom,
      {
        s: cover / r0,
        duration: 1.5,
        ease: 'expo.inOut',
        onUpdate() {
          gsap.set(mark, { scale: zoom.s });
          gsap.set(curtain, { '--r': `${r0 * zoom.s}px` });
        },
      },
      'zoom',
    )
    .add(() => onReveal?.(), 'zoom+=0.75');

  await exit;
  root.remove();
}

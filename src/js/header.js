import { gsap, ScrollTrigger } from './gsap.js';
import { qs, qsa } from './utils.js';

const SECTIONS = [
  { key: 'intro', trigger: '.hero', endTrigger: '.manifesto' },
  { key: 'studio', trigger: '.studio', endTrigger: '.studio' },
  { key: 'works', trigger: '.rings', endTrigger: '.featured' },
  { key: 'light', trigger: '.light', endTrigger: '.light' },
  { key: 'story', trigger: '.story', endTrigger: '.finale' },
];

/** Section indicator in the nav and the scroll-progress ring. */
export function initHeader() {
  const header = qs('.header');
  const links = qsa('[data-nav]', header);
  const setActive = (key) => links.forEach((a) => a.classList.toggle('is-active', a.dataset.nav === key));

  SECTIONS.forEach(({ key, trigger, endTrigger }) =>
    ScrollTrigger.create({
      trigger,
      endTrigger,
      start: 'top 50%',
      end: 'bottom 50%',
      onToggle: (self) => self.isActive && setActive(key),
    }),
  );

  const bar = qs('.progress__bar');
  const length = 2 * Math.PI * 17;
  bar.style.strokeDasharray = `${length}`;
  bar.style.strokeDashoffset = `${length}`;
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      bar.style.strokeDashoffset = `${length * (1 - self.progress)}`;
    },
  });
}

/** Header items drop in once the preloader has opened. */
export function revealHeader({ reduced }) {
  const items = qsa('.header__nav a, .header__logo, .header__cta > *, .progress');
  if (reduced) {
    gsap.set(items, { autoAlpha: 1 });
    return;
  }
  gsap.fromTo(items, { autoAlpha: 0, y: -14 }, { autoAlpha: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.05 });
}

import Lenis from 'lenis';
import { gsap, ScrollTrigger } from './gsap.js';

const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

/** Lenis smooth scrolling synced with the GSAP ticker; smooth anchor links. */
export function initSmoothScroll({ reduced }) {
  if (reduced) {
    document.documentElement.style.scrollBehavior = 'auto';
    return null;
  }

  const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const hash = link.getAttribute('href');
    event.preventDefault();
    if (hash === '#') return;
    const target = hash === '#top' ? 0 : document.querySelector(hash);
    if (target === null) return;
    lenis.scrollTo(target, { duration: 1.8, easing: easeOutQuart });
  });

  return lenis;
}

import { gsap, SplitText } from './gsap.js';
import { lerp, qs, smoothstep, splitOptions } from './utils.js';

/**
 * Stepped (ziggurat) outline of the rising slab. p = 0: a narrow monolith with
 * three tiers; p = 1: the full-bleed rectangle.
 */
function steppedPolygon(w, h, p) {
  const vh = window.innerHeight;
  const half = w / 2;
  const widen = gsap.parseEase('power2.inOut')(p);
  const flatten = 1 - smoothstep(0.45, 1, p);
  const top = lerp(w * 0.15, half, widen); // half-width of the top tier
  const step = lerp(w * 0.07, 0, widen) * flatten; // horizontal step per tier
  const rise = vh * 0.07 * flatten; // vertical step per tier
  const hw = [top, top + step, top + step * 2];
  const pts = [
    [half - hw[2], h],
    [half - hw[2], rise * 2],
    [half - hw[1], rise * 2],
    [half - hw[1], rise],
    [half - hw[0], rise],
    [half - hw[0], 0],
    [half + hw[0], 0],
    [half + hw[0], rise],
    [half + hw[1], rise],
    [half + hw[1], rise * 2],
    [half + hw[2], rise * 2],
    [half + hw[2], h],
  ];
  return `polygon(${pts.map(([x, y]) => `${Math.max(0, Math.min(w, x)).toFixed(1)}px ${y.toFixed(1)}px`).join(',')})`;
}

export function initManifesto({ reduced }) {
  const section = qs('.manifesto');
  const panel = qs('.manifesto__panel', section);
  const glow = qs('.manifesto__glow', section);
  const text = qs('.manifesto__text', section);
  const note = qs('.manifesto__note', section);

  if (reduced) return;

  const shape = { p: 0 };
  const applyShape = () => {
    panel.style.clipPath = steppedPolygon(panel.offsetWidth, panel.offsetHeight, shape.p);
  };
  applyShape();
  gsap.to(shape, {
    p: 1,
    ease: 'none',
    onUpdate: applyShape,
    scrollTrigger: {
      trigger: section,
      start: 'top bottom',
      end: 'top top',
      scrub: true,
      onRefresh: applyShape,
    },
  });

  // Words light up one after another, like windows at dusk.
  const split = SplitText.create(text, splitOptions('words'));
  gsap.fromTo(
    split.words,
    { opacity: 0.12 },
    {
      opacity: 1,
      ease: 'none',
      stagger: 0.12,
      scrollTrigger: { trigger: text, start: 'top 78%', end: 'bottom 42%', scrub: true },
    },
  );

  gsap.fromTo(
    glow,
    { opacity: 0, yPercent: 35 },
    { opacity: 1, yPercent: 0, ease: 'none', scrollTrigger: { trigger: panel, start: 'top 20%', end: 'bottom bottom', scrub: true } },
  );

  gsap.from(note, {
    opacity: 0,
    y: 40,
    ease: 'none',
    scrollTrigger: { trigger: note, start: 'top 95%', end: 'top 70%', scrub: true },
  });
}

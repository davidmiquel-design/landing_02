export const qs = (selector, root = document) => root.querySelector(selector);
export const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (edge0, edge1, x) => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

export const media = {
  reduced: window.matchMedia('(prefers-reduced-motion: reduce)'),
  finePointer: window.matchMedia('(hover: hover) and (pointer: fine)'),
  desktop: window.matchMedia('(min-width: 900px)'),
};

export const prefersReducedMotion = () => media.reduced.matches;

export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * SplitText options. The default <div> tag is kept on purpose: SplitText only
 * sets inline-block/block display on non-span wrappers, and transforms need it.
 */
export const splitOptions = (type, extra = {}) => ({
  type,
  charsClass: 'char',
  wordsClass: 'word',
  linesClass: 'line',
  ...extra,
});

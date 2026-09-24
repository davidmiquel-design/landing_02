import '@fontsource-variable/archivo/standard.css';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource-variable/jetbrains-mono/wght.css';

import './styles/tokens.css';
import './styles/base.css';
import './styles/ui.css';
import './styles/sections.css';

import { ScrollTrigger } from './js/gsap.js';
import { initSmoothScroll } from './js/smooth.js';
import { runPreloader } from './js/preloader.js';
import { initHeader, revealHeader } from './js/header.js';
import { initHero } from './js/hero.js';
import { initManifesto } from './js/manifesto.js';
import { initStudio } from './js/studio.js';
import { initRings } from './js/rings.js';
import { initWorks } from './js/works.js';
import { initFeatured } from './js/featured.js';
import { initLight } from './js/light.js';
import { initStory } from './js/story.js';
import { initFinale } from './js/finale.js';
import { initCursor } from './js/cursor.js';
import { prefersReducedMotion } from './js/utils.js';

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

async function boot() {
  const reduced = prefersReducedMotion();
  const options = { reduced };
  document.documentElement.classList.toggle('is-reduced', reduced);

  const lenis = initSmoothScroll(options);
  lenis?.stop();
  if (import.meta.env.DEV) window.__lenis = lenis;

  const hero = initHero(options);
  const fonts = document.fonts.ready;

  // Every section is built (in DOM order, so pins are measured correctly)
  // while the preloader is still covering the page.
  await fonts;
  initManifesto(options);
  initStudio(options);
  initRings(options);
  initWorks(options);
  initFeatured(options);
  initLight(options);
  initStory(options);
  initFinale(options);
  initHeader(options);
  initCursor(options);
  ScrollTrigger.refresh();

  await runPreloader({
    ready: Promise.all([fonts, hero.ready]),
    reduced,
    onZoom: () => hero.zoomIn(),
    onReveal: () => {
      document.documentElement.classList.remove('is-loading');
      lenis?.start();
      hero.intro();
      revealHeader(options);
    },
  });

  // Late layout shifts (images without intrinsic ratio, font swaps) settle here.
  window.addEventListener('load', () => ScrollTrigger.refresh());
}

boot();

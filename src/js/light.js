import { gsap, ScrollTrigger } from './gsap.js';
import { FrameSequence } from './sequence.js';
import { qs, qsa } from './utils.js';
import manifest from '../media-manifest.json';

const START_MIN = 18 * 60 + 52; // 18:52, sunset
const END_MIN = 23 * 60 + 59;

const formatTime = (minutes) => {
  const m = Math.round(minutes);
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

/** Light study: a slider scrubs a dusk-to-night timelapse of a concrete facade. */
export function initLight({ reduced }) {
  const section = qs('.light');
  const canvas = qs('.light__canvas', section);
  const range = qs('.light__range', section);
  const play = qs('.light__play', section);
  const phases = qsa('.light__phases button', section);
  const time = qs('.light__time', section);
  const sun = qs('.light__sun', section);
  const lit = qs('.light__lit', section);
  const title = qs('.light__title', section);

  const meta = manifest.sequences.light;
  const sequence = meta ? new FrameSequence({ canvas, name: 'light', meta }) : null;
  const state = { v: 0 };
  let autoplay;

  const set = (v) => {
    state.v = v;
    range.value = String(Math.round(v * 1000));
    range.style.setProperty('--fill', `${v * 100}%`);
    sequence?.render(v);
    time.textContent = formatTime(START_MIN + (END_MIN - START_MIN) * v);
    sun.textContent = `−${(2 + 29.5 * v).toFixed(1)}°`;
    lit.textContent = `${Math.round(Math.pow(v, 1.4) * 86)}%`;
    const phase = v < 0.3 ? 0 : v < 0.72 ? 1 : 2;
    phases.forEach((b, i) => b.classList.toggle('is-current', i === phase));
  };

  const tweenTo = (to, duration) => {
    autoplay?.kill();
    autoplay = gsap.to(state, { v: to, duration, ease: 'sine.inOut', onUpdate: () => set(state.v) });
    return autoplay;
  };

  range.addEventListener('input', () => {
    autoplay?.kill();
    set(Number(range.value) / 1000);
  });
  phases.forEach((button) =>
    button.addEventListener('click', () => tweenTo(Number(button.dataset.at), reduced ? 0 : 1.6)),
  );
  play.addEventListener('click', () => {
    set(0);
    tweenTo(1, reduced ? 0 : 7);
  });
  set(0);

  // Start loading frames shortly before the section is reached.
  ScrollTrigger.create({
    trigger: section,
    start: 'top 180%',
    once: true,
    onEnter: () => sequence?.start().then(() => gsap.to(canvas, { autoAlpha: 1, duration: 0.4 })),
  });

  if (reduced) return;

  gsap.from(qs('.light__card', section), {
    clipPath: 'inset(12% 8% 12% 8%)',
    ease: 'none',
    scrollTrigger: { trigger: section, start: 'top bottom', end: 'top 25%', scrub: true },
  });
  gsap.from(title, { autoAlpha: 0, y: 40, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: title, start: 'top 85%' } });

  // Play the night once, the first time the viewer reaches it.
  ScrollTrigger.create({
    trigger: qs('.light__viewer', section),
    start: 'top 65%',
    once: true,
    onEnter: () => {
      if (Number(range.value) === 0) tweenTo(1, 7);
    },
  });
}

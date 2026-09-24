import { gsap, ScrollTrigger, SplitText } from './gsap.js';
import { media, qs, qsa, splitOptions } from './utils.js';

const numberFormat = new Intl.NumberFormat('en-GB');

/**
 * Story: a torch reveals the photograph under the chalk drawing, the founder's
 * quote rises line by line and the figures count up.
 */
export function initStory({ reduced }) {
  const section = qs('.story');
  const title = qs('.story__title', section);
  const reveal = qs('.story__reveal', section);
  const photo = qs('.story__photo', section);
  const quote = qs('.story__quote p', section);
  const counters = qsa('[data-count]', section);

  // --- torchlight -----------------------------------------------------------
  const light = { x: 0, y: 0, r: 0 };
  const apply = () => {
    photo.style.setProperty('--lx', `${light.x}px`);
    photo.style.setProperty('--ly', `${light.y}px`);
    photo.style.setProperty('--lr', `${light.r}px`);
  };
  const radius = () => reveal.offsetWidth * 0.34;
  const toX = gsap.quickTo(light, 'x', { duration: 0.55, ease: 'power3', onUpdate: apply });
  const toY = gsap.quickTo(light, 'y', { duration: 0.55, ease: 'power3', onUpdate: apply });

  if (media.finePointer.matches && !reduced) {
    reveal.addEventListener('pointerenter', (e) => {
      const box = reveal.getBoundingClientRect();
      light.x = e.clientX - box.left;
      light.y = e.clientY - box.top;
      gsap.to(light, { r: radius(), duration: 0.7, ease: 'expo.out', onUpdate: apply, overwrite: 'auto' });
    });
    reveal.addEventListener('pointermove', (e) => {
      const box = reveal.getBoundingClientRect();
      toX(e.clientX - box.left);
      toY(e.clientY - box.top);
    });
    reveal.addEventListener('pointerleave', () =>
      gsap.to(light, { r: 0, duration: 0.8, ease: 'power3.inOut', onUpdate: apply, overwrite: 'auto' }),
    );
  } else {
    // Touch / reduced motion: the torch wanders on its own while in view.
    const wander = gsap.timeline({ paused: true, repeat: -1, onUpdate: apply });
    const w = () => reveal.offsetWidth;
    const h = () => reveal.offsetHeight;
    gsap.set(light, { x: () => w() * 0.3, y: () => h() * 0.35, r: () => radius() * 1.15 });
    apply();
    if (!reduced) {
      wander
        .to(light, { x: () => w() * 0.72, y: () => h() * 0.42, duration: 3, ease: 'sine.inOut' })
        .to(light, { x: () => w() * 0.55, y: () => h() * 0.75, duration: 3, ease: 'sine.inOut' })
        .to(light, { x: () => w() * 0.3, y: () => h() * 0.35, duration: 3, ease: 'sine.inOut' });
      ScrollTrigger.create({
        trigger: reveal,
        start: 'top bottom',
        end: 'bottom top',
        onToggle: (self) => (self.isActive ? wander.play() : wander.pause()),
      });
    }
    reveal.addEventListener('pointermove', (e) => {
      const box = reveal.getBoundingClientRect();
      wander.pause();
      toX(e.clientX - box.left);
      toY(e.clientY - box.top);
    });
  }

  // --- counters ---------------------------------------------------------------
  counters.forEach((el) => {
    const target = Number(el.dataset.count);
    const render = (v) => {
      el.textContent = el.dataset.format === 'thousands' ? numberFormat.format(Math.round(v)) : String(Math.round(v));
    };
    if (reduced) {
      render(target);
      return;
    }
    const obj = { v: 0 };
    gsap.to(obj, {
      v: target,
      duration: 2.2,
      ease: 'power2.out',
      onUpdate: () => render(obj.v),
      scrollTrigger: { trigger: el, start: 'top 90%' },
    });
  });

  if (reduced) return;

  // --- typography -------------------------------------------------------------
  const titleSplit = SplitText.create(title, splitOptions('chars', { mask: 'chars' }));
  gsap.from(titleSplit.chars, {
    yPercent: 105,
    duration: 1.4,
    ease: 'expo.out',
    stagger: 0.035,
    scrollTrigger: { trigger: title, start: 'top 80%' },
  });

  SplitText.create(
    quote,
    splitOptions('lines', {
      mask: 'lines',
      autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.lines, {
          yPercent: 105,
          duration: 1.2,
          ease: 'expo.out',
          stagger: 0.08,
          scrollTrigger: { trigger: quote, start: 'top 85%' },
        }),
    }),
  );

  gsap.from(reveal, {
    clipPath: 'inset(10% 10% 10% 10%)',
    ease: 'none',
    scrollTrigger: { trigger: reveal, start: 'top bottom', end: 'top 40%', scrub: true },
  });
}

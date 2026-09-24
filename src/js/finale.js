import { gsap, ScrollTrigger, SplitText } from './gsap.js';
import { qs, splitOptions } from './utils.js';

const clockFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Madrid',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

/** CTA slab lifts off the moonrise; the footer slab rises over it. */
export function initFinale({ reduced }) {
  const section = qs('.finale');
  const bg = qs('.finale__bg img', section);
  const cta = qs('.cta', section);
  const ctaTitle = qs('.cta__title', section);
  const footer = qs('.footer', section);
  const word = qs('.footer__word', section);
  const clock = qs('.footer__clock', section);
  const form = qs('.footer__news', section);
  const message = qs('.footer__msg', section);

  const tick = () => {
    clock.textContent = clockFormat.format(new Date());
  };
  tick();
  setInterval(tick, 1000);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = form.elements.email;
    if (!input.value || !input.checkValidity()) {
      message.textContent = 'Please enter a valid email.';
      input.focus();
      return;
    }
    message.textContent = 'Thank you — see you after dark.';
    form.reset();
  });

  // The header turns dark while it sits on the amber slab.
  ScrollTrigger.create({
    trigger: cta,
    start: 'top 40px',
    end: 'bottom 40px',
    toggleClass: { targets: '.header', className: 'header--on-light' },
  });

  if (reduced) return;

  gsap.fromTo(
    bg,
    { scale: 1.25, yPercent: -6 },
    { scale: 1, yPercent: 0, ease: 'none', scrollTrigger: { trigger: section, start: 'top top', end: 'bottom bottom', scrub: true } },
  );

  SplitText.create(
    ctaTitle,
    splitOptions('words', {
      mask: 'words',
      onSplit: (self) =>
        gsap.from(self.words, {
          yPercent: 110,
          duration: 1.3,
          ease: 'expo.out',
          stagger: 0.06,
          scrollTrigger: { trigger: ctaTitle, start: 'top 85%' },
        }),
    }),
  );
  gsap.from(qs('.cta__actions', section), {
    autoAlpha: 0,
    y: 24,
    duration: 1,
    scrollTrigger: { trigger: ctaTitle, start: 'top 75%' },
  });

  // The wordmark gains mass: condensed to expanded as the footer arrives.
  const chars = SplitText.create(word, splitOptions('chars', { mask: 'chars', aria: 'none' })).chars;
  gsap
    .timeline({ scrollTrigger: { trigger: footer, start: 'top 95%', end: 'top 25%', scrub: true } })
    .fromTo(word, { fontStretch: '62%', letterSpacing: '0.2em' }, { fontStretch: '125%', letterSpacing: '-0.02em', ease: 'power2.out' }, 0)
    .from(chars, { yPercent: 100, stagger: 0.04, ease: 'power2.out' }, 0);
}

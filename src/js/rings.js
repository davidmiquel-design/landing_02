import { gsap, ScrollTrigger } from './gsap.js';
import { qs, smoothstep } from './utils.js';

const RINGS = [
  { text: 'MASS · SHADOW · LIGHT · ', r: 1.34, size: 0.27, speed: 0.11, italic: true, alpha: 0.9 },
  { text: 'BÉTON BRUT · BOARD-FORMED · RAW · ', r: 1.86, size: 0.36, speed: -0.075, alpha: 0.72 },
  { text: 'MENORCA · ASTURIAS · BERLIN · SORIA · PORTO · LANZAROTE · ', r: 2.52, size: 0.47, speed: 0.055, italic: true, alpha: 0.58 },
  { text: 'HOUSES · BATHS · CHAPELS · ARCHIVES · TOWERS · MUSEUMS · ', r: 3.36, size: 0.62, speed: -0.04, alpha: 0.46 },
  { text: 'SHENKEN · ARCHITECTURE FOR THE NIGHT · 1987 — 2026 · ', r: 4.42, size: 0.8, speed: 0.03, italic: true, alpha: 0.36 },
];
// How much faster each ring grows than the central disc while zooming (depth).
const DEPTH = [1.1, 1.2, 1.3, 1.42, 1.55];

/**
 * Rotating rings of words around an oculus. Scrolling zooms through them until
 * the oculus (moon seen through a concrete ceiling) fills the screen.
 */
export function initRings({ reduced }) {
  const section = qs('.rings');
  const stage = qs('.rings__stage', section);
  const canvas = qs('.rings__canvas', section);
  const source = qs('.rings__source', section);
  const ctx = canvas.getContext('2d');

  let width = 0;
  let height = 0;
  let dpr = 1;
  let unit = 1; // base radius of the oculus in CSS px
  let layouts = [];
  let progress = 0;
  let clock = 0;
  let visible = false;

  const font = (ring, px) => `${ring.italic ? 'italic ' : ''}400 ${px}px "Instrument Serif", Georgia, serif`;

  // Lay glyphs out along each circle once per resize (in unit space).
  const layout = () => {
    const rect = stage.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    unit = Math.min(width, height) * (width < 700 ? 0.1 : 0.078);

    layouts = RINGS.map((ring) => {
      const radius = ring.r * unit;
      const size = ring.size * unit;
      ctx.font = font(ring, size);
      const chars = [...ring.text];
      const advances = chars.map((c) => ctx.measureText(c).width + size * 0.08);
      const repeatWidth = advances.reduce((a, b) => a + b, 0);
      const circumference = Math.PI * 2 * radius;
      const repeats = Math.max(1, Math.floor(circumference / repeatWidth));
      const spread = circumference / (repeats * repeatWidth);
      const glyphs = [];
      let s = 0;
      for (let k = 0; k < repeats; k++) {
        chars.forEach((c, i) => {
          const adv = advances[i] * spread;
          glyphs.push({ c, angle: (s + adv / 2) / radius });
          s += adv;
        });
      }
      return { ...ring, radius, size, glyphs };
    });
  };

  const draw = () => {
    if (!width) return;
    const cx = width / 2;
    const cy = height / 2;
    const halfDiag = Math.hypot(cx, cy);
    const zoomEnd = (halfDiag * 1.08) / unit;
    // Exponential zoom feels like constant speed through depth.
    const zp = smoothstep(0.08, 0.92, progress);
    const zoom = Math.exp(Math.log(zoomEnd) * zp);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0b0b0c';
    ctx.fillRect(0, 0, width, height);

    // Oculus disc
    const discR = unit * zoom;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, discR, 0, Math.PI * 2);
    ctx.clip();
    if (source.complete && source.naturalWidth) {
      const inner = 1 + 0.5 * smoothstep(0.55, 1, progress);
      const size = discR * 2 * 1.12 * inner;
      ctx.drawImage(source, cx - size / 2, cy - size / 2, size, size);
    } else {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, discR);
      g.addColorStop(0, '#ffb775');
      g.addColorStop(1, '#c6561d');
      ctx.fillStyle = g;
      ctx.fillRect(cx - discR, cy - discR, discR * 2, discR * 2);
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(236, 230, 218, 0.28)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, discR, 0, Math.PI * 2);
    ctx.stroke();

    // Rings of words
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    layouts.forEach((ring, i) => {
      const scale = Math.pow(zoom, DEPTH[i]);
      const radius = ring.radius * scale;
      const fade = 1 - smoothstep(halfDiag * 0.9, halfDiag * 1.6, radius - ring.size * scale);
      const alpha = ring.alpha * fade;
      if (alpha <= 0.002) return;
      const rotation = ring.speed * clock + progress * 1.4 * Math.sign(ring.speed);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      ctx.rotate(rotation);
      ctx.font = font(ring, ring.size);
      ctx.fillStyle = `rgba(236, 230, 218, ${alpha})`;
      for (const g of ring.glyphs) {
        ctx.save();
        ctx.rotate(g.angle);
        ctx.translate(0, -ring.radius);
        ctx.fillText(g.c, 0, 0);
        ctx.restore();
      }
      ctx.restore();
    });

    // Hand over to the next section: the oculus darkens into the page colour.
    const out = smoothstep(0.88, 1, progress);
    if (out > 0) {
      ctx.fillStyle = `rgba(11, 11, 12, ${out})`;
      ctx.fillRect(0, 0, width, height);
    }
  };

  const tick = (_, delta) => {
    if (!reduced) clock += delta / 1000;
    draw();
  };

  layout();
  draw();
  source.addEventListener('load', draw);
  window.addEventListener('resize', () => {
    layout();
    draw();
  });

  // The pin goes first so the visibility trigger below measures the pinned height.
  if (!reduced) {
    ScrollTrigger.create({
      trigger: stage,
      start: 'top top',
      end: '+=240%',
      pin: true,
      scrub: true,
      onUpdate: (self) => {
        progress = self.progress;
        if (!visible) draw();
      },
    });
  }

  ScrollTrigger.create({
    trigger: section,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => {
      visible = self.isActive;
      if (visible) gsap.ticker.add(tick);
      else gsap.ticker.remove(tick);
    },
  });
}

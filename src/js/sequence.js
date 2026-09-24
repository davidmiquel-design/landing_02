import { clamp } from './utils.js';

const BASE = import.meta.env.BASE_URL;

/**
 * Image-sequence player drawn on a canvas (Apple-style scroll scrubbing).
 * Frames load progressively (coarse to fine), so scrubbing works early by
 * drawing the nearest frame that has already loaded.
 */
export class FrameSequence {
  constructor({ canvas, name, meta, focus = [0.5, 0.5] }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.name = name;
    this.meta = meta;
    this.count = meta.count;
    this.focus = focus;
    this.frames = new Array(this.count);
    this.current = -1;
    this.progress = 0;
    this.started = false;

    this.resize();
    this.variant = this.pickVariant();
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(canvas);
  }

  /** Portrait screens get a portrait crop when one exists; otherwise the smallest size that is sharp enough. */
  pickVariant() {
    const entries = Object.entries(this.meta.sizes);
    const { width: cw, height: ch } = this.canvas;
    const portraitScreen = ch > cw;
    const portrait = entries.filter(([, [w, h]]) => h > w);
    const pool = portraitScreen && portrait.length ? portrait : entries.filter(([, [w, h]]) => w >= h);
    const candidates = (pool.length ? pool : entries).sort((a, b) => a[1][0] - b[1][0]);
    // Width the frame is drawn at when covering the canvas, with some tolerance for upscaling.
    const needed = (w, h) => Math.max(cw, ch * (w / h)) / 1.35;
    const fit = candidates.find(([, [w, h]]) => w >= needed(w, h));
    return (fit ?? candidates.at(-1))[0];
  }

  url(index) {
    return `${BASE}media/seq/${this.name}/${this.variant}/${String(index + 1).padStart(4, '0')}.webp`;
  }

  loadFrame(index) {
    if (this.frames[index]) return this.frames[index].promise;
    const img = new Image();
    img.decoding = 'async';
    const frame = { img, loaded: false };
    frame.promise = new Promise((resolve) => {
      img.onload = () => {
        frame.loaded = true;
        resolve(img);
      };
      img.onerror = () => resolve(null);
    });
    img.src = this.url(index);
    this.frames[index] = frame;
    return frame.promise;
  }

  /** 0, last, then every 16th, 8th, 4th, 2nd and finally every frame. */
  loadOrder() {
    const seen = new Set();
    const order = [];
    const add = (i) => {
      if (i >= 0 && i < this.count && !seen.has(i)) {
        seen.add(i);
        order.push(i);
      }
    };
    add(0);
    add(this.count - 1);
    for (const stride of [16, 8, 4, 2, 1]) for (let i = 0; i < this.count; i += stride) add(i);
    return order;
  }

  /** Resolves once the first frame is drawn; the rest keep loading in the background. */
  async start({ concurrency = 6 } = {}) {
    if (this.started) return this.firstFrame;
    this.started = true;
    const [first, ...rest] = this.loadOrder();
    this.firstFrame = this.loadFrame(first).then(() => {
      this.render(this.progress, true);
    });
    await this.firstFrame;
    let cursor = 0;
    const worker = async () => {
      while (cursor < rest.length) {
        const index = rest[cursor++];
        await this.loadFrame(index);
        this.render(this.progress);
      }
    };
    this.complete = Promise.all(Array.from({ length: concurrency }, worker));
    return this.firstFrame;
  }

  nearestLoaded(index) {
    for (let d = 0; d < this.count; d++) {
      if (this.frames[index - d]?.loaded) return index - d;
      if (this.frames[index + d]?.loaded) return index + d;
    }
    return -1;
  }

  render(progress, force = false) {
    this.progress = clamp(progress, 0, 1);
    const target = Math.round(this.progress * (this.count - 1));
    const index = this.nearestLoaded(target);
    if (index !== -1 && (force || index !== this.current)) this.draw(index);
  }

  draw(index) {
    const frame = this.frames[index];
    if (!frame?.loaded) return;
    this.current = index;
    const { img } = frame;
    const { width: cw, height: ch } = this.canvas;
    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    this.ctx.imageSmoothingQuality = 'high';
    this.ctx.drawImage(img, (cw - w) * this.focus[0], (ch - h) * this.focus[1], w, h);
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(this.canvas.clientWidth * dpr);
    const h = Math.round(this.canvas.clientHeight * dpr);
    if (!w || !h || (w === this.canvas.width && h === this.canvas.height)) return;
    this.canvas.width = w;
    this.canvas.height = h;
    if (this.current >= 0) this.draw(this.current);
  }
}

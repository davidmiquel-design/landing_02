// Converts the Magnific masters in assets/source into the files the site loads:
//   assets/source/images/<id>.jpg   -> public/media/img/<id>-<width>.{avif,webp}
//   assets/source/video/<id>.mp4    -> public/media/seq/<name>/<size>/NNNN.webp + meta.json
// then regenerates src/media-manifest.json (scripts/scan-media.mjs).
//
// Needs sharp (devDependency) and an ffmpeg binary: `pip install imageio-ffmpeg`,
// or set FFMPEG=/path/to/ffmpeg.
//
//   node scripts/build-media.mjs            only missing outputs
//   node scripts/build-media.mjs --force    rebuild everything
//   node scripts/build-media.mjs hero p01-casa-umbra   only these ids
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import { scanMedia } from './scan-media.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const srcImg = path.join(root, 'assets/source/images');
const srcVid = path.join(root, 'assets/source/video');
const outImg = path.join(root, 'public/media/img');
const outSeq = path.join(root, 'public/media/seq');

const args = process.argv.slice(2);
const force = args.includes('--force');
const only = new Set(args.filter((a) => !a.startsWith('--')));
const wanted = (id) => !only.size || only.has(id);

// Responsive widths by layout role; unknown ids fall back by aspect ratio.
const WIDE = [960, 1600, 2400, 3200];
const TALL = [480, 800, 1200, 1600];
const WIDTHS = {
  'hero-first-frame': WIDE,
  'p02-nocturne-baths-wide': WIDE,
  'lightstudy-dusk': WIDE,
  'footer-moonrise': WIDE,
  'oculus-moon': [800, 1400, 2000],
  'story-photo': [600, 1000, 1500],
  'story-sketch': [600, 1000, 1500],
  'texture-concrete': [800, 1600],
};

// Video id -> sequence name used by the runtime (manifest.sequences.<name>).
const SEQUENCES = {
  hero: { name: 'hero', frames: 120, focus: [0.5, 0.5] },
  lightstudy: { name: 'light', frames: 120, focus: [0.5, 0.5] },
};
const SEQ_SIZES = { lg: [1920, 1080], md: [1280, 720], port: [720, 1280] };

function ffmpegPath() {
  if (process.env.FFMPEG) return process.env.FFMPEG;
  try {
    return execFileSync('python3', ['-c', 'import imageio_ffmpeg as f; print(f.get_ffmpeg_exe())'], { encoding: 'utf8' }).trim();
  } catch {
    throw new Error('ffmpeg not found: run `pip install imageio-ffmpeg` or set FFMPEG');
  }
}

async function buildImage(file) {
  const id = path.basename(file, path.extname(file));
  if (!wanted(id)) return;
  const { width, height } = await sharp(file).metadata();
  const base = WIDTHS[id] ?? (width > height ? WIDE : TALL);
  // Never upscale: drop widths above the master, keep the master width as the largest.
  const widths = [...new Set([...base.filter((w) => w < width), Math.min(width, base.at(-1))])];
  for (const w of widths) {
    const img = sharp(file).rotate().resize({ width: w, kernel: 'lanczos3' }).toColourspace('srgb');
    const webp = path.join(outImg, `${id}-${w}.webp`);
    const avif = path.join(outImg, `${id}-${w}.avif`);
    if (force || !fs.existsSync(webp)) await img.clone().webp({ quality: 80, effort: 5 }).toFile(webp);
    if (force || !fs.existsSync(avif)) await img.clone().avif({ quality: 52, effort: 5 }).toFile(avif);
  }
  // Remove stale widths from an earlier build or from the placeholders.
  for (const f of fs.readdirSync(outImg)) {
    const m = f.match(/^(.+)-(\d+)\.(avif|webp)$/);
    if (m && m[1] === id && !widths.includes(Number(m[2]))) fs.rmSync(path.join(outImg, f));
  }
  console.log(`img  ${id}  ${width}×${height} -> ${widths.join(', ')}`);
}

async function buildSequence(id, file, ffmpeg) {
  const cfg = SEQUENCES[id];
  if (!cfg || !wanted(id)) return;
  const dir = path.join(outSeq, cfg.name);
  const metaFile = path.join(dir, 'meta.json');
  if (!force && fs.existsSync(metaFile) && JSON.parse(fs.readFileSync(metaFile, 'utf8')).source === path.basename(file)) {
    console.log(`seq  ${cfg.name}  up to date`);
    return;
  }

  // Evenly spaced frames across the whole clip, extracted losslessly first.
  const duration = videoDuration(ffmpeg, file);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), `seq-${id}-`));
  const fps = cfg.frames / duration;
  execFileSync(ffmpeg, ['-v', 'error', '-i', file, '-vf', `fps=${fps.toFixed(6)}`, '-frames:v', String(cfg.frames), path.join(tmp, '%04d.png')]);
  const frames = fs.readdirSync(tmp).filter((f) => f.endsWith('.png')).sort();
  if (!frames.length) throw new Error(`no frames extracted from ${file}`);

  fs.rmSync(dir, { recursive: true, force: true });
  for (const key of Object.keys(SEQ_SIZES)) fs.mkdirSync(path.join(dir, key), { recursive: true });
  const [fx, fy] = cfg.focus;
  for (const [i, f] of frames.entries()) {
    const src = path.join(tmp, f);
    const { width: sw, height: sh } = await sharp(src).metadata();
    const name = `${String(i + 1).padStart(4, '0')}.webp`;
    for (const [key, [w, h]] of Object.entries(SEQ_SIZES)) {
      // Cover crop around the focus point (matters for the vertical mobile crop).
      const scale = Math.max(w / sw, h / sh);
      const rw = Math.round(sw * scale), rh = Math.round(sh * scale);
      const left = Math.round(Math.min(Math.max(rw * fx - w / 2, 0), rw - w));
      const top = Math.round(Math.min(Math.max(rh * fy - h / 2, 0), rh - h));
      await sharp(src).resize(rw, rh, { kernel: 'lanczos3' }).extract({ left, top, width: w, height: h })
        .webp({ quality: key === 'lg' ? 74 : 72, effort: 4 }).toFile(path.join(dir, key, name));
    }
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  const meta = { count: frames.length, sizes: SEQ_SIZES, focus: cfg.focus, source: path.basename(file) };
  fs.writeFileSync(metaFile, JSON.stringify(meta));
  console.log(`seq  ${cfg.name}  ${frames.length} frames × ${Object.keys(SEQ_SIZES).join('/')}`);
}

function videoDuration(ffmpeg, file) {
  let out = '';
  try {
    execFileSync(ffmpeg, ['-i', file], { stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    out = String(e.stderr); // ffmpeg -i without output always exits 1
  }
  const m = out.match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
  if (!m) throw new Error(`cannot read duration of ${file}`);
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
}

fs.mkdirSync(outImg, { recursive: true });
fs.mkdirSync(outSeq, { recursive: true });

const images = fs.existsSync(srcImg) ? fs.readdirSync(srcImg).filter((f) => /\.(jpe?g|png|webp|tiff?)$/i.test(f)) : [];
for (const f of images.sort()) await buildImage(path.join(srcImg, f));

// Prefer the upscaled clip (<id>.mp4); fall back to <id>-1080p.mp4 when it is the only one.
const videos = fs.existsSync(srcVid) ? fs.readdirSync(srcVid).filter((f) => f.endsWith('.mp4')) : [];
const clips = new Map();
for (const f of videos) {
  const id = f.replace(/(-1080p)?\.mp4$/, '');
  if (!clips.has(id) || !f.includes('-1080p')) clips.set(id, f);
}
if ([...clips.keys()].some((id) => SEQUENCES[id] && wanted(id))) {
  const ffmpeg = ffmpegPath();
  for (const [id, f] of clips) {
    if (SEQUENCES[id]) await buildSequence(id, path.join(srcVid, f), ffmpeg);
  }
}

const m = await scanMedia();
console.log(`media manifest: ${Object.keys(m.images).length} images, ${Object.keys(m.sequences).length} sequences`);

// Builds src/media-manifest.json from whatever is in public/media:
//   public/media/img/<id>-<width>.<avif|webp>   responsive stills
//   public/media/seq/<name>/meta.json           frame sequences
// The Vite media plugin and the runtime both read this manifest.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const imgDir = path.join(root, 'public/media/img');
const seqDir = path.join(root, 'public/media/seq');
const out = path.join(root, 'src/media-manifest.json');

export async function scanMedia() {
  const images = {};
  if (fs.existsSync(imgDir)) {
    for (const file of fs.readdirSync(imgDir)) {
      const m = file.match(/^(.+)-(\d+)\.(avif|webp)$/);
      if (!m) continue;
      const [, id, w, ext] = m;
      const entry = (images[id] ??= { widths: new Set(), formats: new Set() });
      entry.widths.add(Number(w));
      entry.formats.add(ext);
    }
    for (const [id, entry] of Object.entries(images)) {
      const widths = [...entry.widths].sort((a, b) => a - b);
      const largest = path.join(imgDir, `${id}-${widths.at(-1)}.webp`);
      const { width, height } = await sharp(largest).metadata();
      images[id] = { w: width, h: height, widths, formats: ['avif', 'webp'].filter((f) => entry.formats.has(f)) };
    }
  }

  const sequences = {};
  if (fs.existsSync(seqDir)) {
    for (const name of fs.readdirSync(seqDir)) {
      const meta = path.join(seqDir, name, 'meta.json');
      if (fs.existsSync(meta)) sequences[name] = JSON.parse(fs.readFileSync(meta, 'utf8'));
    }
  }

  const manifest = { images, sequences };
  fs.writeFileSync(out, JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const m = await scanMedia();
  console.log(`media manifest: ${Object.keys(m.images).length} images, ${Object.keys(m.sequences).length} sequences`);
}

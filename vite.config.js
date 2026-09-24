import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';

const manifestPath = path.resolve('src/media-manifest.json');

// Expands <img data-media="id" ...> in index.html into a responsive <picture>
// (AVIF + WebP srcsets) using the widths listed in src/media-manifest.json.
function responsiveMedia() {
  return {
    name: 'shenken-responsive-media',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const { images } = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        return html.replace(/<img\b([^>]*?)\sdata-media="([^"]+)"([^>]*)>/g, (_, pre, id, post) => {
          const img = images[id];
          if (!img) throw new Error(`[media] unknown image id "${id}" — run npm run media`);
          let attrs = `${pre} ${post}`.replace(/\s*\/$/, '').trim();
          const sizes = attrs.match(/\bsizes="([^"]*)"/)?.[1] ?? '100vw';
          attrs = attrs.replace(/\bsizes="[^"]*"/, '').trim();
          const srcset = (ext) => img.widths.map((w) => `media/img/${id}-${w}.${ext} ${w}w`).join(', ');
          const fallback = img.widths[Math.min(2, img.widths.length - 1)];
          const sources = img.formats
            .map((ext) => `<source type="image/${ext}" srcset="${srcset(ext)}" sizes="${sizes}">`)
            .join('');
          return `<picture class="pic">${sources}<img src="media/img/${id}-${fallback}.webp" width="${img.w}" height="${img.h}" ${attrs}></picture>`;
        });
      },
    },
    configureServer(server) {
      server.watcher.add(manifestPath);
      server.watcher.on('change', (file) => {
        if (file === manifestPath) server.ws.send({ type: 'full-reload' });
      });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [responsiveMedia()],
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
  },
});

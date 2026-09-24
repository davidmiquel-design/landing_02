# SHENKEN — Asset brief (Magnific API)

Visual assets for the SHENKEN landing page. SHENKEN is a fictional brutalist architecture
studio. The art direction is **nocturnal**: raw concrete at night, lit by warm amber
artificial light and cold moonlight. The site is dark (near-black charcoal, bone-white text,
amber accent), so every asset must sit naturally on a near-black page.

Every still image **must** go through the Magnific upscaler, and every video through the
Magnific video upscaler. Quality matters more than speed.

---

## 1. API access

- Base URL: `https://api.magnific.com/v1`
- Auth header `x-magnific-api-key` is injected automatically by the environment's agent
  proxy (API credential). **Do not** look for, print, log or store the key. Just call the API.
- If the connection to `api.magnific.com` is rejected (proxy 403 / `connect_rejected`) or the
  API answers 401/403, **stop and report it**. Do not look for workarounds.
- Generated files are downloaded from a CDN URL returned by the API. If a download is blocked
  by the network policy, report the exact host that failed.
- Async pattern: `POST` creates a task (`data.task_id`, `data.status`); poll
  `GET <same endpoint>/<task_id>` every ~5–10 s until `COMPLETED` or `FAILED`; result URLs are
  in `data.generated`. Check this against the real responses and adapt if the shape differs.
- Reference docs: https://docs.magnific.com (index: https://docs.magnific.com/llms.txt). They
  may be blocked by the network policy; use WebSearch if you need parameter details.
- Tasks are async: you can run several in parallel (respect any rate limit the API returns).

## 2. Global art direction

Append this style block to every image prompt (unless the asset says otherwise):

> cinematic night-time architectural photography, raw board-formed béton brut concrete with
> visible formwork texture, monumental brutalist massing, deep charcoal shadows, warm
> sodium-amber and tungsten light glowing from openings, cool moonlight rim light, deep
> blue-black sky, subtle haze, long exposure, medium format camera, 35mm lens, ultra detailed,
> photorealistic, high dynamic range, restrained palette of charcoal, bone white and amber

Avoid (use as negative prompt where supported, and as QC criteria everywhere):

> people, crowds, text, letters, signage, logos, watermark, cars, clutter, distorted geometry,
> warped or melting lines, cartoon, illustration, CGI look, oversaturated colours, daylight,
> lens-flare artifacts

## 3. Pipeline — still images

1. **Generate** with Mystic (`POST /v1/ai/mystic`), `resolution: "2k"`, the aspect ratio in
   the table, a photorealistic model (e.g. `realism` / `super_real`, whatever the API offers).
   Make 2 candidates. If both are flawed, make up to 2 more (max 4 per asset).
2. **QC**: open each candidate with the Read tool (it renders images) and reject any with
   text/letters/watermarks, people, impossible or warped geometry, melted details, daylight or
   a plastic CGI look. Lighting must be nocturnal: amber artificial light plus moonlight.
3. **Upscale** the chosen candidate with the **Magnific Creative Upscaler**
   (`POST /v1/ai/image-upscaler`): `scale_factor: "2x"`,
   `optimized_for: "films_n_photography"`, `creativity: 1`, `hdr: 1`, `resemblance: 4`,
   `engine: "magnific_sharpy"` (or `automatic`), `prompt`: a short version of the generation
   prompt. Open the result: if it invented unwanted details (extra windows, texture noise,
   text), redo it with the **Precision upscaler** (`/v1/ai/image-upscaler-precision-v2`).
4. **Save the master** as sRGB JPEG, quality 92, long edge **max 4096 px** (Lanczos downscale
   if larger), at `assets/source/images/<id>.jpg`. Keep each file under 12 MB.
5. **Record** the prompt, endpoint, parameters, task IDs, attempts and final dimensions in
   `assets/source/manifest.json` (one entry per asset id).

## 4. Pipeline — videos

1. **First frame**: the upscaled master of the linked still (pass it as a URL or base64;
   downscale to 1920×1080 first if the endpoint needs it).
2. **Generate** with **Kling 3** image-to-video (Magnific API → Video → Kling 3; use the
   first-frame / `first_frame` image option), 1080p, **10 s**, highest quality mode available
   (pro/master), with the prompt and negative prompt from the table.
3. **QC**: `pip install imageio-ffmpeg` gives you an ffmpeg binary. Extract ~8 frames spread
   across the clip and look at them. It must have continuous, steady motion: no cuts, no
   morphing or melting of the building, no flicker, no people or text. Regenerate if it
   fails (max 3 attempts per video).
4. **Upscale** with the **Magnific Video Upscaler**, **Standard** mode (not Turbo), to **4K**
   (2K if 4K is not available), `creativity` 0–5 (keep it low: these clips are scrubbed
   frame by frame, so any temporal flicker shows), flavor `natural`, no FPS boost.
5. **Save** the upscaled clip as `assets/source/video/<id>.mp4` and the original 1080p clip
   as `assets/source/video/<id>-1080p.mp4`. If a file is over 90 MB, re-encode it with
   `ffmpeg -c:v libx264 -crf 16 -preset slow -pix_fmt yuv420p -an` at the same resolution.
6. Record everything in the manifest as for the stills.

## 5. Asset list

Priority order: **P1 first** (hero), then P2, then P3. The site overlays large type on
several images, so respect the composition notes.

| id | Pri | Aspect (Mystic) | Used for |
|---|---|---|---|
| `hero-first-frame` | P1 | 16:9 `widescreen_16_9` | Hero poster + first frame of `hero` video |
| `hero` (video) | P1 | 16:9, 10 s | Scroll-scrubbed hero (frame sequence) |
| `p01-casa-umbra` | P2 | 4:5 `social_post_4_5` | Projects index (sticky frame) |
| `p02-nocturne-baths` | P2 | 4:5 `social_post_4_5` | Projects index |
| `p02-nocturne-baths-wide` | P2 | 16:9 `widescreen_16_9` | Featured project, full-bleed expanding image |
| `p03-archive-of-silence` | P2 | 4:5 `social_post_4_5` | Projects index |
| `p04-chapel-of-the-slit` | P2 | 4:5 `social_post_4_5` | Projects index |
| `p05-torre-brava` | P2 | 4:5 `social_post_4_5` | Projects index |
| `p06-museum-of-erosion` | P2 | 4:5 `social_post_4_5` | Projects index |
| `studio-interior` | P2 | 4:5 `social_post_4_5` | Studio intro (image inside a morphing mask) |
| `oculus-moon` | P2 | 1:1 `square_1_1` | Centre of the rotating text rings (zoom-through) |
| `footer-moonrise` | P2 | 16:9 `widescreen_16_9` | Curtain reveal behind CTA + footer |
| `lightstudy-dusk` | P3 | 16:9 `widescreen_16_9` | First frame of `lightstudy` video |
| `lightstudy` (video) | P3 | 16:9, 10 s | Interactive "light study" slider (frame sequence) |
| `story-photo` | P3 | 3:4 `traditional_3_4` | "Flashlight" reveal (photo layer) |
| `story-sketch` | P3 | 3:4 `traditional_3_4` | "Flashlight" reveal (drawing layer) |
| `texture-concrete` | P3 (optional) | 1:1 `square_1_1` | Subtle background texture |

### Prompts

**`hero-first-frame`**
> A monumental brutalist monolith of raw board-formed concrete standing alone on a dark rocky
> plateau at night, perfectly frontal and symmetric, a single enormous circular oculus cut
> through its facade glowing with warm amber light from within, full moon low in the deep
> blue-black sky to the upper right, thin mist drifting across the ground, eye-level camera,
> the building centred and filling the lower-middle of the frame with generous empty night sky
> above

Composition: building centred, oculus near the optical centre, empty sky in the top third
(a giant wordmark goes there). This frame is the start of the push-in video, so the oculus
must be clearly readable.

**`hero` (video, first frame = `hero-first-frame`)**
> Slow, perfectly smooth cinematic dolly push-in straight toward the glowing circular oculus
> of the concrete monolith, constant speed, the camera travels forward until the amber-lit
> oculus fills most of the frame, mist drifts gently along the ground, the moon stays fixed,
> no cuts, no camera shake, no sudden zoom, photorealistic night footage

Negative: `cut, scene change, morphing, warping, flicker, people, text, daylight, camera shake`

**`p01-casa-umbra`** — Casa Umbra, private house, Menorca, 2021
> A private brutalist concrete house cantilevered dramatically over dark sea cliffs at night,
> one long horizontal ribbon window glowing warm amber, moonlight glinting on a calm black sea
> below, rugged dark rocks, a few faint stars

**`p02-nocturne-baths`** — The Nocturne Baths, thermal baths, Asturias, 2023
> Interior of a brutalist concrete thermal bathhouse at night, a long rectangular pool of
> perfectly still water lit turquoise from below, soft steam rising, massive square concrete
> columns, thin ceiling slits letting blades of moonlight fall onto the water, warm amber
> recessed lights along the pool edge, mirror-like reflections

**`p02-nocturne-baths-wide`** — same project, wide shot
> Same prompt as `p02-nocturne-baths`, plus: wide one-point perspective looking along the
> pool, perfectly symmetric composition, vanishing point at the centre

Composition: this image expands from a narrow slab to full screen; keep the focal point
central.

**`p03-archive-of-silence`** — Archive of Silence, public library, Berlin, 2019
> A massive stepped brutalist concrete library building shaped like an inverted ziggurat,
> rows of deep recessed windows glowing warm amber, a wet stone plaza reflecting the lights
> after rain, deep blue night sky, low-angle view

**`p04-chapel-of-the-slit`** — Chapel of the Slit, chapel, Soria, 2016
> Interior of a minimal brutalist concrete chapel at night, one tall vertical slit in the altar
> wall glowing with pale moonlight, rows of simple dark timber benches, board-formed concrete
> walls, low warm amber floor light, profound darkness

**`p05-torre-brava`** — Torre Brava, housing tower, Porto, 2024
> A sculptural brutalist residential concrete tower at night seen from below, deep cantilevered
> balconies in an irregular rhythm, many windows glowing warm amber, fog wrapping the upper
> floors, dramatic upward perspective

**`p06-museum-of-erosion`** — Museum of Erosion, museum, Lanzarote, 2022
> A long, low horizontal brutalist concrete museum half-buried in a black volcanic landscape at
> night, a thin line of amber light beneath its floating roof slab, a still reflecting pool in
> front mirroring the full moon, vast dark sky

**`studio-interior`**
> Interior of a vast brutalist concrete hall at night, a single shaft of cold moonlight falls
> through a circular skylight and draws a bright ellipse on the raw concrete floor, warm amber
> wall-washer light grazing board-formed concrete walls, one monolithic concrete bench, deep
> shadows, absolute silence

**`oculus-moon`**
> View looking straight up from inside a dark concrete rotunda through a perfectly circular
> oculus in a thick board-formed concrete ceiling, the full moon exactly centred in the
> opening, deep night sky, the rim of the oculus softly lit by warm amber light from below,
> perfect radial symmetry, centred composition

Composition: the oculus must be exactly centred and circular. The site zooms into it until
it fills the screen.

**`footer-moonrise`**
> A full moon rising behind the dark silhouette of a monumental brutalist concrete building on
> a hilltop, a still lake in the foreground reflecting the moon as a long shimmering path of
> light, deep blue-black night, a few faint amber windows, calm and silent

Composition: moon and building in the upper half. The lower 40 % is covered by the footer
panel at the end of the scroll.

**`lightstudy-dusk`** (use the global style block, but the lighting is **dusk**, not night)
> Perfectly frontal elevation of a long brutalist concrete apartment block with a rigorous grid
> of deep square window openings, at dusk with the last violet light in the sky, all windows
> dark, static tripod camera, flat symmetric composition

**`lightstudy` (video, first frame = `lightstudy-dusk`)**
> Static locked-off tripod camera, timelapse from dusk to deep night: the sky darkens from
> violet to blue-black, warm amber lights switch on one by one in the windows until most of
> them glow, clouds drift slowly, the building and the camera stay completely still

Negative: `camera movement, zoom, pan, morphing, warping, people, text`

**`story-photo`**
> A brutalist concrete house with a single large circular window and a monumental cantilevered
> roof, seen at night from a slight angle, warm amber light inside, moonlit concrete, a dark
> garden of tall grasses in front

**`story-sketch`**: Mystic with `structure_reference` = the upscaled `story-photo` and a
high structure strength (~85), so it follows the same composition:
> Precise architectural drawing in white chalk and fine white ink lines on matte black paper,
> clean perspective lines, light hatching in the shadows, no colour, no text

If Mystic has no structure-reference option, skip this asset and say so in the report (the
main session will derive the drawing from the photo instead). Upscale it like the others.

**`texture-concrete`** (optional, only if everything else is done)
> Seamless close-up of a dark board-formed concrete wall with imprinted timber grain and tie
> holes, soft grazing light, high detail, even exposure, no vignette

## 6. Delivery

- Branch: `claude/vibrant-ritchie-qhbaqv`. Another session is building the site on the same
  branch at the same time, so:
  - commit **only** files under `assets/source/` (masters, videos, `manifest.json`);
  - run `git pull --rebase origin claude/vibrant-ritchie-qhbaqv` before every push;
  - push after each finished asset, or small batch, so the site can integrate them as they
    arrive. Commit message: `assets: add <ids>`.
- Do not edit any other file, do not open pull requests.
- Final report: a table with id, file, dimensions, model, upscaler + settings, and number of
  attempts; anything that failed or was skipped; and the Magnific credits used, if the API
  exposes them.

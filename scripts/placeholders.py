"""Temporary placeholder media so the site can be developed before the
Magnific assets arrive. Writes to public/media with the final file layout.
Not meant to be committed."""
import json, math, os, random
from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = os.path.join(os.path.dirname(__file__), '..', 'public', 'media')
IMG = os.path.join(ROOT, 'img')
SEQ = os.path.join(ROOT, 'seq')
os.makedirs(IMG, exist_ok=True)

def sky(w, h, top=(6, 8, 14), bottom=(24, 22, 26)):
    im = Image.new('RGB', (w, h))
    d = ImageDraw.Draw(im)
    for y in range(h):
        t = y / h
        d.line([(0, y), (w, y)], fill=tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3)))
    return im

def glow(im, cx, cy, r, color, strength=1.0):
    layer = Image.new('RGB', im.size, (0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=tuple(int(c * strength) for c in color))
    layer = layer.filter(ImageFilter.GaussianBlur(r * 0.9))
    return ImageChops.add(im, layer)

def moon(im, cx, cy, r):
    d = ImageDraw.Draw(im)
    im2 = glow(im, cx, cy, r * 2.2, (60, 58, 52))
    d = ImageDraw.Draw(im2)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(232, 226, 210))
    return im2

def monolith_scene(w, h, zoom=1.0):
    im = sky(w, h)
    im = moon(im, int(w * 0.76), int(h * 0.2), int(h * 0.045))
    d = ImageDraw.Draw(im)
    # ground
    d.rectangle([0, int(h * 0.78), w, h], fill=(14, 13, 13))
    # monolith around oculus centre, scaled by zoom
    ox, oy = w * 0.5, h * 0.5
    bw, bh = w * 0.22 * zoom, h * 0.62 * zoom
    left, top = ox - bw / 2, oy - bh * 0.42
    im2 = glow(im, int(ox), int(oy), int(h * 0.12 * zoom), (255, 140, 50), 0.9)
    d = ImageDraw.Draw(im2)
    d.rectangle([left, top, left + bw, top + bh], fill=(58, 56, 53))
    r = h * 0.09 * zoom
    d.ellipse([ox - r, oy - r, ox + r, oy + r], fill=(255, 158, 74))
    d.ellipse([ox - r * 0.7, oy - r * 0.7, ox + r * 0.7, oy + r * 0.7], fill=(255, 196, 120))
    return im2

def save_variants(im, name, widths):
    for w in widths:
        h = round(im.height * w / im.width)
        r = im.resize((w, h), Image.LANCZOS)
        r.save(os.path.join(IMG, f'{name}-{w}.webp'), quality=80)
        r.save(os.path.join(IMG, f'{name}-{w}.avif'), quality=55)

def label(im, text):
    d = ImageDraw.Draw(im)
    d.text((24, im.height - 40), f'PLACEHOLDER — {text}', fill=(120, 116, 108))
    return im

# ---- sequences
def sequence(name, count, render, sizes):
    base = os.path.join(SEQ, name)
    meta = {'count': count, 'sizes': {}}
    for key, (w, h) in sizes.items():
        os.makedirs(os.path.join(base, key), exist_ok=True)
        meta['sizes'][key] = [w, h]
    for i in range(count):
        frame = render(i / (count - 1))
        for key, (w, h) in sizes.items():
            frame.resize((w, h), Image.LANCZOS).save(os.path.join(base, key, f'{i + 1:04d}.webp'), quality=72)
    with open(os.path.join(base, 'meta.json'), 'w') as f:
        json.dump(meta, f)

W, H = 1920, 1080
sequence('hero', 48, lambda p: monolith_scene(W, H, 1 + p * p * 3.2),
         {'lg': (1920, 1080), 'sm': (960, 540)})

def lightstudy(p):
    im = sky(W, H, top=(int(60 - 54 * p), int(46 - 40 * p), int(90 - 76 * p)), bottom=(int(40 - 26 * p), int(34 - 22 * p), int(52 - 30 * p)))
    d = ImageDraw.Draw(im)
    d.rectangle([160, 260, W - 160, H], fill=(52, 50, 47))
    rnd = random.Random(4)
    for row in range(6):
        for col in range(14):
            x, y = 220 + col * 110, 310 + row * 120
            lit = rnd.random() < p * 0.95
            d.rectangle([x, y, x + 64, y + 72], fill=(255, 170, 84) if lit else (22, 21, 20))
    return im

sequence('light', 36, lightstudy, {'lg': (1920, 1080), 'sm': (960, 540)})

# ---- stills
hero0 = monolith_scene(3200, 1800, 1.0)
save_variants(label(hero0, 'hero-first-frame'), 'hero-first-frame', [960, 1600, 2400, 3200])

def portrait(name, seed, kind):
    w, h = 1600, 2000
    im = sky(w, h)
    rnd = random.Random(seed)
    im = moon(im, int(w * rnd.uniform(0.2, 0.8)), int(h * 0.16), 46)
    d = ImageDraw.Draw(im)
    d.rectangle([0, int(h * 0.74), w, h], fill=(12, 12, 12))
    if kind == 'house':
        d.rectangle([200, 900, 1500, 1180], fill=(62, 60, 56)); d.rectangle([260, 1010, 1440, 1060], fill=(255, 160, 70))
    elif kind == 'baths':
        d.rectangle([0, 0, w, h], fill=(20, 20, 21)); d.rectangle([300, 1200, 1300, 1700], fill=(40, 140, 150))
        for x in (220, 620, 980, 1380): d.rectangle([x - 60, 200, x, 1500], fill=(58, 56, 53))
    elif kind == 'archive':
        for i in range(5): d.rectangle([700 - i * 120, 500 + i * 180, 900 + i * 120, 680 + i * 180], fill=(64 - i * 4, 62 - i * 4, 58 - i * 4))
    elif kind == 'chapel':
        d.rectangle([0, 0, w, h], fill=(14, 14, 15)); d.rectangle([760, 300, 840, 1300], fill=(220, 220, 214))
    elif kind == 'tower':
        d.rectangle([520, 200, 1080, 1500], fill=(60, 58, 55))
        for y in range(260, 1480, 90): d.rectangle([500 + rnd.randint(-40, 40), y, 1100 + rnd.randint(-40, 40), y + 26], fill=(80, 78, 73))
    elif kind == 'museum':
        d.rectangle([100, 1180, 1500, 1260], fill=(66, 64, 60)); d.rectangle([140, 1260, 1460, 1274], fill=(255, 160, 70))
    elif kind == 'interior':
        d.rectangle([0, 0, w, h], fill=(22, 22, 23)); d.ellipse([500, 1350, 1100, 1600], fill=(170, 176, 186))
    elif kind == 'story':
        d.rectangle([260, 700, 1340, 1300], fill=(58, 56, 53)); d.ellipse([640, 820, 960, 1140], fill=(255, 160, 70))
    return label(im, name)

for name, seed, kind in [('p01-casa-umbra', 1, 'house'), ('p02-nocturne-baths', 2, 'baths'),
                         ('p03-archive-of-silence', 3, 'archive'), ('p04-chapel-of-the-slit', 4, 'chapel'),
                         ('p05-torre-brava', 5, 'tower'), ('p06-museum-of-erosion', 6, 'museum'),
                         ('studio-interior', 7, 'interior')]:
    save_variants(portrait(name, seed, kind), name, [480, 800, 1200, 1600])

story = portrait('story-photo', 8, 'story').resize((1500, 2000))
save_variants(story, 'story-photo', [600, 1000, 1500])
sk = Image.new('RGB', story.size, (10, 10, 10)); d = ImageDraw.Draw(sk)
d.rectangle([260, 700, 1340, 1300], outline=(220, 214, 200), width=4); d.ellipse([640, 820, 960, 1140], outline=(220, 214, 200), width=4)
for x in range(260, 1340, 40): d.line([(x, 1300), (x + 60, 1360)], fill=(120, 116, 108), width=2)
save_variants(label(sk, 'story-sketch'), 'story-sketch', [600, 1000, 1500])

wide = sky(3200, 1800, top=(14, 16, 18), bottom=(20, 22, 22)); d = ImageDraw.Draw(wide)
d.rectangle([0, 1100, 3200, 1800], fill=(30, 110, 120))
for x in range(200, 3200, 560): d.rectangle([x, 200, x + 160, 1500], fill=(58, 56, 53))
save_variants(label(wide, 'p02-nocturne-baths-wide'), 'p02-nocturne-baths-wide', [960, 1600, 2400, 3200])

oc = Image.new('RGB', (2000, 2000), (18, 18, 19))
oc = glow(oc, 1000, 1000, 700, (60, 40, 20)); d = ImageDraw.Draw(oc)
d.ellipse([300, 300, 1700, 1700], fill=(8, 10, 18))
oc = moon(oc, 1000, 1000, 170)
save_variants(label(oc, 'oculus-moon'), 'oculus-moon', [800, 1400, 2000])

mr = sky(3200, 1800); mr = moon(mr, 1600, 520, 150); d = ImageDraw.Draw(mr)
d.rectangle([1100, 560, 2100, 1000], fill=(10, 10, 10)); d.rectangle([0, 1000, 3200, 1800], fill=(12, 14, 20))
d.rectangle([1560, 1000, 1640, 1800], fill=(120, 116, 100))
save_variants(label(mr, 'footer-moonrise'), 'footer-moonrise', [960, 1600, 2400, 3200])
print('placeholders written to', os.path.abspath(ROOT))

# Crop the transparent turntable PNGs from spin_capture_fusion.py into same-size WebP frames.
#   python tools/spin_postprocess.py C:/temp/spin a/spin kart
# - one crop box for all frames (union of every frame's object box + 6% margin, 3:2), so the object never jumps
# - background (215,216,220) = sampled from the site's kart render (a/kart_iso.jpg), so it matches the page
# - 1200x800 WebP, quality 80
# Viewer: spin.js, e.g. <div class="shot spin" data-src="a/spin/kart_{i}.webp" data-n="24" data-start="6">
import sys, glob, os
from PIL import Image

src, out, name = sys.argv[1], sys.argv[2], sys.argv[3]
BG, PAD, SIZE = (215, 216, 220), 0.06, (1200, 800)

files = sorted(glob.glob(f'{src}/{name}_*.png'))
ims = [Image.open(f).convert('RGBA') for f in files]
boxes = [im.split()[-1].point(lambda v: 255 if v > 8 else 0).getbbox() for im in ims]
x0, y0 = min(b[0] for b in boxes), min(b[1] for b in boxes)
x1, y1 = max(b[2] for b in boxes), max(b[3] for b in boxes)
w, h = (x1 - x0) * (1 + 2 * PAD), (y1 - y0) * (1 + 2 * PAD)
ratio = SIZE[0] / SIZE[1]
w, h = (h * ratio, h) if w / h < ratio else (w, w / ratio)
cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
box = tuple(round(v) for v in (cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2))

os.makedirs(out, exist_ok=True)
for i, im in enumerate(ims):
    bg = Image.new('RGBA', im.size, BG + (255,))
    bg.alpha_composite(im)
    bg.convert('RGB').crop(box).resize(SIZE, Image.LANCZOS).save(f'{out}/{name}_{i:02d}.webp', 'WEBP', quality=80, method=6)
print(len(ims), 'frames, crop box', box)

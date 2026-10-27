from PIL import Image
import sys, os
sheet = sys.argv[1]
outdir = sys.argv[2]
os.makedirs(outdir, exist_ok=True)
img = Image.open(sheet).convert('RGBA')
# row 0 y1-161, row 1 y162-274, row 2 y275-419 放大 3 倍，分两段
parts = [(0, 1, 161, 0, 960), (0, 1, 161, 960, 1919),
         (1, 162, 274, 0, 960), (1, 162, 274, 960, 1919),
         (2, 275, 419, 0, 960), (2, 275, 419, 960, 1919)]
for pi, (row, y0, y1, x0, x1) in enumerate(parts):
    crop = img.crop((x0, y0, x1, y1 + 1))
    crop = crop.resize((crop.size[0] * 3, crop.size[1] * 3), Image.NEAREST)
    crop.convert('RGB').save(outdir + '/big_r%d_%d.jpg' % (row, pi), quality=90)
    print('saved', row, pi, crop.size)

from PIL import Image
import sys, os
sheet = sys.argv[1]
outdir = sys.argv[2]
os.makedirs(outdir, exist_ok=True)
img = Image.open(sheet).convert('RGBA')
rows = [(15, 2016, 2160), (30, 3823, 3967), (37, 5014, 5174)]
for row, y0, y1 in rows:
    for seg, x0, x1 in [(0, 0, 1000), (1, 1000, 1919)]:
        crop = img.crop((x0, y0, x1, y1 + 1))
        crop = crop.resize((crop.size[0] * 3, crop.size[1] * 3), Image.NEAREST)
        crop.convert('RGB').save(outdir + '/v2_r%d_%d.jpg' % (row, seg), quality=90)
        print('saved', row, seg)

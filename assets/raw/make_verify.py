from PIL import Image
import sys, os
sheet = sys.argv[1]
outdir = sys.argv[2]
os.makedirs(outdir, exist_ok=True)
img = Image.open(sheet).convert('RGBA')
rows = [(14, 1887, 2015), (27, 3436, 3548), (33, 4242, 4498)]
for row, y0, y1 in rows:
    for seg, x0, x1 in [(0, 0, 1000), (1, 1000, 1919)]:
        crop = img.crop((x0, y0, x1, y1 + 1))
        crop = crop.resize((crop.size[0] * 3, crop.size[1] * 3), Image.NEAREST)
        crop.convert('RGB').save(outdir + '/v_r%d_%d.jpg' % (row, seg), quality=90)
        print('saved', row, seg, crop.size)

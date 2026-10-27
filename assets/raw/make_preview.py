from PIL import Image
import sys, os, json

frames_dir = sys.argv[1]   # assets/raw/frames_k
outdir = sys.argv[2]
rows_want = [int(x) for x in sys.argv[3].split(',')]
os.makedirs(outdir, exist_ok=True)
with open(frames_dir + '/meta.json', encoding='utf-8') as f:
    meta = json.load(f)

for row in rows_want:
    m = next(x for x in meta if x['row'] == row)
    y0, y1 = m['y0'], m['y1']
    fs = sorted([x for x in os.listdir(frames_dir) if x.startswith('row%02d_' % row)])
    frames = []
    maxh = 0
    for fn in fs[:16]:
        im = Image.open(frames_dir + '/' + fn)
        frames.append(im)
        maxh = max(maxh, im.size[1])
    cell_w = 150
    pad = 4
    canvas = Image.new('RGBA', (cell_w * len(frames), maxh + pad), (255, 255, 255, 255))
    for i, im in enumerate(frames):
        canvas.paste(im, (i * cell_w + (cell_w - im.size[0]) // 2, (maxh - im.size[1]) // 2), im)
    canvas.convert('RGB').save(outdir + '/k_row%02d.jpg' % row, quality=92)
    print('saved', row, canvas.size)

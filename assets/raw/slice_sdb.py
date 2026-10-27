from PIL import Image
import sys, os, json

sheet = sys.argv[1]
outdir = sys.argv[2]  # assets/raw/frames_k
os.makedirs(outdir, exist_ok=True)
img = Image.open(sheet).convert('RGBA')
w, h = img.size
px = img.load()

# 自动检测背景色（角点主色）
from collections import Counter
corner = Counter()
for cx, cy in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
    corner[px[cx, cy][:3]] += 1
bg = corner.most_common(1)[0][0]
BG = (bg[0], bg[1], bg[2], 255)

def is_bg(r, g, b, a):
    return a > 200 and abs(r - BG[0]) < 30 and abs(g - BG[1]) < 30 and abs(b - BG[2]) < 30

# 行簇
row_has = []
for y in range(h):
    cnt = 0
    for x in range(0, w, 2):
        r, g, b, a = px[x, y]
        if a < 200 or not is_bg(r, g, b, a):
            cnt += 1
    row_has.append(cnt > 0)
rcl = []
inrun = False
start = 0
for y in range(h):
    if row_has[y] and not inrun:
        inrun = True; start = y
    elif not row_has[y] and inrun:
        inrun = False; rcl.append((start, y))
if inrun:
    rcl.append((start, h - 1))

def save_frame(x0, x1, y0, y1, name):
    crop = img.crop((x0, y0, x1 + 1, y1 + 1))
    cpx = crop.load()
    cw, ch = crop.size
    minx, miny, maxx, maxy = cw, ch, -1, -1
    for yy in range(ch):
        for xx in range(cw):
            r, g, b, a = cpx[xx, yy]
            if a > 60 and not is_bg(r, g, b, a):
                if xx < minx: minx = xx
                if yy < miny: miny = yy
                if xx > maxx: maxx = xx
                if yy > maxy: maxy = yy
    if maxx < 0:
        return None
    content = crop.crop((minx, miny, maxx + 1, maxy + 1))
    content.save(outdir + '/' + name + '.png')
    return (content.size)

meta = []
for idx, (y0, y1) in enumerate(rcl):
    col_cnt = []
    for x in range(w):
        cnt = 0
        for y in range(y0, y1 + 1, 2):
            r, g, b, a = px[x, y]
            if a < 200 or not is_bg(r, g, b, a):
                cnt += 1
        col_cnt.append(cnt)
    xcl = []
    inrun = False
    sx = 0
    for x in range(w):
        if col_cnt[x] > 0 and not inrun:
            inrun = True; sx = x
        elif col_cnt[x] == 0 and inrun:
            inrun = False; xcl.append((sx, x))
    if inrun:
        xcl.append((sx, w - 1))
    sizes = []
    for fi, (x0, x1) in enumerate(xcl):
        s = save_frame(x0, x1, y0, y1, 'row%02d_f%02d' % (idx, fi))
        if s:
            sizes.append(s)
    meta.append({'row': idx, 'y0': y0, 'y1': y1, 'h': y1 - y0 + 1,
                 'frames': len(xcl), 'sizes': sizes[:20]})

with open(outdir + '/meta.json', 'w', encoding='utf-8') as f:
    json.dump(meta, f, ensure_ascii=False)
print('rows:', len(rcl))
for m in meta:
    print('row %02d h=%4d frames=%2d sizes=%s' % (
        m['row'], m['h'], m['frames'], ','.join('%dx%d' % s for s in m['sizes'][:12])))

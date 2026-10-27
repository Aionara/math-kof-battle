from PIL import Image
from collections import Counter
import sys, os

def row_clusters(path):
    img = Image.open(path).convert('RGBA')
    w, h = img.size
    px = img.load()
    corner = Counter()
    for cx, cy in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        corner[px[cx, cy][:3]] += 1
    bg = corner.most_common(1)[0][0]
    def is_bg(r, g, b, a):
        return a > 200 and abs(r - bg[0]) < 40 and abs(g - bg[1]) < 40 and abs(b - bg[2]) < 40
    row_has = []
    for y in range(h):
        cnt = 0
        for x in range(0, w, 2):
            r, g, b, a = px[x, y]
            if a < 200 or not is_bg(r, g, b, a):
                cnt += 1
        row_has.append(cnt > 1)
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
    return img, px, w, h, bg, is_bg, rcl

def col_clusters_in_row(img, px, w, y0, y1, is_bg):
    col_has = []
    for x in range(w):
        cnt = 0
        for y in range(y0, y1 + 1, 2):
            r, g, b, a = px[x, y]
            if a < 200 or not is_bg(r, g, b, a):
                cnt += 1
        col_has.append(cnt > 0)
    cl = []
    inrun = False
    start = 0
    for x in range(w):
        if col_has[x] and not inrun:
            inrun = True; start = x
        elif not col_has[x] and inrun:
            inrun = False; cl.append((start, x))
    if inrun:
        cl.append((start, w - 1))
    return cl

if __name__ == '__main__':
    src = sys.argv[1]
    outdir = sys.argv[2]
    os.makedirs(outdir, exist_ok=True)
    img, px, w, h, bg, is_bg, rcl = row_clusters(src)
    print(src, 'size', w, h, 'bg', bg, 'rows', len(rcl))
    name = os.path.splitext(os.path.basename(src))[0]
    info = []
    for ri, (y0, y1) in enumerate(rcl):
        cl = col_clusters_in_row(img, px, w, y0, y1, is_bg)
        # 按帧间距合并过近的列簇
        frames = []
        for c in cl:
            if frames and c[0] - frames[-1][1] <= 6:
                frames[-1] = (frames[-1][0], c[1])
            else:
                frames.append(c)
        info.append((ri, y0, y1, len(frames), frames))
        # 行缩略图：横向拼前 6 帧
        cell = 120
        n = min(6, len(frames))
        rowimg = Image.new('RGBA', (cell * n, cell), (50, 50, 60, 255))
        for i in range(n):
            x0, x1 = frames[i]
            crop = img.crop((x0, y0, x1 + 1, y1 + 1))
            cc = crop.copy()
            cc.thumbnail((cell - 6, cell - 6))
            rowimg.paste(cc, (i * cell + 3, (cell - cc.height) // 2), cc)
        rowimg.convert('RGB').save(os.path.join(outdir, 'row%02d.jpg' % ri), quality=90)
    with open(os.path.join(outdir, 'rows.txt'), 'w') as f:
        for ri, y0, y1, n, frames in info:
            f.write('row%d y%d-%d frames=%d cols=%s\n' % (ri, y0, y1, n, ','.join(str(c[0]) for c in frames)))

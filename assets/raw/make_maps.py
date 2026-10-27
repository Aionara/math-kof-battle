from PIL import Image
from PIL import ImageDraw
import sys, os

def col_cl(px, w, y0, y1, is_bg):
    col_has = []
    for x in range(w):
        cnt = 0
        for y in range(y0, y1 + 1, 2):
            r, g, b, a = px[x, y]
            if a < 200 or not is_bg(r, g, b, a):
                cnt += 1
        col_has.append(cnt > 0)
    cl = []
    inrun = False; start = 0
    for x in range(w):
        if col_has[x] and not inrun:
            inrun = True; start = x
        elif not col_has[x] and inrun:
            inrun = False; cl.append((start, x))
    if inrun: cl.append((start, w - 1))
    frames = []
    for c in cl:
        if frames and c[0] - frames[-1][1] <= 6:
            frames[-1] = (frames[-1][0], c[1])
        else:
            frames.append(c)
    return frames

if __name__ == '__main__':
    src = sys.argv[1]
    out = sys.argv[2]
    img = Image.open(src).convert('RGBA')
    w, h = img.size
    px = img.load()
    from collections import Counter
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
    inrun = False; start = 0
    for y in range(h):
        if row_has[y] and not inrun:
            inrun = True; start = y
        elif not row_has[y] and inrun:
            inrun = False; rcl.append((start, y))
    if inrun: rcl.append((start, h - 1))
    cell = 160; cols = 6
    rows = (len(rcl) + cols - 1) // cols
    big = Image.new('RGBA', (cell * cols, cell * rows), (30, 30, 38, 255))
    for ri, (y0, y1) in enumerate(rcl):
        frames = col_cl(px, w, y0, y1, is_bg)
        n = len(frames)
        rw = Image.new('RGBA', (cell, cell), (48, 48, 60, 255))
        if frames:
            x0, x1 = frames[0]
            crop = img.crop((x0, y0, x1 + 1, y1 + 1))
            cc = crop.copy()
            cc.thumbnail((cell - 16, cell - 16))
            rw.paste(cc, ((cell - cc.width) // 2, (cell - cc.height) // 2), cc)
        d = ImageDraw.Draw(rw)
        d.text((4, 2), 'r%d n%d' % (ri, n), fill=(255, 220, 100))
        gx = (ri % cols) * cell; gy = (ri // cols) * cell
        big.paste(rw, (gx, gy))
    big.convert('RGB').save(out, quality=92)
    print(os.path.basename(src), 'rows', len(rcl), '->', out)

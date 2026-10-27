from PIL import Image
import sys, os, glob

sheet = sys.argv[1]
img = Image.open(sheet).convert('RGBA')
w, h = img.size
px = img.load()

def is_magenta(r, g, b, a):
    return a > 200 and abs(r - 240) < 40 and g < 60 and abs(b - 240) < 40

row_has = []
for y in range(h):
    cnt = 0
    for x in range(0, w, 2):
        r, g, b, a = px[x, y]
        if is_magenta(r, g, b, a):
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

print('total rows:', len(rcl))
for idx, (y0, y1) in enumerate(rcl):
    col_cnt = []
    for x in range(w):
        cnt = 0
        for y in range(y0, y1 + 1, 2):
            r, g, b, a = px[x, y]
            if is_magenta(r, g, b, a):
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
    # 帧特征
    widths = [x1 - x0 + 1 for x0, x1 in xcl]
    hgt = y1 - y0 + 1
    # 每帧的内容包围盒宽度（抠品红后）
    cw = []
    for x0, x1 in xcl:
        minx, maxx = 10**9, -1
        for yy in range(y0, y1 + 1, 2):
            for xx in range(x0, x1 + 1, 3):
                r, g, b, a = px[xx, yy]
                if a > 60 and not is_magenta(r, g, b, a):
                    if xx < minx: minx = xx
                    if xx > maxx: maxx = xx
        cw.append(maxx - minx + 1 if maxx >= 0 else 0)
    avg_cw = sum(cw) / len(cw) if cw else 0
    print('row %02d y=%4d h=%3d frames=%2d cw=%s avgCw=%4.0f' % (
        idx, y0, hgt, len(xcl), ','.join(str(x) for x in cw[:14]), avg_cw))

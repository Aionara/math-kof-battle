from PIL import Image
import sys

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

# 对每行前 8 帧：抠内容后转灰度，比较相邻帧差异（需大小对齐：缩放到 48x64）
def frame_array(x0, x1, y0, y1):
    crop = img.crop((x0, y0, x1 + 1, y1 + 1))
    cpx = crop.load()
    cw, ch = crop.size
    minx, miny, maxx, maxy = cw, ch, -1, -1
    for yy in range(ch):
        for xx in range(cw):
            r, g, b, a = cpx[xx, yy]
            if a > 60 and not is_magenta(r, g, b, a):
                if xx < minx: minx = xx
                if yy < miny: miny = yy
                if xx > maxx: maxx = xx
                if yy > maxy: maxy = yy
    if maxx < 0:
        return None
    content = crop.crop((minx, miny, maxx + 1, maxy + 1)).convert('L').resize((48, 64))
    return list(content.getdata())

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
    arrs = []
    for x0, x1 in xcl[:8]:
        a = frame_array(x0, x1, y0, y1)
        if a:
            arrs.append(a)
    if len(arrs) < 3:
        continue
    # 相邻帧差异均值（0~255）
    diffs = []
    for i in range(min(6, len(arrs) - 1)):
        d = sum(abs(arrs[i][k] - arrs[i + 1][k]) for k in range(len(arrs[i]))) / (48 * 64)
        diffs.append(d)
    avg = sum(diffs) / len(diffs)
    print('row %02d h=%3d n=%2d avgDiff=%5.1f diffs=%s' % (idx, y1 - y0 + 1, len(arrs), avg, ','.join('%.0f' % d for d in diffs)))

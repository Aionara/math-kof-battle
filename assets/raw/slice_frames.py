from PIL import Image
import sys, os
path = sys.argv[1]
outdir = sys.argv[2]
os.makedirs(outdir, exist_ok=True)
img = Image.open(path).convert('RGBA')
w, h = img.size
px = img.load()

def is_magenta(r, g, b, a):
    return a > 200 and abs(r - 240) < 40 and g < 60 and abs(b - 240) < 40

# 行簇
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

def save_frame(img, x0, x1, y0, y1, name):
    # 精细裁剪：去掉品红边缘（取内容最小包围盒）
    crop = img.crop((x0, y0, x1 + 1, y1 + 1))
    cpx = crop.load()
    cw, ch = crop.size
    # 找非品红内容包围盒
    minx, miny, maxx, maxy = cw, ch, -1, -1
    for yy in range(ch):
        for xx in range(cw):
            r, g, b, a = cpx[xx, yy]
            if a < 60:
                continue
            if is_magenta(r, g, b, a):
                continue
            if xx < minx: minx = xx
            if yy < miny: miny = yy
            if xx > maxx: maxx = xx
            if yy > maxy: maxy = yy
    if maxx < 0:
        return None
    content = crop.crop((minx, miny, maxx + 1, maxy + 1))
    content.save(outdir + '/' + name + '.png')
    return (minx, miny, maxx, maxy)

# 行簇 0~7：帧聚类 + 保存
for idx, (y0, y1) in enumerate(rcl[:10]):
    col_cnt = []
    for x in range(w):
        cnt = 0
        for y in range(y0, y1 + 1, 2):
            r, g, b, a = px[x, y]
            if is_magenta(r, g, b, a):
                cnt += 1
        col_cnt.append(cnt)
    # 品红列簇
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
    print('row', idx, 'y', (y0, y1), 'frames', len(xcl))
    boxes = []
    for fi, (x0, x1) in enumerate(xcl):
        b = save_frame(img, x0, x1, y0, y1, 'f_%02d_%02d' % (idx, fi))
        boxes.append((x0, x1, b))
    # 打印前 20 帧框
    for x0, x1, b in boxes[:20]:
        print('  f', x0, x1, 'w', x1 - x0 + 1, 'content', b)

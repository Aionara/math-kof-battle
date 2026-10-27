from PIL import Image
import sys, os
sheet = sys.argv[1]
outdir = sys.argv[2]
os.makedirs(outdir, exist_ok=True)
img = Image.open(sheet).convert('RGBA')
w, h = img.size
px = img.load()

def is_magenta(r, g, b, a):
    return a > 200 and abs(r - 240) < 40 and g < 60 and abs(b - 240) < 40

def row_frames(y0, y1):
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
    return xcl

rows = [(28, 3549, 3677), (29, 3678, 3822), (30, 3823, 3967)]
for row, y0, y1 in rows:
    xcl = row_frames(y0, y1)
    # 前 4 帧拼成一排（各放大 3 倍）
    frames = []
    for x0, x1 in xcl[:4]:
        crop = img.crop((x0, y0, x1 + 1, y1 + 1))
        # 抠内容
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
            continue
        c = crop.crop((minx, miny, maxx + 1, maxy + 1))
        c = c.resize((c.size[0] * 4, c.size[1] * 4), Image.NEAREST)
        frames.append(c)
    if frames:
        mw = max(f.size[0] for f in frames)
        mh = max(f.size[1] for f in frames)
        canvas = Image.new('RGBA', (mw * len(frames), mh), (255, 255, 255, 255))
        for i, f in enumerate(frames):
            canvas.paste(f, (i * mw + (mw - f.size[0]) // 2, (mh - f.size[1]) // 2), f)
        canvas.convert('RGB').save(outdir + '/idle_r%d.jpg' % row, quality=92)
        print('saved', row, canvas.size)

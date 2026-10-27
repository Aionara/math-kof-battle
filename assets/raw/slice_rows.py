from PIL import Image
import sys, os

def analyze(src):
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
    def col_cl(y0, y1):
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
    return img, px, is_bg, rcl, col_cl, bg

def clean_frame(crop, is_bg):
    crop = crop.copy()
    px2 = crop.load()
    w2, h2 = crop.size
    for y in range(h2):
        for x in range(w2):
            r, g, b, a = px2[x, y]
            if is_bg(r, g, b, a):
                px2[x, y] = (0, 0, 0, 0)
    return crop

def pick_frames(frames, n):
    if n <= 0:
        return []
    if len(frames) <= n:
        return frames
    idx = [int(round(i * (len(frames) - 1) / (n - 1))) for i in range(n)]
    return [frames[i] for i in idx]

if __name__ == '__main__':
    src = sys.argv[1]
    outdir = sys.argv[2]
    mapping = {}
    for spec in sys.argv[3:]:
        prefix, row, n = spec.split(':')
        mapping[prefix] = (int(row), int(n))
    os.makedirs(outdir, exist_ok=True)
    img, px, is_bg, rcl, col_cl, bg = analyze(src)
    print('bg', bg, 'rows', len(rcl))
    for prefix, (row, n) in mapping.items():
        if row >= len(rcl):
            print('SKIP', prefix, 'row', row, 'out of range')
            continue
        y0, y1 = rcl[row]
        frames = col_cl(y0, y1)
        picks = pick_frames(frames, n)
        for i, (x0, x1) in enumerate(picks):
            crop = img.crop((x0, y0, x1 + 1, y1 + 1))
            crop = clean_frame(crop, is_bg)
            crop.save(os.path.join(outdir, '%s_%d.png' % (prefix, i)))
        print(prefix, 'row', row, 'frames', len(frames), '-> saved', len(picks))
    print('DONE', os.path.basename(src))

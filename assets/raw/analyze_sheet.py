from PIL import Image
import sys

path = sys.argv[1]
img = Image.open(path).convert('RGBA')
w, h = img.size
px = img.load()
print('size:', w, h)

def is_magenta(r, g, b, a):
    return a > 200 and abs(r - 240) < 40 and g < 60 and abs(b - 240) < 40

# 列含品红检测
col_has = []
for x in range(w):
    cnt = 0
    for y in range(0, h, 2):
        r, g, b, a = px[x, y]
        if is_magenta(r, g, b, a):
            cnt += 1
    col_has.append(cnt > 0)

clusters = []
inrun = False
start = 0
for x in range(w):
    if col_has[x] and not inrun:
        inrun = True; start = x
    elif not col_has[x] and inrun:
        inrun = False; clusters.append((start, x))
if inrun:
    clusters.append((start, w - 1))
print('col clusters:', len(clusters))
widths = [c[1] - c[0] + 1 for c in clusters]
print('col widths:', widths[:80])

# 行含品红检测
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
print('row clusters:', len(rcl))
heights = [c[1] - c[0] + 1 for c in rcl]
print('row heights:', heights[:100])

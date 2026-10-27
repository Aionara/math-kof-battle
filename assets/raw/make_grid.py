from PIL import Image
import sys, os, glob
outdir = sys.argv[1]
# 读取前 10 行的帧文件
rows = []
for r in range(10):
    files = sorted(glob.glob(outdir + '/f_%02d_*.png' % r))
    rows.append(files)
# 统一帧高（取各行最大高度），白底贴图
maxh = 0
for fs in rows:
    for f in fs:
        im = Image.open(f)
        maxh = max(maxh, im.size[1])
cell_w = 150
pad = 4
W = cell_w * max(len(fs) for fs in rows)
H = (maxh + pad) * len(rows)
canvas = Image.new('RGBA', (W, H), (255, 255, 255, 255))
for ri, fs in enumerate(rows):
    y0 = ri * (maxh + pad)
    for ci, f in enumerate(fs):
        im = Image.open(f)
        x0 = ci * cell_w
        # 内容居中
        canvas.paste(im, (x0 + (cell_w - im.size[0]) // 2, y0 + (maxh - im.size[1]) // 2), im)
canvas.convert('RGB').save(outdir + '/rows_grid.jpg', quality=88)
print('grid saved', canvas.size)

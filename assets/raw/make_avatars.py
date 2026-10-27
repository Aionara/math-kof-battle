from PIL import Image
import sys, os

anim_root = sys.argv[1]  # assets/animations
avatar_root = sys.argv[2]  # assets/avatars
os.makedirs(avatar_root, exist_ok=True)

def alpha_bbox(im):
    px = im.load()
    w, h = im.size
    xs, ys = [], []
    for y in range(h):
        for x in range(w):
            if px[x, y][3] > 40:
                xs.append(x); ys.append(y)
    if not xs: return None
    return (min(xs), min(ys), max(xs), max(ys))

for cid in sorted(os.listdir(anim_root)):
    p = os.path.join(anim_root, cid, 'idle_0.png')
    if not os.path.exists(p):
        print(cid, 'skip (no idle_0)'); continue
    im = Image.open(p).convert('RGBA')
    w, h = im.size
    px = im.load()
    b = alpha_bbox(im)
    if not b:
        print(cid, 'empty frame'); continue
    bx0, by0, bx1, by1 = b
    bh = by1 - by0 + 1
    # 头肩区：帧上部 42% 高度（头部+脖子+肩部，辨识度高、放大不糊）
    head_bottom = by0 + max(4, int(bh * 0.42))
    # 头肩区 x 范围（非透明像素，含头发/肩）
    xs = []
    for x in range(bx0, bx1 + 1):
        for y in range(by0, min(head_bottom, by1) + 1):
            if px[x, y][3] > 60:
                xs.append(x); break
    if not xs:
        print(cid, 'no head pixels'); continue
    cx0, cx1 = min(xs), max(xs)
    cw = cx1 - cx0 + 1
    ch = head_bottom - by0
    # 头肩矩形裁剪（头顶到肩部），四周外扩 8% 边距，保证头部完整不贴边
    pad = int(max(cw, ch) * 0.08)
    crop = im.crop((max(0, cx0 - pad), max(0, by0 - pad), min(w, cx1 + 1 + pad), min(h, head_bottom + 1 + pad)))
    # contain 模式：长边对齐 124，完整显示不裁剪，居中放置
    TARGET = 124
    scale = TARGET / max(crop.width, crop.height)
    nw = int(crop.width * scale + 0.5)
    nh = int(crop.height * scale + 0.5)
    crop = crop.resize((nw, nh), Image.LANCZOS)
    canvas = Image.new('RGBA', (128, 128), (0, 0, 0, 0))
    canvas.paste(crop, ((128 - nw) // 2, (128 - nh) // 2), crop)
    canvas.save(os.path.join(avatar_root, cid + '.png'))
    print(cid, 'head', cw, 'x', ch, '-> 128x128')

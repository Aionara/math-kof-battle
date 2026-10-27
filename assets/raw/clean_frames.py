from PIL import Image
import sys, os

anim_root = sys.argv[1]  # assets/animations
BG = {
    'k_prime':  (255, 0, 255),
    'k9999':    (128, 0, 255),
    'maxima':   (128, 0, 128),
    'shermie':  (17, 91, 124),
    'terry':    (143, 123, 165),
    'andy':     (7, 79, 151),
    'angel':    (128, 0, 255),
    'kusanagi': (255, 0, 255),  # 与京原贴图一致（粉底）
}
TH = 60  # 背景色距离容差

def near_bg(r, g, b, bg):
    return abs(r - bg[0]) < TH and abs(g - bg[1]) < TH and abs(b - bg[2]) < TH

for cid, bg in BG.items():
    d = os.path.join(anim_root, cid)
    if not os.path.isdir(d):
        print(cid, 'skip (no dir)'); continue
    n = 0
    for fn in sorted(os.listdir(d)):
        if not fn.endswith('.png'): continue
        p = os.path.join(d, fn)
        im = Image.open(p).convert('RGBA')
        w, h = im.size
        px = im.load()
        for y in range(h):
            for x in range(w):
                r, g, b, a = px[x, y]
                if a > 40 and near_bg(r, g, b, bg):
                    px[x, y] = (0, 0, 0, 0)
        im.save(p)
        n += 1
    print(cid, 'cleaned', n, 'frames')

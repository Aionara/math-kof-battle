from PIL import Image
import os, sys

BASE_IN = r'C:\Users\Administrator\Desktop\666\kof-math-battle\assets\animations_v21'
BASE_OUT = r'C:\Users\Administrator\Desktop\666\kof-math-battle\assets\animations_v22'
CHARS = ['k_prime', 'k9999', 'maxima', 'shermie', 'terry', 'andy', 'angel', 'kusanagi']

def detect(im):
    w, h = im.size
    p = im.load()
    rows = [sum(1 for x in range(w) if p[x, y][3] > 128) for y in range(h)]
    mx = max(rows) if rows else 0
    thr = max(15, int(mx * 0.5))
    ys = [y for y in range(h) if rows[y] >= thr]
    if not ys:
        return None, mx
    return (min(ys), max(ys)), mx

def crop_scale(im, y0, y1, base, pad_top=0.08, pad_bot=0.02):
    hb = y1 - y0 + 1
    pt = max(1, int(hb * pad_top))
    pb = max(1, int(hb * pad_bot))
    yy0 = max(0, y0 - pt)
    yy1 = min(im.height, y1 + pb + 1)
    crop = im.crop((0, yy0, im.width, yy1))
    rh = base / crop.height
    nw = max(1, int(crop.width * rh))
    crop = crop.resize((nw, base), Image.NEAREST)
    canvas = Image.new('RGBA', (nw, base), (0, 0, 0, 0))
    canvas.paste(crop, (0, 0), crop)
    return canvas

def main():
    os.makedirs(BASE_OUT, exist_ok=True)
    for c in CHARS:
        d_in = os.path.join(BASE_IN, c)
        d_out = os.path.join(BASE_OUT, c)
        os.makedirs(d_out, exist_ok=True)
        idle = Image.open(os.path.join(d_in, 'idle_0.png')).convert('RGBA')
        b, _ = detect(idle)
        BASE = (b[1] - b[0] + 1) if b else idle.height
        # idle 原样
        for f in sorted(os.listdir(d_in)):
            if f.startswith('idle_') and f.endswith('.png'):
                Image.open(os.path.join(d_in, f)).convert('RGBA').save(os.path.join(d_out, f))
        # attack 原样（角色占满帧，按帧高缩放即正确）
        for f in sorted(os.listdir(d_in)):
            if f.startswith('attack_') and f.endswith('.png'):
                Image.open(os.path.join(d_in, f)).convert('RGBA').save(os.path.join(d_out, f))
        # attack3 / attack2：裁剪角色主体到 BASE 高；检测失败帧用最近有 bbox 帧的 y 范围
        for prefix in ['attack3', 'attack2']:
            fs = sorted([f for f in os.listdir(d_in) if f.startswith(prefix + '_') and f.endswith('.png')])
            boxes = []  # 每帧 (y0, y1) 或 None
            for f in fs:
                im = Image.open(os.path.join(d_in, f)).convert('RGBA')
                b, mx = detect(im)
                if b and (b[1] - b[0] + 1) >= im.height * 0.25:
                    boxes.append(b)
                else:
                    boxes.append(None)
            # 填充 None：向前/向后找最近 bbox
            filled = list(boxes)
            for i, bb in enumerate(filled):
                if bb is None:
                    found = None
                    for dlt in range(1, len(fs)):
                        if i - dlt >= 0 and filled[i - dlt] is not None:
                            found = filled[i - dlt]
                            break
                        if i + dlt < len(fs) and filled[i + dlt] is not None:
                            found = filled[i + dlt]
                            break
                    filled[i] = found
            for i, f in enumerate(fs):
                im = Image.open(os.path.join(d_in, f)).convert('RGBA')
                bb = filled[i]
                if bb is not None:
                    out = crop_scale(im, bb[0], bb[1], BASE)
                else:
                    # 完全无法定位：整帧缩放到 BASE
                    rh = BASE / im.height
                    nw = max(1, int(im.width * rh))
                    out = im.resize((nw, BASE), Image.NEAREST)
                out.save(os.path.join(d_out, f))
        print(c, 'BASE', BASE, 'done')

if __name__ == '__main__':
    main()

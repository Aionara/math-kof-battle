import os, glob
from PIL import Image

RAW = r"C:\Users\Administrator\Desktop\666\kof-math-battle\assets\raw"
OUT = r"C:\Users\Administrator\Desktop\666\kof-math-battle\assets\characters"
TARGET_H = 560

def key_green(rgba):
    px = rgba.load()
    w, h = rgba.size
    # pass 1: mark green pixels
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            # pure green background removal with tolerance
            if (g - r) > 28 and (g - b) > 28 and g > 70:
                px[x, y] = (r, g, b, 0)

    # pass 2: despill - pull green out of edge pixels that are semi transparent (or adjacent)
    # simple approach: for fully-opaque neighbors that still have a green cast, reduce green
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 0 and (g - r) > 8 and (g - b) > 8 and g > 70:
                # reduce green spill, clamp green to max(r,b)+6
                ng = min(g, max(r, b) + 6)
                px[x, y] = (r, ng, b, a)
    return rgba

def main():
    files = sorted(glob.glob(os.path.join(RAW, "s*.jpg")))
    os.makedirs(OUT, exist_ok=True)
    for fp in files:
        name = os.path.splitext(os.path.basename(fp))[0]
        img = Image.open(fp).convert("RGBA")
        img = key_green(img)
        # trim empty border
        bbox = img.getbbox()
        if bbox:
            img = img.crop(bbox)
        # downscale to target height keeping crispness
        if img.height > TARGET_H:
            nh = TARGET_H
            nw = int(round(img.width * nh / img.height))
            img = img.resize((nw, nh), Image.LANCZOS)
        # rebuild alpha for smoothness (simple: keep as is)
        out = os.path.join(OUT, name + ".png")
        img.save(out)
        print(name, "->", img.size)

if __name__ == "__main__":
    main()

from PIL import Image
import sys, os

base = sys.argv[1]   # assets/raw
os.makedirs(base + '/preview', exist_ok=True)

# char -> (frames_dir, idle_row, atk_row, atk2_row, atk2_idx)
CFG = {
    'k':      ('frames_k',  0,  7, 36, [0,1,2,3,6]),
    'maxima': ('frames_maxima', 0, 7, 18, [0,1,2,3,4]),
    'terry':  ('frames_terry', 3, 11, 39, [0,1,2,3,4]),
    'shermie':('frames_shermie', 1, 15, 23, [0,1,2,3,4]),
    'andy':   ('frames_andy', 0, 3, 33, [0,1,2,3,4]),
    'angel':  ('frames_angel', 3, 20, 10, [0,1,2,3,4]),
    'k9999':  ('frames_k9999', 2, 12, 28, [0,1,2,3,4]),
}

def load_row_frames(d, row):
    fs = sorted([x for x in os.listdir(d) if x.startswith('row%02d_' % row)])
    return [Image.open(d + '/' + x) for x in fs]

def make_panel(rows_cfg, count, fn):
    # rows_cfg: list of (char, frames)
    panels = []
    for char, frames in rows_cfg:
        cw = 150
        canvas = Image.new('RGBA', (cw * len(frames), max(f.size[1] for f in frames) + 4), (255, 255, 255, 255))
        for i, im in enumerate(frames):
            canvas.paste(im, (i * cw + (cw - im.size[0]) // 2, (max(f.size[1] for f in frames) - im.size[1]) // 2), im)
        panels.append(canvas)
    mw = max(p.size[0] for p in panels)
    total_h = sum(p.size[1] for p in panels)
    big = Image.new('RGB', (mw, total_h), (255, 255, 255))
    y = 0
    for p in panels:
        big.paste(p, (0, y))
        y += p.size[1]
    big.save(base + '/preview/' + fn, quality=90)
    print('saved', fn, big.size)

# idle panel
idle_rows = []
for char, (d, irow, arow, a2row, a2idx) in CFG.items():
    frames = load_row_frames(base + '/' + d, irow)[:6]
    idle_rows.append((char, frames))
make_panel(idle_rows, 6, 'all_idle.jpg')

# atk panel
atk_rows = []
for char, (d, irow, arow, a2row, a2idx) in CFG.items():
    frames = load_row_frames(base + '/' + d, arow)[:9]
    atk_rows.append((char, frames))
make_panel(atk_rows, 9, 'all_atk.jpg')

# atk2 panel
atk2_rows = []
for char, (d, irow, arow, a2row, a2idx) in CFG.items():
    frames = load_row_frames(base + '/' + d, a2row)
    sel = [frames[i] for i in a2idx if i < len(frames)]
    atk2_rows.append((char, sel))
make_panel(atk2_rows, 5, 'all_atk2.jpg')

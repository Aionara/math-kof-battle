from PIL import Image
import sys, os, shutil

base = sys.argv[1]   # assets/raw
dest_root = sys.argv[2]  # assets/animations

# char_id -> (frames_dir, idle_row, atk_row, atk2_row, atk2_idx)
CFG = {
    'k_prime': ('frames_k', 0, 7, 36, [0, 1, 2, 3, 6]),
    'maxima':  ('frames_maxima', 0, 7, 18, [0, 1, 2, 3, 4]),
    'terry':   ('frames_terry', 3, 11, 39, [0, 1, 2, 3, 4]),
    'shermie': ('frames_shermie', 1, 15, 23, [0, 1, 2, 3, 4]),
    'andy':    ('frames_andy', 0, 3, 33, [0, 1, 2, 3, 4]),
    'angel':   ('frames_angel', 3, 20, 10, [0, 1, 2, 3, 4]),
    'k9999':   ('frames_k9999', 2, 12, 28, [0, 1, 2, 3, 4]),
}

for cid, (d, irow, arow, a2row, a2idx) in CFG.items():
    src = base + '/' + d
    dst = dest_root + '/' + cid
    os.makedirs(dst, exist_ok=True)
    fs = sorted([x for x in os.listdir(src) if x.startswith('row%02d_' % irow)])
    for i in range(6):
        shutil.copy(src + '/' + fs[i], dst + '/idle_%d.png' % i)
    fs = sorted([x for x in os.listdir(src) if x.startswith('row%02d_' % arow)])
    for i in range(9):
        shutil.copy(src + '/' + fs[i % len(fs)], dst + '/attack_%d.png' % i)
    fs = sorted([x for x in os.listdir(src) if x.startswith('row%02d_' % a2row)])
    for j, i in enumerate(a2idx):
        if i < len(fs):
            shutil.copy(src + '/' + fs[i], dst + '/attack2_%d.png' % j)
    n = len(os.listdir(dst))
    print(cid, 'copied', n, 'files ->', dst)

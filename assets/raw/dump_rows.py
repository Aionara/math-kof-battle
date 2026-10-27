from PIL import Image
import sys, os, json

base = sys.argv[1]
chars = sys.argv[2].split(',')
for c in chars:
    d = base + '/frames_' + c
    with open(d + '/meta.json', encoding='utf-8') as f:
        meta = json.load(f)
    print('== %s ==' % c)
    for m in meta[:40]:
        if m['h'] < 60:
            continue
        sz = ','.join('%dx%d' % (s[0], s[1]) for s in m['sizes'][:8])
        print('  row%02d h=%3d n=%2d %s' % (m['row'], m['h'], m['frames'], sz))

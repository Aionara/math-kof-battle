from PIL import Image
import sys, os, json

base = sys.argv[1]           # assets/raw
chars = sys.argv[2].split(',')  # e.g. k,maxima,terry
for c in chars:
    d = base + '/frames_' + c
    if not os.path.exists(d + '/meta.json'):
        print(c, 'NO META'); continue
    with open(d + '/meta.json', encoding='utf-8') as f:
        meta = json.load(f)
    # 候选行：真实动作行（h>=90，frames>=6）
    rows = [m for m in meta if m['h'] >= 90 and m['frames'] >= 6]
    idle_row = None
    for m in rows:
        sizes = [s[0] for s in m['sizes']]
        if len(sizes) >= 6:
            head = sizes[:6]
            # 前 6 帧宽度接近（max-min<=8）且高度接近（站姿）
            hs = [s[1] for s in m['sizes'][:6]]
            if max(head) - min(head) <= 8 and min(hs) >= 90:
                idle_row = m; break
    # attack：站立高度行中帧宽变化大（伸展）
    attack_row = None
    for m in rows:
        if not (100 <= m['h'] <= 140):
            continue
        w = [s[0] for s in m['sizes'][:12]]
        if len(w) >= 6 and (max(w) - min(w)) >= 30:
            attack_row = m; break
    # attack2：大帧行（宽>=180 或高>=1.5*idle高）
    atk2_row = None
    for m in meta:
        w = [s[0] for s in m['sizes']]
        hgt = [s[1] for s in m['sizes']]
        if w and (max(w) >= 180 or max(hgt) >= 200):
            atk2_row = m; break
    print('== %s ==' % c)
    print('  idle  row %02d h=%d frames=%d' % (idle_row['row'], idle_row['h'], idle_row['frames']))
    print('  atk   row %02d h=%d frames=%d' % (attack_row['row'], attack_row['h'], attack_row['frames']))
    print('  atk2  row %02d h=%d frames=%d sizes=%s' % (atk2_row['row'], atk2_row['h'], atk2_row['frames'], ','.join('%dx%d' % (s[0], s[1]) for s in atk2_row['sizes'][:10])))
    # 生成预览
    preview_dir = base + '/preview'
    os.makedirs(preview_dir, exist_ok=True)
    def grid(row, count, fn):
        fs = sorted([x for x in os.listdir(d) if x.startswith('row%02d_' % row)])[:count]
        frames = [Image.open(d + '/' + x) for x in fs]
        mh = max(f.size[1] for f in frames)
        cw = 150
        canvas = Image.new('RGBA', (cw * len(frames), mh + 4), (255, 255, 255, 255))
        for i, im in enumerate(frames):
            canvas.paste(im, (i * cw + (cw - im.size[0]) // 2, (mh - im.size[1]) // 2), im)
        canvas.convert('RGB').save(preview_dir + '/' + fn, quality=90)
    grid(idle_row['row'], 6, '%s_idle.jpg' % c)
    grid(attack_row['row'], 9, '%s_atk.jpg' % c)
    grid(atk2_row['row'], 5, '%s_atk2.jpg' % c)
    print('  previews saved')

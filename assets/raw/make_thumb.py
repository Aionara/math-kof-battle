from PIL import Image
import sys
path = sys.argv[1]
out = sys.argv[2]
img = Image.open(path).convert('RGBA')
w, h = img.size
# 生成缩略图（宽 1919 不变，高度压缩 3 倍 → 1725px，可见全貌）
thumb = img.resize((w, h // 3), Image.LANCZOS)
thumb.save(out)
print('thumb saved', out, thumb.size)

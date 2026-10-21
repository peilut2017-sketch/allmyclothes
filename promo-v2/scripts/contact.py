"""מחבר פריימי בדיקה לגיליון אחד עם מספר פריים וזמן: python3 scripts/contact.py <dir> <out.png> [cols]"""
import sys, glob, os
from PIL import Image, ImageDraw

d, out = sys.argv[1], sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 6
files = sorted(glob.glob(os.path.join(d, '*.png')))
ims = [Image.open(f).convert('RGB') for f in files]
w, h = ims[0].size
rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * w + (cols + 1) * 6, rows * (h + 26) + 6), (40, 40, 40))
dr = ImageDraw.Draw(sheet)
for i, (f, im) in enumerate(zip(files, ims)):
    x = 6 + (i % cols) * (w + 6)
    y = 6 + (i // cols) * (h + 26)
    sheet.paste(im, (x, y + 20))
    fr = int(os.path.basename(f).split('_')[-1].split('.')[0])
    dr.text((x + 4, y + 4), f'#{fr}  {fr/30:.2f}s', fill=(255, 220, 120))
sheet.save(out)
print(out, sheet.size)

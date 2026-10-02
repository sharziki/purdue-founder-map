#!/usr/bin/env python3
"""Snap the generated reading-room master onto a true 320x180 pixel grid with a 64-colour palette.

usage: python3 scripts/pixelate_room.py [master.png] [out.png]
"""
import sys
from pathlib import Path
from PIL import Image, ImageEnhance

ROOT = Path(__file__).resolve().parents[1]
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'docs/design/reading-room/assets/pixel-room-master.png'
OUT = Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / 'public/assets/library/reading-room.png'
W, H, COLOURS = 320, 180, 64

im = Image.open(SRC).convert('RGB')
sw, sh = im.size
nh = round(sw / (W / H))
im = im.crop((0, (sh - nh) // 2, sw, (sh - nh) // 2 + nh))  # keep pixels square
small = ImageEnhance.Contrast(im.resize((W, H), Image.BOX)).enhance(1.05)
small.quantize(colors=COLOURS, method=Image.Quantize.MEDIANCUT, kmeans=3, dither=Image.Dither.NONE).save(OUT, optimize=True)
print(OUT, (W, H), COLOURS, 'colours')

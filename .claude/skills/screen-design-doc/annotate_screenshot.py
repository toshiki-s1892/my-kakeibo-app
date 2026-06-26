#!/usr/bin/env python3
"""Draw numbered pin markers on a screen design screenshot.

Usage: annotate_screenshot.py <src.png> <dst.png> '[[x1,y1],[x2,y2],...]'

Pins are numbered 1..N in the order given. Restricted to reading/writing
inside docs/design/screenshots/ so this script stays safe to auto-approve.
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ALLOWED_DIR = (Path(__file__).resolve().parents[3] / "docs" / "design" / "screenshots").resolve()


def _validate_path(raw: str) -> Path:
    p = Path(raw).resolve()
    if ALLOWED_DIR not in p.parents and p.parent != ALLOWED_DIR:
        raise ValueError(f"{p} is outside {ALLOWED_DIR}")
    return p


def annotate(src: Path, dst: Path, points: list[tuple[int, int]]) -> None:
    im = Image.open(src).convert("RGB")
    w, _ = im.size
    draw = ImageDraw.Draw(im)
    base_r = max(16, int(w * 0.014))
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", int(base_r * 1.3))
    except Exception:
        font = ImageFont.load_default()
    for i, (x, y) in enumerate(points, start=1):
        r = base_r
        draw.ellipse([x - r, y - r, x + r, y + r], fill=(220, 38, 38), outline=(255, 255, 255), width=max(2, r // 8))
        text = str(i)
        bbox = draw.textbbox((0, 0), text, font=font)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        draw.text((x - tw / 2 - bbox[0], y - th / 2 - bbox[1]), text, fill=(255, 255, 255), font=font)
    im.save(dst)
    print(f"saved {dst} ({im.size[0]}x{im.size[1]}, {len(points)} pins)")


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print(__doc__)
        sys.exit(1)
    src_path = _validate_path(sys.argv[1])
    dst_path = _validate_path(sys.argv[2])
    pins = [tuple(p) for p in json.loads(sys.argv[3])]
    annotate(src_path, dst_path, pins)

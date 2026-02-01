#!/usr/bin/env python3
"""Crop a PNG to the bounding box of non-transparent pixels (trim to color borders)."""
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Need Pillow: pip install Pillow")
    sys.exit(1)

def trim_to_content(path: Path, out_path: Path | None = None, alpha_threshold: int = 10) -> None:
    img = Image.open(path).convert("RGBA")
    alpha = img.split()[-1]
    # Bounding box of pixels where alpha > threshold
    mask = alpha.point(lambda p: 255 if p > alpha_threshold else 0, mode="1")
    bbox = mask.getbbox()
    if not bbox:
        print("No non-transparent pixels found")
        return
    img = img.crop(bbox)
    dest = out_path or path
    img.save(dest, "PNG")
    print(f"Trimmed to content: {path} -> {dest} (bbox {bbox})")

if __name__ == "__main__":
    base = Path(__file__).resolve().parent.parent
    src = base / "public" / "MIRA-removebg-preview.png"
    out = base / "public" / "MIRA-logo-trimmed.png"
    if not src.exists():
        print(f"Not found: {src}")
        sys.exit(1)
    trim_to_content(src, out)

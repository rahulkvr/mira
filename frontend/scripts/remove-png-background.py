#!/usr/bin/env python3
"""Make solid background color in PNGs transparent. Uses top-left pixel as background."""
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Need Pillow: pip install Pillow")
    sys.exit(1)

def remove_background(path: Path, tolerance: int = 30) -> None:
    img = Image.open(path).convert("RGBA")
    data = img.getdata()
    # Use top-left pixel as background color
    bg = data[0][:3]  # R, G, B
    new_data = []
    for item in data:
        r, g, b, a = item
        # If pixel is close to background, make transparent
        if all(abs(c - bc) <= tolerance for c, bc in zip((r, g, b), bg)):
            new_data.append((r, g, b, 0))
        else:
            new_data.append(item)
    img.putdata(new_data)
    img.save(path, "PNG")
    print(f"Updated {path}")

if __name__ == "__main__":
    assets = Path(__file__).resolve().parent.parent / "src" / "assets"
    for name in ("mira-logo.png", "train-sunrise.png"):
        p = assets / name
        if p.exists():
            remove_background(p)
        else:
            print(f"Skip (not found): {p}")

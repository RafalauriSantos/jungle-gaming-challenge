"""Derives the catalog artwork from the four images of the Figma file (public/nfts/art-1..4.webp).

Each variant keeps the character (fur, face) and changes what a collector would call the "traits": the colour of the
clothes and accessories, the colour of the backdrop, and whether the picture is mirrored. It is deterministic: the same
inputs give the same files. Run from the repository root:  python3 docs/assets/derive-artwork.py
"""
import colorsys
from pathlib import Path

import numpy as np
from PIL import Image

OUT = Path("public/nfts")
SIZE = 640
TOTAL = 57  # art-1..4 are the originals; art-5..57 are derived


def load(n: int) -> np.ndarray:
    return np.asarray(Image.open(OUT / f"art-{n}.webp").convert("RGB"), dtype=np.float32) / 255.0


def rgb_to_hsv(a: np.ndarray) -> np.ndarray:
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx, mn = a.max(-1), a.min(-1)
    d = mx - mn
    h = np.zeros_like(mx)
    m = d > 1e-6
    rm, gm, bm = (mx == r) & m, (mx == g) & m & ~((mx == r) & m), (mx == b) & m & ~((mx == r) & m) & ~((mx == g) & m)
    h[rm] = ((g - b)[rm] / d[rm]) % 6
    h[gm] = (b - r)[gm] / d[gm] + 2
    h[bm] = (r - g)[bm] / d[bm] + 4
    s = np.where(mx > 1e-6, d / np.maximum(mx, 1e-6), 0)
    return np.stack([h / 6.0, s, mx], -1)


def hsv_to_rgb(a: np.ndarray) -> np.ndarray:
    h, s, v = a[..., 0] % 1.0, a[..., 1], a[..., 2]
    i = np.floor(h * 6).astype(int) % 6
    f = h * 6 - np.floor(h * 6)
    p, q, t = v * (1 - s), v * (1 - f * s), v * (1 - (1 - f) * s)
    out = np.zeros(a.shape, dtype=np.float32)
    for k, (r, g, b) in enumerate([(v, t, p), (q, v, p), (p, v, t), (p, q, v), (t, p, v), (v, p, q)]):
        sel = i == k
        out[..., 0][sel], out[..., 1][sel], out[..., 2][sel] = r[sel], g[sel], b[sel]
    return out


def backdrop_mask(img: np.ndarray) -> np.ndarray:
    """The backdrop: pixels connected to the border whose colour stays close to what is seen at the border."""
    h, w, _ = img.shape
    seen = np.zeros((h, w), dtype=bool)
    seeds = [(0, 0), (0, w - 1), (h - 1, 0), (h - 1, w - 1), (0, w // 2), (h // 2, 0), (h // 2, w - 1)]
    stack = [s for s in seeds]
    ref = np.mean([img[y, x] for y, x in seeds], axis=0)
    while stack:
        y, x = stack.pop()
        if y < 0 or x < 0 or y >= h or x >= w or seen[y, x]:
            continue
        if np.abs(img[y, x] - ref).max() > 0.17:
            continue
        seen[y, x] = True
        stack.extend([(y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)])
    return seen


# Where the clothes and accessories sit, by hue (0..1): the greens and purples of the four pictures.
TRAIT_HUES = {1: [(0.25, 0.48)], 2: [(0.2, 0.4), (0.68, 0.85)], 3: [(0.3, 0.5)], 4: [(0.3, 0.5)]}


def variant(base: int, trait_shift: float, backdrop_shift: float, lift: float, mirror: bool) -> Image.Image:
    img = load(base)
    hsv = rgb_to_hsv(img)
    trait = np.zeros(hsv.shape[:2], dtype=bool)
    for lo, hi in TRAIT_HUES[base]:
        trait |= (hsv[..., 0] >= lo) & (hsv[..., 0] <= hi) & (hsv[..., 1] > 0.22)
    back = backdrop_mask(img)
    # The circle behind the orange ape is part of the backdrop too.
    if base == 4:
        back |= (hsv[..., 0] > 0.2) & (hsv[..., 0] < 0.45) & (hsv[..., 1] < 0.35) & (hsv[..., 1] > 0.05)
    out = hsv.copy()
    out[..., 0] = np.where(trait & ~back, (hsv[..., 0] + trait_shift) % 1.0, out[..., 0])
    out[..., 0] = np.where(back, (hsv[..., 0] + backdrop_shift) % 1.0, out[..., 0])
    out[..., 1] = np.where(back, np.clip(hsv[..., 1] * 1.0 + 0.10, 0, 1), out[..., 1])
    out[..., 2] = np.where(back, np.clip(hsv[..., 2] + lift, 0, 1), out[..., 2])
    rgb = hsv_to_rgb(out)
    pic = Image.fromarray((np.clip(rgb, 0, 1) * 255).astype(np.uint8))
    return pic.transpose(Image.FLIP_LEFT_RIGHT) if mirror else pic


def recipe(n: int) -> tuple[int, float, float, float, bool]:
    """Art number (5..TOTAL) to the base picture and the changes. Spread so that neighbours never look alike."""
    k = n - 5
    base = (k % 4) + 1
    step = k // 4  # 0..13 for each base
    trait = step / 14.0 + 0.03 * base  # 14 evenly spaced clothes colours per picture
    backdrop = ((step * 5) % 14) / 14.0 + 0.03 * base  # 5 is coprime with 14: every backdrop is used once
    lift = (-0.10, 0.0, 0.06, -0.05)[step % 4]
    return base, trait, backdrop, lift, step % 2 == 1


if __name__ == "__main__":
    for n in range(5, TOTAL + 1):
        base, trait, backdrop, lift, mirror = recipe(n)
        pic = variant(base, trait, backdrop, lift, mirror).resize((SIZE, SIZE), Image.LANCZOS)
        pic.save(OUT / f"art-{n}.webp", "WEBP", quality=78, method=6)
    print(f"wrote art-5..art-{TOTAL}")
    # Small copies for the catalog cards (shown at most 250 px wide) and the home banner, which keep the first paint light.
    for n in range(1, TOTAL + 1):
        Image.open(OUT / f"art-{n}.webp").convert("RGB").resize((360, 360), Image.LANCZOS).save(OUT / f"art-{n}-360.webp", "WEBP", quality=76, method=6)
    for src, dst, size in (("art-1", "art-1-300", 300), ("art-2", "art-2-120", 120)):
        Image.open(OUT / f"{src}.webp").convert("RGB").resize((size, size), Image.LANCZOS).save(OUT / f"{dst}.webp", "WEBP", quality=78, method=6)
    print("wrote the small copies")

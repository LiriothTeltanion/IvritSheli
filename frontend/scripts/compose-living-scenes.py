"""Compose real browser captures; requires Pillow only in the export environment.

Run with: uv run --no-project --with pillow python scripts/compose-living-scenes.py OUTPUT
No product illustration is generated or retouched here. The script only lays
out recorded browser pixels with labels and produces a finite demonstration GIF.
"""
from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps

KEYS = ["food.bread", "food.water", "greetings.hello", "greetings.good_morning", "actions.write", "numbers.one"]
LABELS = ["Pan", "Agua", "Hola", "Buenos días", "Escribir", "Una taza · una unidad"]
OUTPUT = Path(sys.argv[1]).resolve()
# The f623fa0 baselines are checked in; the capture script only records the current product (after-*).
BEFORE = Path(__file__).resolve().parent.parent / "public" / "art-direction" / "living-scenes" / "before"
FONT_ROOT = Path("C:/Windows/Fonts")


def font(size: int, heading: bool = False) -> ImageFont.FreeTypeFont:
    """Use installed local fonts only, never fetch remote typography."""
    return ImageFont.truetype(str(FONT_ROOT / ("georgia.ttf" if heading else "segoeui.ttf")), size)


def sheet(theme: str, frame: int | None = None) -> Image.Image:
    """Give six scenes equal space, with their original 4:3 composition intact."""
    dark = theme == "dark"
    bg, ink, muted = ("#101f24", "#ece9da", "#b2c0b4") if dark else ("#f5f1e7", "#243e39", "#5c6c62")
    canvas = Image.new("RGB", (1200, 760), bg)
    draw = ImageDraw.Draw(canvas)
    draw.text((24, 16), "Ivrit Sheli · El hebreo cobra vida", font=font(27, True), fill=ink)
    draw.text((24, 55), "2.13.0 · seis escenas SVG reales · candidata local", font=font(15), fill=muted)
    for index, (key, label) in enumerate(zip(KEYS, LABELS, strict=True)):
        x, y = 24 + (index % 3) * 392, 94 + (index // 3) * 328
        source = OUTPUT / (f"after-{theme}-{key}.png" if frame is None else f"frames/{frame:02d}-{key}.png")
        with Image.open(source) as original:
            rendered = ImageOps.contain(original.convert("RGB"), (368, 276), Image.Resampling.LANCZOS)
            canvas.paste(rendered, (x, y))
        draw.text((x, y + 285), f"0{index + 1}  {label}", font=font(17), fill=ink)
    draw.text((24, 741), "Capturas de la aplicación local; movimiento reducido disponible en el producto.", font=font(12), fill=muted)
    return canvas


def compare(theme: str) -> Image.Image:
    """Original f623fa0 on the left; current product on the right."""
    canvas = Image.new("RGB", (1060, 2630), "#f5f1e7")
    draw = ImageDraw.Draw(canvas)
    draw.text((30, 20), "Antes y después · Ivrit Sheli", font=font(30, True), fill="#243e39")
    draw.text((30, 68), f"Tema {theme} · fuente original f623fa0 / candidata local 2.13.0", font=font(16), fill="#5c6c62")
    for index, (key, label) in enumerate(zip(KEYS, LABELS, strict=True)):
        y = 112 + index * 416
        draw.text((30, y), label, font=font(23, True), fill="#243e39")
        for column, prefix in enumerate(["before", "after"]):
            source = BEFORE / f"{theme}-{key}.png" if prefix == "before" else OUTPUT / f"after-{theme}-{key}.png"
            with Image.open(source) as image:
                rendered = ImageOps.contain(image.convert("RGB"), (490, 367), Image.Resampling.LANCZOS)
                canvas.paste(rendered, (30 + column * 510, y + 36))
    return canvas


def main() -> None:
    files = []
    for theme in ["light", "dark"]:
        image = sheet(theme)
        for name, pixels in [(f"overview-{theme}.png", image), (f"overview-{theme}-grayscale.png", ImageOps.grayscale(image))]:
            pixels.save(OUTPUT / name, optimize=True)
            files.append(name)
        compare(theme).save(OUTPUT / f"before-after-{theme}.png", optimize=True)
        files.append(f"before-after-{theme}.png")
    frames = [sheet("light", frame) for frame in range(19)]
    gif = OUTPUT / "living-scenes-motion.gif"
    frames[0].save(gif, save_all=True, append_images=frames[1:], duration=[100] * 18 + [1000], disposal=2, optimize=False)
    assert b"NETSCAPE2.0" not in gif.read_bytes(), "The exported tour must not loop forever."
    files.append(gif.name)
    manifest = {"method": "Composed browser captures; finite live-CSS timeline sample, no illustration retouching", "loop": False, "assets": []}
    for name in files:
        payload = (OUTPUT / name).read_bytes()
        with Image.open(OUTPUT / name) as image:
            manifest["assets"].append({"file": name, "bytes": len(payload), "sha256": hashlib.sha256(payload).hexdigest(), "width": image.width, "height": image.height})
    (OUTPUT / "presentation-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(OUTPUT), "files": files}, indent=2))


if __name__ == "__main__":
    main()

"""Build the README lockup from the same contours the application ships.

The wordmark must never depend on a webfont. An SVG shown through ``<img>`` --
which is how the README embeds this file, and how the PWA embeds the app icon --
cannot load one at all, so a mark set in ``<text>`` silently falls back and takes
a different shape on every machine. That is exactly what the four retired files
in ``assets/brand/`` did. See ``docs/VISUAL_BIBLE.md``, "The wordmark".

So both halves are outlines:

* "Ivrit" is the hand-authored Hebrew square-script construction from
  ``frontend/src/components/IvritHebraicLetters.tsx``.
* "שלי" is the Gveret Levin (OFL) contours extracted with ``fontTools`` for
  ``frontend/public/icons/app-icon.svg``.

Run ``python scripts/build_brand_wordmark.py`` after either source changes, then
``python scripts/generate_checksums.py``.
"""

from __future__ import annotations

from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
OUTPUT = REPO_ROOT / "assets" / "brand" / "wordmark-nocturne.svg"

# Kept byte-identical to IvritHebraicLetters.tsx. Glyph space is 312x84 with the
# bottom edge on the Latin baseline; ink starts at y=16 and the crowns at y=7.
IVRIT_PATHS = (
    "M6 16 H40 L44 21 V33 H29 V74 H39 V84 H14 L11 80 V74 H21 V33 H14 V43 H6 Z",
    "M56 16 H76 L80 21 V33 H56 Z M92 16 H112 L116 21 V33 H92 Z"
    " M58 33 H67 L86 75.1 L105 33 H114 L91 84 H81 Z",
    "M128 16 H168 L172 21 V60 L188 84 H176 L160 60 H136 V84 H131 L128 80 Z"
    " M136 33 H164 V50 H136 Z",
    "M200 16 H234 L238 21 V33 H223 V74 H233 V84 H208 L205 80 V74 H215 V33 H208 V43 H200 Z",
    "M250 16 H302 L306 21 V33 H282 V74 H292 V84 H267 L264 80 V74 H274 V33 H258 V43 H250 Z",
)

# The three tagin a scribe sets over the closing T.
CROWN_PATHS = (
    "M266.5 16 L265 7 L269.5 16 Z",
    "M276.5 16 L278 7 L279.5 16 Z",
    "M286.5 16 L291 7 L289.5 16 Z",
)

# Font space: y grows upward from the baseline, so the ink is negative. Laid out
# right to left, the paths are yod, lamed, shin.
SHELI_PATHS = (
    "M62.0 -229Q38.0 -238 37.5 -265.5Q37.0 -293 49.5 -331.5Q62.0 -370 79.0 -412.0"
    "Q96.0 -454 106.0 -491Q117.0 -528 140.0 -546.5Q163.0 -565 188.0 -557"
    "Q223.0 -545 226.0 -515.0Q229.0 -485 215.0 -447Q209.0 -431 199.0 -401.5"
    "Q189.0 -372 175.5 -339.0Q162.0 -306 144.5 -277.5Q127.0 -249 106.5 -234.5"
    "Q86.0 -220 62.0 -229Z",
    "M234.0 13Q194.0 9 176.5 -21.5Q159.0 -52 164.0 -98Q170.0 -147 193.0 -175.0"
    "Q216.0 -203 245.5 -216.5Q275.0 -230 300.0 -234Q313.0 -307 336.5 -395.5"
    "Q360.0 -484 396.0 -595Q447.0 -752 530.5 -825.0Q614.0 -898 716.0 -902"
    "Q754.0 -904 797.0 -890.5Q840.0 -877 869.0 -853Q903.0 -825 909.0 -798.0"
    "Q915.0 -771 903.0 -760Q886.0 -745 866.5 -749.5Q847.0 -754 825.5 -767.0"
    "Q804.0 -780 780.5 -792.0Q757.0 -804 733.0 -805Q680.0 -807 637.5 -774.5"
    "Q595.0 -742 561.5 -687.0Q528.0 -632 502.5 -565.5Q477.0 -499 458.5 -431.0"
    "Q440.0 -363 427.5 -304.5Q415.0 -246 407.0 -208Q391.0 -129 369.0 -83.5"
    "Q347.0 -38 322.5 -17.0Q298.0 4 275.0 9.0Q252.0 14 234.0 13Z",
    "M693.0 22Q625.0 12 578.5 -24.5Q532.0 -61 511.0 -113Q505.0 -112 501.0 -111"
    "Q468.0 -106 460.5 -129.0Q453.0 -152 472.0 -178Q478.0 -186 494.0 -197"
    "Q493.0 -232 502.0 -268Q525.0 -366 567.5 -438.5Q610.0 -511 663.5 -560.5"
    "Q717.0 -610 773.0 -640.0Q829.0 -670 880.0 -683.5Q931.0 -697 968.0 -697"
    "Q1028.0 -697 1053.5 -651.0Q1079.0 -605 1068.0 -531Q1061.0 -484 1028.5 -439.0"
    "Q996.0 -394 946.5 -352.0Q897.0 -310 840.0 -273.5Q783.0 -237 725.5 -207.0"
    "Q668.0 -177 619.0 -155Q626.0 -130 638.0 -112.5Q650.0 -95 666.0 -89"
    "Q701.0 -76 733.5 -82.5Q766.0 -89 794.5 -109.5Q823.0 -130 845.5 -158.0"
    "Q868.0 -186 881.0 -215Q897.0 -249 919.0 -268.5Q941.0 -288 969.0 -276"
    "Q995.0 -266 997.0 -239.0Q999.0 -212 983.0 -174Q955.0 -106 909.0 -58.5"
    "Q863.0 -11 807.0 10.0Q751.0 31 693.0 22Z"
    "M682.0 -423Q653.0 -387 636.5 -344.5Q620.0 -302 614.0 -261Q649.0 -278 685.0 -298.0"
    "Q721.0 -318 755.0 -340Q842.0 -397 892.0 -449.0Q942.0 -501 960.0 -538.0"
    "Q978.0 -575 968.0 -588Q959.0 -600 927.5 -592.5Q896.0 -585 852.5 -561.5"
    "Q809.0 -538 763.5 -502.5Q718.0 -467 682.0 -423Z",
)

PLATE_W, PLATE_H = 880, 250
PLATE_RADIUS = 42

# "Ivrit" sits on a baseline at IVRIT_Y + 84 * IVRIT_SCALE.
IVRIT_X, IVRIT_Y, IVRIT_SCALE = 96, 59, 1.55
CYAN_BAR = (96, 201, 465, 11)

# "שלי" hangs from its own baseline; the ink runs 158 units above it.
SHELI_X, SHELI_Y, SHELI_SCALE = 594.5, 191, 0.175
CORAL_BAR = (598, 205, 188, 11)
SHELI_ROTATION = (-5, 689, 114)


def build() -> str:
    out: list[str] = []
    add = out.append

    add(
        f'<svg width="{PLATE_W}" height="{PLATE_H}" viewBox="0 0 {PLATE_W} {PLATE_H}"'
        ' fill="none" xmlns="http://www.w3.org/2000/svg" role="img"'
        ' aria-labelledby="title desc">'
    )
    add("  <title id=\"title\">Ivrit Sheli</title>")
    add(
        '  <desc id="desc">The Ivrit Sheli nocturne lockup: the word Ivrit drawn'
        " as Hebrew square-script letterforms under a cyan stroke, beside the"
        " Hebrew word shel-i in coral handwriting.</desc>"
    )
    add("  <!-- Generated by scripts/build_brand_wordmark.py. Do not hand-edit.")
    add("       No <text> and no font-family on purpose: this file is embedded")
    add("       through <img>, which cannot load a webfont. -->")

    add("  <defs>")
    add(
        f'    <linearGradient id="plate" x1="0" y1="0" x2="{PLATE_W}" y2="{PLATE_H}"'
        ' gradientUnits="userSpaceOnUse">'
    )
    add('      <stop offset="0%" stop-color="#04121f"/>')
    add('      <stop offset="55%" stop-color="#071c2e"/>')
    add('      <stop offset="100%" stop-color="#03101c"/>')
    add("    </linearGradient>")
    add(
        '    <radialGradient id="glow" cx="410" cy="128" r="350"'
        ' gradientUnits="userSpaceOnUse">'
    )
    add('      <stop offset="0%" stop-color="#00b4d8" stop-opacity="0.30"/>')
    add('      <stop offset="100%" stop-color="#00b4d8" stop-opacity="0"/>')
    add("    </radialGradient>")
    add(
        f'    <linearGradient id="edge" x1="0" y1="0" x2="{PLATE_W}" y2="{PLATE_H}"'
        ' gradientUnits="userSpaceOnUse">'
    )
    add('      <stop offset="0%" stop-color="#64ffda" stop-opacity="0.75"/>')
    add('      <stop offset="55%" stop-color="#00b4d8" stop-opacity="0.45"/>')
    add('      <stop offset="100%" stop-color="#03045e" stop-opacity="0.60"/>')
    add("    </linearGradient>")
    add(
        '    <linearGradient id="ink" x1="96" y1="60" x2="570" y2="190"'
        ' gradientUnits="userSpaceOnUse">'
    )
    add('      <stop offset="0%" stop-color="#ffffff"/>')
    add('      <stop offset="58%" stop-color="#a5f3fc"/>')
    add('      <stop offset="100%" stop-color="#22d3ee"/>')
    add("    </linearGradient>")
    add(
        '    <linearGradient id="cyanbar" x1="96" y1="0" x2="561" y2="0"'
        ' gradientUnits="userSpaceOnUse">'
    )
    add('      <stop offset="0%" stop-color="#67e8f9"/>')
    add('      <stop offset="60%" stop-color="#22d3ee"/>')
    add('      <stop offset="100%" stop-color="#0284c7" stop-opacity="0.35"/>')
    add("    </linearGradient>")
    add(
        '    <linearGradient id="coral" x1="600" y1="35" x2="784" y2="195"'
        ' gradientUnits="userSpaceOnUse">'
    )
    add('      <stop offset="0%" stop-color="#ff0a54"/>')
    add('      <stop offset="50%" stop-color="#ff477e"/>')
    add('      <stop offset="100%" stop-color="#ff7096"/>')
    add("    </linearGradient>")
    add(
        '    <linearGradient id="coralbar" x1="598" y1="0" x2="786" y2="0"'
        ' gradientUnits="userSpaceOnUse">'
    )
    add('      <stop offset="0%" stop-color="#ff758c"/>')
    add('      <stop offset="50%" stop-color="#ff3b5c"/>')
    add('      <stop offset="100%" stop-color="#ff1744"/>')
    add("    </linearGradient>")
    add("  </defs>")
    add("")

    add(f'  <rect width="{PLATE_W}" height="{PLATE_H}" rx="{PLATE_RADIUS}" fill="url(#plate)"/>')
    add(f'  <rect width="{PLATE_W}" height="{PLATE_H}" rx="{PLATE_RADIUS}" fill="url(#glow)"/>')
    add(
        f'  <rect x="1.5" y="1.5" width="{PLATE_W - 3}" height="{PLATE_H - 3}"'
        f' rx="{PLATE_RADIUS - 1.5}" stroke="url(#edge)" stroke-width="3" fill="none"/>'
    )
    add("")

    add('  <g transform="translate({} {}) scale({})">'.format(IVRIT_X, IVRIT_Y, IVRIT_SCALE))
    for path in CROWN_PATHS:
        add(f'    <path d="{path}" fill="#f5cb73"/>')
    for path in IVRIT_PATHS:
        add(f'    <path d="{path}" fill="url(#ink)" fill-rule="evenodd"/>')
    add("  </g>")
    x, y, w, h = CYAN_BAR
    add(f'  <rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{h / 2}" fill="url(#cyanbar)"/>')
    add("")

    angle, cx, cy = SHELI_ROTATION
    add(f'  <g transform="rotate({angle} {cx} {cy})">')
    add(
        '    <g transform="translate({} {}) scale({})" fill="url(#coral)">'.format(
            SHELI_X, SHELI_Y, SHELI_SCALE
        )
    )
    for path in SHELI_PATHS:
        add(f'      <path d="{path}"/>')
    add("    </g>")
    x, y, w, h = CORAL_BAR
    add(f'    <rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{h / 2}" fill="url(#coralbar)"/>')
    add("  </g>")
    add("</svg>")
    return "\n".join(out) + "\n"


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(build(), encoding="utf-8", newline="\n")
    print(f"wrote {OUTPUT.relative_to(REPO_ROOT).as_posix()}")


if __name__ == "__main__":
    main()

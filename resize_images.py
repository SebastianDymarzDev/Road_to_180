"""
Verkleinert alle PNGs aus img/ nach img_small/ (als WebP).
Die Originale bleiben unveraendert.

Aufruf im Projektordner:   python resize_images.py
Benoetigt:                 pip install pillow

Vorschaubilder zum Pruefen der Groessen:
  img_small/_preview_player.png
  img_small/_preview_boss_level1.png ... level5.png
"""
import re
import sys
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.cwd()
SRC = ROOT / "img"
DST = ROOT / "img_small"

CANVAS = (720, 480)
WEBP_QUALITY = 88

# ---- Sprites (Figuren mit gleicher Zellgroesse und gemeinsamer Fusslinie) ----
PLAYER_CANVAS_H = 146   # ergibt ca. 140 px Koerperhoehe bei Idle
BOSS_CANVAS_H = 200     # Startwert, Boss soll groesser als der Spieler sein
FEET_MARGIN = 4         # Abstand Fuesse zur Unterkante der Zelle

# Feinkorrektur pro Spieler-Animation (1.0 = unveraendert), nach Augenmass gesetzt.
PLAYER_MULT = {
    "player_idle": 1.0,
    "player_run": 1.05,
    "player_jump": 1.0,
    "player_duck": 1.0,
    "player_throw": 1.2,
    "player_hit": 1.0,
    "player_die": 1.2,
    "player_sleep": 1.2,
    "player_win": 1.2,
}

FRAME_MULT = {
    "lose_02": 0.58,   # kniende Pose war viel zu groß
    "district_boss_die_04": 0.8,   # liegende Pose war zu groß
    "state_boss_die_04": 0.7,   # liegende Pose war zu groß
    "world_boss_die_04": 0.75,   # liegende Pose war zu groß
    "180_boss_idle_02": 0.8,   # war größer gezeichnet als die anderen Bilder
    "180_boss_idle_03": 0.8,
}

# Feinkorrektur pro Boss und Animation (1.0 = unveraendert).
# Nur level5/idle ist nach Augenmass gesetzt (Stichprobe), der Rest ist 1.0.
# Im Vorschaubild img_small/_preview_boss_levelN.png pruefen und hier nachstellen.
BOSS_MULT = {
    "level1": {"idle": 1.1, "angry": 1.1, "throw": 0.94, "hit": 1.1, "die": 1.1},
    "level2": {"idle": 1.0, "angry": 1.0, "throw": 1.0, "hit": 1.0, "die": 1.0},
    "level3": {"idle": 1.0, "angry": 1.0, "throw": 1.0, "hit": 1.0, "die": 1.0},
    "level4": {"idle": 1.0, "angry": 1.0, "throw": 1.0, "hit": 1.0, "die": 1.0},
    "level5": {"idle": 1.5, "angry": 1.56, "throw": 1.19, "hit": 1.63, "die": 1.56},
}

# ---- Alles andere: laengste Seite in px (nie hochskalieren) ----
DEFAULT_MAX = 256
MAX_SIDE_RULES = [          # erster Treffer im Pfad gewinnt (Startwerte)
    ("dartboard", 96),
    ("enemies/arrow", 120),
    ("projectile", 72),
    ("items/", 56),
    ("buttons/play", 600),
    ("buttons/options", 600),
    ("buttons/credits", 600),
    ("buttons/select_level", 600),
    ("buttons/back", 600),
    ("buttons/", 72),
    ("favicon", 64),
    ("badge", 256),
    ("endboss_name", 360),
    ("_logo", 360),
    ("bars/coin_counter", 160),
    ("bars/", 360),
    ("assets/logo_with_player", 1672),
    ("assets/menu_background", 1920),
    ("assets/win", 560),
    ("assets/lose", 560),
    ("assets/logo", 360),
]
FULLSCREEN = set()

BOSS_RE = re.compile(r"character/enemies/endboss/(level\d)/(idle|angry|throw|hit|die)/")


def rel(p):
    return p.relative_to(SRC).as_posix().lower()


def has_alpha(im):
    return im.mode == "RGBA" and im.getchannel("A").getextrema()[0] < 255


def save(im, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    if not has_alpha(im):
        im = im.convert("RGB")
    im.save(path, "WEBP", quality=WEBP_QUALITY, method=6, alpha_quality=100)


def feet(im):
    """Unterkante der sichtbaren Pixel (= Fuesse)."""
    bb = im.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox()
    return bb[3] if bb else im.height


def process_sprite_group(files, canvas_h, mult_of):
    """Alle Frames einer Figur: gleiche Zellgroesse, Fuesse auf gleicher Linie."""
    scaled = []
    for f in files:
        im = Image.open(f).convert("RGBA")
        s = canvas_h * mult_of(f) / im.height
        im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
        scaled.append((f, im, feet(im)))
    cell_w = max(im.width for _, im, _ in scaled)
    cell_h = max(fb for _, _, fb in scaled) + FEET_MARGIN
    out = {}
    for f, im, fb in scaled:
        cell = Image.new("RGBA", (cell_w, cell_h), (0, 0, 0, 0))
        cell.paste(im, ((cell_w - im.width) // 2, cell_h - FEET_MARGIN - fb), im)
        save(cell, DST / f.relative_to(SRC).with_suffix(".webp"))
        out[f] = cell
    return out, (cell_w, cell_h)


def process_character(files, canvas_h, mult_of, label, preview_name):
    """Eine Figur. 'die' (oft liegende, breite Pose) bekommt eine eigene Zellgroesse."""
    die = [p for p in files if p.parent.name.endswith("die")]
    rest = [p for p in files if not p.parent.name.endswith("die")]
    cells = {}
    for group, name in ((rest, label), (die, label + " (die)")):
        if group:
            c, size = process_sprite_group(group, canvas_h, mult_of)
            cells.update(c)
            print(f"{name}: Zelle {size[0]}x{size[1]} px")
    first = {}
    for f in sorted(cells):
        first.setdefault(f.parent.name, cells[f])
    preview(first, preview_name)


def process_generic(f):
    im = Image.open(f).convert("RGBA")
    r = rel(f)
    if r.startswith("level/") and "_layer" in f.name:
        im = im.resize(CANVAS, Image.LANCZOS)
    else:
        if f.parent.name == "assets" and f.name.lower() in FULLSCREEN:
            # Canvas ganz fuellen: so skalieren, dass beide Seiten reichen, Rest mittig abschneiden
            s = max(CANVAS[0] / im.width, CANVAS[1] / im.height)
            im = im.resize((max(CANVAS[0], round(im.width * s)), max(CANVAS[1], round(im.height * s))), Image.LANCZOS)
            left = (im.width - CANVAS[0]) // 2
            top = (im.height - CANVAS[1]) // 2
            im = im.crop((left, top, left + CANVAS[0], top + CANVAS[1]))
        else:
            m = next((v for k, v in MAX_SIDE_RULES if k in r), DEFAULT_MAX)
            s = min(m / max(im.size), 1)
            im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
    save(im, DST / f.relative_to(SRC).with_suffix(".webp"))


def preview(cells, filename):
    """Erstes Bild jeder Animation nebeneinander, Fusslinie rot."""
    names = sorted(cells)
    w = max(c.width for c in cells.values())
    h = max(c.height for c in cells.values())
    sheet = Image.new("RGBA", ((w + 12) * len(names) + 12, h + 30), (200, 200, 200, 255))
    d = ImageDraw.Draw(sheet)
    base = h - FEET_MARGIN
    d.line([(0, base), (sheet.width, base)], fill=(255, 0, 0, 255))
    for i, n in enumerate(names):
        x = 12 + i * (w + 12)
        sheet.alpha_composite(cells[n], (x, h - cells[n].height))
        d.text((x, h + 8), n.replace("player_", ""), fill=(0, 0, 0, 255))
    sheet.convert("RGB").save(DST / filename)


def main():
    if not SRC.is_dir():
        sys.exit(f"Ordner nicht gefunden: {SRC}")
    pngs = sorted(p for p in SRC.rglob("*.png"))
    player = [p for p in pngs if rel(p).startswith("character/player/") and "/projectile/" not in rel(p)]
    bosses = {}
    for p in pngs:
        m = BOSS_RE.match(rel(p))
        if m:
            bosses.setdefault(m.group(1), []).append(p)
    special = set(player) | {p for v in bosses.values() for p in v}

    if player:
        process_character(
            player, PLAYER_CANVAS_H,
            lambda f: PLAYER_MULT.get(f.parent.name, 1.0) * FRAME_MULT.get(f.stem, 1.0),
            "Spieler", "_preview_player.png")
    for lvl, files in sorted(bosses.items()):
        process_character(
            files, BOSS_CANVAS_H,
            lambda f, lvl=lvl: BOSS_MULT.get(lvl, {}).get(f.parent.name, 1.0) * FRAME_MULT.get(f.stem, 1.0),
            f"Boss {lvl}", f"_preview_boss_{lvl}.png")

    for p in pngs:
        if p not in special:
            process_generic(p)

    # Nicht-PNG-Dateien (z. B. favicon.ico) unveraendert uebernehmen
    for p in SRC.rglob("*"):
        if p.is_file() and p.suffix.lower() != ".png":
            t = DST / p.relative_to(SRC)
            t.parent.mkdir(parents=True, exist_ok=True)
            t.write_bytes(p.read_bytes())

    before = sum(p.stat().st_size for p in pngs)
    after = sum(p.stat().st_size for p in DST.rglob("*.webp"))
    print(f"{len(pngs)} Bilder: {before/1e6:.0f} MB -> {after/1e6:.1f} MB")


if __name__ == "__main__":
    main()
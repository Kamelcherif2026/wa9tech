"""Génère le logo WA9TECH en SVG (texte vectorisé : aucune police requise à l'affichage).

Usage : pip install fonttools uharfbuzz cairosvg pillow
        python scripts/marque/generer.py   (polices dans scripts/marque/polices/)
"""
import io, math, os

# Polices libres (OFL) : Rubik et Noto Kufi Arabic, depuis github.com/google/fonts
POLICES = os.environ.get("POLICES", os.path.join(os.path.dirname(__file__), "polices"))
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
import uharfbuzz as hb

ENCRE = "#1A1A1A"; TERRA = "#B5452B"; BLEU = "#1E5AA8"; SAFRAN = "#F2A900"; BLANC = "#FFFFFF"

def police(chemin, axes):
    f = TTFont(chemin); instantiateVariableFont(f, axes, inplace=True)
    buf = io.BytesIO(); f.save(buf); data = buf.getvalue()
    return TTFont(io.BytesIO(data)), data

def texte_en_chemin(font, data, texte, taille, x0, y0, espacement=0, direction="ltr"):
    """Renvoie (d, largeur) : contour SVG du texte, ligne de base en y0."""
    upm = font["head"].unitsPerEm; s = taille / upm
    face = hb.Face(data); hbf = hb.Font(face)
    b = hb.Buffer(); b.add_str(texte); b.guess_segment_properties()
    if direction == "rtl": b.direction = "rtl"
    hb.shape(hbf, b, {"kern": True, "liga": True})
    gs = font.getGlyphSet(); noms = font.getGlyphOrder()
    pen = SVGPathPen(gs); x = 0
    for info, pos in zip(b.glyph_infos, b.glyph_positions):
        nom = noms[info.codepoint]
        tp = TransformPen(pen, (s, 0, 0, -s, x0 + (x + pos.x_offset) * s, y0 - pos.y_offset * s))
        gs[nom].draw(tp); x += pos.x_advance + espacement
    return pen.getCommands(), (x - espacement) * s

def hauteur_capitale(font, taille):
    return font["OS/2"].sCapHeight * taille / font["head"].unitsPerEm

def neuf(cx, cy, R, ep, couleur, fond, base):
    """Le « 9 » : anneau-horloge + queue en point d'interrogation + point sous la ligne de base."""
    rc = R - ep / 2                                         # rayon de la ligne médiane de l'anneau
    th = math.radians(42)                                   # départ de la queue : bas-droite de l'anneau
    sx, sy = cx + rc * math.cos(th), cy + rc * math.sin(th)
    qx = cx - R * 0.18                                      # axe du bas de la queue (légèrement à gauche)
    coude = base - ep * 0.35                                # fin de la diagonale
    fy = base + ep * 0.45                                   # bout de la queue, sous la ligne de base
    queue = (f'<path d="M{sx:.1f},{sy:.1f} L{qx + ep*0.15:.1f},{coude - ep*0.35:.1f} Q{qx:.1f},{coude:.1f} {qx:.1f},{coude + ep*0.4:.1f} L{qx:.1f},{fy:.1f}" '
             f'fill="none" stroke="{couleur}" stroke-width="{ep:.1f}" stroke-linecap="round" stroke-linejoin="round"/>')
    point = f'<circle cx="{qx:.1f}" cy="{fy + ep*1.55:.1f}" r="{ep*0.72:.1f}" fill="{couleur}"/>'
    anneau = f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{rc:.1f}" fill="{fond}" stroke="{couleur}" stroke-width="{ep:.1f}"/>'
    ri = R - ep
    tr = ri * 0.70; tl = ri * 0.17; tw = ep * 0.17
    grad = "".join(
        f'<line x1="{cx + math.cos(t)*tr:.1f}" y1="{cy + math.sin(t)*tr:.1f}" x2="{cx + math.cos(t)*(tr+tl):.1f}" y2="{cy + math.sin(t)*(tr+tl):.1f}" '
        f'stroke="{couleur}" stroke-width="{tw:.1f}" stroke-linecap="round"/>'
        for t in (0, math.pi/2, math.pi, 3*math.pi/2))
    hw = ep * 0.27
    h1 = (cx - ri*0.36, cy - ri*0.30); h2 = (cx + ri*0.52, cy - ri*0.40)
    aiguilles = (f'<polyline points="{h1[0]:.1f},{h1[1]:.1f} {cx:.1f},{cy:.1f} {h2[0]:.1f},{h2[1]:.1f}" fill="none" stroke="{couleur}" '
                 f'stroke-width="{hw:.1f}" stroke-linecap="round" stroke-linejoin="round"/>'
                 f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{hw*0.8:.1f}" fill="{couleur}"/>')
    return queue + anneau + grad + aiguilles + point

def logotype(encre=ENCRE, accent=TERRA, fond=BLANC, arabe=False, transparent=True):
    rub, rdata = police(POLICES + "/Rubik.ttf", {"wght": 800})
    T = 200; base = 260; x = 40
    H = hauteur_capitale(rub, T)
    d1, l1 = texte_en_chemin(rub, rdata, "WA", T, x, base, espacement=10)
    ep = H * 0.20; R = H * 0.47
    cx = x + l1 + R + 8; cy = base - H * 0.74
    d2x = cx + R + 8
    d2, l2 = texte_en_chemin(rub, rdata, "TECH", T, d2x, base, espacement=10)
    larg = d2x + l2 + 40
    haut = base + ep * (0.45 + 1.55 + 0.72) + 30
    contenu = f'<path d="{d1}" fill="{encre}"/>' + neuf(cx, cy, R, ep, accent, fond, base) + f'<path d="{d2}" fill="{encre}"/>'
    if arabe:
        kufi, kdata = police(POLICES + "/NotoKufiArabic.ttf", {"wght": 700})
        ta = 92
        da, la = texte_en_chemin(kufi, kdata, "وقتاش", ta, 0, 0, direction="rtl")
        ya = haut + 70
        contenu += f'<path transform="translate({(larg - la)/2:.1f},{ya:.1f})" d="{da}" fill="{accent}"/>'
        haut = ya + 45
    top = cy - R - 20
    vb = f"0 {top:.1f} {larg:.1f} {haut - top:.1f}"
    bg = "" if transparent else f'<rect x="0" y="{top:.1f}" width="{larg:.1f}" height="{haut-top:.1f}" fill="{fond}"/>'
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-label="WA9TECH">{bg}{contenu}</svg>'

def symbole(bleu=BLEU, accent=TERRA, fond=BLANC, details=True):
    """Calendrier-porte de Sidi Bou Saïd, simplifié. Cadre 512×512."""
    s = []
    # Corps du calendrier
    s.append(f'<rect x="76" y="96" width="360" height="380" rx="48" fill="{bleu}"/>')
    # Anneaux
    for xa in (166, 346):
        s.append(f'<rect x="{xa-22}" y="52" width="44" height="96" rx="22" fill="{bleu}" stroke="{fond}" stroke-width="14"/>')
    # Arche (bande blanche) + porte
    s.append(f'<path d="M136,476 V266 A120,120 0 0 1 376,266 V476" fill="none" stroke="{fond}" stroke-width="22"/>')
    s.append(f'<path d="M166,476 V272 A90,90 0 0 1 346,272 V476 Z" fill="{bleu}"/>')
    s.append(f'<line x1="256" y1="186" x2="256" y2="476" stroke="{fond}" stroke-width="6"/>')
    # Clous = jours (3 colonnes × 4 rangées de chaque côté), le clou « aujourd'hui » en terracotta
    cols = (196, 226, 286, 316) if details else (206, 306)
    rangs = (266, 312, 358, 404) if details else (290, 380)
    r = 9 if details else 16
    for i, yy in enumerate(rangs):
        for j, xx in enumerate(cols):
            aujourdhui = (i == 1 and j == len(cols) - 2)
            c = accent if aujourdhui else fond
            rr = r * 1.7 if aujourdhui else r
            s.append(f'<circle cx="{xx}" cy="{yy}" r="{rr}" fill="{c}"/>')
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="40 30 432 470" role="img" aria-label="WA9TECH">{"".join(s)}</svg>'

def icone_app(fond_icone=BLEU, details=True):
    """Icône carrée (app, réseaux sociaux) : porte blanche sur fond bleu."""
    inner = symbole(bleu=BLANC, accent=TERRA, fond=fond_icone, details=details)
    inner = inner.split(">", 1)[1].rsplit("</svg>", 1)[0]
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="WA9TECH">'
            f'<rect width="512" height="512" rx="112" fill="{fond_icone}"/>'
            f'<g transform="translate(256 262) scale(0.92) translate(-256 -264)">{inner}</g></svg>')

if __name__ == "__main__":
    import os, cairosvg
    out = os.path.join(os.path.dirname(__file__), "../../docs/marque"); os.makedirs(out, exist_ok=True)
    fichiers = {
        "logo-wa9tech.svg": logotype(),
        "logo-wa9tech-negatif.svg": logotype(encre=BLANC, accent="#E07A5F", fond=ENCRE),
        "logo-wa9tech-bilingue.svg": logotype(arabe=True),
        "symbole-wa9tech.svg": symbole(),
        "symbole-wa9tech-simple.svg": symbole(details=False),
        "icone-app-wa9tech.svg": icone_app(),
        "favicon-wa9tech.svg": icone_app(details=False),
    }
    for nom, svg in fichiers.items():
        open(f"{out}/{nom}", "w").write(svg)
    # Aperçus PNG
    for nom in fichiers:
        fond = "#1A1A1A" if "negatif" in nom else "#FFFFFF"
        cairosvg.svg2png(url=f"{out}/{nom}", write_to=f"{out}/{nom[:-4]}.png", output_width=1200 if "logo" in nom else 512, background_color=fond)
    # Favicons et icônes d'application
    for t in (16, 32, 48, 180, 192, 512):
        source = "favicon-wa9tech.svg" if t <= 48 else "icone-app-wa9tech.svg"
        cairosvg.svg2png(url=f"{out}/{source}", write_to=f"{out}/icone-{t}.png", output_width=t, output_height=t)
    print("ok")

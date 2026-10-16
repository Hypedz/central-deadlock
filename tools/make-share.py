# -*- coding: utf-8 -*-
"""
Gera a imagem de compartilhamento (assets/brand/share.jpg), usada quando
alguem cola o link do site no Discord, WhatsApp, X, etc.

Como usar:
    python tools/make-share.py
"""

import os

from PIL import Image, ImageDraw, ImageFilter, ImageFont

LARGURA, ALTURA = 1200, 630
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIGEM = os.path.join(BASE, "assets", "brand", "library_hero.jpg")
DESTINO = os.path.join(BASE, "assets", "brand", "share.jpg")

LIMA = (182, 242, 74)
BRANCO = (242, 242, 245)
CINZA = (154, 154, 166)

FONTES = [
    r"C:\Windows\Fonts\seguisb.ttf", r"C:\Windows\Fonts\segoeuib.ttf",
    r"C:\Windows\Fonts\arialbd.ttf", r"C:\Windows\Fonts\verdana.ttf",
]
FONTES_TXT = [
    r"C:\Windows\Fonts\segoeui.ttf", r"C:\Windows\Fonts\arial.ttf",
    r"C:\Windows\Fonts\verdana.ttf",
]


def fonte(caminhos, tamanho):
    for c in caminhos:
        if os.path.exists(c):
            try:
                return ImageFont.truetype(c, tamanho)
            except Exception:
                continue
    return ImageFont.load_default()


def capa(img, largura, altura):
    """Recorta a imagem para cobrir exatamente largura x altura (igual ao CSS)."""
    largura_orig, altura_orig = img.size
    escala = max(largura / largura_orig, altura / altura_orig)
    nova = (max(1, int(largura_orig * escala)), max(1, int(altura_orig * escala)))
    img = img.resize(nova, Image.LANCZOS)
    esq = (img.width - largura) // 2
    topo = int((img.height - altura) * 0.35)
    return img.crop((esq, topo, esq + largura, topo + altura))


def main():
    if not os.path.exists(ORIGEM):
        print("ERRO: nao encontrei", ORIGEM)
        return 1

    base = capa(Image.open(ORIGEM).convert("RGB"), LARGURA, ALTURA).convert("RGBA")

    # escurece a imagem e cria um degrade escuro da esquerda para a direita
    escuro = Image.new("RGBA", (LARGURA, ALTURA), (12, 12, 14, 120))
    base = Image.alpha_composite(base, escuro)
    degrade = Image.new("L", (LARGURA, 1))
    for x in range(LARGURA):
        p = x / LARGURA
        valor = int(245 * max(0.0, min(1.0, 1.35 - p * 1.75)))
        degrade.putpixel((x, 0), valor)
    mascara = degrade.resize((LARGURA, ALTURA))
    base = Image.alpha_composite(base, Image.merge("RGBA", (
        Image.new("L", (LARGURA, ALTURA), 12),
        Image.new("L", (LARGURA, ALTURA), 12),
        Image.new("L", (LARGURA, ALTURA), 14),
        mascara,
    )))

    d = ImageDraw.Draw(base)

    # barrinha verde-limao
    d.rounded_rectangle([70, 150, 100, 168], radius=9, fill=LIMA)

    f_titulo = fonte(FONTES, 76)
    f_sub = fonte(FONTES_TXT, 30)
    f_pe = fonte(FONTES, 22)

    d.text((70, 190), "CENTRAL", font=f_titulo, fill=BRANCO)
    d.text((70, 268), "DEADLOCK", font=f_titulo, fill=LIMA)
    d.text((72, 366), "Noticias, guias, itens e todos os herois do jogo.", font=f_sub, fill=BRANCO)
    d.text((72, 406), "Feito pela comunidade brasileira de Deadlock.", font=f_sub, fill=CINZA)
    d.text((72, 520), "STEAM  -  DEADLOCK  -  VALVE", font=f_pe, fill=LIMA)

    base.convert("RGB").save(DESTINO, "JPEG", quality=88, optimize=True)
    print("OK! Imagem gerada em assets/brand/share.jpg ({})".format(base.size))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

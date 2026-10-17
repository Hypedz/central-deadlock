# -*- coding: utf-8 -*-
"""
Gera os ícones do site (usados quando alguém "instala" o site no celular
ou no PC, e como ícone de atalho).

Desenha o emblema da Central Deadlock: octógono verde-limão com o
monograma CD no meio, no fundo escuro da marca.

Como usar:
    python tools/make-icons.py

Precisa da biblioteca Pillow (pip install pillow).
"""

import os
import sys

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("ERRO: falta a biblioteca Pillow. Rode:  pip install pillow")
    sys.exit(1)

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PASTA = os.path.join(BASE, "assets", "brand")

FUNDO = (12, 12, 14, 255)          # #0c0c0e
LIMA = (182, 242, 74, 255)         # #b6f24a
LIMA_ESCURO = (47, 122, 26, 255)   # #2f7a1a
TINTA = (12, 12, 14, 255)

# fontes comuns no Windows / Linux (a primeira que existir é usada)
FONTES = [
    r"C:\Windows\Fonts\segoeuib.ttf",
    r"C:\Windows\Fonts\arialbd.ttf",
    r"C:\Windows\Fonts\ARLRDBD.TTF",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
]


def achar_fonte(tamanho):
    for caminho in FONTES:
        if os.path.exists(caminho):
            try:
                return ImageFont.truetype(caminho, tamanho)
            except Exception:
                continue
    return None


def octogono(lado, margem):
    """Pontos de um octógono (o formato do emblema)."""
    a, b = margem, lado - margem
    c = margem + (b - a) * 0.29   # quanto o canto é "cortado"
    return [(a + c, a), (b - c, a), (b, a + c), (b, b - c),
            (b - c, b), (a + c, b), (a, b - c), (a, a + c)]


def desenhar(tamanho, escala=0.86, arquivo="icone.png"):
    img = Image.new("RGBA", (tamanho, tamanho), FUNDO)

    # octógono principal, com um degradê simples de cima para baixo
    margem = int(tamanho * (1 - escala) / 2)
    mascara = Image.new("L", (tamanho, tamanho), 0)
    ImageDraw.Draw(mascara).polygon(octogono(tamanho, margem), fill=255)

    degrade = Image.new("RGBA", (tamanho, tamanho))
    pincel = ImageDraw.Draw(degrade)
    y0, y1 = margem, tamanho - margem
    for y in range(tamanho):
        t = min(1.0, max(0.0, (y - y0) / max(1, y1 - y0)))
        cor = tuple(int(LIMA[i] + (LIMA_ESCURO[i] - LIMA[i]) * t) for i in range(3)) + (255,)
        pincel.line([(0, y), (tamanho, y)], fill=cor)
    img.paste(degrade, (0, 0), mascara)

    desenho = ImageDraw.Draw(img)

    # aro interno escuro (dá o ar de emblema)
    aro = int(tamanho * 0.055)
    desenho.line(octogono(tamanho, margem + int(tamanho * 0.075)) + [octogono(tamanho, margem + int(tamanho * 0.075))[0]],
                 fill=(12, 12, 14, 90), width=max(2, aro // 3), joint="curve")

    # monograma CD
    fonte = achar_fonte(int(tamanho * 0.40))
    if fonte:
        texto = "CD"
        caixa = desenho.textbbox((0, 0), texto, font=fonte)
        x = (tamanho - (caixa[2] - caixa[0])) / 2 - caixa[0]
        y = (tamanho - (caixa[3] - caixa[1])) / 2 - caixa[1]
        desenho.text((x, y), texto, font=fonte, fill=TINTA)
    else:
        # sem fonte: desenha um losango (nunca fica sem ícone)
        m = tamanho * 0.32
        desenho.polygon([(tamanho / 2, m), (tamanho - m, tamanho / 2),
                         (tamanho / 2, tamanho - m), (m, tamanho / 2)], fill=TINTA)

    destino = os.path.join(PASTA, arquivo)
    os.makedirs(PASTA, exist_ok=True)
    img.save(destino, "PNG", optimize=True)
    print("   {}  ({}x{})".format(arquivo, tamanho, tamanho))


def main():
    print("Gerando os icones do site ...")
    desenhar(192, 0.86, "icon-192.png")
    desenhar(512, 0.86, "icon-512.png")
    # maskable: o emblema menor, para o Android poder recortar em círculo
    desenhar(512, 0.60, "icon-maskable-512.png")
    print("OK! Icones salvos em assets/brand/")
    return 0


if __name__ == "__main__":
    sys.exit(main())

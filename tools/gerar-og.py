# -*- coding: utf-8 -*-
"""
Gera os cartões sociais (imagem 1200x630) usados no og:image e no Twitter.

Saída:
    assets/og/heroi-<slug>.jpg
    assets/og/noticia-<id>.jpg
    assets/og/guia-iniciante.jpg
    assets/og/item.jpg
    assets/og/counter.jpg

Como usar:
    python tools/gerar-og.py

Os textos saem dos mesmos arquivos data/*.js do site. As fontes Poppins
estão em assets/fonts (licença OFL), então o desenho fica igual no Windows
e no robô do GitHub (Linux).
"""

import json
import os
import re
import unicodedata

from PIL import Image, ImageDraw, ImageFont

LARGURA, ALTURA = 1200, 630
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAIDA = os.path.join(BASE, "assets", "og")

LIMA = (182, 242, 74)
BRANCO = (242, 242, 245)
CINZA = (166, 166, 178)
FUNDO = (12, 12, 14)

FONTE_TITULO = os.path.join(BASE, "assets", "fonts", "Poppins-Bold.ttf")
FONTE_TEXTO = os.path.join(BASE, "assets", "fonts", "Poppins-Regular.ttf")

FONTES_TITULO_SISTEMA = [
    r"C:\Windows\Fonts\seguisb.ttf", r"C:\Windows\Fonts\segoeuib.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
]
FONTES_TEXTO_SISTEMA = [
    r"C:\Windows\Fonts\segoeui.ttf", r"C:\Windows\Fonts\arial.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
]


def ler_js(nome_arquivo):
    caminho = os.path.join(BASE, nome_arquivo)
    if not os.path.exists(caminho):
        return {}
    with open(caminho, encoding="utf-8") as arquivo:
        texto = arquivo.read()
    try:
        return json.loads(texto[texto.index("{"):texto.rindex("}") + 1])
    except Exception:
        return {}


def ler_herois():
    caminho = os.path.join(BASE, "heroes-data.js")
    with open(caminho, encoding="utf-8") as arquivo:
        texto = arquivo.read()
    ini = texto.index("const HEROES_DATA = ")
    return json.loads(texto[texto.index("[", ini):texto.rindex("]") + 1])


def slug(texto):
    texto = unicodedata.normalize("NFKD", str(texto)).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-zA-Z0-9]+", "-", texto).strip("-").lower() or "pagina"


def fonte(caminho_preferido, caminhos_sistema, tamanho):
    for caminho in [caminho_preferido] + caminhos_sistema:
        if caminho and os.path.exists(caminho):
            try:
                return ImageFont.truetype(caminho, tamanho)
            except Exception:
                continue
    return ImageFont.load_default()


def moeda(valor):
    try:
        return "{:,}".format(int(valor)).replace(",", ".")
    except Exception:
        return str(valor or "")


def capa(img, largura=LARGURA, altura=ALTURA, foco=0.35):
    """Recorta a imagem para cobrir exatamente largura x altura."""
    largura_orig, altura_orig = img.size
    escala = max(largura / largura_orig, altura / altura_orig)
    nova = (max(1, int(largura_orig * escala)), max(1, int(altura_orig * escala)))
    img = img.resize(nova, Image.LANCZOS)
    esq = (img.width - largura) // 2
    topo = int((img.height - altura) * foco)
    return img.crop((esq, topo, esq + largura, topo + altura))


def aplicar_fundo_escuro(base, forca=128):
    """Escurece a arte e cria um degradê escuro da esquerda para a direita."""
    base = base.convert("RGBA")
    base = Image.alpha_composite(base, Image.new("RGBA", (LARGURA, ALTURA), (10, 10, 12, forca)))

    degrade = Image.new("L", (LARGURA, 1))
    for x in range(LARGURA):
        p = x / LARGURA
        valor = int(250 * max(0.0, min(1.0, 1.45 - p * 1.85)))
        degrade.putpixel((x, 0), valor)
    mascara = degrade.resize((LARGURA, ALTURA))
    return Image.alpha_composite(base, Image.merge("RGBA", (
        Image.new("L", (LARGURA, ALTURA), 10),
        Image.new("L", (LARGURA, ALTURA), 10),
        Image.new("L", (LARGURA, ALTURA), 13),
        mascara,
    )))


def quebrar_texto(desenho, texto, font, largura_max):
    palavras = str(texto or "").split()
    linhas = []
    atual = ""
    for palavra in palavras:
        teste = (atual + " " + palavra).strip()
        if not atual or desenho.textlength(teste, font=font) <= largura_max:
            atual = teste
        else:
            linhas.append(atual)
            atual = palavra
    if atual:
        linhas.append(atual)
    return linhas or [""]


def desenhar_linhas(desenho, linhas, x, y, font, preenchimento, altura_linha):
    for i, linha in enumerate(linhas):
        desenho.text((x, y + i * altura_linha), linha, font=font, fill=preenchimento)


def marca(desenho):
    """Marca tipográfica no canto: CENTRAL branco + DEADLOCK lima."""
    f = fonte(FONTE_TITULO, FONTES_TITULO_SISTEMA, 26)
    x, y = 64, 40
    desenho.text((x, y), "CENTRAL", font=f, fill=BRANCO)
    largura = desenho.textlength("CENTRAL", font=f)
    desenho.text((x + largura + 10, y), "DEADLOCK", font=f, fill=LIMA)


def rodape_cartao(desenho, texto="Dados reais de partidas · deadlock-api.com"):
    f = fonte(FONTE_TEXTO, FONTES_TEXTO_SISTEMA, 20)
    desenho.text((64, 566), texto, font=f, fill=CINZA)
    f2 = fonte(FONTE_TITULO, FONTES_TITULO_SISTEMA, 18)
    desenho.text((64, 538), "CENTRAL DEADLOCK", font=f2, fill=LIMA)


def cartao_heroi(heroi, stats):
    nome = heroi["name"]
    apelido = slug(nome)
    caminho_capa = os.path.join(BASE, "assets", "capas", apelido + ".webp")

    if os.path.exists(caminho_capa):
        base = capa(Image.open(caminho_capa).convert("RGB"))
    else:
        base = capa(Image.open(os.path.join(BASE, "assets", "brand", "library_hero.jpg")).convert("RGB"))
        caminho_heroi = os.path.join(BASE, "assets", "heroes", str(heroi.get("file") or ""))
        if os.path.exists(caminho_heroi):
            retrato = Image.open(caminho_heroi).convert("RGBA")
            altura = 560
            escala = altura / retrato.height
            retrato = retrato.resize((max(1, int(retrato.width * escala)), altura), Image.LANCZOS)
            base = base.convert("RGBA")
            base.alpha_composite(retrato, (LARGURA - retrato.width - 30, ALTURA - altura - 10))

    base = aplicar_fundo_escuro(base, 118)
    desenho = ImageDraw.Draw(base)
    marca(desenho)

    papel = (heroi.get("role") or "Herói").upper()
    f_kicker = fonte(FONTE_TITULO, FONTES_TITULO_SISTEMA, 24)
    desenho.rounded_rectangle([64, 148, 94, 156], radius=4, fill=LIMA)
    desenho.text((64, 172), "HERÓI  ·  " + papel, font=f_kicker, fill=LIMA)

    titulo = nome
    tamanho = 92 if len(titulo) <= 18 else 78
    f_titulo = fonte(FONTE_TITULO, FONTES_TITULO_SISTEMA, tamanho)
    linhas = quebrar_texto(desenho, titulo, f_titulo, 940)
    if len(linhas) > 2:
        tamanho = 68
        f_titulo = fonte(FONTE_TITULO, FONTES_TITULO_SISTEMA, tamanho)
        linhas = quebrar_texto(desenho, titulo, f_titulo, 940)
    altura_linha = int(f_titulo.size * 1.08)
    desenhar_linhas(desenho, linhas, 64, 210, f_titulo, BRANCO, altura_linha)

    partes = []
    if stats.get("win") is not None:
        partes.append("{}% de vitórias".format(stats.get("win")))
    if stats.get("tier"):
        partes.append("Tier {}".format(stats.get("tier")))
    if stats.get("partidas") is not None:
        partes.append("{} partidas".format(moeda(stats.get("partidas"))))
    f_stats = fonte(FONTE_TEXTO, FONTES_TEXTO_SISTEMA, 28)
    y_stats = 210 + len(linhas) * altura_linha + 20
    desenho.text((64, y_stats), "  ·  ".join(partes) or "Guia completo no site", font=f_stats, fill=BRANCO)

    rodape_cartao(desenho)
    return base.convert("RGB")


def cartao_noticia(noticia):
    base = capa(Image.open(os.path.join(BASE, "assets", "brand", "library_hero.jpg")).convert("RGB"))
    base = aplicar_fundo_escuro(base, 142)
    desenho = ImageDraw.Draw(base)
    marca(desenho)

    categoria = (noticia.get("cat") or "Steam").upper()
    f_kicker = fonte(FONTE_TITULO, FONTES_TITULO_SISTEMA, 24)
    desenho.rounded_rectangle([64, 148, 94, 156], radius=4, fill=LIMA)
    desenho.text((64, 172), "NOTÍCIA  ·  " + categoria, font=f_kicker, fill=LIMA)

    titulo = noticia.get("title_pt") or noticia.get("title") or "Notícia"
    f_titulo = fonte(FONTE_TITULO, FONTES_TITULO_SISTEMA, 62)
    linhas = quebrar_texto(desenho, titulo, f_titulo, 1030)
    if len(linhas) > 3:
        f_titulo = fonte(FONTE_TITULO, FONTES_TITULO_SISTEMA, 50)
        linhas = quebrar_texto(desenho, titulo, f_titulo, 1030)
    desenhar_linhas(desenho, linhas[:3], 64, 210, f_titulo, BRANCO, int(f_titulo.size * 1.18))

    f_data = fonte(FONTE_TEXTO, FONTES_TEXTO_SISTEMA, 24)
    data = noticia.get("date") or ""
    desenho.text((64, 470), data + ("  ·  Central Deadlock" if data else "Central Deadlock"), font=f_data, fill=CINZA)
    rodape_cartao(desenho)
    return base.convert("RGB")


def cartao_generico(kicker, titulo, subtitulo):
    base = capa(Image.open(os.path.join(BASE, "assets", "brand", "library_hero.jpg")).convert("RGB"))
    base = aplicar_fundo_escuro(base, 136)
    desenho = ImageDraw.Draw(base)
    marca(desenho)

    f_kicker = fonte(FONTE_TITULO, FONTES_TITULO_SISTEMA, 24)
    desenho.rounded_rectangle([64, 148, 94, 156], radius=4, fill=LIMA)
    desenho.text((64, 172), kicker, font=f_kicker, fill=LIMA)

    f_titulo = fonte(FONTE_TITULO, FONTES_TITULO_SISTEMA, 88)
    linhas = quebrar_texto(desenho, titulo, f_titulo, 1000)
    desenhar_linhas(desenho, linhas, 64, 218, f_titulo, BRANCO, 100)

    f_sub = fonte(FONTE_TEXTO, FONTES_TEXTO_SISTEMA, 28)
    y_sub = min(470, 218 + len(linhas) * 100 + 18)
    desenho.text((64, y_sub), subtitulo, font=f_sub, fill=BRANCO)
    rodape_cartao(desenho)
    return base.convert("RGB")


def salvar(imagem, nome):
    os.makedirs(SAIDA, exist_ok=True)
    caminho = os.path.join(SAIDA, nome)
    imagem.convert("RGB").save(caminho, "JPEG", quality=86, optimize=True)
    return caminho


def main():
    try:
        herois = ler_herois()
    except Exception as erro:
        print("ERRO: nao consegui ler heroes-data.js: {}".format(erro))
        return 1

    stats = (ler_js("data/hero-stats.js").get("herois") or {})
    noticias = (ler_js("data/steam-news.js").get("items") or [])

    gerados = []
    for heroi in herois:
        if heroi.get("soon"):
            continue
        nome = heroi.get("name")
        if not nome:
            continue
        imagem = cartao_heroi(heroi, stats.get(nome) or {})
        gerados.append(salvar(imagem, "heroi-{}.jpg".format(slug(nome))))

    for noticia in noticias:
        ident = noticia.get("id")
        if not ident:
            continue
        imagem = cartao_noticia(noticia)
        gerados.append(salvar(imagem, "noticia-{}.jpg".format(ident)))

    gerados.append(salvar(
        cartao_generico("GUIA PARA INICIANTES", "Começando no Deadlock",
                        "O básico para a sua primeira partida"),
        "guia-iniciante.jpg"))
    gerados.append(salvar(
        cartao_generico("ITENS DO JOGO", "Itens de Deadlock",
                        "Preço, efeito e win rate real"),
        "item.jpg"))
    gerados.append(salvar(
        cartao_generico("COUNTERS", "Counters de Deadlock",
                        "Quem ganha de quem, com números reais"),
        "counter.jpg"))

    # remove cartões de heróis/notícias que saíram da lista
    atuais = {os.path.basename(caminho) for caminho in gerados}
    for nome_arquivo in os.listdir(SAIDA):
        if not nome_arquivo.endswith(".jpg"):
            continue
        if (nome_arquivo.startswith("heroi-") or nome_arquivo.startswith("noticia-")) and nome_arquivo not in atuais:
            os.remove(os.path.join(SAIDA, nome_arquivo))

    print("OK! {} cartoes sociais gerados em assets/og".format(len(gerados)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

# -*- coding: utf-8 -*-
"""
Baixa as IMAGENS dos heróis e MONTA o banner das páginas dos heróis.

O que ele salva:

    assets/heroes/<Nome>.webp       carta do herói (280x380) - usada no site todo
                                    (o WebP pesa ~85% menos que o PNG antigo)
    assets/capas/<nome>.webp        BANNER PRONTO (1920x600): a arte de fundo do
                                    jogo com o personagem recortado por cima
    assets/nomes/<nome>.svg         o nome do herói desenhado (letreiro)
    assets/habilidades/<arq>.webp   ícone de cada habilidade

De onde vêm:
  - carta, arte de fundo, letreiro e ícones: deadlock-api.com (dados do jogo)
  - personagem recortado: cdn.deadlock.wiki (<Nome>_Render.png)

Como usar:

    python tools/baixar-artes.py            baixa o que falta (usa nos robôs)
    python tools/baixar-artes.py --forcar   monta os banners de novo do zero

Ele só baixa o que mudou. Nada aqui é editado à mão.
"""

import io
import json
import os
import re
import sys
import unicodedata
import urllib.parse
import urllib.request

API_HEROIS = "https://api.deadlock-api.com/v1/assets/heroes"
API_ITENS = "https://api.deadlock-api.com/v1/assets/items"
WIKI_RENDER = "https://cdn.deadlock.wiki/{}_Render.png"

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PASTA_ARTES = os.path.join(BASE, "assets", "heroes")
PASTA_CAPAS = os.path.join(BASE, "assets", "capas")
PASTA_NOMES = os.path.join(BASE, "assets", "nomes")
PASTA_HABS = os.path.join(BASE, "assets", "habilidades")
ARQUIVO_HEROIS = os.path.join(BASE, "heroes-data.js")

# ---- como o banner é montado (mexa aqui se quiser mudar o visual) ----
LARGURA_BANNER = 1920        # largura da imagem do banner
ALTURA_BANNER = 600          # altura da imagem do banner
QUALIDADE_BANNER = 80        # 0 a 100 (maior = mais nítido e mais pesado)
QUALIDADE_CARTA = 82         # 0 a 100 (a carta do herói vira .webp com esta qualidade)
FUNDO_COR = (9, 11, 14)      # a cor escura de trás (a mesma do site)
ARTE_LARGURA = 0.36          # quanto da largura o desenho de fundo ocupa
ARTE_POSICAO = 0.36          # onde ele começa (0 = na esquerda, 1 = na direita)
PERSONAGEM_ALTURA = 1.20     # altura do personagem (1,2 = 20% maior que o banner)
PERSONAGEM_MARGEM = 0.01     # folga entre o personagem e a borda direita

CABECALHO = {"User-Agent": "CentralDeadlock/1.0 (site de fas)"}

try:
    from PIL import Image
    TEM_PIL = True
except Exception:
    TEM_PIL = False


def baixar(url, timeout=120):
    pedido = urllib.request.Request(url, headers=CABECALHO)
    with urllib.request.urlopen(pedido, timeout=timeout) as resposta:
        return resposta.read()


def pegar_json(url):
    return json.loads(baixar(url, timeout=60).decode("utf-8"))


def slug(texto):
    """'Lady Geist' -> 'lady-geist' (o mesmo nome de arquivo que as páginas usam)."""
    texto = unicodedata.normalize("NFKD", str(texto)).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-zA-Z0-9]+", "-", texto).strip("-").lower() or "pagina"


def ler_herois():
    with open(ARQUIVO_HEROIS, encoding="utf-8") as arquivo:
        texto = arquivo.read()
    inicio = texto.index("const HEROES_DATA = ")
    return json.loads(texto[texto.index("[", inicio):texto.rindex("]") + 1])


def salvar(caminho, dados):
    """Grava só se o arquivo mudou (para não sujar o Git à toa)."""
    if os.path.exists(caminho):
        with open(caminho, "rb") as aberto:
            if aberto.read() == dados:
                return False
    os.makedirs(os.path.dirname(caminho), exist_ok=True)
    with open(caminho, "wb") as gravando:
        gravando.write(dados)
    return True


def preparar_carta(arquivo_atual, bytes_origem):
    """Devolve (nome do arquivo, bytes) da carta do herói.

    Com a biblioteca Pillow instalada a carta vira .webp (pesa ~85% menos que o
    PNG e o navegador mostra igual). Sem o Pillow, fica no formato original."""
    if not TEM_PIL:
        return arquivo_atual, bytes_origem
    raiz = os.path.splitext(arquivo_atual)[0]
    try:
        desenho = Image.open(io.BytesIO(bytes_origem)).convert("RGBA")
        saida = io.BytesIO()
        desenho.save(saida, "WEBP", quality=QUALIDADE_CARTA, method=6)
        return raiz + ".webp", saida.getvalue()
    except Exception as erro:
        print("   (aviso: nao consegui converter a carta para webp: {})".format(erro))
        return arquivo_atual, bytes_origem


def anotar_renomeacoes(trocas):
    """Atualiza o campo "file" dos heróis no heroes-data.js (ex.: Abrams.png -> Abrams.webp).

    Só mexe nos heróis que mudaram de nome de arquivo; o resto do arquivo fica igual."""
    if not trocas:
        return 0
    try:
        with open(ARQUIVO_HEROIS, encoding="utf-8") as arquivo:
            texto = arquivo.read()
    except Exception as erro:
        print("   (aviso: nao consegui abrir o heroes-data.js: {})".format(erro))
        return 0

    quantos = 0
    for nome, novo in trocas.items():
        padrao = re.compile(r'(\{\s*\r?\n\s*"name":\s*"' + re.escape(nome)
                            + r'",[\s\S]*?"file":\s*")[^"]*(")')
        texto, trocados = padrao.subn(lambda m: m.group(1) + novo + m.group(2), texto, count=1)
        quantos += trocados

    if quantos:
        with open(ARQUIVO_HEROIS, "w", encoding="utf-8", newline="") as arquivo:
            arquivo.write(texto)
    return quantos


def limpar_cartas_antigas(usados):
    """Apaga da pasta as cartas que ninguém mais usa (ex.: os .png antigos)."""
    if not os.path.isdir(PASTA_ARTES):
        return
    for nome in sorted(os.listdir(PASTA_ARTES)):
        if nome in usados:
            continue
        caminho = os.path.join(PASTA_ARTES, nome)
        if os.path.isfile(caminho):
            os.remove(caminho)
            print("   removido (nao usado mais): {}".format(nome))


def colar(lona, figura, x, y):
    """Cola 'figura' em cima de 'lona' na posição x, y (cortando o que sobrar)."""
    x, y = int(round(x)), int(round(y))
    recorte_x = max(0, -x)
    recorte_y = max(0, -y)
    x, y = max(0, x), max(0, y)
    largura = min(figura.width - recorte_x, lona.width - x)
    altura = min(figura.height - recorte_y, lona.height - y)
    if largura <= 0 or altura <= 0:
        return
    pedaco = figura.crop((recorte_x, recorte_y, recorte_x + largura, recorte_y + altura))
    lona.alpha_composite(pedaco, (x, y))


def aparar(imagem):
    """Tira a parte transparente que sobra em volta do desenho."""
    caixa = imagem.split()[3].getbbox()
    return imagem.crop(caixa) if caixa else imagem


def montar_banner(arte_bytes, personagem_bytes):
    """Junta a arte de fundo do jogo com o personagem recortado e devolve o webp."""
    lona = Image.new("RGBA", (LARGURA_BANNER, ALTURA_BANNER), FUNDO_COR + (255,))

    # 1) a arte de fundo (só a parte que tem desenho, no tamanho combinado)
    if arte_bytes:
        arte = aparar(Image.open(io.BytesIO(arte_bytes)).convert("RGBA"))
        largura = round(LARGURA_BANNER * ARTE_LARGURA)
        altura = max(1, round(arte.height * largura / arte.width))
        arte = arte.resize((largura, altura), Image.LANCZOS)
        colar(lona, arte, LARGURA_BANNER * ARTE_POSICAO, (ALTURA_BANNER - altura) / 2)

    # 2) o personagem, por cima, encostado na direita e cortado embaixo
    if personagem_bytes:
        figura = aparar(Image.open(io.BytesIO(personagem_bytes)).convert("RGBA"))
        altura = round(ALTURA_BANNER * PERSONAGEM_ALTURA)
        largura = max(1, round(figura.width * altura / figura.height))
        figura = figura.resize((largura, altura), Image.LANCZOS)
        colar(lona, figura, LARGURA_BANNER - largura - LARGURA_BANNER * PERSONAGEM_MARGEM,
              ALTURA_BANNER * 0.02)

    saida = io.BytesIO()
    lona.convert("RGB").save(saida, "WEBP", quality=QUALIDADE_BANNER, method=6)
    return saida.getvalue()


def main():
    forcar = "--forcar" in sys.argv or "--refazer" in sys.argv
    print("Baixando as imagens dos herois ...")
    if not TEM_PIL:
        print("   AVISO: a biblioteca Pillow nao esta instalada - os banners nao serao montados.")
        print("          Para instalar: pip install pillow")

    try:
        lista = pegar_json(API_HEROIS)
    except Exception as erro:
        print("ERRO: nao consegui falar com a deadlock-api.com: {}".format(erro))
        return 1

    # nome do heroi (minusculo) -> dados que interessam
    api = {}
    for h in lista:
        if not isinstance(h, dict):
            continue
        nome = str(h.get("name") or "").strip()
        if not nome:
            continue
        imagens = h.get("images") or {}
        api[nome.lower()] = {
            "id": h.get("id"),
            "carta": imagens.get("icon_hero_card") or imagens.get("icon_hero_card_webp"),
            "arte": imagens.get("background_image") or imagens.get("background_image_webp"),
            "nome": imagens.get("name_image"),
        }

    # icones das habilidades: cada habilidade diz de quais herois ela e
    try:
        habilidades = pegar_json(API_ITENS)
    except Exception as erro:
        print("   (aviso: nao consegui pegar os icones das habilidades: {})".format(erro))
        habilidades = []

    if not api:
        print("AVISO: a API nao devolveu a lista de herois. Nada foi alterado.")
        return 1

    herois = ler_herois()
    contas = {"carta": 0, "banner": 0, "nome": 0, "icone": 0}
    faltando, sem_personagem = [], []
    usados, trocas = set(), {}

    for heroi in herois:
        nome = str(heroi.get("name") or "").strip()
        arquivo = str(heroi.get("file") or "").strip()
        em_breve = bool(heroi.get("soon"))
        dados = api.get(nome.lower())
        if not arquivo or not dados:
            faltando.append(nome)
            if arquivo:
                usados.add(arquivo)   # nao apaga a arte de quem eu nao consegui conferir
            continue
        apelido = slug(nome)

        # 1) carta do heroi (usada no site todo)
        arquivo_final = arquivo
        if dados["carta"]:
            try:
                arquivo_final, bytes_carta = preparar_carta(arquivo, baixar(dados["carta"]))
                if salvar(os.path.join(PASTA_ARTES, arquivo_final), bytes_carta):
                    contas["carta"] += 1
                    print("   carta    {} -> {} ({:.0f} KB)".format(nome, arquivo_final, len(bytes_carta) / 1024))
            except Exception as erro:
                print("   (aviso: carta de {} falhou: {})".format(nome, erro))
        if arquivo_final != arquivo:
            trocas[nome] = arquivo_final
        usados.add(arquivo_final)

        # 2) banner da pagina do heroi (arte de fundo + personagem recortado)
        caminho_banner = os.path.join(PASTA_CAPAS, apelido + ".webp")
        if TEM_PIL and not em_breve and (forcar or not os.path.exists(caminho_banner)):
            try:
                arte = baixar(dados["arte"]) if dados["arte"] else b""
                personagem = b""
                try:
                    personagem = baixar(WIKI_RENDER.format(urllib.parse.quote(nome.replace(" ", "_"))))
                except Exception:
                    sem_personagem.append(nome)
                if not personagem:
                    # sem o personagem o banner fica feio: deixa para a proxima vez
                    print("   (aviso: nao achei o personagem de {} - banner nao feito)".format(nome))
                else:
                    banner = montar_banner(arte, personagem)
                    if salvar(caminho_banner, banner):
                        contas["banner"] += 1
                        print("   banner   {} -> {}.webp ({:.0f} KB)".format(nome, apelido, len(banner) / 1024))
            except Exception as erro:
                print("   (aviso: banner de {} falhou: {})".format(nome, erro))

        # 3) o nome do heroi desenhado (letreiro)
        if dados["nome"]:
            try:
                if salvar(os.path.join(PASTA_NOMES, apelido + ".svg"), baixar(dados["nome"])):
                    contas["nome"] += 1
                    print("   letreiro {} -> {}.svg".format(nome, apelido))
            except Exception as erro:
                print("   (aviso: letreiro de {} falhou: {})".format(nome, erro))

        # 4) icones das habilidades do heroi
        for it in habilidades:
            if not isinstance(it, dict) or str(it.get("type")).lower() != "ability":
                continue
            if it.get("heroes") != [dados["id"]]:
                continue
            if str(it.get("name") or "").strip().lower() == "melee":
                continue                    # "Melee" e igual para todo mundo
            endereco = it.get("image_webp") or it.get("image")
            if not endereco:
                continue
            nome_arq = endereco.split("/")[-1]
            try:
                if salvar(os.path.join(PASTA_HABS, nome_arq), baixar(endereco)):
                    contas["icone"] += 1
            except Exception as erro:
                print("   (aviso: icone de {} falhou: {})".format(nome, erro))

    limpar_cartas_antigas(usados)
    trocados = anotar_renomeacoes(trocas)
    if trocados:
        print("   heroes-data.js: {} heroi(s) agora usam o .webp".format(trocados))

    print()
    print("OK! {} cartas, {} banners, {} letreiros e {} icones atualizados".format(
        contas["carta"], contas["banner"], contas["nome"], contas["icone"]))
    if faltando:
        print("   sem arte na API (confira o nome): {}".format(", ".join(faltando)))
    if sem_personagem:
        print("   sem o personagem recortado na wiki: {}".format(", ".join(sem_personagem)))
    return 0


if __name__ == "__main__":
    sys.exit(main())

# -*- coding: utf-8 -*-
"""
Baixa as IMAGENS dos heróis em boa qualidade e salva nas pastas certas:

    assets/heroes/<Nome>.png        carta do herói (280x380) - usada no site todo
    assets/capas/<nome>.webp        arte de capa (banner) das páginas dos heróis
    assets/nomes/<nome>.svg         o nome do herói desenhado (letreiro)
    assets/habilidades/<arq>.webp   ícone de cada habilidade

Serve para:
  - deixar as imagens nítidas (sem esticar nem borrar);
  - pegar a arte de um herói novo que a Valve lançou.

Como usar:
    python tools/baixar-artes.py

Ele só baixa o que mudou (se a imagem que já está aqui for igual, pula).
Nada aqui é editado à mão: o site continua lendo o heroes-data.js.
"""

import io
import json
import os
import re
import sys
import unicodedata
import urllib.request

API_HEROIS = "https://api.deadlock-api.com/v1/assets/heroes"
API_ITENS = "https://api.deadlock-api.com/v1/assets/items"

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PASTA_ARTES = os.path.join(BASE, "assets", "heroes")
PASTA_CAPAS = os.path.join(BASE, "assets", "capas")
PASTA_NOMES = os.path.join(BASE, "assets", "nomes")
PASTA_HABS = os.path.join(BASE, "assets", "habilidades")
ARQUIVO_HEROIS = os.path.join(BASE, "heroes-data.js")

LARGURA_CAPA = 1200          # largura da arte de capa salva em disco
QUALIDADE_CAPA = 78          # 0 a 100 (quanto maior, mais nítida e mais pesada)


def baixar(url, timeout=90):
    pedido = urllib.request.Request(url, headers={"User-Agent": "CentralDeadlock/1.0"})
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


def reduzir_capa(bruto):
    """A capa original tem 4096x2312 (1,8 MB). Aqui ela vira ~1200 de largura (~30 KB)."""
    try:
        from PIL import Image
    except Exception:
        return bruto, "sem Pillow (salvando a original)"
    try:
        imagem = Image.open(io.BytesIO(bruto))
        proporcao = LARGURA_CAPA / imagem.size[0]
        nova = imagem.convert("RGB").resize(
            (LARGURA_CAPA, max(1, round(imagem.size[1] * proporcao))), Image.LANCZOS)
        saida = io.BytesIO()
        nova.save(saida, "WEBP", quality=QUALIDADE_CAPA, method=5)
        return saida.getvalue(), "{}x{}".format(*nova.size)
    except Exception as erro:
        return bruto, "nao consegui reduzir ({})".format(str(erro)[:40])


def main():
    print("Baixando as imagens dos herois (deadlock-api.com) ...")

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
            "capa": imagens.get("background_image_webp") or imagens.get("background_image"),
            "nome": imagens.get("name_image"),
        }

    # icones das habilidades: cada habilidade diz de quais herois ela e
    try:
        habilidades = pegar_json(API_ITENS)
    except Exception as erro:
        print("   (aviso: nao consegui pegar os icones das habilidades: {})".format(erro))
        habilidades = []

    icones = {}          # arquivo do icone -> endereco
    for it in habilidades:
        if not isinstance(it, dict) or str(it.get("type")).lower() != "ability":
            continue
        endereco = it.get("image_webp") or it.get("image")
        if endereco:
            icones[endereco.split("/")[-1]] = endereco

    if not api:
        print("AVISO: a API nao devolveu a lista de herois. Nada foi alterado.")
        return 1

    herois = ler_herois()
    contas = {"carta": 0, "capa": 0, "nome": 0, "icone": 0}
    faltando = []

    for heroi in herois:
        nome = str(heroi.get("name") or "").strip()
        arquivo = str(heroi.get("file") or "").strip()
        dados = api.get(nome.lower())
        if not arquivo or not dados:
            faltando.append(nome)
            continue
        apelido = slug(nome)

        # 1) carta do heroi
        if dados["carta"]:
            try:
                if salvar(os.path.join(PASTA_ARTES, arquivo), baixar(dados["carta"])):
                    contas["carta"] += 1
                    print("   carta    {} -> {}".format(nome, arquivo))
            except Exception as erro:
                print("   (aviso: carta de {} falhou: {})".format(nome, erro))

        # 2) arte de capa (o banner da página do herói)
        if dados["capa"]:
            try:
                reduzida, medida = reduzir_capa(baixar(dados["capa"]))
                if salvar(os.path.join(PASTA_CAPAS, apelido + ".webp"), reduzida):
                    contas["capa"] += 1
                    print("   capa     {} -> {}.webp ({})".format(nome, apelido, medida))
            except Exception as erro:
                print("   (aviso: capa de {} falhou: {})".format(nome, erro))

        # 3) o nome do herói desenhado (letreiro)
        if dados["nome"]:
            try:
                if salvar(os.path.join(PASTA_NOMES, apelido + ".svg"), baixar(dados["nome"])):
                    contas["nome"] += 1
                    print("   letreiro {} -> {}.svg".format(nome, apelido))
            except Exception as erro:
                print("   (aviso: letreiro de {} falhou: {})".format(nome, erro))

        # 4) ícones das habilidades do herói
        for it in habilidades:
            if not isinstance(it, dict) or str(it.get("type")).lower() != "ability":
                continue
            if it.get("heroes") != [dados["id"]]:
                continue
            if str(it.get("name") or "").strip().lower() == "melee":
                continue          # "Melee" é igual para todo mundo, não serve
            endereco = it.get("image_webp") or it.get("image")
            if not endereco:
                continue
            nome_arq = endereco.split("/")[-1]
            try:
                if salvar(os.path.join(PASTA_HABS, nome_arq), baixar(endereco)):
                    contas["icone"] += 1
            except Exception as erro:
                print("   (aviso: icone de {} falhou: {})".format(nome, erro))

    print()
    print("OK! {} cartas, {} capas, {} letreiros e {} icones de habilidade atualizados".format(
        contas["carta"], contas["capa"], contas["nome"], contas["icone"]))
    if faltando:
        print("   sem arte na API (confira o nome): {}".format(", ".join(faltando)))
    return 0


if __name__ == "__main__":
    sys.exit(main())

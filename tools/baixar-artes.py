# -*- coding: utf-8 -*-
"""
Baixa as ARTES DOS HERÓIS em boa qualidade (as cartas de verdade, 280x380)
e salva na pasta assets/heroes — sempre com o nome de arquivo que o
heroes-data.js usa.

Serve para:
  - deixar as imagens nítidas (as antigas eram a versão pequenininha);
  - pegar a arte de um herói novo que a Valve lançou.

Como usar:
    python tools/baixar-artes.py

Ele baixa só o que mudou (se a imagem já está igual, pula).
Nada aqui é editado à mão: o site continua lendo o heroes-data.js.
"""

import json
import os
import sys
import urllib.request

API_HEROIS = "https://api.deadlock-api.com/v1/assets/heroes"

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PASTA_ARTES = os.path.join(BASE, "assets", "heroes")
ARQUIVO_HEROIS = os.path.join(BASE, "heroes-data.js")


def baixar(url, timeout=60):
    pedido = urllib.request.Request(url, headers={"User-Agent": "CentralDeadlock/1.0"})
    with urllib.request.urlopen(pedido, timeout=timeout) as resposta:
        return resposta.read()


def ler_herois():
    with open(ARQUIVO_HEROIS, encoding="utf-8") as arquivo:
        texto = arquivo.read()
    inicio = texto.index("const HEROES_DATA = ")
    return json.loads(texto[texto.index("[", inicio):texto.rindex("]") + 1])


def main():
    print("Baixando as artes dos herois (deadlock-api.com) ...")

    try:
        lista = json.loads(baixar(API_HEROIS).decode("utf-8"))
    except Exception as erro:
        print("ERRO: nao consegui falar com a deadlock-api.com: {}".format(erro))
        return 1

    # nome do heroi (minusculo) -> endereco da arte grande
    artes = {}
    for h in lista:
        if not isinstance(h, dict):
            continue
        nome = str(h.get("name") or "").strip().lower()
        imagens = h.get("images") or {}
        url = imagens.get("icon_hero_card") or imagens.get("icon_hero_card_webp")
        if nome and url:
            artes[nome] = url

    if not artes:
        print("AVISO: a API nao devolveu nenhuma arte. Nada foi alterado.")
        return 1

    os.makedirs(PASTA_ARTES, exist_ok=True)
    atualizados, iguais, faltando = 0, 0, []

    for heroi in ler_herois():
        nome = str(heroi.get("name") or "").strip()
        arquivo = str(heroi.get("file") or "").strip()
        url = artes.get(nome.lower())
        if not arquivo or not url:
            faltando.append(nome)
            continue
        destino = os.path.join(PASTA_ARTES, arquivo)
        try:
            novo = baixar(url)
        except Exception as erro:
            print("   (aviso: nao consegui baixar a arte de {}: {})".format(nome, erro))
            faltando.append(nome)
            continue

        # se a imagem que ja esta aqui e igual, nao mexe (nao suja o Git)
        if os.path.exists(destino):
            with open(destino, "rb") as aberto:
                if aberto.read() == novo:
                    iguais += 1
                    continue
        with open(destino, "wb") as gravando:
            gravando.write(novo)
        atualizados += 1
        print("   {} -> {} ({} KB)".format(nome, arquivo, round(len(novo) / 1024)))

    print()
    print("OK! {} artes atualizadas, {} ja estavam certas".format(atualizados, iguais))
    if faltando:
        print("   sem arte encontrada (confira o nome): {}".format(", ".join(faltando)))
    return 0


if __name__ == "__main__":
    sys.exit(main())

# -*- coding: utf-8 -*-
"""
Traduz os NOMES DAS HABILIDADES dos heróis para português, direto no arquivo
heroes-data.js (o arquivo que você edita à mão).

Como funciona:
  - Cada habilidade ganha o campo "name_en" (o nome original, em inglês) e
    o campo "name" passa a ficar em português.
  - Se a habilidade JÁ tem "name_en", ela é pulada (quer dizer que já foi traduzida).
  - As traduções ficam guardadas em data/traducao-jogo.json, então rodar de novo
    é rápido e não fala com o tradutor de novo.

IMPORTANTE: quando você adicionar um herói novo, escreva o nome das habilidades
em inglês (como está na deadlock.wiki) e rode este script. Ele traduz sozinho.

Como usar:
    python tools/traduzir-jogo.py
"""

import datetime
import hashlib
import json
import os
import re
import sys
import urllib.parse
import urllib.request

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARQUIVO = os.path.join(BASE, "heroes-data.js")
CACHE = os.path.join(BASE, "data", "traducao-jogo.json")
TRADUTOR = ("https://translate.googleapis.com/translate_a/single"
            "?client=gtx&sl=en&tl=pt-BR&dt=t&q={texto}")


def carregar_cache():
    try:
        with open(CACHE, encoding="utf-8") as arquivo:
            dados = json.load(arquivo)
        return dados if isinstance(dados, dict) else {}
    except Exception:
        return {}


def salvar_cache(cache):
    try:
        os.makedirs(os.path.dirname(CACHE), exist_ok=True)
        with open(CACHE, "w", encoding="utf-8") as arquivo:
            json.dump(cache, arquivo, ensure_ascii=False, indent=1)
    except Exception as erro:
        print("   (aviso: nao consegui salvar o cache: {})".format(erro))


def traduzir(texto, cache):
    texto = (texto or "").strip()
    if not texto:
        return ""
    chave = hashlib.md5(texto.encode("utf-8")).hexdigest()
    if chave in cache:
        return cache[chave]
    url = TRADUTOR.format(texto=urllib.parse.quote(texto))
    pedido = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(pedido, timeout=25) as resposta:
        dados = json.loads(resposta.read().decode("utf-8"))
    traducao = "".join(p[0] for p in dados[0] if p and p[0]).strip().replace("\n", " ")
    traducao = re.sub(r"\s+", " ", traducao)
    if traducao:
        traducao = traducao[0].upper() + traducao[1:]
        cache[chave] = traducao
    return traducao


def main():
    print("Traduzindo os nomes das habilidades (heroes-data.js) ...")

    try:
        with open(ARQUIVO, encoding="utf-8") as arquivo:
            texto = arquivo.read()
    except Exception as erro:
        print("ERRO: nao consegui abrir heroes-data.js: {}".format(erro))
        return 1

    quebra = "\r\n" if "\r\n" in texto else "\n"

    # separa o cabecalho (comentarios + ROLES/DIFF_LABEL/HEROES_SOON) da lista de herois
    marca = "const HEROES_DATA = "
    inicio = texto.index(marca)
    lista_inicio = texto.index("[", inicio)
    lista_fim = texto.rindex("]") + 1
    cabecalho = texto[:inicio]

    # tira o aviso de tradução antigo (senão ele se repetiria a cada rodada)
    cabecalho = re.sub(
        r"// Habilidades traduzidas automaticamente para portugues pelo script\r?\n"
        r"// tools/traduzir-jogo\.py[^\r\n]*\r?\n"
        r"// Ultima traducao:[^\r\n]*\r?\n",
        "", cabecalho)
    try:
        dados = json.loads(texto[lista_inicio:lista_fim])
    except Exception as erro:
        print("ERRO: o valor de HEROES_DATA nao esta num formato que eu entenda: {}".format(erro))
        return 1

    if not isinstance(dados, list) or not dados or not isinstance(dados[0], dict):
        print("ERRO: a lista de herois parece estar com um formato estranho. Nada foi alterado.")
        return 1

    cache = carregar_cache()
    novos, pulados, falhas = 0, 0, 0
    for heroi in dados:
        for skill in heroi.get("skills") or []:
            if "name_en" in skill:
                pulados += 1
                continue
            original = str(skill.get("name") or "").strip()
            if not original:
                continue
            try:
                traduzido = traduzir(original, cache)
            except Exception:
                traduzido = ""
            if not traduzido:
                falhas += 1
                traduzido = original
            skill["name_en"] = original
            skill["name"] = traduzido
            novos += 1

    salvar_cache(cache)

    agora = datetime.datetime.now().strftime("%d/%m/%Y as %H:%M")
    aviso = ("// Habilidades traduzidas automaticamente para portugues pelo script\n"
             "// tools/traduzir-jogo.py (o nome original em ingles fica no campo \"name_en\").\n"
             "// Ultima traducao: {}\n").format(agora)

    conteudo = (cabecalho + aviso + "const HEROES_DATA = "
                + json.dumps(dados, ensure_ascii=False, indent=2) + ";" + quebra)

    with open(ARQUIVO, "w", encoding="utf-8", newline="") as arquivo:
        arquivo.write(conteudo)

    print("OK! {} habilidades traduzidas, {} ja estavam prontas, {} falharam".format(novos, pulados, falhas))
    if falhas:
        print("   (as que falharam ficaram com o nome em ingles; rode de novo depois)")
    return 0


if __name__ == "__main__":
    sys.exit(main())

# -*- coding: utf-8 -*-
"""
Escreve as BUILDS mais usadas de cada herói no arquivo data/builds.js.

O que aparece aqui vem das partidas de verdade:

    data/game-data.js   -> builds mais populares de cada herói (ordem dos itens,
                           win rate e número de partidas) e os itens com preço
    data/hero-stats.js  -> tier do herói hoje
    heroes-data.js      -> nome, papel, imagem e página do herói

Nada é inventado: os nomes das builds são os da comunidade (limpos), o win rate é
medido nas partidas e os preços vêm da loja do jogo.

Como usar:
    python tools/gerar-builds.py

É rodado sozinho pelo robô do GitHub depois de atualizar os dados do jogo.
"""

import datetime
import json
import os
import re
import unicodedata

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAIDA = os.path.join(BASE, "data", "builds.js")

MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]

# Quantos itens, no máximo, entram na lista de uma build (as builds do jogo vão até 12)
MAX_ITENS = 12


# --------------------------- utilidades ---------------------------

def ler_js(nome_arquivo):
    """Le um arquivo do tipo window.ALGO = {...}; e devolve o dicionario."""
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


def num(valor, casas=1):
    try:
        return ("{:." + str(casas) + "f}").format(float(valor)).replace(".", ",")
    except Exception:
        return str(valor)


def milhar(valor):
    try:
        return "{:,}".format(int(valor)).replace(",", ".")
    except Exception:
        return str(valor)


def dinheiro(valor):
    """Preco de item no jeito brasileiro: 1.250"""
    try:
        return "{:,}".format(int(valor)).replace(",", ".")
    except Exception:
        return str(valor)


# --------------------------- a build de cada herói ---------------------------

def nome_limpo(nome):
    """Tira sobras do fim do nome (ex.: 'Abrams - Build [58% WR] [trackloc')."""
    nome = re.sub(r"\s*\[[^\]]*$", "", str(nome or "")).strip()
    return (nome[:60].strip() or "Build da comunidade")


def itens_da_build(lista_ids, itens):
    """Transforma os ids dos itens em nome + preco + imagem (dados reais da loja)."""
    saida = []
    for ident in lista_ids[:MAX_ITENS]:
        item = itens.get(str(ident)) or itens.get(ident) or {}
        nome = str(item.get("n") or "").strip()
        if not nome:
            continue
        saida.append({
            "id": int(ident),
            "n": nome,
            "c": int(item.get("c") or 0),
            "i": str(item.get("i") or "")
        })
    return saida


def corpo_do_heroi(nome, builds, partidas_total):
    """Monta os paragrafos (texto puro, em portugues) sobre as builds do herói."""
    corpo = []
    mais_usada = builds[0]
    melhor = sorted(builds, key=lambda b: float(b.get("win") or 0), reverse=True)[0]

    corpo.append(
        "Estas são as builds mais usadas de {nome} nas partidas de verdade: {quanto} "
        "reunindo {partidas} partidas analisadas.".format(
            nome=nome,
            quanto=("a mais popular e mais {n} alternativa{s}".format(
                n=len(builds) - 1, s="" if len(builds) == 2 else "s") if len(builds) > 1 else "a única build com amostra suficiente"),
            partidas=milhar(partidas_total))
    )

    corpo.append(
        "A mais usada é \"{nome_build}\", com {m} partidas e {win}% de vitória. "
        "A ordem dos itens abaixo é a ordem real de compra usada pelos jogadores.".format(
            nome_build=mais_usada.get("nome") or "Build da comunidade",
            m=milhar(mais_usada.get("m") or 0),
            win=num(mais_usada.get("win")))
    )

    if melhor.get("nome") != mais_usada.get("nome"):
        corpo.append(
            "Quem mais ganha é \"{nome_build}\", com {win}% de vitória em {m} partidas — "
            "vale testar quando o herói estiver com dificuldade.".format(
                nome_build=melhor.get("nome") or "Build da comunidade",
                win=num(melhor.get("win")),
                m=milhar(melhor.get("m") or 0))
        )
    else:
        corpo.append(
            "É também a build com o melhor win rate do herói, então é um bom ponto de partida "
            "para quem está começando com ele."
        )

    if mais_usada.get("itens"):
        caros = sorted(mais_usada["itens"], key=lambda i: i.get("c") or 0, reverse=True)[:2]
        corpo.append(
            "Os itens mais caros da build mais usada são {lista}. Compre os itens baratos primeiro: "
            "eles seguram a rota até você juntar almas para os grandes.".format(
                lista=" e ".join("{n} ({c})".format(n=i["n"], c=dinheiro(i["c"])) for i in caros))
        )

    corpo.append("Os preços e os nomes dos itens vêm da loja do jogo. Fonte: deadlock-api.com")
    return corpo


def main():
    herois = ler_herois()
    jogo = ler_js("data/game-data.js")
    stats = ler_js("data/hero-stats.js").get("herois") or {}

    ids = jogo.get("ids") or {}
    itens = jogo.get("itens") or {}
    builds_por_id = jogo.get("builds") or {}

    agora = datetime.datetime.now()
    data_curta = "{} {} {}".format(agora.day, MESES[agora.month - 1], agora.year)
    atualizado = "{}/{}/{} as {:02d}:{:02d}".format(agora.day, agora.month, agora.year, agora.hour, agora.minute)

    lista = []
    for h in herois:
        if h.get("soon"):
            continue
        nome = h["name"]
        ident = ids.get(nome)
        if ident is None:
            continue
        bruta = builds_por_id.get(str(ident)) or builds_por_id.get(ident) or []
        if not bruta:
            continue

        limpas = []
        for b in bruta:
            itens_b = itens_da_build(b.get("i") or [], itens)
            if not itens_b:
                continue
            limpas.append({
                "nome": nome_limpo(b.get("n")),
                "win": round(float(b.get("win") or 0), 1),
                "m": int(b.get("m") or 0),
                "itens": itens_b
            })
        if not limpas:
            continue

        s = stats.get(nome) or {}
        partidas_total = sum(b["m"] for b in limpas)
        lista.append({
            "id": "bd-" + slug(nome),
            "cat": "Build",
            "title": "{} — Builds mais usadas".format(nome),
            "img": h.get("file") or "",
            "date": data_curta,
            "tier": s.get("tier") or h.get("tier") or "?",
            "role": h.get("role") or "A definir",
            "win": s.get("win"),
            "desc": ("As builds de {nome} que os jogadores mais usam, na ordem certa de compra e com o "
                     "win rate de verdade de cada uma.").format(nome=nome),
            "heroPage": "heroi/{}.html".format(slug(nome)),
            "builds": limpas,
            "body": corpo_do_heroi(nome, limpas, partidas_total)
        })

    lista.sort(key=lambda g: g["title"].lower())

    dados = {
        "updated": atualizado,
        "fonte": "deadlock-api.com",
        "partidas": jogo.get("partidas") or 0,
        "lista": lista
    }

    cabecalho = (
        "/* ATENCAO: arquivo gerado automaticamente pelo script tools/gerar-builds.py\n"
        "   Nao edite na mao: as mudancas sao perdidas na proxima atualizacao.\n"
        "   Builds mais usadas de cada heroi ({} herois), com a ordem real de compra\n"
        "   e o win rate medido nas partidas. Dados reais, via deadlock-api.com\n"
        "   Ultima atualizacao: {} */\n"
    ).format(len(lista), atualizado)

    with open(SAIDA, "w", encoding="utf-8") as arquivo:
        arquivo.write(cabecalho + "window.BUILDS_REAIS = " + json.dumps(dados, ensure_ascii=False, separators=(",", ":")) + ";\n")

    print("Builds geradas: {} herois (data/builds.js)".format(len(lista)))


if __name__ == "__main__":
    main()

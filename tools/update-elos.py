# -*- coding: utf-8 -*-
"""
Busca os ELOS DE VERDADE do Deadlock (dados oficiais):

    1) O brasão de cada elo (Obscurus, Initiate, ... Eternus) - a imagem oficial
    2) Quantos jogadores estão em cada elo hoje (distribuição real de MMR)

De onde vêm: api.deadlock-api.com (dados oficiais das partidas registradas).
Sai tudo para: data/elos.js e as imagens em assets/elos/

Como usar:
    python tools/update-elos.py

É rodado sozinho pelo robô do GitHub, todo dia. Nada aqui é digitado à mão.
O arquivo gerado NÃO deve ser editado: a próxima rodada apaga a mudança.
"""

import datetime
import json
import os
import sys
import time
import urllib.error
import urllib.request

API = "https://api.deadlock-api.com"
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAIDA = os.path.join(BASE, "data", "elos.js")
PASTA_IMAGENS = os.path.join(BASE, "assets", "elos")

CABECALHO = {"User-Agent": "CentralDeadlock/1.0 (site de fas)"}

# Nomes em português para quem não joga em inglês.
NOMES_PT = {
    "Obscurus": "Obscurus",
    "Initiate": "Iniciado",
    "Seeker": "Buscador",
    "Acolyte": "Acólito",
    "Sentinel": "Sentinela",
    "Mystic": "Místico",
    "Ritualist": "Ritualista",
    "Emissary": "Emissário",
    "Oracle": "Oráculo",
    "Phantom": "Fantasma",
    "Ascendant": "Ascendente",
    "Eternus": "Eternus",
}


def baixar_json(caminho, tentativas=3):
    """Baixa um endereço da API e devolve o JSON. Aguenta a API oscilar."""
    url = API + caminho
    ultimo = None
    for _ in range(tentativas):
        try:
            pedido = urllib.request.Request(url, headers=CABECALHO)
            with urllib.request.urlopen(pedido, timeout=120) as resposta:
                return json.loads(resposta.read().decode("utf-8"))
        except urllib.error.HTTPError as erro:
            ultimo = erro
            time.sleep(4 if erro.code == 429 else 1.5)
        except Exception as erro:  # noqa: BLE001 - rede pode falhar de várias formas
            ultimo = erro
            time.sleep(1.5)
    raise RuntimeError("nao consegui baixar {} ({})".format(url, ultimo))


def baixar_imagem(url, destino):
    """Salva uma imagem. Se falhar, mantém a que já estava lá."""
    try:
        pedido = urllib.request.Request(url, headers=CABECALHO)
        with urllib.request.urlopen(pedido, timeout=120) as resposta:
            dados = resposta.read()
        if len(dados) < 500:
            return False
        with open(destino, "wb") as arquivo:
            arquivo.write(dados)
        return True
    except Exception:  # noqa: BLE001 - imagem que falha não derruba o resto
        return False


def escrever(conteudo, agora):
    texto = (
        "/* ATENCAO: arquivo gerado automaticamente pelo script tools/update-elos.py\n"
        "   Nao edite na mao: as mudancas sao perdidas na proxima atualizacao.\n"
        "   Brasoes dos elos e quantos jogadores ha em cada elo,\n"
        "   com dados de verdade das partidas (deadlock-api.com)\n"
        "   Ultima atualizacao: {} */\n"
        "window.ELOS = {};\n"
    ).format(agora, json.dumps(conteudo, ensure_ascii=False, separators=(",", ":")))
    os.makedirs(os.path.dirname(SAIDA), exist_ok=True)
    with open(SAIDA, "w", encoding="utf-8") as arquivo:
        arquivo.write(texto)


def main():
    print("Buscando os brasoes dos elos e a distribuicao de verdade ...")
    brasoes = baixar_json("/v1/assets/ranks")
    if not brasoes:
        print("AVISO: a API nao devolveu os brasoes. Nada foi alterado.")
        return 1

    os.makedirs(PASTA_IMAGENS, exist_ok=True)
    todos = []
    for brasao in brasoes:
        tier = int(brasao.get("tier", 0))
        nome_en = brasao.get("name") or "Elo {}".format(tier)
        imagens = brasao.get("images") or {}
        endereco = imagens.get("large_webp") or imagens.get("large") or imagens.get("small")
        arquivo = "assets/elos/{}.webp".format(tier)
        salvo = False
        if endereco:
            salvo = baixar_imagem(endereco, os.path.join(PASTA_IMAGENS, "{}.webp".format(tier)))
        if not salvo and not os.path.exists(os.path.join(PASTA_IMAGENS, "{}.webp".format(tier))):
            print("   (aviso) sem imagem para o elo {}".format(nome_en))
        todos.append({
            "tier": tier,
            "nome": NOMES_PT.get(nome_en, nome_en),
            "nomeEn": nome_en,
            "img": arquivo if (salvo or os.path.exists(os.path.join(PASTA_IMAGENS, "{}.webp".format(tier)))) else "",
        })
    todos.sort(key=lambda x: x["tier"])

    print("Buscando quantos jogadores ha em cada elo ...")
    distribuicao = baixar_json("/v1/players/mmr/distribution")
    if not distribuicao:
        print("AVISO: a API nao devolveu a distribuicao. Nada foi alterado.")
        return 1

    por_tier = {}
    for linha in distribuicao:
        try:
            tier = int(linha["rank"]) // 10
            por_tier[tier] = por_tier.get(tier, 0) + int(linha.get("players", 0))
        except (KeyError, TypeError, ValueError):
            continue
    total = sum(por_tier.values())
    if not total:
        print("AVISO: a distribuicao veio vazia. Nada foi alterado.")
        return 1

    nome_por_tier = {x["tier"]: x for x in todos}
    faixas = []
    for tier in sorted(por_tier, reverse=True):
        if por_tier[tier] <= 0:
            continue
        info = nome_por_tier.get(tier) or {"nome": "Elo {}".format(tier), "img": ""}
        faixas.append({
            "tier": tier,
            "nome": info["nome"],
            "img": info["img"],
            "jogadores": por_tier[tier],
            "pct": round(por_tier[tier] * 100.0 / total, 1),
        })

    agora = datetime.datetime.now().strftime("%d/%m/%Y as %H:%M")
    escrever({
        "updated": agora,
        "fonte": "deadlock-api.com",
        "total": total,
        "faixas": faixas,
        "todos": [{"tier": x["tier"], "nome": x["nome"], "img": x["img"]} for x in todos],
    }, agora)

    print()
    print("OK! {} elos com brasao e {} faixas com jogadores em data/elos.js".format(len(todos), len(faixas)))
    print("   {:,} jogadores classificados (o total de partidas analisadas)".format(total).replace(",", "."))
    return 0


if __name__ == "__main__":
    sys.exit(main())

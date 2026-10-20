# -*- coding: utf-8 -*-
"""
Busca as estatísticas REAIS dos heróis de Deadlock e grava o arquivo
data/hero-stats.js (usado pelo site na aba "Estatísticas" e para
deixar o win rate / a tier list de verdade).

Os números vêm do projeto público e gratuito deadlock-api.com, que lê
os dados das próprias partidas do jogo.

Como usar:
    python tools/update-stats.py

No Windows você também pode dar dois cliques em: atualizar-tudo.bat
"""

import datetime
import json
import os
import re
import sys
import urllib.request

# Endereços da API pública (não mude)
API_HEROIS = "https://api.deadlock-api.com/v1/assets/heroes"
API_STATS = "https://api.deadlock-api.com/v1/analytics/hero-stats"

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PASTA = os.path.join(BASE, "data")
SAIDA = os.path.join(PASTA, "hero-stats.js")
ARQ_HEROIS = os.path.join(BASE, "heroes-data.js")

# quantas partidas o herói recém-lançado precisa ter para sair do "Em breve"
MIN_PARTIDAS_LANCAMENTO = 300

# quantos heróis entram em cada nota da tier list (por posição no win rate)
# S = melhor 15%, A = próximos 25%, B = próximos 30%, C = próximos 20%, D = resto
FAIXAS = [("S", 0.15), ("A", 0.25), ("B", 0.30), ("C", 0.20), ("D", 1.00)]


def baixar_json(url, tentativas=3):
    ultimo = None
    for n in range(tentativas):
        try:
            pedido = urllib.request.Request(url, headers={"User-Agent": "CentralDeadlock/1.0"})
            with urllib.request.urlopen(pedido, timeout=45) as resposta:
                return json.loads(resposta.read().decode("utf-8"))
        except Exception as erro:            # tenta de novo (a API as vezes oscila)
            ultimo = erro
    raise ultimo


def arredondar(valor, casas=1):
    try:
        return round(float(valor), casas)
    except Exception:
        return 0


def buscar_herois():
    """Devolve {id: nome} usando a lista oficial da API."""
    herois = baixar_json(API_HEROIS)
    mapa = {}
    for h in herois:
        if isinstance(h, dict) and h.get("id") is not None and h.get("name"):
            mapa[int(h["id"])] = str(h["name"]).strip()
    return mapa


def buscar_stats():
    """Devolve as linhas de estatística (todas as partidas / todos os ranks)."""
    linhas = baixar_json(API_STATS)
    if not isinstance(linhas, list):
        return []
    # bucket 0 = todas as partidas juntas (sem separar por rank)
    todas = [l for l in linhas if int(l.get("bucket", 0)) == 0]
    return todas or linhas


def liberar_herois_novos(herois):
    """Tira do "Em breve" quem já apareceu nas partidas de verdade.

    Herói novo entra no jogo antes de a deadlock-api ter números dele.
    Enquanto não houver partidas suficientes, a página continua escondida
    (o site só mostra números reais). Quando os números chegam, este script
    libera o herói sozinho: tira o nome da lista HEROES_SOON e troca o
    "soon": true por false no heroes-data.js.

    Devolve a lista de heróis liberados agora.
    """
    if not os.path.exists(ARQ_HEROIS):
        return []
    with open(ARQ_HEROIS, "rb") as arquivo:
        texto = arquivo.read().decode("utf-8")

    lista = re.search(r"HEROES_SOON\s*=\s*\[(.*?)\]", texto, re.S)
    if not lista:
        return []
    nomes = re.findall(r'"([^"]+)"', lista.group(1))

    liberados = []
    for nome in nomes:
        dados = herois.get(nome) or {}
        if int(dados.get("partidas") or 0) < MIN_PARTIDAS_LANCAMENTO:
            continue                    # ainda sem números de verdade
        inicio = texto.find('"name": "{}"'.format(nome))
        if inicio < 0:
            continue
        fim = inicio + 3000
        trecho = texto[inicio:fim]
        novo = trecho.replace('"soon": true', '"soon": false', 1)
        if novo == trecho:
            continue
        texto = texto[:inicio] + novo + texto[fim:]
        liberados.append(nome)

    if not liberados:
        return []

    # tira os nomes liberados da lista HEROES_SOON (pode ficar vazia)
    lista = re.search(r"HEROES_SOON\s*=\s*\[(.*?)\]", texto, re.S)
    if lista:
        sobrou = [n for n in re.findall(r'"([^"]+)"', lista.group(1)) if n not in liberados]
        nova = "HEROES_SOON = [{}]".format(", ".join('"{}"'.format(n) for n in sobrou))
        texto = texto[:lista.start()] + nova + texto[lista.end():]

    with open(ARQ_HEROIS, "wb") as arquivo:
        arquivo.write(texto.encode("utf-8"))
    return liberados


def calcular_tier(herois):
    """Dá uma nota S/A/B/C/D de acordo com a posição no win rate."""
    ordenados = sorted(herois, key=lambda n: herois[n]["win"], reverse=True)
    total = len(ordenados)
    if not total:
        return
    posicao, inicio = 0, 0
    for letra, fracao in FAIXAS:
        fim = inicio + max(1, int(round(total * fracao)))
        for nome in ordenados[inicio:fim]:
            herois[nome]["tier"] = letra
            herois[nome]["posicao"] = posicao + 1
            posicao += 1
        inicio = fim
        if inicio >= total:
            break


def main():
    print("Buscando as estatisticas reais dos herois (deadlock-api.com) ...")

    try:
        nomes = buscar_herois()
        linhas = buscar_stats()
    except Exception as erro:
        print("ERRO: nao consegui falar com a deadlock-api.com: {}".format(erro))
        print("AVISO: o arquivo data/hero-stats.js nao foi alterado.")
        return 1

    if not linhas:
        print("AVISO: a API respondeu vazia. O arquivo nao foi alterado.")
        return 1

    # soma de todas as aparições de herói (serve para calcular o "pick rate")
    soma_partidas = sum(int(l.get("matches") or 0) for l in linhas) or 1

    herois = {}
    for l in linhas:
        nome = nomes.get(int(l.get("hero_id") or 0))
        if not nome:
            continue
        partidas = int(l.get("matches") or 0)
        vitorias = int(l.get("wins") or 0)
        derrotas = int(l.get("losses") or 0)
        if partidas <= 0 or (vitorias + derrotas) <= 0:
            continue
        mortes = int(l.get("total_deaths") or 0) or 1
        abates = int(l.get("total_kills") or 0)
        assist = int(l.get("total_assists") or 0)
        herois[nome] = {
            "id": int(l.get("hero_id") or 0),
            "partidas": partidas,
            "win": arredondar(100.0 * vitorias / (vitorias + derrotas), 1),
            "pick": arredondar(100.0 * partidas / soma_partidas, 1),
            "kda": arredondar(float(abates + assist) / mortes, 2),
            "abates": arredondar(float(abates) / max(1, partidas), 1),
        }

    if not herois:
        print("AVISO: nenhum heroi casou com a lista oficial. Nada foi alterado.")
        return 1

    calcular_tier(herois)

    # herói recém-lançado: quando os números reais chegam, sai do "Em breve"
    liberados = liberar_herois_novos(herois)

    # resumo geral (aparece no topo da aba Estatisticas)
    # cada partida tem 12 herois (6 x 6), por isso divide por 12
    total_partidas = int(round(soma_partidas / 12.0))
    melhor = max(herois, key=lambda n: herois[n]["win"])
    pior = min(herois, key=lambda n: herois[n]["win"])
    mais_jogado = max(herois, key=lambda n: herois[n]["pick"])

    agora = datetime.datetime.now().strftime("%d/%m/%Y as %H:%M")
    pacote = {
        "updated": agora,
        "fonte": "deadlock-api.com",
        "partidas": total_partidas,
        "herois": herois,
        "destaques": {
            "melhor": melhor,
            "melhor_win": herois[melhor]["win"],
            "pior": pior,
            "pior_win": herois[pior]["win"],
            "mais_jogado": mais_jogado,
            "mais_jogado_pick": herois[mais_jogado]["pick"],
        },
    }

    conteudo = (
        "/* ATENCAO: arquivo gerado automaticamente pelo script tools/update-stats.py\n"
        "   Nao edite na mao: as mudancas sao perdidas na proxima atualizacao.\n"
        "   Dados reais de partidas, via deadlock-api.com\n"
        "   Ultima atualizacao: {} */\n"
        "window.HERO_STATS = {};\n"
    ).format(agora, json.dumps(pacote, ensure_ascii=False, separators=(",", ":")))

    os.makedirs(PASTA, exist_ok=True)
    with open(SAIDA, "w", encoding="utf-8") as arquivo:
        arquivo.write(conteudo)

    print("OK! {} herois com estatisticas reais em data/hero-stats.js".format(len(herois)))
    print("   partidas analisadas: {:,}".format(total_partidas).replace(",", "."))
    print("   melhor win rate: {} ({:.1f}%)".format(melhor, herois[melhor]["win"]))
    print("   mais jogado:     {} ({:.1f}%)".format(mais_jogado, herois[mais_jogado]["pick"]))
    if liberados:
        print("   saiu do 'Em breve': {}".format(", ".join(liberados)))
    return 0


if __name__ == "__main__":
    sys.exit(main())

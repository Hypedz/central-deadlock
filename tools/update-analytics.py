# -*- coding: utf-8 -*-
"""
Busca DADOS REAIS das partidas para a página de cada herói:

    1) O que upar primeiro   - qual habilidade os jogadores sobem em cada nível
    2) Melhores duplas       - com quem aquele herói ganha mais (e com quem perde)
    3) Rota (lane)           - contra quem ele ganha ou perde a rota, e por
                               quantas almas de diferença

De onde vêm: api.deadlock-api.com (dados oficiais das partidas registradas).
Sai tudo para: data/hero-analytics.js

Como usar:
    python tools/update-analytics.py

É rodado sozinho pelo robô do GitHub, todo dia. Nada aqui é digitado à mão.
O arquivo gerado NÃO deve ser editado: a próxima rodada apaga a mudança.
"""

import datetime
import json
import os
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.request

API = "https://api.deadlock-api.com"
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARQUIVO_HEROIS = os.path.join(BASE, "heroes-data.js")
SAIDA = os.path.join(BASE, "data", "hero-analytics.js")

# ---- quanta partida é preciso para o número valer ----
MIN_SEQUENCIA = 100      # ao pedir a ordem das habilidades
MIN_DUPLA = 1500         # partidas mínimas para confiar numa dupla
MIN_DUPLA_RUIM = 4000    # para dizer que uma dupla é ruim (precisa de mais dado)
MIN_ROTA = 150           # partidas mínimas para confiar num confronto de rota
MIN_ROTA_BUSCA = 50      # filtro que a gente manda para a API na rota
TOTAL_DUPLAS = 5         # quantas duplas boas mostrar
TOTAL_DUPLAS_RUINS = 3
TOTAL_ROTA = 8           # quantos confrontos de rota mostrar
TOTAL_NIVEIS = 16        # até onde a ordem das habilidades vai

CABECALHO = {"User-Agent": "CentralDeadlock/1.0 (site de fas)"}


def baixar(url, tentativas=3):
    """Baixa um endereço e devolve o JSON. Aguenta a API oscilar um pouco."""
    ultimo = None
    for n in range(tentativas):
        try:
            pedido = urllib.request.Request(url, headers=CABECALHO)
            with urllib.request.urlopen(pedido, timeout=120) as resposta:
                return json.loads(resposta.read().decode("utf-8"))
        except urllib.error.HTTPError as erro:
            ultimo = erro
            # 429 = "devagar aí". Espera e tenta de novo.
            time.sleep(4 if erro.code == 429 else 1.5)
        except Exception as erro:
            ultimo = erro
            time.sleep(1.5)
    raise RuntimeError("nao consegui baixar {} ({})".format(url, ultimo))


def ler_herois():
    with open(ARQUIVO_HEROIS, encoding="utf-8") as arquivo:
        texto = arquivo.read()
    inicio = texto.index("const HEROES_DATA = ")
    return json.loads(texto[texto.index("[", inicio):texto.rindex("]") + 1])


def slug(texto):
    """'Lady Geist' -> 'lady-geist' (o mesmo nome usado nas páginas dos heróis)."""
    texto = unicodedata.normalize("NFKD", str(texto)).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-zA-Z0-9]+", "-", texto).strip("-").lower() or "pagina"


def escrever(conteudo, agora):
    texto = (
        "/* ATENCAO: arquivo gerado automaticamente pelo script tools/update-analytics.py\n"
        "   Nao edite na mao: as mudancas sao perdidas na proxima atualizacao.\n"
        "   Ordem das habilidades, melhores duplas e confrontos de rota,\n"
        "   calculados a partir de partidas de verdade (deadlock-api.com)\n"
        "   Ultima atualizacao: {} */\n"
        "window.HERO_ANALYTICS = {};\n"
    ).format(agora, json.dumps(conteudo, ensure_ascii=False, separators=(",", ":")))
    os.makedirs(os.path.dirname(SAIDA), exist_ok=True)
    with open(SAIDA, "w", encoding="utf-8") as arquivo:
        arquivo.write(texto)


def juntar_duplas(lista, hero_id):
    """Junta as duplas em que o herói aparece e devolve {outro_heroi: [partidas, vitórias]}."""
    soma = {}
    for par in lista or []:
        a, b = par.get("hero_id1"), par.get("hero_id2")
        if hero_id == a:
            outro = b
        elif hero_id == b:
            outro = a
        else:
            continue
        partidas = par.get("matches_played") or 0
        if partidas <= 0 or not outro:
            continue
        dado = soma.setdefault(outro, [0, 0])
        dado[0] += partidas
        dado[1] += par.get("wins") or 0
    return soma


def juntar_rota(lista, hero_id):
    """Junta os confrontos de rota por herói inimigo.

    Devolve {inimigo: [partidas, vitórias, soma_almas, partidas_com_almas]}.
    Nas partidas nós jogamos em dupla na rota: por isso cada lado tem 2 heróis.
    """
    soma = {}
    for confronto in lista or []:
        meus = confronto.get("hero_ids") or []
        inimigos = confronto.get("enemy_hero_ids") or []
        partidas = confronto.get("matches_played") or 0
        if partidas <= 0:
            continue
        nosso_ganhou = confronto.get("wins") or 0
        sinal = 1
        if hero_id not in meus:
            if hero_id not in inimigos:
                continue
            # o nosso herói estava do outro lado: inverte tudo
            meus, inimigos = inimigos, meus
            nosso_ganhou = partidas - nosso_ganhou
            sinal = -1
        almas = confronto.get("net_worth_diff")
        amostra = confronto.get("sample_matches") or 0
        for inimigo in inimigos:
            if not inimigo:
                continue
            dado = soma.setdefault(inimigo, [0, 0, 0.0, 0])
            dado[0] += partidas
            dado[1] += nosso_ganhou
            if almas is not None and amostra > 0:
                dado[2] += almas * sinal * amostra
                dado[3] += amostra
    return soma


def ordem_das_habilidades(lista, id_para_numero):
    """Monta 'o que upar primeiro', nível por nível.

    Cada item da lista é uma sequência de upar diferente (com o número de
    partidas que usaram aquela sequência). Somamos tudo e, em cada nível,
    vemos qual habilidade a maioria escolheu.
    """
    pesos = {}
    for sequencia in lista or []:
        habilidades = sequencia.get("abilities") or []
        partidas = sequencia.get("matches") or 0
        if partidas <= 0:
            continue
        for nivel, habilidade in enumerate(habilidades[:TOTAL_NIVEIS]):
            if habilidade not in id_para_numero:
                continue            # "Melee" e outras que não são as 4 do herói
            linha = pesos.setdefault(nivel, {})
            linha[habilidade] = linha.get(habilidade, 0) + partidas

    saida = []
    for nivel in range(TOTAL_NIVEIS):
        linha = pesos.get(nivel)
        if not linha:
            break
        total = sum(linha.values())
        melhor, quantas = max(linha.items(), key=lambda par: par[1])
        saida.append([id_para_numero[melhor], int(round(quantas * 100.0 / total))])
    return saida


def main():
    print("Buscando os dados reais de habilidades, duplas e rota ...")

    herois = ler_herois()
    try:
        api_herois = baixar(API + "/v1/assets/heroes")
        itens = baixar(API + "/v1/assets/items")
    except Exception as erro:
        print("ERRO: {}".format(erro))
        print("AVISO: data/hero-analytics.js nao foi alterado.")
        return 1

    # nome oficial -> id do herói
    id_por_nome = {}
    for h in api_herois:
        if isinstance(h, dict) and h.get("name"):
            id_por_nome[str(h["name"]).strip().lower()] = h.get("id")

    # habilidades de cada herói: id da habilidade -> nome em inglês
    hab_por_heroi = {}
    for item in itens:
        if not isinstance(item, dict) or str(item.get("type")).lower() != "ability":
            continue
        donos = item.get("heroes") or []
        if len(donos) != 1:
            continue
        hab_por_heroi.setdefault(donos[0], {})[item.get("id")] = str(item.get("name") or "").strip()

    # As duplas saem todas de uma vez só (a API não filtra por herói aqui) e
    # depois a gente separa por herói. Assim é 1 pedido em vez de 43.
    try:
        sinergia_global = baixar("{}/v1/analytics/hero-synergy-stats?min_matches={}".format(API, MIN_DUPLA))
    except Exception as erro:
        print("AVISO: nao consegui pegar as duplas ({})".format(str(erro)[:70]))
        sinergia_global = []

    dados = {}
    sem_dados = []
    for heroi in herois:
        nome = str(heroi.get("name") or "").strip()
        apelido = slug(nome)
        if heroi.get("soon") or not nome or not apelido:
            continue
        hero_id = id_por_nome.get(nome.lower())
        if not hero_id:
            sem_dados.append(nome + " (sem id)")
            continue

        # liga o id da habilidade da API ao número da habilidade no nosso site
        # (1 = primeira da lista, e assim por diante), casando pelo nome em inglês
        nome_para_numero = {}
        for indice, sk in enumerate(heroi.get("skills") or []):
            for chave in (sk.get("name_en"), sk.get("name")):
                if chave:
                    nome_para_numero[str(chave).strip().lower()] = indice + 1
        id_para_numero = {}
        for hab_id, hab_nome in (hab_por_heroi.get(hero_id) or {}).items():
            numero = nome_para_numero.get(hab_nome.lower())
            if numero:
                id_para_numero[hab_id] = numero
        if len(id_para_numero) < 3:
            # quase sempre é um nome em inglês errado no heroes-data.js
            print("      (aviso) {}: so {} habilidades casaram pelo nome em ingles - confira o \"name_en\"".format(
                nome, len(id_para_numero)))

        registro = {}
        problemas = []

        # 1) ordem das habilidades
        if id_para_numero:
            try:
                ordem = ordem_das_habilidades(
                    baixar("{}/v1/analytics/ability-order-stats?hero_id={}&min_matches={}".format(
                        API, hero_id, MIN_SEQUENCIA)),
                    id_para_numero)
                if ordem:
                    registro["ordem"] = ordem
            except Exception as erro:
                problemas.append("ordem: {}".format(str(erro)[:60]))
            time.sleep(0.25)

        # 2) melhores duplas (e as piores)
        try:
            duplas = juntar_duplas(sinergia_global, hero_id)
            boas, ruins = [], []
            for outro, (partidas, vitorias) in duplas.items():
                if partidas < MIN_DUPLA:
                    continue
                taxa = round(vitorias * 100.0 / partidas, 1)
                boas.append([outro, taxa, partidas])
                if partidas >= MIN_DUPLA_RUIM:
                    ruins.append([outro, taxa, partidas])
            boas.sort(key=lambda x: (-x[1], -x[2]))
            ruins.sort(key=lambda x: (x[1], -x[2]))
            if boas:
                registro["duplas"] = boas[:TOTAL_DUPLAS]
            if ruins:
                registro["duplasRuins"] = ruins[:TOTAL_DUPLAS_RUINS]
        except Exception as erro:
            problemas.append("duplas: {}".format(str(erro)[:60]))
        time.sleep(0.25)

        # 3) confrontos de rota
        try:
            rota = juntar_rota(
                baixar("{}/v1/analytics/lane-matchup-stats?hero_ids={}&min_matches={}".format(
                    API, hero_id, MIN_ROTA_BUSCA)), hero_id)
            lista = []
            for inimigo, (partidas, vitorias, soma_almas, amostra) in rota.items():
                if partidas < MIN_ROTA:
                    continue
                almas = int(round(soma_almas / amostra)) if amostra else None
                lista.append([inimigo, round(vitorias * 100.0 / partidas, 1), partidas, almas])
            lista.sort(key=lambda x: (x[1], -x[2]))
            if lista:
                registro["rota"] = lista[:TOTAL_ROTA]
                registro["rotaBoas"] = list(reversed(lista[-3:])) if len(lista) > TOTAL_ROTA else []
        except Exception as erro:
            problemas.append("rota: {}".format(str(erro)[:60]))
        time.sleep(0.25)

        if registro:
            dados[apelido] = registro
            print("   {} -> {} niveis, {} duplas, {} confrontos".format(
                nome, len(registro.get("ordem") or []), len(registro.get("duplas") or []),
                len(registro.get("rota") or [])))
        else:
            sem_dados.append(nome)
        for p in problemas:
            print("      (aviso) {}: {}".format(nome, p))

    if not dados:
        print("AVISO: a API nao devolveu nada util. data/hero-analytics.js nao foi alterado.")
        return 1

    agora = datetime.datetime.now().strftime("%d/%m/%Y as %H:%M")
    escrever({
        "updated": agora,
        "fonte": "deadlock-api.com",
        "minimos": {"dupla": MIN_DUPLA, "rota": MIN_ROTA},
        "herois": dados,
    }, agora)

    print()
    print("OK! {} herois com dados reais em data/hero-analytics.js".format(len(dados)))
    if sem_dados:
        print("   sem dados suficientes: {}".format(", ".join(sem_dados[:12])))
    return 0


if __name__ == "__main__":
    sys.exit(main())

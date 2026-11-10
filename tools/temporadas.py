# -*- coding: utf-8 -*-
"""
Descobre qual temporada ranqueada do Deadlock esta valendo.

A deadlock-api publica em /v1/assets/ranked-seasons o ID do leaderboard de
cada temporada. Quando uma temporada nova comeca, o leaderboard dela fica
quase vazio por alguns dias (os jogadores ainda precisam calibrar). Para o
site nao ficar sem ranking, os scripts usam a temporada atual quando ela ja
tem jogadores suficientes; senao, mostram a ultima temporada completa, com
um aviso claro na tela.

Nada aqui e inventado: os IDs e as datas vem da propria API.
"""

import datetime
import json
import urllib.request

API = "https://api.deadlock-api.com"
CABECALHO = {"User-Agent": "CentralDeadlock/1.0 (fansite em portugues)"}

# Quantas entradas uma regiao precisa ter para a temporada ser considerada
# "com gente". Abaixo disso, preferimos a temporada anterior completa.
MINIMO = 20


def baixar_json(caminho, tentativas=3):
    url = API + caminho
    ultimo = None
    for _ in range(tentativas):
        try:
            pedido = urllib.request.Request(url, headers=CABECALHO)
            with urllib.request.urlopen(pedido, timeout=60) as resposta:
                return json.loads(resposta.read().decode("utf-8"))
        except Exception as erro:  # noqa: BLE001 - rede pode falhar de varias formas
            ultimo = erro
    raise RuntimeError("nao consegui baixar {} ({})".format(url, ultimo))


def listar():
    """Temporadas em ordem, da mais antiga para a mais nova."""
    dados = baixar_json("/v1/assets/ranked-seasons")
    temporadas = []
    for item in dados or []:
        nome = item.get("name") or item.get("class_name") or "Temporada"
        for intervalo in item.get("intervals") or []:
            inicio = int(intervalo.get("start_timestamp") or 0)
            fim = int(intervalo.get("end_timestamp") or 0)
            ident = intervalo.get("leaderboard_id")
            if not ident or not inicio:
                continue
            temporadas.append({
                "id": int(ident),
                "nome": str(nome),
                "inicio": inicio,
                "fim": fim,
            })
    temporadas.sort(key=lambda t: t["inicio"])
    return temporadas


def atual(temporadas=None, agora=None):
    """Temporada valendo agora. Se estiver entre temporadas, devolve a ultima."""
    temporadas = temporadas if temporadas is not None else listar()
    if not temporadas:
        return None
    agora = agora or int(datetime.datetime.now(datetime.timezone.utc).timestamp())
    for temporada in temporadas:
        if temporada["inicio"] <= agora < temporada["fim"]:
            return temporada
    iniciadas = [t for t in temporadas if t["inicio"] <= agora]
    return iniciadas[-1] if iniciadas else temporadas[-1]


def anterior(temporadas, alvo):
    """Temporada imediatamente anterior a 'alvo' (ou None)."""
    if not alvo:
        return None
    anteriores = [t for t in temporadas if t["inicio"] < alvo["inicio"]]
    return anteriores[-1] if anteriores else None


def resumo(temporada):
    """Dados curtos para gravar no JSON do site."""
    if not temporada:
        return {}
    return {
        "id": temporada["id"],
        "nome": temporada["nome"],
        "inicio": datetime.datetime.fromtimestamp(
            temporada["inicio"], datetime.timezone.utc).strftime("%d/%m/%Y"),
    }

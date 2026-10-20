# -*- coding: utf-8 -*-
"""
Grava em data/top-jogadores.js os MELHORES JOGADORES DE CADA HEROI.

De onde vêm os dados:

    deadlock-api.com -> /v1/leaderboard/<REGIAO>/<ID DO HEROI>
    O proprio jogo publica um ranking separado para cada heroi em cada regiao.

O robo do GitHub roda de hora em hora, mas esta lista muda devagar: por isso o
script visita a API UMA VEZ POR DIA (sao 215 consultas, feitas em paralelo).
Nas outras vezes ele para aqui e nem chega a consultar a API.

Se a busca falhar (ou voltar quase vazia), o arquivo antigo e mantido: nunca
apagamos o top de um heroi por causa de uma falha de rede.

Como usar:
    python tools/update-top-jogadores.py            busca (so se ainda nao buscou hoje)
    python tools/update-top-jogadores.py --forcar   busca de novo, mesmo se ja buscou hoje

E rodado sozinho pelo robo do GitHub.
"""

import concurrent.futures
import datetime
import gzip
import json
import os
import re
import ssl
import sys
import urllib.request

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAIDA = os.path.join(BASE, "data", "top-jogadores.js")
API = "https://api.deadlock-api.com/v1"

# regioes do jogo (codigo usado pela API -> nome que aparece no site)
REGIOES = [
    ("Europe", "Europa"),
    ("NAmerica", "América do Norte"),
    ("SAmerica", "América do Sul"),
    ("Asia", "Ásia"),
    ("Oceania", "Oceania"),
]

TOP = 5              # quantos jogadores guardar por heroi/regiao
REQUISICOES = 6      # quantas consultas ao mesmo tempo (sem sobrecarregar a API)
TENTATIVAS = 2       # quantas vezes tentar cada consulta

CABECALHO = {
    "User-Agent": "CentralDeadlock/1.0 (fansite em portugues; hypedz.github.io/central-deadlock)",
    "Accept": "application/json",
    "Accept-Encoding": "gzip",
}


def contexto_seguro():
    """Contexto SSL sem a checagem antiga (alguns PCs com certificado vencido)."""
    try:
        return ssl._create_unverified_context()
    except Exception:
        return None


def baixar_json(url):
    """Baixa e devolve o JSON da URL (com gzip e identificacao do site)."""
    pedido = urllib.request.Request(url, headers=CABECALHO)
    with urllib.request.urlopen(pedido, timeout=40, context=contexto_seguro()) as resposta:
        bruto = resposta.read()
        if resposta.headers.get("Content-Encoding") == "gzip":
            bruto = gzip.decompress(bruto)
    return json.loads(bruto.decode("utf-8"))


def ja_busquei_hoje():
    """A lista muda devagar: uma visita por dia basta (e sao muitas consultas)."""
    if not os.path.exists(SAIDA):
        return False
    try:
        with open(SAIDA, encoding="utf-8") as arquivo:
            texto = arquivo.read()
    except Exception:
        return False

    achado = re.search(r'"updated":"(\d{2})/(\d{2})/(\d{4})', texto)
    if not achado:
        return False

    hoje = datetime.datetime.now()
    return (achado.group(3) == str(hoje.year)
            and achado.group(2) == "{:02d}".format(hoje.month)
            and achado.group(1) == "{:02d}".format(hoje.day))


def herois_da_api():
    """Devolve {id: nome} so dos herois que ja podem ser escolhidos no jogo."""
    lista = baixar_json("{}/assets/heroes".format(API))
    herois = {}
    for heroi in lista or []:
        if not isinstance(heroi, dict):
            continue
        if not heroi.get("player_selectable") or heroi.get("disabled"):
            continue
        herois[int(heroi["id"])] = str(heroi.get("name") or "").strip()
    return herois


def buscar_top(regiao, heroi_id):
    """Top jogadores de um heroi numa regiao -> [[nome, posicao], ...]."""
    url = "{}/leaderboard/{}/{}?region={}".format(API, regiao, heroi_id, regiao)
    ultimo_erro = None
    for _ in range(TENTATIVAS):
        try:
            dados = baixar_json(url)
            entradas = (dados or {}).get("entries") or []
            lista = []
            for entrada in entradas[:TOP]:
                nome = str(entrada.get("account_name") or "").strip()
                if not nome:
                    continue
                lista.append([nome, int(entrada.get("rank") or len(lista) + 1)])
            return lista, None
        except Exception as erro:
            ultimo_erro = erro
    return [], ultimo_erro


def main():
    forcar = "--forcar" in sys.argv or "--refazer" in sys.argv

    if not forcar and ja_busquei_hoje():
        print("Ja busquei o top de jogadores hoje - esta lista muda devagar, entao parei aqui.")
        print("   (para buscar de novo agora: python tools/update-top-jogadores.py --forcar)")
        return 0

    print("Buscando os melhores jogadores de cada heroi (deadlock-api.com) ...")
    try:
        herois = herois_da_api()
    except Exception as erro:
        print("ERRO: nao consegui falar com a deadlock-api.com: {}".format(erro))
        print("AVISO: o data/top-jogadores.js antigo foi mantido.")
        return 1

    if not herois:
        print("AVISO: a API nao devolveu a lista de herois. Nada foi alterado.")
        return 1

    # lista de consultas: cada heroi x cada regiao
    consultas = [(codigo, heroi_id) for codigo, _ in REGIOES for heroi_id in herois]
    print("   {} herois x {} regioes = {} consultas ({} por vez)".format(
        len(herois), len(REGIOES), len(consultas), REQUISICOES))

    resultados, falhas = {}, 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=REQUISICOES) as pool:
        futuros = {pool.submit(buscar_top, codigo, heroi_id): (codigo, heroi_id)
                   for codigo, heroi_id in consultas}
        for futuro in concurrent.futures.as_completed(futuros):
            codigo, heroi_id = futuros[futuro]
            try:
                lista, erro = futuro.result()
            except Exception as erro:
                lista, erro = [], erro
            if erro is not None:
                falhas += 1
                continue
            if lista:
                resultados.setdefault(str(heroi_id), {})[codigo] = lista

    if not resultados:
        print("AVISO: a API nao devolveu nenhum jogador desta vez.")
        print("       O data/top-jogadores.js antigo foi mantido.")
        return 1

    if falhas > len(consultas) * 0.2:
        print("AVISO: {} de {} consultas falharam. Para nao gravar uma lista incompleta,".format(falhas, len(consultas)))
        print("       o data/top-jogadores.js antigo foi mantido.")
        return 1

    agora = datetime.datetime.now().strftime("%d/%m/%Y as %H:%M")
    dados = {
        "updated": agora,
        "fonte": "deadlock-api.com",
        "regioes": {codigo: nome for codigo, nome in REGIOES},
        "herois": resultados,
    }

    cabecalho = (
        "/* ATENCAO: arquivo gerado automaticamente pelo script tools/update-top-jogadores.py\n"
        "   Nao edite na mao: as mudancas sao perdidas na proxima atualizacao.\n"
        "   Melhores jogadores de cada heroi, por regiao (ranking do proprio jogo).\n"
        "   Fonte: deadlock-api.com\n"
        "   Ultima atualizacao: {} */\n"
    ).format(agora)

    with open(SAIDA, "w", encoding="utf-8") as arquivo:
        arquivo.write(cabecalho + "window.TOP_JOGADORES = "
                      + json.dumps(dados, ensure_ascii=False, separators=(",", ":")) + ";\n")

    total = sum(len(lista) for regioes in resultados.values() for lista in regioes.values())
    print("OK! {} herois com top de jogadores ({} nomes) em data/top-jogadores.js".format(
        len(resultados), total))
    if falhas:
        print("   ({} consulta(s) falharam e ficaram de fora desta rodada)".format(falhas))
    return 0


if __name__ == "__main__":
    sys.exit(main())

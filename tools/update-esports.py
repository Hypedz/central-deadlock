# -*- coding: utf-8 -*-
"""
Escreve os TORNEIOS de Deadlock de verdade no arquivo data/esports.js.

De onde vêm os dados:

    Liquipedia (liquipedia.net/deadlock) -> a página Portal:Tournaments lista
    os próximos torneios e os resultados recentes, com o logo de cada torneio,
    a data, o prêmio, o país/região e quem venceu.

O jogo não tem uma API de esports, então a Liquipedia é a fonte pública que
usamos. Ela pede que a gente se identifique e não faça muitas visitas: aqui é
uma única visita, e o robô do GitHub só roda isso uma vez por dia.

Como usar:
    python tools/update-esports.py

É rodado sozinho pelo robô do GitHub.
"""

import datetime
import gzip
import json
import os
import re
import ssl
import urllib.request

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAIDA = os.path.join(BASE, "data", "esports.js")

PAGINA = "Portal:Tournaments"
API = "https://liquipedia.net/deadlock/api.php?action=parse&page=Portal:Tournaments&prop=text&format=json"
SITE = "https://liquipedia.net"
FONTE = "Liquipedia (liquipedia.net/deadlock)"
FONTE_URL = "https://liquipedia.net/deadlock/Portal:Tournaments"

# A Liquipedia pede um "User-Agent" dizendo quem somos e como falar com a gente.
NAVEGADOR = "CentralDeadlockBot/1.0 (https://hypedz.github.io/central-deadlock/; fansite em portugues)"

MAX_PROXIMOS = 6
MAX_RESULTADOS = 12

MESES_EN = {
    "jan": "jan", "feb": "fev", "mar": "mar", "apr": "abr", "may": "mai", "jun": "jun",
    "jul": "jul", "aug": "ago", "sep": "set", "oct": "out", "nov": "nov", "dec": "dez"
}

MESES_CURTOS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]


# --------------------------- utilidades ---------------------------

def contexto_seguro():
    """Usa a lista de certificados do 'certifi' quando ela existe (alguns
    computadores têm a lista do Windows desatualizada e recusam o site)."""
    try:
        import certifi
        return ssl.create_default_context(cafile=certifi.where())
    except Exception:
        return ssl.create_default_context()


def baixar(url):
    # A Liquipedia exige que a resposta venha compactada (gzip).
    pedido = urllib.request.Request(url, headers={
        "User-Agent": NAVEGADOR,
        "Accept-Encoding": "gzip"
    })

    def ler(resposta):
        dados = resposta.read()
        if (resposta.headers.get("Content-Encoding") or "").lower() == "gzip":
            dados = gzip.decompress(dados)
        return dados.decode("utf-8")

    try:
        with urllib.request.urlopen(pedido, timeout=60, context=contexto_seguro()) as resposta:
            return ler(resposta)
    except Exception as erro:
        # Último recurso: se a verificação do certificado falhar neste computador,
        # tenta de novo sem verificar (a página é pública e só de leitura).
        if "CERTIFICATE" not in str(erro).upper():
            raise
        print("   (aviso: certificado recusado, tentando sem verificar: {})".format(erro))
        sem_verificar = ssl.create_default_context()
        sem_verificar.check_hostname = False
        sem_verificar.verify_mode = ssl.CERT_NONE
        with urllib.request.urlopen(pedido, timeout=60, context=sem_verificar) as resposta:
            return ler(resposta)


def limpar_html(texto):
    """Tira as etiquetas e deixa só o texto da célula."""
    texto = re.sub(r"<[^>]+>", " ", texto)
    texto = texto.replace("&#160;", " ").replace("&nbsp;", " ").replace("&amp;", "&")
    texto = texto.replace("&#95;", "_").replace("&quot;", '"')
    return re.sub(r"\s+", " ", texto).strip()


def data_pt(texto):
    """'Nov 14-15, 2026' -> '14-15 nov 2026' (no jeito brasileiro)."""
    texto = (texto or "").strip()
    if not texto:
        return ""

    def mes(nome):
        return MESES_EN.get(str(nome).lower()[:3], str(nome))

    def dia(valor):
        return str(int(valor))

    tabela = [
        (r"^([A-Za-z]{3})\.?\s+(\d{1,2})\s*[–—-]\s*([A-Za-z]{3})\.?\s+(\d{1,2}),?\s*(\d{4})$",
         lambda m: "{} {} – {} {} {}".format(dia(m.group(2)), mes(m.group(1)), dia(m.group(4)), mes(m.group(3)), m.group(5))),
        (r"^([A-Za-z]{3})\.?\s+(\d{1,2})\s*[–—-]\s*(\d{1,2}),?\s*(\d{4})$",
         lambda m: "{}-{} {} {}".format(dia(m.group(2)), dia(m.group(3)), mes(m.group(1)), m.group(4))),
        (r"^([A-Za-z]{3})\.?\s+(\d{1,2}),?\s*(\d{4})$",
         lambda m: "{} {} {}".format(dia(m.group(2)), mes(m.group(1)), m.group(3))),
    ]
    for padrao, montar in tabela:
        casa = re.match(padrao, texto)
        if casa:
            return montar(casa)
    return texto


def tier_curto(texto):
    """'C-Tier' ou 'Mon. ( C-Tier )' -> 'C'."""
    achado = re.search(r"([SABCD])\s*-?\s*Tier", texto or "", re.IGNORECASE)
    if achado:
        return achado.group(1).upper()
    achado = re.search(r"\b([SABCD])\b", texto or "")
    return achado.group(1).upper() if achado else ""


# --------------------------- ler a página ---------------------------

def chave_de_data(texto):
    """'Nov 14-15, 2026' -> '20261114' (só para ordenar, do mais novo para o mais velho)."""
    meses = {"jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
             "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12}
    texto = (texto or "").strip()
    ano = re.search(r"(\d{4})", texto)
    nome_mes = re.search(r"([A-Za-z]{3})", texto)
    dia = re.search(r"(\d{1,2})", texto)
    return "{}{:02d}{:02d}".format(
        ano.group(1) if ano else "0000",
        meses.get(nome_mes.group(1).lower() if nome_mes else "", 0),
        int(dia.group(1)) if dia else 0)


def linhas_da_secao(html_secao):
    """Devolve as linhas da tabela da seção já em listas de texto."""
    linhas = html_secao.split('<tr class="table2&#95;&#95;row--body">')[1:]
    saida = []
    for linha in linhas:
        corpo = linha.split("</tr>")[0]
        celulas = [limpar_html(c.split(">", 1)[1].split("</td>")[0]) if ">" in c else ""
                   for c in corpo.split("<td")[1:]]
        if len(celulas) < 7:
            continue
        logo = re.search(r'<img alt="[^"]*" src="([^"]+)"', corpo)
        # o link do torneio fica na célula do nome (não no link do tier)
        link = re.search(r'column&#95;&#95;tournament[^>]*>\s*<a href="([^"]+)"', corpo) \
            or re.search(r'href="(/deadlock/[^"#]+)"', corpo)
        saida.append({
            "celulas": celulas,
            "logo": (SITE + logo.group(1)) if logo else "",
            "url": (SITE + link.group(1)) if link else FONTE_URL
        })
    return saida


def conferir(celulas, bruto):
    """Uma linha da tabela tem: tier, [logo], nome, data, premio, local, P#, campeao, vice."""
    chave = chave_de_data(celulas[3])
    return {
        "tier": tier_curto(celulas[0]),
        "nome": celulas[2].strip(),
        "data": data_pt(celulas[3]),
        "ordem": chave,
        "iso": "{}-{}-{}".format(chave[:4], chave[4:6], chave[6:]),
        "premio": celulas[4].strip(),
        "local": celulas[5].strip(),
        "times": celulas[6].strip(),
        "campeao": celulas[7].strip() if len(celulas) > 7 else "",
        "vice": celulas[8].strip() if len(celulas) > 8 else ""
    }


def main():
    bruto = None
    try:
        bruto = json.loads(baixar(API))
    except Exception as erro:
        print("   (aviso: nao consegui falar com a Liquipedia: {})".format(erro))

    html = ((bruto or {}).get("parse") or {}).get("text") or {}
    html = html.get("*") if isinstance(html, dict) else html

    secoes = {}
    if html:
        partes = re.split(r'<h3 id="([^"]+)"', html)
        for i in range(1, len(partes), 2):
            secoes[partes[i]] = partes[i + 1]

    proximos, resultados = [], []

    if secoes.get("Upcoming"):
        for linha in linhas_da_secao(secoes["Upcoming"]):
            torneio = conferir(linha["celulas"], linha)
            torneio["logo"] = linha["logo"]
            torneio["url"] = linha["url"]
            proximos.append(torneio)

    recentes = []
    for chave in ("Five_Most_Recent", "S-Tier_and_A-Tier", "B-Tier_and_C-Tier"):
        if not secoes.get(chave):
            continue
        for linha in linhas_da_secao(secoes[chave]):
            torneio = conferir(linha["celulas"], linha)
            torneio["logo"] = linha["logo"]
            torneio["url"] = linha["url"]
            if torneio["campeao"] and torneio["campeao"].lower() not in ("tbd", "cancelled"):
                recentes.append(torneio)

    # tira os repetidos (o mesmo torneio aparece em mais de uma tabela)
    vistos = set()
    for torneio in recentes:
        chave = (torneio["nome"].lower(), torneio["data"])
        if chave in vistos:
            continue
        vistos.add(chave)
        resultados.append(torneio)

    # os próximos vêm do mais distante para o mais perto: invertendo, o mais perto fica na frente
    proximos.reverse()
    # e os resultados ficam do mais novo para o mais velho
    resultados.sort(key=lambda t: t["ordem"], reverse=True)

    proximos = proximos[:MAX_PROXIMOS]
    resultados = resultados[:MAX_RESULTADOS]
    for torneio in proximos + resultados:
        torneio.pop("ordem", None)

    agora = datetime.datetime.now()
    atualizado = "{}/{}/{} as {:02d}:{:02d}".format(agora.day, agora.month, agora.year, agora.hour, agora.minute)

    dados = {
        "updated": atualizado,
        "fonte": FONTE,
        "fonteUrl": FONTE_URL,
        "proximos": proximos,
        "resultados": resultados
    }

    cabecalho = (
        "/* ATENCAO: arquivo gerado automaticamente pelo script tools/update-esports.py\n"
        "   Nao edite na mao: as mudancas sao perdidas na proxima atualizacao.\n"
        "   Torneios e resultados REAIS de Deadlock, vindos da Liquipedia\n"
        "   (liquipedia.net/deadlock - conteudo sob licenca CC-BY-SA 3.0).\n"
        "   Ultima atualizacao: {} */\n"
    ).format(atualizado)

    with open(SAIDA, "w", encoding="utf-8") as arquivo:
        arquivo.write(cabecalho + "window.ESPORTS = " + json.dumps(dados, ensure_ascii=False, separators=(",", ":")) + ";\n")

    print("Esports atualizado: {} proximos e {} resultados (data/esports.js)".format(len(proximos), len(resultados)))


if __name__ == "__main__":
    main()

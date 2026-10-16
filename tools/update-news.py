# -*- coding: utf-8 -*-
"""
Busca as notícias oficiais do Deadlock no Steam e grava o arquivo
data/steam-news.js (usado pelo site).

Como usar:
    python tools/update-news.py

No Windows, você também pode dar dois cliques em: atualizar-noticias.bat
"""

import datetime
import json
import os
import re
import sys
import urllib.request

# App ID do Deadlock na Steam (não mude)
APPID = "1422450"
QUANTOS = 40

API = ("https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/"
       "?appid={appid}&count={count}&maxlength=0&format=json")

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PASTA = os.path.join(BASE, "data")
SAIDA = os.path.join(PASTA, "steam-news.js")

MESES = ["jan", "fev", "mar", "abr", "mai", "jun",
         "jul", "ago", "set", "out", "nov", "dez"]

# quanto texto guardar de cada notícia (para o site não ficar gigante)
MAX_LINHAS = 40
MAX_LINHA = 300


def limpar_html(texto):
    """Remove tags/links do texto que vem do Steam, mantendo as quebras de linha."""
    t = texto or ""
    t = t.replace("\r\n", "\n").replace("\r", "\n")
    t = re.sub(r"<\s*br\s*/?\s*>", "\n", t, flags=re.I)
    t = re.sub(r"</\s*(p|div|li|h[1-6])\s*>", "\n", t, flags=re.I)
    # imagens e links internos do Steam não servem aqui
    t = re.sub(r"\{STEAM_CLAN[_A-Z]*_IMAGE\}[^\s]*", " ", t)
    t = re.sub(r"\[img\][^\[]*\[/img\]", " ", t, flags=re.I)
    t = re.sub(r"\[url=([^\]]+)\]([^\[]*)\[/url\]", r"\2", t, flags=re.I)
    t = re.sub(r"\[/?(b|i|u|p|div|br|h[1-6]|list|\*|hr|quote|code|spoiler|center|table|tr|td)[^\]]*\]", " ", t, flags=re.I)
    t = re.sub(r"<[^>]+>", " ", t)
    # entidades mais comuns
    for a, b in (("&nbsp;", " "), ("&amp;", "&"), ("&quot;", '"'),
                 ("&#39;", "'"), ("&lt;", "<"), ("&gt;", ">"), ("\u200b", "")):
        t = t.replace(a, b)
    return t


def em_linhas(texto):
    """Transforma o texto em uma lista de linhas limpas."""
    saida = []
    for linha in texto.split("\n"):
        linha = re.sub(r"[ \t]+", " ", linha).strip()
        linha = linha.lstrip("-*\u2022 ").strip()
        if not linha:
            continue
        if len(linha) > MAX_LINHA:
            linha = linha[:MAX_LINHA].rstrip() + "..."
        saida.append(linha)
        if len(saida) >= MAX_LINHAS:
            break
    return saida


def baixar_json(url):
    pedido = urllib.request.Request(url, headers={"User-Agent": "CentralDeadlock/1.0"})
    with urllib.request.urlopen(pedido, timeout=30) as resposta:
        return json.loads(resposta.read().decode("utf-8"))


def main():
    print("Buscando noticias do Deadlock (app {}) ...".format(APPID))
    try:
        dados = baixar_json(API.format(appid=APPID, count=QUANTOS))
    except Exception as erro:
        print("ERRO: nao consegui falar com o Steam: {}".format(erro))
        return 1

    noticias = dados.get("appnews", {}).get("newsitems", []) or []
    itens = []

    for n in noticias:
        # mantem apenas os posts oficiais da Valve (ignora sites de imprensa)
        feed = (n.get("feedlabel") or "").strip()
        if feed and feed != "Community Announcements":
            continue

        tags = n.get("tags") or []
        linhas = em_linhas(limpar_html(n.get("contents")))
        if not linhas:
            continue

        ts = int(n.get("date") or 0)
        quando = datetime.datetime.fromtimestamp(ts, datetime.timezone.utc)
        patch = "patchnotes" in tags

        resumo = " ".join(linhas)[:190].rstrip()
        if len(" ".join(linhas)) > 190:
            resumo += "..."

        itens.append({
            "id": "s{}".format(n.get("gid") or ts),
            "title": (n.get("title") or "").strip() or "Atualizacao do Deadlock",
            "url": n.get("url") or "",
            "ts": ts,
            "date": "{:02d} {} {}".format(quando.day, MESES[quando.month - 1], quando.year),
            "cat": "Patch Notes" if patch else "Steam",
            "patch": patch,
            "desc": resumo,
            "lines": linhas,
        })

    if not itens:
        print("AVISO: nenhuma noticia oficial encontrada. O arquivo nao foi alterado.")
        return 1

    agora = datetime.datetime.now().strftime("%d/%m/%Y as %H:%M")
    conteudo = (
        "/* ATENCAO: arquivo gerado automaticamente pelo script tools/update-news.py\n"
        "   Nao edite na mao: as mudancas sao perdidas na proxima atualizacao.\n"
        "   Ultima atualizacao: {} */\n"
        "window.STEAM_NEWS = {};\n"
    ).format(agora, json.dumps({"updated": agora, "count": len(itens), "items": itens},
                               ensure_ascii=False, indent=1))

    os.makedirs(PASTA, exist_ok=True)
    with open(SAIDA, "w", encoding="utf-8") as arquivo:
        arquivo.write(conteudo)

    print("OK! {} noticias salvas em data/steam-news.js".format(len(itens)))
    for n in itens[:5]:
        print("   - [{}] {}".format(n["date"], n["title"]))
    return 0


if __name__ == "__main__":
    sys.exit(main())

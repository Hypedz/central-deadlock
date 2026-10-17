# -*- coding: utf-8 -*-
"""
Busca as notícias oficiais do Deadlock no Steam, TRADUZ para português e
grava o arquivo data/steam-news.js (usado pelo site).

Como usar:
    python tools/update-news.py

No Windows, você também pode dar dois cliques em: atualizar-noticias.bat

A tradução é feita de graça pelo tradutor do Google (sem precisar de chave)
e fica guardada em data/traducao-cache.json, para nunca traduzir a mesma
notícia duas vezes. Se a tradução falhar, o site mostra o texto original
em inglês — nada quebra.
"""

import concurrent.futures
import datetime
import hashlib
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

# App ID do Deadlock na Steam (não mude)
APPID = "1422450"
QUANTOS = 40

API = ("https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/"
       "?appid={appid}&count={count}&maxlength=0&format=json")

# tradutor gratuito do Google (não precisa de chave nem cadastro)
TRADUTOR = ("https://translate.googleapis.com/translate_a/single"
            "?client=gtx&sl=en&tl=pt-BR&dt=t&q={texto}")

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PASTA = os.path.join(BASE, "data")
SAIDA = os.path.join(PASTA, "steam-news.js")
CACHE = os.path.join(PASTA, "traducao-cache.json")

MESES = ["jan", "fev", "mar", "abr", "mai", "jun",
         "jul", "ago", "set", "out", "nov", "dez"]

# quanto texto guardar de cada notícia (para o site não ficar gigante).
# O texto sai INTEIRO — sem cortar no meio da frase. Os limites abaixo são só
# uma trava de segurança para casos absurdos.
MAX_LINHAS = 80
MAX_LINHA = 3000

# quantas notícias (as mais novas) são traduzidas a cada rodada
TRADUZIR_ATE = 25
# quantas traduções ficam guardadas no cache
CACHE_MAX = 4000


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


def imagem_url(bruto):
    """Pega a primeira imagem da notícia (usada no Discord e nos cards)."""
    texto = bruto or ""
    achado = re.search(r"<img[^>]+src=\"([^\"]+)\"", texto, flags=re.I)
    if not achado:
        achado = re.search(r"\{STEAM_CLAN(?:_[A-Z]+)*_IMAGE\}([^\s\)\][]+)", texto)
    if not achado:
        return ""
    url = achado.group(1).strip().strip("\"'")
    if url.startswith("//"):
        return "https:" + url
    if not url.startswith("http"):
        return "https://clan.cloudflare.steamstatic.com/images" + url
    return url


def em_linhas(texto):
    """Transforma o texto em uma lista de linhas limpas (sem cortar o texto)."""
    saida = []
    for linha in texto.split("\n"):
        linha = re.sub(r"[ \t]+", " ", linha).strip()
        linha = linha.lstrip("-*\u2022 ").strip()
        if not linha:
            continue
        if len(linha) > MAX_LINHA:
            linha = linha[:MAX_LINHA].rstrip()
        saida.append(linha)
        if len(saida) >= MAX_LINHAS:
            break
    return saida


def baixar_json(url):
    pedido = urllib.request.Request(url, headers={"User-Agent": "CentralDeadlock/1.0"})
    with urllib.request.urlopen(pedido, timeout=30) as resposta:
        return json.loads(resposta.read().decode("utf-8"))


# --------------------------- tradução ---------------------------

def carregar_cache():
    try:
        with open(CACHE, encoding="utf-8") as arquivo:
            dados = json.load(arquivo)
        return dados if isinstance(dados, dict) else {}
    except Exception:
        return {}


def salvar_cache(cache):
    # guarda só as traduções mais recentes, para o arquivo não crescer demais
    if len(cache) > CACHE_MAX:
        for chave in list(cache)[:-CACHE_MAX]:
            cache.pop(chave, None)
    try:
        with open(CACHE, "w", encoding="utf-8") as arquivo:
            json.dump(cache, arquivo, ensure_ascii=False, indent=1)
    except Exception as erro:
        print("   (aviso: nao consegui salvar o cache de traducao: {})".format(erro))


def _traduzir_bruto(texto):
    url = TRADUTOR.format(texto=urllib.parse.quote(texto))
    pedido = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(pedido, timeout=25) as resposta:
        dados = json.loads(resposta.read().decode("utf-8"))
    partes = [p[0] for p in dados[0] if p and p[0]]
    return "".join(partes).strip()


def traduzir(texto, cache):
    """Traduz um texto (com cache). Devolve "" se não conseguir."""
    texto = (texto or "").strip()
    if not texto:
        return ""
    chave = hashlib.md5(texto.encode("utf-8")).hexdigest()
    if chave in cache:
        return cache[chave]
    try:
        traducao = _traduzir_bruto(texto)
        # tira sobras estranhas que o tradutor às vezes devolve
        traducao = traducao.replace("\n", " ").strip()
        if traducao:
            cache[chave] = traducao
        return traducao
    except Exception:
        return ""


def traduzir_lista(textos, cache):
    """Traduz vários textos de uma vez (em paralelo). Devolve a lista na mesma ordem."""
    textos = list(textos or [])
    if not textos:
        return []
    pendentes = []
    for t in textos:
        if t and hashlib.md5(t.encode("utf-8")).hexdigest() not in cache:
            pendentes.append(t)
    if pendentes:
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
            list(pool.map(lambda t: traduzir(t, cache), pendentes))
    return [cache.get(hashlib.md5(t.encode("utf-8")).hexdigest(), "") if t else "" for t in textos]


def main():
    #  --sem-traducao  =  gera o arquivo sem falar com o tradutor (mais rápido)
    sem_traducao = "--sem-traducao" in sys.argv

    print("Buscando noticias do Deadlock (app {}) ...".format(APPID))
    try:
        dados = baixar_json(API.format(appid=APPID, count=QUANTOS))
    except Exception as erro:
        print("ERRO: nao consegui falar com o Steam: {}".format(erro))
        return 1

    noticias = dados.get("appnews", {}).get("newsitems", []) or []
    itens = []
    cache = {} if sem_traducao else carregar_cache()
    traduzidas = 0

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

        titulo = (n.get("title") or "").strip() or "Atualizacao do Deadlock"

        # ---- traducao para portugues (nas mais novas) ----
        # traduz o titulo, o resumo (usado nos cards) e o TEXTO INTEIRO
        titulo_pt, resumo_pt, linhas_pt = "", "", []
        if not sem_traducao and len(itens) < TRADUZIR_ATE:
            titulo_pt = traduzir(titulo, cache)
            resumo_pt = traduzir(resumo, cache)
            linhas_pt = traduzir_lista(linhas, cache)
            if titulo_pt:
                traduzidas += 1

        itens.append({
            "id": "s{}".format(n.get("gid") or ts),
            "title": titulo,
            "title_pt": titulo_pt,
            "url": n.get("url") or "",
            "ts": ts,
            "date": "{:02d} {} {}".format(quando.day, MESES[quando.month - 1], quando.year),
            "cat": "Patch Notes" if patch else "Steam",
            "patch": patch,
            "image": imagem_url(n.get("contents")),
            "desc": resumo,
            "desc_pt": resumo_pt,
            "lines": linhas,
            "lines_pt": linhas_pt,
        })

    if not itens:
        print("AVISO: nenhuma noticia oficial encontrada. O arquivo nao foi alterado.")
        return 1

    if not sem_traducao:
        salvar_cache(cache)

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
    if not sem_traducao:
        print("   {} noticias traduzidas para portugues".format(traduzidas))
        if traduzidas == 0:
            print("   (aviso: o tradutor nao respondeu agora; o site mostra o texto em ingles)")
    for n in itens[:5]:
        print("   - [{}] {} / {}".format(n["date"], n["title"][:45], (n.get("title_pt") or "-")[:45]))
    return 0


if __name__ == "__main__":
    sys.exit(main())

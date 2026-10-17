# -*- coding: utf-8 -*-
"""
Gera uma PÁGINA PRÓPRIA (HTML) para cada herói e para cada notícia, além do
sitemap.xml. Isso ajuda o Google (e quem compartilha o link) a achar o conteúdo,
porque cada página tem título, descrição e texto de verdade.

Pasta gerada:
    heroi/<nome>.html
    noticia/<id>.html
    sitemap.xml

Como usar:
    python tools/gerar-paginas.py

É rodado sozinho pelo robô do GitHub depois de atualizar as notícias.
Nada aqui é digitado à mão: tudo sai de heroes-data.js e dos arquivos data/*.js.
"""

import datetime
import html
import json
import os
import re
import struct
import sys
import unicodedata

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://hypedz.github.io/central-deadlock/"
PASTA_HEROIS = os.path.join(BASE, "heroi")
PASTA_NOTICIAS = os.path.join(BASE, "noticia")

DIFF_LABEL = ["", "Fácil", "Médio", "Difícil"]


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


def e(texto):
    return html.escape(str(texto if texto is not None else ""), quote=True)


def moeda(valor):
    try:
        return "{:,}".format(int(valor)).replace(",", ".")
    except Exception:
        return str(valor)


def tamanho_da_arte(arquivo):
    """Le o tamanho de verdade do PNG (para a imagem nao ficar achatada).
    Se nao conseguir, devolve None e o navegador se vira."""
    caminho = os.path.join(BASE, "assets", "heroes", arquivo)
    try:
        with open(caminho, "rb") as aberto:
            cabeca = aberto.read(33)
        if cabeca[:8] == b"\x89PNG\r\n\x1a\n":
            largura, altura = struct.unpack(">II", cabeca[16:24])
            if 0 < largura < 20000 and 0 < altura < 20000:
                return largura, altura
    except Exception:
        pass
    return None


# --------------------------- moldura da página ---------------------------

def cabecalho(titulo, descricao, url, imagem, classe=""):
    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(titulo)}</title>
<meta name="description" content="{e(descricao)}">
<link rel="canonical" href="{e(url)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Central Deadlock">
<meta property="og:title" content="{e(titulo)}">
<meta property="og:description" content="{e(descricao)}">
<meta property="og:image" content="{e(imagem)}">
<meta property="og:url" content="{e(url)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{e(titulo)}">
<meta name="twitter:description" content="{e(descricao)}">
<meta name="twitter:image" content="{e(imagem)}">
<meta name="theme-color" content="#b6f24a">
<link rel="icon" type="image/svg+xml" href="../assets/brand/favicon.svg">
<link rel="apple-touch-icon" href="../assets/brand/icon-192.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<link rel="stylesheet" href="../style.css">
</head>
<body class="pg-body">
<div class="pg-wrap {classe}">"""


def rodape(voltar_para, voltar_nome):
    return f"""    <footer class="pg-foot">
        <a class="btn btn-lime pg-cta" href="{e(voltar_para)}"><i class="fa-solid fa-arrow-left"></i> {e(voltar_nome)}</a>
        <p>Central Deadlock é um site de fãs. Deadlock e todos os personagens são marcas da Valve Corporation.
        Este site não tem ligação com a Valve. Números reais de partidas, via <b>deadlock-api.com</b>.</p>
    </footer>
</div>
</body>
</html>
"""


def topo(secao_url, secao_nome, atual):
    return f"""    <header class="pg-top">
        <a class="pg-brand" href="../index.html"><img src="../assets/brand/icon-192.png" alt="Central Deadlock"><span>CENTRAL DEADLOCK</span></a>
        <nav class="pg-crumb"><a href="../index.html">Início</a> › <a href="../index.html#{e(secao_url)}">{e(secao_nome)}</a> › <b>{e(atual)}</b></nav>
    </header>
"""


# --------------------------- páginas dos heróis ---------------------------

def paginas_herois(herois, stats, jogo, hist):
    os.makedirs(PASTA_HEROIS, exist_ok=True)
    stats_herois = stats.get("herois") or {}
    ids = jogo.get("ids") or {}
    builds = jogo.get("builds") or {}
    contadores = jogo.get("contadores") or {}
    ban = jogo.get("ban") or {}
    ban_pos = jogo.get("banPos") or {}
    itens = jogo.get("itens") or {}
    semanas = (hist or {}).get("semanas") or []
    serie_hist = (hist or {}).get("herois") or {}

    def nome_de_id(ident):
        for nome, valor in ids.items():
            if str(valor) == str(ident):
                return nome
        return None

    def arquivo_de(nome):
        for h in herois:
            if h["name"] == nome:
                return h["file"]
        return ""

    gerados = []
    for h in herois:
        if h.get("soon"):
            continue
        s = stats_herois.get(h["name"]) or {}
        api_id = ids.get(h["name"])
        chave = str(api_id)
        titulo = f"{h['name']} — habilidades, stats e build real | Central Deadlock"
        descricao = (f"{h['name']} ({h['role']}): win rate real {s.get('win', h.get('win'))}%, "
                     f"habilidades, counters e as builds mais usadas. Dados de verdade, direto das partidas.")
        url = f"{SITE}heroi/{slug(h['name'])}.html"
        imagem = f"{SITE}assets/heroes/{h['file']}"
        pagina = [cabecalho(titulo, descricao, url, imagem, "pg-heroi"),
                  topo("herois", "Heróis", h["name"])]

        # ---------- bloco principal ----------
        tier = s.get("tier", h.get("tier", "?"))
        medida = tamanho_da_arte(h["file"])
        medida_txt = ' width="{}" height="{}"'.format(*medida) if medida else ''
        pagina.append(f"""        <article class="pg-hero">
            <img class="pg-art" src="../assets/heroes/{e(h['file'])}" alt="{e(h['name'])}"{medida_txt}>
            <div>
                <h1 class="pg-title">{e(h['name'])}</h1>
                <div class="pg-tags">
                    <span class="tag">{e(h['role'])}</span>
                    {f'<span class="tag vio">{e(h["arch"])}</span>' if h.get('arch') and h['arch'] != '—' else ''}
                    <span class="tag cy">Dificuldade: {e(DIFF_LABEL[h.get('diff', 0)])}</span>
                    <span class="tag">Tier {e(tier)}</span>
                </div>
                <p class="pg-desc">{e(h.get('desc'))}</p>
            </div>
        </article>
""")

        # ---------- números reais ----------
        if s:
            pagina.append(f"""        <h2 class="pg-sec"><i class="fa-solid fa-chart-simple"></i> Números reais</h2>
        <div class="pg-stats">
            <div class="pg-stat"><b>{e(s.get('win'))}%</b><small>win rate</small></div>
            <div class="pg-stat"><b>{e(s.get('pick', 0))}%</b><small>pick rate</small></div>
            <div class="pg-stat"><b>{e(s.get('kda'))}</b><small>KDA médio</small></div>
            <div class="pg-stat"><b>{moeda(s.get('partidas', 0))}</b><small>partidas</small></div>
            <div class="pg-stat"><b>{e(s.get('posicao', '?'))}º</b><small>no win rate</small></div>
            <div class="pg-stat"><b>{e(ban.get(chave, '0'))}%</b><small>banido{(' · ' + str(ban_pos[chave]) + 'º mais banido') if chave in ban_pos else ''}</small></div>
        </div>
        <div class="pg-stats" style="margin-top:12px">
            <div class="pg-stat"><b>{e(h.get('hp'))}</b><small>vida base</small></div>
            <div class="pg-stat"><b>{e(h.get('spd'))} m/s</b><small>velocidade</small></div>
        </div>
        <p class="stat-fonte"><i class="fa-solid fa-database"></i> {moeda(stats.get('partidas', 0))} partidas analisadas · atualizado em {e(stats.get('updated', ''))} · fonte: deadlock-api.com</p>
""")

        # ---------- habilidades ----------
        if h.get("skills"):
            itens_html = []
            for sk in h["skills"]:
                en = sk.get("name_en")
                extra = f' <span class="s-en">{e(en)}</span>' if en and en != sk["name"] else ""
                tags = []
                if sk.get("key") == "★":
                    tags.append('<span class="tag acc">Suprema</span>')
                if sk.get("passive"):
                    tags.append('<span class="tag">Passiva</span>')
                if sk.get("cd") is not None:
                    tags.append(f'<span class="tag cy">Recarga {e(sk["cd"])}s</span>')
                itens_html.append(f"""            <div class="pg-skill">
                <b>{e(sk.get('key'))}. {e(sk.get('name'))}</b>{extra} {' '.join(tags)}
                <p>{e(sk.get('desc'))}</p>
            </div>""")
            pagina.append(f"""        <h2 class="pg-sec"><i class="fa-solid fa-wand-sparkles"></i> Habilidades</h2>
        <div class="pg-skills">
{chr(10).join(itens_html)}
        </div>
""")

        # ---------- builds ----------
        lista_builds = builds.get(chave) or []
        bloco = []
        for i, b in enumerate(lista_builds):
            nomes_itens = []
            for item_id in b.get("i") or []:
                item = itens.get(str(item_id))
                if item:
                    nomes_itens.append(f'{"🏆 " if i == 0 else ""}{e(item["n"])} ({moeda(item["c"])})')
            if not nomes_itens:
                continue
            bloco.append(f"""            <div class="pg-skill">
                <b>{e(b.get('n'))}</b> <span class="tag acc">{e(b.get('win'))}% de vitória</span>
                <p>{moeda(b.get('m', 0))} partidas registradas com esta build.</p>
                <p>{' · '.join(nomes_itens)}</p>
            </div>""")
        if bloco:
            pagina.append(f"""        <h2 class="pg-sec"><i class="fa-solid fa-screwdriver-wrench"></i> Builds mais usadas</h2>
        <div class="pg-skills">
{chr(10).join(bloco)}
        </div>
""")

        # ---------- contadores ----------
        cont = contadores.get(chave) or {}
        if cont.get("bons") or cont.get("ruins"):
            def linha(item):
                outro = nome_de_id(item[0])
                if not outro:
                    return ""
                return f'<li><img src="../assets/heroes/{e(arquivo_de(outro))}" alt="" width="28" height="28" loading="lazy"> <b>{e(outro)}</b> — {e(item[1])}% de vitória</li>'
            pagina.append(f"""        <h2 class="pg-sec"><i class="fa-solid fa-right-left"></i> Confrontos reais</h2>
        <div class="pg-skills">
            <div class="pg-skill">
                <b>Vai bem contra</b>
                <ul class="pg-lista">{''.join(linha(x) for x in (cont.get('bons') or []))}</ul>
            </div>
            <div class="pg-skill">
                <b>Sofre contra</b>
                <ul class="pg-lista">{''.join(linha(x) for x in (cont.get('ruins') or []))}</ul>
            </div>
        </div>
""")

        # ---------- histórico ----------
        serie = serie_hist.get(h["name"])
        if serie and semanas:
            pares = [(semanas[i], v) for i, v in enumerate(serie) if v is not None]
            if len(pares) > 4:
                pontos = " → ".join(f"{w}: {v}%" for w, v in pares[::max(1, len(pares) // 8)])
                pagina.append(f"""        <h2 class="pg-sec"><i class="fa-solid fa-chart-line"></i> Histórico de win rate</h2>
        <div class="pg-skill"><p>{e(pontos)}</p></div>
""")

        pagina.append(rodape("../index.html#herois", "Ver todos os heróis no site"))
        with open(os.path.join(PASTA_HEROIS, slug(h["name"]) + ".html"), "w", encoding="utf-8") as arquivo:
            arquivo.write("\n".join(pagina))
        gerados.append({"url": url, "img": imagem, "alt": h["name"]})
    return gerados


# --------------------------- páginas das notícias ---------------------------

def paginas_noticias(noticias):
    os.makedirs(PASTA_NOTICIAS, exist_ok=True)
    gerados = []
    for n in noticias:
        ident = n.get("id")
        if not ident:
            continue
        titulo_pt = n.get("title_pt") or n.get("title") or "Notícia"
        titulo = f"{titulo_pt} | Central Deadlock"
        resumo = (n.get("desc_pt") or n.get("desc") or "")[:180]
        url = f"{SITE}noticia/{ident}.html"
        imagem = n.get("image") or f"{SITE}assets/brand/share.jpg"
        pagina = [cabecalho(titulo, resumo, url, imagem, "pg-noticia"),
                  topo("noticias", "Notícias", n.get("date", ""))]
        pagina.append(f"""        <article class="pg-noticia-body">
            <span class="news-cat">{e(n.get('cat', 'Steam'))}{' <span class="pt-tag"><i class="fa-solid fa-language"></i> PT</span>' if n.get('title_pt') else ''}</span>
            <h1 class="pg-title">{e(titulo_pt)}</h1>
            <p class="pg-crumb">{e(n.get('date', ''))} · <a href="{e(n.get('url', '#'))}" target="_blank" rel="noopener">ver o post original na Steam</a></p>
            {f'<img class="pg-img" src="{e(n["image"])}" alt="" loading="lazy">' if n.get('image') else ''}
            {f'<div class="pg-resumo"><b><i class="fa-solid fa-language"></i> Resumo em português</b><p>{e(n.get("desc_pt"))}</p></div>' if n.get('desc_pt') else ''}
""")
        if n.get("lines"):
            linhas = n["lines"] or []
            linhas_pt = n.get("lines_pt") or []
            tem_pt = any(x for x in linhas_pt)
            # texto completo: em portugues quando existe traducao, senao o original
            corpo = []
            for i, linha in enumerate(linhas):
                traducao = linhas_pt[i] if i < len(linhas_pt) else ""
                corpo.append(traducao or linha)
            rotulo = "Texto completo (traduzido para português)" if tem_pt else "Texto completo (original, em inglês)"
            pagina.append(f'            <h2 class="pg-sec">{rotulo}</h2>\n')
            for linha in corpo:
                pagina.append(f'            <p class="pg-texto">{e(linha)}</p>\n')
            # e o original em ingles fica embaixo, para conferir
            if tem_pt:
                pagina.append('            <h2 class="pg-sec">Texto original (em inglês)</h2>\n')
                for linha in linhas:
                    pagina.append(f'            <p class="pg-en">{e(linha)}</p>\n')
        pagina.append(f"""            <p class="stat-fonte"><i class="fa-solid fa-book-open"></i> Tradução automática para o português (Google). O texto original fica logo abaixo, para conferência.</p>
        </article>
""")
        pagina.append(rodape("../index.html#noticias", "Ver todas as notícias no site"))
        with open(os.path.join(PASTA_NOTICIAS, str(ident) + ".html"), "w", encoding="utf-8") as arquivo:
            arquivo.write("\n".join(pagina))
        gerados.append({"url": url, "img": imagem, "alt": titulo_pt})
    return gerados


# --------------------------- sitemap ---------------------------

def escrever_sitemap(paginas):
    hoje = datetime.date.today().isoformat()
    urls = [SITE, f"{SITE}index.html"] + [p["url"] for p in paginas]
    vistos, linhas = set(), []
    for u in urls:
        if u in vistos:
            continue
        vistos.add(u)
        prioridade = "1.0" if u.rstrip("/") == SITE.rstrip("/") or u.endswith("index.html") else "0.7"
        linhas.append(f"    <url><loc>{u}</loc><lastmod>{hoje}</lastmod><priority>{prioridade}</priority></url>")
    xml = ('<?xml version="1.0" encoding="UTF-8"?>\n'
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
           + "\n".join(linhas) + "\n</urlset>\n")
    with open(os.path.join(BASE, "sitemap.xml"), "w", encoding="utf-8") as arquivo:
        arquivo.write(xml)
    return len(vistos)


# --------------------------- principal ---------------------------

def main():
    print("Gerando as paginas de cada heroi e de cada noticia ...")
    try:
        herois = ler_herois()
    except Exception as erro:
        print("ERRO: nao consegui ler heroes-data.js: {}".format(erro))
        return 1

    stats = ler_js("data/hero-stats.js")
    jogo = ler_js("data/game-data.js")
    hist = ler_js("data/hero-history.js")
    noticias = ler_js("data/steam-news.js")
    noticias = noticias.get("items") or []

    paginas = paginas_herois(herois, stats, jogo, hist)
    print("   {} paginas de herois".format(len(paginas)))
    paginas_not = paginas_noticias(noticias)
    print("   {} paginas de noticias".format(len(paginas_not)))

    total = escrever_sitemap(paginas + paginas_not)
    print("   sitemap.xml com {} enderecos".format(total))
    print("OK! Rode de novo sempre que mudar os herois ou chegarem noticias novas.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

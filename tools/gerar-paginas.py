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
import sys
import unicodedata

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://hypedz.github.io/central-deadlock/"
PASTA_HEROIS = os.path.join(BASE, "heroi")
PASTA_NOTICIAS = os.path.join(BASE, "noticia")

DIFF_LABEL = ["", "Fácil", "Médio", "Difícil", "Muito Difícil"]

# Uma frase curta explicando o papel do herói (aparece no quadrinho "Papel")
PAPEL_TXT = {
    "Tanque": "Aguenta a linha de frente: entra na luta primeiro e abre espaço para o time.",
    "Suporte": "Mantém o time vivo com cura, escudos e utilidade.",
    "Carry": "Fica forte ao longo da partida e decide as brigas no fim.",
    "Controle": "Domina a área da briga e atrapalha o posicionamento dos inimigos.",
    "Assassino": "Entra em cima de um alvo só e mata rápido antes de recuar.",
    "A definir": "Herói em desenvolvimento: o papel ainda pode mudar."
}


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


def luminancia(cor):
    """O quanto uma cor é clara (0 = preto, 1 = branco). Serve para escolher
    se o texto em cima dela deve ser escuro ou claro."""
    h = str(cor or "").lstrip("#")
    if len(h) != 6:
        return None
    try:
        canais = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    except ValueError:
        return None

    def ajuste(c):
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4

    r, g, b = (ajuste(c) for c in canais)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def clarear(cor, quanto):
    """Mistura a cor com branco (0 = nada, 1 = branco puro)."""
    h = str(cor or "").lstrip("#")
    if len(h) != 6:
        return cor
    try:
        partes = [int(h[i:i + 2], 16) for i in (0, 2, 4)]
    except ValueError:
        return cor
    partes = [round(p + (255 - p) * quanto) for p in partes]
    return "#{:02x}{:02x}{:02x}".format(*partes)


def estilo_da_cor(cor):
    """A cor de cada herói vira três variáveis no CSS:
       --cor        (o fundo das etiquetas, a cor oficial do herói)
       --cor-txt    (a cor do texto em cima: escuro nas cores claras, claro nas escuras)
       --cor-borda  (uma versão um pouco mais clara, para bordas e barras não sumirem)
    """
    if not cor:
        return ""
    claro = luminancia(cor)
    texto = "#0b0d10" if (claro is not None and claro >= 0.19) else "#f4f8ff"
    borda = cor if (claro is None or claro >= 0.14) else clarear(cor, 0.5)
    return ' style="--cor:{};--cor-txt:{};--cor-borda:{}"'.format(cor, texto, borda)


# --------------------------- moldura da página ---------------------------

def cabecalho(titulo, descricao, url, imagem, classe="", estilo=""):
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
<body class="pg-body {classe}"{estilo}>"""


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

def paginas_herois(herois, stats, jogo, hist, extra):
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
    extras = (extra or {}).get("herois") or {}
    pasta_hab = os.path.join(BASE, "assets", "habilidades")

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

    def existe(relativo):
        return os.path.exists(os.path.join(BASE, *relativo.split("/")))

    gerados = []
    for h in herois:
        if h.get("soon"):
            continue

        nome = h["name"]
        apelido = slug(nome)
        s = stats_herois.get(nome) or {}
        ex = extras.get(nome) or {}
        chave = str(ids.get(nome))
        tier = s.get("tier", h.get("tier", "?"))
        cor = str(ex.get("cor") or "")
        etiquetas = [x for x in (ex.get("tags") or [h.get("role"), h.get("arch")]) if x and x != "—"]
        compl = max(1, min(4, int(ex.get("compl") or h.get("diff") or 1)))
        lore = ex.get("lore") or []
        lista_hab = ex.get("hab") or []
        capa = "assets/capas/{}.webp".format(apelido)
        letreiro = "assets/nomes/{}.svg".format(apelido)
        tem_capa = existe(capa)
        tem_letreiro = existe(letreiro)

        def icone_da(sk, posicao):
            """Descobre o ícone da habilidade (pelo nome em inglês; se não achar, pela ordem)."""
            baixo = str(sk.get("name_en") or sk.get("name") or "").strip().lower()
            for x in lista_hab:
                if str(x.get("n") or "").strip().lower() == baixo and os.path.exists(os.path.join(pasta_hab, str(x.get("i") or ""))):
                    return str(x["i"])
            if posicao < len(lista_hab) and os.path.exists(os.path.join(pasta_hab, str(lista_hab[posicao].get("i") or ""))):
                return str(lista_hab[posicao]["i"])
            return ""

        titulo = "{} — habilidades, números reais e build | Central Deadlock".format(nome)
        descricao = ("{} ({}): win rate real {}%, habilidades, counters e as builds mais usadas. "
                     "Dados de verdade, direto das partidas.").format(nome, h["role"], s.get("win", h.get("win")))
        url = "{}heroi/{}.html".format(SITE, apelido)
        imagem = "{}assets/heroes/{}".format(SITE, h["file"])

        pagina = [cabecalho(titulo, descricao, url, imagem, "pg-heroi", estilo_da_cor(cor)),
                  '        <div class="pg-wrap pg-topo">',
                  topo("herois", "Heróis", nome).rstrip("\n"),
                  '        </div>',
                  '']

        # ---------------- banner: arte de capa + nome + etiquetas + habilidades ----------------
        titulo_html = '<img src="../{}" alt="{}">'.format(e(letreiro), e(nome)) if tem_letreiro else e(nome)
        botoes_hab = []
        for i, sk in enumerate(h.get("skills") or []):
            arq = icone_da(sk, i)
            if arq:
                botoes_hab.append('                    <a class="ht-hab" href="#hab-{}" title="{}">'
                                  '<img src="../assets/habilidades/{}" alt="{}" loading="lazy"></a>'.format(
                                      i + 1, e(sk.get("name")), e(arq), e(sk.get("name"))))
        pagina.append('        <section class="ht">')
        if tem_capa:
            pagina.append('            <div class="ht-bg"><img src="../{}" alt="" width="1200" height="677"></div>'.format(e(capa)))
        pagina.append('            <div class="ht-in">')
        pagina.append('                <h1 class="ht-h1">{}</h1>'.format(titulo_html))
        if etiquetas:
            pagina.append('                <div class="ht-tags">{}</div>'.format(
                "".join('<span>{}</span>'.format(e(t)) for t in etiquetas[:4])))
        if botoes_hab:
            pagina.append('                <div class="ht-habs">')
            pagina.extend(botoes_hab)
            pagina.append('                </div>')
        pagina.append('            </div>')
        pagina.append('        </section>')
        pagina.append('')
        pagina.append('        <div class="pg-wrap">')
        pagina.append('        <div class="pg-cols">')
        pagina.append('        <main class="pg-main">')
        pagina.append('            <p class="pg-desc">{}</p>'.format(e(h.get("desc"))))

        # ---------------- história (texto oficial do jogo) ----------------
        if lore:
            pagina.append('            <section class="pg-card pg-hist">')
            pagina.append('                <h2 class="pg-sec"><i class="fa-solid fa-scroll"></i> História</h2>')
            for paragrafo in lore:
                pagina.append('                <p>{}</p>'.format(e(paragrafo)))
            pagina.append('                <p class="pg-note">História oficial do jogo, traduzida automaticamente para o português.</p>')
            pagina.append('            </section>')

        # ---------------- números reais ----------------
        if s:
            pagina.append('            <h2 class="pg-sec"><i class="fa-solid fa-chart-simple"></i> Números reais</h2>')
            pagina.append('            <div class="pg-stats">')
            cartoes = [
                (e(s.get("win")) + "%", "win rate"),
                (e(s.get("pick", 0)) + "%", "pick rate"),
                (e(s.get("kda")), "KDA médio"),
                (moeda(s.get("partidas", 0)), "partidas"),
                (e(s.get("posicao", "?")) + "º", "no win rate"),
            ]
            for valor, rotulo in cartoes:
                pagina.append('                <div class="pg-stat"><b>{}</b><small>{}</small></div>'.format(valor, rotulo))
            pagina.append('            </div>')

        # ---------------- habilidades ----------------
        if h.get("skills"):
            itens_html = []
            for i, sk in enumerate(h["skills"]):
                en = sk.get("name_en")
                ingles = ' <span class="s-en">{}</span>'.format(e(en)) if en and en != sk["name"] else ""
                marcas = []
                if sk.get("key") == "★":
                    marcas.append('<span class="tag acc">Suprema</span>')
                if str(sk.get("passive")) in ("1", "True", "true"):
                    marcas.append('<span class="tag">Passiva</span>')
                if str(sk.get("cd") or "").strip() not in ("", "None", "none"):
                    marcas.append('<span class="tag cy">Recarga {}s</span>'.format(e(sk["cd"])))
                arq = icone_da(sk, i)
                icone = ('<span class="pg-skill-ico"><img src="../assets/habilidades/{}" alt="" loading="lazy"></span>'.format(e(arq))
                         if arq else '<span class="pg-skill-ico pg-skill-ico-vazio">{}</span>'.format(e(sk.get("key"))))
                itens_html.append(
                    '                <div class="pg-skill pg-hab" id="hab-{}">\n'
                    '                    {}\n'
                    '                    <div class="pg-skill-info">\n'
                    '                        <b>{}. {}</b>{}\n'
                    '                        <div class="pg-skill-tags">{}</div>\n'
                    '                    </div>\n'
                    '                    <p>{}</p>\n'
                    '                </div>'.format(i + 1, icone, e(sk.get("key")), e(sk.get("name")),
                                                     ingles, " ".join(marcas), e(sk.get("desc"))))
            pagina.append('            <h2 class="pg-sec"><i class="fa-solid fa-wand-sparkles"></i> Habilidades</h2>')
            pagina.append('            <div class="pg-skills">')
            pagina.extend(itens_html)
            pagina.append('            </div>')

        # ---------------- builds ----------------
        bloco = []
        for i, b in enumerate(builds.get(chave) or []):
            nomes_itens = []
            for item_id in b.get("i") or []:
                item = itens.get(str(item_id))
                if item:
                    nomes_itens.append('{}<b>{}</b> ({})'.format("🏆 " if i == 0 else "", e(item["n"]), moeda(item["c"])))
            if not nomes_itens:
                continue
            bloco.append(
                '            <div class="pg-skill">\n'
                '                <div class="pg-skill-info"><b>{}</b> <span class="tag acc">{}% de vitória</span></div>\n'
                '                <p>{} partidas registradas com esta build.</p>\n'
                '                <p class="pg-build-itens">{}</p>\n'
                '            </div>'.format(e(b.get("n")), e(b.get("win")), moeda(b.get("m", 0)), " · ".join(nomes_itens)))
        if bloco:
            pagina.append('            <h2 class="pg-sec"><i class="fa-solid fa-screwdriver-wrench"></i> Builds mais usadas</h2>')
            pagina.append('            <div class="pg-skills">')
            pagina.extend(bloco)
            pagina.append('            </div>')

        # ---------------- contadores ----------------
        cont = contadores.get(chave) or {}
        if cont.get("bons") or cont.get("ruins"):
            def linha(item):
                outro = nome_de_id(item[0])
                if not outro:
                    return ""
                return ('<li><img src="../assets/heroes/{}" alt="" width="28" height="28" loading="lazy"> '
                        '<b>{}</b> — {}% de vitória</li>').format(e(arquivo_de(outro)), e(outro), e(item[1]))
            pagina.append('            <h2 class="pg-sec"><i class="fa-solid fa-right-left"></i> Confrontos reais</h2>')
            pagina.append('            <div class="pg-skills">')
            pagina.append('                <div class="pg-skill"><div class="pg-skill-info"><b>Vai bem contra</b></div>'
                          '<ul class="pg-lista">{}</ul></div>'.format("".join(linha(x) for x in (cont.get("bons") or []))))
            pagina.append('                <div class="pg-skill"><div class="pg-skill-info"><b>Sofre contra</b></div>'
                          '<ul class="pg-lista">{}</ul></div>'.format("".join(linha(x) for x in (cont.get("ruins") or []))))
            pagina.append('            </div>')

        # ---------------- histórico ----------------
        serie = serie_hist.get(nome)
        if serie and semanas:
            pares = [(semanas[i], v) for i, v in enumerate(serie) if v is not None]
            if len(pares) > 4:
                pontos = " → ".join("{}: {}%".format(w, v) for w, v in pares[::max(1, len(pares) // 8)])
                pagina.append('            <h2 class="pg-sec"><i class="fa-solid fa-chart-line"></i> Histórico de win rate</h2>')
                pagina.append('            <div class="pg-skill"><p class="pg-hist-linha">{}</p></div>'.format(e(pontos)))

        pagina.append('        </main>')

        # ---------------- barra lateral ----------------
        papel = PAPEL_TXT.get(h.get("role"), "Herói de Deadlock.")
        pagina.append('        <aside class="pg-side">')
        pagina.append('            <div class="pg-card">')
        pagina.append('                <div class="pg-lbl">Papel</div>')
        pagina.append('                <p class="pg-side-txt">{}</p>'.format(e(papel)))
        pagina.append('            </div>')
        pagina.append('            <div class="pg-card">')
        pagina.append('                <div class="pg-lbl">Dificuldade</div>')
        pagina.append('                <div class="pg-dif"><b>{}</b>'
                      '<span class="pg-barra"><i style="width:{}%"></i></span></div>'.format(
                          e(DIFF_LABEL[compl]), int(compl / 4 * 100)))
        pagina.append('            </div>')
        pagina.append('            <div class="pg-card">')
        pagina.append('                <div class="pg-lbl">Resumo</div>')
        resumo = [
            ("Tier", "{}".format(e(tier))),
            ("Vida base", "{}".format(e(h.get("hp")))),
            ("Velocidade", "{} m/s".format(e(h.get("spd")))),
            ("Banido", "{}%{}".format(e(ban.get(chave, "0")), " ({}º mais banido)".format(ban_pos[chave]) if chave in ban_pos else "")),
        ]
        for rotulo, valor in resumo:
            pagina.append('                <div class="pg-mini"><span>{}</span><b>{}</b></div>'.format(e(rotulo), valor))
        pagina.append('            </div>')
        pagina.append('            <div class="pg-card pg-card-fonte">')
        pagina.append('                <div class="pg-lbl">Fonte dos números</div>')
        pagina.append('                <p class="pg-side-txt">{} partidas analisadas · atualizado em {} · <b>deadlock-api.com</b></p>'.format(
            moeda(stats.get("partidas", 0)), e(stats.get("updated", ""))))
        pagina.append('            </div>')
        pagina.append('        </aside>')
        pagina.append('        </div>')

        pagina.append(rodape("../index.html#herois", "Ver todos os heróis no site"))
        with open(os.path.join(PASTA_HEROIS, apelido + ".html"), "w", encoding="utf-8") as arquivo:
            arquivo.write("\n".join(pagina))
        gerados.append({"url": url, "img": imagem, "alt": nome})
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
                  '        <div class="pg-wrap pg-wrap-noticia">',
                  topo("noticias", "Notícias", n.get("date", "")).rstrip("\n")]
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
    extra = ler_js("data/hero-extra.js")
    noticias = ler_js("data/steam-news.js")
    noticias = noticias.get("items") or []

    paginas = paginas_herois(herois, stats, jogo, hist, extra)
    print("   {} paginas de herois".format(len(paginas)))
    paginas_not = paginas_noticias(noticias)
    print("   {} paginas de noticias".format(len(paginas_not)))

    total = escrever_sitemap(paginas + paginas_not)
    print("   sitemap.xml com {} enderecos".format(total))
    print("OK! Rode de novo sempre que mudar os herois ou chegarem noticias novas.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

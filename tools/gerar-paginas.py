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
import urllib.parse

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://hypedz.github.io/central-deadlock/"
PASTA_HEROIS = os.path.join(BASE, "heroi")
PASTA_NOTICIAS = os.path.join(BASE, "noticia")
PASTA_ITENS = os.path.join(BASE, "item")
PASTA_COUNTERS = os.path.join(BASE, "counter")

# Troque este número quando mudar o visual do site (style.css). Ele vai no fim do
# link do CSS (?v=...) só para o navegador de quem já visitou o site pegar a
# versão nova na hora, em vez de mostrar a antiga guardada na memória dele.
VERSAO_CSS = "20261021i"

# --------------------------- casca do site ---------------------------
# As páginas internas (herói, notícia, item, counter, guia) usam a mesma barra
# lateral e a mesma barra do topo da Home. Assim elas não parecem "outro site".
# A casca é copiada da própria Home na hora de gerar, para não ficar diferente.
def _ler_home():
    try:
        with open(os.path.join(BASE, "index.html"), encoding="utf-8") as f:
            return f.read()
    except OSError:
        return ""


_HOME = _ler_home()


def _trecho(padrao):
    achado = re.search(padrao, _HOME, re.S)
    return achado.group(0) if achado else ""


def casca(prefixo):
    """Devolve (barra do topo, barra lateral) com os links apontando para a Home."""
    def ajustar(html):
        # mantém o data-section: o pagina.js usa para marcar a aba atual no menu
        return html.replace('href="#', 'href="{}index.html#'.format(prefixo))

    topbar = ajustar(_trecho(r'<header class="topbar">.*?</header>'))
    sidebar = ajustar(_trecho(r'<aside class="sidebar" id="sidebar">.*?</aside>'))

    # Na Home esse botão abre a janela de download. Aqui não existe a janela,
    # então ele vai direto para a página da Steam.
    sidebar = sidebar.replace(
        '<button class="btn-download" id="btnDownload"><i class="fa-solid fa-download"></i> BAIXAR DEADLOCK</button>',
        '<a class="btn-download" href="https://store.steampowered.com/app/1422450/Deadlock/" target="_blank" rel="noopener"><i class="fa-solid fa-download"></i> BAIXAR DEADLOCK</a>')

    # a Home vinha com "active" fixo; aqui quem manda é a página aberta
    sidebar = sidebar.replace('class="nav-item active"', 'class="nav-item"')

    return topbar, sidebar

DIFF_LABEL = ["", "Fácil", "Médio", "Difícil"]

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

def cabecalho(titulo, descricao, url, imagem, classe="", estilo="", prefixo="../"):
    topbar, sidebar = casca(prefixo)
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
<link rel="icon" type="image/svg+xml" href="{prefixo}assets/brand/favicon-c.svg?v={VERSAO_CSS}">
<link rel="apple-touch-icon" href="{prefixo}assets/brand/icon-192.png?v={VERSAO_CSS}">
<!-- deixa esta página também "instalável" no celular (igual à Home) -->
<link rel="manifest" href="{prefixo}manifest.webmanifest">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Central Deadlock">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<link rel="stylesheet" href="{prefixo}style.css?v={VERSAO_CSS}">
<script src="{prefixo}tema.js?v={VERSAO_CSS}"></script>
</head>
<body class="pg-body {classe}"{estilo}>
{topbar}
{sidebar}
<div class="sidebar-overlay" id="sidebarOverlay"></div>
<main class="content pg-conteudo">
"""


def rodape(voltar_para, voltar_nome, prefixo="../"):
    return f"""    <footer class="pg-foot">
        <a class="btn btn-lime pg-cta" href="{e(voltar_para)}"><i class="fa-solid fa-arrow-left"></i> {e(voltar_nome)}</a>
        <p>Central Deadlock é um site de fãs. Deadlock e todos os personagens são marcas da Valve Corporation.
        Este site não tem ligação com a Valve. Números reais de partidas, via <b>deadlock-api.com</b>.</p>
    </footer>
</div>
</main>
<script src="{prefixo}pagina.js?v={VERSAO_CSS}" data-prefixo="{prefixo}" defer></script>
<script src="{prefixo}pwa.js?v={VERSAO_CSS}" defer></script>
</body>
</html>
"""


def topo(secao_url, secao_nome, atual, prefixo="../", secao_ativa=None):
    ativa = secao_url if secao_ativa is None else secao_ativa
    meio = ''
    if secao_url and secao_nome:
        meio = ' › <a href="{0}index.html#{1}">{2}</a>'.format(prefixo, e(secao_url), e(secao_nome))
    return f"""    <header class="pg-top" data-secao="{e(ativa or '')}">
        <nav class="pg-crumb"><a href="{prefixo}index.html">Início</a>{meio} › <b>{e(atual)}</b></nav>
        <button type="button" class="btn btn-dark btn-sm tema-btn" data-tema-btn aria-label="Mudar para o tema claro" title="Mudar para o tema claro"><i class="fa-solid fa-sun"></i><span data-tema-texto>Tema claro</span></button>
    </header>
"""


# --------------------------- página 404 ---------------------------
# O GitHub Pages mostra este arquivo quando alguém abre um endereço que não existe.
# Ele aparece em qualquer profundidade (ex.: /heroi/nao-existe.html), por isso os
# caminhos aqui são absolutos - resolvidos pela tag <base>, que aponta para a raiz
# do site. É uma página parada (não usa JavaScript), então funciona sempre.

ATALHOS_404 = [
    ("index.html", "fa-house", "Início", "Notícias, destaques e atalhos do site"),
    ("index.html#herois", "fa-masks-theater", "Heróis", "Os 44 heróis, com números reais"),
    ("index.html#counters", "fa-hand-fist", "Counters", "Quem ganha de quem, com números reais"),
    ("index.html#guias", "fa-book", "Guias", "Um guia pronto para cada herói"),
    ("index.html#comecando", "fa-graduation-cap", "Começando", "Guia rápido para a primeira partida"),
    ("index.html#builds", "fa-screwdriver-wrench", "Builds", "As builds mais usadas no jogo"),
    ("index.html#itens", "fa-store", "Itens", "Preço e efeito de todos os itens"),
    ("index.html#noticias", "fa-newspaper", "Notícias", "As últimas notícias, em português"),
]


def pagina_404():
    raiz = urllib.parse.urlparse(SITE).path or "/"

    atalhos = "\n".join(
        '                <a class="pg-atalho" href="{}"><i class="fa-solid {}"></i><b>{}</b><span>{}</span></a>'.format(
            e(endereco), icone, e(titulo), e(texto))
        for endereco, icone, titulo, texto in ATALHOS_404)

    pagina = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<base href="{e(raiz)}">
<title>Página não encontrada (404) | Central Deadlock</title>
<meta name="robots" content="noindex, follow">
<meta name="description" content="Este endereço não existe no Central Deadlock. Use os atalhos para heróis, guias, builds, itens e notícias.">
<meta name="theme-color" content="#b6f24a">
<link rel="icon" type="image/svg+xml" href="assets/brand/favicon-c.svg?v={VERSAO_CSS}">
<link rel="apple-touch-icon" href="assets/brand/icon-192.png?v={VERSAO_CSS}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<link rel="stylesheet" href="style.css?v={VERSAO_CSS}">
<script src="tema.js?v={VERSAO_CSS}"></script>
</head>
<body class="pg-body pg-404">
    <div class="pg-wrap">
        <header class="pg-top">
            <a class="pg-brand pg-brand-tipo" href="index.html" aria-label="Central Deadlock"><b>CENTRAL</b><span>DEADLOCK</span></a>
            <nav class="pg-crumb"><a href="index.html">Início</a> › <b>Página não encontrada</b></nav>
            <a class="pg-busca" href="index.html#buscar" title="Buscar herói, item ou notícia (Ctrl + K)"><i class="fa-solid fa-magnifying-glass"></i> Buscar no site</a>
            <button type="button" class="btn btn-dark btn-sm tema-btn" data-tema-btn aria-label="Mudar para o tema claro" title="Mudar para o tema claro"><i class="fa-solid fa-sun"></i><span data-tema-texto>Tema claro</span></button>
        </header>
        <main class="n404">
            <div class="n404-num">404</div>
            <h1>Essa página não existe (ou mudou de endereço)</h1>
            <p>O endereço que você abriu não está no Central Deadlock. Escolha um dos atalhos abaixo ou use a busca
            do site (atalho <b>Ctrl + K</b>) para achar o herói, item ou notícia que você quer.</p>
            <div class="pg-atalhos">
{atalhos}
            </div>
            <p class="n404-dica">Se você chegou aqui por um link de outro site, avise a gente no Discord:
            a gente arruma o link quebrado.</p>
        </main>
        <footer class="pg-foot">
            <p>Central Deadlock é um site de fãs. Deadlock e todos os personagens são marcas da Valve Corporation.
            Este site não tem ligação com a Valve. Números reais de partidas, via <b>deadlock-api.com</b>;
            torneios via <b>Liquipedia</b> (conteúdo sob licença CC BY-SA 3.0).</p>
            <a class="btn btn-lime pg-cta" href="index.html"><i class="fa-solid fa-arrow-left"></i> Voltar para a Home</a>
        </footer>
    </div>
</body>
</html>
"""

    with open(os.path.join(BASE, "404.html"), "w", encoding="utf-8") as arquivo:
        arquivo.write(pagina)
    return True


# --------------------------- páginas dos heróis ---------------------------

def paginas_herois(herois, stats, jogo, hist, extra, analitico, top=None):
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
    analises = (analitico or {}).get("herois") or {}
    tops = (top or {}).get("herois") or {}
    top_regioes = (top or {}).get("regioes") or {}
    top_atualizado = (top or {}).get("updated") or ""
    pasta_hab = os.path.join(BASE, "assets", "habilidades")

    # uma cor para cada uma das 4 habilidades (usada no "o que upar primeiro")
    CORES_HAB = ["#b6f24a", "#22d3ee", "#f472b6", "#fbbf24"]

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
            if not arq:
                continue
            marcas = []
            if sk.get("key") == "★":
                marcas.append('<span class="tag acc">Suprema</span>')
            if str(sk.get("passive")) in ("1", "True", "true"):
                marcas.append('<span class="tag">Passiva</span>')
            if str(sk.get("cd") or "").strip() not in ("", "None", "none"):
                marcas.append('<span class="tag cy">Recarga {}s</span>'.format(e(sk["cd"])))
            en = sk.get("name_en")
            ingles = ' <span class="s-en">{}</span>'.format(e(en)) if en and en != sk["name"] else ""
            # o "title" fica de fora de proposito: quem mostra o texto e a caixinha (ht-tip)
            botoes_hab.append(
                '                    <a class="ht-hab" href="#hab-{}">\n'
                '                        <img src="../assets/habilidades/{}" alt="{}" loading="lazy">\n'
                '                        <span class="ht-tip">\n'
                '                            <b>{}</b>{}\n'
                '                            <span class="ht-tip-tags">{}</span>\n'
                '                            <span class="ht-tip-txt">{}</span>\n'
                '                        </span>\n'
                '                    </a>'.format(i + 1, e(arq), e(sk.get("name")), e(sk.get("name")),
                                                  ingles, " ".join(marcas), e(sk.get("desc"))))
        pagina.append('        <section class="ht">')
        if tem_capa:
            pagina.append('            <div class="ht-bg"><img src="../{}" alt="" width="1920" height="600"></div>'.format(e(capa)))
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
        pagina.append('        <div class="pg-main">')
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
                    nomes_itens.append('<b>{}</b> ({})'.format(e(item["n"]), moeda(item["c"])))
            if not nomes_itens:
                continue
            bloco.append(
                '            <div class="pg-skill">\n'
                '                <div class="pg-skill-info"><b>{}{}</b> <span class="tag acc">{}% de vitória</span></div>\n'
                '                <p>{} partidas registradas com esta build.</p>\n'
                '                <p class="pg-build-itens">{}</p>\n'
                '            </div>'.format("🏆 " if i == 0 else "", e(b.get("n")), e(b.get("win")), moeda(b.get("m", 0)), " · ".join(nomes_itens)))
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
            pagina.append('            <p style="margin-top: 14px"><a class="btn btn-dark pg-cta" href="../counter/{}.html">'
                          '<i class="fa-solid fa-crosshairs"></i> Ver a página de counters do {}</a></p>'.format(e(apelido), e(nome)))

        # ---------------- o que upar primeiro (dados reais) ----------------
        analise = analises.get(apelido) or {}
        ordem = analise.get("ordem") or []
        especiais = h.get("skills") or []
        if ordem and especiais:
            chips, usadas = [], []
            for nivel, ponto in enumerate(ordem, start=1):
                numero, pct = ponto[0], ponto[1]
                if not (1 <= numero <= len(especiais)):
                    continue
                sk = especiais[numero - 1]
                icone = icone_da(sk, numero - 1)
                cor = CORES_HAB[(numero - 1) % len(CORES_HAB)]
                if numero not in usadas:
                    usadas.append(numero)
                dentro = ('<img src="../assets/habilidades/{}" alt="{}" loading="lazy" width="30" height="30">'.format(e(icone), e(sk.get("name")))
                          if icone else '<span class="pg-niv-vazio">{}</span>'.format(e(sk.get("key"))))
                chips.append('                <div class="pg-niv" style="--hc:{}"><span class="pg-niv-n">{}</span>{}'
                             '<span class="pg-niv-p">{}%</span></div>'.format(cor, nivel, dentro, pct))
            if chips:
                pagina.append('            <h2 class="pg-sec"><i class="fa-solid fa-arrow-up-1-9"></i> O que upar primeiro</h2>')
                pagina.append('            <p class="pg-nota">Nível por nível, na ordem que os jogadores mais usam em partidas de verdade. '
                              'A porcentagem mostra quantos escolheram aquela habilidade naquele nível.</p>')
                pagina.append('            <div class="pg-ordem">')
                pagina.extend(chips)
                pagina.append('            </div>')
                legenda = []
                for numero in sorted(usadas):
                    sk = especiais[numero - 1]
                    cor = CORES_HAB[(numero - 1) % len(CORES_HAB)]
                    legenda.append('<span><i style="background:{}"></i> {} <em>({})</em></span>'.format(
                        cor, e(sk.get("name")), e(sk.get("key"))))
                pagina.append('            <div class="pg-legenda">{}</div>'.format("".join(legenda)))

        # ---------------- melhores duplas (dados reais) ----------------
        duplas = analise.get("duplas") or []
        duplas_ruins = analise.get("duplasRuins") or []
        if duplas:
            def linha_dupla(item):
                outro = nome_de_id(item[0])
                if not outro:
                    return ""
                # a barrinha vai de 40% a 60% de vitória: assim a diferença entre as duplas aparece
                largura = max(6, min(100, int(round((item[1] - 40) / 20.0 * 100))))
                return ('<li><img src="../assets/heroes/{}" alt="" width="28" height="28" loading="lazy"> '
                        '<b>{}</b><span class="pg-barra"><i style="width:{}%"></i></span>'
                        '<em>{}</em></li>').format(e(arquivo_de(outro)), e(outro), largura, "{:.1f}%".format(item[1]).replace(".", ","))
            pagina.append('            <h2 class="pg-sec"><i class="fa-solid fa-people-group"></i> Melhores duplas</h2>')
            pagina.append('            <p class="pg-nota">Heróis que mais ganham jogando junto com ele, em partidas reais '
                          '(pelo menos {} partidas juntos).</p>'.format(moeda(analitico.get("minimos", {}).get("dupla", 0))))
            pagina.append('            <div class="pg-skills">')
            pagina.append('                <div class="pg-skill"><div class="pg-skill-info"><b>Ganha muito com</b></div>'
                          '<ul class="pg-lista pg-lista-tab">{}</ul></div>'.format("".join(linha_dupla(x) for x in duplas)))
            if duplas_ruins:
                pagina.append('                <div class="pg-skill"><div class="pg-skill-info"><b>Não combina com</b></div>'
                              '<ul class="pg-lista pg-lista-tab">{}</ul></div>'.format(
                                  "".join(linha_dupla(x) for x in duplas_ruins)))
            pagina.append('            </div>')

        # ---------------- rota (lane) ----------------
        rota = analise.get("rota") or []
        rota_boas = analise.get("rotaBoas") or []
        if rota:
            def linha_rota(item):
                outro = nome_de_id(item[0])
                if not outro:
                    return ""
                almas = item[3] if len(item) > 3 else None
                marca_almas = ""
                if almas is not None:
                    classe = "bom" if almas >= 0 else "ruim"
                    sinal = "+" if almas >= 0 else "−"
                    marca_almas = '<span class="pg-almas {}">{}{} almas</span>'.format(classe, sinal, moeda(abs(almas)))
                return ('<li><img src="../assets/heroes/{}" alt="" width="28" height="28" loading="lazy"> '
                        '<b>{}</b> — {}% de vitória {} <small>({} partidas)</small></li>').format(
                            e(arquivo_de(outro)), e(outro), "{:.1f}".format(item[1]).replace(".", ","),
                            marca_almas, moeda(item[2]))
            pagina.append('            <h2 class="pg-sec"><i class="fa-solid fa-road"></i> Rota (lane)</h2>')
            pagina.append('            <p class="pg-nota">Na rota, cada lado joga em dupla. Estes números são de confrontos reais: '
                          'a diferença de almas é medida com o jogo já começado, então almas no verde significa que ele costuma '
                          'estar na frente.</p>')
            pagina.append('            <div class="pg-skills">')
            pagina.append('                <div class="pg-skill"><div class="pg-skill-info"><b>Sofre na rota contra</b></div>'
                          '<ul class="pg-lista">{}</ul></div>'.format("".join(linha_rota(x) for x in rota)))
            if rota_boas:
                pagina.append('                <div class="pg-skill"><div class="pg-skill-info"><b>Vai bem na rota contra</b></div>'
                              '<ul class="pg-lista">{}</ul></div>'.format("".join(linha_rota(x) for x in rota_boas)))
            pagina.append('            </div>')

        # ---------------- histórico ----------------
        serie = serie_hist.get(nome)
        if serie and semanas:
            pares = [(semanas[i], v) for i, v in enumerate(serie) if v is not None]
            if len(pares) > 4:
                pontos = " → ".join("{}: {}%".format(w, v) for w, v in pares[::max(1, len(pares) // 8)])
                pagina.append('            <h2 class="pg-sec"><i class="fa-solid fa-chart-line"></i> Histórico de win rate</h2>')
                pagina.append('            <div class="pg-skill"><p class="pg-hist-linha">{}</p></div>'.format(e(pontos)))

        # ---------------- atalhos para o resto do site ----------------
        pagina.append('            <h2 class="pg-sec"><i class="fa-solid fa-arrow-up-right-from-square"></i> Continuar no Central Deadlock</h2>')
        pagina.append('            <div class="pg-atalhos">')
        pagina.append('                <a class="pg-atalho" href="../index.html#counters"><i class="fa-solid fa-hand-fist"></i><b>Counters deste herói</b><span>Contra quem ele ganha e quem ele evita</span></a>')
        pagina.append('                <a class="pg-atalho" href="../index.html#guias"><i class="fa-solid fa-book"></i><b>Guia completo</b><span>Passo a passo de como jogar com ele</span></a>')
        pagina.append('                <a class="pg-atalho" href="../index.html#builds"><i class="fa-solid fa-screwdriver-wrench"></i><b>Builds de todos os heróis</b><span>As mais usadas e o win rate de cada uma</span></a>')
        pagina.append('                <a class="pg-atalho" href="../index.html#ranking"><i class="fa-solid fa-ranking-star"></i><b>Ranking dos melhores</b><span>Os melhores de cada região, direto do jogo</span></a>')
        pagina.append('                <a class="pg-atalho" href="../index.html#itens"><i class="fa-solid fa-store"></i><b>Loja de itens</b><span>Preço e efeito de todos os itens</span></a>')
        pagina.append('            </div>')

        pagina.append('        </div>')

        # ---------------- barra lateral ----------------
        papel = PAPEL_TXT.get(h.get("role"), "Herói de Deadlock.")
        pagina.append('        <aside class="pg-side">')
        pagina.append('            <div class="pg-card">')
        pagina.append('                <div class="pg-lbl">Papel</div>')
        pagina.append('                <p class="pg-side-txt">{}</p>'.format(e(papel)))
        pagina.append('            </div>')
        pagina.append('            <div class="pg-card">')
        pagina.append('                <div class="pg-lbl">Dificuldade</div>')
        pagina.append('                <div class="pg-difs">')

        def linha_dificuldade(rotulo, nota):
            """Uma linha de dificuldade: 3 barrinhas (verde/amarelo/vermelho) e o nome da nota."""
            nota = max(1, min(3, int(nota or 1)))
            barrinhas = "".join('<i class="on n{}"></i>'.format(nota) if posicao < nota else "<i></i>"
                                for posicao in range(3))
            return ('                    <div class="pg-dif-linha">'
                    '<span class="pg-dif-nome">{}</span>'
                    '<span class="pg-pips">{}</span>'
                    '<b class="pg-dif-rot n{}">{}</b></div>').format(
                        e(rotulo), barrinhas, nota, e(DIFF_LABEL[nota]))

        pagina.append(linha_dificuldade("Para aprender", h.get("diff")))
        pagina.append(linha_dificuldade("Para masterizar", h.get("dominio")))
        pagina.append('                </div>')
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

        # top de jogadores do herói (ranking do próprio jogo, por região)
        top_do_heroi = tops.get(str(ids.get(nome))) or {}
        linhas_top = []
        for codigo in ("Europe", "NAmerica", "SAmerica", "Asia", "Oceania"):
            lista = top_do_heroi.get(codigo) or []
            if not lista:
                continue
            itens_top = "".join(
                '<li><span class="pg-top-pos">{}º</span> {}</li>'.format(int(p[1]), e(str(p[0])))
                for p in lista[:3])
            linhas_top.append(
                '                <div class="pg-top-reg"><div class="pg-top-tit">{}</div><ol class="pg-top-lista">{}</ol></div>'.format(
                    e(top_regioes.get(codigo, codigo)), itens_top))
        if linhas_top:
            pagina.append('            <div class="pg-card">')
            pagina.append('                <div class="pg-lbl">Top jogadores</div>')
            pagina.append('                <p class="pg-side-txt">O ranking do próprio jogo para {}, por região.</p>'.format(e(nome)))
            pagina.extend(linhas_top)
            pagina.append('                <p class="pg-side-txt pg-top-fonte">Fonte: deadlock-api.com · {}</p>'.format(e(top_atualizado)))
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


# --------------------------- páginas dos itens ---------------------------

NOME_TIPO = {"weapon": "Arma", "vitality": "Vitalidade", "spirit": "Espírito"}
ICONE_TIPO = {"weapon": "fa-gun", "vitality": "fa-heart-pulse", "spirit": "fa-hat-wizard"}
TEXTO_TIPO = {
    "weapon": "Itens de arma melhoram o tiro: dano, cadência, alcance e efeitos nos disparos.",
    "vitality": "Itens de vitalidade deixam o herói mais resistente: vida, cura, escudos e defesa.",
    "spirit": "Itens de espírito fortalecem as habilidades: dano mágico, recarga e utilidade.",
}


def paginas_itens(jogo, builds, herois):
    """Uma página própria para cada item da loja (preço, efeito, números reais
    e em quais heróis ele aparece nas builds mais usadas)."""
    os.makedirs(PASTA_ITENS, exist_ok=True)
    itens = jogo.get("itens") or {}
    por_arquivo = {h.get("file"): h for h in herois}

    # item -> heróis que usam esse item em pelo menos uma build
    usos = {}
    for entrada in builds.get("lista") or []:
        heroi = por_arquivo.get(entrada.get("img"))
        if not heroi or heroi.get("soon"):
            continue
        for b in entrada.get("builds") or []:
            for ident in b.get("itens") or []:
                usos.setdefault(str(ident), set()).add(heroi["name"])

    gerados, usados = [], set()
    for ident, it in itens.items():
        nome = it.get("n") or "Item"
        ingles = it.get("en") or ""
        apelido = slug(ingles or nome)
        if apelido in usados:
            apelido = "{}-{}".format(apelido, ident)
        usados.add(apelido)

        tipo = NOME_TIPO.get(it.get("s"), "Item")
        icone_tipo = ICONE_TIPO.get(it.get("s"), "fa-gem")
        custo = moeda(it.get("c")) if it.get("c") else "grátis"
        url = "{}item/{}.html".format(SITE, apelido)
        imagem = it.get("i") or "{}assets/brand/icon-192.png".format(SITE)
        descricao = (it.get("d") or TEXTO_TIPO.get(it.get("s"), ""))[:180]
        titulo = "{} — item de Deadlock ({} almas) | Central Deadlock".format(nome, custo)

        pagina = [cabecalho(titulo, "{}: {} Tier {} — {} almas. Veja o efeito, os números reais e em quais heróis ele aparece.".format(
            nome, tipo, it.get("t", "?"), custo), url, imagem, "pg-item")]

        pagina.append('        <div class="pg-wrap pg-wrap-item">')
        pagina.append(topo("itens", "Itens", nome).rstrip("\n"))
        pagina.append('')
        pagina.append('            <div class="pg-item-top">')
        pagina.append('                <div class="pg-item-ico"><img src="{}" alt="{}" width="96" height="96"></div>'.format(e(imagem), e(nome)))
        pagina.append('                <div>')
        pagina.append('                    <h1>{}</h1>'.format(e(nome)))
        if ingles and ingles != nome:
            pagina.append('                    <p class="pg-en">{}</p>'.format(e(ingles)))
        pagina.append('                    <div class="pg-item-tags">')
        pagina.append('                        <span class="tag"><i class="fa-solid {}"></i> {}</span>'.format(icone_tipo, e(tipo)))
        pagina.append('                        <span class="tag cy">Tier {}</span>'.format(e(it.get("t", "?"))))
        pagina.append('                        <span class="tag warn">{} almas</span>'.format(e(custo)))
        if it.get("a"):
            pagina.append('                        <span class="tag acc">Item ativo</span>')
        pagina.append('                    </div>')
        pagina.append('                </div>')
        pagina.append('            </div>')

        if it.get("win") is not None or it.get("x"):
            pagina.append('            <div class="pg-stats">')
            if it.get("win") is not None:
                pagina.append('                <div class="pg-stat"><b>{}%</b><small>win rate quando comprado</small></div>'.format(e(it.get("win"))))
            if it.get("x"):
                pagina.append('                <div class="pg-stat"><b>{}</b><small>compras registradas</small></div>'.format(moeda(it.get("x"))))
            pagina.append('                <div class="pg-stat"><b>{}</b><small>custo em almas</small></div>'.format(e(custo)))
            pagina.append('                <div class="pg-stat"><b>{}</b><small>tier</small></div>'.format(e(it.get("t", "?"))))
            pagina.append('            </div>')

        pagina.append('            <p class="pg-item-desc">{}</p>'.format(
            e(it.get("d") or "A loja do jogo ainda não tem a descrição deste item em português.")))
        if not it.get("d"):
            pagina.append('            <p class="pg-note">{}</p>'.format(e(TEXTO_TIPO.get(it.get("s"), ""))))

        nomes = sorted(usos.get(str(ident), set()))
        pagina.append('            <h2 class="pg-sec"><i class="fa-solid fa-users"></i> Em quais heróis ele aparece</h2>')
        if nomes:
            pagina.append('            <div class="pg-builds">')
            for nome_heroi in nomes[:10]:
                h = next((x for x in herois if x["name"] == nome_heroi), None)
                if not h:
                    continue
                pagina.append('                <a class="pg-build" href="../heroi/{}.html"><img src="../assets/heroes/{}" alt="{}" loading="lazy"><span><b>{}</b> — ver guia</span></a>'.format(
                    e(slug(nome_heroi)), e(h.get("file")), e(nome_heroi), e(nome_heroi)))
            pagina.append('            </div>')
            pagina.append('            <p class="pg-note">Baseado nas builds mais usadas que o site baixou do jogo.</p>')
        else:
            pagina.append('            <p class="pg-desc">Este item ainda não aparece nas builds que o site baixou.</p>')

        pagina.append('            <p class="pg-note">Números reais de partidas, via <b>deadlock-api.com</b>.</p>')
        pagina.append(rodape("../index.html#itens", "Ver todos os itens no site"))
        with open(os.path.join(PASTA_ITENS, apelido + ".html"), "w", encoding="utf-8") as arquivo:
            arquivo.write("\n".join(pagina))
        gerados.append({"url": url, "img": imagem, "alt": nome})
    return gerados


# --------------------------- counters (uma pagina por heroi) ---------------------------

def paginas_counters(herois, stats, jogo):
    """Uma pagina propria para cada heroi: contra quem ele ganha e contra quem
    ele perde, com o win rate real de cada confronto. E a busca que mais traz
    gente do Google ("counters de <heroi>") e cabe na aba Counters do site."""
    os.makedirs(PASTA_COUNTERS, exist_ok=True)
    contadores = jogo.get("contadores") or {}
    ids = jogo.get("ids") or {}
    stats_herois = stats.get("herois") or {}

    por_id = {}
    for h in herois:
        ident = ids.get(h["name"])
        if ident is not None:
            por_id[str(ident)] = h

    def linha(entrada):
        if not isinstance(entrada, (list, tuple)) or len(entrada) < 3:
            return ""
        outro = por_id.get(str(entrada[0]))
        if not outro:
            return ""
        try:
            win = float(entrada[1])
            partidas = int(entrada[2])
        except (TypeError, ValueError):
            return ""
        # a barra vai de 30% a 70% (metade = 50%), igual a aba Counters
        larg = max(6.0, min(100.0, ((win - 30) / 40) * 100))
        return ('                    <a class="cnt-linha" href="../heroi/{}.html">\n'
                '                        <img src="../assets/heroes/{}" alt="" loading="lazy">\n'
                '                        <span class="cnt-quem"><b>{}</b><small>{} partidas contra ele</small>'
                '<span class="cnt-barra"><i style="width:{:.1f}%"></i></span></span>\n'
                '                        <span class="cnt-wr">{:.1f}%</span>\n'
                '                    </a>').format(
                    e(slug(outro["name"])), e(outro.get("file")), e(outro["name"]),
                    moeda(partidas), larg, win)

    gerados = []
    for h in herois:
        if h.get("soon"):
            continue
        nome = h["name"]
        cont = contadores.get(str(ids.get(nome)))
        if not cont:
            continue
        bons = [x for x in (linha(v) for v in (cont.get("bons") or [])[:6]) if x]
        ruins = [x for x in (linha(v) for v in (cont.get("ruins") or [])[:6]) if x]
        if not bons or not ruins:
            continue

        apelido = slug(nome)
        s = stats_herois.get(nome) or {}
        url = "{}counter/{}.html".format(SITE, apelido)
        imagem = "{}assets/heroes/{}".format(SITE, h.get("file"))
        titulo = "Counters de {} — quem ele ganha e perde | Central Deadlock".format(nome)
        descricao = ("Counters de {}: os heróis que ele mais vence e os que ele mais perde, "
                     "com win rate real e número de partidas. Dados de verdade.").format(nome)

        pagina = [cabecalho(titulo, descricao, url, imagem, "pg-counter")]
        pagina.append('        <div class="pg-wrap">')
        pagina.append(topo("counters", "Counters", nome).rstrip("\n"))
        pagina.append('            <h1 class="pg-title">Counters de {}</h1>'.format(e(nome)))
        pagina.append('            <p class="pg-desc">Contra quem <b>{}</b> ganha e com quem ele precisa tomar '
                      'cuidado. O número é o win rate real dele nas partidas contra cada inimigo.</p>'.format(e(nome)))
        pagina.append('            <div class="pg-tags">')
        pagina.append('                <span class="tag">{}</span>'.format(e(h.get("role") or "Herói")))
        if h.get("arch"):
            pagina.append('                <span class="tag">{}</span>'.format(e(h["arch"])))
        if s.get("tier"):
            pagina.append('                <span class="tag">Tier {}</span>'.format(e(s["tier"])))
        pagina.append('            </div>')

        if s.get("win") is not None:
            pagina.append('            <div class="pg-stats">')
            pagina.append('                <div class="pg-stat"><b>{}%</b><small>win rate geral</small></div>'.format(e(s.get("win"))))
            if s.get("pick") is not None:
                pagina.append('                <div class="pg-stat"><b>{}%</b><small>pick rate</small></div>'.format(e(s.get("pick"))))
            if s.get("partidas") is not None:
                pagina.append('                <div class="pg-stat"><b>{}</b><small>partidas analisadas</small></div>'.format(moeda(s.get("partidas"))))
            pagina.append('            </div>')

        pagina.append('            <div class="cnt-grid">')
        pagina.append('                <div class="cnt-bloco bom">')
        pagina.append('                    <h3><i class="fa-solid fa-thumbs-up"></i> {} ganha de <small>melhores confrontos</small></h3>'.format(e(nome)))
        pagina.extend(bons)
        pagina.append('                </div>')
        pagina.append('                <div class="cnt-bloco ruim">')
        pagina.append('                    <h3><i class="fa-solid fa-triangle-exclamation"></i> Cuidado com <small>piores confrontos</small></h3>')
        pagina.extend(ruins)
        pagina.append('                </div>')
        pagina.append('            </div>')

        pagina.append('            <p class="pg-note">Win rate do {} nas partidas contra cada herói (mínimo de 400 partidas por confronto). '
                      'Quanto maior, melhor para o herói.</p>'.format(e(nome)))
        pagina.append('            <p style="margin-top: 18px"><a class="btn btn-dark pg-cta" href="../heroi/{}.html">'
                      '<i class="fa-solid fa-book"></i> Guia completo do {}</a></p>'.format(e(apelido), e(nome)))
        pagina.append(rodape("../index.html#counters", "Ver todos os counters no site"))

        with open(os.path.join(PASTA_COUNTERS, apelido + ".html"), "w", encoding="utf-8") as arquivo:
            arquivo.write("\n".join(pagina))
        gerados.append({"url": url, "img": imagem, "alt": nome})
    return gerados


# --------------------------- guia para iniciantes ---------------------------

SECOES_GUIA = [
    ("fa-gamepad", "O que é Deadlock", [
        "Deadlock é um jogo da Valve que mistura <b>tiro em terceira pessoa</b> com <b>MOBA</b>: dois times de 6 jogadores, "
        "heróis com habilidades e uma loja de itens comprada com <b>almas</b>.",
        "O objetivo é derrubar o <b>Patron</b> da base inimiga. Para chegar lá, o time precisa ganhar terreno, "
        "derrubar estruturas e ficar mais forte comprando itens.",
    ]),
    ("fa-map", "Como funciona uma partida", [
        "São <b>três rotas</b> (esquerdas, meio e direita) e uma selva entre elas. Cada jogador escolhe um herói e uma rota.",
        "Você ganha <b>almas</b> matando tropas, heróis, estruturas e objetivos. Tropas inimigas também podem ser <b>negadas</b> "
        "(o último tiro nelas tira a alma do adversário).",
        "Cada herói tem <b>4 habilidades</b>: três normais e uma <b>suprema</b>. Elas ficam mais fortes conforme você sobe de nível.",
        "No mapa existem <b>Guardians</b> e <b>Walkers</b> (as torres), o <b>Mid Boss</b>, o <b>Rejuvenator</b> e o <b>Patron</b> de cada base.",
    ]),
    ("fa-clock", "O que fazer no começo", [
        "Fique na sua rota e <b>mate as tropas</b> para juntar almas. Não fique parado esperando a sorte.",
        "<b>Negue</b> as tropas inimigas sempre que puder: além de atrapalhar o adversário, você ganha vantagem na rota.",
        "<b>Não morra à toa</b>: cada morte entrega almas e espaço para o outro time.",
        "Compre itens <b>cedo</b>. Guardar almas sem motivo deixa o herói fraco nas primeiras lutas.",
        "Avise o time quando alguém sumir da rota. Uma emboscada evitada vale mais que uma morte heroica.",
    ]),
    ("fa-users", "As funções do time", [
        "<b>Tanque</b> — aguenta a linha de frente e abre espaço para o time.",
        "<b>Suporte</b> — mantém o time vivo com cura, escudos e utilidade.",
        "<b>Carry</b> — fica forte ao longo da partida e decide as brigas no fim.",
        "<b>Controle</b> — domina a área da briga e atrapalha o posicionamento inimigo.",
        "<b>Assassino</b> — entra em cima de um alvo só e mata rápido antes de recuar.",
    ]),
    ("fa-gem", "Almas e itens", [
        "A loja tem três categorias: <b>Arma</b> (tiro), <b>Vitalidade</b> (sobrevivência) e <b>Espírito</b> (habilidades).",
        "Itens <b>ativos</b> precisam ser usados na hora certa — não adianta comprar e esquecer.",
        "Se estiver perdido, comece pelas <b>builds prontas</b> do site: elas mostram a ordem de compra que os jogadores mais usam.",
        "Cada item tem página própria com preço, efeito, win rate real e em quais heróis ele aparece.",
    ]),
    ("fa-bullseye", "Objetivos e virada de jogo", [
        "Derrubar <b>Guardians</b> e <b>Walkers</b> abre caminho para a base inimiga.",
        "<b>Mid Boss</b> e <b>Rejuvenator</b> dão vantagem para o time que controla o centro do mapa — vale disputar com visão e companhia.",
        "Não ataque sozinho: estrutura com o time inteiro cai muito mais rápido (e com menos risco).",
        "Se estiver atrás no jogo, jogue seguro, farme e espere um erro do adversário. Virada acontece.",
    ]),
    ("fa-triangle-exclamation", "Erros comuns de quem está começando", [
        "Comprar só dano e morrer para qualquer coisa: <b>sobreviver também é dano</b>.",
        "Ignorar as tropas e sair caçando herói o tempo todo.",
        "Entrar em luta 1 contra 3 e culpar o time.",
        "Esquecer de olhar o mapa e ser pego girando de rota.",
        "Não usar as habilidades com intenção — apertar tudo de uma vez e ficar sem nada na hora importante.",
    ]),
]


def pagina_guia(herois):
    """Guia para iniciantes (página fixa, ligada ao menu do site)."""
    url = SITE + "guia-iniciante.html"
    titulo = "Começando no Deadlock — guia para iniciantes | Central Deadlock"
    descricao = ("Guia em português para quem está começando no Deadlock: o básico da partida, funções, almas, "
                 "itens, objetivos e os erros mais comuns.")
    imagem = SITE + "assets/brand/icon-192.png"
    pagina = [cabecalho(titulo, descricao, url, imagem, "pg-guia", prefixo="")]
    pagina.append('        <div class="pg-wrap pg-wrap-guia">')
    pagina.append(topo("", "", "Começando", prefixo="", secao_ativa="comecando").rstrip("\n"))
    pagina.append('')
    pagina.append('            <h1 class="pg-title">Começando no Deadlock</h1>')
    pagina.append('            <p class="pg-desc">Um resumo direto para a sua primeira partida: o que é o jogo, o que fazer nos '
                  'primeiros minutos e o que evitar. Tudo em português.</p>')
    pagina.append('            <p class="pg-note">Este guia é educativo e não substitui o tutorial do jogo. '
                  'Os números do site vêm de partidas reais (deadlock-api.com).</p>')

    for icone, titulo_secao, paragrafos in SECOES_GUIA:
        pagina.append('            <section class="pg-card pg-guia-sec">')
        pagina.append('                <h2 class="pg-sec"><i class="fa-solid {}"></i> {}</h2>'.format(icone, e(titulo_secao)))
        for paragrafo in paragrafos:
            pagina.append('                <p>{}</p>'.format(paragrafo))
        pagina.append('            </section>')

    pagina.append('            <section class="pg-card pg-guia-sec">')
    pagina.append('                <h2 class="pg-sec"><i class="fa-solid fa-arrow-right"></i> Próximos passos</h2>')
    pagina.append('                <div class="pg-atalhos">')
    atalhos = [
        ("index.html#herois", "fa-masks-theater", "Escolha um herói", "44 heróis, com dificuldade e números reais"),
        ("index.html#guias", "fa-book", "Leia um guia", "Um guia pronto para cada herói"),
        ("index.html#builds", "fa-screwdriver-wrench", "Use uma build", "A ordem de compra que os jogadores mais usam"),
        ("index.html#itens", "fa-gem", "Entenda os itens", "Preço, efeito e win rate de cada item"),
        ("index.html#glossario", "fa-list", "Glossário", "As palavras que todo mundo usa no jogo"),
    ]
    for endereco, icone, nome, texto in atalhos:
        pagina.append('                    <a class="pg-atalho" href="{}"><i class="fa-solid {}"></i><b>{}</b><span>{}</span></a>'.format(
            e(endereco), icone, e(nome), e(texto)))
    pagina.append('                </div>')
    pagina.append('            </section>')
    pagina.append(rodape("index.html#comecando", "Abrir o guia no site", prefixo=""))
    with open(os.path.join(BASE, "guia-iniciante.html"), "w", encoding="utf-8") as arquivo:
        arquivo.write("\n".join(pagina))
    return {"url": url, "img": imagem, "alt": "Guia para iniciantes"}


def limpar_paginas_antigas(pasta, manter):
    """Apaga as páginas geradas que sobraram (ex.: notícia que saiu da lista).

    Só mexe em arquivos .html dessa pasta; nunca apaga outra coisa. Sem isso a
    página antiga continuava no ar (e podia aparecer no Google) mesmo depois de
    a notícia sair do site."""
    if not os.path.isdir(pasta):
        return []
    apagadas = []
    for nome in sorted(os.listdir(pasta)):
        caminho = os.path.join(pasta, nome)
        if not os.path.isfile(caminho) or not nome.lower().endswith(".html"):
            continue
        if nome[:-5] in manter:
            continue
        os.remove(caminho)
        apagadas.append(nome)
    return apagadas


# --------------------------- sitemap ---------------------------

def escrever_sitemap(paginas):
    hoje = datetime.date.today()
    # o robô do GitHub roda em UTC e você roda no horário de Brasília: perto da
    # meia-noite a data local pode ser "mais velha" que a do sitemap. Nunca deixa
    # a data andar para trás (senão o Google vê a página "rejuvenescendo").
    caminho = os.path.join(BASE, "sitemap.xml")
    try:
        with open(caminho, encoding="utf-8") as arquivo:
            antigas = re.findall(r"<lastmod>(\d{4}-\d{2}-\d{2})</lastmod>", arquivo.read())
        if antigas:
            maior = max(datetime.date.fromisoformat(d) for d in antigas)
            if maior > hoje:
                hoje = maior
    except Exception:
        pass
    hoje = hoje.isoformat()
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
    analitico = ler_js("data/hero-analytics.js")
    noticias = ler_js("data/steam-news.js")
    noticias = noticias.get("items") or []
    top = ler_js("data/top-jogadores.js")
    builds = ler_js("data/builds.js")

    paginas = paginas_herois(herois, stats, jogo, hist, extra, analitico, top)
    print("   {} paginas de herois".format(len(paginas)))
    paginas_not = paginas_noticias(noticias)
    print("   {} paginas de noticias".format(len(paginas_not)))
    paginas_item = paginas_itens(jogo, builds, herois)
    print("   {} paginas de itens".format(len(paginas_item)))
    paginas_cnt = paginas_counters(herois, stats, jogo)
    print("   {} paginas de counters".format(len(paginas_cnt)))
    guia = pagina_guia(herois)
    print("   guia-iniciante.html (guia para iniciantes)")

    # apaga as paginas que sobraram (noticia que saiu da lista, heroi renomeado...)
    slugs_herois = {p["url"].rsplit("/", 1)[-1][:-5] for p in paginas}
    antigas = limpar_paginas_antigas(PASTA_HEROIS, slugs_herois)
    antigas += limpar_paginas_antigas(PASTA_NOTICIAS, {str(n.get("id")) for n in noticias if n.get("id")})
    antigas += limpar_paginas_antigas(PASTA_ITENS, {p["url"].rsplit("/", 1)[-1][:-5] for p in paginas_item})
    antigas += limpar_paginas_antigas(PASTA_COUNTERS, {p["url"].rsplit("/", 1)[-1][:-5] for p in paginas_cnt})
    if antigas:
        print("   {} pagina(s) antiga(s) apagada(s): {}".format(len(antigas), ", ".join(antigas)))

    pagina_404()
    print("   404.html (pagina de endereco que nao existe)")

    total = escrever_sitemap(paginas + paginas_not + paginas_item + paginas_cnt + [guia])
    print("   sitemap.xml com {} enderecos".format(total))
    print("OK! Rode de novo sempre que mudar os herois ou chegarem noticias novas.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

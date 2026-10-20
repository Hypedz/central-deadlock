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

# Troque este número quando mudar o visual do site (style.css). Ele vai no fim do
# link do CSS (?v=...) só para o navegador de quem já visitou o site pegar a
# versão nova na hora, em vez de mostrar a antiga guardada na memória dele.
VERSAO_CSS = "20261017h"

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
<!-- deixa esta página também "instalável" no celular (igual à Home) -->
<link rel="manifest" href="../manifest.webmanifest">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Central Deadlock">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<link rel="stylesheet" href="../style.css?v={VERSAO_CSS}">
</head>
<body class="pg-body {classe}"{estilo}>"""


def rodape(voltar_para, voltar_nome):
    return f"""    <footer class="pg-foot">
        <a class="btn btn-lime pg-cta" href="{e(voltar_para)}"><i class="fa-solid fa-arrow-left"></i> {e(voltar_nome)}</a>
        <p>Central Deadlock é um site de fãs. Deadlock e todos os personagens são marcas da Valve Corporation.
        Este site não tem ligação com a Valve. Números reais de partidas, via <b>deadlock-api.com</b>.</p>
    </footer>
</div>
<script src="../pwa.js?v={VERSAO_CSS}" defer></script>
</body>
</html>
"""


def topo(secao_url, secao_nome, atual):
    return f"""    <header class="pg-top">
        <a class="pg-brand" href="../index.html"><img src="../assets/brand/icon-192.png" alt="Central Deadlock"><span>CENTRAL DEADLOCK</span></a>
        <nav class="pg-crumb"><a href="../index.html">Início</a> › <a href="../index.html#{e(secao_url)}">{e(secao_nome)}</a> › <b>{e(atual)}</b></nav>
        <a class="pg-busca" href="../index.html#buscar" title="Buscar herói, item ou notícia (Ctrl + K)"><i class="fa-solid fa-magnifying-glass"></i> Buscar no site</a>
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
    ("index.html#guias", "fa-book", "Guias", "Um guia pronto para cada herói"),
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
<link rel="icon" type="image/svg+xml" href="assets/brand/favicon.svg">
<link rel="apple-touch-icon" href="assets/brand/icon-192.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<link rel="stylesheet" href="style.css?v={VERSAO_CSS}">
</head>
<body class="pg-body pg-404">
    <div class="pg-wrap">
        <header class="pg-top">
            <a class="pg-brand" href="index.html"><img src="assets/brand/icon-192.png" alt="Central Deadlock"><span>CENTRAL DEADLOCK</span></a>
            <nav class="pg-crumb"><a href="index.html">Início</a> › <b>Página não encontrada</b></nav>
            <a class="pg-busca" href="index.html#buscar" title="Buscar herói, item ou notícia (Ctrl + K)"><i class="fa-solid fa-magnifying-glass"></i> Buscar no site</a>
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

def paginas_herois(herois, stats, jogo, hist, extra, analitico):
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
        pagina.append('                <a class="pg-atalho" href="../index.html#guias"><i class="fa-solid fa-book"></i><b>Guia completo</b><span>Passo a passo de como jogar com ele</span></a>')
        pagina.append('                <a class="pg-atalho" href="../index.html#builds"><i class="fa-solid fa-screwdriver-wrench"></i><b>Builds de todos os heróis</b><span>As mais usadas e o win rate de cada uma</span></a>')
        pagina.append('                <a class="pg-atalho" href="../index.html#ranking"><i class="fa-solid fa-ranking-star"></i><b>Ranking dos melhores</b><span>Os melhores de cada região, direto do jogo</span></a>')
        pagina.append('                <a class="pg-atalho" href="../index.html#itens"><i class="fa-solid fa-store"></i><b>Loja de itens</b><span>Preço e efeito de todos os itens</span></a>')
        pagina.append('            </div>')

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

    paginas = paginas_herois(herois, stats, jogo, hist, extra, analitico)
    print("   {} paginas de herois".format(len(paginas)))
    paginas_not = paginas_noticias(noticias)
    print("   {} paginas de noticias".format(len(paginas_not)))

    # apaga as paginas que sobraram (noticia que saiu da lista, heroi renomeado...)
    slugs_herois = {p["url"].rsplit("/", 1)[-1][:-5] for p in paginas}
    antigas = limpar_paginas_antigas(PASTA_HEROIS, slugs_herois)
    antigas += limpar_paginas_antigas(PASTA_NOTICIAS, {str(n.get("id")) for n in noticias if n.get("id")})
    if antigas:
        print("   {} pagina(s) antiga(s) apagada(s): {}".format(len(antigas), ", ".join(antigas)))

    pagina_404()
    print("   404.html (pagina de endereco que nao existe)")

    total = escrever_sitemap(paginas + paginas_not)
    print("   sitemap.xml com {} enderecos".format(total))
    print("OK! Rode de novo sempre que mudar os herois ou chegarem noticias novas.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

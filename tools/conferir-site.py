# -*- coding: utf-8 -*-
"""
Confere a saude do site sem alterar NADA.

Ele olha cinco coisas:

  1. Fontes externas  - Steam, deadlock-api, Liquipedia, tradutor,
                        Font Awesome e Wiki respondem?
  2. Dados            - os arquivos de data/ foram atualizados recentemente?
  3. Robos do GitHub  - as ultimas execucoes dos workflows deram certo?
  4. Site publicado   - a home, o sitemap, o manifest e o 404 respondem?
  5. Links internos   - paginas, imagens, fontes e CSS existem mesmo?

Como usar (dentro da pasta do site):

  python tools/conferir-site.py
  python tools/conferir-site.py --sem-rede     (so dados e links locais)
  python tools/conferir-site.py --estrito      (aviso tambem conta como falha)
  python tools/conferir-site.py --json         (resultado para outro programa)

O codigo de saida e 0 quando esta tudo certo (ou so ha avisos) e 1
quando existe alguma FALHA. Nada e enviado para nenhum servidor alem
das proprias fontes que o site ja usa.
"""

import argparse
import datetime
import gzip
import html
import json
import os
import re
import ssl
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FUSO_BR = datetime.timezone(datetime.timedelta(hours=-3))
UA = "CentralDeadlockCheck/1.0 (+https://hypedz.github.io/central-deadlock/)"

OK = "OK"
AVISO = "AVISO"
FALHA = "FALHA"

# ------------------------------------------------------------------
# utilidades
# ------------------------------------------------------------------

def agora_br():
    return datetime.datetime.now(FUSO_BR)


def ler(caminho, limite=None):
    with open(caminho, encoding="utf-8", errors="replace") as arquivo:
        return arquivo.read(limite) if limite else arquivo.read()


def contexto_seguro():
    """Usa a lista de certificados do 'certifi' quando ela existe.

    Alguns computadores com Windows desatualizado recusam sites que estao
    com o certificado em dia. E o mesmo cuidado que tools/update-esports.py
    ja toma.
    """
    try:
        import certifi
        return ssl.create_default_context(cafile=certifi.where())
    except Exception:
        return ssl.create_default_context()


def contexto_sem_verificar():
    contexto = ssl.create_default_context()
    contexto.check_hostname = False
    contexto.verify_mode = ssl.CERT_NONE
    return contexto


def http_get(url, tempo=15, cabecalhos=None, limite=3000000, permitir_sem_verificar=False):
    """Devolve (status, corpo, erro, inseguro).

    status None = nem chegou no servidor. inseguro=True significa que o
    certificado foi recusado e a leitura foi refeita sem verificar (so
    acontece quando quem chamou autoriza, como na Liquipedia).
    """

    def pedir(contexto):
        pedido = urllib.request.Request(url, headers={"User-Agent": UA, **(cabecalhos or {})})
        with urllib.request.urlopen(pedido, timeout=tempo, context=contexto) as resposta:
            codificacao = (resposta.headers.get("Content-Encoding") or "").lower()
            if "gzip" in codificacao:
                dados = gzip.decompress(resposta.read())
            else:
                dados = resposta.read(limite)
            return resposta.status, dados, None, False

    try:
        return pedir(contexto_seguro())
    except urllib.error.HTTPError as erro:
        return erro.code, b"", None, False
    except Exception as erro:  # timeout, DNS, SSL, conexao recusada...
        if permitir_sem_verificar and "CERTIFICATE" in str(erro).upper():
            try:
                status, dados, _, _ = pedir(contexto_sem_verificar())
                return status, dados, None, True
            except urllib.error.HTTPError as erro_http:
                return erro_http.code, b"", None, True
            except Exception as erro_final:
                return None, b"", str(erro_final), True
        return None, b"", str(erro), False


def nova_secao(titulo):
    return {"titulo": titulo, "itens": []}


def add(secao, nivel, texto):
    secao["itens"].append({"nivel": nivel, "texto": texto})


def idade_texto(horas):
    if horas < 1:
        return "menos de 1h"
    if horas < 48:
        return "{:.0f}h".format(horas)
    return "{:.0f} dias".format(horas / 24)


def parse_carimbo(valor):
    """Le '03/11/2026 as 18:10'. Os robos do GitHub rodam em UTC."""
    if not valor:
        return None
    achado = re.search(r"(\d{1,2}/\d{1,2}/\d{4})\s+as\s+(\d{1,2}:\d{2})", str(valor))
    if not achado:
        return None
    try:
        return datetime.datetime.strptime(
            achado.group(1) + " " + achado.group(2), "%d/%m/%Y %H:%M"
        ).replace(tzinfo=datetime.timezone.utc)
    except ValueError:
        return None


def repo_do_git():
    try:
        saida = subprocess.check_output(
            ["git", "remote", "get-url", "origin"],
            cwd=BASE, text=True, stderr=subprocess.DEVNULL, timeout=10
        ).strip()
        achado = re.search(r"github\.com[:/]([^/\s]+/[^/\s.]+)", saida)
        if achado:
            return achado.group(1)
    except Exception:
        pass
    return None


def site_do_canonical():
    try:
        texto = ler(os.path.join(BASE, "index.html"), 4000)
        achado = re.search(r'<link[^>]+rel=["\']canonical["\'][^>]+href=["\']([^"\']+)', texto)
        if achado:
            return achado.group(1).rstrip("/") + "/"
    except Exception:
        pass
    return "https://hypedz.github.io/central-deadlock/"


def versao_local():
    try:
        texto = ler(os.path.join(BASE, "index.html"), 12000)
        achado = re.search(r"style\.css\?v=([\w.\-]+)", texto)
        return achado.group(1) if achado else ""
    except Exception:
        return ""


# ------------------------------------------------------------------
# 1. fontes externas
# ------------------------------------------------------------------

def validar_json(corpo, chave=None):
    dados = json.loads(corpo.decode("utf-8"))
    if chave and chave not in dados:
        raise ValueError("resposta sem a chave '{}'".format(chave))
    return dados


def conferir_fonte(secao, nome, url, validador=None, bloqueio_e_aviso=True, tempo=15,
                   cabecalhos=None, permitir_sem_verificar=False):
    status, corpo, erro, inseguro = http_get(
        url, tempo=tempo, cabecalhos=cabecalhos,
        permitir_sem_verificar=permitir_sem_verificar
    )

    if status is None:
        add(secao, FALHA, "{} - sem resposta ({})".format(nome, erro))
        return

    if status in (401, 403, 429) and bloqueio_e_aviso:
        add(secao, AVISO, "{} - HTTP {} (o servidor respondeu, mas bloqueou o robo; "
                          "confira no navegador)".format(nome, status))
        return

    if status >= 400:
        add(secao, FALHA, "{} - HTTP {}".format(nome, status))
        return

    if validador:
        try:
            validador(corpo)
        except Exception as erro_conteudo:
            add(secao, AVISO, "{} - HTTP {}, mas o conteudo mudou ({})".format(
                nome, status, erro_conteudo))
            return

    if inseguro:
        add(secao, AVISO, "{} - HTTP {} (certificado recusado; conferi sem "
                          "verificar)".format(nome, status))
        return

    add(secao, OK, "{} - HTTP {}".format(nome, status))


def verificar_fontes(secao, tempo):
    fontes = [
        {
            "nome": "Steam News",
            "url": "https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/"
                   "?appid=1422450&count=1&maxlength=1",
            "validador": lambda c: validar_json(c, "appnews"),
        },
        {
            "nome": "deadlock-api (herois)",
            "url": "https://api.deadlock-api.com/v1/assets/heroes",
            "validador": lambda c: validar_json(c),
        },
        {
            "nome": "Liquipedia (torneios)",
            "url": "https://liquipedia.net/deadlock/api.php"
                   "?action=parse&page=Portal:Tournaments&prop=text&format=json",
            "validador": lambda c: validar_json(c, "parse"),
            "cabecalhos": {"Accept-Encoding": "gzip"},
            "permitir_sem_verificar": True,
        },
        {
            "nome": "Google Tradutor",
            "url": "https://translate.googleapis.com/translate_a/single"
                   "?client=gtx&sl=en&tl=pt&dt=t&q=test",
            "validador": lambda c: None if c.strip() else
            (_ for _ in ()).throw(ValueError("resposta vazia")),
        },
        {
            "nome": "Font Awesome (CDN)",
            "url": "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/"
                   "6.4.0/css/all.min.css",
            "validador": lambda c: None if b"font awesome" in c.lower() else
            (_ for _ in ()).throw(ValueError("CSS inesperado")),
        },
        {
            "nome": "Wiki do Deadlock",
            "url": "https://deadlock.wiki",
            "validador": lambda c: None if b"<html" in c.lower() else
            (_ for _ in ()).throw(ValueError("HTML inesperado")),
        },
    ]

    for fonte in fontes:
        conferir_fonte(
            secao, fonte["nome"], fonte["url"], fonte.get("validador"),
            tempo=tempo, cabecalhos=fonte.get("cabecalhos"),
            permitir_sem_verificar=fonte.get("permitir_sem_verificar", False)
        )


# ------------------------------------------------------------------
# 2. frescor dos dados
# ------------------------------------------------------------------

ARQUIVOS_DADOS = [
    ("data/steam-news.js", "Noticias do Steam", 12, 72),
    ("data/hero-stats.js", "Estatisticas dos herois", 12, 72),
    ("data/game-data.js", "Itens e dados do jogo", 12, 72),
    ("data/hero-extra.js", "Etiquetas e historia", 12, 72),
    ("data/hero-history.js", "Historico de win rate", 12, 72),
    ("data/hero-analytics.js", "Habilidades e duplas", 12, 72),
    ("data/builds.js", "Builds", 12, 72),
    ("data/guias.js", "Guias", 12, 72),
    ("data/elos.js", "Elos", 36, 120),
    ("data/esports.js", "Esports (Liquipedia)", 36, 120),
    ("data/top-jogadores.js", "Top jogadores", 36, 120),
]


def verificar_dados(secao):
    agora = datetime.datetime.now(datetime.timezone.utc)

    for relativo, nome, aviso_h, falha_h in ARQUIVOS_DADOS:
        caminho = os.path.join(BASE, relativo)
        if not os.path.exists(caminho):
            add(secao, FALHA, "{} - arquivo nao encontrado ({})".format(nome, relativo))
            continue

        texto = ler(caminho, 6000)
        carimbo = None
        origem = ""

        achado = re.search(r'"updated"\s*:\s*"([^"]+)"', texto)
        if achado:
            carimbo = parse_carimbo(achado.group(1))
            origem = "carimbo do arquivo"

        if not carimbo:
            achado = re.search(
                r"[UÚ]ltima atualizacao:\s*(\d{1,2}/\d{1,2}/\d{4}\s+as\s+\d{1,2}:\d{2})",
                texto, re.IGNORECASE
            )
            if achado:
                carimbo = parse_carimbo(achado.group(1))
                origem = "comentario do arquivo"

        if not carimbo:
            carimbo = datetime.datetime.fromtimestamp(
                os.path.getmtime(caminho), tz=datetime.timezone.utc
            )
            origem = "data do arquivo (nao achei carimbo)"

        horas = max(0.0, (agora - carimbo).total_seconds() / 3600.0)
        quando = carimbo.astimezone(FUSO_BR).strftime("%d/%m/%Y %H:%M")
        detalhe = "{} - atualizado ha {} ({}, {}) [limite {}h/{}h]".format(
            nome, idade_texto(horas), quando, origem, aviso_h, falha_h
        )

        if horas > falha_h:
            add(secao, FALHA, detalhe)
        elif horas > aviso_h:
            add(secao, AVISO, detalhe)
        else:
            add(secao, OK, detalhe)


# ------------------------------------------------------------------
# 3. robos do GitHub
# ------------------------------------------------------------------

WORKFLOWS = [
    ("noticias.yml", "Noticias do Steam + Discord", 6, 30),
    ("publicar-site.yml", "Publicar o site", None, None),
    ("testes.yml", "Testes automaticos", None, None),
]


def verificar_robos(secao, repo, tempo):
    url = "https://api.github.com/repos/{}/actions/runs?per_page=60".format(repo)
    cabecalhos = {"Accept": "application/vnd.github+json"}
    token = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    if token:
        cabecalhos["Authorization"] = "Bearer " + token

    status, corpo, erro, _ = http_get(url, tempo=tempo, cabecalhos=cabecalhos, limite=3000000)

    if status is None:
        add(secao, FALHA, "GitHub Actions - sem resposta ({})".format(erro))
        return

    if status in (403, 429):
        add(secao, AVISO, "GitHub Actions - HTTP {} (limite da API; tente de novo "
                          "mais tarde ou defina GITHUB_TOKEN)".format(status))
        return

    if status >= 400:
        add(secao, FALHA, "GitHub Actions - HTTP {}".format(status))
        return

    try:
        execucoes = json.loads(corpo.decode("utf-8")).get("workflow_runs", [])
    except Exception as erro_json:
        add(secao, AVISO, "GitHub Actions - resposta inesperada ({})".format(erro_json))
        return

    agora = datetime.datetime.now(datetime.timezone.utc)

    for arquivo, nome, aviso_h, falha_h in WORKFLOWS:
        encontradas = [e for e in execucoes if str(e.get("path", "")).endswith(arquivo)]
        if not encontradas:
            add(secao, AVISO, "{} - nenhuma execucao encontrada".format(nome))
            continue

        ultima = encontradas[0]
        quando = ultima.get("created_at") or ""
        try:
            data = datetime.datetime.fromisoformat(quando.replace("Z", "+00:00"))
            horas = max(0.0, (agora - data).total_seconds() / 3600.0)
            idade = "ha " + idade_texto(horas)
        except Exception:
            horas = 0.0
            idade = "em data desconhecida"

        estado = ultima.get("status") or ""
        conclusao = ultima.get("conclusion") or ""
        link = ultima.get("html_url") or ""

        if estado != "completed":
            if horas > 3:
                add(secao, AVISO, "{} - {} {} (pode estar travado)".format(nome, estado, idade))
            else:
                add(secao, OK, "{} - {} {}".format(nome, estado, idade))
            continue

        if conclusao == "success":
            if aviso_h is not None and horas > falha_h:
                add(secao, FALHA, "{} - ultima execucao com sucesso {}, mas passou do "
                                  "limite de {}h".format(nome, idade, falha_h))
            elif aviso_h is not None and horas > aviso_h:
                add(secao, AVISO, "{} - ultima execucao com sucesso {} (o normal era "
                                  "a cada poucas horas)".format(nome, idade))
            else:
                add(secao, OK, "{} - sucesso {}".format(nome, idade))
        elif conclusao in ("failure", "timed_out", "action_required"):
            add(secao, FALHA, "{} - {} {} - veja {}".format(nome, conclusao, idade, link))
        elif conclusao == "cancelled":
            add(secao, AVISO, "{} - cancelada {} - veja {}".format(nome, idade, link))
        elif conclusao == "skipped":
            add(secao, AVISO, "{} - pulada {}".format(nome, idade))
        else:
            add(secao, AVISO, "{} - terminou como '{}' {}".format(nome, conclusao, idade))


# ------------------------------------------------------------------
# 4. site publicado
# ------------------------------------------------------------------

def verificar_site(secao, site, tempo):
    versao = versao_local()
    carimbo = int(agora_br().timestamp())

    status, corpo, erro, _ = http_get(site + "?conferencia=" + str(carimbo), tempo=tempo)
    if status is None:
        add(secao, FALHA, "Home - sem resposta ({})".format(erro))
    elif status >= 400:
        add(secao, FALHA, "Home - HTTP {}".format(status))
    else:
        if versao and versao.encode("utf-8") not in corpo:
            add(secao, AVISO, "Home - HTTP {}, mas a versao publicada nao mostra "
                              "a versao local ({})".format(status, versao))
        else:
            add(secao, OK, "Home - HTTP {}{}".format(
                status, ", versao " + versao if versao else ""))

    # sitemap: publicado x local
    status, corpo, erro, _ = http_get(site + "sitemap.xml", tempo=tempo)
    if status is None:
        add(secao, FALHA, "sitemap.xml - sem resposta ({})".format(erro))
    elif status >= 400:
        add(secao, FALHA, "sitemap.xml - HTTP {}".format(status))
    else:
        publicados = corpo.count(b"<loc>")
        locais = 0
        try:
            locais = ler(os.path.join(BASE, "sitemap.xml")).count("<loc>")
        except Exception:
            pass
        if locais and publicados != locais:
            add(secao, AVISO, "sitemap.xml - HTTP {}, {} enderecos no ar (o local tem {})".format(
                status, publicados, locais))
        else:
            add(secao, OK, "sitemap.xml - HTTP {}, {} enderecos".format(status, publicados))

    # manifest e service worker
    for nome, caminho in (("manifest.webmanifest", "manifest.webmanifest"),
                          ("sw.js", "sw.js")):
        status, corpo, erro, _ = http_get(site + caminho, tempo=tempo)
        if status is None:
            add(secao, FALHA, "{} - sem resposta ({})".format(nome, erro))
        elif status >= 400:
            add(secao, FALHA, "{} - HTTP {}".format(nome, status))
        else:
            add(secao, OK, "{} - HTTP {}".format(nome, status))

    # pagina que nao existe deve devolver 404 de verdade
    status, corpo, erro, _ = http_get(site + "pagina-que-nao-existe-" + str(carimbo), tempo=tempo)
    if status is None:
        add(secao, FALHA, "Pagina 404 - sem resposta ({})".format(erro))
    elif status == 404:
        add(secao, OK, "Pagina 404 - HTTP 404 (correto)")
    else:
        add(secao, AVISO, "Pagina 404 - HTTP {} (o GitHub Pages pode estar "
                          "devolvendo outra coisa)".format(status))


# ------------------------------------------------------------------
# 5. arquivos e links internos
# ------------------------------------------------------------------

OBRIGATORIOS = [
    "index.html", "404.html", "offline.html", "sitemap.xml", "robots.txt",
    "manifest.webmanifest", "sw.js", "style.css", "script.js",
    "assets/brand/share.jpg", "assets/brand/favicon-c.svg",
]

PULAR_LINK = ("http://", "https://", "//", "mailto:", "tel:", "javascript:",
              "data:", "blob:", "about:", "#")

RE_HREF = re.compile(r'(?:href|src)\s*=\s*["\']([^"\']+)["\']', re.IGNORECASE)
RE_CSS_URL = re.compile(r'url\(\s*(["\']?)([^)"\']+)\1\s*\)', re.IGNORECASE)


def paginas_html():
    paginas = []
    for nome in os.listdir(BASE):
        if nome.lower().endswith(".html"):
            paginas.append(os.path.join(BASE, nome))
    for pasta in ("heroi", "noticia", "item", "counter"):
        raiz = os.path.join(BASE, pasta)
        if not os.path.isdir(raiz):
            continue
        for nome in os.listdir(raiz):
            if nome.lower().endswith(".html"):
                paginas.append(os.path.join(raiz, nome))
    return sorted(paginas)


def resolver_alvo(origem, alvo):
    alvo = alvo.strip()
    if not alvo:
        return ""
    if alvo.lower().startswith(PULAR_LINK):
        return ""
    alvo = alvo.split("#", 1)[0].split("?", 1)[0]
    if not alvo:
        return ""
    alvo = urllib.parse.unquote(alvo)
    raiz = alvo.startswith("/")
    if raiz:
        prefixo = "/central-deadlock/"
        alvo = alvo[len(prefixo):] if alvo.startswith(prefixo) else alvo.lstrip("/")
    base = BASE if raiz else os.path.dirname(origem)
    return os.path.normpath(os.path.join(base, alvo))


def verificar_arquivos_e_links(secao):
    for relativo in OBRIGATORIOS:
        if not os.path.exists(os.path.join(BASE, relativo)):
            add(secao, FALHA, "Arquivo obrigatorio faltando: {}".format(relativo))

    # icones do manifest
    try:
        manifest = json.loads(ler(os.path.join(BASE, "manifest.webmanifest")))
        for icone in manifest.get("icons", []):
            src = icone.get("src") or ""
            if src and not src.lower().startswith(PULAR_LINK):
                destino = os.path.normpath(os.path.join(BASE, src.split("?")[0]))
                if not os.path.exists(destino):
                    add(secao, FALHA, "Icone do manifest faltando: {}".format(src))
    except Exception:
        pass

    paginas = paginas_html()
    faltando = {}
    total_links = 0

    for pagina in paginas:
        relativo = os.path.relpath(pagina, BASE).replace("\\", "/")
        try:
            texto = ler(pagina)
        except Exception:
            add(secao, FALHA, "Nao consegui ler {}".format(relativo))
            continue
        for achado in RE_HREF.finditer(texto):
            bruto = html.unescape(achado.group(1)).strip()
            if not bruto or bruto.lower().startswith(PULAR_LINK):
                continue
            destino = resolver_alvo(pagina, bruto)
            if not destino:
                continue
            total_links += 1
            if not os.path.exists(destino):
                chave = bruto.split("#", 1)[0].split("?", 1)[0]
                faltando.setdefault(chave, relativo)

    # fontes e imagens chamadas pelo CSS
    for nome in os.listdir(BASE):
        if not nome.lower().endswith(".css"):
            continue
        caminho = os.path.join(BASE, nome)
        try:
            texto = ler(caminho)
        except Exception:
            continue
        for achado in RE_CSS_URL.finditer(texto):
            bruto = achado.group(2).strip()
            if not bruto or bruto.lower().startswith(PULAR_LINK):
                continue
            destino = resolver_alvo(caminho, bruto)
            if not destino:
                continue
            total_links += 1
            if not os.path.exists(destino):
                faltando.setdefault(bruto.split("?", 1)[0], nome)

    if not faltando:
        add(secao, OK, "{} paginas e {} links locais conferidos, nenhum quebrado".format(
            len(paginas), total_links))
        return

    add(secao, FALHA, "{} link(s) local(is) quebrado(s):".format(len(faltando)))
    for alvo, origem in list(faltando.items())[:15]:
        add(secao, FALHA, "  {} (encontrado em {})".format(alvo, origem))
    if len(faltando) > 15:
        add(secao, FALHA, "  ... e mais {} link(s)".format(len(faltando) - 15))


# ------------------------------------------------------------------
# relatorio
# ------------------------------------------------------------------

def contar(secoes):
    total = {OK: 0, AVISO: 0, FALHA: 0}
    for secao in secoes:
        for item in secao["itens"]:
            total[item["nivel"]] += 1
    return total


def imprimir(secoes, quando, sem_rede):
    print("=" * 68)
    print(" CENTRAL DEADLOCK - CONFERENCIA DO SITE")
    print(" {} (horario de Brasilia)".format(quando.strftime("%d/%m/%Y %H:%M")))
    if sem_rede:
        print(" Modo --sem-rede: so dados e arquivos locais")
    print("=" * 68)

    for secao in secoes:
        print("")
        print(secao["titulo"])
        for item in secao["itens"]:
            print("  [{:<5}] {}".format(item["nivel"], item["texto"]))

    total = contar(secoes)
    print("")
    print("-" * 68)
    print(" RESULTADO: {} falha(s), {} aviso(s), {} verificacao(oes) OK".format(
        total[FALHA], total[AVISO], total[OK]))
    print("-" * 68)

    if total[FALHA]:
        print(" Corrija as FALHAS acima. As mais comuns: robo parado, fonte")
        print(" externa fora do ar ou link interno apontando para arquivo que")
        print(" nao existe mais.")
    elif total[AVISO]:
        print(" Nada urgente, mas vale olhar os AVISOS. Bloqueios HTTP 403/429")
        print(" (Liquipedia, tradutor) costumam ser temporarios e nao quebram o site.")
    else:
        print(" Tudo certo. O site, os dados e os robos estao saudaveis.")
    print("")


def main():
    parser = argparse.ArgumentParser(
        description="Confere fontes, dados, robos, site publicado e links internos."
    )
    parser.add_argument("--sem-rede", action="store_true",
                        help="nao acessa a internet (so dados e links locais)")
    parser.add_argument("--estrito", action="store_true",
                        help="aviso tambem faz o programa terminar com erro")
    parser.add_argument("--json", action="store_true",
                        help="mostra o resultado em JSON, sem o relatorio bonito")
    parser.add_argument("--tempo", type=int, default=15,
                        help="tempo maximo de cada acesso em segundos (padrao: 15)")
    args = parser.parse_args()

    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

    quando = agora_br()
    secoes = []

    if args.sem_rede:
        secao = nova_secao("[1] FONTES EXTERNAS")
        add(secao, AVISO, "Verificacao de rede pulada (--sem-rede)")
        secoes.append(secao)

        secao = nova_secao("[2] DADOS")
        verificar_dados(secao)
        secoes.append(secao)

        secao = nova_secao("[3] ROBOS DO GITHUB")
        add(secao, AVISO, "Verificacao de rede pulada (--sem-rede)")
        secoes.append(secao)

        secao = nova_secao("[4] SITE PUBLICADO")
        add(secao, AVISO, "Verificacao de rede pulada (--sem-rede)")
        secoes.append(secao)
    else:
        site = os.environ.get("CDL_SITE") or site_do_canonical()
        repo = os.environ.get("CDL_REPO") or repo_do_git() or "Hypedz/central-deadlock"

        secao = nova_secao("[1] FONTES EXTERNAS")
        verificar_fontes(secao, args.tempo)
        secoes.append(secao)

        secao = nova_secao("[2] DADOS")
        verificar_dados(secao)
        secoes.append(secao)

        secao = nova_secao("[3] ROBOS DO GITHUB")
        verificar_robos(secao, repo, args.tempo)
        secoes.append(secao)

        secao = nova_secao("[4] SITE PUBLICADO")
        verificar_site(secao, site, args.tempo)
        secoes.append(secao)

    secao = nova_secao("[5] ARQUIVOS E LINKS INTERNOS")
    verificar_arquivos_e_links(secao)
    secoes.append(secao)

    total = contar(secoes)

    if args.json:
        print(json.dumps({
            "quando": quando.isoformat(),
            "sem_rede": args.sem_rede,
            "resumo": total,
            "secoes": secoes,
        }, ensure_ascii=False, indent=2))
    else:
        imprimir(secoes, quando, args.sem_rede)

    if total[FALHA]:
        return 1
    if args.estrito and total[AVISO]:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())

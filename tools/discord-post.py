# -*- coding: utf-8 -*-
"""
CENTRAL DEADLOCK -> DISCORD
Posta as noticias e os patch notes do Deadlock num canal do seu servidor.

COMO CONFIGURAR (so uma vez):
  1. No Discord, crie UM webhook em cada canal que vai receber as noticias:
     botao direito no canal > "Editar canal" > "Integracoes" > "Webhooks"
     > "Novo webhook" > nome "Central Deadlock" > "Copiar URL do webhook"
  2. Cole as URLs no arquivo "discord-webhook.txt" (na pasta do site), assim:

       patches  = <URL do canal #patch-notes>
       noticias = <URL do canal #novidades>

     Pode usar so uma linha, se quiser que tudo caia num canal so.

COMO USAR (no terminal, dentro da pasta do site):
  python tools/discord-post.py            -> posta o que ainda nao foi postado
  python tools/discord-post.py --teste    -> manda uma mensagem de teste
  python tools/discord-post.py --tudo     -> posta as 10 mais recentes
  python tools/discord-post.py --dry-run  -> so mostra o que seria enviado

No Windows: dois cliques em "postar-no-discord.bat"

IMPORTANTE: a URL do webhook e como uma senha. Ela fica no arquivo
discord-webhook.txt, que NAO vai para o GitHub (esta no .gitignore).
"""

import argparse
import datetime
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request

# O terminal do Windows as vezes nao aceita emojis; isto evita erros feios.
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARQ_WEBHOOK = os.path.join(BASE, "discord-webhook.txt")
ARQ_NOTICIAS = os.path.join(BASE, "data", "steam-news.js")
ARQ_ESTADO = os.path.join(BASE, "data", "discord-posted.json")

LIMA = 0xB6F24A       # verde-limao do site
CIANO = 0x22D3EE      # azul para noticias comuns
NOME = "Central Deadlock"

INSTRUCOES = """
==========================================================
  FALTA CONFIGURAR O WEBHOOK DO DISCORD
==========================================================
  1. No Discord: botao direito no canal > Editar canal
  2. Integracoes > Webhooks > Novo webhook
  3. Nome: Central Deadlock  >  Copiar URL do webhook
  4. Cole a URL no arquivo discord-webhook.txt, assim:

       patches = <URL do canal #patch-notes>
       noticias = <URL do canal #novidades>

     (pode usar so uma das linhas, se quiser um canal so)
==========================================================
"""


MODELO = """# ==========================================================
#  CENTRAL DEADLOCK -> DISCORD
# ==========================================================
# Cole as URLs dos webhooks dos seus canais (depois do =).
#
# Como conseguir uma URL:
#   1. No Discord, clique com o botao direito no canal
#   2. Editar canal > Integracoes > Webhooks > Novo webhook
#   3. Nome: Central Deadlock  >  Copiar URL do webhook
#
# Cole a URL "pura", sem os sinais < > e sem aspas.
# Este arquivo NAO vai para o GitHub (esta no .gitignore).
# ----------------------------------------------------------

# Patch notes vao para este canal (o mais importante):
patches =

# Noticias e novidades vao para este canal:
noticias =

# (Opcional) ID de um cargo para avisar quando sair patch novo:
# cargo =

# DICA: se preferir um canal so, use apenas uma das linhas.
"""


def criar_modelo():
    """Cria o arquivo de configuracao quando ele ainda nao existe."""
    try:
        with open(ARQ_WEBHOOK, "w", encoding="utf-8") as arquivo:
            arquivo.write(MODELO)
        return True
    except Exception:
        return False


def limpar_url(valor):
    """Tira sujeira que vem junto na hora de colar: <URL>, "URL", espacos, barra no fim."""
    v = (valor or "").strip()
    for _ in range(3):
        v = v.strip()
        if len(v) >= 2 and v[0] in "<\"'([{" and v[-1] in ">\"')]}":
            v = v[1:-1].strip()
        else:
            break
    v = v.strip().rstrip("/")
    return v


def mascarar(url):
    """Mostra a URL sem expor o codigo secreto."""
    url = (url or "").strip()
    if len(url) <= 46:
        return url
    return url[:46] + "..." + url[-6:]


def url_valida(url):
    """Confere se o texto e mesmo uma URL de webhook do Discord."""
    return bool(re.match(
        r"^https://(ptb\.|canary\.)?discord(app)?\.com/api/webhooks/\d+/[\w.\-]{20,}"
        r"(?:\?.*)?$",
        limpar_url(url)))


def problemas_na_config(cfg):
    """Aponta o que esta errado nas URLs, com dica do que fazer."""
    achados = []
    vistas = set()
    for chave, rotulo in (("patches", "patch notes"), ("noticias", "novidades")):
        url = limpar_url(cfg.get(chave) or "")
        if not url or url in vistas:
            continue
        vistas.add(url)
        if url_valida(url):
            continue
        if re.search(r"[<>]", url):
            dica = ("tem um sinal de < ou > sobrando no meio da URL. "
                    "Cole a URL pura, sem esses sinais.")
        elif re.search(r"COLE_AQUI|SEU_|SUA_|XXX|exemplo|placeholder", url, re.I):
            dica = ("o texto de exemplo ainda esta no lugar da URL. "
                    "Copie a URL de verdade la no Discord.")
        elif "/api/webhooks/" not in url:
            dica = "esta faltando a parte \"/api/webhooks/\" no meio da URL."
        elif not re.search(r"/webhooks/\d+/", url):
            dica = ("depois de /webhooks/ tem que vir um numero grande (o ID) "
                    "e mais um codigo. Voce copiou a URL inteira?")
        elif not url.startswith("https://"):
            dica = "a URL precisa comecar com https://"
        else:
            dica = ("o formato e: https://discord.com/api/webhooks/<numeros>/<codigo>. "
                    "Copie de novo, sem espacos sobrando.")
        achados.append("   canal de {} -> {}\n     dica: {}".format(
            rotulo, mascarar(url), dica))
    return achados


def carregar_config():
    """Le os webhooks do Discord.

    Formato recomendado no arquivo discord-webhook.txt:
        patches  = <URL do canal de patch notes>
        noticias = <URL do canal de novidades>
        cargo    = <ID de um cargo para avisar nos patches>   (opcional)

    Tambem aceita o formato simples: a 1a linha so com a URL
    das noticias e a 2a linha com o ID do cargo.
    """
    cfg = {
        "noticias": (os.environ.get("DISCORD_WEBHOOK") or "").strip(),
        "patches": (os.environ.get("DISCORD_WEBHOOK_PATCHES") or "").strip(),
        "cargo": (os.environ.get("DISCORD_CARGO") or "").strip(),
    }
    # se o arquivo ainda nao existe, cria um modelo prontinho para preencher
    # (mas nao cria quando roda no robo do GitHub, onde nao faz sentido)
    if (not os.path.exists(ARQ_WEBHOOK) and not (cfg["noticias"] or cfg["patches"])
            and not os.environ.get("CI")):
        cfg["_criou_modelo"] = criar_modelo()

    if os.path.exists(ARQ_WEBHOOK):
        with open(ARQ_WEBHOOK, encoding="utf-8-sig") as arquivo:
            linhas = [l.strip() for l in arquivo
                      if l.strip() and not l.strip().startswith("#")]
        soltas = []
        for linha in linhas:
            if "=" in linha:
                chave, valor = linha.split("=", 1)
                chave = chave.strip().lower()
                valor = limpar_url(valor)
                if chave in ("url", "webhook", "noticias", "novidades"):
                    cfg["noticias"] = cfg["noticias"] or valor
                elif chave in ("patch", "patches", "patch-notes", "patchnotes"):
                    cfg["patches"] = cfg["patches"] or valor
                elif chave in ("cargo", "role"):
                    cfg["cargo"] = cfg["cargo"] or valor
            else:
                soltas.append(linha)
        # formato simples (sem o sinal de =): URL e depois o cargo
        if soltas:
            if not cfg["noticias"]:
                cfg["noticias"] = limpar_url(soltas[0])
            if len(soltas) > 1 and not cfg["cargo"]:
                cfg["cargo"] = limpar_url(soltas[1])

    # limpa tambem o que veio de variavel de ambiente
    cfg["noticias"] = limpar_url(cfg["noticias"])
    cfg["patches"] = limpar_url(cfg["patches"])
    cfg["cargo"] = re.sub(r"[^\d]", "", cfg["cargo"] or "")

    # se so configurou um canal, tudo vai para ele
    if not cfg["noticias"]:
        cfg["noticias"] = cfg["patches"]
    if not cfg["patches"]:
        cfg["patches"] = cfg["noticias"]
    return cfg


def carregar_noticias():
    if not os.path.exists(ARQ_NOTICIAS):
        return []
    with open(ARQ_NOTICIAS, encoding="utf-8-sig") as arquivo:
        texto = arquivo.read()
    achado = re.search(r"window\.STEAM_NEWS\s*=\s*(\{.*\})\s*;", texto, flags=re.S)
    if not achado:
        return []
    try:
        return json.loads(achado.group(1)).get("items", []) or []
    except Exception:
        return []


def carregar_estado():
    if os.path.exists(ARQ_ESTADO):
        try:
            with open(ARQ_ESTADO, encoding="utf-8-sig") as arquivo:
                return json.load(arquivo)
        except Exception:
            pass
    return {"postados": []}


def salvar_estado(estado):
    os.makedirs(os.path.dirname(ARQ_ESTADO), exist_ok=True)
    with open(ARQ_ESTADO, "w", encoding="utf-8") as arquivo:
        json.dump(estado, arquivo, ensure_ascii=False, indent=1)


def esc(txt):
    """Escapa caracteres que o Discord usa para formatacao."""
    return re.sub(r"([*_~`|\\])", r"\\\1", txt or "")


def corta(txt, limite):
    txt = (txt or "").strip()
    return txt if len(txt) <= limite else txt[:limite - 1].rstrip() + "\u2026"


def montar_embed(n):
    patch = bool(n.get("patch"))
    linhas = n.get("lines") or []

    if patch:
        corpo = "\n".join("\u2022 " + esc(l) for l in linhas[:12])
        if len(linhas) > 12:
            corpo += "\n\n*+ {} mudancas no total. Clique no titulo para ver tudo.*".format(len(linhas))
    else:
        corpo = esc(corta(n.get("desc") or " ".join(linhas[:3]), 800))

    embed = {
        "title": ("\U0001F6E0\uFE0F " if patch else "\U0001F4E1 ") + corta(n.get("title") or "Deadlock", 240),
        "url": n.get("url") or "",
        "description": corta(corpo, 3800),
        "color": LIMA if patch else CIANO,
        "footer": {"text": "{}, {}".format(NOME, n.get("date") or "")},
    }
    if n.get("image"):
        embed["image"] = {"url": n["image"]}
    if n.get("ts"):
        embed["timestamp"] = datetime.datetime.fromtimestamp(
            int(n["ts"]), datetime.timezone.utc).isoformat()
    return embed


def enviar(url, payload):
    corpo = json.dumps(payload).encode("utf-8")
    pedido = urllib.request.Request(
        url, data=corpo, method="POST",
        headers={"Content-Type": "application/json",
                 "User-Agent": "CentralDeadlock/1.0"})
    with urllib.request.urlopen(pedido, timeout=30) as resposta:
        return resposta.status


def embed_teste(canal="novidades"):
    return {
        "title": "\U0001F916 Bot da Central Deadlock no ar!",
        "description": ("Se voce esta vendo esta mensagem, a configuracao deu certo.\n\n"
                        "Este e o canal de **{}**. A partir de agora, tudo que a Valve "
                        "publicar de oficial aparece aqui sozinho.".format(canal)),
        "color": LIMA,
        "footer": {"text": NOME + ", mensagem de teste"},
    }


def main():
    ap = argparse.ArgumentParser(description="Posta noticias do Deadlock no Discord")
    ap.add_argument("--teste", action="store_true", help="manda uma mensagem de teste")
    ap.add_argument("--tudo", action="store_true", help="posta as 10 mais recentes")
    ap.add_argument("--dry-run", action="store_true", help="nao envia, so mostra")
    ap.add_argument("--limite", type=int, default=3, help="quantas por vez (padrao 3)")
    args = ap.parse_args()

    cfg = carregar_config()
    no_github = bool(os.environ.get("CI"))

    if not cfg["noticias"] and not cfg["patches"]:
        if cfg.get("_criou_modelo"):
            print("\nCriei o arquivo \"discord-webhook.txt\" para voce.")
            print("Abra ele, cole a URL de cada canal e rode este script de novo.\n")
        print(INSTRUCOES)
        return 0 if no_github else 1

    erros_na_url = problemas_na_config(cfg)
    if erros_na_url:
        print("\n==========================================================")
        print("  A URL DO WEBHOOK NAO ESTA CERTA")
        print("==========================================================")
        print("")
        print("\n".join(erros_na_url))
        print("")
        print("Como pegar a URL de verdade (leva 1 minuto):")
        print("  1. No Discord, botao direito no canal > Editar canal")
        print("  2. Integracoes > Webhooks > Novo webhook")
        print("  3. Nome: Central Deadlock  >  Copiar URL do webhook")
        print("  4. Cole no arquivo discord-webhook.txt, depois do =")
        print("     (e apague a URL de exemplo que estava la)")
        print("==========================================================\n")
        if no_github:
            print("::warning::Webhook do Discord configurado de forma errada.")
            return 0
        return 1

    if args.teste:
        destinos = [("novidades", cfg["noticias"])]
        if cfg["patches"] != cfg["noticias"]:
            destinos.append(("patch notes", cfg["patches"]))
        for nome_canal, url in destinos:
            if not url:
                continue
            payload = {"username": NOME, "embeds": [embed_teste(nome_canal)]}
            if args.dry_run:
                print("\n--- canal de {} ---".format(nome_canal))
                print(json.dumps(payload, ensure_ascii=False, indent=1))
                continue
            enviar(url, payload)
            print("Mensagem de teste enviada para o canal de {}!".format(nome_canal))
        return 0

    noticias = carregar_noticias()
    if not noticias:
        print("Nenhuma noticia encontrada. Rode antes: python tools/update-news.py")
        return 0 if no_github else 1

    estado = carregar_estado()
    postados = list(estado.get("postados") or [])
    primeira_vez = not postados

    if args.tudo:
        fila = noticias[:10]
    else:
        fila = [n for n in noticias if n.get("id") not in postados]

    if not fila:
        print("Nada novo para postar. Tudo em dia!")
        return 0

    # na primeira vez posta so a mais recente, para nao encher o canal
    if args.tudo:
        limite = len(fila)
    else:
        limite = 1 if primeira_vez else args.limite
    fila = fila[:limite][::-1]   # mais antigas primeiro

    print("{} novidade(s) para postar{}:".format(len(fila), " (simulacao)" if args.dry_run else ""))
    enviados = 0

    for n in fila:
        payload = {"username": NOME, "embeds": [montar_embed(n)]}
        # patch notes vai para o canal de patches; o resto para o de novidades
        destino = cfg["patches"] if n.get("patch") else cfg["noticias"]
        if n.get("patch") and cfg["cargo"]:
            payload["content"] = "<@&{}> Novo patch do Deadlock!".format(cfg["cargo"])

        rotulo = "[{}] {}".format("PATCH" if n.get("patch") else "noticia", n.get("title"))
        if args.dry_run:
            print("\n--- " + rotulo + "  ->  canal de {}".format(
                "patch notes" if n.get("patch") else "novidades"))
            print(json.dumps(payload, ensure_ascii=False, indent=1))
            continue

        try:
            enviar(destino, payload)
            postados.append(n.get("id"))
            enviados += 1
            print("  enviado: " + rotulo)
            time.sleep(1)
        except urllib.error.HTTPError as erro:
            print("  ERRO ao enviar '{}': HTTP {} {}".format(n.get("title"), erro.code, erro.reason))
            if erro.code in (401, 403, 404, 405):
                print("  A URL do webhook parece estar errada, sem permissao, ou o webhook foi apagado.")
                print("  Confira o arquivo discord-webhook.txt (o texto de exemplo foi trocado?).")
                break
        except Exception as erro:
            print("  ERRO ao enviar '{}': {}".format(n.get("title"), erro))

    if not args.dry_run and enviados:
        estado["postados"] = postados[-200:]
        estado["ultima_vez"] = datetime.datetime.now().strftime("%d/%m/%Y as %H:%M")
        salvar_estado(estado)
        print("\n{} mensagem(ns) enviada(s) para o Discord.".format(enviados))

    return 0


if __name__ == "__main__":
    sys.exit(main())

# -*- coding: utf-8 -*-
"""
Busca os dados REAIS do jogo Deadlock e grava dois arquivos:

  data/game-data.js     -> window.GAME_DATA  (itens da loja, builds, contadores,
                                              taxa de banimento e ranking real)
  data/hero-history.js  -> window.HERO_HISTORY (histórico semanal de win rate)

Tudo vem do projeto público e gratuito deadlock-api.com, que lê os dados
das próprias partidas do jogo. Nada aqui é inventado.

Como usar:
    python tools/update-game-data.py
    python tools/update-game-data.py --sem-traducao   (não fala com o tradutor)

No Windows você também pode dar dois cliques em: atualizar-tudo.bat
"""

import concurrent.futures
import datetime
import hashlib
import json
import os
import re
import sys
import urllib.parse
import urllib.request

API = "https://api.deadlock-api.com"

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PASTA = os.path.join(BASE, "data")
SAIDA_DADOS = os.path.join(PASTA, "game-data.js")
SAIDA_HIST = os.path.join(PASTA, "hero-history.js")
CACHE = os.path.join(PASTA, "traducao-jogo.json")
CACHE_MAX = 4000

TRADUTOR = ("https://translate.googleapis.com/translate_a/single"
            "?client=gtx&sl=en&tl=pt-BR&dt=t&q={texto}")

# tamanho mínimo de amostra para entrar nos contadores / builds
MIN_PARTIDAS_CONTRA = 400
MIN_PARTIDAS_BUILD = 150
TOP_CONTRA = 6
TOP_BUILDS = 3
MAX_DESC = 340

# Os nomes das builds sao escritos pela comunidade, entao podem vir com bobagem.
# Se o nome casar com algum destes padroes, trocamos por um nome neutro.
PADROES_RUINS = [
    r"\bsex\w*", r"\bporn\w*", r"\bnazi\w*", r"\bhitler\b", r"\brape\w*", r"\bpedo\w*",
    r"\bpenis\w*", r"\bdick\w*", r"\bcock\b", r"\bpussy\w*", r"\bfuck\w*", r"\bshit\w*",
    r"\bbitch\w*", r"\bass\b", r"\bnigg\w*", r"\bretard\w*", r"\bkys\b", r"\bsuicide\b",
    r"\bfag\w*", r"\bwhore\w*", r"\bslut\w*", r"\bboob\w*", r"\btits\b", r"\bcum\b",
    r"\bmolest\w*", r"\bracis\w*", r"\bdrugs?\b", r"\bweed\b",
]


def nome_de_build_limpo(nome):
    """Troca nomes de build ofensivos por um nome neutro."""
    baixo = (nome or "").lower()
    for padrao in PADROES_RUINS:
        if re.search(padrao, baixo):
            return "Build da comunidade"
    return nome


# --------------------------- utilidades ---------------------------

def baixar_json(url, tentativas=3, timeout=60):
    ultimo = None
    for _ in range(tentativas):
        try:
            pedido = urllib.request.Request(url, headers={"User-Agent": "CentralDeadlock/1.0"})
            with urllib.request.urlopen(pedido, timeout=timeout) as resposta:
                return json.loads(resposta.read().decode("utf-8"))
        except Exception as erro:
            ultimo = erro
    raise ultimo


def limpar_html(texto):
    """Tira as tags do jogo e deixa só o texto (com espaços certos)."""
    texto = texto or ""
    texto = re.sub(r"<br\s*/?>", " ", texto, flags=re.I)
    texto = re.sub(r"<[^>]+>", "", texto)
    texto = texto.replace("&nbsp;", " ").replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
    return re.sub(r"\s+", " ", texto).strip()


def cortar(texto, limite=MAX_DESC):
    if len(texto) <= limite:
        return texto
    return texto[:limite].rsplit(" ", 1)[0].rstrip(",.;: ") + "…"


# --------------------------- tradução ---------------------------

def carregar_cache():
    try:
        with open(CACHE, encoding="utf-8") as arquivo:
            dados = json.load(arquivo)
        return dados if isinstance(dados, dict) else {}
    except Exception:
        return {}


def salvar_cache(cache):
    if len(cache) > CACHE_MAX:
        for chave in list(cache)[:-CACHE_MAX]:
            cache.pop(chave, None)
    try:
        os.makedirs(PASTA, exist_ok=True)
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
    return "".join(partes).strip().replace("\n", " ")


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
        if traducao:
            cache[chave] = traducao
        return traducao
    except Exception:
        return ""


def traduzir_lote(textos, cache, rotulo, com_cache=True):
    """Traduz uma lista de textos em paralelo. Devolve {texto: traducao}."""
    textos = [t for t in textos if t]
    if not com_cache:
        return {}
    faltam = [t for t in textos if hashlib.md5(t.encode("utf-8")).hexdigest() not in cache]
    if not faltam:
        print("   {}: tudo ja estava traduzido (cache)".format(rotulo))
        return {t: cache[hashlib.md5(t.encode("utf-8")).hexdigest()] for t in textos}
    print("   {}: traduzindo {} textos novos...".format(rotulo, len(faltam)))
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        list(pool.map(lambda t: traduzir(t, cache), faltam))
    return {t: cache.get(hashlib.md5(t.encode("utf-8")).hexdigest(), "") for t in textos}


# --------------------------- itens ---------------------------

def buscar_itens(total_partidas):
    """Itens da loja (arma / vitalidade / espirito) com preco e efeito."""
    itens = {}
    for slot in ("weapon", "vitality", "spirit"):
        try:
            lista = baixar_json("{}/v1/assets/items/by-slot-type/{}".format(API, slot))
        except Exception as erro:
            print("   (aviso: nao consegui pegar os itens '{}': {})".format(slot, erro))
            continue
        for it in lista:
            if not isinstance(it, dict) or not it.get("shopable"):
                continue
            ident = it.get("id")
            if ident is None:
                continue
            descricao = ""
            d = it.get("description")
            if isinstance(d, dict):
                descricao = limpar_html(d.get("desc") or "")
            elif isinstance(d, str):
                descricao = limpar_html(d)
            itens[int(ident)] = {
                "n": str(it.get("name") or "").strip(),
                "c": int(it.get("cost") or 0),
                "t": int(it.get("item_tier") or 0),
                "s": slot,
                "i": str(it.get("shop_image_webp") or it.get("image") or ""),
                "d": cortar(descricao),
                "a": bool(it.get("is_active_item")),
            }
    return itens


def juntar_stats_itens(itens, total_partidas):
    """Acrescenta o win rate real e quantas compras cada item teve."""
    try:
        stats = baixar_json("{}/v1/analytics/item-stats".format(API))
    except Exception as erro:
        print("   (aviso: sem estatisticas de itens: {})".format(erro))
        return
    for linha in stats:
        if int(linha.get("bucket") or 0) != 0:
            continue
        ident = int(linha.get("item_id") or 0)
        if ident not in itens:
            continue
        vitorias = int(linha.get("wins") or 0)
        derrotas = int(linha.get("losses") or 0)
        partidas = int(linha.get("matches") or 0)
        if vitorias + derrotas <= 0:
            continue
        itens[ident]["win"] = round(100.0 * vitorias / (vitorias + derrotas), 1)
        # "matches" aqui conta cada compra (varios jogadores compram o mesmo item na
        # mesma partida), por isso guardamos como numero de compras, sem virar porcentagem
        itens[ident]["x"] = partidas


# --------------------------- builds ---------------------------

def buscar_builds(ids, itens):
    """Builds mais usadas de cada herói (itens + win rate real)."""
    def pega_build(hero_id):
        try:
            stats = baixar_json("{}/v1/analytics/hero-build-stats/{}".format(API, hero_id))
        except Exception:
            return hero_id, []
        if not isinstance(stats, list):
            return hero_id, []
        boas = [b for b in stats if int(b.get("matches") or 0) >= MIN_PARTIDAS_BUILD]
        boas.sort(key=lambda b: int(b.get("matches") or 0), reverse=True)
        saida = []
        for b in boas[:TOP_BUILDS]:
            try:
                detalhe = baixar_json("{}/v1/builds/{}/{}".format(API, hero_id, b.get("hero_build_id")))
            except Exception:
                continue
            hb = (detalhe or {}).get("hero_build") or {}
            detalhes = hb.get("details") or {}
            usados = []
            for cat in detalhes.get("mod_categories") or []:
                for mod in cat.get("mods") or []:
                    ident = mod.get("ability_id")
                    if ident and ident in itens and ident not in usados:
                        usados.append(ident)
            partidas = int(b.get("matches") or 0)
            vitorias = int(b.get("wins") or 0)
            if not usados or partidas <= 0:
                continue
            saida.append({
                "n": nome_de_build_limpo((str(hb.get("name") or "").strip() or "Build da comunidade")[:60]),
                "de": (str(hb.get("author_account_id") or "") and "comunidade") or "comunidade",
                "i": usados[:10],
                "win": round(100.0 * vitorias / partidas, 1),
                "m": partidas,
            })
        return hero_id, saida

    resultado = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        for hero_id, dados in pool.map(pega_build, ids):
            if dados:
                resultado[str(hero_id)] = dados
    return resultado


# --------------------------- contadores ---------------------------

def buscar_contadores(nomes):
    """Quem o herói vence com facilidade e quem ele sofre para enfrentar."""
    try:
        linhas = baixar_json("{}/v1/analytics/hero-counter-stats".format(API))
    except Exception as erro:
        print("   (aviso: sem contadores: {})".format(erro))
        return {}
    por_heroi = {}
    for l in linhas:
        hero_id = int(l.get("hero_id") or 0)
        inimigo = int(l.get("enemy_hero_id") or 0)
        partidas = int(l.get("matches_played") or 0)
        if partidas < MIN_PARTIDAS_CONTRA:
            continue
        vitorias = int(l.get("wins") or 0)
        if not hero_id or not inimigo:
            continue
        por_heroi.setdefault(hero_id, []).append((inimigo, round(100.0 * vitorias / partidas, 1), partidas))
    saida = {}
    for hero_id, lista in por_heroi.items():
        lista.sort(key=lambda x: x[1], reverse=True)
        bons = [x for x in lista if x[0] in nomes][:TOP_CONTRA]
        ruins = [x for x in reversed(lista) if x[0] in nomes][:TOP_CONTRA]
        if bons or ruins:
            saida[str(hero_id)] = {"bons": bons, "ruins": ruins}
    return saida


# --------------------------- banimento ---------------------------

def buscar_ban(total_partidas):
    """Taxa de banimento: % das partidas em que o herói foi banido."""
    try:
        linhas = baixar_json("{}/v1/analytics/hero-ban-stats".format(API))
    except Exception as erro:
        print("   (aviso: sem taxa de banimento: {})".format(erro))
        return {}, {}
    bruto = {}
    for l in linhas:
        if int(l.get("bucket") or 0) != 0:
            continue
        bans = int(l.get("bans") or 0)
        hero_id = int(l.get("hero_id") or 0)
        if hero_id and bans:
            bruto[str(hero_id)] = bans
    taxa = {k: round(100.0 * v / max(1, total_partidas), 1) for k, v in bruto.items()}
    ordenado = sorted(bruto, key=lambda k: bruto[k], reverse=True)
    posicao = {k: i + 1 for i, k in enumerate(ordenado)}
    return taxa, posicao


# --------------------------- ranking ---------------------------

def buscar_ranking(limite=60):
    """Melhores jogadores de cada região (ranking real do jogo)."""
    saida = {}
    for regiao in ("Europe", "Asia", "NAmerica", "SAmerica", "Oceania"):
        try:
            dados = baixar_json("{}/v1/leaderboard/{}?region={}".format(API, regiao, regiao), tentativas=2)
        except Exception as erro:
            print("   (aviso: ranking '{}' indisponivel: {})".format(regiao, erro))
            continue
        entradas = (dados or {}).get("entries") or []
        saida[regiao] = [{
            "n": str(e.get("account_name") or "???"),
            "r": int(e.get("rank") or 0),
            "h": [int(x) for x in (e.get("top_hero_ids") or [])][:3],
        } for e in entradas[:limite]]
        print("   {}: {} jogadores".format(regiao, len(saida[regiao])))
    return saida


# --------------------------- histórico ---------------------------

def buscar_historico(nomes):
    """Win rate semana a semana (historico real, de cerca de 1 ano para cá)."""
    # por padrao a API so devolve ~30 dias; pedimos 1 ano para trás
    desde = int((datetime.datetime.now() - datetime.timedelta(days=400)).timestamp())
    url = "{}/v1/analytics/hero-stats?bucket=start_time_week&min_unix_timestamp={}".format(API, desde)
    linhas = baixar_json(url)
    semanas = sorted({int(l.get("bucket") or 0) for l in linhas})
    semanas = [s for s in semanas if s > 0]
    if not semanas:
        return {}
    indice = {s: i for i, s in enumerate(semanas)}
    herois = {}
    for l in linhas:
        nome = nomes.get(int(l.get("hero_id") or 0))
        if not nome:
            continue
        semana = int(l.get("bucket") or 0)
        if semana not in indice:
            continue
        vitorias = int(l.get("wins") or 0)
        derrotas = int(l.get("losses") or 0)
        if vitorias + derrotas <= 0:
            continue
        serie = herois.setdefault(nome, [None] * len(semanas))
        serie[indice[semana]] = round(100.0 * vitorias / (vitorias + derrotas), 1)
    return {
        "semanas": [datetime.datetime.fromtimestamp(s, datetime.timezone.utc).strftime("%d/%m") for s in semanas],
        "herois": herois,
    }


# --------------------------- principal ---------------------------

def main():
    sem_traducao = "--sem-traducao" in sys.argv
    print("Buscando os dados reais do jogo (deadlock-api.com) ...")

    try:
        herois_api = baixar_json("{}/v1/assets/heroes".format(API))
        stats = baixar_json("{}/v1/analytics/hero-stats".format(API))
    except Exception as erro:
        print("ERRO: nao consegui falar com a deadlock-api.com: {}".format(erro))
        print("AVISO: os arquivos data/game-data.js e data/hero-history.js nao foram alterados.")
        return 1

    # id -> nome (só os heróis que já saíram de verdade)
    nomes = {}
    for h in herois_api:
        if not isinstance(h, dict):
            continue
        if not h.get("player_selectable") or h.get("disabled"):
            continue
        nomes[int(h["id"])] = str(h["name"]).strip()

    if not nomes:
        print("AVISO: a API nao devolveu a lista de herois. Nada foi alterado.")
        return 1

    linhas = [l for l in stats if int(l.get("bucket") or 0) == 0] or stats
    soma_partidas = sum(int(l.get("matches") or 0) for l in linhas) or 1
    total_partidas = int(round(soma_partidas / 12.0))  # 12 herois por partida (6 x 6)
    print("   {} herois | ~{:,} partidas".format(len(nomes), total_partidas).replace(",", "."))

    print(" - itens da loja ...")
    itens = buscar_itens(total_partidas)
    juntar_stats_itens(itens, total_partidas)
    print("   {} itens reais".format(len(itens)))

    print(" - traduzindo os itens para portugues ...")
    cache = carregar_cache()
    nomes_pt = traduzir_lote([v["n"] for v in itens.values()], cache, "nomes dos itens", not sem_traducao)
    descs_pt = traduzir_lote([v["d"] for v in itens.values() if v["d"]], cache, "efeitos dos itens", not sem_traducao)
    for item in itens.values():
        original = item["n"]
        item["en"] = original
        if nomes_pt.get(original):
            item["n"] = nomes_pt[original]
        if item["d"] and descs_pt.get(item["d"]):
            item["d"] = descs_pt[item["d"]]
    salvar_cache(cache)

    print(" - builds mais usadas de cada heroi (pode demorar um pouco) ...")
    builds = buscar_builds(list(nomes.keys()), itens)
    print("   {} herois com builds".format(len(builds)))

    print(" - contadores (quem ganha de quem) ...")
    contadores = buscar_contadores(nomes)
    print("   {} herois com contadores".format(len(contadores)))

    print(" - taxa de banimento ...")
    ban, ban_pos = buscar_ban(total_partidas)
    print("   {} herois banidos alguma vez".format(len(ban)))

    print(" - ranking real dos melhores jogadores ...")
    ranking = buscar_ranking()

    print(" - historico semanal de win rate ...")
    historico = buscar_historico(nomes)
    print("   {} semanas de historico".format(len(historico.get("semanas") or [])))

    agora = datetime.datetime.now().strftime("%d/%m/%Y as %H:%M")

    # itens -> chave de texto (JSON precisa de chaves de texto)
    itens_txt = {str(k): v for k, v in itens.items()}
    ids_nome = {v: k for k, v in nomes.items()}

    pacote = {
        "updated": agora,
        "fonte": "deadlock-api.com",
        "partidas": total_partidas,
        "ids": ids_nome,
        "itens": itens_txt,
        "builds": builds,
        "contadores": contadores,
        "ban": ban,
        "banPos": ban_pos,
        "ranking": ranking,
    }

    conteudo = (
        "/* ATENCAO: arquivo gerado automaticamente pelo script tools/update-game-data.py\n"
        "   Nao edite na mao: as mudancas sao perdidas na proxima atualizacao.\n"
        "   Dados reais do jogo, via deadlock-api.com\n"
        "   Ultima atualizacao: {} */\n"
        "window.GAME_DATA = {};\n"
    ).format(agora, json.dumps(pacote, ensure_ascii=False, separators=(",", ":")))

    os.makedirs(PASTA, exist_ok=True)
    with open(SAIDA_DADOS, "w", encoding="utf-8") as arquivo:
        arquivo.write(conteudo)

    if historico:
        conteudo_hist = (
            "/* ATENCAO: arquivo gerado automaticamente pelo script tools/update-game-data.py\n"
            "   Win rate semana a semana (dados reais) - via deadlock-api.com\n"
            "   Ultima atualizacao: {} */\n"
            "window.HERO_HISTORY = {};\n"
        ).format(agora, json.dumps(historico, ensure_ascii=False, separators=(",", ":")))
        with open(SAIDA_HIST, "w", encoding="utf-8") as arquivo:
            arquivo.write(conteudo_hist)

    print("OK! {} itens, {} builds, {} contadores, {} bans, {} regioes".format(
        len(itens), sum(len(v) for v in builds.values()), len(contadores), len(ban), len(ranking)))
    print("    arquivos: data/game-data.js e data/hero-history.js")
    return 0


if __name__ == "__main__":
    sys.exit(main())

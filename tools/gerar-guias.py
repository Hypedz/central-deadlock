# -*- coding: utf-8 -*-
"""
Escreve o GUIA de cada herói no arquivo data/guias.js.

O texto de cada guia é montado SOZINHO, com os números reais das partidas:

    data/hero-stats.js       -> win rate, pick rate, KDA, tier e posição
    data/hero-analytics.js   -> ordem das habilidades, duplas e rota
    data/hero-extra.js       -> cor e etiquetas oficiais do herói
    heroes-data.js           -> papel, descrição escrita à mão e habilidades

Nada aqui é inventado e nada é digitado à mão: é só rodar de novo quando os
números mudarem.

Como usar:
    python tools/gerar-guias.py

É rodado sozinho pelo robô do GitHub depois de atualizar as estatísticas.
"""

import datetime
import json
import os
import re
import unicodedata

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAIDA = os.path.join(BASE, "data", "guias.js")

# Uma frase curta sobre o papel do herói (igual à usada nas páginas dos heróis)
PAPEL_TXT = {
    "Tanque": "Aguenta a linha de frente: entra na luta primeiro e abre espaço para o time.",
    "Suporte": "Mantém o time vivo com cura, escudos e utilidade.",
    "Carry": "Fica forte ao longo da partida e decide as brigas no fim.",
    "Controle": "Domina a área da briga e atrapalha o posicionamento dos inimigos.",
    "Assassino": "Entra em cima de um alvo só e mata rápido antes de recuar.",
    "A definir": "Herói em desenvolvimento: o papel ainda pode mudar."
}

MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]


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


def num(valor, casas=1):
    """Numero no jeito brasileiro: 55,2"""
    try:
        return ("{:." + str(casas) + "f}").format(float(valor)).replace(".", ",")
    except Exception:
        return str(valor)


def milhar(valor):
    """Numero grande no jeito brasileiro: 570.125"""
    try:
        return "{:,}".format(int(valor)).replace(",", ".")
    except Exception:
        return str(valor)


def juntar(lista):
    """Devolve 'a, b e c' (com 'e' antes do ultimo)."""
    lista = [x for x in lista if x]
    if not lista:
        return ""
    if len(lista) == 1:
        return lista[0]
    return ", ".join(lista[:-1]) + " e " + lista[-1]


# --------------------------- o guia de cada herói ---------------------------

def corpo_do_heroi(h, s, analise, ids, minimos, total_herois, partidas_base):
    """Monta a lista de paragrafos do guia (texto puro, em portugues)."""
    nome = h["name"]
    papel = h.get("role") or "A definir"
    arco = h.get("arch") or papel
    habilidades = h.get("skills") or []

    def habilidade(numero):
        if 1 <= numero <= len(habilidades):
            sk = habilidades[numero - 1]
            return str(sk.get("name") or sk.get("name_en") or ("Habilidade " + str(numero)))
        return "Habilidade " + str(numero)

    def nome_de_id(ident):
        for outro, valor in ids.items():
            if str(valor) == str(ident):
                return outro
        return None

    corpo = []

    # 1) o retrato do herói hoje, com números de verdade
    if s:
        escolha = ("escolhido em {pick}% das partidas".format(pick=num(s.get("pick")))
                   if float(s.get("pick") or 0) >= 0.1 else "escolhido em menos de 0,1% das partidas")
        corpo.append(
            "Como está agora: {nome} ganha {win}% das partidas e é {escolha} — "
            "é o {pos}º melhor win rate entre os {total} heróis (tier {tier}). "
            "São {partidas} partidas analisadas, com KDA médio de {kda} e {abates} abates por partida."
            .format(nome=nome, win=num(s.get("win")), escolha=escolha, pos=s.get("posicao"),
                    total=total_herois, tier=s.get("tier") or h.get("tier") or "?", partidas=milhar(s.get("partidas")),
                    kda=num(s.get("kda"), 2), abates=num(s.get("abates")))
        )
    else:
        corpo.append(
            "Ainda não há partidas suficientes na base para calcular o win rate do {nome}. "
            "O guia abaixo usa o que o jogo já traz: papel, habilidades e complexidade.".format(nome=nome)
        )

    # 2) o papel dele na partida
    linha = "{nome} é {arco} e joga como {papel}.".format(nome=nome, arco=arco, papel=papel)
    if h.get("desc"):
        linha += " " + str(h["desc"]).strip()
    if PAPEL_TXT.get(papel):
        linha += " " + PAPEL_TXT[papel]
    corpo.append(linha)

    # 3) o que upar primeiro (ordem real, nível por nível)
    ordem = (analise or {}).get("ordem") or []
    if ordem and habilidades:
        primeiros = [habilidade(p[0]) for p in ordem[:6]]
        contagem = {}
        for ponto in ordem:
            contagem[ponto[0]] = contagem.get(ponto[0], 0) + 1
        mais_usada = max(contagem.items(), key=lambda x: x[1])
        corpo.append(
            "O que upar primeiro: nos 6 primeiros níveis, a ordem que os jogadores mais usam é "
            + ", ".join(primeiros) + ". "
            "Até o nível 16, é {ponto} que leva mais pontos: {quantos} dos {total}."
            .format(ponto=habilidade(mais_usada[0]), quantos=mais_usada[1], total=len(ordem))
        )
        niveis_ult = [str(i + 1) for i, p in enumerate(ordem) if p[0] == len(habilidades)]
        if niveis_ult:
            corpo.append(
                "A suprema ({sup}) entra nos níveis {niveis}: ela é a carta na manga para as brigas de time, "
                "quando os inimigos estiverem agrupados.".format(sup=habilidade(len(habilidades)), niveis=juntar(niveis_ult))
            )

    # 4) melhores duplas (partidas de verdade)
    duplas = (analise or {}).get("duplas") or []
    ruins = (analise or {}).get("duplasRuins") or []
    if duplas:
        bons = ["{outro} ({win}% de vitória juntos)".format(outro=nome_de_id(p[0]), win=num(p[1]))
                for p in duplas[:3] if nome_de_id(p[0])]
        if bons:
            corpo.append(
                "Com quem jogar: nas duplas com pelo menos {minimo} partidas juntos, {nome} ganha mais ao lado de {lista}."
                .format(minimo=milhar(minimos.get("dupla", 0)), nome=nome, lista=juntar(bons))
            )
    if ruins:
        piores = ["{outro} ({win}%)".format(outro=nome_de_id(p[0]), win=num(p[1]))
                  for p in ruins[:2] if nome_de_id(p[0])]
        if piores:
            corpo.append(
                "Combinações para evitar: com {lista}, o win rate cai para menos de 50% — "
                "vale pensar duas vezes antes de fechar essas duplas.".format(lista=juntar(piores))
            )

    # 5) rota (lane)
    rota = (analise or {}).get("rota") or []
    rota_boas = (analise or {}).get("rotaBoas") or []

    def confronto(p):
        outro = nome_de_id(p[0])
        if not outro:
            return ""
        almas = p[3] if len(p) > 3 else None
        marca = ""
        if almas is not None:
            marca = " e fica {sinal}{valor} almas".format(sinal="+" if almas >= 0 else "−", valor=milhar(abs(almas)))
        return "{outro} ({win}% das rotas{marca})".format(outro=outro, win=num(p[1]), marca=marca)

    if rota:
        lista = juntar([confronto(p) for p in rota[:3]])
        if lista:
            corpo.append(
                "Na rota, cada lado joga em dupla — e estes são confrontos reais. Sofre contra {lista}."
                .format(lista=lista)
            )
    if rota_boas:
        lista = juntar([confronto(p) for p in rota_boas[:3]])
        if lista:
            corpo.append("Já vai bem na rota contra {lista}.".format(lista=lista))

    if not duplas and not rota:
        corpo.append(
            "Ainda são poucas partidas de {nome} na base para calcular as melhores duplas e os confrontos "
            "de rota. Volte em alguns dias: o guia se atualiza sozinho.".format(nome=nome)
        )

    # 6) fecho
    corpo.append(
        "Este guia é montado sozinho, sempre que as estatísticas são atualizadas, com partidas de verdade "
        "(base atual: {base} partidas, via deadlock-api.com). Para ver os atributos, as builds da loja, "
        "o histórico de win rate e todos os confrontos, abra a página completa deste herói."
        .format(base=milhar(partidas_base))
    )
    return corpo


def main():
    herois = ler_herois()
    stats = (ler_js("data/hero-stats.js").get("herois") or {})
    analises = (ler_js("data/hero-analytics.js").get("herois") or {})
    analitico = ler_js("data/hero-analytics.js")
    jogo = ler_js("data/game-data.js")
    ids = jogo.get("ids") or {}
    minimos = analitico.get("minimos") or {}
    partidas_base = ler_js("data/hero-stats.js").get("partidas") or jogo.get("partidas") or 0
    total_herois = len(stats) or len(herois)

    agora = datetime.datetime.now()
    data_curta = "{} {} {}".format(agora.day, MESES[agora.month - 1], agora.year)
    atualizado = "{}/{}/{} as {:02d}:{:02d}".format(agora.day, agora.month, agora.year, agora.hour, agora.minute)

    lista = []
    for h in herois:
        if h.get("soon"):
            continue
        nome = h["name"]
        s = stats.get(nome) or {}
        analise = analises.get(slug(nome)) or {}
        corpo = corpo_do_heroi(h, s, analise, ids, minimos, total_herois, partidas_base)
        if not corpo:
            continue
        lista.append({
            "id": "gh-" + slug(nome),
            "cat": "Guia",
            "title": "{} — Guia Completo".format(nome),
            "img": h.get("file") or "",
            "date": data_curta,
            "tier": s.get("tier") or h.get("tier") or "?",
            "role": h.get("role") or "A definir",
            "win": s.get("win"),
            "desc": ("Como jogar de {nome}: o que upar, as melhores duplas, a rota e os números reais de "
                     "{partidas} partidas.").format(nome=nome, partidas=milhar(s.get("partidas") or 0)),
            "heroPage": "heroi/{}.html".format(slug(nome)),
            "body": corpo
        })

    lista.sort(key=lambda g: g["title"].lower())          # em ordem alfabética, fácil de achar

    dados = {
        "updated": atualizado,
        "fonte": "deadlock-api.com",
        "partidas": partidas_base,
        "minimos": minimos,
        "lista": lista
    }

    cabecalho = (
        "/* ATENCAO: arquivo gerado automaticamente pelo script tools/gerar-guias.py\n"
        "   Nao edite na mao: as mudancas sao perdidas na proxima atualizacao.\n"
        "   Guia de cada heroi ({} guias), montado com os numeros REAIS das partidas.\n"
        "   Dados reais, via deadlock-api.com\n"
        "   Ultima atualizacao: {} */\n"
    ).format(len(lista), atualizado)

    with open(SAIDA, "w", encoding="utf-8") as arquivo:
        arquivo.write(cabecalho + "window.GUIAS = " + json.dumps(dados, ensure_ascii=False, separators=(",", ":")) + ";\n")

    print("Guias gerados: {} (data/guias.js)".format(len(lista)))


if __name__ == "__main__":
    main()

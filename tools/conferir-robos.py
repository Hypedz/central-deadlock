# -*- coding: utf-8 -*-
"""
Confere o resultado dos passos do robo de atualizacao.

O GitHub entrega os resultados no ambiente OUTCOMES (um JSON com cada
passo que tem "id:" no workflow). Este script:

  - lista o que deu certo, o que falhou e o que foi pulado;
  - grava um relatorio em relatorio-robos.md (usado na issue);
  - termina com codigo 1 se algum passo CRITICO falhou.

Passos "opcionais" (artes, traducao, cartoes sociais, Discord) aparecem
como aviso, mas nao derrubam a execucao.

Uso (o workflow faz isso sozinho):

  python tools/conferir-robos.py
"""

import json
import os
import sys

# Passos que precisam dar certo: se um deles falhar, o site fica com
# dados velhos ou paginas desatualizadas.
CRITICOS = {
    "noticias": "Noticias do Steam",
    "estatisticas": "Estatisticas dos herois",
    "dados_jogo": "Itens, builds e ranking",
    "analytics": "Habilidades e duplas",
    "elos": "Elos",
    "guias": "Guias dos herois",
    "builds": "Builds mais usadas",
    "esports": "Esports (Liquipedia)",
    "top_jogadores": "Top jogadores",
    "paginas": "Paginas e sitemap",
    "salvar": "Salvar no repositorio",
    "publicar": "Republicar o site",
}

# Passos que podem falhar sem quebrar o site (o dado antigo continua).
OPCIONAIS = {
    "artes": "Artes dos herois",
    "traducao": "Traducao de habilidades",
    "og": "Cartoes sociais",
    "discord": "Post no Discord",
    "discord_teste": "Teste do Discord",
}

ROTULO = {"success": "OK", "failure": "FALHA", "cancelled": "CANCELADO",
          "skipped": "PULADO", "neutral": "NEUTRO"}


def ler_resultados():
    bruto = os.environ.get("OUTCOMES", "").strip()
    if not bruto:
        return None
    try:
        return json.loads(bruto)
    except ValueError:
        return None


def main():
    resultados = ler_resultados()
    if resultados is None:
        print("AVISO: nao recebi a lista de passos (OUTCOMES).")
        print("Nada foi conferido; a execucao continua normalmente.")
        return 0

    linhas = []
    criticos_com_falha = []
    opcionais_com_falha = []

    for passo, rotulo in CRITICOS.items():
        info = resultados.get(passo)
        if not info:
            continue
        estado = info.get("outcome") or info.get("conclusion") or "skipped"
        if estado == "failure":
            criticos_com_falha.append(rotulo)
        linhas.append((ROTULO.get(estado, estado.upper()), rotulo, True))

    for passo, rotulo in OPCIONAIS.items():
        info = resultados.get(passo)
        if not info:
            continue
        estado = info.get("outcome") or info.get("conclusion") or "skipped"
        if estado == "failure":
            opcionais_com_falha.append(rotulo)
        linhas.append((ROTULO.get(estado, estado.upper()), rotulo, False))

    linhas.sort(key=lambda x: (x[0] != "FALHA", x[1]))

    relatorio = []
    relatorio.append("# Conferencia do robo de atualizacao")
    relatorio.append("")
    relatorio.append("| Passo | Resultado | Tipo |")
    relatorio.append("|---|---|---|")
    for estado, rotulo, critico in linhas:
        relatorio.append("| {} | {} | {} |".format(
            rotulo, estado, "critico" if critico else "opcional"))
    relatorio.append("")

    if criticos_com_falha:
        relatorio.append("## Falhas que precisam de atencao")
        relatorio.append("")
        for rotulo in criticos_com_falha:
            relatorio.append("- **{}** falhou. O dado pode ter ficado velho; "
                             "veja o log do passo no GitHub Actions.".format(rotulo))
        relatorio.append("")
    if opcionais_com_falha:
        relatorio.append("## Avisos (nao quebram o site)")
        relatorio.append("")
        for rotulo in opcionais_com_falha:
            relatorio.append("- {} falhou; o site segue com o dado anterior.".format(rotulo))
        relatorio.append("")

    texto = "\n".join(relatorio)
    print(texto)

    try:
        with open("relatorio-robos.md", "w", encoding="utf-8") as arquivo:
            arquivo.write(texto + "\n")
    except OSError:
        pass

    resumo = os.environ.get("GITHUB_STEP_SUMMARY")
    if resumo:
        try:
            with open(resumo, "a", encoding="utf-8") as arquivo:
                arquivo.write("\n" + texto + "\n")
        except OSError:
            pass

    if criticos_com_falha:
        print("")
        print("RESULTADO: {} passo(s) critico(s) falharam.".format(
            len(criticos_com_falha)))
        return 1

    print("")
    print("RESULTADO: todos os passos criticos deram certo.")
    return 0


if __name__ == "__main__":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    sys.exit(main())

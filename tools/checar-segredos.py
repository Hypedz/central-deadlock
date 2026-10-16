# -*- coding: utf-8 -*-
"""
Confere se algum arquivo do site tem SEGREDO escrito na mao.

Hoje ele procura URLs de webhook do Discord. O unico lugar onde
ela pode ficar e o arquivo "discord-webhook.txt" (que o Git ignora).

Roda sozinho antes de cada commit (veja .githooks/pre-commit).
Para rodar na mao, dentro da pasta do site:

  python tools/checar-segredos.py
"""

import os
import re
import sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# onde a URL PODE ficar
PERMITIDOS = {"discord-webhook.txt"}

# pastas que nem vale a pena olhar
IGNORAR_PASTAS = {".git", "__pycache__", "node_modules", ".venv", "venv"}

SEGREDOS = [
    (r"https://(?:ptb\.|canary\.)?discord(?:app)?\.com/api/webhooks/\d+/[\w.\-]{20,}",
     "URL de webhook do Discord"),
]


def main():
    problemas = []

    for raiz, pastas, arquivos in os.walk(BASE):
        pastas[:] = [p for p in pastas if p not in IGNORAR_PASTAS]
        for nome in arquivos:
            caminho = os.path.join(raiz, nome)
            relativo = os.path.relpath(caminho, BASE).replace("\\", "/")

            if relativo in PERMITIDOS:
                continue
            try:
                if os.path.getsize(caminho) > 5000000:
                    continue
                with open(caminho, encoding="utf-8", errors="ignore") as arquivo:
                    texto = arquivo.read()
            except Exception:
                continue

            for padrao, rotulo in SEGREDOS:
                for achado in re.finditer(padrao, texto):
                    linha = texto[:achado.start()].count("\n") + 1
                    problemas.append((relativo, linha, rotulo))

    if problemas:
        print("")
        print("=" * 60)
        print("  COMMIT BLOQUEADO: SEGREDO ENCONTRADO NO PROJETO")
        print("=" * 60)
        print("")
        for arquivo, linha, rotulo in problemas:
            print("  {} (linha {}) -> {}".format(arquivo, linha, rotulo))
        print("")
        print("  Isso vai para o GitHub e qualquer pessoa poderia")
        print("  postar no seu canal do Discord.")
        print("")
        print("  O lugar certo dessa URL e SOMENTE o arquivo:")
        print("      discord-webhook.txt   (o Git ignora ele)")
        print("")
        print("  Apague a URL do arquivo indicado acima e tente de novo.")
        print("=" * 60)
        print("")
        return 1

    print("Nenhum segredo encontrado no projeto. Tudo certo.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

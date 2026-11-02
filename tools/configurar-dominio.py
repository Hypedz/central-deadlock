# -*- coding: utf-8 -*-
"""
Troca o endereço do site (GitHub Pages) por um domínio próprio.

Exemplo:
    python tools/configurar-dominio.py meusite.com.br

O script:
  1. confere o domínio;
  2. troca as URLs antigas em index.html, robots.txt e no gerador;
  3. cria o arquivo CNAME (o GitHub Pages usa esse arquivo);
  4. gera de novo as páginas internas e o sitemap.

Para voltar ao endereço do GitHub Pages:
    python tools/configurar-dominio.py --reverter
"""

import os
import re
import subprocess
import sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PADRAO_URL = "https://hypedz.github.io/central-deadlock/"
ARQUIVOS_TEXTO = [
    "index.html",
    "robots.txt",
    "README.md",
    "script.js",
    "tools/gerar-paginas.py",
]
CNAME = os.path.join(BASE, "CNAME")


def normalizar_dominio(valor):
    valor = (valor or "").strip().lower()
    valor = re.sub(r"^https?://", "", valor)
    valor = valor.split("/")[0].strip(".")
    if not re.fullmatch(r"[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}", valor):
        raise SystemExit("Domínio inválido. Exemplo: meusite.com.br")
    return valor


def ler(caminho):
    completo = os.path.join(BASE, caminho)
    if not os.path.exists(completo):
        return None
    with open(completo, encoding="utf-8") as arquivo:
        return arquivo.read()


def gravar(caminho, texto):
    with open(os.path.join(BASE, caminho), "w", encoding="utf-8", newline="\n") as arquivo:
        arquivo.write(texto)


def trocar(caminho, origem, destino):
    texto = ler(caminho)
    if texto is None or origem not in texto:
        return False
    gravar(caminho, texto.replace(origem, destino))
    return True


def dominio_atual():
    if os.path.exists(CNAME):
        with open(CNAME, encoding="utf-8") as arquivo:
            return arquivo.read().strip()
    return ""


def main():
    if len(sys.argv) != 2:
        raise SystemExit("Uso: python tools/configurar-dominio.py meusite.com.br\n"
                         "     python tools/configurar-dominio.py --reverter")

    reverter = sys.argv[1] == "--reverter"
    if reverter:
        dominio = dominio_atual()
        if not dominio:
            raise SystemExit("Não encontrei o arquivo CNAME para saber qual domínio remover.")
        origem = "https://" + dominio + "/"
        destino = PADRAO_URL
    else:
        dominio = normalizar_dominio(sys.argv[1])
        origem = PADRAO_URL
        destino = "https://" + dominio + "/"
        atual = dominio_atual()
        if atual and atual != dominio:
            origem = "https://" + atual + "/"

    trocados = []
    for caminho in ARQUIVOS_TEXTO:
        if trocar(caminho, origem, destino):
            trocados.append(caminho)
            continue
        # Se o arquivo ainda estiver em outro endereço antigo, troca também.
        texto = ler(caminho)
        if texto is None:
            continue
        achado = re.search(r"https://[a-z0-9.-]+/central-deadlock/", texto, re.I)
        if achado and achado.group(0) != destino:
            trocar(caminho, achado.group(0), destino)
            trocados.append(caminho)

    if reverter:
        if os.path.exists(CNAME):
            os.remove(CNAME)
    else:
        with open(CNAME, "w", encoding="utf-8", newline="\n") as arquivo:
            arquivo.write(dominio + "\n")

    print("Arquivos atualizados:")
    for caminho in trocados:
        print("  -", caminho)
    print("CNAME:", "removido" if reverter else dominio)
    print("Gerando páginas e sitemap...")
    subprocess.run([sys.executable, os.path.join(BASE, "tools", "gerar-paginas.py")], check=True)
    print("Pronto. Confira o endereço novo no GitHub Pages (Settings > Pages).")


if __name__ == "__main__":
    main()

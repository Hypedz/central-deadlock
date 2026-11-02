/* Servidor estático pequeno para os testes do Playwright.
   Uso: node tools/servidor-teste.js 8765
   Ele não é usado pelo site publicado; serve só para abrir os arquivos
   locais no navegador de teste. */

const http = require('http');
const fs = require('fs');
const path = require('path');

const raiz = path.resolve(__dirname, '..');
const porta = Number(process.argv[2] || 8765);
const tipos = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.webmanifest': 'application/manifest+json; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf'
};

function responder(requisicao, resposta) {
    let caminho;
    try {
        caminho = decodeURIComponent(new URL(requisicao.url, 'http://localhost').pathname);
    } catch (e) {
        resposta.writeHead(400); resposta.end('Pedido inválido'); return;
    }
    if (caminho.endsWith('/')) caminho += 'index.html';
    const arquivo = path.resolve(raiz, '.' + caminho);
    if (!arquivo.startsWith(raiz + path.sep) && arquivo !== raiz) {
        resposta.writeHead(403); resposta.end('Fora da pasta do site'); return;
    }
    fs.readFile(arquivo, (erro, dados) => {
        if (erro) {
            resposta.writeHead(erro.code === 'ENOENT' ? 404 : 500);
            resposta.end(erro.code === 'ENOENT' ? 'Arquivo não encontrado' : 'Erro ao ler o arquivo');
            return;
        }
        const ext = path.extname(arquivo).toLowerCase();
        resposta.writeHead(200, {
            'Content-Type': tipos[ext] || 'application/octet-stream',
            'Cache-Control': 'no-store',
            'X-Content-Type-Options': 'nosniff'
        });
        resposta.end(dados);
    });
}

http.createServer(responder).listen(porta, '127.0.0.1', () => {
    console.log(`Servidor de teste em http://127.0.0.1:${porta}`);
});

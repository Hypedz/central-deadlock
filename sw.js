/* ============================================================
   CENTRAL DEADLOCK - service worker (deixa o site instalável e
   mais rápido, guardando uma cópia dos arquivos no navegador).

   Regra de ouro: NUNCA mostrar notícia velha.
   - Páginas, scripts e estilos: sempre busca na internet primeiro.
   - Imagens e fontes: usa a cópia guardada e atualiza em segundo plano.
   ============================================================ */

const VERSAO = 'central-deadlock-2026-10-29d';
const ESSENCIAIS = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './tema.js',
    './heroes-data.js',
    './data/hero-stats.js',
    './data/game-data.js',
    './data/hero-history.js',
    './data/steam-news.js',
    './data/elos.js',
    './data/guias.js',
    './data/builds.js',
    './data/esports.js',
    './data/top-jogadores.js',
    './data/hero-analytics.js',
    './manifest.webmanifest',
    './analytics.js',
    './pagina.js',
    './pwa.js',
    './offline.html',
    './assets/brand/favicon-c.svg',
    './assets/brand/icon-192.png'
];

self.addEventListener('install', (evento) => {
    evento.waitUntil(
        caches.open(VERSAO)
            .then((cache) => cache.addAll(ESSENCIAIS).catch(() => {}))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (evento) => {
    evento.waitUntil(
        caches.keys()
            .then((chaves) => Promise.all(chaves.filter((k) => k !== VERSAO).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

/* O site pode pedir para o app novo assumir na hora (quando aparece o
   aviso "Atualizar agora"). */
self.addEventListener('message', (evento) => {
    if (evento.data && evento.data.type === 'skipWaiting') self.skipWaiting();
});

function guardar(pedido, resposta) {
    // respostas "opaque" (de outros sites, sem permissão de leitura) também podem
    // ser guardadas: é assim que as fontes e os ícones ficam disponíveis offline.
    if (!resposta || (resposta.type !== 'opaque' && !resposta.ok)) return resposta;
    const copia = resposta.clone();
    caches.open(VERSAO).then((cache) => cache.put(pedido, copia)).catch(() => {});
    return resposta;
}

self.addEventListener('fetch', (evento) => {
    const pedido = evento.request;
    if (pedido.method !== 'GET') return;

    let url;
    try { url = new URL(pedido.url); } catch (e) { return; }

    // outras origens: guardamos fontes e ícones (Google Fonts e Font Awesome)
    // para o site continuar bonito e legível mesmo sem internet.
    if (url.origin !== self.location.origin) {
        const externas = ['fonts.googleapis.com', 'fonts.gstatic.com', 'cdnjs.cloudflare.com'];
        if (externas.indexOf(url.hostname) === -1) return;
        evento.respondWith(
            caches.match(pedido).then((guardada) => {
                const daRede = fetch(pedido).then((resposta) => guardar(pedido, resposta)).catch(() => guardada);
                return guardada || daRede;
            })
        );
        return;
    }

    const muda = /\.(html?|js|css|json|webmanifest|xml|txt)$/i.test(url.pathname) || url.pathname.endsWith('/');

    if (muda) {
        // internet primeiro: o site publicado está sempre atualizado
        evento.respondWith(
            fetch(pedido)
                .then((resposta) => guardar(pedido, resposta))
                .catch(() => caches.match(pedido, { ignoreSearch: true }).then((r) => {
                    if (r) return r;
                    /* página que ainda não foi visitada: mostra o aviso offline */
                    if (pedido.mode === 'navigate') return caches.match('./offline.html');
                    return caches.match('./index.html');
                }))
        );
        return;
    }

    // imagens e afins: cópia guardada na hora + atualização em segundo plano
    evento.respondWith(
        caches.match(pedido).then((guardada) => {
            const daRede = fetch(pedido)
                .then((resposta) => guardar(pedido, resposta))
                .catch(() => guardada);
            return guardada || daRede;
        })
    );
});

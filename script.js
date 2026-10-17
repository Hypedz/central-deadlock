// ========================================
// CENTRAL DEADLOCK - Scripts
// Heróis (estandartes + detalhes), conteúdos clicáveis e perfil
// Os dados dos heróis ficam em heroes-data.js
// ========================================

/* ================= utilidades ================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => n.toLocaleString('pt-BR');

const HEROES = (typeof HEROES_DATA !== 'undefined' ? HEROES_DATA : []).map((h, i) => ({ ...h, idx: i }));

/* ================= estatísticas REAIS dos heróis =================
   O arquivo data/hero-stats.js é gerado sozinho por tools/update-stats.py,
   com números reais de partidas (fonte: deadlock-api.com).
   Quando ele existe, o win rate, o pick rate e a tier list deixam de ser
   exemplo e passam a ser os números de verdade. Se o arquivo não existir,
   o site continua funcionando com os valores do heroes-data.js. */
const HERO_STATS = (window.HERO_STATS && window.HERO_STATS.herois) || {};
const STATS_INFO = window.HERO_STATS || {};
const temStatsReais = Object.keys(HERO_STATS).length > 0;

HEROES.forEach(h => {
    const s = HERO_STATS[h.name];
    if (!s) return;
    h.partidas = s.partidas;
    h.kda = s.kda;
    h.posicao = s.posicao;
    h.win = Number(s.win).toFixed(1);
    h.pick = Number(s.pick).toFixed(1);
    if (s.tier) h.tier = s.tier;   // tier list calculada com dados reais
    h.real = true;
});

const PLAYABLE = HEROES.filter(h => !h.soon);
const heroByName = (n) => HEROES.find(h => h.name === n);

function initials(name) {
    return String(name).replace(/&/g, ' ').split(/\s+/)
        .filter(w => w && /[A-Za-zÀ-ÿ]/.test(w[0]))
        .map(w => w[0]).join('').slice(0, 2).toUpperCase();
}
function tierClass(t) { return t === 'S' ? 'acc' : t === 'A' ? 'warn' : ''; }

/* ================= estado ================= */
const store = {
    get(k, def) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? def : v; } catch (e) { return def; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
};

let favs = store.get('cdl_favs', []);
let stats = Object.assign({ visited: {}, heroesSeen: [], changed: {}, night: 0 }, store.get('cdl_stats', {}));
if (!Array.isArray(stats.heroesSeen)) stats.heroesSeen = [];
if (!stats.visited || typeof stats.visited !== 'object') stats.visited = {};
if (!stats.changed || typeof stats.changed !== 'object') stats.changed = {};
const saveStats = () => store.set('cdl_stats', stats);

const RANKS = ['Recruta', 'Batedor', 'Veterano', 'Especialista', 'Mestre', 'Lenda'];
const rankName = (n) => RANKS[Math.min(5, Math.floor((n - 1) / 2))];

/* ================= perfil: defines ================= */
const BANNERS = {
    brasa: ['Brasa', ['#ff3b5c', '#7a1230']],
    aurora: ['Aurora', ['#22d3ee', '#8b5cf6']],
    noite: ['Noite', ['#312e81', '#0f172a']],
    floresta: ['Floresta', ['#34d399', '#064e3b']],
    lima: ['Lima', ['#b6f24a', '#2f7a1a']],
    sunset: ['Pôr do sol', ['#fbbf24', '#ec4899']],
    mono: ['Mono', ['#6b7280', '#111827']],
    custom: ['Personalizado', ['#b6f24a', '#2f7a1a']]
};
const PATTERNS = [
    ['none', 'Nenhum'], ['grid', 'Grade'], ['dots', 'Pontos'], ['dotsbig', 'Pontos grandes'],
    ['diag', 'Listras'], ['vstripes', 'Listras verticais'], ['checks', 'Xadrez'], ['diamonds', 'Losangos'],
    ['chevron', 'Zigue-zague'], ['rays', 'Raios'], ['rings', 'Anéis'], ['glow', 'Brilho'], ['noise', 'Granulado']
];
const SHAPES = [['squircle', 'Arredondado'], ['circle', 'Círculo'], ['sharp', 'Quadrado'], ['hex', 'Hexágono'], ['hexflat', 'Hexágono deitado'], ['octagon', 'Octógono'], ['diamond', 'Losango'], ['pentagon', 'Pentágono'], ['triangle', 'Triângulo'], ['shield', 'Escudo'], ['star', 'Estrela'], ['flower', 'Flor']];
const FRAMES = [['none', 'Sem moldura'], ['solid', 'Cor de destaque'], ['neon', 'Neon'], ['gold', 'Dourada'], ['silver', 'Prata'], ['fire', 'Fogo'], ['ice', 'Gelo'], ['blood', 'Sangue'], ['rainbow', 'Arco-íris'], ['double', 'Dupla']];
/* cores das molduras (nome -> degradê + brilho) */
const FRAME_STYLE = {
    solid: { bg: 'var(--lime)' },
    neon: { bg: 'var(--lime)', glow: 'drop-shadow(0 0 10px var(--lime))' },
    gold: { bg: 'linear-gradient(135deg,#f6d36b,#a8741a)' },
    silver: { bg: 'linear-gradient(135deg,#eef2f7,#6b7280)' },
    fire: { bg: 'linear-gradient(135deg,#ffc247,#ff3b1f)', glow: 'drop-shadow(0 0 10px rgba(255,106,31,.9))' },
    ice: { bg: 'linear-gradient(135deg,#bdf3ff,#3b82f6)', glow: 'drop-shadow(0 0 10px rgba(56,189,248,.9))' },
    blood: { bg: 'linear-gradient(135deg,#ff5b5b,#7f1d1d)', glow: 'drop-shadow(0 0 10px rgba(239,68,68,.9))' },
    rainbow: { bg: 'linear-gradient(135deg,#f87171,#fbbf24,#34d399,#22d3ee,#8b5cf6)', glow: 'drop-shadow(0 0 12px rgba(255,255,255,.4))' }
};
const ACCENTS = [['auto', 'Padrão (verde)'], ['#ff3b5c', 'Vermelho'], ['#8b5cf6', 'Roxo'], ['#22d3ee', 'Ciano'], ['#34d399', 'Verde'], ['#fbbf24', 'Âmbar'], ['#ec4899', 'Rosa'], ['#3b82f6', 'Azul']];
const REGIONS = ['Brasil', 'Sudeste', 'Sul', 'Nordeste', 'Centro-Oeste', 'Norte', 'América do Norte', 'Europa', 'Ásia', 'Oceania', 'Outro'];
const TITLES = ['Jogador', 'Casual', 'Competitivo', 'Suporte', 'Tanque', 'Carry', 'Streamer', 'Criador de Conteúdo', 'Mestre', 'Lenda'];
/* cores prontas para o avatar de letras (quando não tem foto) */
const AV_COLORS = [['#b6f24a', '#2f7a1a'], ['#22d3ee', '#0e7490'], ['#8b5cf6', '#4c1d95'], ['#f472b6', '#9d174d'],
    ['#fbbf24', '#b45309'], ['#ef4444', '#7f1d1d'], ['#38bdf8', '#1e3a8a'], ['#34d399', '#065f46'],
    ['#f8fafc', '#475569'], ['#111827', '#64748b']];
const POLY = {
    /* hexágono de verdade: a largura tem que ser 0,866 da altura, senão ele
       fica "achatado" (mais largo do que devia). */
    hex: [[0, -1], [0.866, -0.5], [0.866, 0.5], [0, 1], [-0.866, 0.5], [-0.866, -0.5]],
    diamond: [[0, -1], [1, 0], [0, 1], [-1, 0]],
    shield: [[-1, -0.9], [0, -1], [1, -0.9], [1, 0.1], [0, 1], [-1, 0.1]]
};
POLY.octagon = Array.from({ length: 8 }, (_, i) => { const a = Math.PI / 8 + i * Math.PI / 4; return [Math.sin(a), -Math.cos(a)]; });
POLY.star = Array.from({ length: 10 }, (_, i) => { const a = i * Math.PI / 5, r = i % 2 ? 0.5 : 1; return [r * Math.sin(a), -r * Math.cos(a)]; });
POLY.pentagon = Array.from({ length: 5 }, (_, i) => { const a = i * 2 * Math.PI / 5; return [Math.sin(a), -Math.cos(a)]; });
POLY.triangle = [[0, -1], [1, 0.92], [-1, 0.92]];
POLY.hexflat = [[-1, 0], [-0.5, -0.866], [0.5, -0.866], [1, 0], [0.5, 0.866], [-0.5, 0.866]];
POLY.flower = Array.from({ length: 34 }, (_, i) => { const a = i * Math.PI / 17; const r = 0.87 + 0.13 * Math.cos(6 * a); return [r * Math.sin(a), -r * Math.cos(a)]; });

const PROFILE_DEF = {
    id: 'CDL-' + Math.floor(1000 + Math.random() * 9000),
    nick: '', pronouns: '', status: '', bio: '', title: 'Jogador', region: 'Brasil',
    mains: [], links: { discord: '', twitch: '', youtube: '' },
    banner: 'lima', bc1: '#b6f24a', bc2: '#2f7a1a', pattern: 'none', bannerImg: '',
    accent: 'auto',
    av: { img: '', shape: 'squircle', frame: 'none', zoom: 1, px: 50, py: 50, c1: '', c2: '' },
    theme: 'dark', lang: 'pt-BR', compact: false
};
let profile = (() => {
    const raw = store.get('cdl_profile', null);
    if (!raw || typeof raw !== 'object') return { ...PROFILE_DEF, av: { ...PROFILE_DEF.av } };
    return {
        ...PROFILE_DEF, ...raw,
        links: { ...PROFILE_DEF.links, ...(raw.links || {}) },
        av: { ...PROFILE_DEF.av, ...(raw.av || {}) },
        mains: Array.isArray(raw.mains) ? raw.mains.filter(n => heroByName(n)).slice(0, 3) : []
    };
})();
const saveProfile = () => store.set('cdl_profile', profile);

const ACH = [
    { n: 'Novato', d: 'Escolha um apelido para o perfil.', p: () => profile.nick ? 1 : 0, max: 1 },
    { n: 'Explorador', d: 'Visite 8 páginas diferentes.', p: () => Object.keys(stats.visited).length, max: 8 },
    { n: 'Conhecedor', d: 'Abra a página de 10 heróis.', p: () => stats.heroesSeen.length, max: 10 },
    { n: 'Completista', d: 'Abra a página de todos os heróis lançados.', p: () => stats.heroesSeen.filter(n => !HEROES_SOON.includes(n)).length, max: PLAYABLE.length },
    { n: 'Colecionador', d: 'Favorite 5 heróis.', p: () => favs.length, max: 5 },
    { n: 'Personalizador', d: 'Personalize 6 itens do perfil.', p: () => Object.keys(stats.changed).length, max: 6 },
    { n: 'Coruja', d: 'Use o site de madrugada (0h às 5h).', p: () => stats.night, max: 1 },
    { n: 'Lenda', d: 'Chegue ao nível 5.', p: () => level().n, max: 5 }
];
/* ícone de cada conquista (Font Awesome) */
const ACH_ICON = ['fa-id-badge', 'fa-compass', 'fa-graduation-cap', 'fa-trophy', 'fa-star', 'fa-palette', 'fa-moon', 'fa-crown'];

function level() {
    const xp = Object.keys(stats.visited).length * 8
        + Math.min(stats.heroesSeen.length, HEROES.length) * 3
        + favs.length * 6
        + Object.keys(stats.changed).length * 4
        + (profile.nick ? 30 : 0);
    return { xp, n: Math.floor(xp / 100) + 1, cur: xp % 100, next: 100 };
}
function touch(key) { if (key && !stats.changed[key]) { stats.changed[key] = 1; saveStats(); } }

/* ================= conteúdo (notícias / guias / partidas) ================= */
/* As notícias de verdade vêm do data/steam-news.js (oficiais, traduzidas).
   A lista NEWS abaixo é só o plano B: ela aparece se, por algum motivo, o
   robô do GitHub ainda não tiver buscado nenhuma notícia. Nada de conteúdo
   inventado aparece na tela quando as notícias reais existem. */
const NEWS = [
    {
        id: 'n1', cat: 'Atualização', title: 'Patch Notes: balanceamento de heróis e itens', img: 'Shiv.png', date: '15 out 2026',
        desc: 'Veja o que mudou nos heróis mais usados do momento.',
        body: ['Ajustes de dano, tempos de recarga e custo de almas chegaram com esta atualização.', 'Confira abaixo os principais pontos e como eles mudam o seu jeito de jogar.']
    },
    {
        id: 'n2', cat: 'Guia', title: 'Como subir de ranque rapidamente', img: 'Ivy.png', date: '13 out 2026',
        desc: 'Dicas práticas para iniciantes evoluírem mais rápido.',
        body: ['Movimentação, farm e escolha de heróis são a base para subir de ranque.', 'Neste guia reunimos os erros mais comuns e como evitá-los.']
    },
    {
        id: 'n3', cat: 'Competitivo', title: 'Primeiro torneio brasileiro confirmado', img: 'Abrams.png', date: '10 out 2026',
        desc: 'Equipes já se preparam para a estreia oficial.',
        body: ['As principais organizações do país já iniciaram os treinos para o torneio.', 'A fase de inscrições deve abrir nas próximas semanas.']
    },
    {
        id: 'n4', cat: 'Herói', title: 'Novo herói chega ao jogo', img: 'Pocket.png', date: '08 out 2026',
        desc: 'Conheça as habilidades e o papel do recém-chegado.',
        body: ['O elenco cresceu de novo! Veja as habilidades, o papel e as primeiras impressões do novo herói.', 'Abra a aba Heróis para ver a ficha completa.']
    }
];
/* Guias: o guia de CADA herói (43) é montado sozinho, com os números reais
   das partidas, pelo script tools/gerar-guias.py — ele escreve data/guias.js.
   Se esse arquivo não carregar por algum motivo, o site mostra os 3 guias de
   exemplo abaixo, só para a aba nunca ficar vazia. */
const GUIA_EXEMPLO = [
    {
        id: 'g1', cat: 'Guia', title: 'McGinnis - Guia Completo', img: 'McGinnis.png', date: '12 out 2026',
        desc: 'Build, habilidades e dicas de lane para dominar com a atiradora.',
        body: ['McGinnis domina o espaço com torres e barreiras. Posicione-se atrás do time e use as construções para controlar as entradas.', 'Nos primeiros minutos, foque em farm seguro e monte itens de vitalidade antes de partir para o dano.']
    },
    {
        id: 'g2', cat: 'Guia', title: 'Seven - Estratégia Elétrica', img: 'Seven.png', date: '11 out 2026',
        desc: 'Melhores itens, habilidades e combos para o herói elétrico.',
        body: ['Seven brilha nas lutas de equipe com dano em área. Guarde a suprema para o momento certo: quando os inimigos estiverem agrupados.', 'Itens de espírito potencializam o dano elétrico e reduzem a recarga.']
    },
    {
        id: 'g3', cat: 'Guia', title: 'Kelvin - Suporte de Gelo', img: 'Kelvin.png', date: '09 out 2026',
        desc: 'Como proteger o time e controlar as lutas com o Kelvin.',
        body: ['Kelvin é o apoio que mantém o time vivo. Use o escudo de gelo para salvar aliados em apuros e a cura para sustentar as lutas longas.', 'Fique sempre atrás da linha de frente e acompanhe o minimapa para chegar a tempo.']
    }
];
const GUIDES = (window.GUIAS && window.GUIAS.lista && window.GUIAS.lista.length) ? window.GUIAS.lista : GUIA_EXEMPLO;

/* Os torneios de esports não têm nada escrito à mão aqui dentro: eles vêm do
   arquivo gerado data/esports.js, com os torneios e resultados REAIS (Liquipedia). */

/* Builds sugeridas por função (exemplo escrito à mão) */
const BUILD_EXEMPLO = [
    {
        id: 'bd1', cat: 'Build', title: 'Tanque — linha de frente', img: 'Abrams.png', date: '15 out 2026',
        desc: 'Itens para aguentar pancada e abrir as lutas.',
        items: [['Pele Resistente', 500], ['Fôlego Extra', 500], ['Bateria de Vida', 1250], ['Escudo Pulsante', 3000], ['Colosso', 6200]],
        body: ['Compre itens de vitalidade primeiro para sobreviver aos primeiros confrontos.', 'Depois parta para resistência mágica e itens de aura para ajudar o time.']
    },
    {
        id: 'bd2', cat: 'Build', title: 'Suporte — sustentar o time', img: 'Kelvin.png', date: '14 out 2026',
        desc: 'Cura, escudo e utilidade para manter o time vivo.',
        items: [['Foco Mental', 500], ['Eco Arcano', 1250], ['Surto de Energia', 1250], ['Ruptura Espiritual', 3000], ['Ápice Arcano', 6200]],
        body: ['Priorize itens de espírito para melhorar curas e escudos.', 'Fique atrás da linha de frente e use a utilidade nos momentos certos.']
    },
    {
        id: 'bd3', cat: 'Build', title: 'Carry — dano à distância', img: 'Vindicta.png', date: '13 out 2026',
        desc: 'Itens de dano e cadência para derreter os inimigos.',
        items: [['Munição Reforçada', 500], ['Disparo Rápido', 500], ['Cano Longo', 1250], ['Rajada Perfurante', 3000], ['Frenesi de Combate', 6200]],
        body: ['Aumente o dano por tiro e a cadência antes de itens defensivos.', 'Posicione-se atrás do time e aproveite os erros dos inimigos.']
    },
    {
        id: 'bd4', cat: 'Build', title: 'Assassino — matar e escapar', img: 'Sinclair.png', date: '12 out 2026',
        desc: 'Mobilidade e explosão de dano para eliminar alvos isolados.',
        items: [['Munição Reforçada', 500], ['Disparo Rápido', 500], ['Pente Estendido', 1250], ['Rajada Perfurante', 3000], ['Frenesi de Combate', 6200]],
        body: ['Busque alvos isolados e use a mobilidade para entrar e sair.', 'Compre itens de fuga se a partida estiver difícil.']
    },
    {
        id: 'bd5', cat: 'Build', title: 'Controle — dominar as lutas', img: 'Dynamo.png', date: '11 out 2026',
        desc: 'Utilidade em área para virar as lutas de equipe.',
        items: [['Foco Mental', 500], ['Eco Arcano', 1250], ['Escudo Pulsante', 3000], ['Ruptura Espiritual', 3000], ['Ápice Arcano', 6200]],
        body: ['Reduza a recarga para usar as habilidades de controle mais vezes.', 'Guarde a habilidade principal para o momento decisivo da luta.']
    }
];

/* As builds mostradas na aba Builds vêm do arquivo gerado data/builds.js: são as
   builds mais usadas de cada herói, com a ordem real de compra e o win rate das
   partidas. A lista BUILD_EXEMPLO acima só entra se esse arquivo não existir. */
const BUILDS = (window.BUILDS_REAIS && window.BUILDS_REAIS.lista && window.BUILDS_REAIS.lista.length)
    ? window.BUILDS_REAIS.lista
    : BUILD_EXEMPLO;

/* ================= início ================= */
document.addEventListener('DOMContentLoaded', () => {
    applyProfile();
    initSections();
    initHeroes();
    initContents();
    initCompare();
    initStats();
    initElos();
    initHome();
    initGlossario();
    initItens();
    initRanking();
    renderHistorico();
    initMap();
    initEvents();
    initQuiz();
    initProfile();
    initModals();
    initInstalar();
    initMira();
    initBusca();
    initSteam();
    initToast();
    initToTop();
    fixShareMeta();
    updateChip();
    checkSharedCard();
    registrarApp();
});

/* ================= app instalável (PWA) =================
   O sw.js deixa o site abrir mais rápido e funcionar mesmo com
   internet ruim. Se o navegador não suportar, o site segue normal. */
function registrarApp() {
    if (!('serviceWorker' in navigator)) return;
    if (!/^https?:$/.test(location.protocol)) return;   // só funciona publicado/servidor local
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => {});
    });
}

/* ================= janela (modal) genérica =================
   Serve para abrir qualquer conteúdo numa janelinha (fechada no X,
   no clique fora ou com a tecla Esc). */
function abrirJanela(html) {
    const caixa = $('#contentModalBox');
    if (!caixa) return;
    caixa.innerHTML = '<button class="modal-close" data-close="contentModal" aria-label="Fechar"><i class="fa-solid fa-xmark"></i></button><div class="cm-body">' + html + '</div>';
    openOverlay($('#contentModal'));
}

/* ================= instalar o app (PWA) =================
   O botão só aparece quando o navegador permite instalar ("beforeinstallprompt").
   No iPhone o Safari não avisa nada: nesse caso o botão abre o passo a passo. */
function initInstalar() {
    const botao = $('#btnInstalar');
    if (!botao) return;
    const jaInstalado = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
    if (jaInstalado) return;                     // já está aberto como app

    const ehIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    let convite = null;

    window.addEventListener('beforeinstallprompt', (evento) => {
        evento.preventDefault();                 // guardamos para tocar no nosso botão
        convite = evento;
        botao.hidden = false;
    });
    if (ehIOS) botao.hidden = false;             // iPhone: mostramos o passo a passo

    botao.addEventListener('click', async () => {
        if (convite) {
            convite.prompt();
            try {
                const escolha = await convite.userChoice;
                if (escolha && escolha.outcome === 'accepted') {
                    botao.hidden = true;
                    showToast('App instalado! O ícone está junto dos seus apps.');
                }
            } catch (e) { /* se o navegador recusar, não acontece nada */ }
            convite = null;
            return;
        }
        abrirJanela(`
            <h2 class="cm-title">Instalar o app</h2>
            <p class="muted-txt">${ehIOS
                ? 'No iPhone e no iPad o Safari não deixa o site pedir sozinho. É rapidinho:'
                : 'O seu navegador não mostrou o convite, mas dá para instalar na mão:'}</p>
            <ol class="cx-passos">
                <li>${ehIOS ? 'Toque em <b>Compartilhar</b> (o quadrado com a seta para cima).' : 'Abra o menu do navegador (os três pontinhos).'}</li>
                <li>Escolha <b>Adicionar à Tela de Início</b>${ehIOS ? '' : ' ou <b>Instalar app</b>'}.</li>
                <li>Confirme. O ícone da Central Deadlock aparece junto dos seus apps.</li>
            </ol>
            <p class="muted-txt">Dentro do app, o site abre em tela cheia e carrega mais rápido.</p>`);
    });

    window.addEventListener('appinstalled', () => { botao.hidden = true; });
}

/* ================= minha mira (crosshair) =================
   Lê o código da mira do jogo (aquele que começa com "DL.") pelo serviço
   público de dados do Deadlock, desenha a mira em tamanho grande e explica
   cada ajuste em português. Nada é guardado em lugar nenhum. */
const CX_API = 'https://api.deadlock-api.com/v1/crosshair';
let cxCodigo = '';

function corDeRGB(r, g, b) {
    const pedaco = (valor) => Math.max(0, Math.min(255, parseInt(valor, 10) || 0)).toString(16).padStart(2, '0');
    return '#' + pedaco(r) + pedaco(g) + pedaco(b);
}

function initMira() {
    const campo = $('#cxCodigo');
    const botao = $('#cxVer');
    if (!campo || !botao) return;

    const avisar = (texto, erro) => {
        const caixa = $('#cxAviso');
        if (!caixa) return;
        caixa.textContent = texto || '';
        caixa.classList.toggle('erro', !!erro);
        caixa.hidden = !texto;
    };

    const desenharDetalhes = (c) => {
        const pct = (v) => Math.round((parseFloat(v) || 0) * 100) + '%';
        const linhas = [
            ['Formato', c.themed ? 'Mira com tema (colorida do jogo)' : 'Mira padrão'],
            ['Barrinhas', `${c.pip_width}px de espessura · ${c.pip_height}px de comprimento`],
            ['Espaço no meio', `${c.pip_gap}px ${c.pip_gap_static ? '(fixo)' : '(acompanha o alvo)'}`],
            ['Opacidade das barrinhas', pct(c.pip_opacity)],
            ['Ponto do meio', (c.dot_size > 0 ? `${c.dot_size}px · opacidade ${pct(c.dot_opacity)}` : 'sem ponto no meio')],
            ['Contorno', ((c.pip_outline_border || c.dot_outline_border)
                ? `${c.pip_outline_border}px nas barrinhas · ${c.dot_outline_border}px no ponto`
                : 'sem contorno')],
        ];
        const cor = corDeRGB(c.color_r, c.color_g, c.color_b);
        const corBorda = corDeRGB(c.outline_color_r, c.outline_color_g, c.outline_color_b);
        $('#cxDetalhes').innerHTML =
            '<div class="cx-sec">O que a sua mira tem</div>' +
            linhas.map(([rotulo, valor]) => `<div class="cx-item"><span>${esc(rotulo)}</span><b>${esc(String(valor))}</b></div>`).join('') +
            '<div class="cx-sec">Cores</div>' +
            `<div class="cx-cores">
                <span><i style="background:${cor}"></i> Mira ${cor}</span>
                <span><i style="background:${corBorda}"></i> Contorno ${corBorda}</span>
            </div>`;
        $('#cxImagem').src = `${CX_API}/code/image?code=${encodeURIComponent(cxCodigo)}&scale=8&screen_height=2160`;
        $('#cxResultado').hidden = false;
    };

    const ver = async () => {
        const codigo = campo.value.trim();
        if (!codigo) { avisar('Cole o código da sua mira primeiro.', true); return; }
        if (!/^DL\./i.test(codigo)) { avisar('Esse código não parece de mira: ele precisa começar com "DL." (veja em Configurações › Mira, no jogo).', true); return; }
        botao.disabled = true;
        avisar('Lendo a sua mira...');
        try {
            const resposta = await fetch(`${CX_API}/code/settings?code=${encodeURIComponent(codigo)}`);
            if (!resposta.ok) throw new Error('codigo invalido');
            const c = await resposta.json();
            cxCodigo = codigo;
            desenharDetalhes(c);
            avisar('');
        } catch (e) {
            $('#cxResultado').hidden = true;
            avisar('Não consegui ler esse código. Confira se copiou ele inteiro (começa com "DL.").', true);
        } finally {
            botao.disabled = false;
        }
    };

    botao.addEventListener('click', ver);
    campo.addEventListener('keydown', (e) => { if (e.key === 'Enter') ver(); });

    const copiar = $('#cxCopiar');
    if (copiar) copiar.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(cxCodigo);
            showToast('Código copiado!');
        } catch (e) {
            showToast('Não deu para copiar. Selecione o código e copie na mão.', 'error');
        }
    });
}

/* ================= painel do Steam (dentro de "Meu Perfil") =================
   O jogador digita o nick do Steam e o site mostra as partidas DE VERDADE
   dele: win rate, KDA, herói mais jogado e os últimos jogos. Os números vêm
   do serviço público deadlock-api.com e o escolhido fica salvo só no seu
   navegador (localStorage) — nada é enviado para lugar nenhum. */
const STEAM_API = 'https://api.deadlock-api.com/v1';
let steamJogador = store.get('cdl_steam', null);
let steamDados = null;

function steamPedir(caminho) {
    return fetch(STEAM_API + caminho).then((resposta) => {
        if (!resposta.ok) throw new Error('erro ' + resposta.status);
        return resposta.json();
    });
}

function steamNumero(valor) {
    return (Number(valor) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function steamPorcento(valor) {
    return (Number(valor) || 0).toFixed(1).replace('.', ',') + '%';
}

function steamDuracao(segundos) {
    const minutos = Math.round((Number(segundos) || 0) / 60);
    if (minutos < 60) return minutos + ' min';
    return Math.floor(minutos / 60) + 'h ' + (minutos % 60) + 'min';
}

function steamData(unix) {
    const d = new Date((Number(unix) || 0) * 1000);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

/* O elo de verdade: o "badge" do jogo é elo (2 primeiros dígitos) + subtier. */
function steamBrasao(badge) {
    const elos = window.ELOS;
    if (!badge || !elos || !elos.todos) return null;
    const tier = Math.floor(Number(badge) / 10);
    const sub = Number(badge) % 10;
    const achado = elos.todos.filter(e => e.tier === tier)[0];
    if (!achado || !achado.img) return null;
    return { img: achado.img, nome: achado.nome, sub: sub };
}

function steamAcharConta(lista, id) {
    return lista.filter(j => String(j.account_id) === String(id))[0] || null;
}

function steamMostrarAchados(lista) {
    const caixa = $('#steamAchados');
    if (!caixa) return;
    caixa.hidden = false;
    caixa.innerHTML = lista.map((j, i) => `
        <button type="button" class="steam-achado" data-i="${i}">
            <img src="${esc(j.avatarmedium || j.avatar || '')}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">
            <span>
                <b>${esc(j.personaname || 'Jogador')}</b>
                <small>${j.matches_played_last_30d ? j.matches_played_last_30d + ' partidas nos últimos 30 dias' : 'conta do Steam'}</small>
            </span>
            <i class="fa-solid fa-chevron-right"></i>
        </button>`).join('');
    $$('.steam-achado', caixa).forEach((b) => b.addEventListener('click', () => {
        const j = lista[Number(b.dataset.i)];
        if (!j) return;
        caixa.hidden = true;
        steamCarregar(j.account_id, j.personaname, j.avatarfull || j.avatar, j.profileurl);
    }));
}

async function steamCarregar(id, nome, avatar, link) {
    const alvo = $('#steamPerfil');
    if (!alvo) return;
    alvo.innerHTML = '<p class="steam-carregando"><i class="fa-solid fa-spinner fa-spin"></i> Buscando as suas partidas de verdade...</p>';
    try {
        const respostas = await Promise.all([
            steamPedir('/players/' + id + '/rank').catch(() => null),
            steamPedir('/players/' + id + '/match-history')
        ]);
        steamJogador = { id: id, nome: nome || 'Jogador', avatar: avatar || '', link: link || '' };
        store.set('cdl_steam', steamJogador);
        steamDados = { jogador: steamJogador, elo: respostas[0], partidas: respostas[1] || [] };
        steamDesenhar();
    } catch (e) {
        alvo.innerHTML = '<p class="steam-aviso erro"><i class="fa-solid fa-triangle-exclamation"></i> Não consegui carregar as partidas agora. Confira a sua internet e tente de novo.</p>';
    }
}

function steamDesenhar() {
    const alvo = $('#steamPerfil');
    if (!alvo || !steamDados) return;
    const jogador = steamDados.jogador;
    const todas = steamDados.partidas || [];
    const contadas = todas.filter(m => m.player_match_outcome === 1 || m.player_match_outcome === 2);
    const vitorias = contadas.filter(m => m.player_match_outcome === 1).length;
    const abates = contadas.reduce((s, m) => s + (Number(m.player_kills) || 0), 0);
    const mortes = contadas.reduce((s, m) => s + (Number(m.player_deaths) || 0), 0);
    const ajudas = contadas.reduce((s, m) => s + (Number(m.player_assists) || 0), 0);
    const winRate = contadas.length ? (vitorias * 100 / contadas.length) : 0;
    const kda = mortes > 0 ? (abates + ajudas) / mortes : (abates + ajudas);

    // heróis mais jogados
    const porHeroi = [];
    contadas.forEach(m => {
        const h = heroiPorApiId(m.hero_id);
        const chave = h ? h.name : 'Herói ' + m.hero_id;
        let registro = porHeroi.filter(x => x.chave === chave)[0];
        if (!registro) { registro = { chave: chave, heroi: h, jogos: 0, vitorias: 0 }; porHeroi.push(registro); }
        registro.jogos++;
        if (m.player_match_outcome === 1) registro.vitorias++;
    });
    porHeroi.sort((a, b) => b.jogos - a.jogos);

    const elo = steamBrasao(steamDados.elo && steamDados.elo.badge);
    const favoritos = porHeroi.slice(0, 3).map(f => `
        <div class="steam-fav">
            ${f.heroi ? `<img src="assets/heroes/${esc(f.heroi.file)}" alt="" loading="lazy">` : '<i class="fa-solid fa-masks-theater"></i>'}
            <div>
                <b>${esc(f.chave)}</b>
                <small>${f.jogos} ${f.jogos > 1 ? 'partidas' : 'partida'} · ${steamPorcento(f.vitorias * 100 / f.jogos)} de vitória</small>
            </div>
        </div>`).join('');

    const ultimos = contadas.slice(0, 20).map(m => {
        const h = heroiPorApiId(m.hero_id);
        const ganhou = m.player_match_outcome === 1;
        const mortesJogo = Number(m.player_deaths) || 0;
        const kd = mortesJogo > 0 ? ((Number(m.player_kills) || 0) + (Number(m.player_assists) || 0)) / mortesJogo : ((Number(m.player_kills) || 0) + (Number(m.player_assists) || 0));
        return `<div class="steam-jogo ${ganhou ? 'ganhou' : 'perdeu'}">
            <span class="steam-jogo-res">${ganhou ? 'Vitória' : 'Derrota'}</span>
            <span class="steam-jogo-heroi">
                ${h ? `<img src="assets/heroes/${esc(h.file)}" alt="" loading="lazy">` : ''}
                <b>${esc(h ? h.name : 'Herói ' + m.hero_id)}</b>
            </span>
            <span class="steam-jogo-nums"><b>${m.player_kills}/${m.player_deaths}/${m.player_assists}</b><small>KDA ${steamNumero(kd)} · ${steamDuracao(m.match_duration_s)} · ${steamData(m.start_time)}</small></span>
        </div>`;
    }).join('');

    alvo.innerHTML = `
        <div class="steam-cabeca">
            <img class="steam-avatar" src="${esc(jogador.avatar || '')}" alt="" onerror="this.style.visibility='hidden'">
            <div class="steam-quem">
                <b>${esc(jogador.nome || 'Jogador')}</b>
                <small>${contadas.length} ${contadas.length === 1 ? 'partida contada' : 'partidas contadas'}${todas.length > contadas.length ? ' · ' + (todas.length - contadas.length) + ' sem resultado' : ''}</small>
                ${jogador.link ? `<a href="${esc(jogador.link)}" target="_blank" rel="noopener">Ver no Steam <i class="fa-solid fa-arrow-up-right-from-square"></i></a>` : ''}
            </div>
            ${elo ? `<div class="steam-elo">
                <img src="${esc(elo.img)}" alt="Brasão do elo ${esc(elo.nome)}">
                <div><b>${esc(elo.nome)}</b><small>subtier ${elo.sub}</small></div>
            </div>` : ''}
            <div class="steam-acoes">
                <button type="button" class="btn btn-dark btn-sm" id="steamAtualizar"><i class="fa-solid fa-rotate"></i> Atualizar</button>
                <button type="button" class="btn btn-dark btn-sm" id="steamTrocar"><i class="fa-solid fa-right-left"></i> Trocar jogador</button>
            </div>
        </div>

        <div class="pg-stats steam-numeros">
            <div class="pg-stat"><b>${steamPorcento(winRate)}</b><small>win rate</small></div>
            <div class="pg-stat"><b>${steamNumero(kda)}</b><small>KDA médio</small></div>
            <div class="pg-stat"><b>${abates}/${mortes}/${ajudas}</b><small>abates / mortes / ajudas</small></div>
            <div class="pg-stat"><b>${contadas.length}</b><small>partidas contadas</small></div>
        </div>

        ${favoritos ? '<div class="steam-sec">Seus heróis mais jogados</div><div class="steam-favs">' + favoritos + '</div>' : ''}

        <div class="steam-sec">Últimos jogos</div>
        <div class="steam-jogos">${ultimos || '<p class="muted-txt">Esse jogador ainda não tem partidas com resultado registradas.</p>'}</div>
        <p class="stat-fonte"><i class="fa-solid fa-database"></i> Partidas de verdade do jogador, via deadlock-api.com</p>`;

    const atualizar = $('#steamAtualizar');
    if (atualizar) atualizar.addEventListener('click', () => steamCarregar(jogador.id, jogador.nome, jogador.avatar, jogador.link));
    const trocar = $('#steamTrocar');
    if (trocar) trocar.addEventListener('click', () => {
        steamDados = null;
        alvo.innerHTML = '';
        const campo = $('#steamCampo');
        if (campo) { campo.value = ''; campo.focus(); }
    });
}

function initSteam() {
    const campo = $('#steamCampo');
    const botao = $('#steamProcurar');
    if (!campo || !botao) return;

    const avisar = (texto, erro) => {
        const caixa = $('#steamAviso');
        if (!caixa) return;
        caixa.textContent = texto || '';
        caixa.classList.toggle('erro', !!erro);
        caixa.hidden = !texto;
    };

    const procurar = async () => {
        const nick = campo.value.trim();
        if (nick.length < 2) { avisar('Digite pelo menos 2 letras do seu nick no Steam.', true); return; }
        botao.disabled = true;
        avisar('Procurando "' + nick + '" no Steam...');
        try {
            const achados = await steamPedir('/players/steam-search?limit=8&search_query=' + encodeURIComponent(nick));
            if (!achados || !achados.length) {
                avisar('Não achei ninguém com esse nick. Confira a escrita (é o nome de exibição do Steam).', true);
                return;
            }
            avisar(achados.length === 1 ? 'Achei 1 jogador — é você?' : 'Achei ' + achados.length + ' jogadores — escolha o seu:');
            steamMostrarAchados(achados);
        } catch (e) {
            avisar('Não consegui falar com o serviço de dados agora. Tente de novo em instantes.', true);
        } finally {
            botao.disabled = false;
        }
    };

    botao.addEventListener('click', procurar);
    campo.addEventListener('keydown', (e) => { if (e.key === 'Enter') procurar(); });

    // já tem alguém salvo? então mostra de novo (sem precisar digitar)
    if (steamJogador && steamJogador.id) {
        campo.value = steamJogador.nome || '';
        steamCarregar(steamJogador.id, steamJogador.nome, steamJogador.avatar, steamJogador.link);
    }
}

/* ================= busca global (Ctrl + K) =================
   Acha herói, item, notícia, tela e termo do glossário num lugar só,
   de qualquer tela do site. Abre com Ctrl + K (⌘ + K no Mac) ou pelo
   botão de lupa no menu. */
let buscaIndice = null;
let buscaAchados = [];
let buscaEscolha = 0;

function semAcento(texto) {
    return String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function indiceBusca() {
    if (buscaIndice) return buscaIndice;
    const itens = [];

    // telas do site
    $$('.nav-item[data-section]').forEach(n => {
        const nome = n.textContent.trim();
        itens.push({
            tipo: 'Tela', nome: nome, sub: 'Abrir esta tela do site', icone: 'fa-table-columns',
            chave: nome, abrir: () => showSection(n.dataset.section)
        });
    });

    // heróis
    HEROES.forEach(h => itens.push({
        tipo: 'Herói', nome: h.name, sub: [h.arch, h.role].filter(Boolean).join(' · '),
        icone: 'fa-user-ninja', img: 'assets/heroes/' + h.file,
        chave: [h.name, h.arch, h.role, h.tier, (h.skills || []).map(s => s.name + ' ' + s.desc).join(' ')].join(' '),
        abrir: () => openHero(h.name)
    }));

    // itens da loja
    const g = dadosJogo();
    if (g && g.itens) Object.keys(g.itens).forEach(id => {
        const it = g.itens[id];
        itens.push({
            tipo: 'Item', nome: it.n, icone: 'fa-shield-halved',
            sub: (ITEM_TIPO_NOME[it.s] || 'Item') + (it.c ? ' · ' + money(it.c) + ' almas' : ''),
            chave: [it.n, it.en, it.d, it.s].join(' '), abrir: () => openItem(id)
        });
    });

    // notícias, guias e builds
    const noticias = [];
    (typeof STEAM_ARTICLES !== 'undefined' ? STEAM_ARTICLES : []).concat(NEWS).forEach(a => {
        if (!noticias.some(x => x.id === a.id)) noticias.push(a);
    });
    noticias.forEach(a => itens.push({
        tipo: 'Notícia', nome: tituloPT(a), sub: a.date || '', icone: 'fa-newspaper',
        chave: [tituloPT(a), a.title, a.desc, a.cat].join(' '), abrir: () => openArticle(a.id)
    }));
    GUIDES.forEach(a => itens.push({
        tipo: 'Guia', nome: tituloPT(a), sub: a.desc || '', icone: 'fa-book-open',
        chave: [tituloPT(a), a.title, a.desc].join(' '), abrir: () => openArticle(a.id)
    }));
    BUILDS.forEach(a => itens.push({
        tipo: 'Build', nome: tituloPT(a), sub: a.desc || '', icone: 'fa-cubes',
        chave: [tituloPT(a), a.title, a.desc,
            (a.items || []).map(x => x[0]).join(' '),
            (a.builds || []).map(b => b.nome + ' ' + itensDaBuildNomes(b.itens)).join(' ')].join(' '),
        abrir: () => openArticle(a.id)
    }));

    // glossário (lido da própria lista da tela, então nunca sai de sincronia)
    $$('#glossList .glossary-item').forEach(el => {
        const titulo = el.querySelector('h3');
        if (!titulo) return;
        const nome = titulo.textContent.trim();
        const texto = el.querySelector('p');
        itens.push({
            tipo: 'Glossário', nome: nome, sub: (texto ? texto.textContent : '').slice(0, 80), icone: 'fa-book',
            chave: nome + ' ' + (texto ? texto.textContent : ''),
            abrir: () => { showSection('glossario'); setTimeout(() => destacarGlossario(nome), 60); }
        });
    });

    buscaIndice = itens;
    return itens;
}

function destacarGlossario(nome) {
    const el = $$('#glossList .glossary-item').find(x => {
        const t = x.querySelector('h3');
        return t && t.textContent.trim() === nome;
    });
    if (!el) return;
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    el.classList.add('gloss-destaque');
    setTimeout(() => el.classList.remove('gloss-destaque'), 2600);
}

function pontuarBusca(item, termo) {
    const nome = semAcento(item.nome);
    if (nome === termo) return 100;
    if (nome.indexOf(termo) === 0) return 80;
    if (nome.split(/[\s(–-]+/).some(p => p.indexOf(termo) === 0)) return 65;
    if (nome.includes(termo)) return 50;
    if (semAcento(item.chave).includes(termo)) return 20;
    return 0;
}

function marcarTermo(texto, termo) {
    if (!termo) return esc(texto);
    const i = semAcento(texto).indexOf(termo);
    if (i < 0) return esc(texto);
    return esc(texto.slice(0, i)) + '<mark>' + esc(texto.slice(i, i + termo.length)) + '</mark>' + esc(texto.slice(i + termo.length));
}

function botaoBusca(item, termo, i) {
    return '<button type="button" class="busca-item" data-i="' + i + '">' +
        '<span class="busca-ico">' + (item.img
            ? '<img src="' + esc(item.img) + '" alt="" loading="lazy">'
            : '<i class="fa-solid ' + item.icone + '"></i>') + '</span>' +
        '<span class="busca-txt"><b>' + marcarTermo(item.nome, termo) + '</b><small>' + esc(item.sub) + '</small></span>' +
        '<span class="busca-tipo">' + esc(item.tipo) + '</span></button>';
}

function renderBusca(termo) {
    const lista = $('#buscaLista');
    if (!lista) return;
    const t = semAcento(termo).trim();

    if (!t) {
        buscaAchados = indiceBusca().filter(x => x.tipo === 'Tela');
        lista.innerHTML = '<div class="busca-sec">Telas do site</div>' + buscaAchados.map((x, i) => botaoBusca(x, '', i)).join('');
    } else {
        buscaAchados = indiceBusca()
            .map(x => ({ x: x, p: pontuarBusca(x, t) }))
            .filter(r => r.p > 0)
            .sort((a, b) => b.p - a.p || a.x.nome.length - b.x.nome.length)
            .slice(0, 30)
            .map(r => r.x);
        lista.innerHTML = buscaAchados.length
            ? '<div class="busca-sec">' + buscaAchados.length + ' resultado' + (buscaAchados.length > 1 ? 's' : '') + '</div>' +
              buscaAchados.map((x, i) => botaoBusca(x, t, i)).join('')
            : '<div class="busca-vazio"><i class="fa-regular fa-face-frown"></i>Nada encontrado para "<b>' + esc(termo) + '</b>".<br>Tente o nome de um herói, de um item ou um termo do glossário.</div>';
    }
    buscaEscolha = 0;
    pintarBusca();
}

function pintarBusca() {
    const botoes = $$('#buscaLista .busca-item');
    botoes.forEach((b, i) => b.classList.toggle('on', i === buscaEscolha));
    if (botoes[buscaEscolha]) botoes[buscaEscolha].scrollIntoView({ block: 'nearest' });
}

function escolherBusca(i) {
    const item = buscaAchados[i];
    if (!item) return;
    fecharBusca();
    setTimeout(() => item.abrir(), 90);
}

function abrirBusca() {
    const modal = $('#buscaModal');
    if (!modal) return;
    const campo = $('#buscaCampo');
    if (campo) campo.value = '';
    renderBusca('');
    openOverlay(modal);
    if (campo) setTimeout(() => campo.focus(), 40);
}

function fecharBusca() {
    const modal = $('#buscaModal');
    if (modal) closeOverlay(modal);
}

function initBusca() {
    const modal = $('#buscaModal');
    const campo = $('#buscaCampo');
    const lista = $('#buscaLista');
    if (!modal || !campo || !lista) return;

    $$('[data-busca]').forEach(b => b.addEventListener('click', (e) => { e.preventDefault(); abrirBusca(); }));

    campo.addEventListener('input', () => renderBusca(campo.value));
    campo.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); buscaEscolha = Math.min(buscaAchados.length - 1, buscaEscolha + 1); pintarBusca(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); buscaEscolha = Math.max(0, buscaEscolha - 1); pintarBusca(); }
        else if (e.key === 'Enter') { e.preventDefault(); escolherBusca(buscaEscolha); }
        else if (e.key === 'Escape') { e.preventDefault(); fecharBusca(); }
    });

    lista.addEventListener('click', (e) => {
        const b = e.target.closest('.busca-item');
        if (b) escolherBusca(Number(b.dataset.i));
    });

    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && semAcento(e.key) === 'k') { e.preventDefault(); abrirBusca(); return; }
        if (e.key === 'Escape' && modal.classList.contains('show')) fecharBusca();
    });

    // veio de outra página pelo link "Buscar no site" (index.html#buscar)
    if (location.hash === '#buscar') {
        abrirBusca();
        if (history.replaceState) history.replaceState(null, '', location.pathname + location.search);
    }
}

/* ================= navegação ================= */
function showSection(id) {
    const target = document.getElementById(id);
    if (!target || !target.classList.contains('section')) return;
    $$('.section').forEach(s => s.classList.toggle('active', s.id === id));
    $$('.nav-item[data-section]').forEach(n => n.classList.toggle('active', n.getAttribute('data-section') === id));
    if (!stats.visited[id]) { stats.visited[id] = 1; saveStats(); }
    window.scrollTo({ top: 0, behavior: 'auto' });
    if (id === 'favoritos') renderFavs();
    if (id === 'perfil') renderProfileUI();
}

/* ================= voltar ao topo ================= */
function initToTop() {
    const btn = $('#toTop');
    if (!btn) return;
    const checar = () => btn.classList.toggle('show', window.scrollY > 500);
    window.addEventListener('scroll', checar, { passive: true });
    window.addEventListener('resize', checar);
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    checar();
}

/* ================= compartilhamento (og:image) ================= */
function fixShareMeta() {
    // quando o site estiver publicado (http/https), aponta as URLs de
    // compartilhamento para o endereço real, seja qual for o domínio.
    if (!/^https?:/.test(location.protocol)) return;
    const base = location.href.split('#')[0].split('?')[0].replace(/index\.html$/, '');
    const trocar = (sel, valor) => { const m = document.querySelector(sel); if (m) m.setAttribute('content', valor); };
    trocar('meta[property="og:url"]', base);
    trocar('meta[property="og:image"]', base + 'assets/brand/share.jpg');
    trocar('meta[name="twitter:image"]', base + 'assets/brand/share.jpg');
}

function initSections() {
    const sidebar = $('#sidebar');
    const overlay = $('#sidebarOverlay');
    const closeSidebar = () => { sidebar.classList.remove('open'); overlay.classList.remove('show'); document.body.style.overflow = ''; };

    document.addEventListener('click', (e) => {
        const el = e.target.closest('[data-section],[data-goto]');
        if (!el) return;
        e.preventDefault();
        showSection(el.dataset.section || el.dataset.goto);
        closeSidebar();
    });

    $('#menuBurger').addEventListener('click', () => { sidebar.classList.add('open'); overlay.classList.add('show'); });
    $('#closeSidebar').addEventListener('click', closeSidebar);
    overlay.addEventListener('click', closeSidebar);
    $('#userChip').addEventListener('click', () => showSection('perfil'));
    $('#btnProfileTop').addEventListener('click', () => showSection('perfil'));
    $('#btnDownload').addEventListener('click', () => { openOverlay($('#downloadModal')); });

    // marca "coruja" se estiver de madrugada
    const h = new Date().getHours();
    if (h >= 0 && h < 5) { stats.night = 1; saveStats(); }

    const hash = window.location.hash.replace('#', '');
    if (hash && document.getElementById(hash) && document.getElementById(hash).classList.contains('section')) {
        showSection(hash);
    } else {
        showSection('home');
    }
}

/* ================= estandartes ================= */
function pennant(hero, w) {
    const file = 'assets/heroes/' + hero.file;
    const words = hero.name.split(/\s+/).reduce((a, t) => { if (t === '&' && a.length) a[a.length - 1] += ' &'; else a.push(t); return a; }, []);
    const soon = hero.soon ? '<div class="pen-soon">EM BREVE</div>' : '';
    return `<div class="pen" style="--w:${w}px">
        <div class="pen-in">
            <div class="pen-ph"><span>${esc(initials(hero.name))}</span></div>
            <img class="pen-img" src="${file}" alt="${esc(hero.name)}" loading="lazy" onerror="this.remove()">
            ${soon}
            <div class="pen-name">${words.map(t => `<span>${esc(t)}</span>`).join(' ')}</div>
        </div>
    </div>`;
}

/* mostra "< 0,1%" quando o número é pequeno demais (senão fica "0%") */
function pickTxt(p) {
    const n = +p;
    return (isFinite(n) && n < 0.1) ? '< 0,1%' : p + '%';
}

function heroCard(hero, w) {
    const tags = hero.soon
        ? '<span class="tag vio">Em breve</span>'
        : `<span class="tag">${esc(hero.role)}</span><span class="tag ${tierClass(hero.tier)}">Tier ${hero.tier}</span>`;
    return `<article class="hc" data-hero="${esc(hero.name)}" title="${esc(hero.name)}">
        <div class="hc-pen">
            ${pennant(hero, w)}
            <button class="fav ${favs.includes(hero.name) ? 'on' : ''}" data-fav="${esc(hero.name)}" title="Favoritar">★</button>
        </div>
        <div class="hc-tags">${tags}</div>
    </article>`;
}

/* ================= heróis ================= */
let heroFilter = { q: '', role: 'Todos', sort: 'az' };

function initHeroes() {
    const grid = $('#heroesGrid');
    const search = $('#heroSearch');
    const sort = $('#heroSort');
    const rolesRow = $('#rolesRow');
    const subtitle = $('#heroSubtitle');

    subtitle.textContent = `${HEROES.length} heróis de Deadlock. Clique em um para ver os detalhes.`;

    const counts = { Todos: HEROES.length };
    ROLES.forEach(r => counts[r] = HEROES.filter(h => h.role === r).length);
    rolesRow.innerHTML = ['Todos', ...ROLES].map(r =>
        `<button class="pill ${r === heroFilter.role ? 'on' : ''}" data-role="${r}">${r} <small>${counts[r] || 0}</small></button>`
    ).join('');

    function render() {
        const term = heroFilter.q.trim().toLowerCase();
        const order = { az: 1, za: -1 }[heroFilter.sort] || 0;
        const idx = { S: 0, A: 1, B: 2, C: 3, D: 4 };

        let list = HEROES.filter(h => {
            const okRole = heroFilter.role === 'Todos' || h.role === heroFilter.role;
            const okTerm = !term || h.name.toLowerCase().includes(term);
            return okRole && okTerm;
        });
        // heróis "em breve" sempre no fim
        list.sort((a, b) => (a.soon - b.soon) || a.name.localeCompare(b.name));
        if (heroFilter.sort === 'za') list.sort((a, b) => (a.soon - b.soon) || b.name.localeCompare(a.name));
        else if (heroFilter.sort === 'tier') list.sort((a, b) => (a.soon - b.soon) || idx[a.tier] - idx[b.tier] || a.name.localeCompare(b.name));
        else if (heroFilter.sort === 'win') list.sort((a, b) => (a.soon - b.soon) || (+b.win) - (+a.win) || a.name.localeCompare(b.name));
        else if (heroFilter.sort === 'fav') list.sort((a, b) => (a.soon - b.soon) || (favs.includes(b.name) - favs.includes(a.name)) || a.name.localeCompare(b.name));

        grid.innerHTML = list.length
            ? list.map(h => heroCard(h, 138)).join('')
            : '<p style="color:var(--text-faint);grid-column:1/-1;text-align:center;padding:40px 0;">Nenhum herói encontrado.</p>';
    }

    search.addEventListener('input', e => { heroFilter.q = e.target.value; render(); });
    sort.addEventListener('change', e => { heroFilter.sort = e.target.value; render(); });
    rolesRow.addEventListener('click', e => {
        const b = e.target.closest('[data-role]'); if (!b) return;
        heroFilter.role = b.dataset.role;
        $$('.pill', rolesRow).forEach(p => p.classList.toggle('on', p === b));
        render();
    });
    $('#btnFilter').addEventListener('click', () => $('#filtersBar').classList.toggle('show'));

    // clique no card / favoritar (delegação global, cobre todas as grades)
    document.addEventListener('click', (e) => {
        const fav = e.target.closest('[data-fav]');
        if (fav) { e.preventDefault(); e.stopPropagation(); toggleFav(fav.dataset.fav); return; }
        const card = e.target.closest('.hc[data-hero]');
        if (card) { openHero(card.dataset.hero); }
    });

    render();
}

function toggleFav(name) {
    favs = favs.includes(name) ? favs.filter(x => x !== name) : [...favs, name];
    store.set('cdl_favs', favs);
    $$(`[data-fav="${CSS.escape(name)}"]`).forEach(b => b.classList.toggle('on', favs.includes(name)));
    if ($('#favoritos').classList.contains('active')) renderFavs();
    renderProfileUI();
    showToast(favs.includes(name) ? name + ' adicionado aos favoritos ★' : name + ' removido dos favoritos');
}

function renderFavs() {
    const grid = $('#favGrid');
    const list = favs.map(heroByName).filter(Boolean);
    grid.innerHTML = list.length
        ? list.map(h => heroCard(h, 138)).join('')
        : '<p style="color:var(--text-faint);grid-column:1/-1;text-align:center;padding:40px 0;">Você ainda não favoritou nenhum herói. Clique na ★ de um estandarte.</p>';
}

/* ================= modal de herói ================= */
let heroTab = 'visao';
let heroCurrent = null;

const BUILD_PRESETS = {
    'Tanque': [['Pele Resistente', 500], ['Fôlego Extra', 500], ['Bateria de Vida', 1250], ['Escudo Pulsante', 3000], ['Colosso', 6200]],
    'Suporte': [['Foco Mental', 500], ['Eco Arcano', 1250], ['Surto de Energia', 1250], ['Ruptura Espiritual', 3000], ['Ápice Arcano', 6200]],
    'Carry': [['Munição Reforçada', 500], ['Disparo Rápido', 500], ['Cano Longo', 1250], ['Rajada Perfurante', 3000], ['Frenesi de Combate', 6200]],
    'Controle': [['Foco Mental', 500], ['Eco Arcano', 1250], ['Escudo Pulsante', 3000], ['Ruptura Espiritual', 3000], ['Ápice Arcano', 6200]],
    'Assassino': [['Munição Reforçada', 500], ['Disparo Rápido', 500], ['Pente Estendido', 1250], ['Rajada Perfurante', 3000], ['Frenesi de Combate', 6200]]
};

function openHero(name) {
    const h = heroByName(name); if (!h) return;
    heroCurrent = h;
    if (!stats.heroesSeen.includes(name)) { stats.heroesSeen.push(name); saveStats(); }
    heroTab = 'visao';
    renderHeroModal();
    openOverlay($('#heroModal'));
}

function miniHero(h) {
    return `<a class="hp-rel" href="#" data-hero-link="${esc(h.name)}">
        <img src="assets/heroes/${h.file}" alt="" onerror="this.remove()">
        <span>${esc(h.name)}</span><span class="tag">${esc(h.role)}</span></a>`;
}

function renderHeroModal() {
    const h = heroCurrent;
    const n = PLAYABLE.length;
    const strong = [3, 7, 11].map(k => PLAYABLE[(h.idx + k) % n]).filter(Boolean);
    const weak = [5, 9, 14].map(k => PLAYABLE[(h.idx + k) % n]).filter(Boolean);
    const rel = HEROES.filter(x => x.role === h.role && x.name !== h.name).slice(0, 4);
    const preset = h.role === 'Tanque' ? 'Tanque' : (h.role === 'Suporte' || h.role === 'Controle') ? (h.role === 'Controle' ? 'Controle' : 'Suporte') : h.role === 'Carry' ? 'Carry' : 'Assassino';
    const pick = BUILD_PRESETS[preset] || BUILD_PRESETS.Assassino;

    // ---- dados reais do jogo para este herói ----
    const g = dadosJogo();
    const apiId = (g && g.ids) ? g.ids[h.name] : null;
    const chave = apiId == null ? null : String(apiId);
    const buildsReais = (g && g.builds && chave) ? g.builds[chave] : null;
    const contReais = (g && g.contadores && chave) ? g.contadores[chave] : null;
    const banRate = (g && g.ban && chave) ? g.ban[chave] : null;
    const banPos = (g && g.banPos && chave) ? g.banPos[chave] : null;

    const bar = (label, val, max, unit = '', txt = null) =>
        `<div class="statline">${label}: <b>${txt != null ? txt : val + unit}</b></div><div class="bar"><i style="width:${Math.max(4, Math.min(100, val / max * 100))}%"></i></div>`;

    const tabVisao = h.soon
        ? `<p>${esc(h.desc)}</p><div class="hp-tags" style="justify-content:flex-start;margin-top:14px"><span class="tag vio">Em breve</span></div>
           <p style="margin-top:14px;color:var(--text-soft)">Estatísticas, habilidades e builds entram aqui depois do lançamento.</p>`
        : `<p>${esc(h.desc)}</p>
           <div class="hp-tags" style="justify-content:flex-start;margin:14px 0">
             <span class="tag">${esc(h.role)}</span>
             ${h.arch !== '—' ? `<span class="tag vio">${esc(h.arch)}</span>` : ''}
             <span class="tag cy">Aprender: ${DIFF_LABEL[h.diff]}</span>
             <span class="tag cy">Masterizar: ${DIFF_LABEL[h.dominio || h.diff]}</span>
             <span class="tag ${tierClass(h.tier)}">Tier ${h.tier}</span>
           </div>
           <h2 class="pform-sec" style="margin-top:20px">Atributos base</h2>
           ${bar('Vida', h.hp, 1000)}
           ${bar('Velocidade', h.spd, 10, ' m/s')}
           <h2 class="pform-sec" style="margin-top:20px">${h.real ? 'Estatísticas reais' : 'Estatísticas (exemplo)'}</h2>
           ${bar('Win rate', +h.win, 70, '%')}
           ${bar('Pick rate', +h.pick, 20, '%', pickTxt(h.pick))}
           ${h.real ? bar('KDA', +h.kda, 5, '') : ''}
           ${banRate != null ? `<div class="statline">Taxa de banimento: <b>${banRate}%</b> <span class="txt-faint">${banPos ? '(' + banPos + 'º mais banido do jogo)' : ''}</span></div>` : ''}
           ${h.real
                ? `<p class="stat-fonte"><i class="fa-solid fa-chart-simple"></i> ${money(h.partidas)} partidas analisadas · ${h.posicao}º melhor win rate do jogo. Fonte: deadlock-api.com</p>`
                : ''}
           ${h.real && serieHistorico(h.name) ? `<h2 class="pform-sec" style="margin-top:22px">Histórico de win rate</h2>${sparklineHTML(h.name)}` : ''}`;

    const tabHab = h.soon
        ? '<p style="color:var(--text-soft)">Habilidades disponíveis após o lançamento.</p>'
        : `<p class="sec-note">Nomes traduzidos para o português — o nome original em inglês aparece em cinza embaixo. Recargas sujeitas a mudanças.</p>`
          + h.skills.map(s => {
              const temEn = s.name_en && s.name_en !== s.name;
              return `<div class="skill"><div class="k">${esc(s.key)}</div><div style="flex:1">
               <div class="sname"><b>${esc(s.name)}</b>
                 ${temEn ? `<span class="s-en">${esc(s.name_en)}</span>` : ''}
                 ${s.key === '★' ? '<span class="tag acc">Suprema</span>' : ''}
                 ${s.passive ? '<span class="tag">Passiva</span>' : ''}
                 ${s.cd != null ? `<span class="tag cy">Recarga ${s.cd}s</span>` : ''}
               </div>
               <div class="sdesc">${esc(s.desc)}</div></div></div>`;
          }).join('');

    const buildItemHTML = id => {
        const it = itemDe(id);
        if (!it) return '';
        return `<button type="button" class="build-item" data-item="${esc(id)}" title="${esc(it.n)}${it.c ? ' — ' + money(it.c) + ' almas' : ''}">
            ${it.i ? `<img src="${esc(it.i)}" alt="" loading="lazy" onerror="this.remove()">` : ''}
            <em>${esc(it.n)}</em></button>`;
    };
    const tabBuild = h.soon
        ? '<p style="color:var(--text-soft)">Sugestões de build após o lançamento.</p>'
        : (buildsReais && buildsReais.length)
            ? `<p class="sec-note">As ${buildsReais.length} builds mais usadas por quem joga de ${esc(h.name)}, com o win rate real de cada uma. Clique em um item para ver os detalhes.</p>`
              + buildsReais.map((b, i) => `<div class="build-card">
                  <div class="build-head">
                      <b>${i === 0 ? '🏆 ' : ''}${esc(b.n)}</b>
                      <span class="build-wr">${b.win}% de vitória</span>
                  </div>
                  <small>${money(b.m)} partidas registradas com esta build</small>
                  <div class="build-itens">${b.i.map(buildItemHTML).join('')}</div>
              </div>`).join('')
              + `<p class="stat-fonte"><i class="fa-solid fa-screwdriver-wrench"></i> Builds publicadas pela comunidade dentro do próprio jogo. Fonte: deadlock-api.com</p>`
            : `<p class="sec-note">Ainda não temos builds reais deste herói. Sugestão de exemplo:</p>`
              + pick.map(([nm, cost]) => `<div class="item-row"><span>${esc(nm)}</span><span class="cost">${money(cost)}</span></div>`).join('');

    const contadorHTML = ([inimigoId, win, partidas], ruim) => {
        const outro = heroiPorApiId(inimigoId);
        if (!outro) return '';
        return `<a class="hp-rel contador" href="#" data-hero-link="${esc(outro.name)}" title="${money(partidas)} partidas contra ${esc(outro.name)}">
            <img src="assets/heroes/${esc(outro.file)}" alt="" onerror="this.remove()">
            <span>${esc(outro.name)}</span><span class="tag ${ruim ? 'vio' : 'cy'}">${win}%</span></a>`;
    };
    const tabMatch = h.soon
        ? '<p style="color:var(--text-soft)">Confrontos disponíveis após o lançamento.</p>'
        : (contReais && (contReais.bons.length || contReais.ruins.length))
            ? `<div class="matchup">
                 <div><h2 class="pform-sec">Vai bem contra</h2>${contReais.bons.map(c => contadorHTML(c, false)).join('') || '<p class="muted-txt">Sem dados suficientes.</p>'}</div>
                 <div><h2 class="pform-sec">Sofre contra</h2>${contReais.ruins.map(c => contadorHTML(c, true)).join('') || '<p class="muted-txt">Sem dados suficientes.</p>'}</div>
               </div>
               <p class="stat-fonte"><i class="fa-solid fa-chart-simple"></i> Win rate real de ${esc(h.name)} contra cada inimigo, com no mínimo 400 partidas. Fonte: deadlock-api.com</p>`
            : `<div class="matchup">
                 <div><h2 class="pform-sec">Vai bem contra</h2>${strong.map(miniHero).join('')}</div>
                 <div><h2 class="pform-sec">Sofre contra</h2>${weak.map(miniHero).join('')}</div>
               </div>
               <p style="color:var(--text-faint);font-size:12.5px;margin-top:12px">Ainda não temos confrontos reais deste herói.</p>`;

    const body = { visao: tabVisao, hab: tabHab, build: tabBuild, match: tabMatch }[heroTab];

    $('#heroModalBox').innerHTML = `
        <button class="modal-close" data-close="heroModal" aria-label="Fechar"><i class="fa-solid fa-xmark"></i></button>
        <div class="hp">
            <aside class="hp-side">
                <div class="hp-pen">${pennant(h, 190)}</div>
                <h1>${esc(h.name)}</h1>
                <p class="hp-role">${h.soon ? 'Em breve' : esc(h.role) + (h.arch !== '—' ? ' · ' + esc(h.arch) : '')}</p>
                <div class="hp-tags">
                    ${h.soon ? '' : `<span class="tag ${tierClass(h.tier)}">Tier ${h.tier}</span><span class="tag cy">Aprender: ${DIFF_LABEL[h.diff]}</span><span class="tag cy">Masterizar: ${DIFF_LABEL[h.dominio || h.diff]}</span>`}
                </div>
                <button class="btn ${favs.includes(h.name) ? 'btn-lime' : 'btn-dark'} btn-block" data-favtoggle="${esc(h.name)}">
                    ${favs.includes(h.name) ? '★ Favorito' : '☆ Favoritar'}
                </button>
                ${h.soon ? '' : `<a class="btn btn-dark btn-block" href="heroi/${esc(slugJS(h.name))}.html" style="margin-top:8px"><i class="fa-solid fa-up-right-from-square"></i> Página completa</a>`}
                ${rel.length ? `<div class="hp-parecidos"><small>PARECIDOS</small>${rel.map(miniHero).join('')}</div>` : ''}
            </aside>
            <section>
                <div class="htabs">
                    ${[['visao', 'Visão geral'], ['hab', 'Habilidades'], ['build', 'Build'], ['match', 'Confrontos']]
            .map(([k, l]) => `<button data-tab="${k}" class="${heroTab === k ? 'on' : ''}">${l}</button>`).join('')}
                </div>
                <div>${body}</div>
            </section>
        </div>`;

    // bindings do modal
    $$('#heroModalBox [data-tab]').forEach(b => b.addEventListener('click', () => { heroTab = b.dataset.tab; renderHeroModal(); }));
    const ft = $('#heroModalBox [data-favtoggle]');
    if (ft) ft.addEventListener('click', () => { toggleFav(ft.dataset.favtoggle); renderHeroModal(); });
    $$('#heroModalBox [data-hero-link]').forEach(a => a.addEventListener('click', (e) => { e.preventDefault(); openHero(a.dataset.heroLink); }));
}

/* ================= notícias automáticas (Steam) =================
   O arquivo data/steam-news.js é gerado pelo script tools/update-news.py
   (ou pelo GitHub Actions, todo dia). Se ele não existir, o site usa as
   notícias fixas do array NEWS acima. */
const STEAM_POOL = ['McGinnis.png', 'Vindicta.png', 'Kelvin.png', 'Holliday.png', 'Shiv.png',
    'Abrams.png', 'Pocket.png', 'Ivy.png', 'Sinclair.png', 'Vyper.png'];

function steamHeroImg(texto, i) {
    const t = ' ' + String(texto || '').toLowerCase() + ' ';
    const nomes = HEROES.map(h => h.name).sort((a, b) => b.length - a.length);
    for (const nome of nomes) {
        const alvo = nome.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (new RegExp('\\b' + alvo + '\\b').test(t)) return heroByName(nome).file;
        const curto = alvo.split(/\s+/)[0];
        if (curto.length >= 4 && new RegExp('\\b' + curto + '\\b').test(t)) return heroByName(nome).file;
    }
    return STEAM_POOL[i % STEAM_POOL.length];
}

function buildSteamArticles() {
    const pack = window.STEAM_NEWS;
    if (!pack || !Array.isArray(pack.items) || !pack.items.length) return [];
    return pack.items.map((n, i) => ({
        id: n.id,
        cat: n.cat || 'Steam',
        title: n.title,
        titlePT: n.title_pt || '',       // título traduzido (tools/update-news.py)
        descPT: n.desc_pt || '',         // resumo traduzido
        imgHero: steamHeroImg(n.title + ' ' + (n.lines || []).slice(0, 6).join(' '), i),
        imgSteam: n.image || '',         // imagem oficial publicada pela Valve
        date: n.date,
        ts: Number(n.ts) || 0,           // data de publicação em segundos (data real)
        desc: n.desc,
        body: (n.lines || []).slice(0, 80),
        bodyPT: (n.lines_pt || []).slice(0, 80),   // texto completo traduzido
        url: n.url,
        patch: !!n.patch,
        steam: true
    }));
}

/* imagem de um card de notícia: usa a oficial da Valve quando existe e,
   se ela falhar, cai para a arte do herói citado na notícia. */
function cardImg(a, cls = '') {
    const reserva = 'assets/heroes/' + (a.imgHero || a.img);
    const src = a.imgSteam || reserva;
    return `<img src="${esc(src)}" alt=""${cls ? ` class="${cls}"` : ''} loading="lazy" onerror="this.onerror=null;this.src='${reserva}'">`;
}

/* título do card: em português quando a tradução existir */
function tituloPT(a) { return a.titlePT || a.title; }

/* card de notícia (usado na Home e na aba Notícias)
   O título é um link de verdade para a página da notícia — assim o Google
   encontra o conteúdo. Clicando, o site abre a janela bonita no lugar. */
function newsCardHTML(a) {
    const pt = !!a.titlePT;
    return `<article class="news-card" data-article="${a.id}">
        ${cardImg(a)}
        <div class="news-body">
            <span class="news-cat">${esc(a.cat)}${pt ? ' <span class="pt-tag" title="Traduzido automaticamente do inglês"><i class="fa-solid fa-language"></i> PT</span>' : ''}</span>
            <h3 class="news-title"><a href="noticia/${esc(a.id)}.html">${esc(tituloPT(a))}</a></h3>
            <p class="news-desc">${esc(a.descPT || a.desc)}</p>
            <span class="news-date">${esc(a.date)}</span>
            <span class="news-more">Ler matéria <i class="fa-solid fa-arrow-right"></i></span>
        </div>
    </article>`;
}

const STEAM_ARTICLES = buildSteamArticles();

/* ================= guias (um cartão para cada herói) =================
   A lista vem do data/guias.js (gerado sozinho). Aqui só montamos os
   cartões e deixamos filtrar por nome, papel ou tier — são 43 guias. */
let guiaPapel = 'Todos';

/* Cartão usado pelos Guias e pelas Builds (mesma cara, muda só a etiqueta). */
function cartaoHeroiHTML(a, rotulo) {
    const titulo = a.heroPage
        ? `<a href="${esc(a.heroPage)}">${esc(a.title)}</a>`
        : esc(a.title);
    const tier = a.tier ? `<em class="guia-tier t-${esc(String(a.tier).toLowerCase())}" title="Tier de hoje, calculada com partidas de verdade">${esc(a.tier)}</em>` : '';
    return `<article class="guide-card" data-article="${a.id}">
        <div class="guide-head"><img src="assets/heroes/${esc(a.img)}" alt="" loading="lazy"><span>${esc(a.cat)}</span>${tier}</div>
        <h3 class="news-title">${titulo}</h3>
        <p class="news-desc">${esc(a.desc)}</p>
        <span class="news-more">${rotulo} <i class="fa-solid fa-arrow-right"></i></span>
    </article>`;
}

function guiaCardHTML(a) { return cartaoHeroiHTML(a, 'Ler guia'); }

function guiasFiltrados() {
    const campo = $('#guiasBusca');
    const termo = semAcento(campo ? campo.value.trim() : '');
    return GUIDES.filter(a => {
        if (guiaPapel !== 'Todos' && a.role !== guiaPapel) return false;
        if (!termo) return true;
        return semAcento(a.title).indexOf(termo) >= 0
            || semAcento(a.role).indexOf(termo) >= 0
            || semAcento(a.tier).indexOf(termo) >= 0;
    });
}

function pintarGuias() {
    const grade = $('#guidesGrid');
    if (!grade) return;
    const lista = guiasFiltrados();
    grade.innerHTML = lista.length
        ? lista.map(a => guiaCardHTML(a)).join('')
        : '<p class="items-count">Nenhum guia encontrado com esse filtro. Tente o nome do herói.</p>';
    const contador = $('#guiasCount');
    if (contador) {
        contador.textContent = (lista.length === GUIDES.length)
            ? `${GUIDES.length} guias — um para cada herói, com números reais`
            : `${lista.length} de ${GUIDES.length} guias`;
    }
}

function initGuias() {
    const campo = $('#guiasBusca');
    const caixa = $('#guiasPapeis');
    if (caixa) {
        const papeis = ['Todos'].concat([...new Set(GUIDES.map(a => a.role).filter(Boolean))]);
        caixa.innerHTML = papeis.map(p => `<button type="button" class="pill ${p === 'Todos' ? 'on' : ''}" data-guiapapel="${esc(p)}">${esc(p)}</button>`).join('');
        caixa.addEventListener('click', (ev) => {
            const b = ev.target.closest('[data-guiapapel]');
            if (!b) return;
            guiaPapel = b.dataset.guiapapel;
            $$('[data-guiapapel]', caixa).forEach(x => x.classList.toggle('on', x === b));
            pintarGuias();
        });
    }
    if (campo) campo.addEventListener('input', pintarGuias);
    pintarGuias();
}

/* ================= builds (as mais usadas de cada herói) =================
   A lista vem do data/builds.js (gerado sozinho com os dados das partidas).
   Aqui só montamos os cartões e deixamos filtrar por nome, papel ou tier. */
let buildPapel = 'Todos';

function buildCardHTML(a) { return cartaoHeroiHTML(a, 'Ver build'); }

function buildsFiltrados() {
    const campo = $('#buildsBusca');
    const termo = semAcento(campo ? campo.value.trim() : '');
    return BUILDS.filter(a => {
        if (buildPapel !== 'Todos' && a.role !== buildPapel) return false;
        if (!termo) return true;
        return semAcento(a.title).indexOf(termo) >= 0
            || semAcento(a.role).indexOf(termo) >= 0
            || semAcento(a.tier).indexOf(termo) >= 0;
    });
}

function pintarBuilds() {
    const grade = $('#buildsGrid');
    if (!grade) return;
    const lista = buildsFiltrados();
    grade.innerHTML = lista.length
        ? lista.map(a => buildCardHTML(a)).join('')
        : '<p class="items-count">Nenhuma build encontrada com esse filtro. Tente o nome do herói.</p>';
    const contador = $('#buildsCount');
    if (contador) {
        contador.textContent = (lista.length === BUILDS.length)
            ? `${BUILDS.length} heróis com as builds mais usadas nas partidas`
            : `${lista.length} de ${BUILDS.length} heróis`;
    }
}

function initBuilds() {
    const campo = $('#buildsBusca');
    const caixa = $('#buildsPapeis');
    if (caixa) {
        const papeis = ['Todos'].concat([...new Set(BUILDS.map(a => a.role).filter(Boolean))]);
        caixa.innerHTML = papeis.map(p => `<button type="button" class="pill ${p === 'Todos' ? 'on' : ''}" data-buildpapel="${esc(p)}">${esc(p)}</button>`).join('');
        caixa.addEventListener('click', (ev) => {
            const b = ev.target.closest('[data-buildpapel]');
            if (!b) return;
            buildPapel = b.dataset.buildpapel;
            $$('[data-buildpapel]', caixa).forEach(x => x.classList.toggle('on', x === b));
            pintarBuilds();
        });
    }
    if (campo) campo.addEventListener('input', pintarBuilds);
    pintarBuilds();
}

/* ================= conteúdos clicáveis ================= */
function initContents() {
    const cardHTML = (a, type) => {
        if (type === 'guide' || type === 'build') {
            const label = type === 'build' ? 'Ver build' : 'Ler guia';
            return `<article class="guide-card" data-article="${a.id}">
                <div class="guide-head"><img src="assets/heroes/${a.img}" alt=""><span>${esc(a.cat)}</span></div>
                <h3 class="news-title">${esc(a.title)}</h3>
                <p class="news-desc">${esc(a.desc)}</p>
                <span class="news-more">${label} <i class="fa-solid fa-arrow-right"></i></span>
            </article>`;
        }
        return newsCardHTML(a);
    };

    // ---- atalhos para as ferramentas reais do site ----
    // Nada de artigo inventado: aqui só existem caminhos para o que o site
    // tem de verdade (comparador, itens, mira, glossário, esports, ranking).
    const atalhos = [
        { goto: 'comparar', icone: 'fa-right-left', titulo: 'Comparar heróis', desc: 'Escolha dois heróis e veja as diferenças lado a lado.' },
        { goto: 'itens', icone: 'fa-gem', titulo: 'Itens do jogo', desc: 'Preço e efeito reais de todos os itens da loja.' },
        { goto: 'mira', icone: 'fa-crosshairs', titulo: 'Minha Mira', desc: 'Cole o seu código DL. e veja a mira desenhada na hora.' },
        { goto: 'glossario', icone: 'fa-list', titulo: 'Glossário', desc: 'Os termos do jogo explicados em português.' },
        { goto: 'esports', icone: 'fa-trophy', titulo: 'Esports', desc: 'Os torneios de Deadlock e quem está ganhando.' },
        { goto: 'ranking', icone: 'fa-ranking-star', titulo: 'Ranking', desc: 'Os melhores jogadores de cada região, direto do jogo.' }
    ];
    const gradeHome = $('#homeGrid');
    if (gradeHome) {
        gradeHome.innerHTML = atalhos.map(a => `<button type="button" class="atalho-card" data-goto="${a.goto}">
            <span class="atalho-ico"><i class="fa-solid ${a.icone}"></i></span>
            <span class="news-title">${esc(a.titulo)}</span>
            <span class="news-desc">${esc(a.desc)}</span>
            <span class="news-more">Abrir <i class="fa-solid fa-arrow-right"></i></span>
        </button>`).join('');
    }
    const listaNoticias = STEAM_ARTICLES.length ? STEAM_ARTICLES : NEWS;
    $('#newsGrid').innerHTML = listaNoticias.map(a => cardHTML(a, 'news')).join('');
    initGuias();                       // guias: um cartão para cada herói + filtro
    initBuilds();                      // builds: as mais usadas de cada herói + filtro

    // aviso de "atualizado em" quando as notícias vêm da Steam
    const sub = $('#newsSub');
    if (sub) {
        sub.innerHTML = STEAM_ARTICLES.length
            ? `As últimas notícias oficiais do Deadlock, direto da Steam — <b>traduzidas para português</b>. Clique para ler.
               <span class="news-sub-note"><i class="fa-solid fa-rotate"></i> Atualizado em <b>${esc((window.STEAM_NEWS || {}).updated || '')}</b> · tradução automática · texto original da Valve (em inglês)</span>`
            : 'As últimas novidades sobre Deadlock. Clique para ler.';
    }

    // patch notes automáticos (posts do Steam marcados como patch)
    const pl = $('#patchList');
    if (pl && STEAM_ARTICLES.length) {
        const patches = STEAM_ARTICLES.filter(a => a.patch).slice(0, 6);
        if (patches.length) {
            pl.innerHTML = patches.map(a => {
                const primeira = (a.body[0] || a.desc || '');
                const resumo = primeira.slice(0, 210) + (primeira.length > 210 ? '...' : '');
                return `<article class="patch-entry" data-article="${a.id}">
                    <div class="patch-head"><span class="patch-version">${esc(tituloPT(a))}</span><span class="patch-date">${esc(a.date)}</span></div>
                    <p>${esc(resumo)}</p>
                    <span class="patch-more">Ver o patch completo <i class="fa-solid fa-arrow-right"></i></span>
                </article>`;
            }).join('');
        }
    }
    // os cartões de build agora são montados pelo initBuilds() (dados reais)
    initEsports();                     // esports: torneios reais (data/esports.js)

    document.addEventListener('click', (e) => {
        const art = e.target.closest('[data-article]');
        if (art) {
            // se a pessoa segurou Ctrl/Shift (ou clicou com o meio do mouse),
            // deixa o navegador abrir a página de verdade em outra aba
            if (e.ctrlKey || e.metaKey || e.shiftKey) return;
            e.preventDefault();
            openArticle(art.dataset.article);
            return;
        }
    });
}

function findArticle(id) { return [...NEWS, ...GUIDES, ...BUILDS, ...STEAM_ARTICLES].find(a => a.id === id); }

function openArticle(id) {
    const a = findArticle(id); if (!a) return;
    const items = a.items ? `<div class="pform-sec" style="margin-top:18px">Itens recomendados</div>`
        + a.items.map(([nm, cost]) => `<div class="item-row"><span>${esc(nm)}</span><span class="cost">${money(cost)}</span></div>`).join('') : '';

    // ---- builds reais (aba Builds): ordem de compra + win rate de cada build ----
    const buildsHTML = a.builds ? `
        <p class="sec-note" style="margin-top:18px">As builds mais usadas por quem joga de ${esc(String(a.title).split(' — ')[0])}, com o win rate real de cada uma. Clique em um item para ver os detalhes.</p>
        ${a.builds.map((b, i) => `<div class="build-card">
            <div class="build-head">
                <b>${i === 0 ? '🏆 ' : ''}${esc(b.nome)}</b>
                <span class="build-wr">${String(b.win).replace('.', ',')}% de vitória</span>
            </div>
            <small>${money(b.m)} partidas registradas com esta build</small>
            <div class="build-itens">${itensDaBuildHTML(b.itens)}</div>
        </div>`).join('')}
        <p class="stat-fonte"><i class="fa-solid fa-screwdriver-wrench"></i> Builds publicadas pela comunidade dentro do próprio jogo. Fonte: deadlock-api.com</p>` : '';
    const corpo = a.patch
        ? `<div class="cm-patch">${a.body.map(p => `<p>${esc(p)}</p>`).join('')}</div>`
        : `<div class="cm-text">${a.body.map(p => `<p>${esc(p)}</p>`).join('')}</div>`;

    // ---- notícias do Steam: resumo + TEXTO INTEIRO (em português e no original) ----
    const temPT = !!a.descPT;
    const resumoPT = temPT
        ? `<div class="cm-pt"><span class="cm-pt-tag"><i class="fa-solid fa-language"></i> Resumo em português</span><p>${esc(a.descPT)}</p></div>`
        : '';
    const corpoPT = a.bodyPT || [];              // texto completo traduzido
    const temCorpoPT = corpoPT.some(x => x);
    const paragrafos = (lista) => `<div class="cm-text">${lista.map(p => `<p>${esc(p)}</p>`).join('')}</div>`;
    // texto principal: em português quando a tradução existe (senão, o original)
    const corpoSteam = temCorpoPT
        ? `<div class="pform-sec" style="margin:24px 0 10px">Texto completo (traduzido para português)</div>
           ${paragrafos(a.body.map((linha, i) => corpoPT[i] || linha))}`
        : (a.body && a.body.length ? paragrafos(a.body) : '');
    // e o original em inglês fica logo abaixo, para conferir
    const original = (a.steam && (temCorpoPT || temPT))
        ? `<div class="pform-sec" style="margin:24px 0 10px">Texto original (em inglês)</div>
           ${a.titlePT ? `<p class="cm-original-title">${esc(a.title)}</p>` : ''}
           ${paragrafos(a.body)}`
        : '';
    const linkSteam = a.url
        ? `<a class="cm-link" href="${esc(a.url)}" target="_blank" rel="noopener">Ver no Steam <i class="fa-solid fa-arrow-up-right-from-square"></i></a>`
        : '';
    // link de verdade para a página da notícia (bom para o Google e para quem quer compartilhar)
    const linkPagina = a.steam
        ? `<a class="cm-link" href="noticia/${esc(a.id)}.html"><i class="fa-solid fa-newspaper"></i> Abrir a página desta notícia</a>`
        : '';
    // guias: link para a página completa do herói (atributos, builds e histórico)
    const linkHeroi = a.heroPage
        ? `<a class="cm-link" href="${esc(a.heroPage)}"><i class="fa-solid fa-id-card"></i> Abrir a página completa do herói</a>`
        : '';
    $('#contentModalBox').innerHTML = `
        <button class="modal-close" data-close="contentModal" aria-label="Fechar"><i class="fa-solid fa-xmark"></i></button>
        ${cardImg(a, 'cm-img')}
        <div class="cm-body">
            <div class="cm-meta"><span class="tag acc">${esc(a.cat)}</span><span class="cm-date">${esc(a.date)}</span>${a.steam ? '<span class="news-src"><i class="fa-brands fa-steam"></i> Notícia oficial</span>' : ''}${a.titlePT ? '<span class="news-src"><i class="fa-solid fa-language"></i> Traduzido</span>' : ''}</div>
            <h2 class="cm-title">${esc(tituloPT(a))}</h2>
            ${resumoPT}
            ${a.steam ? corpoSteam : corpo}
            ${original}
            ${items}
            ${buildsHTML}
            ${linkSteam}
            ${linkPagina}
            ${linkHeroi}
        </div>`;
    openOverlay($('#contentModal'));
}

/* ================= esports (torneios de verdade) =================
   Tudo o que aparece aqui vem do data/esports.js, gerado pelo script
   tools/update-esports.py com os torneios da Liquipedia. Nada é inventado. */
let espLista = { proximos: [], resultados: [] };

function espTierTag(tier) {
    const letra = String(tier || '').trim().toUpperCase().charAt(0);
    return letra ? `<span class="esp-tier t-${letra.toLowerCase()}" title="Tier ${letra} (tamanho do torneio)">${letra}</span>` : '';
}

function espCartaoHTML(t, chave, i) {
    const logo = t.logo
        ? `<img src="${esc(t.logo)}" alt="" loading="lazy" onerror="this.remove()">`
        : '<i class="fa-solid fa-trophy"></i>';
    const venceu = t.campeao && ['TBD', 'CANCELLED'].indexOf(String(t.campeao).toUpperCase()) < 0;
    const linha = venceu
        ? `Campeão: <b>${esc(t.campeao)}</b>${t.vice && t.vice.toUpperCase() !== 'TBD' ? ` · Vice: ${esc(t.vice)}` : ''}`
        : `${esc(t.premio || '')}${t.local ? ' · ' + esc(t.local) : ''}`;
    return `<button type="button" class="esp-card" data-esporte="${chave}:${i}">
        <span class="esp-logo">${logo}</span>
        <span class="esp-info">
            <span class="esp-top">${espTierTag(t.tier)}<span class="esp-data">${esc(t.data || '')}</span></span>
            <span class="news-title">${esc(t.nome)}</span>
            <span class="news-desc">${linha}</span>
        </span>
    </button>`;
}

function abrirEsporte(chave, i) {
    const t = (espLista[chave] || [])[i];
    if (!t) return;
    const venceu = t.campeao && ['TBD', 'CANCELLED'].indexOf(String(t.campeao).toUpperCase()) < 0;
    const linhas = [
        ['Data', t.data],
        ['Premiação', t.premio],
        ['Onde', t.local],
        ['Times', t.times ? t.times + (String(t.times) === '1' ? ' time' : ' times') : ''],
        ['Campeão', venceu ? t.campeao : ''],
        ['Vice-campeão', (venceu && t.vice && t.vice.toUpperCase() !== 'TBD') ? t.vice : '']
    ].filter(l => l[1]);
    $('#contentModalBox').innerHTML = `
        <button class="modal-close" data-close="contentModal" aria-label="Fechar"><i class="fa-solid fa-xmark"></i></button>
        <div class="cm-body">
            <div class="cm-meta">${espTierTag(t.tier)}<span class="cm-date">${esc(t.data || '')}</span><span class="news-src"><i class="fa-solid fa-trophy"></i> Torneio real</span></div>
            <h2 class="cm-title">${esc(t.nome)}</h2>
            ${t.logo ? `<img class="cm-logo" src="${esc(t.logo)}" alt="" onerror="this.remove()">` : ''}
            <div class="esp-ficha">${linhas.map(l => `<div class="esp-linha"><b>${esc(l[0])}</b><span>${esc(l[1])}</span></div>`).join('')}</div>
            <a class="cm-link" href="${esc(t.url || ((window.ESPORTS || {}).fonteUrl || ''))}" target="_blank" rel="noopener">Ver o torneio na Liquipedia <i class="fa-solid fa-arrow-up-right-from-square"></i></a>
        </div>`;
    openOverlay($('#contentModal'));
}

function initEsports() {
    const dados = window.ESPORTS || null;
    const caixaProximos = $('#esportsProximos');
    const caixaResultados = $('#esportsResultados');
    const fonte = $('#esportsFonte');
    if (!caixaProximos || !caixaResultados) return;

    if (!dados || (!(dados.proximos || []).length && !(dados.resultados || []).length)) {
        caixaProximos.innerHTML = '';
        caixaResultados.innerHTML = '<p class="items-count">Não consegui buscar os torneios agora. Os dados entram na próxima atualização (rode <b>atualizar-tudo.bat</b>).</p>';
        return;
    }

    espLista = { proximos: dados.proximos || [], resultados: dados.resultados || [] };
    caixaProximos.innerHTML = espLista.proximos.length
        ? espLista.proximos.map((t, i) => espCartaoHTML(t, 'proximos', i)).join('')
        : '<p class="items-count">Nenhum torneio marcado para os próximos dias.</p>';
    caixaResultados.innerHTML = espLista.resultados.length
        ? espLista.resultados.map((t, i) => espCartaoHTML(t, 'resultados', i)).join('')
        : '<p class="items-count">Ainda não temos resultados recentes.</p>';

    const grade = $('#esports');
    if (grade) {
        $$('[data-esporte]', grade).forEach(b => b.addEventListener('click', () => {
            const partes = String(b.dataset.esporte).split(':');
            abrirEsporte(partes[0], Number(partes[1]));
        }));
    }

    if (fonte) {
        fonte.innerHTML = `<i class="fa-solid fa-trophy"></i> Torneios e resultados reais: <a href="${esc(dados.fonteUrl || '')}" target="_blank" rel="noopener">${esc(dados.fonte || 'Liquipedia')}</a> · atualizado em ${esc(dados.updated || '')}. O jogo não tem uma API de esports, então essa é a fonte pública que usamos.`;
    }
}

/* ================= comparar heróis ================= */
let cmpState = { a: 'Abrams', b: 'Bebop' };

function initCompare() {
    const A = $('#cmpA'), B = $('#cmpB');
    const opts = HEROES.map(h => `<option value="${esc(h.name)}">${esc(h.name)}</option>`).join('');
    A.innerHTML = opts; B.innerHTML = opts;
    if (!heroByName(cmpState.a)) cmpState.a = PLAYABLE[0].name;
    if (!heroByName(cmpState.b)) cmpState.b = PLAYABLE[1].name;
    A.value = cmpState.a; B.value = cmpState.b;
    A.addEventListener('change', () => { cmpState.a = A.value; renderCompare(); });
    B.addEventListener('change', () => { cmpState.b = B.value; renderCompare(); });
    $('#cmpSwap').addEventListener('click', () => {
        const t = cmpState.a; cmpState.a = cmpState.b; cmpState.b = t;
        A.value = cmpState.a; B.value = cmpState.b; renderCompare();
    });
    $('#cmpRandom').addEventListener('click', () => {
        const pick = () => PLAYABLE[Math.floor(Math.random() * PLAYABLE.length)].name;
        cmpState.a = pick(); cmpState.b = pick();
        A.value = cmpState.a; B.value = cmpState.b; renderCompare();
    });
    renderCompare();
}

function renderCompare() {
    const a = heroByName(cmpState.a), b = heroByName(cmpState.b);
    if (!a || !b) return;

    $('#cmpHead').innerHTML = [a, b].map(h => `
        <div class="cmp-hero">
            ${pennant(h, 150)}
            <h3>${esc(h.name)}</h3>
            <p>${h.soon ? 'Em breve' : esc(h.role) + (h.arch !== '—' ? ' · ' + esc(h.arch) : '')}</p>
            <div class="hc-tags">${h.soon ? '<span class="tag vio">Em breve</span>' : `<span class="tag">${esc(h.role)}</span><span class="tag ${tierClass(h.tier)}">Tier ${h.tier}</span>`}</div>
        </div>`).join('');

    const score = { tier: h => 5 - 'SABCD'.indexOf(h.tier), hp: h => h.hp, spd: h => h.spd, win: h => +h.win, pick: h => +h.pick, diff: h => 4 - h.diff, dominio: h => 4 - (h.dominio || h.diff) };
    const disp = { tier: h => h.tier, hp: h => String(h.hp), spd: h => h.spd + ' m/s', win: h => h.win + '%', pick: h => h.pick + '%', diff: h => DIFF_LABEL[h.diff], dominio: h => DIFF_LABEL[h.dominio || h.diff] };
    const labels = { tier: 'Tier', hp: 'Vida', spd: 'Velocidade', win: 'Win rate', pick: 'Pick rate', diff: 'Dificuldade (aprender)', dominio: 'Dificuldade (masterizar)' };

    $('#cmpRows').innerHTML = ['tier', 'hp', 'spd', 'win', 'pick', 'diff', 'dominio'].map(k => {
        const sa = a.soon ? 0 : score[k](a), sb = b.soon ? 0 : score[k](b);
        const max = Math.max(sa, sb, 1);
        const aBest = !a.soon && sa > sb, bBest = !b.soon && sb > sa;
        const aw = a.soon ? 0 : Math.max(4, sa / max * 100), bw = b.soon ? 0 : Math.max(4, sb / max * 100);
        return `<div class="cmp-row">
            <div class="cmp-cell a"><div class="cmp-val ${aBest ? 'best' : ''}">${a.soon ? '—' : esc(disp[k](a))}</div><div class="cmp-bar"><i style="width:${aw}%"></i></div></div>
            <div class="cmp-label">${labels[k]}</div>
            <div class="cmp-cell b"><div class="cmp-val ${bBest ? 'best' : ''}">${b.soon ? '—' : esc(disp[k](b))}</div><div class="cmp-bar"><i style="width:${bw}%"></i></div></div>
        </div>`;
    }).join('');
}

/* ================= dados reais do jogo (itens, builds, contadores, ranking) =================
   Tudo isto vem do arquivo data/game-data.js, gerado por tools/update-game-data.py,
   e do data/hero-history.js (win rate semana a semana). Nada aqui é inventado. */
function dadosJogo() { return window.GAME_DATA || null; }
function dadosHist() { return window.HERO_HISTORY || null; }

function apiIdDe(nome) {
    const g = dadosJogo();
    return (g && g.ids && g.ids[nome]) || null;
}
function heroiPorApiId(id) {
    const g = dadosJogo();
    if (!g || !g.ids) return null;
    const nome = Object.keys(g.ids).find(n => String(g.ids[n]) === String(id));
    return nome ? heroByName(nome) : null;
}
/* transforma "Lady Geist" em "lady-geist" (igual ao nome do arquivo em /heroi) */
function slugJS(texto) {
    return String(texto).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
}
function itemDe(id) {
    const g = dadosJogo();
    return (g && g.itens && g.itens[String(id)]) || null;
}

/* Os itens de uma build real (aba Builds). O arquivo data/builds.js guarda só
   os IDs dos itens — o nome, o preço e o ícone vêm da lista da loja que o site
   já tem carregada. Assim o arquivo fica leve e a página abre rápido. */
function itensDaBuildHTML(lista) {
    return (lista || []).map(id => {
        const it = itemDe(id);
        if (!it) return '';
        return `<button type="button" class="build-item" data-item="${esc(id)}" title="${esc(it.n)}${it.c ? ' — ' + money(it.c) + ' almas' : ''}">${it.i ? `<img src="${esc(it.i)}" alt="" loading="lazy" onerror="this.remove()">` : ''}<em>${esc(it.n)}</em></button>`;
    }).join('');
}

function itensDaBuildNomes(lista) {
    return (lista || []).map(id => { const it = itemDe(id); return it ? it.n : ''; }).join(' ');
}
function itemImg(item, cls = '') {
    if (!item || !item.i) return `<i class="fa-solid fa-gem ${cls}"></i>`;
    return `<img class="${cls}" src="${esc(item.i)}" alt="" loading="lazy" onerror="this.parentNode.innerHTML='<i class=\\'fa-solid fa-gem\\'></i>'">`;
}
const ITEM_TIPO_NOME = { weapon: 'Arma', vitality: 'Vitalidade', spirit: 'Espírito' };
const ITEM_TIPO_EMOJI = { weapon: '🔫', vitality: '💚', spirit: '🔮' };

/* ---------- itens da loja ---------- */
const ITEM_TIPOS = [['todos', 'Todos'], ['weapon', 'Armas'], ['vitality', 'Vitalidade'], ['spirit', 'Espírito']];
let itemTipo = 'todos', itemBusca = '';

function initItens() {
    const grid = $('#itemsGrid');
    if (!grid) return;
    const g = dadosJogo();
    if (!g || !g.itens || !Object.keys(g.itens).length) {
        grid.innerHTML = '<p class="muted-txt">Os itens reais do jogo entram aqui na próxima atualização. Dê dois cliques em <b>atualizar-tudo.bat</b> (ou espere o robô do GitHub).</p>';
        return;
    }
    const tipos = $('#itemsTipos');
    if (tipos) {
        tipos.innerHTML = ITEM_TIPOS.map(([k, l]) => {
            const qtd = k === 'todos' ? Object.keys(g.itens).length : Object.values(g.itens).filter(i => i.s === k).length;
            return `<button type="button" class="pill ${itemTipo === k ? 'on' : ''}" data-itemtipo="${k}">${l} <small>${qtd}</small></button>`;
        }).join('');
        $$('[data-itemtipo]', tipos).forEach(b => b.addEventListener('click', () => { itemTipo = b.dataset.itemtipo; initItens(); }));
    }
    const busca = $('#itemsSearch');
    if (busca && !busca.dataset.pronto) {
        busca.dataset.pronto = '1';
        busca.addEventListener('input', () => { itemBusca = busca.value; renderItens(); });
    }
    if (!initItens.ligado) {
        initItens.ligado = true;
        document.addEventListener('click', (e) => {
            const el = e.target.closest('[data-item]');
            if (el) openItem(el.dataset.item);
        });
        document.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter') return;
            const el = document.activeElement && document.activeElement.closest && document.activeElement.closest('[data-item]');
            if (el) openItem(el.dataset.item);
        });
    }
    renderItens();
}

function renderItens() {
    const g = dadosJogo(), grid = $('#itemsGrid');
    if (!g || !grid || !g.itens) return;
    const q = (itemBusca || '').trim().toLowerCase();
    let lista = Object.entries(g.itens);
    if (itemTipo !== 'todos') lista = lista.filter(([, i]) => i.s === itemTipo);
    if (q) lista = lista.filter(([, i]) => (i.n + ' ' + (i.en || '') + ' ' + (i.d || '')).toLowerCase().includes(q));
    lista.sort((a, b) => (a[1].t - b[1].t) || (a[1].c - b[1].c) || a[1].n.localeCompare(b[1].n, 'pt'));
    grid.innerHTML = lista.length
        ? lista.map(([id, i]) => itemCardHTML(id, i)).join('')
        : '<p class="muted-txt">Nenhum item encontrado. Tente outro nome.</p>';
    const cont = $('#itemsCount');
    if (cont) cont.innerHTML = `Mostrando <b>${lista.length}</b> de <b>${Object.keys(g.itens).length}</b> itens da loja · preço e efeito direto do jogo`;
}

function itemCardHTML(id, item) {
    return `<article class="item-card" data-item="${esc(id)}" tabindex="0" title="Ver detalhes de ${esc(item.n)}">
        <div class="item-ico">${itemImg(item)}</div>
        <div class="item-body">
            <div class="item-top"><h3>${esc(item.n)}</h3><span class="item-cost">${item.c ? money(item.c) : 'grátis'}</span></div>
            <span class="item-tipo ${item.s}">${ITEM_TIPO_EMOJI[item.s] || ''} ${ITEM_TIPO_NOME[item.s] || ''} · Tier ${item.t}${item.a ? ' · Ativo' : ''}</span>
            ${item.win != null ? `<span class="item-wr"><i class="fa-solid fa-chart-line"></i> <b>${item.win}%</b> de vitória quando comprado</span>` : ''}
        </div>
    </article>`;
}

function openItem(id) {
    const item = itemDe(id);
    const caixa = $('#itemModalBox');
    if (!item || !caixa) return;
    caixa.innerHTML = `
        <button class="modal-close" data-close="itemModal" aria-label="Fechar"><i class="fa-solid fa-xmark"></i></button>
        <div class="im">
            <div class="im-top">
                <div class="im-ico">${itemImg(item)}</div>
                <div>
                    <h1>${esc(item.n)}</h1>
                    <p class="im-en">${esc(item.en || '')}</p>
                    <div class="hp-tags" style="justify-content:flex-start">
                        <span class="tag">${ITEM_TIPO_NOME[item.s] || ''}</span>
                        <span class="tag cy">Tier ${item.t}</span>
                        ${item.a ? '<span class="tag acc">Item ativo</span>' : ''}
                        <span class="tag warn">${item.c ? money(item.c) + ' almas' : 'grátis'}</span>
                    </div>
                </div>
            </div>
            ${item.d ? `<p class="im-desc">${esc(item.d)}</p>` : '<p class="muted-txt">Este item não tem descrição de efeito na loja do jogo.</p>'}
            ${item.win != null ? `<div class="im-stats">
                <div class="pg-stat"><b>${item.win}%</b><small>win rate</small></div>
                <div class="pg-stat"><b>${item.x ? money(item.x) : '—'}</b><small>compras registradas</small></div>
            </div>` : ''}
            <p class="stat-fonte"><i class="fa-solid fa-chart-simple"></i> Números reais de partidas, via deadlock-api.com</p>
        </div>`;
    openOverlay($('#itemModal'));
}

/* ---------- elos de verdade (brasões oficiais do jogo) ---------- */
function dadosElos() { return window.ELOS || null; }

function initElos() {
    const caixa = $('#elosBox');
    if (!caixa) return;
    const d = dadosElos();
    if (!d || !d.faixas || !d.faixas.length) {
        caixa.innerHTML = '<p class="muted-txt">Os elos reais entram aqui na próxima atualização (rode <b>atualizar-tudo.bat</b>).</p>';
        return;
    }
    const nota = $('#elosNota');
    if (nota) nota.innerHTML = `<i class="fa-solid fa-users"></i> ${d.total.toLocaleString('pt-BR')} jogadores classificados · atualizado em ${esc(d.updated)}`;
    const maior = Math.max.apply(null, d.faixas.map(f => f.pct));
    caixa.innerHTML = '<div class="elos-lista">' + d.faixas.map(f => `
        <div class="elo-linha">
            ${f.img ? `<img class="elo-brasao" src="${esc(f.img)}" alt="Brasão do elo ${esc(f.nome)}" loading="lazy">` : ''}
            <div class="elo-info">
                <div class="elo-topo"><b>${esc(f.nome)}</b><span>${String(f.pct).replace('.', ',')}%</span></div>
                <div class="elo-barra"><i style="width:${Math.max(2, (f.pct / maior) * 100).toFixed(1)}%"></i></div>
                <div class="elo-qtd">${f.jogadores.toLocaleString('pt-BR')} jogadores</div>
            </div>
        </div>`).join('') + '</div>';
}

/* ---------- ranking real ---------- */
const REGIOES_RANK = [['SAmerica', 'América do Sul'], ['NAmerica', 'América do Norte'], ['Europe', 'Europa'], ['Asia', 'Ásia'], ['Oceania', 'Oceania']];
let rankRegiao = 'SAmerica';

/* Janela do jogador do ranking: mostra o que a Valve manda (nome, posição e os
   heróis mais jogados) e busca o perfil real dele no Steam pelo nome. */
async function abrirRankJogador(nome, pos) {
    const g = dadosJogo();
    const rotulo = (REGIOES_RANK.filter(r => r[0] === rankRegiao)[0] || [rankRegiao])[1] || rankRegiao;
    const linha = (((g || {}).ranking || {})[rankRegiao] || []).filter(p => String(p.n) === String(nome))[0] || {};
    const herois = (linha.h || []).map(id => heroiPorApiId(id)).filter(Boolean);
    const caixa = $('#contentModalBox');
    caixa.innerHTML = `
        <button class="modal-close" data-close="contentModal" aria-label="Fechar"><i class="fa-solid fa-xmark"></i></button>
        <div class="cm-body">
            <div class="cm-meta"><span class="tag acc">#${esc(pos)}</span><span class="cm-date">${esc(rotulo)}</span><span class="news-src"><i class="fa-solid fa-trophy"></i> Ranking real</span></div>
            <h2 class="cm-title">${esc(nome)}</h2>
            <div class="cm-text"><p>Posição <b>#${esc(pos)}</b> no ranking da região <b>${esc(rotulo)}</b>, direto do jogo (dados da Valve via deadlock-api.com). O ranking traz o nome e os heróis mais jogados — o ID da conta não vem junto, por isso a busca abaixo é feita pelo nome.</p></div>
            ${herois.length ? `<div class="pform-sec" style="margin:18px 0 10px">Heróis mais jogados</div>
                <div class="rk-lista">${herois.map(h => `<span class="rk-heroi"><img src="assets/heroes/${esc(h.file)}" alt="" loading="lazy"><b>${esc(h.name)}</b></span>`).join('')}</div>` : ''}
            <div class="pform-sec" style="margin:22px 0 10px">Perfil de verdade no Steam</div>
            <div id="rankAchados"><p class="muted-txt"><i class="fa-solid fa-spinner fa-spin"></i> Procurando pelo nome...</p></div>
        </div>`;
    openOverlay($('#contentModal'));

    const alvo = $('#rankAchados');
    let lista = [];
    try {
        const achados = await steamPedir('/players/steam-search?limit=6&search_query=' + encodeURIComponent(nome));
        lista = Array.isArray(achados) ? achados : [];
    } catch (e) { lista = []; }
    if (!alvo || !document.body.contains(alvo)) return;   // já fecharam a janela
    if (!lista.length) {
        alvo.innerHTML = '<p class="muted-txt">O Steam não devolveu nenhuma conta com esse nome. Muitos jogadores usam um apelido diferente dentro do jogo.</p>';
        return;
    }
    alvo.innerHTML = lista.map((j, i) => `<button type="button" class="steam-achado" data-rankachado="${i}">
            <img src="${esc(j.avatarmedium || j.avatar || '')}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">
            <span><b>${esc(j.personaname || 'Jogador')}</b><small>${j.matches_played_last_30d ? j.matches_played_last_30d + ' partidas nos últimos 30 dias' : 'conta do Steam'}</small></span>
            <i class="fa-solid fa-chevron-right"></i>
        </button>`).join('');
    $$('[data-rankachado]', alvo).forEach(b => b.addEventListener('click', () => {
        const j = lista[Number(b.dataset.rankachado)];
        if (!j) return;
        closeOverlay($('#contentModal'));
        showSection('perfil');
        steamCarregar(j.account_id, j.personaname, j.avatarfull || j.avatar, j.profileurl);
        showToast('Abrindo o perfil real de ' + (j.personaname || 'jogador') + '...');
    }));
}

function initRanking() {
    const tab = $('#rankTable');
    if (!tab) return;
    const g = dadosJogo();
    if (!g || !g.ranking || !Object.keys(g.ranking).length) {
        tab.innerHTML = '<p class="muted-txt">O ranking real entra aqui na próxima atualização (rode <b>atualizar-tudo.bat</b>).</p>';
        return;
    }
    if (!g.ranking[rankRegiao]) rankRegiao = Object.keys(g.ranking)[0];
    const reg = $('#rankRegioes');
    if (reg) {
        reg.innerHTML = REGIOES_RANK.filter(([k]) => g.ranking[k]).map(([k, l]) =>
            `<button type="button" class="pill ${rankRegiao === k ? 'on' : ''}" data-rankreg="${k}">${l}</button>`).join('');
        $$('[data-rankreg]', reg).forEach(b => b.addEventListener('click', () => { rankRegiao = b.dataset.rankreg; initRanking(); }));
    }
    const linhas = (g.ranking[rankRegiao] || []).slice(0, 50);
    const comHerois = linhas.filter(p => (p.h || []).length).length > linhas.length / 2;
    const cls = comHerois ? ' com-herois' : '';
    tab.innerHTML = `<div class="ranking-head${cls}"><span>#</span><span>Jogador</span>${comHerois ? '<span>Heróis mais jogados</span>' : ''}</div>` +
        linhas.map(p => `<div class="ranking-row${cls}" data-ranknome="${esc(p.n)}" data-rankpos="${p.r}" role="button" tabindex="0" title="Ver os detalhes deste jogador">
            <span class="rank-pos">${p.r}</span>
            <span class="rank-name">${esc(p.n)}</span>
            ${comHerois ? `<span class="rank-heroes">${(p.h || []).map(id => {
                const h = heroiPorApiId(id);
                return h ? `<img src="assets/heroes/${esc(h.file)}" alt="${esc(h.name)}" title="${esc(h.name)}" loading="lazy" onerror="this.remove()">` : '';
            }).join('') || '<em>—</em>'}</span>` : ''}
        </div>`).join('');
    // clicar em um jogador abre os detalhes dele (e busca o perfil real no Steam)
    $$('.ranking-row', tab).forEach(l => {
        l.addEventListener('click', () => abrirRankJogador(l.dataset.ranknome, l.dataset.rankpos));
        l.addEventListener('keydown', (ev) => {
            if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); abrirRankJogador(l.dataset.ranknome, l.dataset.rankpos); }
        });
    });
    const f = $('#rankFonte');
    if (f) f.innerHTML = `<i class="fa-solid fa-trophy"></i> Top ${linhas.length} jogadores da região · ranking real do jogo via deadlock-api.com · atualizado em ${esc(g.updated)}`;

    // Os brasões de elo de verdade: quem está no ranking já chegou no elo mais alto.
    const nota = $('#rankNota');
    if (nota) {
        const elos = dadosElos();
        const eternus = elos ? (elos.todos || []).filter(e => e.tier === 11)[0] : null;
        nota.innerHTML = eternus ? `
            ${eternus.img ? `<img src="${esc(eternus.img)}" alt="Brasão do elo ${esc(eternus.nome)}">` : ''}
            <div>
                <b>Todo mundo aqui está no elo mais alto: ${esc(eternus.nome)}</b>
                <span>O ranking mostra só o topo de cada região, então todos já chegaram no último elo do jogo. Para ver quantos jogadores estão em cada elo, abra a aba <b>Estatísticas</b>.</span>
            </div>` : '';
    }
}

/* ---------- histórico de win rate ---------- */
function serieHistorico(nome) {
    const hist = dadosHist();
    if (!hist || !hist.herois || !hist.herois[nome]) return null;
    return hist.herois[nome];
}

/* gráfico pequeno (dentro da ficha do herói) */
function sparklineHTML(nome) {
    const serie = serieHistorico(nome);
    const hist = dadosHist();
    if (!serie || !hist || serie.length < 3) return '';
    const passo = Math.max(1, Math.ceil(serie.length / 20));
    const pontos = serie.map((v, i) => (v == null || i % passo) ? null : [i, v]).filter(Boolean);
    if (pontos.length < 3) return '';
    const vals = pontos.map(p => p[1]);
    const min = Math.min(...vals) - 1, max = Math.max(...vals) + 1;
    const W = 100, H = 34;
    const px = i => (W * pontos.findIndex(p => p[0] === i)) / (pontos.length - 1);
    const py = v => H - ((v - min) / Math.max(0.001, max - min)) * H;
    const coords = pontos.map(([i, v]) => `${px(i).toFixed(2)},${py(v).toFixed(2)}`);
    const linha = 'M' + coords.join(' L');
    return `<div class="hist">
        <svg viewBox="0 0 ${W} ${H}" class="hist-svg" preserveAspectRatio="none">
            <path d="${linha} L ${W} ${H} L 0 ${H} Z" class="hist-area"></path>
            <path d="${linha}" class="hist-linha" vector-effect="non-scaling-stroke"></path>
        </svg>
        <div class="hist-labels">
            <span>${esc(hist.semanas[pontos[0][0]] || '')} → ${esc(hist.semanas[pontos[pontos.length - 1][0]] || '')}</span>
            <span>mín ${Math.min(...vals)}% · máx ${Math.max(...vals)}%</span>
        </div>
    </div>`;
}

/* gráfico grande da aba Estatísticas (6 melhores heróis) */
function renderHistorico() {
    const caixa = $('#statsHist');
    if (!caixa) return;
    const hist = dadosHist();
    if (!hist || !hist.herois || !hist.semanas || hist.semanas.length < 4) {
        caixa.innerHTML = '<p class="muted-txt">O histórico aparece na próxima atualização.</p>';
        return;
    }
    const ultimo = serie => { const v = serie.slice().reverse().find(x => x != null); return v == null ? -1 : v; };
    const nomes = Object.keys(hist.herois).filter(n => { const h = heroByName(n); return h && !h.soon; });
    nomes.sort((a, b) => ultimo(hist.herois[b]) - ultimo(hist.herois[a]));
    const escolhidos = nomes.slice(0, 6);
    const CORES = ['#b6f24a', '#22d3ee', '#f472b6', '#fbbf24', '#8b5cf6', '#34d399'];
    const n = hist.semanas.length;
    const W = 1000, H = 300, PAD = 10;
    const todos = escolhidos.flatMap(nm => hist.herois[nm].filter(v => v != null));
    if (!todos.length) { caixa.innerHTML = ''; return; }
    const min = Math.floor(Math.min(...todos) - 1), max = Math.ceil(Math.max(...todos) + 1);
    const px = i => (PAD + (W - 2 * PAD) * (n <= 1 ? 0 : i / (n - 1))).toFixed(1);
    const py = v => (H - PAD - (H - 2 * PAD) * ((v - min) / Math.max(0.001, max - min))).toFixed(1);
    let grade = '';
    for (let g5 = 0; g5 <= 4; g5++) {
        const val = min + (max - min) * g5 / 4;
        const y = py(val);
        grade += `<line x1="${PAD}" y1="${y}" x2="${W - PAD}" y2="${y}" class="hist-grade"></line>
                  <text x="${PAD + 4}" y="${+y - 4}" class="hist-grade-txt">${val.toFixed(1)}%</text>`;
    }
    const linhas = escolhidos.map((nm, k) => {
        const coords = hist.herois[nm].map((v, i) => v == null ? null : `${px(i)},${py(v)}`).filter(Boolean);
        return `<polyline points="${coords.join(' ')}" fill="none" stroke="${CORES[k]}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"></polyline>`;
    }).join('');
    const legenda = escolhidos.map((nm, k) => {
        const h = heroByName(nm);
        const u = ultimo(hist.herois[nm]);
        return `<button type="button" class="hist-leg" data-hero="${esc(nm)}"><i style="background:${CORES[k]}"></i>
            <img src="assets/heroes/${esc(h.file)}" alt="" onerror="this.remove()"> ${esc(nm)} <b>${u}%</b></button>`;
    }).join('');
    caixa.innerHTML = `
        <div class="hist-box">
            <svg viewBox="0 0 ${W} ${H}" class="hist-grande" preserveAspectRatio="none">
                ${grade}${linhas}
            </svg>
            <div class="hist-rodape">
                <span>${esc(hist.semanas[0])}</span>
                <span>${esc(hist.semanas[Math.floor(n / 2)])}</span>
                <span>${esc(hist.semanas[n - 1])}</span>
            </div>
        </div>
        <div class="hist-legenda">${legenda}</div>
        <p class="stat-fonte"><i class="fa-solid fa-chart-line"></i> Win rate semana a semana (${n} semanas de partidas reais). Clique em um herói para abrir a ficha. Fonte: deadlock-api.com</p>`;
    $$('[data-hero]', caixa).forEach(b => b.addEventListener('click', () => openHero(b.dataset.hero)));
}

/* ================= home ================= */
function initHome() {
    // ---- banner com a notícia mais nova ----
    const banner = $('#homeBanner');
    if (banner && STEAM_ARTICLES.length) {
        const a = STEAM_ARTICLES[0];
        const img = a.imgSteam || ('assets/heroes/' + a.imgHero);
        banner.style.background = `linear-gradient(90deg,rgba(8,9,11,.95),rgba(8,9,11,.45)), url('${img}') center/cover no-repeat`;
        banner.innerHTML = `<div class="hero-banner-content">
            <span class="hero-cat">${a.patch ? 'PATCH NOVO' : 'ÚLTIMA NOTÍCIA'} · ${esc(a.date)}</span>
            <h2 class="hero-banner-title">${esc(tituloPT(a))}</h2>
            <p class="hero-banner-desc">${esc(a.descPT || a.desc)}</p>
            <div class="hero-banner-acts">
                <button type="button" class="btn btn-lime" data-article="${esc(a.id)}">Ler agora <i class="fa-solid fa-arrow-right"></i></button>
                <button type="button" class="btn btn-dark" data-goto="noticias">Ver todas as notícias</button>
            </div>
        </div>`;
    }

    // ---- últimas notícias ----
    const hn = $('#homeNews');
    if (hn) {
        const lista = STEAM_ARTICLES.length ? STEAM_ARTICLES : NEWS;
        hn.innerHTML = lista.length
            ? lista.slice(0, 3).map(newsCardHTML).join('')
            : '<p class="muted-txt">As notícias oficiais aparecem aqui assim que o robô do GitHub rodar pela primeira vez.</p>';
    }

    // ---- mini painel do meta ----
    const hs = $('#homeStats');
    if (!hs) return;
    if (!temStatsReais) {
        hs.innerHTML = '<p class="muted-txt">As estatísticas reais entram aqui. Dê dois cliques em <b>atualizar-tudo.bat</b> (ou espere o robô do GitHub).</p>';
        return;
    }
    const comDados = PLAYABLE.filter(h => h.real);
    const porWin = [...comDados].sort((a, b) => (+b.win) - (+a.win));
    const porPick = [...comDados].sort((a, b) => (+b.pick) - (+a.pick));
    hs.innerHTML = `
        <div class="mini-stat">
            <h3><i class="fa-solid fa-crown"></i> Melhores do momento</h3>
            ${porWin.slice(0, 3).map((h, i) => miniStatRow(h, i + 1)).join('')}
        </div>
        <div class="mini-stat">
            <h3><i class="fa-solid fa-triangle-exclamation"></i> Estão sofrendo</h3>
            ${porWin.slice(-3).reverse().map((h, i) => miniStatRow(h, i + 1, true)).join('')}
        </div>
        <div class="mini-stat">
            <h3><i class="fa-solid fa-fire"></i> Mais escolhidos</h3>
            ${porPick.slice(0, 3).map((h, i) => miniStatRow(h, i + 1)).join('')}
        </div>
        <div class="mini-stat destaque">
            <h3><i class="fa-solid fa-database"></i> Base de dados</h3>
            <p class="mini-big">${money(STATS_INFO.partidas || 0)}</p>
            <p class="mini-sub">partidas analisadas · atualizado em ${esc(STATS_INFO.updated || '')}</p>
            <button type="button" class="btn btn-dark btn-sm" data-goto="estatisticas">Ver tabela completa <i class="fa-solid fa-arrow-right"></i></button>
        </div>`;
}

function miniStatRow(h, pos, ruim) {
    return `<div class="mini-row" data-hero="${esc(h.name)}" title="Ver ${esc(h.name)}">
        <span class="mini-pos">${pos}</span>
        <img src="assets/heroes/${esc(h.file)}" alt="" loading="lazy" onerror="this.remove()">
        <b>${esc(h.name)}</b>
        <span class="mini-win ${ruim ? 'ruim' : ''}">${h.win}%</span>
    </div>`;
}

/* ================= glossário (busca) ================= */
function initGlossario() {
    const busca = $('#glossSearch');
    const lista = $('#glossList');
    if (!busca || !lista) return;
    const vazio = $('#glossEmpty');
    busca.addEventListener('input', () => {
        const q = busca.value.trim().toLowerCase();
        let achou = 0;
        $$('.glossary-item', lista).forEach(it => {
            const ok = !q || it.textContent.toLowerCase().includes(q);
            it.style.display = ok ? '' : 'none';
            if (ok) achou++;
        });
        // esconde os títulos de grupo que ficaram sem nenhum item
        let grupo = null, visiveis = 0;
        [...lista.children].forEach(el => {
            if (el.classList.contains('glossary-group')) {
                if (grupo) grupo.style.display = visiveis ? '' : 'none';
                grupo = el; visiveis = 0;
            } else if (el.classList.contains('glossary-item') && el.style.display !== 'none') {
                visiveis++;
            }
        });
        if (grupo) grupo.style.display = visiveis ? '' : 'none';
        if (vazio) vazio.hidden = achou > 0;
    });
}

/* ================= estatísticas (números reais) ================= */
const STATS_ORDENS = {
    win: ['Win rate', (a, b) => (+b.win) - (+a.win)],
    pick: ['Pick rate', (a, b) => (+b.pick) - (+a.pick)],
    partidas: ['Partidas', (a, b) => b.partidas - a.partidas],
    kda: ['KDA', (a, b) => (+b.kda) - (+a.kda)]
};
let statsOrdem = 'win';

function initStats() {
    const ordens = $('#statsOrdens');
    if (ordens && temStatsReais) {
        ordens.innerHTML = Object.entries(STATS_ORDENS)
            .map(([k, v]) => `<button class="pill ${k === statsOrdem ? 'on' : ''}" data-ordem="${k}">${v[0]}</button>`).join('');
        ordens.addEventListener('click', (e) => {
            const b = e.target.closest('[data-ordem]'); if (!b) return;
            statsOrdem = b.dataset.ordem;
            $$('.pill', ordens).forEach(p => p.classList.toggle('on', p === b));
            renderStats();
        });
    }
    document.addEventListener('click', (e) => {
        const row = e.target.closest('#statsBox .st-row');
        if (row) openHero(row.dataset.hero);
    });
    renderStats();
}

function renderStats() {
    const box = $('#statsBox');
    if (!box) return;

    if (!temStatsReais) {
        box.innerHTML = `<div class="card" style="padding:24px">
            <h2 class="pform-sec" style="margin-top:0">Ainda sem estatísticas</h2>
            <p style="color:var(--text-soft)">Os números reais são baixados pelo arquivo <code>tools/update-stats.py</code>.
            Dê dois cliques em <code>atualizar-tudo.bat</code> para buscá-los agora — ou espere: o GitHub atualiza sozinho, todo dia.</p>
        </div>`;
        return;
    }

    const info = STATS_INFO.destaques || {};
    const lista = PLAYABLE.filter(h => h.real).sort(STATS_ORDENS[statsOrdem][1]);
    const num = (v) => (v == null ? '-' : v);

    // quem o jogo mais bane (dados de data/game-data.js)
    let maisBanido = null, maisBanidoPct = null;
    const gd = dadosJogo();
    if (gd && gd.banPos && gd.ban) {
        const idTop = Object.keys(gd.banPos).find(k => gd.banPos[k] === 1);
        if (idTop) { maisBanido = heroiPorApiId(idTop); maisBanidoPct = gd.ban[idTop]; }
    }

    const cards = `<div class="stats-cards">
        <div class="card stat-card"><i class="fa-solid fa-database"></i><b>${money(STATS_INFO.partidas || 0)}</b><small>partidas analisadas</small></div>
        <div class="card stat-card ok"><i class="fa-solid fa-crown"></i><b>${esc(num(info.melhor))}</b><small>melhor win rate · ${num(info.melhor_win)}%</small></div>
        <div class="card stat-card"><i class="fa-solid fa-fire"></i><b>${esc(num(info.mais_jogado))}</b><small>mais escolhido · ${num(info.mais_jogado_pick)}%</small></div>
        <div class="card stat-card bad"><i class="fa-solid fa-triangle-exclamation"></i><b>${esc(num(info.pior))}</b><small>menor win rate · ${num(info.pior_win)}%</small></div>
        ${maisBanido ? `<div class="card stat-card bad"><i class="fa-solid fa-ban"></i><b>${esc(maisBanido.name)}</b><small>mais banido · ${maisBanidoPct}%</small></div>` : ''}
    </div>`;

    const linhas = lista.map((h, i) => {
        const largura = Math.max(6, Math.min(100, (+h.win) / 60 * 100));
        const cor = (+h.win) >= 52 ? 'ok' : ((+h.win) >= 50 ? 'warn' : 'bad');
        return `<div class="st-row" data-hero="${esc(h.name)}" title="Ver ${esc(h.name)}">
            <span class="st-pos">${i + 1}</span>
            <span class="st-hero"><img src="assets/heroes/${esc(h.file)}" alt="" loading="lazy" onerror="this.remove()"><b>${esc(h.name)}</b></span>
            <span class="st-tier"><span class="tag ${tierClass(h.tier)}">${esc(h.tier)}</span></span>
            <span class="st-num">${money(h.partidas)}</span>
            <span class="st-win"><i class="${cor}" style="width:${largura}%"></i><em>${h.win}%</em></span>
            <span class="st-num">${pickTxt(h.pick)}</span>
            <span class="st-num">${h.kda}</span>
        </div>`;
    }).join('');

    box.innerHTML = cards + `
        <div class="stats-table">
            <div class="st-head">
                <span>#</span><span>Herói</span><span>Tier</span><span>Partidas</span>
                <span>Win rate</span><span>Pick</span><span>KDA</span>
            </div>
            ${linhas}
        </div>
        <p class="stat-fonte"><i class="fa-solid fa-chart-simple"></i>
            Números reais de partidas, via <b>deadlock-api.com</b> · atualizado em <b>${esc(STATS_INFO.updated || '')}</b>.
            Clique em um herói para ver a ficha completa.
        </p>`;
}

/* ================= mapa ================= */
const MAP_LANES = [
    { id: 'top', label: 'Rota Superior', d: 'M150,400 C150,150 300,70 690,120', lx: 315, ly: 148 },
    { id: 'mid', label: 'Rota do Meio', d: 'M150,400 L690,120', lx: 560, ly: 178 },
    { id: 'bot', label: 'Rota Inferior', d: 'M150,400 C300,470 600,430 690,120', lx: 330, ly: 375 }
];
const MAP_MARKERS = [
    { id: 'amber', label: 'Base Âmbar', color: '#ffb74d', x: 150, y: 400 },
    { id: 'sapphire', label: 'Base Safira', color: '#4fc3f7', x: 690, y: 120 },
    { id: 'midboss', label: 'Midboss', color: '#8b5cf6', x: 400, y: 252 }
];
const MAP_INFO = {
    top: { n: 'Rota Superior', d: 'Rota longa no topo do mapa. Boa para farmar com segurança, mas fique de olho nas tirolesas: os inimigos chegam rápido.' },
    mid: { n: 'Rota do Meio', d: 'A rota mais curta e movimentada. Passa perto do Midboss e das runas, então acontecem muitas lutas por aqui.' },
    bot: { n: 'Rota Inferior', d: 'Rota longa na parte de baixo do mapa. Muito espaço para farm e lutas frequentes perto do Midboss.' },
    amber: { n: 'Base Âmbar', d: 'Uma das bases. Aqui ficam o Patron e a fonte de cura do time. Proteja-a a todo custo.' },
    sapphire: { n: 'Base Safira', d: 'A base oposta, no outro canto do mapa. Destrua o Patron inimigo aqui para vencer a partida.' },
    midboss: { n: 'Midboss', d: 'Chefe que aparece no centro do mapa. O time que o derrota ganha um bônus poderoso (exemplo ilustrativo).' }
};
const FONT = 'Poppins, system-ui, sans-serif';

function initMap() {
    const lanes = MAP_LANES.map(l => `
        <g class="map-zone" data-area="${l.id}">
            <path d="${l.d}" stroke="transparent" stroke-width="48" fill="none" pointer-events="stroke"></path>
            <path class="zone-shape" style="stroke:var(--lime)" d="${l.d}" stroke-width="7" fill="none" stroke-linecap="round" opacity=".75" pointer-events="none"></path>
            <text x="${l.lx}" y="${l.ly}" fill="#cfd2dc" font-size="14" font-weight="700" text-anchor="middle" pointer-events="none" font-family="${FONT}">${l.label}</text>
        </g>`).join('');
    const markers = MAP_MARKERS.map(m => `
        <g class="map-zone" data-area="${m.id}">
            <circle cx="${m.x}" cy="${m.y}" r="26" fill="transparent" pointer-events="all"></circle>
            <circle class="zone-shape" cx="${m.x}" cy="${m.y}" r="15" fill="${m.color}" stroke="#0c0c0e" stroke-width="3" pointer-events="none"></circle>
            <text x="${m.x}" y="${m.y + 40}" fill="#cfd2dc" font-size="13" font-weight="700" text-anchor="middle" pointer-events="none" font-family="${FONT}">${m.label}</text>
        </g>`).join('');

    $('#mapBox').innerHTML = `<svg viewBox="0 0 800 500" role="img" aria-label="Mapa esquemático do jogo">
        <defs><linearGradient id="mapBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#141420"></stop><stop offset="1" stop-color="#0b0b12"></stop>
        </linearGradient></defs>
        <rect width="800" height="500" rx="14" fill="url(#mapBg)"></rect>
        <rect x="6" y="6" width="788" height="488" rx="12" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="2"></rect>
        ${lanes}${markers}
    </svg>`;

    $('#mapBox').addEventListener('click', (e) => {
        const z = e.target.closest('.map-zone'); if (!z) return;
        setMapArea(z.dataset.area);
    });
    setMapArea('mid');
}

function setMapArea(id) {
    document.querySelectorAll('#mapBox .map-zone').forEach(z => z.classList.toggle('active', z.dataset.area === id));
    const info = MAP_INFO[id]; if (!info) return;
    $('#mapInfo').innerHTML = `<h3>${esc(info.n)}</h3><p>${esc(info.d)}</p>
        <div class="map-legend">
            <span><i class="fa-solid fa-circle" style="color:#b6f24a"></i>Rotas</span>
            <span><i class="fa-solid fa-circle" style="color:#ffb74d"></i>Base Âmbar</span>
            <span><i class="fa-solid fa-circle" style="color:#4fc3f7"></i>Base Safira</span>
            <span><i class="fa-solid fa-circle" style="color:#8b5cf6"></i>Midboss</span>
        </div>`;
}

/* ================= eventos (datas reais) =================
   Nada de evento inventado. A lista é montada na hora com:
     - os próximos torneios de verdade (data/esports.js, da Liquipedia);
     - as datas reais das últimas atualizações do jogo (data/steam-news.js).
   O botão "Lembrar" continua guardando tudo no próprio navegador. */

const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
let eventosAtuais = [];

function hojeZerado() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}

function quantoFalta(data) {
    if (!data || isNaN(data.getTime())) return '';
    const dias = Math.round((data - hojeZerado()) / 86400000);
    if (dias < 0) return 'já aconteceu';
    if (dias === 0) return 'é hoje';
    if (dias === 1) return 'é amanhã';
    return 'faltam ' + dias + ' dias';
}

function eventosReais() {
    const lista = [];
    const esp = window.ESPORTS || {};

    // 1) próximos torneios reais (vêm da Liquipedia)
    (esp.proximos || []).forEach((t, i) => {
        const quando = t.iso ? new Date(t.iso + 'T00:00:00') : null;
        lista.push({
            id: 'esp-' + (t.iso || i) + '-' + i,
            quando: quando,
            tipo: 'Torneio',
            icone: 'fa-trophy',
            titulo: t.nome,
            desc: (t.premio ? t.premio + ' de premiação' : 'Torneio de Deadlock')
                + (t.local ? ' · ' + t.local : '') + (t.times ? ' · ' + t.times + ' times' : ''),
            lembrar: true,
            abrir: () => { showSection('esports'); setTimeout(() => abrirEsporte('proximos', i), 150); }
        });
    });

    // 2) as últimas atualizações do jogo (datas reais do Steam)
    (typeof STEAM_ARTICLES !== 'undefined' ? STEAM_ARTICLES : [])
        .filter(a => a.patch).slice(0, 4).forEach(a => {
            lista.push({
                id: 'patch-' + a.id,
                quando: a.ts ? new Date(a.ts * 1000) : null,
                tipo: 'Atualização',
                icone: 'fa-file-pen',
                titulo: tituloPT(a),
                desc: 'Atualização publicada pela Valve no jogo',
                lembrar: false,
                abrir: () => openArticle(a.id)
            });
        });

    const hoje = hojeZerado();
    const validos = lista.filter(e => e.quando && !isNaN(e.quando.getTime()));
    const futuros = validos.filter(e => e.quando >= hoje).sort((a, b) => a.quando - b.quando);
    const passados = validos.filter(e => e.quando < hoje).sort((a, b) => b.quando - a.quando);
    return futuros.concat(passados);
}

function cartaoEventoHTML(ev) {
    const lembrado = store.get('cdl_events', []).includes(ev.id);
    const quando = quantoFalta(ev.quando);
    const futuro = quando && quando !== 'já aconteceu';
    const data = String(ev.quando.getDate()).padStart(2, '0');
    return `<article class="event-item ${futuro ? 'futuro' : 'passado'}" data-evento="${esc(ev.id)}" tabindex="0" role="button" title="Clique para abrir">
        <div class="event-date"><b>${data}</b><span>${MESES_CURTOS[ev.quando.getMonth()]}</span></div>
        <div class="event-body">
            <h3><i class="fa-solid ${ev.icone}"></i> ${esc(ev.titulo)}</h3>
            <p>${esc(ev.desc)} · ${esc(ev.tipo)}${quando ? ' · <b>' + esc(quando) + '</b>' : ''}</p>
        </div>
        ${ev.lembrar
            ? `<button class="btn btn-dark event-remind ${lembrado ? 'on' : ''}" data-remind="${esc(ev.id)}">${lembrado ? '<i class="fa-solid fa-check"></i> Lembrando' : 'Lembrar'}</button>`
            : '<span class="event-ver">Ler <i class="fa-solid fa-arrow-right"></i></span>'}
    </article>`;
}

function abrirEvento(id) {
    const ev = eventosAtuais.filter(x => x.id === id)[0];
    if (ev && ev.abrir) ev.abrir();
}

function initEvents() {
    const caixa = $('#eventList');
    if (!caixa) return;
    renderEvents();
    caixa.addEventListener('click', (e) => {
        const b = e.target.closest('[data-remind]');
        if (b) {
            e.stopPropagation();
            const id = b.dataset.remind;
            let list = store.get('cdl_events', []);
            list = list.includes(id) ? list.filter(x => x !== id) : [...list, id];
            store.set('cdl_events', list);
            renderEvents();
            showToast(list.includes(id) ? 'Vamos te lembrar deste evento!' : 'Lembrete removido.');
            return;
        }
        const card = e.target.closest('[data-evento]');
        if (card) abrirEvento(card.dataset.evento);
    });
    caixa.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const card = e.target.closest('[data-evento]');
        if (!card) return;
        e.preventDefault();
        abrirEvento(card.dataset.evento);
    });
}

function renderEvents() {
    const caixa = $('#eventList');
    if (!caixa) return;
    eventosAtuais = eventosReais();
    caixa.innerHTML = eventosAtuais.length
        ? eventosAtuais.map(cartaoEventoHTML).join('')
        : '<p class="items-count">Nenhuma data real por aqui agora. Assim que sair um torneio ou uma atualização nova, ela aparece nesta lista.</p>';
}

/* ================= quiz ================= */
const QUIZ = [
    {
        q: 'Como você prefere entrar nas lutas?', o: [
            { t: 'Na frente, aguentando a pancada', w: { role: 'Tanque', arch: 'Lutador' } },
            { t: 'De longe, causando dano sem parar', w: { role: 'Carry', arch: 'Assassino' } },
            { t: 'Ajudando e protegendo o time', w: { role: 'Suporte', arch: 'Místico' } },
            { t: 'Criando confusão e controlando a área', w: { role: 'Controle', arch: 'Místico' } }
        ]
    },
    {
        q: 'Qual dessas habilidades te agrada mais?', o: [
            { t: 'Ficar impossível de matar', w: { role: 'Tanque' } },
            { t: 'Escapar e reaparecer do nada', w: { arch: 'Assassino' } },
            { t: 'Curar e dar escudo nos aliados', w: { role: 'Suporte' } },
            { t: 'Prender vários inimigos de uma vez', w: { role: 'Controle' } }
        ]
    },
    {
        q: 'Quanto tempo você tem para treinar?', o: [
            { t: 'Pouco — quero algo fácil de jogar', w: { diff: 1 } },
            { t: 'Médio — gosto de aprender', w: { diff: 2 } },
            { t: 'Muito — quero um herói desafiador', w: { diff: 3 } }
        ]
    },
    {
        q: 'Qual estilo combina mais com você?', o: [
            { t: 'Tanque resistente', w: { arch: 'Lutador' } },
            { t: 'Atirador preciso', w: { arch: 'Assassino' } },
            { t: 'Místico cheio de habilidades', w: { arch: 'Místico' } },
            { t: 'Híbrido / tanto faz', w: { arch: '—' } }
        ]
    },
    {
        q: 'O time está perdendo feio. O que você faz?', o: [
            { t: 'Chamo todo mundo para uma luta decidida', w: { role: 'Controle' } },
            { t: 'Vou farmar em paz e volto forte para virar', w: { role: 'Carry' } },
            { t: 'Fico colado nos aliados para ninguém morrer', w: { role: 'Suporte' } },
            { t: 'Entro na frente para abrir espaço para o time', w: { role: 'Tanque' } }
        ]
    },
    {
        q: 'Qual parte do mapa te atrai mais?', o: [
            { t: 'As rotas laterais, no duelo 1 contra 1', w: { arch: 'Assassino', diff: 3 } },
            { t: 'O meio, no meio da confusão', w: { role: 'Controle' } },
            { t: 'A selva, farmando tranquilo', w: { role: 'Carry', diff: 1 } },
            { t: 'Onde o time precisar de mim', w: { role: 'Suporte' } }
        ]
    },
    {
        q: 'Que tipo de item você gosta de comprar?', o: [
            { t: 'Vida e resistência, para aguentar tudo', w: { role: 'Tanque' } },
            { t: 'Dano puro, para matar o mais rápido possível', w: { arch: 'Assassino' } },
            { t: 'Poder espiritual, para habilidades devastadoras', w: { arch: 'Místico' } },
            { t: 'Utilidade para o time (escudo, cura, controle)', w: { role: 'Suporte' } }
        ]
    }
];
let quizState = { i: 0, ans: [] };

function initQuiz() { quizState = { i: 0, ans: [] }; renderQuiz(); }

function renderQuiz() {
    const box = $('#quizBox');
    if (quizState.i >= QUIZ.length) { box.innerHTML = quizResultHTML(); bindQuizResult(); return; }
    const q = QUIZ[quizState.i];
    box.innerHTML = `
        <div class="quiz-progress"><i style="width:${Math.round(quizState.i / QUIZ.length * 100)}%"></i></div>
        <div class="quiz-step">Pergunta ${quizState.i + 1} de ${QUIZ.length}</div>
        <div class="quiz-q">${esc(q.q)}</div>
        <div class="quiz-opts">${q.o.map((o, k) => `<button class="quiz-opt" data-k="${k}">${esc(o.t)}</button>`).join('')}</div>`;
    box.querySelectorAll('.quiz-opt').forEach(b => b.addEventListener('click', () => {
        quizState.ans.push(q.o[+b.dataset.k].w);
        quizState.i++;
        renderQuiz();
    }));
}

function quizScores() {
    return PLAYABLE.map(h => {
        let s = 0;
        quizState.ans.forEach(w => {
            if (w.role && h.role === w.role) s += 3;
            if (w.arch && h.arch === w.arch) s += 2;
            if (w.diff && h.diff === w.diff) s += 1;
        });
        return { h, s };
    }).sort((x, y) => y.s - x.s);
}

function quizResultHTML() {
    const top = quizScores().slice(0, 3).map(x => x.h);
    return `
        <div class="quiz-step">Resultado</div>
        <div class="quiz-q">Seu herói ideal é ${esc(top[0].name)}!</div>
        <div class="quiz-result">
            ${top.map((h, i) => `<div class="qr">${pennant(h, 120)}<small>${i === 0 ? '★ Melhor combinação' : (i + 1) + 'ª opção'}</small></div>`).join('')}
        </div>
        <div class="quiz-actions">
            <button class="btn btn-lime" data-qact="open" data-hero="${esc(top[0].name)}">Ver ficha de ${esc(top[0].name)}</button>
            <button class="btn btn-dark" data-qact="redo">Refazer o quiz</button>
        </div>`;
}

function bindQuizResult() {
    const box = $('#quizBox');
    const redo = box.querySelector('[data-qact="redo"]');
    if (redo) redo.addEventListener('click', () => { quizState = { i: 0, ans: [] }; renderQuiz(); });
    const open = box.querySelector('[data-qact="open"]');
    if (open) open.addEventListener('click', () => openHero(open.dataset.hero));
}

/* ================= modais (fechar) ================= */
function openOverlay(el) { el.classList.add('show'); document.body.style.overflow = 'hidden'; }
function closeOverlay(el) { el.classList.remove('show'); if (!document.querySelector('.modal-overlay.show')) document.body.style.overflow = ''; }

function initModals() {
    document.addEventListener('click', (e) => {
        const closeBtn = e.target.closest('[data-close]');
        if (closeBtn) { const el = document.getElementById(closeBtn.dataset.close); if (el) closeOverlay(el); return; }
        const generic = e.target.closest('.modal-close');
        if (generic) { const ov = generic.closest('.modal-overlay'); if (ov) closeOverlay(ov); return; }
        if (e.target.classList && e.target.classList.contains('modal-overlay')) closeOverlay(e.target);
    });
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        $$('.modal-overlay.show').forEach(closeOverlay);
    });
}

/* ================= perfil ================= */
function bannerColors(p) { return p.banner === 'custom' ? [p.bc1, p.bc2] : (BANNERS[p.banner] || BANNERS.lima)[1]; }

/* Cada padrão do banner = uma lista de "desenhos" (camada, tamanho, posição).
   O degradê de cor entra por baixo, como última camada. Para criar um padrão
   novo, basta acrescentar uma linha aqui e outra na PATTERNS (acima). */
const PATTERN_ART = {
    grid: [
        ['linear-gradient(rgba(255,255,255,.14) 1px,transparent 1px)', '24px 24px'],
        ['linear-gradient(90deg,rgba(255,255,255,.14) 1px,transparent 1px)', '24px 24px']
    ],
    dots: [['radial-gradient(rgba(255,255,255,.32) 1.5px,transparent 1.6px)', '16px 16px']],
    dotsbig: [['radial-gradient(rgba(255,255,255,.30) 4px,transparent 4.6px)', '34px 34px']],
    diag: [['repeating-linear-gradient(45deg,rgba(255,255,255,.12) 0 2px,transparent 2px 12px)', 'auto']],
    vstripes: [['repeating-linear-gradient(90deg,rgba(255,255,255,.12) 0 2px,transparent 2px 12px)', 'auto']],
    checks: [['conic-gradient(rgba(255,255,255,.15) 25%,transparent 0 50%,rgba(255,255,255,.15) 0 75%,transparent 0)', '20px 20px']],
    diamonds: [
        ['repeating-linear-gradient(45deg,rgba(255,255,255,.10) 0 1px,transparent 1px 16px)', 'auto'],
        ['repeating-linear-gradient(-45deg,rgba(255,255,255,.10) 0 1px,transparent 1px 16px)', 'auto']
    ],
    chevron: [
        ['linear-gradient(135deg,rgba(255,255,255,.16) 25%,transparent 25%)', '18px 18px', '-9px 0'],
        ['linear-gradient(225deg,rgba(255,255,255,.16) 25%,transparent 25%)', '18px 18px', '-9px 0'],
        ['linear-gradient(315deg,rgba(255,255,255,.16) 25%,transparent 25%)', '18px 18px'],
        ['linear-gradient(45deg,rgba(255,255,255,.16) 25%,transparent 25%)', '18px 18px']
    ],
    rays: [['repeating-conic-gradient(from 0deg at 50% -20%,rgba(255,255,255,.14) 0deg 5deg,transparent 5deg 16deg)', 'auto']],
    rings: [['repeating-radial-gradient(circle at 50% 130%,rgba(255,255,255,.14) 0 1px,transparent 1px 16px)', 'auto']],
    glow: [['radial-gradient(120% 150% at 25% 0%,rgba(255,255,255,.5),rgba(255,255,255,0) 58%)', 'auto']],
    noise: [['url(data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%27120%27%20height=%27120%27%3E%3Cfilter%20id=%27n%27%3E%3CfeTurbulence%20type=%27fractalNoise%27%20baseFrequency=%270.85%27%20numOctaves=%273%27%20stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect%20width=%27120%27%20height=%27120%27%20filter=%27url%28%23n%29%27%20opacity=%270.52%27/%3E%3C/svg%3E)', '120px 120px']]
};

function bannerStyle(p) {
    if (p.bannerImg) return `background:linear-gradient(rgba(0,0,0,.18),rgba(0,0,0,.18)),url('${p.bannerImg}') center/cover no-repeat;`;
    const [a, b] = bannerColors(p);
    const base = `linear-gradient(120deg,${a},${b})`;
    const arte = PATTERN_ART[p.pattern] || [];
    const camadas = arte.map(l => l[0]).concat(base).join(',');
    const tamanhos = arte.map(l => l[1] || 'auto').concat('auto').join(',');
    const posicoes = arte.map(l => l[2] || '0 0').concat('0 0').join(',');
    return `background:${camadas};background-size:${tamanhos};background-position:${posicoes};`;
}

function shapeCss(shape) {
    if (shape === 'circle') return 'border-radius:50%;';
    if (shape === 'sharp') return 'border-radius:4px;';
    if (POLY[shape]) return 'clip-path:polygon(' + POLY[shape].map(([x, y]) => `${+(50 + 50 * x).toFixed(2)}% ${+(50 + 50 * y).toFixed(2)}%`).join(',') + ');';
    return 'border-radius:22px;';
}

function avatarInner(p) {
    if (p.av.img) return '';
    const nick = (p.nick || 'Você').trim().split(/\s+/);
    return nick.length > 1 ? (nick[0][0] + nick[1][0]).toUpperCase() : nick[0].slice(0, 2).toUpperCase();
}

/* avatar com forma + moldura (a moldura é um "aro" desenhado atrás) */
function avatarBox(size, p) {
    const shape = shapeCss(p.av.shape);
    const hasImg = !!p.av.img;
    const coresPadrao = bannerColors(p);
    const [c1, c2] = (p.av.c1 && p.av.c2) ? [p.av.c1, p.av.c2] : coresPadrao;
    const zoom = p.av.zoom || 1, px = p.av.px ?? 50, py = p.av.py ?? 50;
    const inner = hasImg
        ? `<img src="${p.av.img}" alt="" style="object-position:${px}% ${py}%;transform:scale(${zoom})">`
        : `<span class="pav-txt">${avatarInner(p)}</span>`;
    const bg = hasImg ? '#111417' : `linear-gradient(135deg,${c1},${c2})`;
    const core = `<div class="pav" style="${shape}width:${size}px;height:${size}px;font-size:${Math.round(size * 0.34)}px;background:${bg}">${inner}</div>`;
    const frame = p.av.frame;
    if (frame === 'none') return core;
    if (frame === 'double') {
        return `<div class="pav-wrap" style="${shape}background:var(--lime);padding:3px"><div class="pav-wrap" style="${shape}background:var(--card);padding:3px">${core}</div></div>`;
    }
    const f = FRAME_STYLE[frame] || { bg: 'var(--lime)' };
    const glow = f.glow ? `;filter:${f.glow}` : '';
    return `<div class="pav-wrap" style="${shape}background:${f.bg};padding:4px${glow}">${core}</div>`;
}

/* abas do editor de perfil */
let pTab = 'id', avAdjustOpen = false;
const PROFILE_TABS = [
    ['id', 'fa-user', 'Identidade'],
    ['game', 'fa-gamepad', 'Jogo'],
    ['avatar', 'fa-circle-user', 'Avatar'],
    ['card', 'fa-id-card', 'Cartão'],
    ['site', 'fa-gear', 'Site'],
    ['ach', 'fa-star', 'Conquistas'],
    ['data', 'fa-database', 'Dados']
];
function renderPTabs() {
    $('#ptabs').innerHTML = PROFILE_TABS.map(([k, ic, n]) =>
        `<button type="button" data-pt="${k}" class="${pTab === k ? 'on' : ''}"><i class="fa-solid ${ic}"></i> ${n}</button>`).join('');
}

/* cartão do jogador (pré-visualização e link compartilhado) */
function profileCardHTML(p) {
    const mains = p.mains.map(heroByName).filter(Boolean);
    const lv = level();
    const lk = [['Discord', p.links.discord], ['Twitch', p.links.twitch], ['YouTube', p.links.youtube]].filter(x => x[1]);
    return `<div class="pcard">
        <div class="pban" style="${bannerStyle(p)}"></div>
        <div class="pbody">
            <div class="pav-holder">${avatarBox(96, p)}</div>
            <h2>${esc(p.nick || 'Seu apelido')}</h2>
            ${p.pronouns ? `<div style="color:var(--text-faint);font-size:12.5px;margin-bottom:4px">${esc(p.pronouns)}</div>` : ''}
            ${p.status ? `<div class="pstatus-txt">“${esc(p.status)}”</div>` : ''}
            <div class="prow">
                <span class="tag acc">${esc(p.title || 'Jogador')}</span>
                <span class="tag">Nível ${lv.n} · ${rankName(lv.n)}</span>
                ${p.region ? `<span class="tag cy">${esc(p.region)}</span>` : ''}
            </div>
            <p class="pbio">${esc(p.bio || 'Escreva uma bio para aparecer aqui.')}</p>
            ${mains.length ? `<div class="pmains">${mains.map((h, i) => `<div class="pm">${pennant(h, 74)}<small>${i === 0 ? 'Principal' : (i + 1) + 'º'}</small></div>`).join('')}</div>` : ''}
            ${lk.length ? `<div class="plinks">${lk.map(([k, v]) => `<span>${k}: <b>${esc(v)}</b></span>`).join('')}</div>` : ''}
            <div class="plvl"><span>${esc(p.id)}</span><span>${lv.xp} XP</span></div>
        </div>
    </div>`;
}
function renderSideCard() { $('#pprev').innerHTML = profileCardHTML(profile); }

/* perfil grande (topo da aba Perfil) */
function renderProfileView() {
    const p = profile, lv = level();
    const mains = p.mains.map(heroByName).filter(Boolean);
    const lk = [['Discord', p.links.discord], ['Twitch', p.links.twitch], ['YouTube', p.links.youtube]].filter(x => x[1]);
    const done = ACH.filter(x => x.p() >= x.max).length;
    const seen = stats.heroesSeen.filter(n => !HEROES_SOON.includes(n)).length;
    const tile = (n, l) => `<div class="pv-t"><b>${n}</b><span>${l}</span></div>`;

    $('#pvBan').setAttribute('style', bannerStyle(p));
    $('#pvAv').innerHTML = avatarBox(112, p);
    $('#pvId').innerHTML = `
        <h1>${esc(p.nick || 'Seu apelido')}${p.pronouns ? `<small>${esc(p.pronouns)}</small>` : ''}</h1>
        <div class="prow" style="margin:10px 0 6px">
            <span class="tag acc">${esc(p.title || 'Jogador')}</span>
            <span class="tag">Nível ${lv.n} · ${rankName(lv.n)}</span>
            ${p.region ? `<span class="tag cy">${esc(p.region)}</span>` : ''}
        </div>
        ${p.status ? `<div class="pstatus-txt">“${esc(p.status)}”</div>` : ''}`;
    $('#pvGrid').innerHTML = `
        <div class="pv-col">
            <section class="card pv-sec">
                <h2>Sobre</h2>
                <p class="muted-txt">${esc(p.bio || 'Sem bio ainda.')}</p>
                ${lk.length ? `<div class="plinks">${lk.map(([k, v]) => `<span>${k}: <b>${esc(v)}</b></span>`).join('')}</div>` : ''}
            </section>
            <section class="card pv-sec">
                <h2>Heróis principais</h2>
                ${mains.length
                    ? `<div class="pv-mains">${mains.map((h, i) => `<div class="pm">${pennant(h, 132)}<small>${i === 0 ? '★ Principal' : (i + 1) + 'º herói'}</small></div>`).join('')}</div>`
                    : `<p class="muted-txt">Nenhum herói escolhido. <button type="button" class="linkbtn" data-goto="game">Escolher agora</button></p>`}
            </section>
        </div>
        <div class="pv-col">
            <section class="card pv-sec">
                <div style="display:flex;justify-content:space-between;align-items:baseline">
                    <h2 style="margin:0">Nível ${lv.n} · ${rankName(lv.n)}</h2>
                    <span class="muted-txt" style="font-size:13px">${lv.xp} XP</span>
                </div>
                <div class="bar"><i style="width:${Math.round(lv.cur / lv.next * 100)}%"></i></div>
                <p class="muted-txt" style="font-size:13px">Faltam ${lv.next - lv.cur} XP para o nível ${lv.n + 1}.</p>
            </section>
            <section class="card pv-sec">
                <h2>Atividade</h2>
                <div class="pv-tiles">
                    ${tile(Object.keys(stats.visited).length, 'páginas')}
                    ${tile(seen + '/' + PLAYABLE.length, 'heróis vistos')}
                    ${tile(favs.length, 'favoritos')}
                    ${tile(done + '/' + ACH.length, 'conquistas')}
                </div>
            </section>
            <section class="card pv-sec">
                <div style="display:flex;justify-content:space-between;align-items:baseline">
                    <h2 style="margin:0">Conquistas</h2>
                    <span class="muted-txt" style="font-size:13px">${done}/${ACH.length}</span>
                </div>
                <div class="pv-ach">${ACH.map((x, i) => {
                    const v = Math.min(x.p(), x.max), ok = v >= x.max;
                    const pct = Math.round(v / x.max * 100);
                    return `<div class="ach-b ${ok ? 'on' : ''}" title="${esc(x.n)}: ${esc(x.d)}">
                        <span class="ach-badge"><i class="fa-solid ${ok ? 'fa-check' : 'fa-lock'}"></i></span>
                        <span class="ach-medal"><i class="fa-solid ${ACH_ICON[i]}"></i></span>
                        <span class="ach-name">${esc(x.n)}</span>
                        ${ok
                            ? '<span class="ach-prog">Concluída</span>'
                            : `<span class="ach-prog">${v}/${x.max}</span><span class="ach-track"><i style="width:${pct}%"></i></span>`}
                    </div>`;
                }).join('')}</div>
            </section>
        </div>`;
}

/* blocos da aba Conquistas */
function levelBlockHTML() {
    const lv = level();
    return `<div style="display:flex;justify-content:space-between;align-items:baseline">
        <b style="font-family:var(--font-ui)">Nível ${lv.n} · ${rankName(lv.n)}</b>
        <span style="color:var(--text-faint);font-size:12.5px">${lv.xp} XP</span></div>
        <div class="bar"><i style="width:${Math.round(lv.cur / lv.next * 100)}%"></i></div>
        <p style="color:var(--text-faint);font-size:12.5px">Faltam ${lv.next - lv.cur} XP para o nível ${lv.n + 1}. Ganhe XP visitando páginas, abrindo heróis, favoritando e personalizando o perfil.</p>`;
}
function activityBlockHTML() {
    const seen = stats.heroesSeen.filter(n => !HEROES_SOON.includes(n)).length;
    const done = ACH.filter(x => x.p() >= x.max).length;
    const tile = (n, l) => `<div class="pv-t"><b>${n}</b><span>${l}</span></div>`;
    return `<div class="pv-tiles">
        ${tile(Object.keys(stats.visited).length, 'páginas')}
        ${tile(seen + '/' + PLAYABLE.length, 'heróis vistos')}
        ${tile(favs.length, 'favoritos')}
        ${tile(done + '/' + ACH.length, 'conquistas')}
        ${tile(level().n, 'nível')}
        ${tile(stats.heroesSeen.length, 'heróis abertos')}</div>`;
}
function achBlockHTML() {
    const done = ACH.filter(x => x.p() >= x.max).length;
    return `<div style="color:var(--text-faint);font-size:12.5px;margin-bottom:12px">${done}/${ACH.length} desbloqueadas</div>
        <div class="ach-list">${ACH.map((x, i) => {
            const v = Math.min(x.p(), x.max), ok = v >= x.max;
            const pct = Math.round(v / x.max * 100);
            return `<div class="ach ${ok ? 'on' : ''}">
                <span class="ic"><i class="fa-solid ${ACH_ICON[i]}"></i></span>
                <div class="ach-info">
                    <b>${esc(x.n)}</b>
                    <div>${esc(x.d)}</div>
                    ${ok ? '' : `<div class="ach-track" style="margin-top:7px"><i style="width:${pct}%"></i></div>`}
                </div>
                <span class="ach-flag">${ok ? '<i class="fa-solid fa-check"></i>' : `${v}/${x.max}`}</span>
            </div>`;
        }).join('')}</div>`;
}

function updateMeter() {
    const p = profile;
    const checks = [
        !!p.nick, !!p.bio, !!p.status, p.title !== 'Jogador', p.mains.length > 0,
        !!(p.links.discord || p.links.twitch || p.links.youtube), !!p.av.img,
        (p.banner !== 'lima' || p.pattern !== 'none' || !!p.bannerImg), p.accent !== 'auto'
    ];
    const pct = Math.round(checks.filter(Boolean).length / checks.length * 100);
    const t = $('#pmtxt'), b = $('#pmbar');
    if (t) t.textContent = `Perfil ${pct}% completo`;
    if (b) b.style.width = pct + '%';
}

function renderProfileUI() {
    renderPTabs();
    renderSideCard();
    renderProfileView();
    renderForm();
    updateChip();
    updateMeter();
}

function renderForm() {
    const p = profile, form = $('#pform');
    form.className = 'card' + (pTab === 'id' ? ' cols' : '');
    const sel = (list, cur) => list.map(v => `<option value="${esc(v)}" ${v === cur ? 'selected' : ''}>${esc(v)}</option>`).join('');
    const swatches = Object.entries(BANNERS).filter(([k]) => k !== 'custom').map(([k, [nm, [c1, c2]]]) =>
        `<button type="button" class="sw ${p.banner === k ? 'on' : ''}" data-bn="${k}" title="${nm}" style="background:linear-gradient(120deg,${c1},${c2})"></button>`).join('');
    const patPills = PATTERNS.map(([k, n]) => `<button type="button" class="pill ${p.pattern === k ? 'on' : ''}" data-pat="${k}">${n}</button>`).join('');
    const shPills = SHAPES.map(([k, n]) => `<button type="button" class="pill ${p.av.shape === k ? 'on' : ''}" data-sh="${k}">${n}</button>`).join('');
    const frPills = FRAMES.map(([k, n]) => `<button type="button" class="pill ${p.av.frame === k ? 'on' : ''}" data-fr="${k}">${n}</button>`).join('');
    const acSw = ACCENTS.map(([c, n]) => `<button type="button" class="sw ${p.accent === c ? 'on' : ''}" data-ac="${c}" title="${n}" style="background:${c === 'auto' ? 'linear-gradient(135deg,#b6f24a,#2f7a1a)' : c}"></button>`).join('');
    const mainsHTML = HEROES.map(h => {
        const i = p.mains.indexOf(h.name);
        return `<button type="button" class="mp ${i >= 0 ? 'on' : ''}" data-mh="${esc(h.name)}">
            <img src="assets/heroes/${h.file}" alt="" onerror="this.remove()">
            <span>${esc(h.name)}</span>${i >= 0 ? `<em>${i + 1}</em>` : ''}</button>`;
    }).join('');
    let html = '';

    if (pTab === 'id') {
        html = `
            <label class="field">Apelido<input data-f="nick" maxlength="20" value="${esc(p.nick)}" placeholder="Como quer ser chamado"></label>
            <label class="field">Pronomes (opcional)<input data-f="pronouns" maxlength="20" value="${esc(p.pronouns)}" placeholder="ex.: ele/dele"></label>
            <label class="field span2">Status<input data-f="status" maxlength="40" value="${esc(p.status)}" placeholder="O que você está fazendo agora?"></label>
            <label class="field span2">Bio<textarea data-f="bio" maxlength="140" placeholder="Conte algo sobre você (até 140 caracteres)">${esc(p.bio)}</textarea></label>
            <label class="field">Título<select data-f="title">${sel(TITLES, p.title)}</select></label>
            <label class="field">Região<select data-f="region">${sel(REGIONS, p.region)}</select></label>
            <div class="pform-sec">Redes sociais</div>
            <label class="field">Discord<input data-f="l_discord" maxlength="30" value="${esc(p.links.discord)}" placeholder="usuário"></label>
            <label class="field">Twitch<input data-f="l_twitch" maxlength="30" value="${esc(p.links.twitch)}" placeholder="canal"></label>
            <label class="field span2">YouTube<input data-f="l_youtube" maxlength="30" value="${esc(p.links.youtube)}" placeholder="canal"></label>`;
    } else if (pTab === 'game') {
        html = `
            <div class="pform-sec">Heróis principais (até 3)</div>
            <p class="field-note">Escolha até 3 heróis. Eles aparecem no seu cartão e na sua lista de destaques.</p>
            <input id="mainsSearch" placeholder="Buscar herói..." style="width:100%;margin:10px 0;background:var(--bg-2);border:1px solid var(--border-2);border-radius:8px;padding:10px 12px;color:var(--text)">
            <div class="mp-pick" id="mpPick">${mainsHTML}</div>`;
    } else if (pTab === 'avatar') {
        const has = !!p.av.img;
        html = `
            <div class="pform-sec">Foto do avatar</div>
            <div class="phbox" id="phbox">
                ${avatarBox(84, p)}
                <div class="phbox-body">
                    <b>${has ? 'Sua foto' : 'Sem foto ainda'}</b>
                    <p>Envie uma imagem (JPG, PNG, WebP, GIF…). Também dá para arrastar uma imagem para cá.</p>
                    <div style="display:flex;gap:8px;flex-wrap:wrap">
                        <label class="btn btn-lime" style="cursor:pointer"><i class="fa-solid fa-camera"></i> ${has ? 'Trocar' : 'Escolher foto'}<input type="file" id="pavFile" accept="image/*" hidden></label>
                        ${has ? `<button type="button" class="btn btn-dark" data-act="avatar-adjust"><i class="fa-solid fa-crop-simple"></i> Reajustar</button>
                        <button type="button" class="btn btn-dark" data-act="avatar-remove"><i class="fa-solid fa-trash"></i> Remover</button>` : ''}
                    </div>
                </div>
            </div>
            ${has && avAdjustOpen ? `<div class="adjust">
                <label>Zoom <input type="range" data-adj="zoom" min="1" max="2.4" step="0.02" value="${p.av.zoom || 1}"></label>
                <label>Horizontal <input type="range" data-adj="px" min="0" max="100" step="1" value="${p.av.px ?? 50}"></label>
                <label>Vertical <input type="range" data-adj="py" min="0" max="100" step="1" value="${p.av.py ?? 50}"></label>
            </div>` : ''}
            <div class="pform-sec">Forma</div>
            <div class="picker-row">${shPills}</div>
            <div class="pform-sec">Moldura</div>
            <div class="picker-row">${frPills}</div>

            <div class="pform-sec">Avatar pronto (arte dos heróis)</div>
            <p class="field-note">Sem foto aí? Clique em um herói para usar a arte dele como seu avatar.</p>
            <div class="av-presets">
                ${HEROES.filter(h => !h.soon).map(h => {
                    const src = 'assets/heroes/' + h.file;
                    return `<button type="button" class="av-preset ${p.av.img === src ? 'on' : ''}" data-avp="${esc(h.file)}" title="${esc(h.name)}"><img src="${esc(src)}" alt="${esc(h.name)}" loading="lazy"></button>`;
                }).join('')}
            </div>
            <div class="picker-row" style="margin-top:10px">
                <button type="button" class="btn btn-dark btn-sm" data-act="avatar-random-hero"><i class="fa-solid fa-shuffle"></i> Sortear herói</button>
                <button type="button" class="btn btn-dark btn-sm" data-act="avatar-clear-color"><i class="fa-solid fa-rotate-left"></i> Cores padrão</button>
            </div>

            <div class="pform-sec">Cor do avatar (quando não tem foto)</div>
            <div class="picker-row av-colors">
                ${AV_COLORS.map(([a, b]) => `<button type="button" class="pill sw ${(p.av.c1 === a && p.av.c2 === b) ? 'on' : ''}" data-avc="${a}|${b}" style="background:linear-gradient(135deg,${a},${b})" title="Usar estas cores"></button>`).join('')}
            </div>
            <div class="grid2" style="margin-top:10px">
                <label class="field">Cor 1<input type="color" data-avcc="c1" value="${p.av.c1 || '#b6f24a'}" style="padding:2px;height:40px"></label>
                <label class="field">Cor 2<input type="color" data-avcc="c2" value="${p.av.c2 || '#2f7a1a'}" style="padding:2px;height:40px"></label>
            </div>`;
    } else if (pTab === 'card') {
        html = `
            <div class="pform-sec">Cor do banner</div>
            <div class="picker-row">${swatches}</div>
            <div class="pform-sec">Padrão</div>
            <div class="picker-row">${patPills}</div>
            <div class="pform-sec">Cores personalizadas</div>
            <div class="grid2">
                <label class="field">Cor 1<input type="color" data-f="bc1" value="${p.bc1}" style="padding:2px;height:40px"></label>
                <label class="field">Cor 2<input type="color" data-f="bc2" value="${p.bc2}" style="padding:2px;height:40px"></label>
            </div>
            <div class="pform-sec">Imagem do banner</div>
            <div class="grid2">
                <label class="field" style="cursor:pointer">Enviar imagem<input type="file" id="bannerFile" accept="image/*" style="padding:8px"></label>
                <button type="button" class="btn btn-dark btn-block" data-act="banner-remove" style="align-self:end;height:44px">Remover imagem</button>
            </div>`;
    } else if (pTab === 'site') {
        html = `
            <div class="pform-sec">Cor de destaque</div>
            <div class="picker-row">${acSw}</div>
            <div class="pform-sec">Preferências</div>
            <div class="grid2">
                <label class="field">Tema<select data-f="theme"><option value="dark" ${p.theme === 'dark' ? 'selected' : ''}>Escuro (Deadlock)</option><option value="light" ${p.theme === 'light' ? 'selected' : ''}>Claro</option></select></label>
                <label class="field">Idioma<select data-f="lang"><option value="pt-BR" ${p.lang === 'pt-BR' ? 'selected' : ''}>Português (Brasil)</option><option value="en-US" ${p.lang === 'en-US' ? 'selected' : ''}>English (US)</option><option value="es-ES" ${p.lang === 'es-ES' ? 'selected' : ''}>Español</option></select></label>
            </div>
            <label class="chk"><input type="checkbox" data-f="compact" ${p.compact ? 'checked' : ''}> Layout compacto (menos espaço nos cards)</label>`;
    } else if (pTab === 'ach') {
        html = `
            <div class="pform-sec">Progresso</div>
            ${levelBlockHTML()}
            <div class="pform-sec">Atividade</div>
            ${activityBlockHTML()}
            <div class="pform-sec">Conquistas</div>
            ${achBlockHTML()}`;
    } else {
        html = `
            <div class="pform-sec">Salvar e restaurar</div>
            <p class="field-note">Tudo é salvo automaticamente neste navegador. Use os botões para gerenciar seus dados.</p>
            <div class="grid2" style="margin-top:6px">
                <button type="button" class="btn btn-lime btn-block" data-act="save"><i class="fa-solid fa-floppy-disk"></i> Salvar</button>
                <button type="button" class="btn btn-dark btn-block" data-act="reset"><i class="fa-solid fa-rotate-left"></i> Redefinir padrão</button>
                <button type="button" class="btn btn-dark btn-block" data-act="export"><i class="fa-solid fa-file-export"></i> Exportar dados</button>
                <label class="btn btn-dark btn-block" style="cursor:pointer"><i class="fa-solid fa-file-import"></i> Importar dados<input type="file" id="importFile" accept="application/json,.json" hidden></label>
            </div>`;
    }
    form.innerHTML = html;
}

function initProfile() {
    const tabs = $('#ptabs'), form = $('#pform');

    // troca de abas
    tabs.addEventListener('click', (e) => {
        const b = e.target.closest('[data-pt]'); if (!b) return;
        pTab = b.dataset.pt;
        renderPTabs(); renderForm();
    });

    // digitação, selects, cores e sliders
    form.addEventListener('input', (e) => {
        const f = e.target.dataset.f;
        if (f) {
            setField(f, e.target.type === 'checkbox' ? e.target.checked : e.target.value);
            saveProfile(); applyProfile();
            if (['nick', 'pronouns', 'status', 'bio', 'title', 'region', 'l_discord', 'l_twitch', 'l_youtube'].includes(f)) touch('id_' + f);
            renderSideCard(); renderProfileView(); updateChip(); updateMeter();
            return;
        }
        if (e.target.id === 'mainsSearch') {
            const q = e.target.value.trim().toLowerCase();
            $$('#mpPick .mp').forEach(b => { b.style.display = !q || b.dataset.mh.toLowerCase().includes(q) ? '' : 'none'; });
            return;
        }
        const adj = e.target.dataset.adj;
        if (adj) { profile.av[adj] = parseFloat(e.target.value); touch('avatar'); commitLight(); return; }
        const avcc = e.target.dataset.avcc;
        if (avcc) { profile.av[avcc] = e.target.value; touch('avatar'); commitLight(); }
    });

    form.addEventListener('change', (e) => {
        if (e.target.id === 'bannerFile') handleBanner(e.target.files[0]);
        else if (e.target.id === 'pavFile') handleAvatar(e.target.files[0]);
        else if (e.target.id === 'importFile') importData(e.target.files[0]);
        else if (e.target.dataset.f === 'bc1' || e.target.dataset.f === 'bc2') { profile.banner = 'custom'; touch('banner'); commit(); }
    });

    form.addEventListener('click', (e) => {
        const bn = e.target.closest('[data-bn]'); if (bn) { profile.banner = bn.dataset.bn; profile.bannerImg = ''; touch('banner'); commit(); return; }
        const pat = e.target.closest('[data-pat]'); if (pat) { profile.pattern = pat.dataset.pat; touch('pattern'); commit(); return; }
        const sh = e.target.closest('[data-sh]'); if (sh) { profile.av.shape = sh.dataset.sh; touch('shape'); commit(); return; }
        const fr = e.target.closest('[data-fr]'); if (fr) { profile.av.frame = fr.dataset.fr; touch('frame'); commit(); return; }
        const avp = e.target.closest('[data-avp]'); if (avp) { profile.av.img = 'assets/heroes/' + avp.dataset.avp; profile.av.zoom = 1; profile.av.px = 50; profile.av.py = 50; touch('avatar'); commit(); showToast('Avatar trocado!'); return; }
        const avc = e.target.closest('[data-avc]');
        if (avc) {
            const v = avc.dataset.avc;
            if (!v) { profile.av.c1 = ''; profile.av.c2 = ''; }
            else { const [a, b] = v.split('|'); profile.av.c1 = a; profile.av.c2 = b; }
            touch('avatar'); commit(); return;
        }
        const ac = e.target.closest('[data-ac]'); if (ac) { profile.accent = ac.dataset.ac; touch('accent'); commit(); return; }
        const mp = e.target.closest('[data-mh]'); if (mp) { toggleMain(mp.dataset.mh); return; }
        const act = e.target.closest('[data-act]');
        if (act) {
            const a = act.dataset.act;
            if (a === 'banner-remove') { profile.bannerImg = ''; commit(); showToast('Imagem do banner removida.'); }
            else if (a === 'avatar-remove') { profile.av.img = ''; profile.av.zoom = 1; profile.av.px = 50; profile.av.py = 50; avAdjustOpen = false; touch('avatar'); commit(); showToast('Foto removida.'); }
            else if (a === 'avatar-adjust') { avAdjustOpen = !avAdjustOpen; renderForm(); }
            else if (a === 'avatar-random-hero') { const h = PLAYABLE[Math.floor(Math.random() * PLAYABLE.length)]; profile.av.img = 'assets/heroes/' + h.file; profile.av.zoom = 1; profile.av.px = 50; profile.av.py = 50; touch('avatar'); commit(); showToast('Avatar sorteado: ' + h.name); }
            else if (a === 'avatar-clear-color') { profile.av.c1 = ''; profile.av.c2 = ''; touch('avatar'); commit(); showToast('Cores do avatar restauradas.'); }
            else if (a === 'save') { saveProfile(); showToast('Perfil salvo!'); }
            else if (a === 'reset') resetProfile();
            else if (a === 'export') exportData();
        }
    });

    // botões do cartão (pré-visualização)
    $('#pavQuick').addEventListener('change', (e) => handleAvatar(e.target.files[0]));
    $('#prand').addEventListener('click', randomizeProfile);
    $('#pdl').addEventListener('click', downloadCard);
    $('#plink').addEventListener('click', copyLink);
    $('#pcp').addEventListener('click', copyText);

    // botões do perfil grande (topo)
    $('#pvEdit').addEventListener('click', () => {
        const el = $('#editorPerfil'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    $('#pvLink').addEventListener('click', copyLink);
    $('#pvDl').addEventListener('click', downloadCard);
    $('#pvGrid').addEventListener('click', (e) => {
        const g = e.target.closest('[data-goto]'); if (!g) return;
        pTab = g.dataset.goto; renderPTabs(); renderForm();
        const el = $('#editorPerfil'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // arrastar imagem sobre o cartão
    const prev = $('#pprev');
    ['dragover', 'dragleave', 'drop'].forEach(ev => prev.addEventListener(ev, (e) => {
        e.preventDefault();
        if (ev === 'dragover') prev.classList.add('drop');
        else if (ev === 'dragleave') prev.classList.remove('drop');
        else { prev.classList.remove('drop'); const f = e.dataTransfer.files[0]; if (f) handleAvatar(f); }
    }));

    renderProfileUI();
}

function setField(f, v) {
    if (f === 'l_discord') profile.links.discord = v;
    else if (f === 'l_twitch') profile.links.twitch = v;
    else if (f === 'l_youtube') profile.links.youtube = v;
    else if (f === 'compact') profile.compact = !!v;
    else profile[f] = v;
}

function commit() { saveProfile(); applyProfile(); renderSideCard(); renderProfileUI(); }
function commitLight() { saveProfile(); applyProfile(); renderSideCard(); renderProfileView(); updateChip(); updateMeter(); }

function toggleMain(name) {
    const i = profile.mains.indexOf(name);
    if (i >= 0) profile.mains.splice(i, 1);
    else { if (profile.mains.length >= 3) profile.mains.shift(); profile.mains.push(name); }
    touch('mains');
    commit();
}

function handleAvatar(file) {
    if (!file || !/^image\//.test(file.type)) { showToast('Selecione uma imagem válida.', 'error'); return; }
    const r = new FileReader();
    r.onload = (ev) => {
        const im = new Image();
        im.onload = () => {
            const sc = Math.min(600 / im.width, 600 / im.height, 1);
            const w = Math.max(1, Math.round(im.width * sc)), h = Math.max(1, Math.round(im.height * sc));
            const c = document.createElement('canvas'); c.width = w; c.height = h;
            c.getContext('2d').drawImage(im, 0, 0, w, h);
            profile.av.img = c.toDataURL('image/jpeg', 0.85);
            profile.av.zoom = 1; profile.av.px = 50; profile.av.py = 50;
            avAdjustOpen = false;
            touch('avatar'); commit(); showToast('Foto atualizada!');
        };
        im.onerror = () => showToast('Não foi possível usar essa imagem.', 'error');
        im.src = ev.target.result;
    };
    r.readAsDataURL(file);
}

function handleBanner(file) {
    if (!file || !/^image\//.test(file.type)) { showToast('Selecione uma imagem válida.', 'error'); return; }
    const r = new FileReader();
    r.onload = (ev) => {
        const im = new Image();
        im.onload = () => {
            const sc = Math.min(1200 / im.width, 500 / im.height, 1);
            const w = Math.max(1, Math.round(im.width * sc)), h = Math.max(1, Math.round(im.height * sc));
            const c = document.createElement('canvas'); c.width = w; c.height = h;
            c.getContext('2d').drawImage(im, 0, 0, w, h);
            profile.bannerImg = c.toDataURL('image/jpeg', 0.8);
            touch('banner'); commit(); showToast('Banner atualizado!');
        };
        im.onerror = () => showToast('Não foi possível usar essa imagem.', 'error');
        im.src = ev.target.result;
    };
    r.readAsDataURL(file);
}

function resetProfile() {
    if (!confirm('Redefinir todas as customizações do perfil?')) return;
    const id = profile.id;
    profile = { ...PROFILE_DEF, id, av: { ...PROFILE_DEF.av }, links: { ...PROFILE_DEF.links } };
    avAdjustOpen = false;
    saveProfile(); applyProfile(); renderProfileUI();
    showToast('Perfil redefinido.');
}

function randomizeProfile() {
    const rnd = (a) => a[Math.floor(Math.random() * a.length)];
    const p = profile;
    p.banner = rnd(Object.keys(BANNERS).filter(k => k !== 'custom'));
    p.bannerImg = '';
    p.pattern = rnd(PATTERNS)[0];
    p.av.shape = rnd(SHAPES)[0];
    p.av.frame = rnd(FRAMES)[0];
    p.accent = rnd(ACCENTS)[0];
    if (!p.nick) p.nick = 'Jogador' + Math.floor(10 + Math.random() * 89);
    ['banner', 'pattern', 'shape', 'frame', 'accent'].forEach(touch);
    commit(); showToast('Visual sorteado! 🎲');
}

/* ---------- compartilhar / baixar o cartão ---------- */
function cardText(p) {
    const lv = level();
    const mains = p.mains.map(heroByName).filter(Boolean).map(h => h.name).join(', ');
    const lk = [['Discord', p.links.discord], ['Twitch', p.links.twitch], ['YouTube', p.links.youtube]]
        .filter(x => x[1]).map(([k, v]) => `${k}: ${v}`).join(' · ');
    return [
        `${p.nick || 'Jogador'} — Central Deadlock`,
        p.title ? `Título: ${p.title}` : '',
        p.region ? `Região: ${p.region}` : '',
        p.status ? `Status: ${p.status}` : '',
        p.bio ? `Bio: ${p.bio}` : '',
        mains ? `Heróis favoritos: ${mains}` : '',
        lk,
        `Nível ${lv.n} · ${rankName(lv.n)} (${lv.xp} XP)`,
        `ID ${p.id}`
    ].filter(Boolean).join('\n');
}

function encShare(p) {
    try { return btoa(unescape(encodeURIComponent(JSON.stringify(p)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
    catch (e) { return ''; }
}
function decShare(s) {
    return JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/')))));
}

async function copyText() {
    const txt = cardText(profile);
    try { await navigator.clipboard.writeText(txt); showToast('Texto do cartão copiado!'); }
    catch (e) { window.prompt('Copie o texto do cartão:', txt); }
}

async function copyLink() {
    const url = location.href.split('#')[0] + '#share=' + encShare(profile);
    try { await navigator.clipboard.writeText(url); showToast('Link do cartão copiado!'); }
    catch (e) { window.prompt('Copie o link do cartão:', url); }
}

function exportData() {
    const data = JSON.stringify({ v: 1, profile, favs, stats }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'central-deadlock-perfil.json';
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('Dados exportados!');
}

function importData(file) {
    if (!file) return;
    const r = new FileReader();
    r.onload = (ev) => {
        try {
            const d = JSON.parse(ev.target.result);
            if (d.profile) {
                profile = Object.assign({}, PROFILE_DEF, d.profile, {
                    links: { ...PROFILE_DEF.links, ...(d.profile.links || {}) },
                    av: { ...PROFILE_DEF.av, ...(d.profile.av || {}) },
                    mains: Array.isArray(d.profile.mains) ? d.profile.mains.filter(n => heroByName(n)).slice(0, 3) : []
                });
                saveProfile();
            }
            if (Array.isArray(d.favs)) { favs = d.favs; store.set('cdl_favs', favs); }
            if (d.stats) { stats = Object.assign(stats, d.stats); saveStats(); }
            applyProfile(); renderProfileUI(); renderFavs();
            showToast('Dados importados!');
        } catch (e) { showToast('Arquivo inválido.', 'error'); }
    };
    r.readAsText(file);
}

/* ---------- exportar o cartão como imagem (canvas) ---------- */
function roundRectPath(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}
function shapePath(ctx, x, y, size, shape) {
    const poly = POLY[shape];
    if (poly) {
        ctx.beginPath();
        poly.forEach(([px, py], i) => {
            const cx = x + size / 2 + px * size / 2, cy = y + size / 2 + py * size / 2;
            i ? ctx.lineTo(cx, cy) : ctx.moveTo(cx, cy);
        });
        ctx.closePath();
    } else if (shape === 'circle') {
        ctx.beginPath(); ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2); ctx.closePath();
    } else {
        roundRectPath(ctx, x, y, size, size, size * 0.22);
    }
}
function loadImg(src) {
    return new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
}
function drawCover(ctx, im, x, y, w, h) {
    const s = Math.max(w / im.width, h / im.height);
    const dw = im.width * s, dh = im.height * s;
    ctx.drawImage(im, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}
function wrapText(ctx, text, x, y, maxW, lh, maxLines) {
    const words = String(text).split(/\s+/);
    let line = '', n = 0;
    for (let i = 0; i < words.length; i++) {
        const test = line ? line + ' ' + words[i] : words[i];
        if (ctx.measureText(test).width > maxW && line) {
            if (n === maxLines - 1) {
                let t = line;
                while (ctx.measureText(t + '…').width > maxW && t.length > 1) t = t.slice(0, -1);
                ctx.fillText(t + '…', x, y + n * lh);
                return;
            }
            ctx.fillText(line, x, y + n * lh); n++; line = words[i];
        } else line = test;
    }
    if (line && n < maxLines) ctx.fillText(line, x, y + n * lh);
}

/* Desenha o padrão do banner no PNG baixado (o mesmo desenho que aparece na tela). */
function drawPattern(ctx, padrao, x, y, w, h) {
    if (!padrao || padrao === 'none') return;
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    const riscos = (cor, esp) => { ctx.strokeStyle = cor; ctx.lineWidth = esp; };

    if (padrao === 'grid') {
        riscos('rgba(255,255,255,.14)', 1);
        for (let px = x; px < x + w; px += 24) { ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px, y + h); ctx.stroke(); }
        for (let py = y; py < y + h; py += 24) { ctx.beginPath(); ctx.moveTo(x, py); ctx.lineTo(x + w, py); ctx.stroke(); }
    } else if (padrao === 'dots' || padrao === 'dotsbig') {
        const passo = padrao === 'dotsbig' ? 34 : 18, r = padrao === 'dotsbig' ? 4 : 1.6;
        ctx.fillStyle = 'rgba(255,255,255,.30)';
        for (let px = x + passo / 2; px < x + w; px += passo)
            for (let py = y + passo / 2; py < y + h; py += passo) { ctx.beginPath(); ctx.arc(px, py, r, 0, 7); ctx.fill(); }
    } else if (padrao === 'diag' || padrao === 'vstripes') {
        riscos('rgba(255,255,255,.12)', 2);
        if (padrao === 'vstripes') {
            for (let px = x; px < x + w; px += 12) { ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px, y + h); ctx.stroke(); }
        } else {
            for (let px = x - h; px < x + w; px += 14) { ctx.beginPath(); ctx.moveTo(px, y + h); ctx.lineTo(px + h, y); ctx.stroke(); }
        }
    } else if (padrao === 'checks') {
        const passo = 20;
        ctx.fillStyle = 'rgba(255,255,255,.15)';
        for (let i = 0, px = x; px < x + w; px += passo, i++)
            for (let j = 0, py = y; py < y + h; py += passo, j++)
                if ((i + j) % 2 === 0) ctx.fillRect(px, py, passo, passo);
    } else if (padrao === 'diamonds') {
        riscos('rgba(255,255,255,.10)', 1);
        for (let px = x - h; px < x + w; px += 16) { ctx.beginPath(); ctx.moveTo(px, y + h); ctx.lineTo(px + h, y); ctx.stroke(); }
        for (let px = x; px < x + w + h; px += 16) { ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px - h, y + h); ctx.stroke(); }
    } else if (padrao === 'chevron') {
        riscos('rgba(255,255,255,.16)', 2);
        const largura = 18, altura = 9;
        for (let py = y; py < y + h + altura; py += altura * 2) {
            ctx.beginPath(); ctx.moveTo(x, py);
            for (let px = x; px < x + w; px += largura) { ctx.lineTo(px + largura / 2, py + altura); ctx.lineTo(px + largura, py); }
            ctx.stroke();
        }
    } else if (padrao === 'rays') {
        riscos('rgba(255,255,255,.14)', 3);
        const cx = x + w / 2, cy = y - h * 0.2, alcance = w + h;
        for (let grau = 0; grau < 360; grau += 16) {
            const rad = grau * Math.PI / 180;
            ctx.beginPath(); ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(rad) * alcance, cy + Math.sin(rad) * alcance); ctx.stroke();
        }
    } else if (padrao === 'rings') {
        riscos('rgba(255,255,255,.14)', 2);
        const cx = x + w / 2, cy = y + h * 1.3;
        for (let r = 20; r < w; r += 16) { ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke(); }
    } else if (padrao === 'glow') {
        const g = ctx.createRadialGradient(x + w * 0.25, y - h * 0.1, 0, x + w * 0.25, y - h * 0.1, w * 0.75);
        g.addColorStop(0, 'rgba(255,255,255,.5)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    } else if (padrao === 'noise') {
        ctx.fillStyle = 'rgba(255,255,255,.22)';
        for (let i = 0; i < Math.round(w * h / 85); i++) ctx.fillRect(x + Math.random() * w, y + Math.random() * h, 1, 1);
    }
    ctx.restore();
}

async function downloadCard() {
    const p = profile;
    const W = 1000, H = 600;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    const lime = (p.accent && p.accent !== 'auto') ? p.accent : '#b6f24a';
    const font = 'Inter, "Segoe UI", system-ui, sans-serif';

    ctx.fillStyle = '#0e1013'; ctx.fillRect(0, 0, W, H);

    // banner
    const bx = 26, by = 26, bw = W - 52, bh = 200;
    ctx.save();
    roundRectPath(ctx, bx, by, bw, bh, 18); ctx.clip();
    let drewImg = false;
    if (p.bannerImg) { const im = await loadImg(p.bannerImg); if (im) { drawCover(ctx, im, bx, by, bw, bh); drewImg = true; } }
    if (!drewImg) {
        const [a, b] = bannerColors(p);
        const g = ctx.createLinearGradient(bx, 0, bx + bw, 0); g.addColorStop(0, a); g.addColorStop(1, b);
        ctx.fillStyle = g; ctx.fillRect(bx, by, bw, bh);
        drawPattern(ctx, p.pattern, bx, by, bw, bh);
    }
    ctx.restore();

    // avatar
    const as = 132, ax = 66, ay = 150;
    const im = p.av.img ? await loadImg(p.av.img) : null;
    if (p.av.frame !== 'none') {
        ctx.fillStyle = p.av.frame === 'gold' ? '#e2b94b' : lime;
        shapePath(ctx, ax - 7, ay - 7, as + 14, p.av.shape); ctx.fill();
    }
    ctx.save();
    shapePath(ctx, ax, ay, as, p.av.shape); ctx.clip();
    if (im) {
        const zoom = p.av.zoom || 1, px = p.av.px ?? 50, py = p.av.py ?? 50;
        const s = Math.max(as / im.width, as / im.height) * zoom;
        const dw = im.width * s, dh = im.height * s;
        ctx.drawImage(im, ax + (as - dw) * (px / 100), ay + (as - dh) * (py / 100), dw, dh);
    } else {
        const [a, b] = bannerColors(p);
        const g = ctx.createLinearGradient(ax, ay, ax + as, ay + as); g.addColorStop(0, a); g.addColorStop(1, b);
        ctx.fillStyle = g; ctx.fillRect(ax, ay, as, as);
    }
    ctx.restore();
    if (!im) {
        ctx.fillStyle = '#fff'; ctx.font = `900 ${Math.round(as * 0.34)}px ${font}`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(avatarInner(p), ax + as / 2, ay + as / 2);
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    }

    // textos
    const lv = level();
    const tx = ax + as + 34;
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.font = `600 15px ${font}`;
    ctx.fillText('CENTRAL DEADLOCK', tx, by + bh + 44);
    ctx.fillStyle = '#fff'; ctx.font = `800 46px ${font}`;
    ctx.fillText((p.nick || 'Seu apelido').slice(0, 22), tx, by + bh + 94);
    ctx.fillStyle = lime; ctx.font = `700 18px ${font}`;
    ctx.fillText(`${p.title || 'Jogador'}${p.region ? ' · ' + p.region : ''}`, tx, by + bh + 126);
    ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.font = `400 17px ${font}`;
    if (p.status) ctx.fillText(`“${p.status}”`.slice(0, 60), tx, by + bh + 156);
    ctx.fillStyle = 'rgba(255,255,255,.62)'; ctx.font = `400 16px ${font}`;
    wrapText(ctx, p.bio || 'Escreva uma bio para aparecer aqui.', tx, by + bh + 190, W - tx - 40, 22, 2);

    // heróis principais
    const mains = p.mains.map(heroByName).filter(Boolean);
    if (mains.length) {
        ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.font = `700 13px ${font}`;
        ctx.fillText('HERÓIS PRINCIPAIS', 66, 414);
        let cx = 66; const cy = 430;
        mains.forEach((h) => {
            ctx.fillStyle = 'rgba(255,255,255,.07)';
            roundRectPath(ctx, cx, cy, 150, 46, 10); ctx.fill();
            ctx.fillStyle = lime; roundRectPath(ctx, cx + 6, cy + 6, 34, 34, 8); ctx.fill();
            ctx.fillStyle = '#0c0c0e'; ctx.font = `800 15px ${font}`; ctx.textAlign = 'center';
            ctx.fillText(initials(h.name), cx + 23, cy + 28);
            ctx.textAlign = 'left';
            ctx.fillStyle = '#fff'; ctx.font = `700 14px ${font}`;
            ctx.fillText(h.name.slice(0, 13), cx + 48, cy + 22);
            ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.font = `400 11px ${font}`;
            ctx.fillText(h.role || '', cx + 48, cy + 37);
            cx += 158;
        });
    }

    // rodapé
    const lk = [['Discord', p.links.discord], ['Twitch', p.links.twitch], ['YouTube', p.links.youtube]]
        .filter(x => x[1]).map(([k, v]) => `${k}: ${v}`).join('   ');
    if (lk) { ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.font = `500 15px ${font}`; ctx.fillText(lk.slice(0, 72), 66, 516); }
    ctx.fillStyle = lime; ctx.font = `700 15px ${font}`;
    ctx.fillText(`Nível ${lv.n} · ${rankName(lv.n)} · ${lv.xp} XP`, 66, 544);
    ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.font = `500 13px ${font}`;
    ctx.fillText(`ID ${p.id}`, 66, 570);

    try {
        const url = c.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url; a.download = (p.nick || 'cartao').replace(/[^\w\-]+/g, '_') + '-central-deadlock.png';
        a.click();
        showToast('Cartão baixado!');
    } catch (e) { showToast('Não foi possível gerar a imagem.', 'error'); }
}

/* ---------- cartão compartilhado por link ---------- */
function checkSharedCard() {
    const m = location.hash.match(/^#share=(.+)$/);
    if (!m) return;
    let raw;
    try { raw = decShare(m[1]); } catch (e) { return; }
    if (!raw || typeof raw !== 'object') return;
    const p = Object.assign({}, PROFILE_DEF, raw, {
        links: { ...PROFILE_DEF.links, ...(raw.links || {}) },
        av: { ...PROFILE_DEF.av, ...(raw.av || {}) },
        mains: Array.isArray(raw.mains) ? raw.mains.filter(n => heroByName(n)).slice(0, 3) : []
    });
    const box = $('#shareModalBox'); if (!box) return;
    box.innerHTML = `<button type="button" class="modal-close" data-close="shareModal" aria-label="Fechar">&times;</button>
        <div class="modal-head"><h2>Cartão compartilhado</h2><p>Este cartão veio de um link. Os dados ficam salvos no próprio link.</p></div>
        <div style="max-width:380px;margin:10px auto 0">${profileCardHTML(p)}</div>
        <div class="modal-foot"><button type="button" class="btn btn-lime" data-close="shareModal">Fechar</button></div>`;
    openOverlay($('#shareModal'));
    history.replaceState(null, '', location.pathname + location.search);
}

function applyProfile() {
    document.documentElement.setAttribute('data-theme', profile.theme);
    document.body.classList.toggle('compact', !!profile.compact);
    const root = document.documentElement.style;
    if (profile.accent && profile.accent !== 'auto') root.setProperty('--lime', profile.accent);
    else root.removeProperty('--lime');
}

function updateChip() {
    const nick = profile.nick || 'Jogador';
    $('#chipName').textContent = nick;
    $('#chipId').textContent = profile.id;
    const chip = $('#chipAvatar');
    if (profile.av.img) { chip.style.backgroundImage = `url('${profile.av.img}')`; chip.textContent = ''; }
    else { chip.style.backgroundImage = ''; chip.textContent = nick.charAt(0).toUpperCase(); }
}

/* ================= toast ================= */
function initToast() { /* usa showToast */ }
function showToast(msg, type = 'success') {
    const toast = $('#toast');
    const icon = toast.querySelector('i');
    $('#toast-msg').textContent = msg;
    icon.className = type === 'error' ? 'fa-solid fa-circle-exclamation' : 'fa-solid fa-check-circle';
    toast.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove('show'), 2600);
}

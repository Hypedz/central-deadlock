/* ============================================================
   CENTRAL DEADLOCK - botão de trocar o tema (claro / escuro)

   Este arquivo é carregado cedo (no <head>) para o site já abrir
   na cor certa, sem piscar. Ele:
     - lê o tema salvo no navegador (chave "cdl_profile");
     - se ainda não houver nada salvo, segue o tema do sistema;
     - liga todos os botões marcados com [data-tema-btn].

   O script.js (Home) também aplica o tema. Para os dois não brigarem,
   quem troca avisa o outro pelo evento "cdl-tema".
   ============================================================ */

(function () {
    var CHAVE = 'cdl_profile';
    var raiz = document.documentElement;

    function lerPerfil() {
        try {
            var dado = JSON.parse(localStorage.getItem(CHAVE));
            return (dado && typeof dado === 'object') ? dado : {};
        } catch (e) {
            return {};
        }
    }

    function temaDoSistema() {
        return (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
    }

    function normalizar(tema) {
        return tema === 'light' ? 'light' : (tema === 'dark' ? 'dark' : temaDoSistema());
    }

    /* ===== cor de destaque escolhida em "Meu Perfil > Site" =====
       A Home aplica essa cor no script.js. As páginas internas (herói,
       notícia, item, counter, guia) não carregam o script.js, então ela
       também precisa ser aplicada aqui - é o mesmo cálculo, para a cor
       ficar igual em todo o site. */
    function hexParaRgb(hex) {
        var h = String(hex || '').replace('#', '').trim();
        if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
        var n = parseInt(h, 16);
        if (!isFinite(n)) return [182, 242, 74];
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }

    function rgbParaHex(rgb) {
        return '#' + rgb.map(function (c) {
            return Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0');
        }).join('');
    }

    function luminanciaRgb(rgb) {
        function f(v) {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        }
        return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]);
    }

    function misturarRgb(rgb, alvo, quanto) {
        return rgb.map(function (c, i) { return c + (alvo[i] - c) * quanto; });
    }

    /* clareia (tema escuro) ou escurece (tema claro) até a cor ficar legível */
    function ajustarDestaque(hex, tema) {
        var rgb = hexParaRgb(hex);
        var escuro = tema !== 'light';
        var alvo = escuro ? [255, 255, 255] : [0, 0, 0];
        for (var i = 0; i < 24; i++) {
            var l = luminanciaRgb(rgb);
            if (escuro ? l >= 0.30 : l <= 0.15) break;
            rgb = misturarRgb(rgb, alvo, 0.09);
        }
        return rgb;
    }

    function aplicarDestaque(tema) {
        var estilo = document.documentElement.style;
        var perfil = lerPerfil();
        var escolhida = (perfil.accent && perfil.accent !== 'auto') ? perfil.accent : '';

        if (!escolhida) {
            estilo.removeProperty('--lime');
            estilo.removeProperty('--lime-rgb');
            estilo.removeProperty('--on-lime');
            return;
        }

        var rgb = ajustarDestaque(escolhida, tema);
        estilo.setProperty('--lime', rgbParaHex(rgb));
        estilo.setProperty('--lime-rgb', rgb.map(function (c) { return Math.round(c); }).join(', '));
        estilo.setProperty('--on-lime', luminanciaRgb(rgb) > 0.18 ? '#0c0c0e' : '#ffffff');
    }

    /* aplica o tema na página e deixa os botões com o texto/ícone certos */
    function aplicar(tema) {
        var escolhido = normalizar(tema);
        raiz.setAttribute('data-theme', escolhido);
        aplicarDestaque(escolhido);

        var escuro = escolhido !== 'light';
        var rotulo = escuro ? 'Mudar para o tema claro' : 'Mudar para o tema escuro';
        var texto = escuro ? 'Tema claro' : 'Tema escuro';
        var icone = escuro ? 'fa-solid fa-sun' : 'fa-solid fa-moon';

        Array.prototype.forEach.call(document.querySelectorAll('[data-tema-btn]'), function (botao) {
            botao.setAttribute('aria-label', rotulo);
            botao.setAttribute('title', rotulo);
            var i = botao.querySelector('i');
            if (i) i.className = icone;
            var span = botao.querySelector('[data-tema-texto]');
            if (span) span.textContent = texto;
        });

        return escolhido;
    }

    function alternar() {
        var novo = (raiz.getAttribute('data-theme') === 'light') ? 'dark' : 'light';

        var perfil = lerPerfil();
        perfil.theme = novo;
        try {
            localStorage.setItem(CHAVE, JSON.stringify(perfil));
        } catch (e) { }

        aplicar(novo);
        try {
            document.dispatchEvent(new CustomEvent('cdl-tema', { detail: { tema: novo } }));
        } catch (e) { }
        return novo;
    }

    /* já aplica antes do site aparecer (evita o "flash" branco/escuro) */
    aplicar(lerPerfil().theme);

    window.aplicarTema = aplicar;
    window.alternarTema = alternar;

    function ligarBotoes() {
        Array.prototype.forEach.call(document.querySelectorAll('[data-tema-btn]'), function (botao) {
            if (botao.dataset.temaLigado === '1') return;
            botao.dataset.temaLigado = '1';
            botao.addEventListener('click', alternar);
        });
        aplicar(raiz.getAttribute('data-theme'));
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ligarBotoes);
    else ligarBotoes();
})();

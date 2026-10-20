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

    /* aplica o tema na página e deixa os botões com o texto/ícone certos */
    function aplicar(tema) {
        var escolhido = normalizar(tema);
        raiz.setAttribute('data-theme', escolhido);

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

/* ============================================================
   CENTRAL DEADLOCK - estatísticas sem cookies (opcional)

   O site NÃO manda nada para nenhum serviço enquanto o código abaixo
   estiver vazio. Para ativar, crie uma conta gratuita no GoatCounter
   (https://www.goatcounter.com), escolha um código (ex.: centraldeadlock)
   e preencha as duas linhas. O GoatCounter não usa cookies e não guarda
   o IP dos visitantes.

   Depois de ativar, os eventos aparecem no painel do GoatCounter.
   Para testar sem enviar nada, abra o site com ?analytics=debug e veja
   o console do navegador.
   ============================================================ */

window.CDL_ANALYTICS = window.CDL_ANALYTICS || {
    provider: '',       // 'goatcounter' para ativar; deixe '' para desligar
    goatcounter: '',    // ex.: 'centraldeadlock' (sem .goatcounter.com)
    debug: false        // true mostra os eventos no console
};

(function () {
    'use strict';

    var config = window.CDL_ANALYTICS || {};
    var provedor = String(config.provider || '').toLowerCase();
    var codigo = String(config.goatcounter || '').trim();
    var debug = !!config.debug || /[?&]analytics=debug(?:[&#]|$)/.test(location.search);
    var ativo = provedor === 'goatcounter' && codigo && codigo !== 'SEUCODIGO';
    var pronto = false;
    var fila = [];

    function caminho() {
        var p = location.pathname || '/';
        return p.replace(/\/index\.html$/, '/') || '/';
    }

    function registrar(nome, dados) {
        if (!debug) return;
        try {
            console.info('[Central Deadlock analytics]', nome, dados || {});
        } catch (e) { /* console indisponível */ }
    }

    function enviar(evento) {
        if (!ativo) return;
        if (!window.goatcounter || typeof window.goatcounter.count !== 'function') return;
        try {
            window.goatcounter.count({
                path: evento.evento ? 'evento/' + evento.nome : evento.caminho,
                title: evento.titulo || evento.nome,
                event: evento.evento,
                referrer: evento.evento ? undefined : (document.referrer || undefined)
            });
        } catch (e) { /* nunca deixa uma estatística quebrar o site */ }
    }

    function liberarFila() {
        pronto = true;
        var pendentes = fila.splice(0);
        pendentes.forEach(enviar);
    }

    /* Use window.cdlTrack('nome_do_evento', {dado: 'valor'}) em qualquer
       página. Sem provedor configurado, a função só não faz nada. */
    function track(nome, dados) {
        var evento = {
            nome: String(nome || 'evento').slice(0, 80),
            caminho: caminho(),
            titulo: document.title,
            evento: true,
            dados: dados || {}
        };
        registrar(evento.nome, evento.dados);
        if (!ativo) return;
        if (!pronto) {
            fila.push(evento);
            return;
        }
        enviar(evento);
    }

    window.cdlTrack = track;

    if (!ativo) {
        if (debug) registrar('analytics_desativado', { provider: provedor, goatcounter: codigo });
        return;
    }

    /* GoatCounter: carregamos o contador só quando há um código configurado.
       A página é contada manualmente para não incluir ?build=... no caminho. */
    window.goatcounter = window.goatcounter || {};
    window.goatcounter.no_onload = true;

    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://gc.zgo.at/count.js';
    script.setAttribute('data-goatcounter', 'https://' + codigo + '.goatcounter.com/count');
    script.onload = function () {
        try {
            window.goatcounter.count({
                path: caminho(),
                title: document.title,
                referrer: document.referrer || undefined
            });
        } catch (e) { /* segue o jogo */ }
        liberarFila();
    };
    script.onerror = function () {
        registrar('analytics_erro_carregar', {});
    };
    document.head.appendChild(script);
})();

/* ================= páginas internas: menu e atalhos =================
   As páginas de herói, notícia, item, counter e guia usam a mesma barra
   lateral da Home, mas não carregam o script.js (que é o "motor" da Home).
   Este arquivo pequeno só liga o menu do celular e os botões que voltam
   para a Home. */
(function () {
    'use strict';

    var script = document.currentScript;
    var prefixo = (script && script.getAttribute('data-prefixo')) || '';

    function irParaHome(hash) {
        window.location.href = prefixo + 'index.html' + (hash || '');
    }

    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebarOverlay');
    var burger = document.getElementById('menuBurger');
    var focoAnterior = null;

    function focaveis() {
        if (!sidebar) return [];
        var seletor = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
        return Array.prototype.filter.call(sidebar.querySelectorAll(seletor), function (el) {
            return !el.hidden && el.getAttribute('aria-hidden') !== 'true'
                && (el.offsetWidth || el.offsetHeight || el.getClientRects().length);
        });
    }

    function abrirMenu() {
        focoAnterior = document.activeElement;
        if (sidebar) sidebar.classList.add('open');
        if (overlay) overlay.classList.add('show');
        document.body.style.overflow = 'hidden';
        if (burger) burger.setAttribute('aria-expanded', 'true');
        setTimeout(function () {
            var alvo = sidebar && (sidebar.querySelector('.sidebar-close') || focaveis()[0]);
            if (alvo) alvo.focus();
        }, 30);
    }

    function fecharMenu() {
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('show');
        document.body.style.overflow = '';
        if (burger) burger.setAttribute('aria-expanded', 'false');
        if (focoAnterior && document.contains(focoAnterior)) {
            try { focoAnterior.focus({ preventScroll: true }); } catch (e) { focoAnterior.focus(); }
        }
        focoAnterior = null;
    }

    if (burger) burger.addEventListener('click', abrirMenu);

    var fechar = document.getElementById('closeSidebar');
    if (fechar) fechar.addEventListener('click', function (e) {
        /* o X fica dentro do link da marca: não pode abrir a Home junto */
        e.preventDefault();
        e.stopPropagation();
        fecharMenu();
    });

    if (overlay) overlay.addEventListener('click', fecharMenu);

    document.addEventListener('keydown', function (e) {
        if (!sidebar || !sidebar.classList.contains('open')) return;
        if (e.key === 'Escape') {
            e.preventDefault();
            fecharMenu();
            return;
        }
        if (e.key !== 'Tab') return;
        var lista = focaveis();
        if (!lista.length) return;
        var primeiro = lista[0];
        var ultimo = lista[lista.length - 1];
        if (e.shiftKey && document.activeElement === primeiro) {
            e.preventDefault();
            ultimo.focus();
        } else if (!e.shiftKey && document.activeElement === ultimo) {
            e.preventDefault();
            primeiro.focus();
        }
    });

    ['btnBusca', 'btnBuscaTop'].forEach(function (id) {
        var botao = document.getElementById(id);
        if (botao) botao.addEventListener('click', function () { irParaHome('#buscar'); });
    });

    ['btnProfileTop', 'userChip'].forEach(function (id) {
        var botao = document.getElementById(id);
        if (botao) botao.addEventListener('click', function () { irParaHome('#perfil'); });
    });

    /* marca no menu a seção de onde a página veio (ex.: Heróis) */
    var trilha = document.querySelector('.pg-top[data-secao]');
    var secao = trilha ? trilha.getAttribute('data-secao') : '';
    if (secao) {
        var atual = document.querySelector('.sidebar-nav .nav-item[data-section="' + secao + '"]');
        if (atual) {
            Array.prototype.forEach.call(document.querySelectorAll('.sidebar-nav .nav-item.active'), function (item) {
                item.classList.remove('active');
            });
            atual.classList.add('active');
        }
    }

    /* respeita o "menu enxuto" do perfil: esconde as abas desmarcadas */
    var perfil = {};
    try { perfil = JSON.parse(localStorage.getItem('cdl_profile') || '{}') || {}; } catch (e) { perfil = {}; }
    var ocultos = Array.isArray(perfil.menuOculto) ? perfil.menuOculto : [];
    ocultos.forEach(function (id) {
        var item = document.querySelector('.sidebar-nav .nav-item[data-section="' + id + '"]');
        if (item) item.classList.add('oculto');
    });
    Array.prototype.forEach.call(document.querySelectorAll('.sidebar-nav .nav-bloco'), function (bloco) {
        var grupo = bloco.querySelector('.nav-group');
        if (!grupo) return;
        var temVisivel = Array.prototype.some.call(bloco.children, function (el) {
            return !el.classList.contains('nav-group') && !el.classList.contains('oculto');
        });
        grupo.classList.toggle('oculto', !temVisivel);
    });
})();

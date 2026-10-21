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

    function abrirMenu() {
        if (sidebar) sidebar.classList.add('open');
        if (overlay) overlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    function fecharMenu() {
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('show');
        document.body.style.overflow = '';
    }

    var burger = document.getElementById('menuBurger');
    if (burger) burger.addEventListener('click', abrirMenu);

    var fechar = document.getElementById('closeSidebar');
    if (fechar) fechar.addEventListener('click', function (e) {
        /* o X fica dentro do link da marca: não pode abrir a Home junto */
        e.preventDefault();
        e.stopPropagation();
        fecharMenu();
    });

    if (overlay) overlay.addEventListener('click', fecharMenu);

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
})();

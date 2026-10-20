/* ============================================================
   CENTRAL DEADLOCK - ligar o "service worker" nas páginas
   de herói e de notícia (as que são geradas sozinhas).

   O service worker é o que faz o site:
     - poder ser instalado no celular (vira um app, com ícone);
     - abrir rápido e continuar funcionando sem internet.

   O index.html já faz isso dentro do script.js. Este arquivo
   existe para as páginas geradas, que não usam o script.js.
   ============================================================ */

(function () {
    if (!('serviceWorker' in navigator)) return;

    /* Descobre o endereço do sw.js a partir do endereço DESTE arquivo.
       Assim funciona de qualquer página, sem quebrar o caminho. */
    var euMesmo = (document.currentScript && document.currentScript.src) || '';
    var endereco = euMesmo ? euMesmo.replace(/pwa\.js.*$/, 'sw.js') : 'sw.js';

    /* Na primeira visita o app se instala (nada a avisar). Depois disso,
       quando o site troca de versão, aparece o aviso "Atualizar agora". */
    var jaEraControlada = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
        if (jaEraControlada) avisarVersaoNova();
    });

    navigator.serviceWorker.register(endereco).then(function (reg) {
        if (reg.waiting && navigator.serviceWorker.controller) avisarVersaoNova();

        reg.addEventListener('updatefound', function () {
            var novo = reg.installing;
            if (!novo) return;
            novo.addEventListener('statechange', function () {
                if (novo.state === 'installed' && navigator.serviceWorker.controller) avisarVersaoNova();
            });
        });

        // procura atualização quando a pessoa volta para a aba
        document.addEventListener('visibilitychange', function () {
            if (document.visibilityState === 'visible') reg.update().catch(function () {});
        });
    }).catch(function () {});

    /* Avisinho de "nova versão disponível". */
    function avisarVersaoNova() {
        if (document.getElementById('avisoVersao')) return;
        var cx = document.createElement('div');
        cx.id = 'avisoVersao';
        cx.className = 'aviso-versao';
        cx.innerHTML = '<i class="fa-solid fa-rotate"></i>' +
            '<span>Nova versão do site disponível!</span>' +
            '<button type="button" class="btn btn-lime btn-sm" id="avisoAtualizar">Atualizar agora</button>' +
            '<button type="button" class="aviso-x" id="avisoFechar" aria-label="Fechar aviso"><i class="fa-solid fa-xmark"></i></button>';
        document.body.appendChild(cx);
        document.getElementById('avisoAtualizar').onclick = function () {
            this.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Atualizando...';
            location.reload();
        };
        document.getElementById('avisoFechar').onclick = function () { cx.parentNode.removeChild(cx); };
    }

    /* Aviso de "sem internet": aparece em qualquer página do site. */
    function avisarOffline() {
        var barra = document.getElementById('barraOffline');
        if (!barra) {
            barra = document.createElement('div');
            barra.id = 'barraOffline';
            barra.className = 'offline-bar';
            barra.setAttribute('role', 'status');
            barra.innerHTML = '<i class="fa-solid fa-wifi"></i><span>Você está sem internet. Mostrando o que já foi baixado.</span>';
            document.body.appendChild(barra);
        }
        document.body.classList.toggle('offline', navigator.onLine === false);
    }
    window.addEventListener('online', avisarOffline);
    window.addEventListener('offline', avisarOffline);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', avisarOffline);
    else avisarOffline();
})();

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

    navigator.serviceWorker.register(endereco).catch(function () {});
})();

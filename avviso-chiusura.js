// Avviso straordinario: soltanto il 25 novembre 2026, ora italiana.
(() => {
  'use strict';
  const start = Date.parse('2026-11-25T00:00:00+01:00');
  const expires = Date.parse('2026-11-26T00:00:00+01:00');
  if (Date.now() < start || Date.now() >= expires) return;
  const imageUrl = new URL('avvisi-assets/chiusura-20261125.webp', document.currentScript.src).href;
  function showNotice() {
    if (Date.now() >= expires || document.getElementById('cc-closure-notice')) return;
    const previousFocus = document.activeElement;
    const dialog = document.createElement('dialog');
    dialog.id = 'cc-closure-notice';
    dialog.setAttribute('aria-label', 'Stasera chiuso per psicoterapia straordinaria. Domani riapriamo!');
    dialog.style.cssText = 'box-sizing:border-box;width:min(92vw,660px);max-width:92vw;max-height:94dvh;padding:0;border:2px solid #cba76d;border-radius:16px;background:#082a43;color:#fffaf0;overflow:auto;box-shadow:0 20px 80px #0009;';
    const style = document.createElement('style');
    style.textContent = '#cc-closure-notice::backdrop{background:rgba(4,20,34,.82)}#cc-closure-notice:focus-visible{outline:3px solid #efbd36}#cc-closure-notice button:focus-visible{outline:3px solid #efbd36;outline-offset:3px}';
    const image = document.createElement('img');
    image.src = imageUrl;
    image.alt = 'Controcorrente — Chiuso per psicoterapia straordinaria. Solo per stasera. Domani riapriamo! Il cameriere e la cuoca si concedono una pausa sul divano.';
    image.width = 1254;
    image.height = 1254;
    image.style.cssText = 'display:block;width:100%;height:auto;max-height:calc(94dvh - 64px);object-fit:contain;';
    const close = document.createElement('button');
    close.type = 'button';
    close.textContent = 'Ho capito · Continua sul sito';
    close.style.cssText = 'display:block;margin:10px auto;padding:10px 18px;min-height:44px;max-width:90%;border:1px solid #cba76d;border-radius:24px;background:#fffaf0;color:#082a43;font:600 16px Georgia,serif;cursor:pointer;';
    dialog.append(image, close);
    document.head.append(style);
    document.body.append(dialog);
    let timer;
    function cleanup() {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', checkExpiry);
      window.removeEventListener('pageshow', checkExpiry);
      dialog.remove();
      style.remove();
      if (previousFocus?.isConnected) previousFocus.focus();
    }
    function dismiss() { if (dialog.open) dialog.close(); }
    function checkExpiry() { if (Date.now() >= expires) dismiss(); }
    close.addEventListener('click', dismiss);
    dialog.addEventListener('close', cleanup, {once:true});
    dialog.addEventListener('click', event => {
      const rect = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dismiss();
    });
    dialog.showModal();
    close.focus({preventScroll:true});
    timer = setTimeout(dismiss, Math.max(0, expires - Date.now()));
    document.addEventListener('visibilitychange', checkExpiry);
    window.addEventListener('pageshow', checkExpiry);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', showNotice, {once:true});
  else showNotice();
})();

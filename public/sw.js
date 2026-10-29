// Service worker mínimo: torna o comtay instalável no Android e mostra um aviso quando estiver sem
// internet. NÃO guarda dados nem páginas em cache: tudo vem sempre do servidor e do Supabase,
// então nunca aparece informação velha. (Lembretes por notificação entram aqui no futuro.)
const OFFLINE = `<!doctype html><html lang="pt-BR"><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>comtay</title>
<body style="margin:0;display:grid;place-items:center;min-height:100vh;background:#171719;color:#ececf0;font-family:system-ui,sans-serif;text-align:center;padding:24px">
<div><p style="font-size:20px;font-weight:600;margin:0 0 8px">Sem internet</p>
<p style="margin:0 0 20px;color:#a1a1aa">O comtay precisa de conexão. Confira o Wi-Fi ou os dados móveis.</p>
<button onclick="location.reload()" style="padding:10px 20px;border-radius:999px;border:0;background:#be9df7;color:#1a1424;font-weight:700">Tentar de novo</button></div>
</body></html>`;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return; // o resto segue direto pra rede
  event.respondWith(
    fetch(event.request).catch(
      () => new Response(OFFLINE, { headers: { "Content-Type": "text/html; charset=utf-8" } }),
    ),
  );
});

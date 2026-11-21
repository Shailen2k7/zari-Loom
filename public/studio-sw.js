// Zari & Loom Studio service worker. One job: receive photos shared from WhatsApp or the gallery
// (Android share sheet), keep them for a moment, and open the studio, which picks them up and uploads them.
// It never caches pages or data, so the studio always shows what is live.
const SHARED = "zl-shared";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "POST" || url.pathname !== "/admin/share-target") return;
  e.respondWith((async () => {
    try {
      const form = await e.request.formData();
      const files = form.getAll("photos").filter((f) => f && typeof f === "object" && f.size > 0);
      const cache = await caches.open(SHARED);
      const stamp = Date.now();
      await Promise.all(files.map((f, i) => cache.put(
        `/__shared/${stamp}-${i}`,
        new Response(f, { headers: { "content-type": f.type || "image/jpeg", "x-name": encodeURIComponent(f.name || `photo-${i + 1}.jpg`) } }),
      )));
      return Response.redirect(`/admin/products?shared=${files.length}#add`, 303);
    } catch {
      return Response.redirect("/admin/products#add", 303);
    }
  })());
});

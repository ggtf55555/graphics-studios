// Service worker: makes the site installable as a desktop app and shows
// push notifications when a new task is assigned. It does not cache anything,
// so members always get the latest version.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});

self.addEventListener("push", (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch (e) { d = { body: event.data ? event.data.text() : "" }; }
  event.waitUntil(
    self.registration.showNotification(d.title || "مهمة جديدة", {
      body: d.body || "",
      icon: "assets/icons/icon-192.png",
      badge: "assets/icons/icon-192.png",
      dir: "rtl",
      lang: "ar",
      tag: d.tag || undefined,
      renotify: !!d.tag,
      data: { url: d.url || "dashboard.html" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || "dashboard.html", self.registration.scope).href;
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of all) {
      if (c.url.startsWith(self.registration.scope) && "focus" in c) {
        await c.focus();
        if ("navigate" in c) { try { await c.navigate(url); } catch (e) {} }
        return;
      }
    }
    await self.clients.openWindow(url);
  })());
});

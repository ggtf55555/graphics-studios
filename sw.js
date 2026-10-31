// Minimal service worker: makes the site installable as a desktop app.
// It does not cache anything, so members always get the latest version.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});

const CACHE_NAME = "daily-goal-tracker-v3";
const IS_LOCALHOST_SW = ["localhost", "127.0.0.1"].includes(self.location.hostname);
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon.png"
];

self.addEventListener("install", (event) => {
  if (IS_LOCALHOST_SW) {
    event.waitUntil(self.skipWaiting());
    return;
  }

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  if (IS_LOCALHOST_SW) {
    event.waitUntil(
      caches.keys()
        .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
        .then(() => self.registration.unregister())
        .then(() => self.clients.matchAll({ type: "window" }))
        .then((clients) => Promise.all(clients.map((client) => client.navigate(client.url))))
    );
    return;
  }

  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (IS_LOCALHOST_SW) {
    return;
  }

  const { request } = event;
  
  // Only handle GET requests
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  // Skip API requests and hot-reloads
  if (url.pathname.startsWith("/api/") || url.pathname.includes("@vite") || url.pathname.includes("hot-update")) {
    return;
  }

  // Navigation requests: Network-First, falling back to cache '/'
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match("/");
      })
    );
    return;
  }

  // Static assets (JS, CSS, images, fonts): Cache-First
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then((networkResponse) => {
        // Cache valid responses
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
          const cacheCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, cacheCopy);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback or ignore for other assets
        return new Response("Asset offline", { status: 503, statusText: "Offline" });
      });
    })
  );
});

// Web Push event listener
self.addEventListener("push", (event) => {
  let data = { title: "Nhắc nhở! 🔥", body: "Bạn có thói quen chưa hoàn thành." };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: "Nhắc nhở! 🔥", body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || "/icon.png",
    badge: data.badge || "/icon.png",
    data: data.data || { url: "/" },
    tag: "active-reminder-tag", // Prevents stacking duplicate notifications
    renotify: true,
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click listener
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if ("focus" in client) {
          try {
            // Check if URL matches or if it's the home URL
            const urlObj = new URL(client.url);
            if (urlObj.pathname === targetUrl || (targetUrl === "/" && urlObj.pathname === "")) {
              return client.focus();
            }
          } catch (err) {
            // ignore url parse error
          }
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

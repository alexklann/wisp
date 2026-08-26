self.addEventListener("push", (event) => {
  let payload = { title: "New Message", body: "" };

  if (event.data) {
    const text = event.data.text();
    try {
      payload = JSON.parse(text);
    } catch {
      payload.body = text;
    }
  }

  const handlePushPromise = self.registration.showNotification(payload.title, {
    body: payload.body,
    icon: "/icon-192x192.png",
    // badge: "/badge.png",
    vibrate: [200, 100, 200],
  });

  event.waitUntil(handlePushPromise);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/"));
});

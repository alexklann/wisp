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

  const handlePushPromise = clients.matchAll({ type: 'window', includeUncontrolled: true })
    .then((clientList) => {
      // If clientList has any items, the user has the app open somewhere.
      // We abort the SW notification and let your realtime main thread handle it.
      if (clientList.length > 0) {
        return;
      }

      // If the array is empty, the app is completely closed. Show the Web Push.
      return self.registration.showNotification(payload.title, {
        body: payload.body,
        icon: "/icon-192x192.png",
        // badge: "/badge.png",
        vibrate: [200, 100, 200],
      });
    });

  event.waitUntil(handlePushPromise);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/"));
});

importScripts(
  "https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyBvHrx6sbpa7xf773QMnWYvgrznHgY3K-A",
  authDomain: "convistore-39725.firebaseapp.com",
  projectId: "convistore-39725",
  storageBucket: "convistore-39725.firebasestorage.app",
  messagingSenderId: "997516003000",
  appId: "1:997516003000:web:005ace440832756f3ed64d",
  measurementId: "G-GZDDP50DHY"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(
    payload.notification.title,
    {
      body: payload.notification.body,
      icon: "/icon.png",
     data: {
  url: payload.data?.link || "/orders",
},
    }
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
   clients.openWindow(
  event.notification.data?.url || "/orders"
    )
  );
});
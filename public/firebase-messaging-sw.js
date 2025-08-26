// Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging-compat.js');

// Firebase configuration
const firebaseConfig = {
  "projectId": "systemlife",
  "appId": "1:128818391760:web:273fc92c29be4eec870cd5",
  "storageBucket": "systemlife.firebasestorage.app",
  "apiKey": "AIzaSyDR0CxFNgPu7cdYC5Lz8ck--XZc5uUWkYQ",
  "authDomain": "systemlife.firebaseapp.com",
  "messagingSenderId": "128818391760"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Retrieve Firebase Messaging object
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  // Customize notification here
  const notificationTitle = payload.notification.title || 'SystemLife';
  const notificationOptions = {
    body: payload.notification.body || 'Você tem uma nova notificação',
    icon: payload.notification.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: payload.data || {}
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.');
  
  event.notification.close();
  
  // This looks for a URL in the notification data or defaults to the app root
  const url = event.notification.data?.url || '/';
  
  // Open the URL in a new window/tab
  event.waitUntil(
    clients.openWindow(url)
  );
});
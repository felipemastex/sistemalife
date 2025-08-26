// Firebase Admin SDK initialization
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

// Only initialize if not already initialized
let adminApp: any;
try {
  if (getApps().length === 0) {
    // In a production environment, you would use service account credentials
    // For development, Firebase Admin can use default credentials
    adminApp = initializeApp({
      // projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      // Add other config as needed
    });
    console.log('Firebase Admin initialized');
  } else {
    adminApp = getApp();
    console.log('Firebase Admin already initialized');
  }
} catch (error) {
  console.warn('Firebase Admin initialization failed:', error);
  adminApp = null;
}

// Initialize Firestore
let firestore: any = null;
try {
  if (adminApp) {
    firestore = getFirestore(adminApp);
  }
} catch (error) {
  console.warn('Firestore initialization failed:', error);
}

// Initialize Firebase Messaging
let messaging: any = null;
try {
  if (adminApp) {
    messaging = getMessaging(adminApp);
  }
} catch (error) {
  console.warn('Firebase Messaging initialization failed:', error);
}

export { adminApp as admin, firestore, messaging };
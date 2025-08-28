'use client';

import { useState, useEffect } from 'react';
import { getFCMToken, requestNotificationPermission, onForegroundMessage } from '@/lib/notifications';

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if push notifications are supported
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
    }
    
    // Get current permission status
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Request permission for push notifications
  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Push notifications are not supported in this browser');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const granted = await requestNotificationPermission();
      setPermission(granted ? 'granted' : 'denied');
      
      if (granted) {
        const fcmToken = await getFCMToken();
        setToken(fcmToken);
        return true;
      }
      
      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error requesting push notification permission:', errorMessage);
      setError(`Failed to request permission: ${errorMessage}`);
      
      // Tratamento específico para AbortError
      if (errorMessage.includes('AbortError') || errorMessage.includes('Registration failed')) {
        console.warn('Push notification registration failed. This might be due to browser settings or missing configuration.');
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Listen for foreground messages
  useEffect(() => {
    if (!isSupported) return;

    try {
      const unsubscribe = onForegroundMessage((payload) => {
        // Handle foreground notifications
        console.log('Foreground notification received:', payload);
        // You can show a toast or update UI here
      });

      return () => {
        if (unsubscribe) unsubscribe();
      };
    } catch (err) {
      console.error('Error setting up foreground message listener:', err);
      return () => {};
    }
  }, [isSupported]);

  return {
    permission,
    isSupported,
    token,
    isLoading,
    error,
    requestPermission,
  };
}
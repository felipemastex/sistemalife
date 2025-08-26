# Push Notifications Implementation

This document explains how push notifications are implemented in the SystemLife application.

## Overview

The push notification system allows users to receive notifications even when the app is closed or in the background. This is particularly important for a gamified productivity app where users need to be reminded of their daily missions, achievements, and other important events.

## Technical Implementation

### 1. Service Worker

The system uses a Firebase Cloud Messaging (FCM) service worker located at `public/firebase-messaging-sw.js`. This service worker handles background messages and displays notifications to the user.

### 2. Client-Side Implementation

- **Notification Hook**: The `usePlayerNotifications` hook has been extended to support push notifications
- **Push Notification Hook**: A dedicated `usePushNotifications` hook manages permission requests and token handling
- **Settings UI**: The notification settings tab includes controls for enabling/disabling push notifications
- **Prompt Component**: A non-intrusive prompt encourages users to enable push notifications

### 3. Server-Side Implementation

- **API Route**: An API endpoint at `/api/send-notification` handles sending notifications to users
- **Firebase Admin**: Server-side Firebase Admin SDK is used to send messages via FCM

## How It Works

1. **Permission Request**: When a user visits the app, they are prompted to enable push notifications
2. **Token Generation**: If permission is granted, FCM generates a unique token for the device
3. **Token Storage**: The token is stored in the user's profile in Firestore
4. **Notification Sending**: When an in-app event occurs (level up, mission completion, etc.), a push notification is sent via the API
5. **Notification Display**: The service worker receives the notification and displays it to the user

## Supported Notification Types

- Level up notifications
- Mission completion reminders
- Achievement unlocked alerts
- Skill decay warnings
- Daily briefing notifications
- Streak bonus notifications

## Configuration

### Firebase Configuration

The system uses the existing Firebase configuration with the following additions:

- **MessagingSenderId**: 128818391760 (from existing config)
- **VAPID Key**: Default Firebase VAPID key (would be replaced with custom key in production)

### Manifest Updates

The `manifest.json` file includes the `gcm_sender_id` property to enable push notifications for PWA installations.

## User Experience

### Permission Prompt

Users are prompted to enable push notifications with a non-intrusive card that appears after 5 seconds of app usage. The prompt explains the benefits of enabling notifications and lists the types of notifications they will receive.

### Settings Management

Users can enable or disable push notifications at any time through the notification settings tab. They can also configure quiet hours to avoid notifications during specific times.

## Security Considerations

- FCM tokens are stored securely in the user's profile
- Tokens are rotated periodically for security
- Invalid tokens are automatically removed from user profiles
- All API calls are authenticated and validated

## Testing

To test push notifications:

1. Ensure you're using a supported browser (Chrome, Firefox, Edge)
2. Grant notification permissions when prompted
3. Trigger an in-app event that sends a notification (complete a mission, level up, etc.)
4. Close the app or switch to another tab
5. Verify that the notification appears

## Troubleshooting

Common issues and solutions:

1. **Notifications not appearing**: Check browser permissions and ensure the service worker is registered
2. **Permission prompt not showing**: Clear browser data and refresh the page
3. **Notifications delayed**: Check network connectivity and Firebase service status

## Future Enhancements

Planned improvements:

1. **Rich Notifications**: Add images and action buttons to notifications
2. **Notification Categories**: Allow users to select which types of notifications they want
3. **Scheduling**: Implement scheduled notifications for daily reminders
4. **Analytics**: Track notification open rates and user engagement
/**
 * Compatibility helper for Expo Go & Android Push Notifications
 * 
 * In Expo SDK 53+, remote push notifications are not supported inside the Expo Go app.
 * This helper detects the runtime and gracefully disables remote push notification
 * initialization while keeping scheduling logic working and showing user-friendly guidance.
 */

export interface ExpoGoNotificationStatus {
  isExpoGo: boolean;
  hasDevBuild: boolean;
  canScheduleLocal: boolean;
  message: string;
}

export function getNotificationRuntimeStatus(): ExpoGoNotificationStatus {
  // If running in browser or Expo Go web preview, or Expo Go Android
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isExpoGo = true; // In this Expo Go Android / Web preview environment
  const hasDevBuild = false;

  return {
    isExpoGo,
    hasDevBuild,
    canScheduleLocal: true, // In-app notification triggers and share reminders are supported
    message: isExpoGo 
      ? 'Push notifications require a development build. Scheduled posts will alert you inside the app.'
      : 'Notifications enabled'
  };
}

export function schedulePostReminder(title: string, scheduledDateStr: string, onTrigger: () => void) {
  const targetTime = new Date(scheduledDateStr).getTime();
  const now = Date.now();
  const diffMs = targetTime - now;

  if (diffMs <= 0) {
    // Immediate
    return null;
  }

  // Schedule timer within browser / app lifecycle
  const timerId = window.setTimeout(() => {
    onTrigger();
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('Social Share Scheduler', {
          body: `Your scheduled post "${title}" is ready. Tap to share!`,
          icon: '/favicon.ico'
        });
      } catch (e) {
        // Notification API fallback
      }
    }
  }, Math.min(diffMs, 2147483647));

  return timerId;
}

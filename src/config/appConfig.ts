/**
 * Centralized Application Configuration & Feature Flags
 * Social Share Scheduler
 */

export const APP_CONFIG = {
  APP_NAME: 'Social Share Scheduler',
  APP_VERSION: '1.2.0',
  DATA_SCHEMA_VERSION: 3,
  TIMEZONE: 'Asia/Jakarta',
  DEFAULT_LOCALE: 'id-ID',
  SUPPORTED_PLATFORMS: [
    'facebook_page',
    'facebook_profile',
    'instagram',
    'tiktok',
    'youtube',
    'twitter',
    'whatsapp'
  ] as const,
  // Feature Flags: false by default in Web Preview; can be enabled in Android Native shell
  FEATURE_FLAGS: {
    nativeShare: false,
    nativeNotifications: false,
    nativeMediaPicker: false,
    nativeFileStorage: false,
    nativeDeepLinks: false,
    expoGoMode: false
  }
} as const;

export type AppFeatureFlag = keyof typeof APP_CONFIG.FEATURE_FLAGS;

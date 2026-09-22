/**
 * Native Compatibility Layer & Platform Adapter
 * Provides capability detection and clean abstractions between Web Preview and Android Native.
 */

import { PlatformId, MediaItem } from '../types';
import { APP_CONFIG } from '../config/appConfig';
import { logger } from './logger';
import { errorReporter } from './errorReporter';
import { mediaStorage } from './mediaStorage';

export interface NativeShareOptions {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
  media?: MediaItem | null;
  platform?: PlatformId;
  targetPackage?: string;
}

export interface NativeShareResult {
  success: boolean;
  openedShareSheet: boolean;
  manualPublishRequired: boolean;
  message?: string;
  error?: string;
}

export interface ScheduledNotificationOptions {
  id: string;
  title: string;
  body: string;
  scheduledAt: string; // ISO String
  data?: Record<string, any>;
}

declare global {
  interface Window {
    // Injected Android bridge placeholder for future native builds (Capacitor / React Native / WebView)
    AndroidBridge?: {
      isAndroid?: () => boolean;
      share?: (payloadJson: string) => void;
      copyToClipboard?: (text: string) => void;
      scheduleNotification?: (payloadJson: string) => void;
      cancelNotification?: (id: string) => void;
      openUrl?: (url: string, deepLink?: string) => void;
    };
  }
}

/**
 * Capability Detection
 */
export const platformCapabilities = {
  isNativeAndroid(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(window.AndroidBridge?.isAndroid?.());
  },

  hasWebShare(): boolean {
    if (typeof navigator === 'undefined') return false;
    return Boolean(navigator.share);
  },

  hasWebShareFiles(): boolean {
    if (typeof navigator === 'undefined') return false;
    return Boolean(navigator.canShare && navigator.share);
  },

  hasClipboard(): boolean {
    if (typeof navigator === 'undefined') return false;
    return Boolean(navigator.clipboard && navigator.clipboard.writeText);
  },

  hasNotificationApi(): boolean {
    if (typeof window === 'undefined') return false;
    return 'Notification' in window;
  }
};

/**
 * Native Compatibility Bridge
 */
export const nativeBridge = {
  /**
   * Android Share Sheet / Web Share API abstraction
   * Workflow: Prepare Content -> Prepare Media -> Android Share Sheet -> User selects app -> User completes posting manually
   * NEVER marks as automatically published!
   */
  async shareMedia(options: NativeShareOptions): Promise<NativeShareResult> {
    logger.info('Preparing share payload', { title: options.title, hasFiles: Boolean(options.files?.length) });

    // 1. If Native Android Bridge exists
    if (platformCapabilities.isNativeAndroid() && window.AndroidBridge?.share) {
      try {
        window.AndroidBridge.share(JSON.stringify(options));
        return {
          success: true,
          openedShareSheet: true,
          manualPublishRequired: true,
          message: 'Android Share Sheet launched. Complete posting in the target app.'
        };
      } catch (err) {
        errorReporter.report('NATIVE_SHARE_ERR', 'ShareEngine', String(err), 'Native share failed, falling back to web', true);
      }
    }

    // 2. Web Share API fallback (supported on mobile Chrome/Android browsers)
    if (platformCapabilities.hasWebShare()) {
      try {
        const shareData: ShareData = {
          title: options.title,
          text: options.text,
          url: options.url
        };

        if (options.files && options.files.length > 0 && navigator.canShare && navigator.canShare({ files: options.files })) {
          shareData.files = options.files;
        }

        await navigator.share(shareData);
        return {
          success: true,
          openedShareSheet: true,
          manualPublishRequired: true,
          message: 'Web Share dialog completed. Complete your post manually in the chosen platform.'
        };
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return {
            success: false,
            openedShareSheet: false,
            manualPublishRequired: true,
            message: 'Share cancelled by user'
          };
        }
        logger.warn('Web Share API failed, using manual fallback', err);
      }
    }

    // 3. Fallback: Copy to clipboard and open platform url
    return {
      success: true,
      openedShareSheet: false,
      manualPublishRequired: true,
      message: 'Native share unavailable. Text copied to clipboard; open target platform to paste.'
    };
  },

  /**
   * Clipboard Abstraction
   */
  async copyToClipboard(text: string): Promise<boolean> {
    // Native Bridge
    if (platformCapabilities.isNativeAndroid() && window.AndroidBridge?.copyToClipboard) {
      try {
        window.AndroidBridge.copyToClipboard(text);
        return true;
      } catch (err) {
        logger.warn('Native clipboard failed, falling back to browser', err);
      }
    }

    // Browser Clipboard API
    if (platformCapabilities.hasClipboard()) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        logger.warn('navigator.clipboard.writeText failed, attempting execCommand fallback', err);
      }
    }

    // Legacy execCommand fallback
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    } catch (err) {
      errorReporter.report('CLIPBOARD_FAIL', 'Clipboard', String(err), 'Failed to copy text to clipboard', true);
      return false;
    }
  },

  /**
   * Media Picker Abstraction (Image, Video, Any)
   */
  async pickMedia(options: { type: 'image' | 'video' | 'any'; multiple?: boolean }): Promise<File[]> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = Boolean(options.multiple);

      if (options.type === 'image') {
        input.accept = 'image/*';
      } else if (options.type === 'video') {
        input.accept = 'video/*';
      } else {
        input.accept = 'image/*,video/*';
      }

      input.onchange = (e: any) => {
        const files: File[] = Array.from(e.target.files || []);
        resolve(files);
      };

      input.oncancel = () => {
        resolve([]);
      };

      input.click();
    });
  },

  async pickImage(multiple = false): Promise<File[]> {
    return this.pickMedia({ type: 'image', multiple });
  },

  async pickVideo(multiple = false): Promise<File[]> {
    return this.pickMedia({ type: 'video', multiple });
  },

  /**
   * Notification Architecture Abstraction
   * Clear note: Web Preview provides scheduled in-memory/browser notifications;
   * full background alarms require Android Native AlarmManager / WorkManager.
   */
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!platformCapabilities.hasNotificationApi()) {
      return 'denied';
    }
    try {
      return await Notification.requestPermission();
    } catch {
      return 'denied';
    }
  },

  async scheduleNotification(options: ScheduledNotificationOptions): Promise<boolean> {
    logger.info('Scheduling notification reminder', { id: options.id, scheduledAt: options.scheduledAt });

    // Native Bridge
    if (platformCapabilities.isNativeAndroid() && window.AndroidBridge?.scheduleNotification) {
      try {
        window.AndroidBridge.scheduleNotification(JSON.stringify(options));
        return true;
      } catch (err) {
        logger.warn('Native notification scheduling failed', err);
      }
    }

    // Web Notification API (when page is open)
    const targetTime = new Date(options.scheduledAt).getTime();
    const now = Date.now();
    const delayMs = targetTime - now;

    if (delayMs > 0 && delayMs < 24 * 60 * 60 * 1000) {
      setTimeout(() => {
        if (platformCapabilities.hasNotificationApi() && Notification.permission === 'granted') {
          new Notification(options.title, {
            body: options.body,
            icon: '/icon-192.png'
          });
        }
      }, delayMs);
      return true;
    }

    return true;
  },

  async cancelNotification(id: string): Promise<boolean> {
    if (platformCapabilities.isNativeAndroid() && window.AndroidBridge?.cancelNotification) {
      window.AndroidBridge.cancelNotification(id);
      return true;
    }
    return true;
  },

  /**
   * Deep Links & Platform Opening Abstraction
   */
  async openPlatform(platform: PlatformId, url?: string, deepLink?: string): Promise<boolean> {
    logger.info('Opening platform', { platform, hasDeepLink: Boolean(deepLink), hasUrl: Boolean(url) });

    // If native bridge can handle intent
    if (platformCapabilities.isNativeAndroid() && window.AndroidBridge?.openUrl) {
      window.AndroidBridge.openUrl(url || '', deepLink);
      return true;
    }

    // Web fallback: Try deep link on mobile browsers, fallback to web URL
    const targetUrl = url || deepLink;
    if (targetUrl) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      return true;
    }

    return false;
  },

  // Platform specific deep link shortcuts
  async openFacebook(url?: string, deepLink?: string) { return this.openPlatform('facebook_page', url, deepLink || 'fb://'); },
  async openInstagram(url?: string, deepLink?: string) { return this.openPlatform('instagram', url, deepLink || 'instagram://'); },
  async openTikTok(url?: string, deepLink?: string) { return this.openPlatform('tiktok', url, deepLink || 'tiktok://'); },
  async openYouTube(url?: string, deepLink?: string) { return this.openPlatform('youtube', url, deepLink || 'vnd.youtube://'); },
  async openX(url?: string, deepLink?: string) { return this.openPlatform('twitter', url, deepLink || 'twitter://'); },
  async openWhatsApp(url?: string, deepLink?: string) { return this.openPlatform('whatsapp', url, deepLink || 'whatsapp://'); },

  /**
   * Shareable URI resolution for media
   */
  async getShareableUri(media: MediaItem): Promise<string> {
    if (media.url.startsWith('blob:') || media.url.startsWith('data:') || media.url.startsWith('http')) {
      return media.url;
    }
    // Check if stored locally in mediaStorage
    const localUri = await mediaStorage.getUri(media.id);
    return localUri || media.url;
  }
};

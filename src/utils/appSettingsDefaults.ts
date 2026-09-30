/**
 * Global App Settings Defaults and Storage Management
 * Social Share Scheduler
 */

import { AppSettings, PlatformId, StorageCacheSettings } from '../types';
import { detectBrowserLanguage, resolveEffectiveLanguage } from './i18n';

export const DEFAULT_STORAGE_CACHE_SETTINGS: StorageCacheSettings = {
  autoMediaCleanupEnabled: true,
  mediaRetentionDays: 7,
  autoHistoryCleanupEnabled: true,
  historyRetentionDays: 30,
  cleanupTimeUtc: '00:00',
  lastAutomaticCleanupUtc: null
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  languageMode: 'automatic',
  language: 'id',
  timezone: 'Asia/Jakarta',
  notificationEnabled: true,
  isExpoGoMode: true,
  hasDevBuild: false,
  defaultHashtags: ['#SocialMedia', '#ContentCreator', '#DigitalMarketing', '#BrandUpdate', '#Highlights'],
  theme: 'dark',

  // A. GENERAL
  appName: 'Social Share Scheduler',
  defaultLandingPage: 'home',

  // B. CONTENT
  contentSettings: {
    defaultContentType: 'post',
    hashtagLimits: {
      facebook: 5,
      instagram: 10,
      tiktok: 5,
      youtube: 5,
      twitter: 3,
      threads: 5
    }
  },

  // C. NEWS HUNTER
  newsHunterSettings: {
    defaultCategories: ['Hype/Viral', 'Nasional', 'Internasional', 'Sepakbola', 'Persib'],
    defaultHypeFilter: 'all',
    defaultMediaFilter: 'all',
    defaultSorting: 'hype',
    autoHuntOnStartup: false
  },

  // D. AI
  aiSettings: {
    assistantEnabled: true,
    aiRewriteEnabled: true,
    newsRewriteEnabled: true,
    writingLanguage: 'id',
    writingStyle: 'Natural'
  },

  // E. SCHEDULING
  schedulingSettings: {
    defaultTimezone: 'Asia/Jakarta',
    defaultPriority: 'normal',
    reminderMinutesBefore: 15
  },

  // F. SHARING
  sharingSettings: {
    confirmBeforeOpen: true,
    confirmCompletionAfterOpen: true,
    defaultPlatformOrder: [
      'facebook_page',
      'instagram',
      'tiktok',
      'youtube',
      'twitter',
      'threads'
    ]
  },

  // G. MEDIA
  mediaSettings: {
    autoPreviewMedia: true,
    preferDownloadable: false,
    maxPreviewSize: 'medium'
  },

  // H. NOTIFICATIONS
  notificationControlSettings: {
    masterEnabled: true,
    queueReminders: true,
    newsHunterAlerts: true,
    shareSessionReminders: true
  },

  // I. STORAGE & CACHE
  storageCacheSettings: DEFAULT_STORAGE_CACHE_SETTINGS
};

/**
 * Merge saved settings safely with defaults so no existing user settings are overwritten.
 */
export function ensureAppSettings(savedRaw: any): AppSettings {
  if (!savedRaw || typeof savedRaw !== 'object') {
    return { 
      ...DEFAULT_APP_SETTINGS,
      language: detectBrowserLanguage()
    };
  }

  const languageMode: 'automatic' | 'manual' = 
    savedRaw.languageMode === 'manual' 
      ? 'manual' 
      : (savedRaw.languageMode === 'automatic' ? 'automatic' : (savedRaw.selectedLanguage ? 'manual' : 'automatic'));

  const selectedLanguage: string | undefined = 
    savedRaw.selectedLanguage || (languageMode === 'manual' ? savedRaw.language : undefined);

  const effectiveLanguage = 
    languageMode === 'manual' && selectedLanguage
      ? selectedLanguage
      : detectBrowserLanguage();

  return {
    ...DEFAULT_APP_SETTINGS,
    ...savedRaw,
    languageMode,
    selectedLanguage,
    language: effectiveLanguage,
    // Deep merge sections to ensure nested fields exist without wiping user customizations
    contentSettings: {
      ...DEFAULT_APP_SETTINGS.contentSettings!,
      ...(savedRaw.contentSettings || {}),
      hashtagLimits: {
        ...DEFAULT_APP_SETTINGS.contentSettings!.hashtagLimits,
        ...(savedRaw.contentSettings?.hashtagLimits || {})
      }
    },
    newsHunterSettings: {
      ...DEFAULT_APP_SETTINGS.newsHunterSettings!,
      ...(savedRaw.newsHunterSettings || {})
    },
    aiSettings: {
      ...DEFAULT_APP_SETTINGS.aiSettings!,
      ...(savedRaw.aiSettings || {})
    },
    schedulingSettings: {
      ...DEFAULT_APP_SETTINGS.schedulingSettings!,
      ...(savedRaw.schedulingSettings || {})
    },
    sharingSettings: {
      ...DEFAULT_APP_SETTINGS.sharingSettings!,
      ...(savedRaw.sharingSettings || {}),
      defaultPlatformOrder: Array.isArray(savedRaw.sharingSettings?.defaultPlatformOrder)
        ? savedRaw.sharingSettings.defaultPlatformOrder.map((p: string) => (p === 'whatsapp' ? 'threads' : p))
        : DEFAULT_APP_SETTINGS.sharingSettings!.defaultPlatformOrder
    },
    mediaSettings: {
      ...DEFAULT_APP_SETTINGS.mediaSettings!,
      ...(savedRaw.mediaSettings || {})
    },
    notificationControlSettings: {
      ...DEFAULT_APP_SETTINGS.notificationControlSettings!,
      ...(savedRaw.notificationControlSettings || {})
    },
    storageCacheSettings: {
      ...DEFAULT_STORAGE_CACHE_SETTINGS,
      ...(savedRaw.storageCacheSettings || {})
    }
  };
}

export interface StorageBucketStat {
  key: string;
  name: string;
  count: number;
  sizeBytes: number;
  formattedSize: string;
}

export interface AppStorageBreakdown {
  buckets: StorageBucketStat[];
  totalBytes: number;
  formattedTotal: string;
  isEstimated: true;
}

/**
 * Calculate estimated size of application data stored in localStorage.
 */
export function calculateStorageBreakdown(): AppStorageBreakdown {
  const BUCKET_DEFINITIONS: { key: string; altKey?: string; name: string; isList?: boolean }[] = [
    { key: 'sss_user_accounts', name: 'Social Accounts' },
    { key: 'sss_social_groups', name: 'Posting Groups', isList: true },
    { key: 'sss_history', altKey: 'sss_post_history', name: 'History Records', isList: true },
    { key: 'sss_content_queue', name: 'Scheduled Queue', isList: true },
    { key: 'sss_saved_news_library', name: 'Saved News Library', isList: true },
    { key: 'sss_news_media_cache', name: 'Media Cache & Metadata' },
    { key: 'sss_news_discovery_cache', name: 'News Discovery Cache' },
    { key: 'sss_settings', name: 'Application Settings' },
    { key: 'sss_auto_hunt_config', name: 'Auto Hunt Config' },
    { key: 'sss_integrity_report_v1', name: 'Integrity Logs' }
  ];

  let totalBytes = 0;
  const buckets: StorageBucketStat[] = [];

  for (const def of BUCKET_DEFINITIONS) {
    let sizeBytes = 0;
    let count = 0;
    try {
      const raw = localStorage.getItem(def.key) || (def.altKey ? localStorage.getItem(def.altKey) : null);
      if (raw) {
        // String UTF-16 byte length ~ 2 bytes per char
        sizeBytes = raw.length * 2;
        totalBytes += sizeBytes;
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            count = parsed.length;
          } else if (parsed && typeof parsed === 'object') {
            count = Object.keys(parsed).length;
          } else {
            count = 1;
          }
        } catch {
          count = 1;
        }
      }
    } catch {
      sizeBytes = 0;
      count = 0;
    }

    buckets.push({
      key: def.key,
      name: def.name,
      count,
      sizeBytes,
      formattedSize: formatBytes(sizeBytes)
    });
  }

  return {
    buckets,
    totalBytes,
    formattedTotal: formatBytes(totalBytes),
    isEstimated: true
  };
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Clear temporary discovery and media cache safely without touching core entities.
 */
export function clearTemporaryAppCache(): { clearedBytes: number; message: string } {
  let clearedBytes = 0;
  try {
    const rawDisc = localStorage.getItem('sss_news_discovery_cache');
    if (rawDisc) clearedBytes += rawDisc.length * 2;
    localStorage.removeItem('sss_news_discovery_cache');

    const rawMedia = localStorage.getItem('sss_news_media_cache');
    if (rawMedia) clearedBytes += rawMedia.length * 2;
    localStorage.setItem(
      'sss_news_media_cache',
      JSON.stringify({ items: [], lastCleared: new Date().toISOString() })
    );

    return {
      clearedBytes,
      message: `Temporary cache cleared (${formatBytes(clearedBytes)} freed). Accounts, Groups, Drafts, History, Queue, and News Library remain safe.`
    };
  } catch (err: any) {
    return {
      clearedBytes: 0,
      message: 'Failed to clear cache: ' + (err?.message || 'unknown error')
    };
  }
}

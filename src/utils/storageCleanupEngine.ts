/**
 * Storage Cleanup Engine
 * 
 * Manages Media Cache and History Retention Cleanup with strict safety guarantees:
 * - Never deletes user-uploaded original media or permanent media
 * - Never deletes Drafts or media referenced in Drafts
 * - Never deletes Scheduled Posts or active Queue items
 * - Never deletes Social Media Accounts, Posting Groups, News Library items, Backups, Subscription, or Settings
 * - Stores cleanup schedule strictly in UTC (default 00:00 UTC) while presenting local equivalent to users
 */

import { 
  StorageCacheSettings, 
  MediaCacheRetentionDays, 
  HistoryRetentionDays,
  SocialPost 
} from '../types';
import { getMediaCacheStore, MediaCacheItem, MediaCacheStore } from './mediaCache';
import { mediaStorage } from '../services/mediaStorage';

const STORAGE_KEY_HISTORY = 'sss_history';
const STORAGE_KEY_DRAFTS = 'sss_drafts';
const STORAGE_KEY_QUEUE = 'sss_content_queue';
const STORAGE_KEY_ACCOUNTS = 'sss_user_accounts';
const STORAGE_KEY_BACKUPS = 'sss_recovery_snapshots';
const STORAGE_KEY_DISCOVERED_HISTORY = 'sss_discovered_stories_history';
const STORAGE_KEY_ACTIVE_SHARE_SESSION = 'sss_active_share_session';
const STORAGE_KEY_SETTINGS = 'sss_settings';

export interface StorageDisplaySummary {
  mediaCacheMb: number;
  formattedMediaCache: string;
  historyMb: number;
  formattedHistory: string;
  totalAppDataMb: number;
  formattedTotalAppData: string;
  isUnavailable: boolean;
  unavailableReason?: string;
  mediaFileCount: number;
  historyRecordCount: number;
}

export interface CleanupResult {
  mediaBytesRemoved: number;
  formattedMediaRemoved: string;
  mediaFilesRemoved: number;
  historyRecordsRemoved: number;
  completedAt: string;
  status: 'success' | 'no_action_needed';
  summaryMessage: string;
  clearedMediaDetails?: string;
  clearedHistoryDetails?: string;
}

/**
 * Format bytes to human readable format (MB-centric for storage summary)
 */
export function formatBytesToMb(bytes: number): string {
  if (bytes <= 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  if (mb >= 100) {
    return `${Math.round(mb)} MB`;
  } else if (mb >= 1) {
    return `${mb.toFixed(1).replace(/\.0$/, '')} MB`;
  } else if (mb >= 0.05) {
    return `${mb.toFixed(1)} MB`;
  } else if (bytes >= 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${bytes} B`;
}

/**
 * Cleanly format MB display matching prompt requirements:
 * Example:
 * MEDIA CACHE: 245 MB
 * HISTORY: 12 MB
 * TOTAL APP DATA: 257 MB
 */
export function formatSummaryMb(bytes: number): string {
  if (bytes <= 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  if (mb >= 10) {
    return `${Math.round(mb)} MB`;
  } else if (mb >= 0.1) {
    return `${mb.toFixed(1).replace(/\.0$/, '')} MB`;
  } else if (bytes > 0) {
    return '< 1 MB';
  }
  return '0 MB';
}

/**
 * Calculate dynamic local equivalent of a UTC HH:mm time
 * Example: 00:00 UTC = 07:00 WIB (for Asia/Jakarta)
 */
export function getLocalEquivalentTime(utcTimeStr: string = '00:00', targetTimezone?: string): string {
  try {
    const parts = utcTimeStr.split(':');
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;

    const now = new Date();
    const utcDate = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      hours,
      minutes,
      0
    ));

    const tz = targetTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

    const localTimeFormatted = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(utcDate);

    // Get short timezone abbreviation (e.g. WIB, PST, UTC)
    let tzName = '';
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        timeZoneName: 'short'
      }).formatToParts(utcDate);
      tzName = parts.find(p => p.type === 'timeZoneName')?.value || '';
    } catch {
      tzName = tz;
    }

    return `${localTimeFormatted} ${tzName}`.trim();
  } catch {
    return `${utcTimeStr} (Local time unavailable)`;
  }
}

/**
 * Extract all media URLs currently referenced by Drafts, Queue, Accounts, and Backups.
 * SAFETY RULE: These media files must NEVER be deleted by automatic or manual cache clearing.
 */
export function getProtectedMediaUrls(): Set<string> {
  const protectedUrls = new Set<string>();

  try {
    // 1. Check Drafts
    const rawDrafts = localStorage.getItem(STORAGE_KEY_DRAFTS) || localStorage.getItem('sss_post_drafts');
    if (rawDrafts) {
      const drafts: SocialPost[] = JSON.parse(rawDrafts);
      if (Array.isArray(drafts)) {
        drafts.forEach(d => {
          if (d.media?.url) protectedUrls.add(d.media.url);
          if (d.media?.thumbnailUrl) protectedUrls.add(d.media.thumbnailUrl);
          if ((d.media as any)?.localUri) protectedUrls.add((d.media as any).localUri);
          if (d.newsSourceInfo?.media?.url) protectedUrls.add(d.newsSourceInfo.media.url);
        });
      }
    }

    // 2. Check Queue & Scheduled Posts
    const rawQueue = localStorage.getItem(STORAGE_KEY_QUEUE);
    if (rawQueue) {
      const queue = JSON.parse(rawQueue);
      if (Array.isArray(queue)) {
        queue.forEach((q: any) => {
          if (q.media?.url) protectedUrls.add(q.media.url);
          if (q.media?.thumbnailUrl) protectedUrls.add(q.media.thumbnailUrl);
          if (q.media?.localUri) protectedUrls.add(q.media.localUri);
          if (q.newsSourceInfo?.media?.url) protectedUrls.add(q.newsSourceInfo.media.url);
        });
      }
    }

    // 3. Check Connected Accounts
    const rawAccounts = localStorage.getItem(STORAGE_KEY_ACCOUNTS);
    if (rawAccounts) {
      const accounts = JSON.parse(rawAccounts);
      if (accounts && typeof accounts === 'object') {
        Object.values(accounts).forEach((accList: any) => {
          if (Array.isArray(accList)) {
            accList.forEach(a => {
              if (a.avatarUrl) protectedUrls.add(a.avatarUrl);
            });
          }
        });
      }
    }
  } catch (err) {
    console.warn('Failed collecting protected media URLs:', err);
  }

  return protectedUrls;
}

/**
 * Extract all post IDs currently referenced by Drafts, Queue, or Saved News Library.
 * SAFETY RULE: These items must NEVER be deleted by history cleanup.
 */
export function getProtectedPostIds(): Set<string> {
  const protectedIds = new Set<string>();

  try {
    const rawDrafts = localStorage.getItem(STORAGE_KEY_DRAFTS) || localStorage.getItem('sss_post_drafts');
    if (rawDrafts) {
      const drafts = JSON.parse(rawDrafts);
      if (Array.isArray(drafts)) {
        drafts.forEach((d: any) => {
          if (d.id) protectedIds.add(d.id);
        });
      }
    }

    const rawQueue = localStorage.getItem(STORAGE_KEY_QUEUE);
    if (rawQueue) {
      const queue = JSON.parse(rawQueue);
      if (Array.isArray(queue)) {
        queue.forEach((q: any) => {
          if (q.id) protectedIds.add(q.id);
          if (q.postId) protectedIds.add(q.postId);
        });
      }
    }

    const rawNews = localStorage.getItem('sss_news_library');
    if (rawNews) {
      const news = JSON.parse(rawNews);
      if (Array.isArray(news)) {
        news.forEach((n: any) => {
          if (n.id) protectedIds.add(n.id);
        });
      }
    }
  } catch (err) {
    console.warn('Failed collecting protected post IDs:', err);
  }

  return protectedIds;
}

/**
 * Calculate accurate storage display summary.
 * If exact measurement cannot be obtained, returns isUnavailable: true without fabricating numbers.
 */
export function getStorageDisplaySummary(): StorageDisplaySummary {
  try {
    // 1. Verify localStorage accessibility
    if (typeof window === 'undefined' || !window.localStorage) {
      return {
        mediaCacheMb: 0,
        formattedMediaCache: 'Storage usage unavailable',
        historyMb: 0,
        formattedHistory: 'Storage usage unavailable',
        totalAppDataMb: 0,
        formattedTotalAppData: 'Storage usage unavailable',
        isUnavailable: true,
        unavailableReason: 'Browser storage API is inaccessible in this environment.',
        mediaFileCount: 0,
        historyRecordCount: 0
      };
    }

    // 2. Measure Media Cache
    const mediaStore = getMediaCacheStore();
    const mediaFileCount = mediaStore.items.length;
    const mediaCacheBytes = mediaStore.items.reduce((sum, item) => sum + (item.sizeBytes || 0), 0);

    // 3. Measure History
    const rawHistory = localStorage.getItem(STORAGE_KEY_HISTORY) || localStorage.getItem('sss_post_history') || '';
    let historyRecordCount = 0;
    try {
      const parsed = JSON.parse(rawHistory);
      if (Array.isArray(parsed)) historyRecordCount = parsed.length;
    } catch {}

    const rawDiscovered = localStorage.getItem(STORAGE_KEY_DISCOVERED_HISTORY) || '';
    // String UTF-16 byte length ~ 2 bytes per char
    const historyBytes = (rawHistory.length * 2) + (rawDiscovered.length * 2);

    // 4. Measure Total Application Data in localStorage
    let totalStorageBytes = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const val = localStorage.getItem(key) || '';
        totalStorageBytes += (key.length + val.length) * 2;
      }
    }

    // Total app data = localStorage data + binary media cache data
    const totalAppDataBytes = totalStorageBytes + mediaCacheBytes;

    const mediaMb = mediaCacheBytes / (1024 * 1024);
    const historyMb = historyBytes / (1024 * 1024);
    const totalMb = totalAppDataBytes / (1024 * 1024);

    return {
      mediaCacheMb: mediaMb,
      formattedMediaCache: formatSummaryMb(mediaCacheBytes),
      historyMb: historyMb,
      formattedHistory: formatSummaryMb(historyBytes),
      totalAppDataMb: totalMb,
      formattedTotalAppData: formatSummaryMb(totalAppDataBytes),
      isUnavailable: false,
      mediaFileCount,
      historyRecordCount
    };
  } catch (err: any) {
    return {
      mediaCacheMb: 0,
      formattedMediaCache: 'Storage usage unavailable',
      historyMb: 0,
      formattedHistory: 'Storage usage unavailable',
      totalAppDataMb: 0,
      formattedTotalAppData: 'Storage usage unavailable',
      isUnavailable: true,
      unavailableReason: err?.message || 'Storage measurement failed',
      mediaFileCount: 0,
      historyRecordCount: 0
    };
  }
}

/**
 * Get current stats of cached media (for "Cached Media X MB / X files")
 */
export function getCachedMediaStats(): { formattedSize: string; sizeBytes: number; fileCount: number } {
  const store = getMediaCacheStore();
  const fileCount = store.items.length;
  const sizeBytes = store.items.reduce((sum, item) => sum + (item.sizeBytes || 0), 0);
  return {
    formattedSize: formatBytesToMb(sizeBytes),
    sizeBytes,
    fileCount
  };
}

/**
 * Clear Media Cache completely (User action via [Clear Media Cache])
 * Applies ONLY to locally cached/downloaded media used by:
 * - News Hunter
 * - News Library media (cached previews/downloaded files)
 * - Media Discovery
 * - Preview media
 * - Temporary downloaded images
 * - Temporary downloaded videos
 * 
 * SAFETY: Does NOT delete:
 * - user-uploaded original media
 * - media explicitly saved by user as permanent
 * - Draft content references
 * - account data
 * - settings
 * - backups
 */
export async function clearMediaCacheCompletely(): Promise<{ bytesRemoved: number; filesRemoved: number; formattedRemoved: string }> {
  try {
    const store = getMediaCacheStore();
    const protectedUrls = getProtectedMediaUrls();

    let bytesRemoved = 0;
    let filesRemoved = 0;
    const keptItems: MediaCacheItem[] = [];

    for (const item of store.items) {
      // Safety check: is it permanent or referenced in drafts/accounts?
      const isProtected = item.isPermanent === true || protectedUrls.has(item.url);

      if (isProtected) {
        keptItems.push(item);
      } else {
        bytesRemoved += item.sizeBytes || 0;
        filesRemoved++;

        // Revoke blob URL if active
        if (item.url && item.url.startsWith('blob:')) {
          try {
            URL.revokeObjectURL(item.url);
          } catch {}
        }

        // Delete from IndexedDB if stored by key/url
        try {
          if (item.url) await mediaStorage.delete(item.url);
        } catch {}
      }
    }

    // Save updated media cache store
    const updatedStore: MediaCacheStore = {
      items: keptItems,
      lastCleared: new Date().toISOString()
    };
    localStorage.setItem('sss_news_media_cache', JSON.stringify(updatedStore));

    // Also clear transient discovery query cache (no user saved data)
    try {
      localStorage.removeItem('sss_news_discovery_cache');
    } catch {}

    return {
      bytesRemoved,
      filesRemoved,
      formattedRemoved: formatBytesToMb(bytesRemoved)
    };
  } catch (err) {
    console.error('Failed clearing media cache:', err);
    return {
      bytesRemoved: 0,
      filesRemoved: 0,
      formattedRemoved: '0 MB'
    };
  }
}

/**
 * Clean media cache based on retention period.
 * Only removes temporary items older than the retention threshold.
 * If retentionDays === 0 ("Never automatically delete"), deletes nothing.
 */
export async function cleanupMediaCacheByRetention(
  retentionDays: MediaCacheRetentionDays
): Promise<{ bytesRemoved: number; filesRemoved: number; formattedRemoved: string }> {
  // 0 means "Never automatically delete"
  if (retentionDays === 0) {
    return { bytesRemoved: 0, filesRemoved: 0, formattedRemoved: '0 MB' };
  }

  try {
    const store = getMediaCacheStore();
    const protectedUrls = getProtectedMediaUrls();
    const now = Date.now();
    const cutoffMs = now - (retentionDays * 24 * 60 * 60 * 1000);

    let bytesRemoved = 0;
    let filesRemoved = 0;
    const keptItems: MediaCacheItem[] = [];

    for (const item of store.items) {
      // 1. Safety verification: permanent media or draft/account references
      if (item.isPermanent === true || protectedUrls.has(item.url)) {
        keptItems.push(item);
        continue;
      }

      // 2. Check item timestamp
      const itemTimestamp = new Date(item.cachedAt).getTime();
      const isExpired = !isNaN(itemTimestamp) && itemTimestamp < cutoffMs;

      if (isExpired) {
        bytesRemoved += item.sizeBytes || 0;
        filesRemoved++;

        if (item.url && item.url.startsWith('blob:')) {
          try {
            URL.revokeObjectURL(item.url);
          } catch {}
        }
        try {
          if (item.url) await mediaStorage.delete(item.url);
        } catch {}
      } else {
        // Keep recent cache items
        keptItems.push(item);
      }
    }

    const updatedStore: MediaCacheStore = {
      items: keptItems,
      lastCleared: store.lastCleared
    };
    localStorage.setItem('sss_news_media_cache', JSON.stringify(updatedStore));

    return {
      bytesRemoved,
      filesRemoved,
      formattedRemoved: formatBytesToMb(bytesRemoved)
    };
  } catch (err) {
    console.error('Failed cleaning media cache by retention:', err);
    return { bytesRemoved: 0, filesRemoved: 0, formattedRemoved: '0 MB' };
  }
}

/**
 * Clean history records based on retention period.
 * Applies to:
 * - completed Share Engine sessions
 * - completed/old history records
 * - old activity/history entries
 * 
 * SAFETY: Does NOT delete:
 * - Drafts
 * - Queue
 * - Scheduled posts
 * - Social Media Accounts
 * - Posting Groups
 * - News Library saved items
 * - Backups
 * - Subscription state
 * - Settings
 */
export function cleanupHistoryByRetention(
  retentionDays: HistoryRetentionDays
): { historyRecordsRemoved: number } {
  // 0 means "Never automatically delete"
  if (retentionDays === 0) {
    return { historyRecordsRemoved: 0 };
  }

  try {
    const rawHistory = localStorage.getItem(STORAGE_KEY_HISTORY) || localStorage.getItem('sss_post_history');
    if (!rawHistory) return { historyRecordsRemoved: 0 };

    const history: SocialPost[] = JSON.parse(rawHistory);
    if (!Array.isArray(history) || history.length === 0) {
      return { historyRecordsRemoved: 0 };
    }

    const protectedIds = getProtectedPostIds();
    const now = Date.now();
    const cutoffMs = now - (retentionDays * 24 * 60 * 60 * 1000);

    let historyRecordsRemoved = 0;
    const keptHistory: SocialPost[] = [];

    for (const post of history) {
      // 1. Safety check: Never delete if referenced in drafts, queue, or news library
      if (protectedIds.has(post.id)) {
        keptHistory.push(post);
        continue;
      }

      // 2. Determine post age: latest of createdAt or platformStatuses updatedAt
      let postTime = new Date(post.createdAt).getTime();
      if (post.platformStatuses) {
        Object.values(post.platformStatuses).forEach(status => {
          if (status.updatedAt) {
            const updated = new Date(status.updatedAt).getTime();
            if (!isNaN(updated) && updated > postTime) postTime = updated;
          }
        });
      }

      const isExpired = !isNaN(postTime) && postTime < cutoffMs;

      if (isExpired) {
        historyRecordsRemoved++;
      } else {
        keptHistory.push(post);
      }
    }

    if (historyRecordsRemoved > 0) {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(keptHistory));
      localStorage.setItem('sss_post_history', JSON.stringify(keptHistory));
      
      // Notify running components of history update
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('sss_history_updated'));
      }
    }

    // Also safely clean expired discovery stories history
    try {
      const rawDisc = localStorage.getItem(STORAGE_KEY_DISCOVERED_HISTORY);
      if (rawDisc) {
        const discStories = JSON.parse(rawDisc);
        if (Array.isArray(discStories)) {
          const keptDisc = discStories.filter((s: any) => {
            const t = new Date(s.discoveredAt || s.firstSeenAt || s.publishedAt).getTime();
            return isNaN(t) || t >= cutoffMs;
          });
          localStorage.setItem(STORAGE_KEY_DISCOVERED_HISTORY, JSON.stringify(keptDisc));
        }
      }
    } catch {}

    // Clean active share session if completed and expired
    try {
      const rawSession = localStorage.getItem(STORAGE_KEY_ACTIVE_SHARE_SESSION);
      if (rawSession) {
        const session = JSON.parse(rawSession);
        if (session.status === 'completed' && session.createdAt) {
          const sTime = new Date(session.createdAt).getTime();
          if (!isNaN(sTime) && sTime < cutoffMs) {
            localStorage.removeItem(STORAGE_KEY_ACTIVE_SHARE_SESSION);
          }
        }
      }
    } catch {}

    return { historyRecordsRemoved };
  } catch (err) {
    console.error('Failed cleaning history by retention:', err);
    return { historyRecordsRemoved: 0 };
  }
}

/**
 * Check if the application is due for automatic cleanup today based on the UTC schedule.
 * Does not depend on the user's local timezone.
 */
export function isDueForAutomaticCleanup(settings: StorageCacheSettings): boolean {
  if (!settings.autoMediaCleanupEnabled && !settings.autoHistoryCleanupEnabled) {
    return false;
  }

  try {
    const now = new Date();
    const [hoursStr, minutesStr] = (settings.cleanupTimeUtc || '00:00').split(':');
    const scheduledHours = parseInt(hoursStr, 10) || 0;
    const scheduledMinutes = parseInt(minutesStr, 10) || 0;

    // Build today's scheduled UTC timestamp
    const targetUtcToday = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      scheduledHours,
      scheduledMinutes,
      0
    ));

    // Has today's scheduled UTC time arrived?
    if (now.getTime() >= targetUtcToday.getTime()) {
      // Check if we already ran cleanup on or after today's scheduled time
      if (!settings.lastAutomaticCleanupUtc) return true;
      const lastRun = new Date(settings.lastAutomaticCleanupUtc).getTime();
      return isNaN(lastRun) || lastRun < targetUtcToday.getTime();
    } else {
      // Before today's scheduled UTC time: check yesterday's target
      const targetUtcYesterday = new Date(targetUtcToday.getTime() - 24 * 60 * 60 * 1000);
      if (!settings.lastAutomaticCleanupUtc) return true;
      const lastRun = new Date(settings.lastAutomaticCleanupUtc).getTime();
      return isNaN(lastRun) || lastRun < targetUtcYesterday.getTime();
    }
  } catch {
    return false;
  }
}

/**
 * Execute Storage Cleanup
 * Can be run manually ([Clean Now]) or automatically via schedule.
 */
export async function executeStorageCleanup(
  settings: StorageCacheSettings,
  options: { forceManual?: boolean } = {}
): Promise<CleanupResult> {
  const isManual = !!options.forceManual;

  // For automatic runs, verify if due
  if (!isManual && !isDueForAutomaticCleanup(settings)) {
    return {
      mediaBytesRemoved: 0,
      formattedMediaRemoved: '0 MB',
      mediaFilesRemoved: 0,
      historyRecordsRemoved: 0,
      completedAt: new Date().toISOString(),
      status: 'no_action_needed',
      summaryMessage: 'Automatic cleanup already completed for this cycle.'
    };
  }

  let totalMediaBytes = 0;
  let totalMediaFiles = 0;
  let totalHistoryRecords = 0;

  // 1. Clean Media Cache (if enabled or manual)
  if (isManual || settings.autoMediaCleanupEnabled) {
    if (settings.mediaRetentionDays > 0) {
      const mediaResult = await cleanupMediaCacheByRetention(settings.mediaRetentionDays);
      totalMediaBytes = mediaResult.bytesRemoved;
      totalMediaFiles = mediaResult.filesRemoved;
    }
  }

  // 2. Clean Expired History (if enabled or manual)
  if (isManual || settings.autoHistoryCleanupEnabled) {
    if (settings.historyRetentionDays > 0) {
      const historyResult = cleanupHistoryByRetention(settings.historyRetentionDays);
      totalHistoryRecords = historyResult.historyRecordsRemoved;
    }
  }

  const completedAt = new Date().toISOString();

  // If automatic run, record checkpoint
  if (!isManual) {
    try {
      const rawSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (rawSettings) {
        const appSet = JSON.parse(rawSettings);
        if (appSet.storageCacheSettings) {
          appSet.storageCacheSettings.lastAutomaticCleanupUtc = completedAt;
          localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(appSet));
        }
      }
    } catch {}
  }

  const formattedMediaRemoved = formatSummaryMb(totalMediaBytes);

  return {
    mediaBytesRemoved: totalMediaBytes,
    formattedMediaRemoved,
    mediaFilesRemoved: totalMediaFiles,
    historyRecordsRemoved: totalHistoryRecords,
    completedAt,
    status: 'success',
    summaryMessage: 'Cleanup completed.',
    clearedMediaDetails: `Media removed: ${formattedMediaRemoved}`,
    clearedHistoryDetails: `History records removed: ${totalHistoryRecords}`
  };
}

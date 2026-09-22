import {
  BackupFile,
  BackupData,
  RecoverySnapshot,
  DataIntegrityReport,
  DataIntegrityIssue,
  MergeConflict,
  DATA_SCHEMA_VERSION,
  APP_CURRENT_VERSION,
  UserSocialAccounts,
  SocialGroup,
  SocialPost,
  ContentQueueItem,
  SavedNewsItem,
  NewsHunterSettings,
  AutoHuntSettings,
  NewsRssSource,
  AppSettings,
  DEFAULT_RSS_SOURCES,
  DEFAULT_NEWS_HUNTER_SETTINGS,
  DEFAULT_AUTO_HUNT_SETTINGS
} from '../types';
import { DEFAULT_USER_ACCOUNTS, DEFAULT_SOCIAL_GROUPS } from '../types';
import { loadSavedNewsLibrary, loadNewsSettings, loadAutoHuntSettings, loadNewsSources } from './newsEngine';

// Storage keys
export const STORAGE_KEYS = {
  ACCOUNTS: 'sss_user_accounts',
  GROUPS: 'sss_social_groups',
  DRAFTS: 'sss_drafts',
  HISTORY: 'sss_history',
  QUEUE: 'sss_content_queue',
  SETTINGS: 'sss_settings',
  NEWS_SOURCES: 'sss_news_sources',
  NEWS_SETTINGS: 'sss_news_settings',
  AUTO_HUNT_SETTINGS: 'sss_auto_hunt_settings',
  NEWS_LIBRARY: 'sss_news_library',
  NEWS_CACHE: 'sss_news_cache',
  LAST_BACKUP: 'sss_last_backup_time',
  LAST_INTEGRITY_CHECK: 'sss_last_integrity_check_time',
  RECOVERY_COPIES: 'sss_recovery_snapshots',
  SCHEMA_VERSION: 'sss_schema_version'
};

// ==========================================
// 1. DATA GATHERING & SANITIZATION
// ==========================================

function readJsonFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/**
 * Strips any sensitive credentials (tokens, secrets, passwords)
 * to ensure privacy and security.
 */
function sanitizeSensitiveData(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeSensitiveData(item));
  }

  const cleaned: Record<string, any> = {};
  const sensitiveKeys = ['password', 'secret', 'clientSecret', 'accessToken', 'token', 'apiKey', 'authToken'];

  for (const [k, v] of Object.entries(obj)) {
    if (sensitiveKeys.some(s => k.toLowerCase().includes(s.toLowerCase()))) {
      continue; // Exclude sensitive credential
    }
    cleaned[k] = sanitizeSensitiveData(v);
  }
  return cleaned;
}

/**
 * Ensures media in posts doesn't include massive base64 payloads
 * while preserving valid remote URLs, names, and sources.
 */
function sanitizeMediaField(media: any): any {
  if (!media) return null;
  const isBase64Blob = typeof media.url === 'string' && media.url.startsWith('data:') && media.url.length > 50000;
  
  return {
    id: media.id || `media-${Date.now()}`,
    name: media.name || 'Attachment',
    type: media.type || 'image',
    url: isBase64Blob ? '' : (media.url || ''),
    source: media.source || 'local',
    localReference: media.localReference || undefined,
    unavailableNote: isBase64Blob ? 'Media file is not included in this backup.' : undefined
  };
}

function sanitizePostMediaList(posts: SocialPost[]): SocialPost[] {
  return posts.map(p => ({
    ...p,
    media: p.media ? sanitizeMediaField(p.media) : null
  }));
}

function sanitizeQueueMediaList(items: ContentQueueItem[]): ContentQueueItem[] {
  return items.map(q => ({
    ...q,
    media: q.media ? sanitizeMediaField(q.media) : undefined
  }));
}

// ==========================================
// 2. EXPORT & BACKUP CREATION
// ==========================================

export function createCompleteBackupData(options?: { includeDiscoveryCache?: boolean }): BackupFile {
  const accounts: UserSocialAccounts = readJsonFromStorage(STORAGE_KEYS.ACCOUNTS, DEFAULT_USER_ACCOUNTS);
  const groups: SocialGroup[] = readJsonFromStorage(STORAGE_KEYS.GROUPS, DEFAULT_SOCIAL_GROUPS);
  const drafts: SocialPost[] = readJsonFromStorage(STORAGE_KEYS.DRAFTS, []);
  const history: SocialPost[] = readJsonFromStorage(STORAGE_KEYS.HISTORY, []);
  const queue: ContentQueueItem[] = readJsonFromStorage(STORAGE_KEYS.QUEUE, []);
  const settings: AppSettings = readJsonFromStorage(STORAGE_KEYS.SETTINGS, {
    language: 'en',
    timezone: 'Asia/Jakarta',
    notificationEnabled: true,
    isExpoGoMode: true,
    hasDevBuild: false,
    defaultHashtags: [],
    theme: 'dark'
  });

  const newsLibrary = loadSavedNewsLibrary();
  const newsHunter = loadNewsSettings();
  const autoHunt = loadAutoHuntSettings();
  const newsSources = loadNewsSources();

  let discoveryCache: any = undefined;
  if (options?.includeDiscoveryCache) {
    discoveryCache = readJsonFromStorage(STORAGE_KEYS.NEWS_CACHE, null);
  }

  const cleanAccounts = sanitizeSensitiveData(accounts);
  const cleanGroups = sanitizeSensitiveData(groups);
  const cleanDrafts = sanitizeSensitiveData(sanitizePostMediaList(drafts));
  const cleanHistory = sanitizeSensitiveData(sanitizePostMediaList(history));
  const cleanQueue = sanitizeSensitiveData(sanitizeQueueMediaList(queue));
  const cleanNewsLibrary = sanitizeSensitiveData(newsLibrary);
  const cleanSettings = sanitizeSensitiveData(settings);

  const backupData: BackupData = {
    accounts: cleanAccounts,
    groups: cleanGroups,
    drafts: cleanDrafts,
    history: cleanHistory,
    newsLibrary: cleanNewsLibrary,
    newsHunter,
    autoHunt,
    newsSources,
    queue: cleanQueue,
    settings: cleanSettings,
    discoveryCache
  };

  return {
    backupVersion: DATA_SCHEMA_VERSION,
    createdAt: new Date().toISOString(),
    appVersion: APP_CURRENT_VERSION,
    timezone: settings.timezone || 'Asia/Jakarta',
    data: backupData
  };
}

export function generateBackupFileName(createdAtIso?: string): string {
  const date = createdAtIso ? new Date(createdAtIso) : new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());

  return `SocialShareScheduler_Backup_${yyyy}-${mm}-${dd}_${hh}-${min}.json`;
}

export function downloadBackupFile(backup: BackupFile): string {
  const filename = generateBackupFileName(backup.createdAt);
  const jsonString = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);

  // Update last backup timestamp
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_BACKUP, backup.createdAt);
  } catch {}

  return filename;
}

// ==========================================
// 3. RECOVERY COPIES (LOCAL SAFETY SNAPSHOTS)
// ==========================================

const MAX_RECOVERY_COPIES = 3;

export function loadRecoverySnapshots(): RecoverySnapshot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECOVERY_COPIES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function createRecoverySnapshot(label: string = 'Safety Snapshot'): RecoverySnapshot {
  const currentBackup = createCompleteBackupData({ includeDiscoveryCache: false });
  const jsonStr = JSON.stringify(currentBackup);

  let totalAccounts = 0;
  if (currentBackup.data.accounts) {
    const acc = currentBackup.data.accounts;
    totalAccounts = (acc.facebook_page?.length || 0) + 
                    (acc.facebook_profile?.length || 0) + 
                    (acc.instagram?.length || 0) + 
                    (acc.tiktok?.length || 0) + 
                    (acc.youtube?.length || 0) + 
                    (acc.twitter?.length || 0) + 
                    (acc.whatsapp?.length || 0);
  }

  const snapshot: RecoverySnapshot = {
    id: `snap-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    label,
    sizeEstimateBytes: jsonStr.length * 2,
    itemCounts: {
      accounts: totalAccounts,
      groups: currentBackup.data.groups?.length || 0,
      drafts: currentBackup.data.drafts?.length || 0,
      queue: currentBackup.data.queue?.length || 0,
      history: currentBackup.data.history?.length || 0,
      newsLibrary: currentBackup.data.newsLibrary?.length || 0
    },
    backupFile: currentBackup
  };

  try {
    const existing = loadRecoverySnapshots();
    // Keep max 3 most recent recovery copies
    const updated = [snapshot, ...existing].slice(0, MAX_RECOVERY_COPIES);
    localStorage.setItem(STORAGE_KEYS.RECOVERY_COPIES, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to store recovery snapshot:', err);
  }

  return snapshot;
}

export function deleteRecoverySnapshot(id: string): RecoverySnapshot[] {
  try {
    const existing = loadRecoverySnapshots();
    const updated = existing.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.RECOVERY_COPIES, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

// ==========================================
// 4. BACKUP VALIDATION & COMPATIBILITY
// ==========================================

export interface BackupValidationResult {
  isValid: boolean;
  error?: string;
  isOlderVersion?: boolean;
  version?: number;
  itemCounts?: {
    accounts: number;
    groups: number;
    drafts: number;
    queue: number;
    history: number;
    newsLibrary: number;
  };
  backup?: BackupFile;
}

export function validateBackupFile(fileContent: any): BackupValidationResult {
  if (!fileContent || typeof fileContent !== 'object') {
    return { isValid: false, error: 'Backup file is invalid or incomplete.' };
  }

  // Required top-level fields
  if (!fileContent.data || typeof fileContent.data !== 'object') {
    return { isValid: false, error: 'Backup file is missing required application data payload.' };
  }

  const data = fileContent.data;
  const version = typeof fileContent.backupVersion === 'number' ? fileContent.backupVersion : 1;
  const isOlderVersion = version < DATA_SCHEMA_VERSION;

  // Validate core structures
  const hasAccounts = data.accounts && typeof data.accounts === 'object';
  const hasGroups = Array.isArray(data.groups);
  const hasDrafts = Array.isArray(data.drafts);
  const hasHistory = Array.isArray(data.history);
  const hasQueue = Array.isArray(data.queue);

  if (!hasAccounts && !hasGroups && !hasDrafts && !hasHistory && !hasQueue) {
    return { isValid: false, error: 'Backup file is invalid or incomplete: No valid collections detected.' };
  }

  // Count items
  let totalAccounts = 0;
  if (data.accounts) {
    const acc = data.accounts;
    totalAccounts = (acc.facebook_page?.length || 0) + 
                    (acc.facebook_profile?.length || 0) + 
                    (acc.instagram?.length || 0) + 
                    (acc.tiktok?.length || 0) + 
                    (acc.youtube?.length || 0) + 
                    (acc.twitter?.length || 0) + 
                    (acc.whatsapp?.length || 0);
  }

  // Normalize missing fields for older versions without throwing away user data
  const normalizedBackup: BackupFile = {
    backupVersion: version,
    createdAt: fileContent.createdAt || new Date().toISOString(),
    appVersion: fileContent.appVersion || '1.0.0',
    timezone: fileContent.timezone || data.settings?.timezone || 'Asia/Jakarta',
    data: {
      accounts: data.accounts || DEFAULT_USER_ACCOUNTS,
      groups: Array.isArray(data.groups) ? data.groups : [],
      drafts: Array.isArray(data.drafts) ? data.drafts : [],
      history: Array.isArray(data.history) ? data.history : [],
      newsLibrary: Array.isArray(data.newsLibrary) ? data.newsLibrary : [],
      newsHunter: data.newsHunter || DEFAULT_NEWS_HUNTER_SETTINGS,
      autoHunt: data.autoHunt || DEFAULT_AUTO_HUNT_SETTINGS,
      newsSources: Array.isArray(data.newsSources) ? data.newsSources : DEFAULT_RSS_SOURCES,
      queue: Array.isArray(data.queue) ? data.queue : [],
      settings: data.settings || {
        language: 'en',
        timezone: 'Asia/Jakarta',
        notificationEnabled: true,
        isExpoGoMode: true,
        hasDevBuild: false,
        defaultHashtags: [],
        theme: 'dark'
      },
      discoveryCache: data.discoveryCache
    }
  };

  return {
    isValid: true,
    isOlderVersion,
    version,
    itemCounts: {
      accounts: totalAccounts,
      groups: normalizedBackup.data.groups.length,
      drafts: normalizedBackup.data.drafts.length,
      queue: normalizedBackup.data.queue.length,
      history: normalizedBackup.data.history.length,
      newsLibrary: normalizedBackup.data.newsLibrary.length
    },
    backup: normalizedBackup
  };
}

// ==========================================
// 5. RESTORE MODES: REPLACE & MERGE
// ==========================================

export function restoreBackupReplace(backup: BackupFile): { success: boolean; error?: string } {
  // Step 1: Automatic Safety Backup before replacement
  const safetySnapshot = createRecoverySnapshot('Pre-Restore Safety Snapshot');

  try {
    const data = backup.data;

    // Overwrite data with validated backup
    if (data.accounts) localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(data.accounts));
    if (data.groups) localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(data.groups));
    if (data.drafts) localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(data.drafts));
    if (data.history) localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(data.history));
    if (data.queue) localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(data.queue));
    if (data.newsLibrary) localStorage.setItem(STORAGE_KEYS.NEWS_LIBRARY, JSON.stringify(data.newsLibrary));
    if (data.newsHunter) localStorage.setItem(STORAGE_KEYS.NEWS_SETTINGS, JSON.stringify(data.newsHunter));
    if (data.autoHunt) localStorage.setItem(STORAGE_KEYS.AUTO_HUNT_SETTINGS, JSON.stringify(data.autoHunt));
    if (data.newsSources) localStorage.setItem(STORAGE_KEYS.NEWS_SOURCES, JSON.stringify(data.newsSources));
    if (data.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
    if (data.discoveryCache) localStorage.setItem(STORAGE_KEYS.NEWS_CACHE, JSON.stringify(data.discoveryCache));

    return { success: true };
  } catch (err: any) {
    console.error('Failed to replace data, rolling back to safety backup:', err);
    // Rollback from safety snapshot
    if (safetySnapshot.backupFile) {
      try {
        const rollback = safetySnapshot.backupFile.data;
        localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(rollback.accounts));
        localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(rollback.groups));
        localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(rollback.drafts));
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(rollback.history));
        localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(rollback.queue));
      } catch {}
    }
    return { success: false, error: err?.message || 'Restore failed. Rollback applied.' };
  }
}

/**
 * Detect conflicts before merge
 */
export function detectMergeConflicts(backup: BackupFile): MergeConflict[] {
  const currentBackup = createCompleteBackupData();
  const conflicts: MergeConflict[] = [];

  // 1. Check Drafts
  const currentDraftsMap = new Map(currentBackup.data.drafts.map(d => [d.id, d]));
  backup.data.drafts.forEach(bDraft => {
    const existing = currentDraftsMap.get(bDraft.id);
    if (existing && (existing.title !== bDraft.title || existing.caption !== bDraft.caption)) {
      conflicts.push({
        id: bDraft.id,
        category: 'draft',
        title: `Draft: ${bDraft.title || 'Untitled Draft'}`,
        currentSummary: `Caption: "${existing.caption?.substring(0, 50)}..."`,
        backupSummary: `Caption: "${bDraft.caption?.substring(0, 50)}..."`,
        currentItem: existing,
        backupItem: bDraft
      });
    }
  });

  // 2. Check Queue
  const currentQueueMap = new Map(currentBackup.data.queue.map(q => [q.id, q]));
  backup.data.queue.forEach(bQueue => {
    const existing = currentQueueMap.get(bQueue.id);
    if (existing && (existing.title !== bQueue.title || existing.scheduledAt !== bQueue.scheduledAt)) {
      conflicts.push({
        id: bQueue.id,
        category: 'queue',
        title: `Queue: ${bQueue.title || 'Scheduled Item'}`,
        currentSummary: `Time: ${new Date(existing.scheduledAt).toLocaleString()}`,
        backupSummary: `Time: ${new Date(bQueue.scheduledAt).toLocaleString()}`,
        currentItem: existing,
        backupItem: bQueue
      });
    }
  });

  // 3. Check Groups
  const currentGroupsMap = new Map(currentBackup.data.groups.map(g => [g.id, g]));
  backup.data.groups.forEach(bGroup => {
    const existing = currentGroupsMap.get(bGroup.id);
    if (existing && (existing.name !== bGroup.name || existing.destinationIds?.length !== bGroup.destinationIds?.length)) {
      conflicts.push({
        id: bGroup.id,
        category: 'group',
        title: `Group: ${bGroup.name}`,
        currentSummary: `Destinations: ${existing.destinationIds?.length || 0}`,
        backupSummary: `Destinations: ${bGroup.destinationIds?.length || 0}`,
        currentItem: existing,
        backupItem: bGroup
      });
    }
  });

  return conflicts;
}

/**
 * Merge Backup with existing data, respecting user conflict resolutions
 */
export function restoreBackupMerge(
  backup: BackupFile, 
  resolutions: Record<string, 'current' | 'backup' | 'both'> = {}
): { success: boolean; mergedData: BackupData; error?: string } {
  // Step 1: Automatic Safety Backup
  createRecoverySnapshot('Pre-Merge Safety Snapshot');

  try {
    const current = createCompleteBackupData();
    const bData = backup.data;

    // A. Merge Accounts
    const mergedAccounts: UserSocialAccounts = {
      facebook_page: [...(current.data.accounts.facebook_page || [])],
      facebook_profile: [...(current.data.accounts.facebook_profile || [])],
      instagram: [...(current.data.accounts.instagram || [])],
      tiktok: [...(current.data.accounts.tiktok || [])],
      youtube: [...(current.data.accounts.youtube || [])],
      twitter: [...(current.data.accounts.twitter || [])],
      whatsapp: [...(current.data.accounts.whatsapp || [])]
    };

    const addAccountIfNew = (list: any[], newItem: any) => {
      if (!list.some(item => item.id === newItem.id || (item.url && item.url === newItem.url))) {
        list.push(newItem);
      }
    };

    (bData.accounts.facebook_page || []).forEach(a => addAccountIfNew(mergedAccounts.facebook_page, a));
    (bData.accounts.facebook_profile || []).forEach(a => addAccountIfNew(mergedAccounts.facebook_profile, a));
    (bData.accounts.instagram || []).forEach(a => addAccountIfNew(mergedAccounts.instagram, a));
    (bData.accounts.tiktok || []).forEach(a => addAccountIfNew(mergedAccounts.tiktok, a));
    (bData.accounts.youtube || []).forEach(a => addAccountIfNew(mergedAccounts.youtube, a));
    (bData.accounts.twitter || []).forEach(a => addAccountIfNew(mergedAccounts.twitter, a));
    (bData.accounts.whatsapp || []).forEach(a => addAccountIfNew(mergedAccounts.whatsapp, a));

    // B. Merge Groups
    const mergedGroups = [...current.data.groups];
    bData.groups.forEach(bGroup => {
      const existingIdx = mergedGroups.findIndex(g => g.id === bGroup.id);
      if (existingIdx === -1) {
        mergedGroups.push(bGroup);
      } else {
        const resolution = resolutions[bGroup.id] || 'current';
        if (resolution === 'backup') {
          mergedGroups[existingIdx] = bGroup;
        } else if (resolution === 'both') {
          mergedGroups.push({
            ...bGroup,
            id: `group-merged-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: `${bGroup.name} (Backup Copy)`
          });
        }
      }
    });

    // C. Merge Drafts
    const mergedDrafts = [...current.data.drafts];
    bData.drafts.forEach(bDraft => {
      const existingIdx = mergedDrafts.findIndex(d => d.id === bDraft.id);
      if (existingIdx === -1) {
        mergedDrafts.push(bDraft);
      } else {
        const resolution = resolutions[bDraft.id] || 'current';
        if (resolution === 'backup') {
          mergedDrafts[existingIdx] = bDraft;
        } else if (resolution === 'both') {
          mergedDrafts.push({
            ...bDraft,
            id: `draft-merged-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            title: bDraft.title ? `${bDraft.title} (Backup Copy)` : 'Backup Draft'
          });
        }
      }
    });

    // D. Merge Queue
    const mergedQueue = [...current.data.queue];
    bData.queue.forEach(bQueue => {
      const existingIdx = mergedQueue.findIndex(q => q.id === bQueue.id);
      if (existingIdx === -1) {
        mergedQueue.push(bQueue);
      } else {
        const resolution = resolutions[bQueue.id] || 'current';
        if (resolution === 'backup') {
          mergedQueue[existingIdx] = bQueue;
        } else if (resolution === 'both') {
          mergedQueue.push({
            ...bQueue,
            id: `queue-merged-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            title: bQueue.title ? `${bQueue.title} (Backup Copy)` : 'Backup Scheduled Item'
          });
        }
      }
    });

    // E. Merge History
    const mergedHistory = [...current.data.history];
    bData.history.forEach(bHist => {
      if (!mergedHistory.some(h => h.id === bHist.id)) {
        mergedHistory.push(bHist);
      }
    });

    // F. Merge News Library
    const mergedNewsLibrary = [...current.data.newsLibrary];
    (bData.newsLibrary || []).forEach(bNews => {
      if (!mergedNewsLibrary.some(n => n.id === bNews.id || (n.url && n.url === bNews.url))) {
        mergedNewsLibrary.push(bNews);
      }
    });

    // Save all merged data to LocalStorage
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(mergedAccounts));
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(mergedGroups));
    localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(mergedDrafts));
    localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(mergedQueue));
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(mergedHistory));
    localStorage.setItem(STORAGE_KEYS.NEWS_LIBRARY, JSON.stringify(mergedNewsLibrary));

    const finalMergedData: BackupData = {
      accounts: mergedAccounts,
      groups: mergedGroups,
      drafts: mergedDrafts,
      queue: mergedQueue,
      history: mergedHistory,
      newsLibrary: mergedNewsLibrary,
      newsHunter: current.data.newsHunter,
      autoHunt: current.data.autoHunt,
      newsSources: current.data.newsSources,
      settings: current.data.settings
    };

    return { success: true, mergedData: finalMergedData };
  } catch (err: any) {
    return { success: false, mergedData: {} as any, error: err?.message || 'Merge failed.' };
  }
}

// ==========================================
// 6. DATA INTEGRITY CHECK & REPAIR ASSISTANT
// ==========================================

export function checkDataIntegrity(): DataIntegrityReport {
  const current = createCompleteBackupData();
  const issues: DataIntegrityIssue[] = [];

  const accounts = current.data.accounts;
  const groups = current.data.groups;
  const drafts = current.data.drafts;
  const queue = current.data.queue;
  const history = current.data.history;
  const newsLibrary = current.data.newsLibrary;

  // Build set of valid account destination IDs
  const validAccountIds = new Set<string>();
  Object.values(accounts).forEach((list: any[]) => {
    if (Array.isArray(list)) {
      list.forEach(item => {
        if (item.id) validAccountIds.add(item.id);
      });
    }
  });

  const validGroupIds = new Set(groups.map(g => g.id));

  // 1. Check Missing or Duplicate IDs in Groups
  const seenGroupIds = new Set<string>();
  groups.forEach(g => {
    if (!g.id) {
      issues.push({
        id: `group-missing-id-${Math.random()}`,
        type: 'error',
        category: 'group',
        title: `Posting Group missing unique ID`,
        description: `Group "${g.name || 'Unnamed'}" has no unique ID.`,
        repairable: true,
        repairAction: 'regenerate_id',
        details: { group: g }
      });
    } else if (seenGroupIds.has(g.id)) {
      issues.push({
        id: `group-duplicate-id-${g.id}`,
        type: 'warning',
        category: 'group',
        title: `Duplicate Group ID detected`,
        description: `Group ID "${g.id}" is shared by multiple groups.`,
        repairable: true,
        repairAction: 'remove_duplicate_id',
        details: { groupId: g.id }
      });
    } else {
      seenGroupIds.add(g.id);
    }

    // Check broken references in group destinations
    if (Array.isArray(g.destinationIds)) {
      const brokenDests = g.destinationIds.filter(id => !validAccountIds.has(id));
      if (brokenDests.length > 0) {
        issues.push({
          id: `group-broken-dest-${g.id}`,
          type: 'warning',
          category: 'group',
          title: `Group references removed accounts`,
          description: `Group "${g.name}" contains ${brokenDests.length} destination(s) that no longer exist in configured accounts.`,
          repairable: true,
          repairAction: 'detach_deleted_accounts',
          details: { groupId: g.id, brokenIds: brokenDests }
        });
      }
    }
  });

  // 2. Check Drafts
  const seenDraftIds = new Set<string>();
  drafts.forEach(d => {
    if (!d.id) {
      issues.push({
        id: `draft-missing-id-${Math.random()}`,
        type: 'error',
        category: 'draft',
        title: `Draft missing unique ID`,
        description: `Draft "${d.title || 'Untitled'}" is missing an ID.`,
        repairable: true,
        repairAction: 'regenerate_id',
        details: { draft: d }
      });
    } else if (seenDraftIds.has(d.id)) {
      issues.push({
        id: `draft-duplicate-id-${d.id}`,
        type: 'warning',
        category: 'draft',
        title: `Duplicate Draft ID detected`,
        description: `Draft ID "${d.id}" is shared by multiple drafts.`,
        repairable: true,
        repairAction: 'remove_duplicate_id',
        details: { draftId: d.id }
      });
    } else {
      seenDraftIds.add(d.id);
    }

    // Check referenced group
    if (d.selectedGroupId && !validGroupIds.has(d.selectedGroupId)) {
      issues.push({
        id: `draft-broken-group-${d.id}`,
        type: 'warning',
        category: 'draft',
        title: `Draft references deleted Group`,
        description: `Draft "${d.title || 'Untitled'}" is assigned to a group that was deleted.`,
        repairable: true,
        repairAction: 'detach_deleted_accounts',
        details: { draftId: d.id }
      });
    }
  });

  // 3. Check Queue Items
  const seenQueueIds = new Set<string>();
  queue.forEach(q => {
    if (!q.id) {
      issues.push({
        id: `queue-missing-id-${Math.random()}`,
        type: 'error',
        category: 'queue',
        title: `Queue item missing unique ID`,
        description: `Scheduled item "${q.title || 'Untitled'}" is missing an ID.`,
        repairable: true,
        repairAction: 'regenerate_id',
        details: { queueItem: q }
      });
    } else if (seenQueueIds.has(q.id)) {
      issues.push({
        id: `queue-duplicate-id-${q.id}`,
        type: 'warning',
        category: 'queue',
        title: `Duplicate Queue ID detected`,
        description: `Queue ID "${q.id}" is shared by multiple items.`,
        repairable: true,
        repairAction: 'remove_duplicate_id',
        details: { queueId: q.id }
      });
    } else {
      seenQueueIds.add(q.id);
    }

    // Check broken group reference in queue
    if (q.selectedGroupId && !validGroupIds.has(q.selectedGroupId)) {
      issues.push({
        id: `queue-broken-group-${q.id}`,
        type: 'warning',
        category: 'queue',
        title: `Queue item references missing Group`,
        description: `Post "${q.title || 'Untitled'}" is attached to a deleted posting group.`,
        repairable: true,
        repairAction: 'detach_deleted_accounts',
        details: { queueId: q.id }
      });
    }
  });

  // 4. Check News Library
  newsLibrary.forEach(n => {
    if (!n.id || !n.url) {
      issues.push({
        id: `news-malformed-${Math.random()}`,
        type: 'warning',
        category: 'news',
        title: `Malformed News item in Library`,
        description: `Saved story "${n.title || 'Untitled'}" is missing canonical URL or ID.`,
        repairable: true,
        repairAction: 'regenerate_id',
        details: { newsItem: n }
      });
    }
  });

  // 5. Check History Records
  history.forEach(h => {
    if (!h.id) {
      issues.push({
        id: `history-missing-id-${Math.random()}`,
        type: 'error',
        category: 'history',
        title: `History record missing ID`,
        description: `Past shared post is missing unique identification.`,
        repairable: true,
        repairAction: 'regenerate_id',
        details: { historyItem: h }
      });
    }
  });

  const warnings = issues.filter(i => i.type === 'warning').length;
  const errors = issues.filter(i => i.type === 'error').length;
  const totalChecked = validAccountIds.size + groups.length + drafts.length + queue.length + history.length + newsLibrary.length;
  const healthy = Math.max(0, totalChecked - issues.length);

  const report: DataIntegrityReport = {
    timestamp: new Date().toISOString(),
    healthy,
    warnings,
    errors,
    issues
  };

  try {
    localStorage.setItem(STORAGE_KEYS.LAST_INTEGRITY_CHECK, report.timestamp);
  } catch {}

  return report;
}

/**
 * Safe Repair Assistant: fixes repairable issues without deleting user text content
 */
export function repairDataIntegrity(specificIssueIds?: string[]): { repairedCount: number; report: DataIntegrityReport } {
  // Always create a safety snapshot before any repairs
  createRecoverySnapshot('Pre-Repair Safety Snapshot');

  const current = createCompleteBackupData();
  let repairedCount = 0;

  const validAccountIds = new Set<string>();
  Object.values(current.data.accounts).forEach((list: any[]) => {
    if (Array.isArray(list)) list.forEach(item => item.id && validAccountIds.add(item.id));
  });

  const validGroupIds = new Set(current.data.groups.map(g => g.id));

  // 1. Repair Groups
  const repairedGroups = current.data.groups.map((g, idx) => {
    let updated = { ...g };
    if (!updated.id) {
      updated.id = `group-${Date.now()}-${idx}`;
      repairedCount++;
    }
    // Detach deleted accounts
    if (Array.isArray(updated.destinationIds)) {
      const filtered = updated.destinationIds.filter(id => validAccountIds.has(id));
      if (filtered.length !== updated.destinationIds.length) {
        updated.destinationIds = filtered;
        repairedCount++;
      }
    }
    return updated;
  });

  // 2. Repair Drafts
  const repairedDrafts = current.data.drafts.map((d, idx) => {
    let updated = { ...d };
    if (!updated.id) {
      updated.id = `draft-${Date.now()}-${idx}`;
      repairedCount++;
    }
    if (updated.selectedGroupId && !validGroupIds.has(updated.selectedGroupId)) {
      updated.selectedGroupId = null;
      repairedCount++;
    }
    return updated;
  });

  // 3. Repair Queue
  const repairedQueue = current.data.queue.map((q, idx) => {
    let updated = { ...q };
    if (!updated.id) {
      updated.id = `queue-${Date.now()}-${idx}`;
      repairedCount++;
    }
    if (updated.selectedGroupId && !validGroupIds.has(updated.selectedGroupId)) {
      updated.selectedGroupId = undefined;
      repairedCount++;
    }
    return updated;
  });

  // 4. Repair News Library
  const repairedNews = current.data.newsLibrary.map((n, idx) => {
    let updated = { ...n };
    if (!updated.id) {
      updated.id = `news-${Date.now()}-${idx}`;
      repairedCount++;
    }
    return updated;
  });

  // 5. Repair History
  const repairedHistory = current.data.history.map((h, idx) => {
    let updated = { ...h };
    if (!updated.id) {
      updated.id = `hist-${Date.now()}-${idx}`;
      repairedCount++;
    }
    return updated;
  });

  // Persist repaired state
  localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(repairedGroups));
  localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(repairedDrafts));
  localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(repairedQueue));
  localStorage.setItem(STORAGE_KEYS.NEWS_LIBRARY, JSON.stringify(repairedNews));
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(repairedHistory));

  // Re-run check to return updated report
  const freshReport = checkDataIntegrity();
  return { repairedCount, report: freshReport };
}

// ==========================================
// 7. STORAGE INFO & DANGER ZONE
// ==========================================

export function getStorageUsageSummary() {
  const current = createCompleteBackupData({ includeDiscoveryCache: true });

  let totalAccounts = 0;
  if (current.data.accounts) {
    const acc = current.data.accounts;
    totalAccounts = (acc.facebook_page?.length || 0) + 
                    (acc.facebook_profile?.length || 0) + 
                    (acc.instagram?.length || 0) + 
                    (acc.tiktok?.length || 0) + 
                    (acc.youtube?.length || 0) + 
                    (acc.twitter?.length || 0) + 
                    (acc.whatsapp?.length || 0);
  }

  // Calculate approximate storage in MB
  let totalBytes = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sss_')) {
        const val = localStorage.getItem(key) || '';
        totalBytes += (key.length + val.length) * 2; // UTF-16 bytes
      }
    }
  } catch {
    totalBytes = 150000;
  }

  const megabytes = (totalBytes / (1024 * 1024)).toFixed(2);

  const lastBackup = localStorage.getItem(STORAGE_KEYS.LAST_BACKUP);
  const lastIntegrity = localStorage.getItem(STORAGE_KEYS.LAST_INTEGRITY_CHECK);

  return {
    accountsCount: totalAccounts,
    groupsCount: current.data.groups?.length || 0,
    draftsCount: current.data.drafts?.length || 0,
    queueCount: current.data.queue?.length || 0,
    historyCount: current.data.history?.length || 0,
    newsLibraryCount: current.data.newsLibrary?.length || 0,
    approximateMb: `${megabytes} MB (Estimated)`,
    lastBackupTime: lastBackup || null,
    lastIntegrityTime: lastIntegrity || null
  };
}

/**
 * Resets local user data with pre-reset recovery snapshot safety.
 */
export function resetLocalApplicationData(exportBackupFirst: boolean = false): void {
  // Step 1: Create automatic safety snapshot
  createRecoverySnapshot('Pre-Reset Safety Snapshot');

  if (exportBackupFirst) {
    const current = createCompleteBackupData({ includeDiscoveryCache: false });
    downloadBackupFile(current);
  }

  // Step 2: Clear collections back to clean baseline without corrupting application structure
  localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(DEFAULT_USER_ACCOUNTS));
  localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(DEFAULT_SOCIAL_GROUPS));
  localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.NEWS_LIBRARY, JSON.stringify([]));
  localStorage.removeItem(STORAGE_KEYS.NEWS_CACHE);
}

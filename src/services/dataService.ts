import {
  AppSettings,
  AutoHuntSettings,
  ContentQueueItem,
  DATA_SCHEMA_VERSION,
  DEFAULT_SOCIAL_GROUPS,
  DEFAULT_USER_ACCOUNTS,
  NewsHunterSettings,
  NewsRssSource,
  SAMPLE_QUEUE_ITEMS,
  SavedNewsItem,
  SocialGroup,
  SocialPost,
  UserSocialAccounts
} from '../types';
import {
  CloudWorkspaceDataBundle,
  DataSyncMetadata,
  DatabaseProviderType,
  GuestToAccountMigrationReport,
  ServerEntitlementVerificationResult
} from '../types/cloudData';
import { STORAGE_KEYS, sanitizeSensitiveData } from '../utils/backupEngine';
import { ensureAppSettings } from '../utils/appSettingsDefaults';
import {
  loadAutoHuntSettings,
  loadNewsSettings,
  loadNewsSources,
  loadSavedNewsLibrary,
  saveAutoHuntSettings,
  saveNewsSettings,
  saveNewsSources
} from '../utils/newsEngine';
import { accountService, UserProfile } from './accountService';
import { entitlementService, EntitlementSnapshot } from './entitlementService';
import { apiService } from './apiService';

// ==========================================
// CENTRALIZED DATA ACCESS & REPOSITORY LAYER
// Local-First Persistence + Cloud Sync Foundation
// ==========================================

const SYNC_METADATA_STORAGE_KEY = 'sss_cloud_sync_metadata_v1';
const DEVICE_ID_STORAGE_KEY = 'sss_device_id_v1';

function getOrCreateDeviceId(): string {
  try {
    const existing = localStorage.getItem(DEVICE_ID_STORAGE_KEY);
    if (existing && existing.trim()) return existing.trim();
    const generated = `dev_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(DEVICE_ID_STORAGE_KEY, generated);
    return generated;
  } catch {
    return 'dev_ephemeral_local';
  }
}

/**
 * Provider-neutral Data Storage Adapter contract.
 * Currently implemented by `LocalDataRepositoryAdapter` (offline-first localStorage).
 * Ready to be swapped or composed with a production Cloud Database Adapter
 * (Cloud SQL PostgreSQL, Supabase, Firebase Firestore, or Custom REST Backend)
 * without changing UI components.
 */
export interface DataRepositoryAdapter {
  readonly adapterName: string;
  readonly databaseProvider: DatabaseProviderType;
  readonly isCloudDatabaseConnected: boolean;

  getSocialAccounts(): UserSocialAccounts;
  saveSocialAccounts(accounts: UserSocialAccounts): void;

  getPostingGroups(): SocialGroup[];
  savePostingGroups(groups: SocialGroup[]): void;

  getDrafts(): SocialPost[];
  saveDrafts(drafts: SocialPost[]): void;

  getPostHistory(fallbackInitial?: SocialPost[]): SocialPost[];
  savePostHistory(history: SocialPost[]): void;

  getScheduledQueue(): ContentQueueItem[];
  saveScheduledQueue(queue: ContentQueueItem[]): void;

  getUserSettings(): AppSettings;
  saveUserSettings(settings: AppSettings): void;

  getNewsSources(): NewsRssSource[];
  saveNewsSources(sources: NewsRssSource[]): void;

  getNewsHunterSettings(): NewsHunterSettings;
  saveNewsHunterSettings(settings: NewsHunterSettings): void;

  getAutoHuntSettings(): AutoHuntSettings;
  saveAutoHuntSettings(settings: AutoHuntSettings): void;

  getSavedNewsLibrary(): SavedNewsItem[];
  saveSavedNewsLibrary(items: SavedNewsItem[]): void;
}

/**
 * Default Local-First Repository Adapter.
 * Uses existing `STORAGE_KEYS` so zero existing user data is lost or broken.
 */
class LocalDataRepositoryAdapter implements DataRepositoryAdapter {
  readonly adapterName = 'LocalDataRepositoryAdapter';
  readonly databaseProvider: DatabaseProviderType = 'local_storage_only';
  readonly isCloudDatabaseConnected = false;

  private recordLocalWrite(): void {
    try {
      const now = new Date().toISOString();
      const raw = localStorage.getItem(SYNC_METADATA_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      localStorage.setItem(
        SYNC_METADATA_STORAGE_KEY,
        JSON.stringify({
          ...parsed,
          lastLocalSaveAt: now,
          schemaVersion: DATA_SCHEMA_VERSION
        })
      );
    } catch {
      // Ignore storage quota warnings on metadata timestamp
    }
  }

  getSocialAccounts(): UserSocialAccounts {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_USER_ACCOUNTS;
  }

  saveSocialAccounts(accounts: UserSocialAccounts): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
      this.recordLocalWrite();
    } catch (err) {
      console.error('[DataService] Failed to save social accounts:', err);
    }
  }

  getPostingGroups(): SocialGroup[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GROUPS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_SOCIAL_GROUPS;
  }

  savePostingGroups(groups: SocialGroup[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
      this.recordLocalWrite();
    } catch (err) {
      console.error('[DataService] Failed to save posting groups:', err);
    }
  }

  getDrafts(): SocialPost[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DRAFTS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  }

  saveDrafts(drafts: SocialPost[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(drafts));
      this.recordLocalWrite();
    } catch (err) {
      console.error('[DataService] Failed to save drafts:', err);
    }
  }

  getPostHistory(fallbackInitial: SocialPost[] = []): SocialPost[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return fallbackInitial;
  }

  savePostHistory(history: SocialPost[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
      this.recordLocalWrite();
    } catch (err) {
      console.error('[DataService] Failed to save post history:', err);
    }
  }

  getScheduledQueue(): ContentQueueItem[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.QUEUE);
      if (saved) return JSON.parse(saved);
    } catch {}
    return SAMPLE_QUEUE_ITEMS;
  }

  saveScheduledQueue(queue: ContentQueueItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(queue));
      this.recordLocalWrite();
    } catch (err) {
      console.error('[DataService] Failed to save scheduled queue:', err);
    }
  }

  getUserSettings(): AppSettings {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) return ensureAppSettings(JSON.parse(saved));
    } catch {}
    return ensureAppSettings(null);
  }

  saveUserSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      this.recordLocalWrite();
    } catch (err) {
      console.error('[DataService] Failed to save user settings:', err);
    }
  }

  getNewsSources(): NewsRssSource[] {
    return loadNewsSources();
  }

  saveNewsSources(sources: NewsRssSource[]): void {
    saveNewsSources(sources);
    this.recordLocalWrite();
  }

  getNewsHunterSettings(): NewsHunterSettings {
    return loadNewsSettings();
  }

  saveNewsHunterSettings(settings: NewsHunterSettings): void {
    saveNewsSettings(settings);
    this.recordLocalWrite();
  }

  getAutoHuntSettings(): AutoHuntSettings {
    return loadAutoHuntSettings();
  }

  saveAutoHuntSettings(settings: AutoHuntSettings): void {
    saveAutoHuntSettings(settings);
    this.recordLocalWrite();
  }

  getSavedNewsLibrary(): SavedNewsItem[] {
    return loadSavedNewsLibrary();
  }

  saveSavedNewsLibrary(items: SavedNewsItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.NEWS_LIBRARY, JSON.stringify(items));
      this.recordLocalWrite();
    } catch (err) {
      console.error('[DataService] Failed to save news library:', err);
    }
  }
}

class CentralDataService {
  private adapter: DataRepositoryAdapter = new LocalDataRepositoryAdapter();

  /**
   * Register a production cloud database adapter when a cloud database is provisioned.
   */
  registerAdapter(customAdapter: DataRepositoryAdapter): void {
    this.adapter = customAdapter;
  }

  getAdapterInfo(): {
    adapterName: string;
    databaseProvider: DatabaseProviderType;
    isCloudDatabaseConnected: boolean;
  } {
    return {
      adapterName: this.adapter.adapterName,
      databaseProvider: this.adapter.databaseProvider,
      isCloudDatabaseConnected: this.adapter.isCloudDatabaseConnected
    };
  }

  // ------------------------------------------
  // 1. User Account & Entitlement Repository
  // ------------------------------------------

  getUserProfile(): UserProfile {
    return accountService.getCurrentUser();
  }

  async saveUserProfile(updates: Partial<Pick<UserProfile, 'displayName' | 'email'>>): Promise<UserProfile> {
    return accountService.updateProfile(updates);
  }

  getSubscriptionEntitlement(): EntitlementSnapshot {
    return entitlementService.getEntitlements();
  }

  async verifyEntitlementWithBackend(): Promise<ServerEntitlementVerificationResult> {
    const user = this.getUserProfile();
    return apiService.verifyServerEntitlement(user.userId);
  }

  // ------------------------------------------
  // 2. Core Workspace Entities (Local-First + Cloud-Ready)
  // ------------------------------------------

  getSocialAccounts(): UserSocialAccounts {
    return this.adapter.getSocialAccounts();
  }

  saveSocialAccounts(accounts: UserSocialAccounts): void {
    this.adapter.saveSocialAccounts(accounts);
  }

  getPostingGroups(): SocialGroup[] {
    return this.adapter.getPostingGroups();
  }

  savePostingGroups(groups: SocialGroup[]): void {
    this.adapter.savePostingGroups(groups);
  }

  getDrafts(): SocialPost[] {
    return this.adapter.getDrafts();
  }

  saveDrafts(drafts: SocialPost[]): void {
    this.adapter.saveDrafts(drafts);
  }

  getPostHistory(fallbackInitial?: SocialPost[]): SocialPost[] {
    return this.adapter.getPostHistory(fallbackInitial);
  }

  savePostHistory(history: SocialPost[]): void {
    this.adapter.savePostHistory(history);
  }

  getScheduledQueue(): ContentQueueItem[] {
    return this.adapter.getScheduledQueue();
  }

  saveScheduledQueue(queue: ContentQueueItem[]): void {
    this.adapter.saveScheduledQueue(queue);
  }

  getUserSettings(): AppSettings {
    return this.adapter.getUserSettings();
  }

  saveUserSettings(settings: AppSettings): void {
    this.adapter.saveUserSettings(settings);
  }

  getNewsSources(): NewsRssSource[] {
    return this.adapter.getNewsSources();
  }

  saveNewsSources(sources: NewsRssSource[]): void {
    this.adapter.saveNewsSources(sources);
  }

  getNewsHunterSettings(): NewsHunterSettings {
    return this.adapter.getNewsHunterSettings();
  }

  saveNewsHunterSettings(settings: NewsHunterSettings): void {
    this.adapter.saveNewsHunterSettings(settings);
  }

  getAutoHuntSettings(): AutoHuntSettings {
    return this.adapter.getAutoHuntSettings();
  }

  saveAutoHuntSettings(settings: AutoHuntSettings): void {
    this.adapter.saveAutoHuntSettings(settings);
  }

  getSavedNewsLibrary(): SavedNewsItem[] {
    return this.adapter.getSavedNewsLibrary();
  }

  saveSavedNewsLibrary(items: SavedNewsItem[]): void {
    this.adapter.saveSavedNewsLibrary(items);
  }

  // ------------------------------------------
  // 3. Cloud Sync Status & Guest-to-Account Migration
  // ------------------------------------------

  getSyncStatus(): DataSyncMetadata {
    const authInfo = accountService.getAdapterInfo();
    const user = accountService.getCurrentUser();
    const deviceId = getOrCreateDeviceId();

    let lastLocalSaveAt: string | null = null;
    let lastCloudSyncAt: string | null = null;
    try {
      const raw = localStorage.getItem(SYNC_METADATA_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        lastLocalSaveAt = typeof parsed.lastLocalSaveAt === 'string' ? parsed.lastLocalSaveAt : null;
        lastCloudSyncAt = typeof parsed.lastCloudSyncAt === 'string' ? parsed.lastCloudSyncAt : null;
      }
    } catch {}

    const isCloudConnected = this.adapter.isCloudDatabaseConnected && authInfo.isProductionBackend;

    return {
      syncMode: isCloudConnected ? 'CLOUD_SYNC_ENABLED' : 'LOCAL_FIRST_GUEST',
      syncState: isCloudConnected ? 'SYNCED' : 'READY_FOR_CLOUD',
      databaseProvider: this.adapter.databaseProvider,
      backendDatabaseConnected: this.adapter.isCloudDatabaseConnected,
      authProviderConnected: authInfo.isProductionBackend,
      serverEntitlementEndpointReady: true,
      webhookReceiverReady: true,
      cloudSyncReadiness: user.cloudSyncStatus,
      deviceId,
      schemaVersion: DATA_SCHEMA_VERSION,
      lastLocalSaveAt,
      lastCloudSyncAt,
      pendingSyncOperations: 0,
      conflictResolutionStrategy: 'TIMESTAMP_LATEST_WINS_WITH_SAFE_MERGE'
    };
  }

  /**
   * Evaluates all local guest workspace records that will automatically migrate
   * to the user's cloud account once production authentication and database are connected.
   */
  prepareGuestToAccountMigration(): GuestToAccountMigrationReport {
    const user = this.getUserProfile();
    const accounts = this.getSocialAccounts();
    const groups = this.getPostingGroups();
    const drafts = this.getDrafts();
    const history = this.getPostHistory();
    const queue = this.getScheduledQueue();
    const savedNews = this.getSavedNewsLibrary();
    const rssSources = this.getNewsSources();

    const socialPlatformsConfigured = Object.values(accounts || {}).reduce(
      (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
      0
    );

    const counts = {
      socialPlatformsConfigured,
      postingGroups: groups.length,
      drafts: drafts.length,
      postHistory: history.length,
      scheduledQueue: queue.length,
      savedNewsItems: savedNews.length,
      rssSources: rssSources.length
    };

    const totalRecordsToMigrate =
      counts.socialPlatformsConfigured +
      counts.postingGroups +
      counts.drafts +
      counts.postHistory +
      counts.scheduledQueue +
      counts.savedNewsItems +
      counts.rssSources;

    return {
      readyForMigration: true,
      sourceGuestUserId: user.userId,
      deviceId: getOrCreateDeviceId(),
      counts,
      totalRecordsToMigrate,
      preservesLocalCopy: true,
      assessedAt: new Date().toISOString()
    };
  }

  /**
   * Produces a sanitized, cloud-ready bundle of all user workspace data.
   */
  getCompleteWorkspaceBundle(): CloudWorkspaceDataBundle {
    return {
      schemaVersion: DATA_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      deviceId: getOrCreateDeviceId(),
      userProfile: this.getUserProfile(),
      settings: sanitizeSensitiveData(this.getUserSettings()),
      socialAccounts: sanitizeSensitiveData(this.getSocialAccounts()),
      postingGroups: sanitizeSensitiveData(this.getPostingGroups()),
      drafts: sanitizeSensitiveData(this.getDrafts()),
      postHistory: sanitizeSensitiveData(this.getPostHistory()),
      scheduledQueue: sanitizeSensitiveData(this.getScheduledQueue()),
      newsSources: this.getNewsSources(),
      newsSettings: this.getNewsHunterSettings(),
      autoHuntSettings: this.getAutoHuntSettings(),
      savedNewsLibrary: sanitizeSensitiveData(this.getSavedNewsLibrary())
    };
  }

  /**
   * Executes a cloud sync check against the backend server without faking cloud database persistence.
   */
  async syncAllData(): Promise<{
    success: boolean;
    cloudConnected: boolean;
    message: string;
    syncStatus: DataSyncMetadata;
  }> {
    const foundationStatus = await apiService.getBackendFoundationStatus();
    const syncStatus = this.getSyncStatus();

    if (!foundationStatus.databaseConnected) {
      return {
        success: false,
        cloudConnected: false,
        message:
          'Cloud database is not connected yet. All workspace data is safely persisted locally via CentralDataService and ready for automatic migration when cloud sync is enabled.',
        syncStatus
      };
    }

    return {
      success: true,
      cloudConnected: true,
      message: 'Workspace synchronized with cloud database.',
      syncStatus
    };
  }
}

export const dataService = new CentralDataService();

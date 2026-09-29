import {
  AppSettings,
  AutoHuntSettings,
  ContentQueueItem,
  NewsHunterSettings,
  NewsRssSource,
  SavedNewsItem,
  SocialGroup,
  SocialPost,
  UserSocialAccounts
} from '../types';
import { PaymentProviderStatus, PlanType, SubscriptionProviderType, BillingCycle } from './plans';
import { AuthProviderType, CloudSyncReadiness, UserProfile } from '../services/accountService';

// ==========================================
// PRODUCTION BACKEND & CLOUD DATA SCHEMAS
// Provider-Neutral Database & Sync Contracts
// ==========================================

export type DataSyncMode = 'LOCAL_FIRST_GUEST' | 'CLOUD_SYNC_ENABLED';

export type DataSyncState =
  | 'LOCAL_ONLY'
  | 'READY_FOR_CLOUD'
  | 'SYNCING'
  | 'SYNCED'
  | 'OFFLINE'
  | 'CONFLICT_RESOLVED'
  | 'ERROR';

export type DatabaseProviderType =
  | 'local_storage_only'
  | 'postgresql_cloudsql'
  | 'supabase_postgres'
  | 'firebase_firestore'
  | 'custom_rest_api';

/**
 * Standard metadata attached to cloud-persisted records for multi-device sync
 * and deterministic conflict resolution.
 */
export interface CloudRecordMetadata {
  id: string;
  userId: string;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
  syncedAt: string | null;
  deviceId: string;
  isDeleted?: boolean;
}

/**
 * 1. `users` table / collection schema
 */
export interface CloudUserRecord {
  userId: string;
  email: string | null;
  displayName: string;
  authProvider: AuthProviderType;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
}

/**
 * 2. `user_entitlements` / `subscriptions` table schema (Server-Authoritative)
 * Note: `ADMIN_TEST` is strictly development/test-only and never stored as a public billing plan.
 */
export interface CloudEntitlementRecord {
  userId: string;
  plan: 'FREE' | 'PRO';
  paymentProvider: SubscriptionProviderType;
  paymentStatus: PaymentProviderStatus;
  billingCycle: BillingCycle | null;
  externalCustomerId: string | null;
  externalSubscriptionId: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  verifiedByWebhook: boolean;
  lastVerifiedAt: string;
  updatedAt: string;
}

/**
 * 3. `payment_webhook_events` table schema (Server-Only Audit Log)
 */
export interface CloudWebhookEventRecord {
  eventId: string;
  provider: SubscriptionProviderType;
  eventType: string;
  userId: string | null;
  signatureVerified: boolean;
  processedAt: string;
  status: 'PROCESSED' | 'IGNORED' | 'FAILED_VERIFICATION';
}

/**
 * Complete user workspace data bundle managed by the centralized DataService.
 */
export interface CloudWorkspaceDataBundle {
  schemaVersion: number;
  exportedAt: string;
  deviceId: string;
  userProfile: UserProfile;
  settings: AppSettings;
  socialAccounts: UserSocialAccounts;
  postingGroups: SocialGroup[];
  drafts: SocialPost[];
  postHistory: SocialPost[];
  scheduledQueue: ContentQueueItem[];
  newsSources: NewsRssSource[];
  newsSettings: NewsHunterSettings;
  autoHuntSettings: AutoHuntSettings;
  savedNewsLibrary: SavedNewsItem[];
}

/**
 * Real-time status of the data persistence and cloud sync layer.
 */
export interface DataSyncMetadata {
  syncMode: DataSyncMode;
  syncState: DataSyncState;
  databaseProvider: DatabaseProviderType;
  backendDatabaseConnected: boolean;
  authProviderConnected: boolean;
  serverEntitlementEndpointReady: boolean;
  webhookReceiverReady: boolean;
  cloudSyncReadiness: CloudSyncReadiness;
  deviceId: string;
  schemaVersion: number;
  lastLocalSaveAt: string | null;
  lastCloudSyncAt: string | null;
  pendingSyncOperations: number;
  conflictResolutionStrategy: 'TIMESTAMP_LATEST_WINS_WITH_SAFE_MERGE';
}

/**
 * Summary of local guest workspace records ready to migrate to an authenticated cloud account
 * when the user signs up or signs in for the first time.
 */
export interface GuestToAccountMigrationReport {
  readyForMigration: boolean;
  sourceGuestUserId: string;
  deviceId: string;
  counts: {
    socialPlatformsConfigured: number;
    postingGroups: number;
    drafts: number;
    postHistory: number;
    scheduledQueue: number;
    savedNewsItems: number;
    rssSources: number;
  };
  totalRecordsToMigrate: number;
  preservesLocalCopy: boolean;
  assessedAt: string;
}

/**
 * Server-authoritative entitlement verification response from `/api/entitlements/verify`.
 */
export interface ServerEntitlementVerificationResult {
  success: boolean;
  serverReachable: boolean;
  databaseConnected: boolean;
  verifiedByServer: boolean;
  authoritativePlan: PlanType;
  paymentStatus: PaymentProviderStatus;
  paymentProvider: SubscriptionProviderType;
  entitlementSource: 'SERVER_DATABASE' | 'SERVER_DEFAULT_FREE' | 'LOCAL_FALLBACK';
  evaluatedAt: string;
  message: string;
}

/**
 * Backend foundation status response from `/api/backend/foundation-status`.
 */
export interface BackendFoundationStatusResult {
  success: boolean;
  serverProxyActive: boolean;
  databaseProvider: DatabaseProviderType;
  databaseConnected: boolean;
  authProvider: AuthProviderType;
  authProviderConnected: boolean;
  paymentProvider: SubscriptionProviderType;
  paymentWebhookConfigured: boolean;
  entitlementAuthority: 'SERVER_AUTHORITATIVE_READY';
  supportedWebhookProviders: SubscriptionProviderType[];
  timestamp: string;
}

// ==========================================
// MONETIZATION & PLAN SYSTEM TYPES (FREE + PRO + ADMIN_TEST)
// ==========================================

export type PublicPlanType = 'FREE' | 'PRO';

export type PlanType = 'FREE' | 'PRO' | 'ADMIN_TEST';

export type BillingCycle = 'monthly' | 'yearly';

export type SupportedCurrencyCode = 'USD' | 'IDR' | 'JPY' | 'INR' | 'THB' | 'GBP' | 'EUR';

export type PaymentProviderStatus = 
  | 'PAYMENT_NOT_CONFIGURED'
  | 'PAYMENT_PENDING'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'PAUSED'
  | 'CANCELLED'
  | 'EXPIRED';

export type SubscriptionProviderType = 
  | 'google_play'
  | 'google_play_billing'
  | 'paddle'
  | 'lemon_squeezy'
  | 'stripe'
  | 'none';

export type PaymentPlatformTarget = 'android_google_play' | 'web_paddle';

export type GatedFeatureKey = 
  | 'ai_generations'
  | 'news_hunts'
  | 'news_rewrites'
  | 'web_search'
  | 'x_trending'
  | 'media_discovery'
  | 'media_discovery_advanced'
  | 'content_factory'
  | 'auto_hunt_schedules'
  | 'queue_items'
  | 'scheduled_posts'
  | 'accounts_per_platform'
  | 'posting_groups'
  | 'rss_sources';

export type CostControlFeature = 
  | 'ai_generations'
  | 'news_hunts'
  | 'news_rewrites'
  | 'web_search'
  | 'x_trending'
  | 'media_discovery'
  | 'content_factory';

export interface PlanLimits {
  maxAccountsPerPlatform: number;
  maxGroups: number;
  aiGenerationsPerMonth: number;
  newsHuntsPerDay: number;
  maxRssSources: number;
  webSearchEnabled: boolean;
  webSearchesPerDay: number;
  xTrendingEnabled: boolean;
  xTrendingPerDay: number;
  newsRewritesPerDay: number;
  mediaDiscoveryMode: 'basic' | 'advanced';
  mediaDiscoveryPerDay: number;
  maxAutoHuntSchedules: number;
  maxQueueItems: number;
  maxScheduledPosts: number;
  aiContentFactoryMode: 'basic' | 'advanced';
}

export interface UsageRecord {
  periodDaily: string;       // YYYY-MM-DD
  periodMonthly: string;     // YYYY-MM
  aiGenerationsCount: number;
  newsHuntsCount: number;
  newsRewritesCount: number;
  webSearchesCount: number;
  xTrendingCount: number;
  mediaDiscoveryCount: number;
  contentFactoryCount: number;
  scheduledPostsCount: number;
}

export interface CostUsageAuditEntry {
  id: string;
  timestamp: string;        // ISO string
  feature: CostControlFeature;
  plan: PlanType;
  ownerIdentifier: string;
  period: string;           // YYYY-MM-DD or YYYY-MM
  status: 'success' | 'blocked' | 'error';
  actionName: string;
  durationMs: number;
  reason?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface SubscriptionState {
  plan: PlanType;
  isOwnerMode: boolean;
  ownerIdentifier: string;
  paymentStatus: PaymentProviderStatus;
  paymentProvider: SubscriptionProviderType;
  developerTestModeEnabled: boolean;
  testPlanOverride?: PlanType | null;
  lastVerifiedAt?: string;
}

export interface FeatureAccessResult {
  allowed: boolean;
  reason?: string;
  current: number;
  limit: number;
  isUnlimited: boolean;
  requiresPro?: boolean;
  period?: 'daily' | 'monthly' | 'lifetime';
}

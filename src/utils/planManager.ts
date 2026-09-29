import { 
  PlanType, 
  SubscriptionState, 
  UsageRecord, 
  GatedFeatureKey, 
  FeatureAccessResult,
  PlanLimits
} from '../types/plans';
import { PLAN_LIMITS, OWNER_CONFIG } from '../config/plans';

const SUBSCRIPTION_STORAGE_KEY = 'sss_subscription_state';
const USAGE_STORAGE_KEY = 'sss_usage_record';

// Helper to get formatted date periods
export const getCurrentDatePeriod = () => {
  const now = new Date();
  const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const thisMonth = today.slice(0, 7);           // YYYY-MM
  return { today, thisMonth };
};

// Normalize any legacy plan string ('OWNER' or 'FREE_TRIAL') safely into 'FREE' | 'PRO' | 'ADMIN_TEST'
export function normalizePlanType(rawPlan: any, isDeveloperTest = false): PlanType {
  if (rawPlan === 'PRO') return 'PRO';
  if (rawPlan === 'ADMIN_TEST' || rawPlan === 'OWNER') return 'ADMIN_TEST';
  if (rawPlan === 'FREE_TRIAL') {
    // Migrate legacy trial to ADMIN_TEST only if developer test mode was active, otherwise default to FREE
    return isDeveloperTest ? 'ADMIN_TEST' : 'FREE';
  }
  return 'FREE';
}

// Human-readable display label for a plan
export function getPlanDisplayLabel(plan: PlanType): string {
  switch (plan) {
    case 'PRO':
      return 'PRO';
    case 'ADMIN_TEST':
      return 'ADMIN TEST';
    case 'FREE':
    default:
      return 'FREE';
  }
}

// Default initial subscription state (FREE is the default plan for normal users)
export const DEFAULT_SUBSCRIPTION_STATE: SubscriptionState = {
  plan: 'FREE',
  isOwnerMode: false,
  ownerIdentifier: OWNER_CONFIG.DEFAULT_OWNER_ID,
  paymentStatus: 'PAYMENT_NOT_CONFIGURED',
  paymentProvider: 'none',
  developerTestModeEnabled: false,
  testPlanOverride: null,
  lastVerifiedAt: new Date().toISOString()
};

// Default initial usage record
export const createInitialUsageRecord = (): UsageRecord => {
  const { today, thisMonth } = getCurrentDatePeriod();
  return {
    periodDaily: today,
    periodMonthly: thisMonth,
    aiGenerationsCount: 0,
    newsHuntsCount: 0,
    newsRewritesCount: 0,
    webSearchesCount: 0,
    xTrendingCount: 0,
    mediaDiscoveryCount: 0,
    contentFactoryCount: 0,
    scheduledPostsCount: 0
  };
};

// Check whether ADMIN_TEST / Developer Test overrides are allowed in the current runtime
export function isDevelopmentTestModeAllowed(): boolean {
  // Allowed in local/preview/test environments; in a locked production build without dev flags, can be restricted via env
  return OWNER_CONFIG.ALLOW_DEV_TEST_IN_PREVIEW;
}

// Load subscription state and safely migrate any legacy FREE_TRIAL / OWNER values.
// SECURITY RULE: Never trust raw localStorage `plan: "PRO"` unless backed by a verified payment provider
// or an explicit development/test override in a permitted test environment.
export const loadSubscriptionState = (): SubscriptionState => {
  try {
    const raw = localStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_SUBSCRIPTION_STATE };
    }

    const parsed = JSON.parse(raw);
    const devAllowed = isDevelopmentTestModeAllowed();
    const devMode = devAllowed && Boolean(parsed.developerTestModeEnabled);
    const normalizedOverride = devMode && parsed.testPlanOverride
      ? normalizePlanType(parsed.testPlanOverride, true)
      : null;

    // A client localStorage state cannot claim verified production PRO when paymentProvider is 'none' or status is not 'ACTIVE'
    const hasVerifiedBackendEntitlement =
      parsed.paymentProvider &&
      parsed.paymentProvider !== 'none' &&
      parsed.paymentStatus === 'ACTIVE';

    let basePlan: PlanType = normalizePlanType(parsed.plan, devMode);
    if (basePlan === 'PRO' && !hasVerifiedBackendEntitlement) {
      // Prevent permanent client-side localStorage self-grant of PRO
      basePlan = 'FREE';
    }
    if (basePlan === 'ADMIN_TEST' && !devMode) {
      basePlan = 'FREE';
    }

    const state: SubscriptionState = {
      ...DEFAULT_SUBSCRIPTION_STATE,
      plan: basePlan,
      isOwnerMode: devMode && (Boolean(parsed.isOwnerMode) || normalizedOverride === 'ADMIN_TEST'),
      ownerIdentifier: parsed.ownerIdentifier || OWNER_CONFIG.DEFAULT_OWNER_ID,
      paymentStatus: hasVerifiedBackendEntitlement ? parsed.paymentStatus : 'PAYMENT_NOT_CONFIGURED',
      paymentProvider: hasVerifiedBackendEntitlement ? parsed.paymentProvider : 'none',
      developerTestModeEnabled: devMode,
      testPlanOverride: normalizedOverride,
      lastVerifiedAt: parsed.lastVerifiedAt || new Date().toISOString()
    };

    // Persist migrated or sanitized state if legacy/tampered fields were present
    if (
      parsed.plan === 'FREE_TRIAL' ||
      parsed.plan === 'OWNER' ||
      parsed.trialStatus !== undefined ||
      (parsed.plan === 'PRO' && !hasVerifiedBackendEntitlement)
    ) {
      saveSubscriptionState(state);
    }

    return state;
  } catch (err) {
    console.error('Error loading subscription state:', err);
    return { ...DEFAULT_SUBSCRIPTION_STATE };
  }
};

export const saveSubscriptionState = (state: SubscriptionState): void => {
  try {
    localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Error saving subscription state:', err);
  }
};

// Load usage with automatic daily & monthly period resets
export const loadUsageRecord = (): UsageRecord => {
  try {
    const raw = localStorage.getItem(USAGE_STORAGE_KEY);
    const { today, thisMonth } = getCurrentDatePeriod();

    const usage: UsageRecord = raw ? { ...createInitialUsageRecord(), ...JSON.parse(raw) } : createInitialUsageRecord();

    let needsSave = false;

    // Reset daily counters if day has changed
    if (usage.periodDaily !== today) {
      usage.periodDaily = today;
      usage.newsHuntsCount = 0;
      usage.newsRewritesCount = 0;
      usage.webSearchesCount = 0;
      usage.mediaDiscoveryCount = 0;
      usage.xTrendingCount = 0;
      needsSave = true;
    }

    // Reset monthly counters if month has changed
    if (usage.periodMonthly !== thisMonth) {
      usage.periodMonthly = thisMonth;
      usage.aiGenerationsCount = 0;
      usage.contentFactoryCount = 0;
      needsSave = true;
    }

    if (needsSave || !raw) {
      saveUsageRecord(usage);
    }

    return usage;
  } catch (err) {
    console.error('Error loading usage record:', err);
    return createInitialUsageRecord();
  }
};

export const saveUsageRecord = (usage: UsageRecord): void => {
  try {
    localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(usage));
  } catch (err) {
    console.error('Error saving usage record:', err);
  }
};

// Get the currently active plan, respecting ADMIN / OWNER TEST overrides in dev/test mode only
export const getEffectivePlan = (state?: SubscriptionState): PlanType => {
  const current = state || loadSubscriptionState();
  const devAllowed = isDevelopmentTestModeAllowed();

  if (devAllowed && current.developerTestModeEnabled && current.testPlanOverride) {
    return normalizePlanType(current.testPlanOverride, true);
  }
  if (devAllowed && current.developerTestModeEnabled && current.isOwnerMode) {
    return 'ADMIN_TEST';
  }

  // Verify base plan is not an unverified client-side PRO claim
  const hasVerifiedBackend =
    current.paymentProvider !== 'none' && current.paymentStatus === 'ACTIVE';
  if (current.plan === 'PRO' && !hasVerifiedBackend) {
    return 'FREE';
  }
  if (current.plan === 'ADMIN_TEST') {
    return devAllowed && current.developerTestModeEnabled ? 'ADMIN_TEST' : 'FREE';
  }

  return 'FREE';
};

// Get plan limits based on active plan
export const getPlanLimits = (plan?: PlanType): PlanLimits => {
  const activePlan = plan || getEffectivePlan();
  return PLAN_LIMITS[activePlan] || PLAN_LIMITS.FREE;
};

// Check if a feature can be used
export const canUseFeature = (
  feature: GatedFeatureKey,
  providedCount?: number,
  state?: SubscriptionState
): FeatureAccessResult => {
  const currentPlan = getEffectivePlan(state);
  const limits = getPlanLimits(currentPlan);
  const usage = loadUsageRecord();
  const planName = getPlanDisplayLabel(currentPlan);

  // ADMIN_TEST has unrestricted PRO test access
  if (currentPlan === 'ADMIN_TEST') {
    return {
      allowed: true,
      current: 0,
      limit: Infinity,
      isUnlimited: true
    };
  }

  switch (feature) {
    case 'web_search': {
      if (!limits.webSearchEnabled) {
        return {
          allowed: false,
          reason: 'Web Search news discovery is available on the PRO plan.',
          current: usage.webSearchesCount,
          limit: 0,
          isUnlimited: false,
          requiresPro: true,
          period: 'daily'
        };
      }
      const current = usage.webSearchesCount;
      const limit = limits.webSearchesPerDay;
      const allowed = current < limit;
      return {
        allowed,
        reason: allowed ? undefined : `You have reached your daily limit of ${limit} web searches on the ${planName} plan.`,
        current,
        limit,
        isUnlimited: limit >= 9999,
        requiresPro: !allowed,
        period: 'daily'
      };
    }

    case 'x_trending': {
      if (!limits.xTrendingEnabled) {
        return {
          allowed: false,
          reason: 'X (Twitter) Trending Topics is available on the PRO plan.',
          current: usage.xTrendingCount,
          limit: 0,
          isUnlimited: false,
          requiresPro: true,
          period: 'daily'
        };
      }
      const current = usage.xTrendingCount;
      const limit = limits.xTrendingPerDay;
      const allowed = current < limit;
      return {
        allowed,
        reason: allowed ? undefined : `You have reached your daily limit of ${limit} X trending requests on the ${planName} plan.`,
        current,
        limit,
        isUnlimited: limit >= 9999,
        requiresPro: !allowed,
        period: 'daily'
      };
    }

    case 'media_discovery': {
      const current = usage.mediaDiscoveryCount;
      const limit = limits.mediaDiscoveryPerDay;
      const allowed = current < limit;
      return {
        allowed,
        reason: allowed ? undefined : `You have reached your daily limit of ${limit} media discoveries on the ${planName} plan.`,
        current,
        limit,
        isUnlimited: limit >= 9999,
        requiresPro: !allowed,
        period: 'daily'
      };
    }

    case 'content_factory':
    case 'ai_generations': {
      const current = usage.aiGenerationsCount;
      const limit = limits.aiGenerationsPerMonth;
      const allowed = current < limit;
      return {
        allowed,
        reason: allowed ? undefined : `You have reached your limit of ${limit} AI generations for this month on the ${planName} plan.`,
        current,
        limit,
        isUnlimited: limit >= 9999,
        requiresPro: !allowed,
        period: 'monthly'
      };
    }

    case 'news_hunts': {
      const current = usage.newsHuntsCount;
      const limit = limits.newsHuntsPerDay;
      const allowed = current < limit;
      return {
        allowed,
        reason: allowed ? undefined : `You have reached your daily limit of ${limit} news hunts on the ${planName} plan.`,
        current,
        limit,
        isUnlimited: limit >= 9999,
        requiresPro: !allowed,
        period: 'daily'
      };
    }

    case 'news_rewrites': {
      const current = usage.newsRewritesCount;
      const limit = limits.newsRewritesPerDay;
      const allowed = current < limit;
      return {
        allowed,
        reason: allowed ? undefined : `You have reached your daily limit of ${limit} news rewrites on the ${planName} plan.`,
        current,
        limit,
        isUnlimited: limit >= 9999,
        requiresPro: !allowed,
        period: 'daily'
      };
    }

    case 'accounts_per_platform': {
      const current = providedCount ?? 0;
      const limit = limits.maxAccountsPerPlatform;
      const allowed = current < limit;
      return {
        allowed,
        reason: allowed ? undefined : `You have reached the maximum of ${limit} accounts for this platform on the ${planName} plan.`,
        current,
        limit,
        isUnlimited: limit >= 9999,
        requiresPro: !allowed
      };
    }

    case 'posting_groups': {
      const current = providedCount ?? 0;
      const limit = limits.maxGroups;
      const allowed = current < limit;
      return {
        allowed,
        reason: allowed ? undefined : `You have reached the maximum of ${limit} posting groups on the ${planName} plan.`,
        current,
        limit,
        isUnlimited: limit >= 9999,
        requiresPro: !allowed
      };
    }

    case 'rss_sources': {
      const current = providedCount ?? 0;
      const limit = limits.maxRssSources;
      const allowed = current < limit;
      return {
        allowed,
        reason: allowed ? undefined : `You have reached the maximum of ${limit} active RSS sources on the ${planName} plan.`,
        current,
        limit,
        isUnlimited: limit >= 9999,
        requiresPro: !allowed
      };
    }

    case 'queue_items': {
      const current = providedCount ?? 0;
      const limit = limits.maxQueueItems;
      const allowed = current < limit;
      return {
        allowed,
        reason: allowed ? undefined : `You have reached the maximum of ${limit} queue items on the ${planName} plan.`,
        current,
        limit,
        isUnlimited: limit >= 9999,
        requiresPro: !allowed
      };
    }

    case 'scheduled_posts': {
      const current = providedCount ?? 0;
      const limit = limits.maxScheduledPosts;
      const allowed = current < limit;
      return {
        allowed,
        reason: allowed ? undefined : `You have reached the limit of ${limit} scheduled posts on the ${planName} plan.`,
        current,
        limit,
        isUnlimited: limit >= 9999,
        requiresPro: !allowed
      };
    }

    case 'media_discovery_advanced': {
      const isAdvanced = limits.mediaDiscoveryMode === 'advanced';
      return {
        allowed: isAdvanced,
        reason: isAdvanced ? undefined : 'Advanced media discovery & filtering is available on the PRO plan.',
        current: 0,
        limit: isAdvanced ? Infinity : 1,
        isUnlimited: isAdvanced,
        requiresPro: true
      };
    }

    case 'auto_hunt_schedules': {
      const current = providedCount ?? 0;
      const limit = limits.maxAutoHuntSchedules;
      const allowed = current < limit;
      return {
        allowed,
        reason: allowed ? undefined : `You can configure up to ${limit} active Auto Hunt schedule on the FREE plan.`,
        current,
        limit,
        isUnlimited: limit >= 9999,
        requiresPro: !allowed
      };
    }

    default:
      return {
        allowed: true,
        current: 0,
        limit: Infinity,
        isUnlimited: true
      };
  }
};

// Increment usage counter in storage
export const incrementUsage = (feature: GatedFeatureKey, amount = 1): UsageRecord => {
  const usage = loadUsageRecord();
  switch (feature) {
    case 'ai_generations':
      usage.aiGenerationsCount += amount;
      break;
    case 'news_hunts':
      usage.newsHuntsCount += amount;
      break;
    case 'news_rewrites':
      usage.newsRewritesCount += amount;
      break;
    case 'web_search':
      usage.webSearchesCount += amount;
      break;
    case 'x_trending':
      usage.xTrendingCount += amount;
      break;
    case 'content_factory':
      usage.contentFactoryCount += amount;
      usage.aiGenerationsCount += amount;
      break;
    case 'scheduled_posts':
      usage.scheduledPostsCount += amount;
      break;
    case 'media_discovery':
    case 'media_discovery_advanced':
      usage.mediaDiscoveryCount += amount;
      break;
  }
  saveUsageRecord(usage);
  return usage;
};

// Switch developer / admin test plan override (DEVELOPMENT / TEST ONLY)
export const setDeveloperTestPlan = (testPlan: PlanType | null, enableDevMode: boolean = true): SubscriptionState => {
  const current = loadSubscriptionState();
  const normalized = testPlan ? normalizePlanType(testPlan, true) : null;
  const updated: SubscriptionState = {
    ...current,
    developerTestModeEnabled: enableDevMode && normalized !== null,
    testPlanOverride: normalized,
    isOwnerMode: normalized === 'ADMIN_TEST',
    lastVerifiedAt: new Date().toISOString()
  };
  saveSubscriptionState(updated);
  return updated;
};

// Switch Admin / Owner test mode
export const setOwnerMode = (isOwner: boolean): SubscriptionState => {
  const current = loadSubscriptionState();
  const updated: SubscriptionState = {
    ...current,
    isOwnerMode: isOwner,
    developerTestModeEnabled: isOwner ? true : current.developerTestModeEnabled,
    testPlanOverride: isOwner ? 'ADMIN_TEST' : (current.testPlanOverride === 'ADMIN_TEST' ? 'FREE' : current.testPlanOverride),
    lastVerifiedAt: new Date().toISOString()
  };
  saveSubscriptionState(updated);
  return updated;
};

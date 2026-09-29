import {
  PlanType,
  PublicPlanType,
  SubscriptionState,
  UsageRecord,
  GatedFeatureKey,
  FeatureAccessResult,
  PlanLimits
} from '../types/plans';
import {
  loadSubscriptionState,
  loadUsageRecord,
  getEffectivePlan,
  getPlanLimits,
  canUseFeature,
  incrementUsage,
  setDeveloperTestPlan,
  setOwnerMode,
  isDevelopmentTestModeAllowed
} from '../utils/planManager';
import { accountService, UserProfile } from './accountService';
import { paymentService } from './paymentService';
import { subscriptionService } from './subscriptionService';
import { apiService } from './apiService';

// ==========================================
// CENTRALIZED ENTITLEMENT SERVICE
// Provider-Agnostic Feature Gating & Plan Authority
// ==========================================

export type EntitlementSource =
  | 'DEFAULT_FREE'
  | 'VERIFIED_BACKEND'
  | 'DEVELOPMENT_ADMIN_TEST_OVERRIDE';

export interface EntitlementSnapshot {
  user: UserProfile;
  plan: PlanType;
  publicPlan: PublicPlanType;
  limits: PlanLimits;
  usage: UsageRecord;
  subscription: SubscriptionState;
  entitlementSource: EntitlementSource;
  isVerifiedServerEntitlement: boolean;
  isDevelopmentOverride: boolean;
  accountStatusLabel: 'Guest / Local Mode' | 'Signed In';
  billingStatusLabel: string;
  futureAccountSyncLabel: string;
  lastEvaluatedAt: string;
}

class EntitlementService {
  /**
   * Returns the current user profile via the centralized AccountService.
   */
  getCurrentUser(): UserProfile {
    return accountService.getCurrentUser();
  }

  /**
   * Returns the effective active plan ('FREE' | 'PRO' | 'ADMIN_TEST').
   * Never trusts unverified localStorage PRO claims.
   */
  getCurrentPlan(subscriptionOverride?: SubscriptionState): PlanType {
    return getEffectivePlan(subscriptionOverride);
  }

  /**
   * Determines whether the current user/plan is allowed to access a gated feature.
   */
  hasFeature(
    feature: GatedFeatureKey,
    providedCount?: number,
    subscriptionOverride?: SubscriptionState
  ): FeatureAccessResult {
    return canUseFeature(feature, providedCount, subscriptionOverride);
  }

  /**
   * Returns the full, evaluated entitlement snapshot for the current user and plan.
   */
  getEntitlements(subscriptionOverride?: SubscriptionState): EntitlementSnapshot {
    const user = this.getCurrentUser();
    const subscription = subscriptionOverride || loadSubscriptionState();
    const usage = loadUsageRecord();
    const plan = this.getCurrentPlan(subscription);
    const limits = getPlanLimits(plan);

    const hasVerifiedBackend =
      subscription.paymentProvider !== 'none' &&
      subscription.paymentStatus === 'ACTIVE';

    const isDevOverride =
      isDevelopmentTestModeAllowed() &&
      Boolean(subscription.developerTestModeEnabled && (subscription.testPlanOverride || subscription.isOwnerMode));

    let entitlementSource: EntitlementSource = 'DEFAULT_FREE';
    if (hasVerifiedBackend && plan === 'PRO') {
      entitlementSource = 'VERIFIED_BACKEND';
    } else if (isDevOverride && (plan === 'PRO' || plan === 'ADMIN_TEST')) {
      entitlementSource = 'DEVELOPMENT_ADMIN_TEST_OVERRIDE';
    }

    const publicPlan: PublicPlanType = plan === 'PRO' ? 'PRO' : 'FREE';

    let billingStatusLabel = 'Not Connected';
    if (subscription.paymentStatus === 'ACTIVE' && hasVerifiedBackend) {
      billingStatusLabel = `Active (${subscription.paymentProvider})`;
    } else if (subscription.paymentStatus === 'PAYMENT_PENDING') {
      billingStatusLabel = 'Pending Verification';
    } else if (subscription.paymentStatus === 'CANCELLED') {
      billingStatusLabel = 'Cancelled';
    } else if (subscription.paymentStatus === 'EXPIRED') {
      billingStatusLabel = 'Expired';
    }

    return {
      user,
      plan,
      publicPlan,
      limits,
      usage,
      subscription,
      entitlementSource,
      isVerifiedServerEntitlement: hasVerifiedBackend,
      isDevelopmentOverride: isDevOverride,
      accountStatusLabel: accountService.getAccountStatusDisplay(),
      billingStatusLabel,
      futureAccountSyncLabel: accountService.getFutureAccountSyncDisplay(),
      lastEvaluatedAt: new Date().toISOString()
    };
  }

  /**
   * Refreshes entitlements from the current adapter / payment status and server authority endpoint.
   */
  async refreshEntitlements(): Promise<EntitlementSnapshot> {
    try {
      const user = this.getCurrentUser();
      await Promise.allSettled([
        paymentService.getSubscriptionStatus(),
        apiService.verifyServerEntitlement(user.userId)
      ]);
    } catch {
      // Safe fallback to local evaluation when offline or no billing backend is connected
    }
    return this.getEntitlements();
  }

  /**
   * Records usage for a gated feature through the centralized service.
   */
  recordFeatureUsage(feature: GatedFeatureKey, amount = 1): UsageRecord {
    return incrementUsage(feature, amount);
  }

  /**
   * Selects the FREE plan through the centralized entitlement and subscription service.
   * Ensures the current entitlement is FREE (clearing any development/test override if active),
   * never triggers payment or external redirects, and returns a clear confirmation message.
   */
  selectFreePlan(): { snapshot: EntitlementSnapshot; message: string } {
    const current = loadSubscriptionState();
    const hasVerifiedBackend =
      current.paymentProvider !== 'none' &&
      current.paymentStatus === 'ACTIVE';

    // If a development/test override was active, return to standard FREE entitlement via planManager
    if (!hasVerifiedBackend && (current.developerTestModeEnabled || current.testPlanOverride || current.isOwnerMode)) {
      setDeveloperTestPlan('FREE', false);
    }

    const actionRes = subscriptionService.selectFreePlan();
    const snapshot = this.getEntitlements();
    return {
      snapshot,
      message: actionRes.message || 'You are currently on the FREE plan.'
    };
  }

  /**
   * Sets the development/test plan override (DEVELOPMENT / TEST ONLY).
   */
  setDevelopmentTestPlan(plan: PlanType | null): SubscriptionState {
    return setDeveloperTestPlan(plan, true);
  }

  /**
   * Toggles development/owner test mode (DEVELOPMENT / TEST ONLY).
   */
  setDevelopmentOwnerMode(isOwner: boolean): SubscriptionState {
    return setOwnerMode(isOwner);
  }
}

export const entitlementService = new EntitlementService();

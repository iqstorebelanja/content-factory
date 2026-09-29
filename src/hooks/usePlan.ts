import { useState, useEffect, useCallback } from 'react';
import { 
  PlanType, 
  SubscriptionState, 
  UsageRecord, 
  GatedFeatureKey, 
  CostControlFeature,
  FeatureAccessResult,
  PlanLimits
} from '../types/plans';
import { costGuard } from '../services/costGuard';
import { entitlementService, EntitlementSnapshot } from '../services/entitlementService';
import { UserProfile } from '../services/accountService';

export interface UsePlanReturn {
  user: UserProfile;
  entitlements: EntitlementSnapshot;
  plan: PlanType;
  subscription: SubscriptionState;
  usage: UsageRecord;
  limits: PlanLimits;
  // Centralized Entitlement Service API
  getCurrentUser: () => UserProfile;
  getCurrentPlan: () => PlanType;
  hasFeature: (feature: GatedFeatureKey, count?: number) => FeatureAccessResult;
  getEntitlements: () => EntitlementSnapshot;
  refreshEntitlements: () => Promise<EntitlementSnapshot>;
  // Existing compatible methods
  canUseFeature: (feature: GatedFeatureKey, count?: number) => FeatureAccessResult;
  recordUsage: (feature: GatedFeatureKey, amount?: number) => void;
  selectFreePlan: () => { snapshot: EntitlementSnapshot; message: string };
  setTestPlan: (plan: PlanType | null) => void;
  toggleOwnerMode: (isOwner: boolean) => void;
  refreshPlan: () => void;
  // Centralized Cost Guard integration
  isFeatureLocked: (feature: CostControlFeature, lockKey?: string) => boolean;
  acquireLock: (feature: CostControlFeature, lockKey?: string) => { acquired: boolean; reason?: string };
  releaseLock: (feature: CostControlFeature, lockKey?: string) => void;
  executeProtectedAction: typeof costGuard.executeProtectedAction;
}

export const usePlan = (): UsePlanReturn => {
  const [entitlements, setEntitlements] = useState<EntitlementSnapshot>(() =>
    entitlementService.getEntitlements()
  );

  const refreshPlan = useCallback(() => {
    const updated = entitlementService.getEntitlements();
    setEntitlements(updated);
  }, []);

  const refreshEntitlements = useCallback(async () => {
    const updated = await entitlementService.refreshEntitlements();
    setEntitlements(updated);
    return updated;
  }, []);

  // Refresh on window focus
  useEffect(() => {
    const handleFocus = () => refreshPlan();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshPlan]);

  const getCurrentUser = useCallback((): UserProfile => {
    return entitlementService.getCurrentUser();
  }, []);

  const getCurrentPlan = useCallback((): PlanType => {
    return entitlementService.getCurrentPlan(entitlements.subscription);
  }, [entitlements.subscription]);

  const hasFeature = useCallback(
    (feature: GatedFeatureKey, count?: number): FeatureAccessResult => {
      return entitlementService.hasFeature(feature, count, entitlements.subscription);
    },
    [entitlements.subscription]
  );

  const getEntitlements = useCallback((): EntitlementSnapshot => {
    return entitlementService.getEntitlements(entitlements.subscription);
  }, [entitlements.subscription]);

  const recordUsage = useCallback(
    (feature: GatedFeatureKey, amount = 1) => {
      entitlementService.recordFeatureUsage(feature, amount);
      setEntitlements(entitlementService.getEntitlements());
    },
    []
  );

  const selectFreePlan = useCallback(() => {
    const result = entitlementService.selectFreePlan();
    setEntitlements(result.snapshot);
    return result;
  }, []);

  const setTestPlan = useCallback((plan: PlanType | null) => {
    entitlementService.setDevelopmentTestPlan(plan);
    setEntitlements(entitlementService.getEntitlements());
  }, []);

  const toggleOwnerMode = useCallback((isOwner: boolean) => {
    entitlementService.setDevelopmentOwnerMode(isOwner);
    setEntitlements(entitlementService.getEntitlements());
  }, []);

  const isFeatureLocked = useCallback((feature: CostControlFeature, lockKey?: string) => {
    return costGuard.isLocked(feature, lockKey);
  }, []);

  const acquireLock = useCallback((feature: CostControlFeature, lockKey?: string) => {
    return costGuard.acquireLock(feature, lockKey);
  }, []);

  const releaseLock = useCallback((feature: CostControlFeature, lockKey?: string) => {
    costGuard.releaseLock(feature, lockKey);
  }, []);

  const executeProtectedAction = useCallback((options: Parameters<typeof costGuard.executeProtectedAction>[0]) => {
    return costGuard.executeProtectedAction(options).then(res => {
      refreshPlan();
      return res;
    });
  }, [refreshPlan]);

  return {
    user: entitlements.user,
    entitlements,
    plan: entitlements.plan,
    subscription: entitlements.subscription,
    usage: entitlements.usage,
    limits: entitlements.limits,
    getCurrentUser,
    getCurrentPlan,
    hasFeature,
    getEntitlements,
    refreshEntitlements,
    canUseFeature: hasFeature,
    recordUsage,
    selectFreePlan,
    setTestPlan,
    toggleOwnerMode,
    refreshPlan,
    isFeatureLocked,
    acquireLock,
    releaseLock,
    executeProtectedAction
  };
};

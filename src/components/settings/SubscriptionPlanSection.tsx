import React, { useState, useEffect } from 'react';
import { 
  Crown, 
  Sparkles, 
  AlertCircle, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Settings2, 
  RefreshCw,
  Layers,
  FileText,
  Calendar,
  Radio,
  Globe,
  UserCheck,
  ShieldCheck,
  Cloud,
  CreditCard
} from 'lucide-react';
import { PlanType, PublicPlanType, SubscriptionState, UsageRecord, PlanLimits, BillingCycle } from '../../types/plans';
import { 
  PLAN_PRICING, 
  PLAN_FEATURES_LIST, 
  OWNER_CONFIG, 
  REGIONAL_CURRENCY_CATALOG,
  formatProPriceDisplay 
} from '../../config/plans';
import { subscriptionService } from '../../services/subscriptionService';
import { entitlementService } from '../../services/entitlementService';
import { accountService } from '../../services/accountService';
import { dataService } from '../../services/dataService';
import { PlanBadge } from '../PlanBadge';

interface SubscriptionPlanSectionProps {
  plan: PlanType;
  subscription: SubscriptionState;
  usage: UsageRecord;
  limits: PlanLimits;
  onSelectFreePlan?: () => { message: string };
  onSetTestPlan: (plan: PlanType | null) => void;
  onToggleOwnerMode: (isOwner: boolean) => void;
  onRefreshPlan: () => void;
  // Live counts from the app
  currentAccountsCount: number;
  currentGroupsCount: number;
  currentQueueCount: number;
  currentScheduledCount: number;
}

export const SubscriptionPlanSection: React.FC<SubscriptionPlanSectionProps> = ({
  plan,
  subscription,
  usage,
  limits,
  onSelectFreePlan,
  onSetTestPlan,
  onRefreshPlan,
  currentQueueCount,
  currentScheduledCount
}) => {
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>('monthly');
  const [selectedPublicTier, setSelectedPublicTier] = useState<PublicPlanType>(plan === 'PRO' ? 'PRO' : 'FREE');
  const [freePlanMessage, setFreePlanMessage] = useState<string | null>(null);
  const [freeSelectionCount, setFreeSelectionCount] = useState<number>(0);
  const [showDevControls, setShowDevControls] = useState(false);
  const [showFeatureList, setShowFeatureList] = useState(false);
  const [billingMessage, setBillingMessage] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  const isFree = plan === 'FREE';
  const isPro = plan === 'PRO';
  const isAdminTest = plan === 'ADMIN_TEST';

  useEffect(() => {
    setSelectedPublicTier(plan === 'PRO' ? 'PRO' : 'FREE');
  }, [plan]);

  const entitlementSnapshot = entitlementService.getEntitlements(subscription);
  const currentUser = entitlementSnapshot.user;
  const adapterInfo = accountService.getAdapterInfo();
  const syncStatus = dataService.getSyncStatus();
  const migrationReport = dataService.prepareGuestToAccountMigration();
  const billingArch = subscriptionService.getBillingArchitectureSummary();

  const monthlyPricing = formatProPriceDisplay('monthly');
  const yearlyPricing = formatProPriceDisplay('yearly');

  // Format limits display: if >= 9999, show 'Unlimited'
  const formatLimit = (limit: number) => (limit >= 9999 ? 'Unlimited' : limit.toString());

  const handleSelectFreePlan = () => {
    // 1. Mark FREE as visibly selected in UI
    setSelectedPublicTier('FREE');
    // 2. Clear any PRO billing error notice
    setBillingMessage(null);
    // 3. Use centralized entitlement/subscription service (never raw localStorage from UI)
    const res = onSelectFreePlan ? onSelectFreePlan() : entitlementService.selectFreePlan();
    onRefreshPlan();
    // 4. Always produce a visible UI response / confirmation even if already on FREE
    setFreeSelectionCount(prev => prev + 1);
    setFreePlanMessage(res.message || 'You are currently on the FREE plan.');
  };

  const handleSelectProCard = () => {
    setSelectedPublicTier('PRO');
    setFreePlanMessage(null);
  };

  const handleUpgradeToProClick = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedPublicTier('PRO');
    setFreePlanMessage(null);
    // Do NOT simulate successful payment or mutate FREE -> PRO; call centralized subscriptionService
    const result = await subscriptionService.createCheckout(selectedCycle);
    setBillingMessage(result.message || PLAN_PRICING.PRICING_DISPLAY_NOTE);
  };

  const handleRestoreSubscriptionClick = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedPublicTier('PRO');
    setFreePlanMessage(null);
    const result = await subscriptionService.restoreSubscription();
    setBillingMessage(result.message || PLAN_PRICING.PRICING_DISPLAY_NOTE);
  };

  const handleManageSubscriptionClick = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedPublicTier('PRO');
    setFreePlanMessage(null);
    const result = await subscriptionService.openManageSubscription();
    setBillingMessage(result.message || PLAN_PRICING.PRICING_DISPLAY_NOTE);
  };

  const handleCheckAuthConnection = async () => {
    const syncRes = await dataService.syncAllData();
    setAuthNotice(syncRes.message);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-6 shadow-sm">
      {/* SECTION HEADER: Account & Subscription / Plans & Upgrade */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Account & Subscription</span>
              <PlanBadge plan={plan} size="md" />
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Account identity, subscription entitlement status, FREE vs PRO plans, and usage quotas
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRefreshPlan}
          title="Refresh account and entitlement status"
          className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ACCOUNT & SUBSCRIPTION FOUNDATION SUMMARY CARD */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Account & Subscription
            </span>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            {adapterInfo.isProductionBackend ? 'Cloud Auth Connected' : 'Local Adapter (Development Stage)'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* 1. Account Status */}
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2.5">
            <UserCheck className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Account Status
              </div>
              <div className="text-xs font-extrabold text-slate-900 dark:text-white mt-0.5">
                {entitlementSnapshot.accountStatusLabel}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                ID: {currentUser.userId}
              </div>
            </div>
          </div>

          {/* 2. Current Plan */}
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Current Plan
              </div>
              <div className="text-xs font-extrabold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
                <span>{isAdminTest ? 'ADMIN TEST' : isPro ? 'PRO' : 'FREE'}</span>
                {entitlementSnapshot.isDevelopmentOverride && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300">
                    Dev/Test Override
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {isAdminTest
                  ? 'Development/Test mode only'
                  : isPro
                    ? 'Advanced features & higher limits'
                    : 'Core features with usage limits'}
              </div>
            </div>
          </div>

          {/* 3. Billing Status */}
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2.5">
            <CreditCard className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Billing Status
              </div>
              <div className="text-xs font-extrabold text-slate-900 dark:text-white mt-0.5">
                {entitlementSnapshot.billingStatusLabel}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {PLAN_PRICING.PRICING_DISPLAY_NOTE} ({billingArch.activeProviderDisplayName})
              </div>
            </div>
          </div>

          {/* 4. Future Account Sync */}
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2.5">
            <Cloud className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Future Account Sync
              </div>
              <div className="text-xs font-extrabold text-slate-900 dark:text-white mt-0.5">
                {entitlementSnapshot.futureAccountSyncLabel}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {migrationReport.totalRecordsToMigrate} local records ready for cloud migration (v{syncStatus.schemaVersion})
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            All workspaces, drafts, schedules, and settings are persisted via <strong>CentralDataService ({syncStatus.syncMode})</strong> and remain safe in <strong>Guest / Local Mode</strong> until a production cloud database is connected.
          </p>
          <button
            type="button"
            onClick={handleCheckAuthConnection}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:border-indigo-400 transition-colors"
          >
            Check Cloud & Sync Status
          </button>
        </div>

        {authNotice && (
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between gap-2 text-xs text-indigo-900 dark:text-indigo-200">
            <span>{authNotice}</span>
            <button
              type="button"
              onClick={() => setAuthNotice(null)}
              className="text-[11px] font-bold underline"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* CURRENT PLAN STATUS BANNER */}
      <div className={`p-4 rounded-2xl border transition-all ${
        isAdminTest 
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200' 
          : isPro 
            ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-900 dark:text-indigo-200' 
            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200'
      }`}>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider opacity-75">
              Plan Status
            </div>
            <div className="text-base font-black flex items-center gap-2">
              {isAdminTest && 'ADMIN TEST'}
              {isPro && 'PRO'}
              {isFree && 'FREE'}
            </div>
            <div className="text-xs opacity-90 leading-relaxed">
              {isAdminTest && `${OWNER_CONFIG.INTERNAL_LABEL} entitlement active. PRO features are unlocked for QA and demonstration without billing.`}
              {isPro && 'Advanced features and higher usage limits.'}
              {isFree && 'Core features with usage limits.'}
            </div>
          </div>
        </div>
      </div>

      {/* PUBLIC USER PLANS: FREE + PRO ONLY */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Plans & Upgrade
          </div>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Reference Currency: {PLAN_PRICING.BASE_CURRENCY} ({PLAN_PRICING.CURRENCY_SYMBOL})
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* 1. FREE PLAN CARD */}
          <div
            id="plan-card-free"
            role="button"
            tabIndex={0}
            aria-pressed={selectedPublicTier === 'FREE'}
            onClick={handleSelectFreePlan}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSelectFreePlan();
              }
            }}
            className={`relative z-10 p-4 rounded-2xl border flex flex-col justify-between space-y-3 cursor-pointer touch-manipulation select-none transition-all active:scale-[0.99] ${
              selectedPublicTier === 'FREE'
                ? 'bg-emerald-50/40 dark:bg-slate-800/90 border-emerald-500 dark:border-emerald-400 ring-2 ring-emerald-500/25 shadow-sm'
                : isFree
                  ? 'bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-600 hover:border-emerald-400'
                  : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>FREE</span>
                  {selectedPublicTier === 'FREE' && (
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  )}
                </span>
                <div className="flex items-center gap-1.5">
                  {selectedPublicTier === 'FREE' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                      Selected
                    </span>
                  )}
                  {isFree && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                      Active Plan
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Core features with usage limits.
              </p>

              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
                <div className="text-sm font-black text-slate-900 dark:text-white">
                  {PLAN_PRICING.CURRENCY_SYMBOL}0.00
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  Default plan for standard usage
                </div>
              </div>

              <ul className="space-y-1.5 pt-1 text-[11px] text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Create Post & manual cross-posting</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Up to 3 accounts/platform & 3 Posting Groups</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Basic News Hunter, RSS & Custom Search</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Basic AI Assistant (20/mo) & Queue (20 items)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Backup / Restore, Storage, Language & Themes</span>
                </li>
              </ul>
            </div>

            <div className="pt-2 space-y-2">
              <button
                id="btn-select-free-plan"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectFreePlan();
                }}
                className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold text-center cursor-pointer touch-manipulation select-none transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 ${
                  selectedPublicTier === 'FREE'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/20'
                    : 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                }`}
              >
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {isFree
                    ? (freeSelectionCount > 0 && selectedPublicTier === 'FREE'
                        ? 'Current Plan: FREE (Confirmed)'
                        : 'Current Plan: FREE')
                    : 'Switch to FREE Plan'}
                </span>
              </button>

              {freePlanMessage && selectedPublicTier === 'FREE' && (
                <div
                  key={freeSelectionCount}
                  className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center justify-center gap-1.5 animate-fadeIn text-center"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{freePlanMessage}</span>
                </div>
              )}
            </div>
          </div>

          {/* 2. PRO PLAN CARD */}
          <div
            id="plan-card-pro"
            role="button"
            tabIndex={0}
            aria-pressed={selectedPublicTier === 'PRO'}
            onClick={handleSelectProCard}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSelectProCard();
              }
            }}
            className={`relative z-10 p-4 rounded-2xl border flex flex-col justify-between space-y-3 cursor-pointer touch-manipulation select-none transition-all ${
              selectedPublicTier === 'PRO'
                ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/25 shadow-sm'
                : isPro
                  ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-500/60 shadow-sm'
                  : 'bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/40 dark:from-indigo-950/30 dark:via-slate-900 dark:to-purple-950/20 border-indigo-200 dark:border-indigo-800/60 hover:border-indigo-400'
            }`}
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>PRO</span>
                </span>
                <div className="flex items-center gap-1.5">
                  {selectedPublicTier === 'PRO' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30">
                      Selected
                    </span>
                  )}
                  {isPro && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-300">
                      Active Plan
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Advanced features and higher usage limits.
              </p>

              {/* Centralized PRO Monthly & Yearly Pricing Options */}
              <div className="grid grid-cols-1 gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPublicTier('PRO');
                    setFreePlanMessage(null);
                    setSelectedCycle('monthly');
                  }}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer touch-manipulation transition-all flex items-center justify-between ${
                    selectedCycle === 'monthly'
                      ? 'bg-indigo-600/10 border-indigo-500 dark:border-indigo-400 text-slate-900 dark:text-white'
                      : 'bg-white/80 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      PRO Monthly
                    </div>
                    <div className="text-sm font-black text-slate-900 dark:text-white">
                      {monthlyPricing.fullLabel}
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {monthlyPricing.isoLabel}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPublicTier('PRO');
                    setFreePlanMessage(null);
                    setSelectedCycle('yearly');
                  }}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer touch-manipulation transition-all flex items-center justify-between ${
                    selectedCycle === 'yearly'
                      ? 'bg-indigo-600/10 border-indigo-500 dark:border-indigo-400 text-slate-900 dark:text-white'
                      : 'bg-white/80 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        PRO Yearly
                      </span>
                      {yearlyPricing.savingsBadgeText && (
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                          {yearlyPricing.savingsBadgeText}
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-black text-slate-900 dark:text-white">
                      {yearlyPricing.fullLabel}
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {yearlyPricing.isoLabel}
                  </span>
                </button>
              </div>

              <ul className="space-y-1.5 pt-1 text-[11px] text-slate-700 dark:text-slate-300">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>Higher AI usage (1,000/mo) & News Rewrites (500/day)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>RSS + Web Search, X Trending & Advanced Search</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>Higher media discovery & download limits</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>Unlimited Social Accounts & Posting Groups</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>Unlimited Queue, Scheduling & Higher Auto Hunt</span>
                </li>
              </ul>
            </div>

            <div className="pt-2 space-y-2">
              <button
                id="btn-upgrade-to-pro"
                type="button"
                onClick={handleUpgradeToProClick}
                className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm shadow-indigo-600/20 flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation select-none transition-all active:scale-[0.98]"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>
                  Upgrade to PRO ({selectedCycle === 'monthly' ? monthlyPricing.fullLabel : yearlyPricing.fullLabel})
                </span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleRestoreSubscriptionClick}
                  className="py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:border-indigo-400 cursor-pointer touch-manipulation transition-colors"
                >
                  Restore Purchases
                </button>
                <button
                  type="button"
                  onClick={handleManageSubscriptionClick}
                  className="py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:border-indigo-400 cursor-pointer touch-manipulation transition-colors"
                >
                  Manage Subscription
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* FREE Plan Selection Confirmation Banner */}
        {freePlanMessage && (
          <div
            key={`free-banner-${freeSelectionCount}`}
            className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-2 text-xs text-emerald-800 dark:text-emerald-300 animate-fadeIn"
          >
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="font-semibold">{freePlanMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setFreePlanMessage(null)}
              className="text-[11px] font-bold underline opacity-80 hover:opacity-100 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Honest Billing Status Message */}
        {billingMessage && (
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2 text-xs text-amber-800 dark:text-amber-300 animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
              <span className="font-semibold">{billingMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setBillingMessage(null)}
              className="text-[11px] font-bold underline opacity-80 hover:opacity-100 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Global Reference Currency & Multi-Currency Readiness Note */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span>
              Prices are shown in <strong>{PLAN_PRICING.BASE_CURRENCY}</strong> reference currency. Localized checkout currency conversion ({Object.values(REGIONAL_CURRENCY_CATALOG).map(c => c.code).join(', ')}) will be handled automatically by the payment provider.
            </span>
          </div>
        </div>
      </div>

      {/* USAGE DASHBOARD */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Feature Quota & Usage Dashboard
          </div>
          <span className="text-[10px] text-slate-400">
            Resets automatically (Daily / Monthly)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* AI Generations */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                AI Content Assistant
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {usage.aiGenerationsCount} / {formatLimit(limits.aiGenerationsPerMonth)}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 transition-all rounded-full"
                style={{ 
                  width: `${limits.aiGenerationsPerMonth >= 9999 ? 5 : Math.min(100, (usage.aiGenerationsCount / limits.aiGenerationsPerMonth) * 100)}%` 
                }}
              />
            </div>
            <div className="text-[10px] text-slate-400">Resets monthly</div>
          </div>

          {/* News Hunts */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-indigo-500" />
                News Hunter Discovery
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {usage.newsHuntsCount} / {formatLimit(limits.newsHuntsPerDay)}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 transition-all rounded-full"
                style={{ 
                  width: `${limits.newsHuntsPerDay >= 9999 ? 5 : Math.min(100, (usage.newsHuntsCount / limits.newsHuntsPerDay) * 100)}%` 
                }}
              />
            </div>
            <div className="text-[10px] text-slate-400">Resets daily</div>
          </div>

          {/* News Rewrites */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-500" />
                News Rewrites & Angles
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {usage.newsRewritesCount} / {formatLimit(limits.newsRewritesPerDay)}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 transition-all rounded-full"
                style={{ 
                  width: `${limits.newsRewritesPerDay >= 9999 ? 5 : Math.min(100, (usage.newsRewritesCount / limits.newsRewritesPerDay) * 100)}%` 
                }}
              />
            </div>
            <div className="text-[10px] text-slate-400">Resets daily</div>
          </div>

          {/* Scheduled Posts */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                Scheduled Posts
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {currentScheduledCount} / {formatLimit(limits.maxScheduledPosts)}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 transition-all rounded-full"
                style={{ 
                  width: `${limits.maxScheduledPosts >= 9999 ? 5 : Math.min(100, (currentScheduledCount / limits.maxScheduledPosts) * 100)}%` 
                }}
              />
            </div>
            <div className="text-[10px] text-slate-400">Active upcoming schedules</div>
          </div>

          {/* Queue Items */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                Total Queue Items
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {currentQueueCount} / {formatLimit(limits.maxQueueItems)}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 transition-all rounded-full"
                style={{ 
                  width: `${limits.maxQueueItems >= 9999 ? 5 : Math.min(100, (currentQueueCount / limits.maxQueueItems) * 100)}%` 
                }}
              />
            </div>
            <div className="text-[10px] text-slate-400">Stored queue capacity</div>
          </div>

          {/* Web Search Discovery */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-500" />
                Web Search Discovery
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {limits.webSearchEnabled ? `${usage.webSearchesCount} / ${formatLimit(limits.webSearchesPerDay)}` : 'PRO Only'}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 transition-all rounded-full"
                style={{ 
                  width: `${!limits.webSearchEnabled ? 0 : limits.webSearchesPerDay >= 9999 ? 5 : Math.min(100, (usage.webSearchesCount / limits.webSearchesPerDay) * 100)}%` 
                }}
              />
            </div>
            <div className="text-[10px] text-slate-400">Resets daily • Guarded</div>
          </div>

          {/* Media Discovery */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                Media Discovery & Probes
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {usage.mediaDiscoveryCount} / {formatLimit(limits.mediaDiscoveryPerDay)}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 transition-all rounded-full"
                style={{ 
                  width: `${limits.mediaDiscoveryPerDay >= 9999 ? 5 : Math.min(100, (usage.mediaDiscoveryCount / limits.mediaDiscoveryPerDay) * 100)}%` 
                }}
              />
            </div>
            <div className="text-[10px] text-slate-400">Resets daily • Guarded</div>
          </div>
        </div>
      </div>

      {/* PLAN COMPARISON TOGGLE */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowFeatureList(!showFeatureList)}
          className="w-full flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 py-1"
        >
          <span>Compare FREE vs PRO Tier Features</span>
          {showFeatureList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showFeatureList && (
          <div className="mt-3 space-y-2 animate-fadeIn border-t border-slate-100 dark:border-slate-800 pt-3">
            {PLAN_FEATURES_LIST.map(feat => (
              <div key={feat.key} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-start justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">{feat.name}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">{feat.description}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] text-slate-400">FREE: {feat.freeLimitDescription}</div>
                  <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">PRO: {feat.proLimitDescription}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADMIN / OWNER TEST CONTROLS (DEVELOPMENT / TEST ONLY) */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setShowDevControls(!showDevControls)}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>ADMIN / OWNER TEST (DEVELOPMENT / TEST ONLY)</span>
          {showDevControls ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showDevControls && (
          <div className="mt-3 p-4 bg-slate-900 text-white rounded-2xl space-y-3 animate-fadeIn text-xs border border-slate-800">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-bold text-amber-400 uppercase tracking-wider">
                {OWNER_CONFIG.INTERNAL_LABEL}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                DEVELOPMENT / TEST ONLY
              </span>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              For Owner, Developer, QA, and demonstration testing only. Do not treat this client-side control as production authentication.
            </p>

            {/* Dropdown Select Control: Current Test Plan */}
            <div className="space-y-1.5 pt-1">
              <label
                htmlFor="admin-test-plan-select"
                className="block text-[11px] font-bold text-slate-300"
              >
                Current Test Plan:
              </label>
              <select
                id="admin-test-plan-select"
                value={plan}
                onChange={(e) => onSetTestPlan(e.target.value as PlanType)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="FREE">FREE</option>
                <option value="PRO">PRO</option>
                <option value="ADMIN_TEST">ADMIN TEST</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

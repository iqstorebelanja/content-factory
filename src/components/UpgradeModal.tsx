import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Check, 
  X, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';
import { PlanType, PublicPlanType, BillingCycle } from '../types/plans';
import { PLAN_PRICING, formatProPriceDisplay } from '../config/plans';
import { paymentService } from '../services/paymentService';
import { entitlementService } from '../services/entitlementService';
import { PlanBadge } from './PlanBadge';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: PlanType;
  reason?: string;
  featureName?: string;
  onSelectFreePlan?: () => { message: string };
  onNavigateToPlans?: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  currentPlan,
  reason,
  featureName,
  onSelectFreePlan,
  onNavigateToPlans
}) => {
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>('monthly');
  const [selectedTier, setSelectedTier] = useState<PublicPlanType>(currentPlan === 'PRO' ? 'PRO' : 'FREE');
  const [freeNoticeMessage, setFreeNoticeMessage] = useState<string | null>(null);
  const [freeClickCount, setFreeClickCount] = useState<number>(0);
  const [billingNoticeMessage, setBillingNoticeMessage] = useState<string | null>(null);

  useEffect(() => {
    setSelectedTier(currentPlan === 'PRO' ? 'PRO' : 'FREE');
  }, [currentPlan, isOpen]);

  if (!isOpen) return null;

  const monthlyPricing = formatProPriceDisplay('monthly');
  const yearlyPricing = formatProPriceDisplay('yearly');

  const handleSelectFree = () => {
    setSelectedTier('FREE');
    setBillingNoticeMessage(null);
    const res = onSelectFreePlan ? onSelectFreePlan() : entitlementService.selectFreePlan();
    setFreeClickCount(prev => prev + 1);
    setFreeNoticeMessage(res.message || 'You are currently on the FREE plan.');
  };

  const handleSelectPro = () => {
    setSelectedTier('PRO');
    setFreeNoticeMessage(null);
  };

  const handleUpgradeClick = async () => {
    setSelectedTier('PRO');
    setFreeNoticeMessage(null);
    const res = await paymentService.createCheckout(selectedCycle);
    setBillingNoticeMessage(res.message || PLAN_PRICING.PRICING_DISPLAY_NOTE);
  };

  const handleViewPlansClick = () => {
    setBillingNoticeMessage(null);
    setFreeNoticeMessage(null);
    onClose();
    onNavigateToPlans?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-5 pb-4 bg-gradient-to-br from-indigo-600 via-purple-600 to-slate-900 text-white">
          <button
            type="button"
            onClick={() => {
              setBillingNoticeMessage(null);
              setFreeNoticeMessage(null);
              onClose();
            }}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="p-2 rounded-2xl bg-white/20 backdrop-blur-md text-white shadow-inner">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </span>
            <PlanBadge plan={currentPlan} size="md" />
          </div>

          <h2 className="text-xl font-black tracking-tight">
            Plans & Upgrade
          </h2>
          <p className="text-xs text-indigo-100/90 mt-1 leading-relaxed">
            {reason || (featureName ? `${featureName} requires PRO or higher usage limits.` : 'Unlock advanced features and higher usage limits with PRO.')}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Public Plans Comparison (FREE vs PRO Only) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              role="button"
              tabIndex={0}
              aria-pressed={selectedTier === 'FREE'}
              onClick={handleSelectFree}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelectFree();
                }
              }}
              className={`relative z-10 p-3.5 rounded-2xl border flex flex-col justify-between space-y-2 cursor-pointer touch-manipulation select-none transition-all active:scale-[0.99] ${
                selectedTier === 'FREE'
                  ? 'bg-emerald-50/50 dark:bg-slate-800/90 border-emerald-500 dark:border-emerald-400 ring-2 ring-emerald-500/25 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-emerald-400'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1">
                    <span>FREE</span>
                    {selectedTier === 'FREE' && (
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    )}
                  </span>
                  <div className="flex items-center gap-1">
                    {selectedTier === 'FREE' && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                        Selected
                      </span>
                    )}
                    {currentPlan === 'FREE' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        Current
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Core features with usage limits.
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectFree();
                }}
                className={`w-full py-1.5 px-2.5 rounded-xl text-[11px] font-bold text-center cursor-pointer touch-manipulation select-none transition-all active:scale-[0.98] ${
                  selectedTier === 'FREE'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                }`}
              >
                {currentPlan === 'FREE' ? 'Current Plan: FREE' : 'Select FREE'}
              </button>
            </div>

            <div
              role="button"
              tabIndex={0}
              aria-pressed={selectedTier === 'PRO'}
              onClick={handleSelectPro}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelectPro();
                }
              }}
              className={`relative z-10 p-3.5 rounded-2xl border flex flex-col justify-between space-y-1.5 cursor-pointer touch-manipulation select-none transition-all active:scale-[0.99] ${
                selectedTier === 'PRO'
                  ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/25 shadow-xs'
                  : 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-500/40 hover:border-indigo-500'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-black text-indigo-700 dark:text-indigo-300">PRO</span>
                <div className="flex items-center gap-1">
                  {selectedTier === 'PRO' && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30">
                      Selected
                    </span>
                  )}
                  {currentPlan === 'PRO' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-300">
                      Current
                    </span>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-indigo-900/80 dark:text-indigo-200/80 leading-relaxed">
                Advanced features and higher usage limits.
              </p>
              <div className="pt-1 space-y-0.5 text-[11px] font-bold text-indigo-950 dark:text-indigo-200">
                <div>{monthlyPricing.fullLabel}</div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span>{yearlyPricing.fullLabel}</span>
                  {yearlyPricing.savingsBadgeText && (
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                      {yearlyPricing.savingsBadgeText}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* FREE Plan Selection Confirmation */}
          {freeNoticeMessage && (
            <div
              key={`modal-free-${freeClickCount}`}
              className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300 animate-fadeIn"
            >
              <Check className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="font-semibold">{freeNoticeMessage}</span>
            </div>
          )}

          {/* Billing Cycle Selector for PRO */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setSelectedCycle('monthly')}
              className={`p-3 rounded-2xl border text-left transition-all ${
                selectedCycle === 'monthly'
                  ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/50 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
              }`}
            >
              <div className="text-[10px] font-bold uppercase text-slate-400">PRO Monthly</div>
              <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                {monthlyPricing.fullLabel}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCycle('yearly')}
              className={`p-3 rounded-2xl border text-left transition-all ${
                selectedCycle === 'yearly'
                  ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/50 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">PRO Yearly</span>
                {yearlyPricing.savingsBadgeText && (
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    {yearlyPricing.savingsBadgeText}
                  </span>
                )}
              </div>
              <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                {yearlyPricing.fullLabel}
              </div>
            </button>
          </div>

          {/* PRO Highlights */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Included in PRO:
            </div>
            <div className="space-y-2">
              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
                <div className="p-1 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 font-black" />
                </div>
                <div className="text-xs">
                  <div className="font-bold text-slate-800 dark:text-slate-100">RSS + Web Search & X Trending</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Advanced News Hunter, custom keyword search, and real-time trending topics</div>
                </div>
              </div>

              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
                <div className="p-1 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 font-black" />
                </div>
                <div className="text-xs">
                  <div className="font-bold text-slate-800 dark:text-slate-100">More Social Media Accounts & Posting Groups</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Manage unlimited accounts and multi-channel posting groups</div>
                </div>
              </div>

              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
                <div className="p-1 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 font-black" />
                </div>
                <div className="text-xs">
                  <div className="font-bold text-slate-800 dark:text-slate-100">Higher AI, Media Discovery & Queue Limits</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">1,000 AI generations/month, 500 news rewrites/day, and unlimited scheduling</div>
                </div>
              </div>
            </div>
          </div>

          {/* Honest Billing Status Notice when Upgrade to PRO is clicked */}
          {billingNoticeMessage && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-300 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
              <span className="font-semibold">{billingNoticeMessage}</span>
            </div>
          )}

          {/* Data Safety Assurance */}
          <div className="flex items-center gap-2 text-[11px] text-slate-400 px-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Your existing accounts, drafts, and queue data are always kept safe.</span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 space-y-2">
          {currentPlan !== 'PRO' && (
            <button
              type="button"
              onClick={handleUpgradeClick}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Upgrade to PRO</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            {onNavigateToPlans && (
              <button
                type="button"
                onClick={handleViewPlansClick}
                className="flex-1 py-2.5 px-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all text-center"
              >
                Plans & Upgrade
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setBillingNoticeMessage(null);
                onClose();
              }}
              className="flex-1 py-2.5 px-3 rounded-2xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-semibold transition-all text-center"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

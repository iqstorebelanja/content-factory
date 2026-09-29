import React from 'react';
import { PlanType } from '../types/plans';
import { Crown, Sparkles } from 'lucide-react';
import { usePlanContext } from '../contexts/PlanContext';

interface PlanBadgeProps {
  plan?: PlanType;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onClick?: () => void;
  className?: string;
}

export const PlanBadge: React.FC<PlanBadgeProps> = ({
  plan: propPlan,
  size = 'sm',
  interactive = false,
  onClick,
  className = ''
}) => {
  let contextPlan: PlanType | undefined;

  try {
    const ctx = usePlanContext();
    contextPlan = ctx.plan;
  } catch {
    // If rendered outside PlanProvider
  }

  const plan = propPlan || contextPlan || 'FREE';

  let label = 'FREE';
  let badgeStyle = 'bg-slate-100 text-slate-600 dark:bg-slate-800/80 dark:text-slate-400 border-slate-200 dark:border-slate-700/80';
  let Icon = null;

  switch (plan) {
    case 'ADMIN_TEST':
      label = 'ADMIN TEST';
      badgeStyle = 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-black';
      Icon = Crown;
      break;

    case 'PRO':
      label = 'PRO';
      badgeStyle = 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-600 dark:text-indigo-300 border-indigo-500/30 font-black';
      Icon = Sparkles;
      break;

    case 'FREE':
    default:
      label = 'FREE';
      badgeStyle = 'bg-slate-100 text-slate-600 dark:bg-slate-800/80 dark:text-slate-400 border-slate-200 dark:border-slate-700/80';
      break;
  }

  const sizeClass = size === 'lg' 
    ? 'text-xs px-2.5 py-1 gap-1.5' 
    : size === 'md' 
      ? 'text-[11px] px-2 py-0.5 gap-1' 
      : 'text-[10px] px-1.5 py-0.5 gap-1';

  return (
    <button
      type="button"
      disabled={!interactive && !onClick}
      onClick={onClick}
      className={`inline-flex items-center font-bold tracking-wider rounded-lg border transition-all ${badgeStyle} ${sizeClass} ${
        interactive || onClick ? 'cursor-pointer hover:opacity-80 active:scale-95' : 'cursor-default'
      } ${className}`}
    >
      {Icon && <Icon className={size === 'lg' ? 'w-3.5 h-3.5' : 'w-3 h-3'} />}
      <span>{label}</span>
    </button>
  );
};

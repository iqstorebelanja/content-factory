import React, { useMemo } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Radio, 
  Sparkles, 
  Share2, 
  Bell, 
  Database,
  Activity,
  Crown
} from 'lucide-react';
import { AppSettings, UserSocialAccounts } from '../../types';
import { PlanType } from '../../types/plans';
import { getNotificationRuntimeStatus } from '../../utils/notificationHelper';
import { DATA_SCHEMA_VERSION } from '../../types';
import { PlanBadge } from '../PlanBadge';

interface AppStatusHeaderProps {
  settings: AppSettings;
  userAccounts: UserSocialAccounts;
  isDriveConnected?: boolean;
  plan?: PlanType;
  onOpenSubscription?: () => void;
}

export const AppStatusHeader: React.FC<AppStatusHeaderProps> = ({
  settings,
  userAccounts,
  isDriveConnected,
  plan = 'FREE',
  onOpenSubscription
}) => {
  const notifStatus = useMemo(() => getNotificationRuntimeStatus(), []);

  // Compute live application status based on actual state (no fabrication)
  const statusItems = useMemo(() => {
    // 1. Local Data
    const schemaOk = localStorage.getItem('sss_schema_version') === DATA_SCHEMA_VERSION.toString();
    const localDataStatus: 'Healthy' | 'Warning' = schemaOk ? 'Healthy' : 'Warning';

    // 2. News Hunter
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const newsHunterStatus: 'Ready' | 'Offline' = isOnline ? 'Ready' : 'Offline';

    // 3. AI
    const aiEnabled = settings.aiSettings?.assistantEnabled !== false;
    const aiStatus: 'Available' | 'Unavailable' = aiEnabled ? 'Available' : 'Unavailable';

    // 4. Share Engine
    const totalAccounts = 
      (userAccounts.facebook_page?.length || 0) +
      (userAccounts.facebook_profile?.length || 0) +
      (userAccounts.instagram?.length || 0) +
      (userAccounts.tiktok?.length || 0) +
      (userAccounts.youtube?.length || 0) +
      (userAccounts.twitter?.length || 0) +
      (userAccounts.whatsapp?.length || 0);
    const shareEngineStatus: 'Ready' | 'Limited' = totalAccounts > 0 ? 'Ready' : 'Limited';

    // 5. Notifications
    const notifState: 'Web Limited' | 'Native Ready' = notifStatus.hasDevBuild ? 'Native Ready' : 'Web Limited';

    // 6. Backup
    const backupStatus: 'Ready' | 'Warning' = typeof localStorage !== 'undefined' ? 'Ready' : 'Warning';

    // 7. Plan tier label
    const planLabel = plan === 'ADMIN_TEST' ? 'ADMIN TEST' : plan;

    return [
      {
        label: 'Tier Plan',
        value: planLabel,
        isGood: plan === 'PRO' || plan === 'ADMIN_TEST',
        icon: Crown,
        note: plan === 'ADMIN_TEST' ? 'Admin / QA' : plan === 'PRO' ? 'Full Access' : 'Core Tier'
      },
      {
        label: 'Local Data',
        value: localDataStatus,
        isGood: localDataStatus === 'Healthy',
        icon: Database,
        note: `Schema v${DATA_SCHEMA_VERSION}`
      },
      {
        label: 'News Hunter',
        value: newsHunterStatus,
        isGood: newsHunterStatus === 'Ready',
        icon: Radio,
        note: isOnline ? 'Online' : 'No connection'
      },
      {
        label: 'AI Assistant',
        value: aiStatus,
        isGood: aiStatus === 'Available',
        icon: Sparkles,
        note: aiEnabled ? 'Active' : 'Disabled'
      },
      {
        label: 'Share Engine',
        value: shareEngineStatus,
        isGood: shareEngineStatus === 'Ready',
        icon: Share2,
        note: `${totalAccounts} accounts`
      },
      {
        label: 'Backup',
        value: backupStatus,
        isGood: backupStatus === 'Ready',
        icon: ShieldCheck,
        note: isDriveConnected ? 'Drive Linked' : 'Local Only'
      }
    ];
  }, [settings, userAccounts, isDriveConnected, notifStatus, plan]);

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-4 sm:p-5 border border-slate-700/60 shadow-lg">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-700/60">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-indigo-300">
              Control Center & System Status
            </h2>
            <p className="text-[11px] text-slate-400">
              Live operational health and subsystem readiness
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Operational
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {statusItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="bg-slate-800/80 hover:bg-slate-800 rounded-2xl p-2.5 border border-slate-700/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                  <Icon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.isGood ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : item.isWarning ? (
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                )}
              </div>
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-xs font-bold text-white tracking-tight">
                  {item.value}
                </span>
                <span className="text-[10px] text-slate-400 truncate">
                  {item.note}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React from 'react';
import { Share2, ArrowUp, ArrowDown, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';
import { AppSettings, SharingControlSettings, PlatformId } from '../../types';
import { PLATFORMS } from '../../data/platforms';

interface SharingSettingsSectionProps {
  settings: AppSettings;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
}

export const SharingSettingsSection: React.FC<SharingSettingsSectionProps> = ({
  settings,
  onUpdateSettings
}) => {
  const currentSharingSettings: SharingControlSettings = settings.sharingSettings || {
    confirmBeforeOpen: true,
    confirmCompletionAfterOpen: true,
    defaultPlatformOrder: [
      'facebook_page',
      'instagram',
      'tiktok',
      'youtube',
      'twitter',
      'whatsapp'
    ]
  };

  const handleToggle = (key: 'confirmBeforeOpen' | 'confirmCompletionAfterOpen') => {
    onUpdateSettings({
      sharingSettings: {
        ...currentSharingSettings,
        [key]: !currentSharingSettings[key]
      }
    });
  };

  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    const list = [...(currentSharingSettings.defaultPlatformOrder || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    onUpdateSettings({
      sharingSettings: {
        ...currentSharingSettings,
        defaultPlatformOrder: list
      }
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 space-y-6 shadow-sm">
      <div>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Share2 className="w-4 h-4 text-indigo-500" />
          <span>Sharing Workflow & Platform Sequencing</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Composer confirmation dialogs, manual validation enforcement, and dispatch order
        </p>
      </div>

      {/* Manual Share Confirmation Rule */}
      <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/40 flex items-start gap-2.5">
        <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-[11px] text-indigo-900 dark:text-indigo-300 leading-relaxed">
          <strong className="font-semibold block mb-0.5">Anti-Ghosting Publishing Policy:</strong>
          Opening Facebook, Instagram, TikTok, YouTube, X, or WhatsApp marks the session destination as <em>OPENED</em>. The post is <strong>NEVER</strong> automatically marked as Published without your explicit confirmation.
        </div>
      </div>

      <div className="space-y-4">
        {/* Confirm Before Open Toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <div>
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
              Confirm Before Opening Platform
            </label>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Display copy & media preview modal before launching external app
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleToggle('confirmBeforeOpen')}
            className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${
              currentSharingSettings.confirmBeforeOpen ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                currentSharingSettings.confirmBeforeOpen ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Confirm Completion After Open Toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <div>
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
              Prompt Completion Status After App Launch
            </label>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Prompt for "Mark as Completed" or "Skip" when returning from platform
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleToggle('confirmCompletionAfterOpen')}
            className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${
              currentSharingSettings.confirmCompletionAfterOpen ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                currentSharingSettings.confirmCompletionAfterOpen ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Default Platform Order */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2.5">
          <div>
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
              Default Cross-Posting Sequence
            </label>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Order in which destination platforms are presented in the Share Center
            </span>
          </div>

          <div className="space-y-1.5">
            {(currentSharingSettings.defaultPlatformOrder || []).map((platformId, idx) => {
              const platformMeta = PLATFORMS[platformId];
              return (
                <div
                  key={platformId}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {platformMeta?.name || platformId}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveOrder(idx, 'up')}
                      className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === (currentSharingSettings.defaultPlatformOrder || []).length - 1}
                      onClick={() => handleMoveOrder(idx, 'down')}
                      className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

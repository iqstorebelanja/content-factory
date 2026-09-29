import React from 'react';
import { Calendar, Clock, AlertTriangle, Bell, Zap } from 'lucide-react';
import { AppSettings, SchedulingControlSettings } from '../../types';

interface SchedulingSettingsSectionProps {
  settings: AppSettings;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
}

export const SchedulingSettingsSection: React.FC<SchedulingSettingsSectionProps> = ({
  settings,
  onUpdateSettings
}) => {
  const currentSchedulingSettings: SchedulingControlSettings = settings.schedulingSettings || {
    defaultTimezone: 'Asia/Jakarta',
    defaultPriority: 'normal',
    reminderMinutesBefore: 15
  };

  const handleUpdate = (updates: Partial<SchedulingControlSettings>) => {
    onUpdateSettings({
      schedulingSettings: {
        ...currentSchedulingSettings,
        ...updates
      }
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 space-y-6 shadow-sm">
      <div>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-500" />
          <span>Scheduling & Timeline Reminders</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Queue defaults, priority ranking, and notification lead times
        </p>
      </div>

      {/* Manual Publishing Architecture Notice */}
      <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
          <strong className="font-semibold block mb-0.5">Reminder Mechanism Notice:</strong>
          Social Share Scheduler uses an assisted workflow. Scheduling a post sets an in-app reminder that opens the Share Center. The app does <strong>NOT</strong> post automatically in the background without explicit user confirmation.
        </div>
      </div>

      <div className="space-y-4">
        {/* Default Priority */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-500 shrink-0" />
            <div>
              <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                Default Queue Priority
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Initial priority status for scheduled posts
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'low', label: 'Low', color: 'text-slate-600' },
              { id: 'normal', label: 'Normal', color: 'text-indigo-600' },
              { id: 'high', label: 'High', color: 'text-amber-600' }
            ].map((p) => {
              const isActive = (currentSchedulingSettings.defaultPriority || 'normal') === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleUpdate({ defaultPriority: p.id as any })}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all text-center ${
                    isActive
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Reminder Before Scheduled Post */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-500 shrink-0" />
            <div>
              <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                Lead-Time Reminder Alert
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                How far in advance the app alerts you before a scheduled post is due
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { mins: 5, label: '5 Mins' },
              { mins: 10, label: '10 Mins' },
              { mins: 15, label: '15 Mins' },
              { mins: 30, label: '30 Mins' },
              { mins: 60, label: '1 Hour' }
            ].map((rm) => {
              const isActive = (currentSchedulingSettings.reminderMinutesBefore || 15) === rm.mins;
              return (
                <button
                  key={rm.mins}
                  type="button"
                  onClick={() => handleUpdate({ reminderMinutesBefore: rm.mins as any })}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition-all text-center ${
                    isActive
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {rm.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Timezone Note */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
            <div>
              <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                Scheduling Clock Reference
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Synced with General timezone setting ({settings.timezone || 'Asia/Jakarta'})
              </span>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            {settings.timezone || 'Asia/Jakarta'}
          </span>
        </div>
      </div>
    </div>
  );
};

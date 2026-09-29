import React from 'react';
import { Bell, AlertCircle, Clock, Radio, Share2, Smartphone } from 'lucide-react';
import { AppSettings, NotificationControlSettings } from '../../types';
import { getNotificationRuntimeStatus } from '../../utils/notificationHelper';

interface NotificationSettingsSectionProps {
  settings: AppSettings;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
}

export const NotificationSettingsSection: React.FC<NotificationSettingsSectionProps> = ({
  settings,
  onUpdateSettings
}) => {
  const runtimeStatus = getNotificationRuntimeStatus();

  const currentNotifSettings: NotificationControlSettings = settings.notificationControlSettings || {
    masterEnabled: settings.notificationEnabled ?? true,
    queueReminders: true,
    newsHunterAlerts: true,
    shareSessionReminders: true
  };

  const handleToggle = (key: keyof NotificationControlSettings) => {
    const updated = {
      ...currentNotifSettings,
      [key]: !currentNotifSettings[key]
    };
    onUpdateSettings({
      notificationEnabled: key === 'masterEnabled' ? updated.masterEnabled : settings.notificationEnabled,
      notificationControlSettings: updated
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 space-y-6 shadow-sm">
      <div>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Bell className="w-4 h-4 text-indigo-500" />
          <span>Notification & Alert Center</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          In-app alerts, queue triggers, News Hunter discoveries, and active session reminders
        </p>
      </div>

      {/* Honest Runtime Status Banner (Requirement #9 & #11: Never fake native background alarms in web preview) */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
        <div className="flex items-center gap-2.5">
          <Smartphone className="w-4 h-4 text-indigo-500 shrink-0" />
          <div className="text-xs font-bold text-slate-900 dark:text-white">
            Runtime Environment: {runtimeStatus.hasDevBuild ? 'Android Native Build' : 'Web Preview / Browser'}
          </div>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          {runtimeStatus.hasDevBuild
            ? 'Background push notifications and OS alarms are active via Android WorkManager.'
            : 'Native background notifications require an Android APK build. In this Web Preview, reminders trigger in-app while the browser session is open.'}
        </p>
        {!runtimeStatus.hasDevBuild && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
            Native notifications require Android build
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Master Notifications Toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <div>
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
              Allow Notifications & Alerts
            </label>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Master switch for all scheduled alerts and discovery toasts
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleToggle('masterEnabled')}
            className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${
              currentNotifSettings.masterEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                currentNotifSettings.masterEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Queue Reminders Toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
            <div>
              <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                Queue Reminders
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Alerts when a scheduled post enters the "Due Now" posting window
              </span>
            </div>
          </div>
          <button
            type="button"
            disabled={!currentNotifSettings.masterEnabled}
            onClick={() => handleToggle('queueReminders')}
            className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 disabled:opacity-40 ${
              currentNotifSettings.queueReminders && currentNotifSettings.masterEnabled
                ? 'bg-indigo-600'
                : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                currentNotifSettings.queueReminders && currentNotifSettings.masterEnabled
                  ? 'translate-x-6'
                  : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* News Hunter Alerts Toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Radio className="w-4 h-4 text-indigo-500 shrink-0" />
            <div>
              <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                News Hunter Alerts
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Toast notifications when Auto Hunt uncovers high-priority viral stories
              </span>
            </div>
          </div>
          <button
            type="button"
            disabled={!currentNotifSettings.masterEnabled}
            onClick={() => handleToggle('newsHunterAlerts')}
            className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 disabled:opacity-40 ${
              currentNotifSettings.newsHunterAlerts && currentNotifSettings.masterEnabled
                ? 'bg-indigo-600'
                : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                currentNotifSettings.newsHunterAlerts && currentNotifSettings.masterEnabled
                  ? 'translate-x-6'
                  : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Share Session Reminders Toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Share2 className="w-4 h-4 text-indigo-500 shrink-0" />
            <div>
              <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                Share Session Reminders
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Top banner alerting when an active share session has uncompleted destinations
              </span>
            </div>
          </div>
          <button
            type="button"
            disabled={!currentNotifSettings.masterEnabled}
            onClick={() => handleToggle('shareSessionReminders')}
            className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 disabled:opacity-40 ${
              currentNotifSettings.shareSessionReminders && currentNotifSettings.masterEnabled
                ? 'bg-indigo-600'
                : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                currentNotifSettings.shareSessionReminders && currentNotifSettings.masterEnabled
                  ? 'translate-x-6'
                  : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

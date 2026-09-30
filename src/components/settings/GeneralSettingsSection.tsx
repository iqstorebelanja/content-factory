import React from 'react';
import { Globe, Clock, Moon, Sun, Monitor, Compass, Sparkles, Palette } from 'lucide-react';
import { AppSettings } from '../../types';
import { DisplayLanguageDropdown } from './DisplayLanguageDropdown';

interface GeneralSettingsSectionProps {
  settings: AppSettings;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
}

export const GeneralSettingsSection: React.FC<GeneralSettingsSectionProps> = ({
  settings,
  onUpdateSettings
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 space-y-6 shadow-sm">
      <div>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Globe className="w-4 h-4 text-indigo-500" />
          <span>General Application Settings</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Core application identity, localization, display appearance, and default view
        </p>
      </div>

      <div className="space-y-4">
        {/* App Name */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <div>
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
              Application Name
            </label>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              System display title and export branding
            </span>
          </div>
          <input
            type="text"
            value={settings.appName || 'Social Share Scheduler'}
            onChange={(e) => onUpdateSettings({ appName: e.target.value })}
            className="w-full sm:w-60 px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-medium"
          />
        </div>

        {/* Timezone */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
            <div>
              <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                Primary Timezone
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Scheduled queue and timeline calculation base
              </span>
            </div>
          </div>
          <select
            value={settings.timezone || 'Asia/Jakarta'}
            onChange={(e) => onUpdateSettings({ timezone: e.target.value })}
            className="w-full sm:w-60 px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-semibold"
          >
            <option value="Asia/Jakarta">Asia/Jakarta (WIB, UTC+7)</option>
            <option value="Asia/Makassar">Asia/Makassar (WITA, UTC+8)</option>
            <option value="Asia/Jayapura">Asia/Jayapura (WIT, UTC+9)</option>
            <option value="UTC">UTC (Universal Time)</option>
          </select>
        </div>

        {/* Theme */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2.5">
          <div>
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
              Color Theme
            </label>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Select your interface color scheme (Dark, Light, Lollipop Red-White, or System)
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'dark', label: 'Dark', icon: Moon },
              { id: 'light', label: 'Light', icon: Sun },
              { id: 'lollipop', label: 'Lollipop', icon: Palette },
              { id: 'system', label: 'System', icon: Monitor }
            ].map((t) => {
              const Icon = t.icon;
              const isActive = (settings.theme || 'dark') === t.id;
              const isLollipop = t.id === 'lollipop';
              return (
                <button
                  key={t.id}
                  id={`btn-theme-${t.id}`}
                  type="button"
                  onClick={() => onUpdateSettings({ theme: t.id as any })}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    isActive
                      ? isLollipop
                        ? 'border-red-500 bg-red-50 text-red-700 shadow-sm ring-1 ring-red-400/50'
                        : 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {isLollipop ? (
                    <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-[#E53935] via-[#EF4444] to-[#FB7185] border border-white shadow-xs shrink-0" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Language */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <div>
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
              Display Language
            </label>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Application UI language & localized labels
            </span>
          </div>
          <DisplayLanguageDropdown
            settings={settings}
            onUpdateSettings={onUpdateSettings}
          />
        </div>

        {/* Default Landing Page */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-indigo-500 shrink-0" />
            <div>
              <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                Default Landing Page
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Screen displayed automatically when opening the application
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'home', label: 'Home Dashboard' },
              { id: 'news', label: 'News Hunter' },
              { id: 'create', label: 'Create Post' }
            ].map((p) => {
              const isActive = (settings.defaultLandingPage || 'home') === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onUpdateSettings({ defaultLandingPage: p.id as any })}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition-all text-center ${
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
      </div>
    </div>
  );
};

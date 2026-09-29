import React, { useState } from 'react';
import { Image, Video, HardDrive, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { AppSettings, MediaControlSettings } from '../../types';
import { getMediaCacheStats, clearMediaCache } from '../../utils/mediaCache';

interface MediaSettingsSectionProps {
  settings: AppSettings;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
}

export const MediaSettingsSection: React.FC<MediaSettingsSectionProps> = ({
  settings,
  onUpdateSettings
}) => {
  const [cacheStats, setCacheStats] = useState(() => getMediaCacheStats());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const currentMediaSettings: MediaControlSettings = settings.mediaSettings || {
    autoPreviewMedia: true,
    preferDownloadable: false,
    maxPreviewSize: 'medium'
  };

  const handleToggle = (key: 'autoPreviewMedia' | 'preferDownloadable') => {
    onUpdateSettings({
      mediaSettings: {
        ...currentMediaSettings,
        [key]: !currentMediaSettings[key]
      }
    });
  };

  const handleUpdateSize = (size: 'small' | 'medium' | 'large') => {
    onUpdateSettings({
      mediaSettings: {
        ...currentMediaSettings,
        maxPreviewSize: size
      }
    });
  };

  const handleClearCache = () => {
    const fresh = clearMediaCache();
    setCacheStats(fresh);
    setToastMessage('Media cache cleared safely. Your Library, Drafts & History are preserved.');
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 space-y-6 shadow-sm">
      <div>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Image className="w-4 h-4 text-indigo-500" />
          <span>Media Handling & Cache Controls</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Controls for image/video preview rendering, storage constraints, and memory optimization
        </p>
      </div>

      {toastMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 rounded-2xl text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Safety Notice: No Automatic Video Blob Caching */}
      <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
          <strong className="font-semibold block mb-0.5">Zero Bloat Storage Policy:</strong>
          The app stores media as web URLs and lightweight pointers. Heavy raw video blobs are never injected into localStorage to protect device responsiveness and memory limits.
        </div>
      </div>

      <div className="space-y-4">
        {/* Auto Preview Toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <div>
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
              Auto Preview Media
            </label>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Render inline thumbnail images and video cards in discovery feeds
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleToggle('autoPreviewMedia')}
            className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${
              currentMediaSettings.autoPreviewMedia ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                currentMediaSettings.autoPreviewMedia ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Prefer Downloadable Media Toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <div>
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
              Prefer Downloadable Media
            </label>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Prioritize stories with verified direct media files over webpage embeds
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleToggle('preferDownloadable')}
            className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${
              currentMediaSettings.preferDownloadable ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                currentMediaSettings.preferDownloadable ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Maximum Preview Size */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2.5">
          <div>
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
              Maximum Preview Dimensions
            </label>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Control thumbnail height in feed list items to save vertical screen space
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'small', label: 'Small (Compact)' },
              { id: 'medium', label: 'Medium (Balanced)' },
              { id: 'large', label: 'Large (Hero)' }
            ].map((sz) => {
              const isActive = (currentMediaSettings.maxPreviewSize || 'medium') === sz.id;
              return (
                <button
                  key={sz.id}
                  type="button"
                  onClick={() => handleUpdateSize(sz.id as any)}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition-all text-center ${
                    isActive
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {sz.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Media Cache Card */}
        <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Temporary Media Metadata Cache
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {cacheStats.count} items recorded ({cacheStats.formattedSize})
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClearCache}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Clear Media Cache</span>
          </button>
        </div>
      </div>
    </div>
  );
};

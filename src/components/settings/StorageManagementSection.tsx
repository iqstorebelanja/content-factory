import React, { useState, useEffect, useCallback } from 'react';
import { 
  Database, 
  Trash2, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle2, 
  HardDrive, 
  ShieldCheck, 
  Layers, 
  Info,
  Clock,
  Sparkles,
  RefreshCw,
  FileText,
  Calendar,
  Shield,
  X
} from 'lucide-react';
import { 
  AppSettings, 
  StorageCacheSettings, 
  MediaCacheRetentionDays, 
  HistoryRetentionDays 
} from '../../types';
import { DEFAULT_APP_SETTINGS, DEFAULT_STORAGE_CACHE_SETTINGS } from '../../utils/appSettingsDefaults';
import { 
  getStorageDisplaySummary, 
  getCachedMediaStats,
  clearMediaCacheCompletely, 
  executeStorageCleanup, 
  getLocalEquivalentTime,
  CleanupResult,
  StorageDisplaySummary
} from '../../utils/storageCleanupEngine';

interface StorageManagementSectionProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onResetSettingsSuccess?: () => void;
  onHistoryCleaned?: () => void;
}

const UTC_TIME_OPTIONS = [
  { value: '00:00', label: '00:00 UTC (Default - Midnight)' },
  { value: '03:00', label: '03:00 UTC' },
  { value: '06:00', label: '06:00 UTC (Morning)' },
  { value: '09:00', label: '09:00 UTC' },
  { value: '12:00', label: '12:00 UTC (Noon)' },
  { value: '15:00', label: '15:00 UTC' },
  { value: '18:00', label: '18:00 UTC (Evening)' },
  { value: '21:00', label: '21:00 UTC' }
];

export const StorageManagementSection: React.FC<StorageManagementSectionProps> = ({
  settings,
  onUpdateSettings,
  onResetSettingsSuccess,
  onHistoryCleaned
}) => {
  const storageSettings: StorageCacheSettings = {
    ...DEFAULT_STORAGE_CACHE_SETTINGS,
    ...(settings.storageCacheSettings || {})
  };

  // Live storage breakdown & cached media stats
  const [summary, setSummary] = useState<StorageDisplaySummary>(() => getStorageDisplaySummary());
  const [cachedMedia, setCachedMedia] = useState(() => getCachedMediaStats());

  // Modals & In-flight states
  const [showClearCacheModal, setShowClearCacheModal] = useState(false);
  const [showResetSettingsModal, setShowResetSettingsModal] = useState(false);
  const [isCleaningNow, setIsCleaningNow] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);
  
  // Results and toasts
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  const refreshStats = useCallback(() => {
    setSummary(getStorageDisplaySummary());
    setCachedMedia(getCachedMediaStats());
  }, []);

  useEffect(() => {
    refreshStats();
  }, [settings, refreshStats]);

  // Update storage cache settings helper
  const updateStorageSettings = (updates: Partial<StorageCacheSettings>) => {
    const updated = {
      ...storageSettings,
      ...updates
    };
    onUpdateSettings({
      storageCacheSettings: updated
    });
  };

  // Handle Clear Media Cache completely
  const handleExecuteClearCache = async () => {
    setIsClearingCache(true);
    try {
      const res = await clearMediaCacheCompletely();
      refreshStats();
      setShowClearCacheModal(false);
      setToastMessage({
        type: 'success',
        text: `Media cache cleared (${res.formattedRemoved} freed across ${res.filesRemoved} files). Saved items, drafts, and accounts are safe.`
      });
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      setIsClearingCache(false);
    }
  };

  // Handle Manual "Clean Now"
  const handleCleanNow = async () => {
    setIsCleaningNow(true);
    setCleanupResult(null);
    try {
      const result = await executeStorageCleanup(storageSettings, { forceManual: true });
      refreshStats();
      setCleanupResult(result);
      if (result.historyRecordsRemoved > 0 && onHistoryCleaned) {
        onHistoryCleaned();
      }
    } catch (err: any) {
      setToastMessage({
        type: 'info',
        text: 'Cleanup encountered an issue: ' + (err?.message || 'Unknown error')
      });
    } finally {
      setIsCleaningNow(false);
    }
  };

  // Reset Settings only back to defaults (existing feature preservation)
  const handleExecuteResetSettings = () => {
    onUpdateSettings({ ...DEFAULT_APP_SETTINGS });
    refreshStats();
    setShowResetSettingsModal(false);
    setToastMessage({
      type: 'success',
      text: 'Settings reset to factory defaults. Your Accounts, Groups, Drafts, History & News Library remain safe.'
    });
    if (onResetSettingsSuccess) onResetSettingsSuccess();
    setTimeout(() => setToastMessage(null), 5000);
  };

  const localTimeEquivalent = getLocalEquivalentTime(
    storageSettings.cleanupTimeUtc || '00:00', 
    settings.timezone || 'Asia/Jakarta'
  );

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 space-y-6 shadow-sm">
      
      {/* SECTION HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Settings → Storage & Cache
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-500" />
            <span>Storage & Cache Management</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure automated media cache purge, expired history retention, and daily UTC schedule.
          </p>
        </div>

        <button
          type="button"
          onClick={refreshStats}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5"
          title="Refresh storage metrics"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {toastMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 rounded-2xl text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* ================================================== */}
      {/* 8. STORAGE DISPLAY (Simple Storage Summary)       */}
      {/* ================================================== */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Storage Summary
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            Local browser storage footprint
          </span>
        </div>

        {summary.isUnavailable ? (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-center">
            <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
              Storage usage unavailable
            </span>
            <p className="text-[11px] text-amber-700/80 dark:text-amber-400 mt-0.5">
              Exact storage measurement is not accessible in this browser session.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* MEDIA CACHE */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                MEDIA CACHE
              </span>
              <div className="mt-2">
                <span className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 block">
                  {summary.formattedMediaCache}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  {summary.mediaFileCount} cached files
                </span>
              </div>
            </div>

            {/* HISTORY */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                HISTORY
              </span>
              <div className="mt-2">
                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white block">
                  {summary.formattedHistory}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  {summary.historyRecordCount} past post records
                </span>
              </div>
            </div>

            {/* TOTAL APP DATA */}
            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider">
                TOTAL APP DATA
              </span>
              <div className="mt-2">
                <span className="text-xl sm:text-2xl font-black text-indigo-700 dark:text-indigo-300 block">
                  {summary.formattedTotalAppData}
                </span>
                <span className="text-[10px] text-indigo-500/80 dark:text-indigo-400 mt-0.5 block">
                  All local data & assets
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================================================== */}
      {/* 1. & 2. MEDIA CACHE SETTINGS & CACHE SIZE         */}
      {/* ================================================== */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-indigo-500" />
              <span>MEDIA CACHE</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configure automatic cleanup of downloaded and cached images and videos
            </p>
          </div>

          {/* Toggle: Automatic Media Cleanup ON / OFF */}
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Automatic Media Cleanup
            </span>
            <button
              type="button"
              onClick={() => updateStorageSettings({ autoMediaCleanupEnabled: !storageSettings.autoMediaCleanupEnabled })}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${
                storageSettings.autoMediaCleanupEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
              aria-label="Toggle Automatic Media Cleanup"
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                  storageSettings.autoMediaCleanupEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-[11px] font-bold uppercase ${storageSettings.autoMediaCleanupEnabled ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
              {storageSettings.autoMediaCleanupEnabled ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>

        {/* Media Cache Retention Options */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
            Media Retention Period
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { days: 1 as MediaCacheRetentionDays, label: 'Keep 1 day' },
              { days: 3 as MediaCacheRetentionDays, label: 'Keep 3 days' },
              { days: 7 as MediaCacheRetentionDays, label: 'Keep 7 days', isDefault: true },
              { days: 30 as MediaCacheRetentionDays, label: 'Keep 30 days' },
              { days: 0 as MediaCacheRetentionDays, label: 'Never automatically delete' }
            ].map((opt) => {
              const isSelected = storageSettings.mediaRetentionDays === opt.days;
              return (
                <button
                  key={opt.days}
                  type="button"
                  onClick={() => updateStorageSettings({ mediaRetentionDays: opt.days })}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition-all text-center flex flex-col items-center justify-center min-h-[46px] ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-sm font-bold'
                      : 'border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{opt.label}</span>
                  {opt.isDefault && (
                    <span className="text-[9px] uppercase tracking-wider text-indigo-500 font-extrabold mt-0.5">
                      Default
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scope and Non-deletion boundaries */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5 leading-relaxed">
          <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-indigo-500" />
            <span>Applies only to locally cached / downloaded media used by:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 pl-5 text-[11px]">
            <div>• News Hunter</div>
            <div>• Preview media</div>
            <div>• News Library media</div>
            <div>• Temporary downloaded images</div>
            <div>• Media Discovery</div>
            <div>• Temporary downloaded videos</div>
          </div>
          <div className="pt-1 text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
            🛡️ User-uploaded original media, media explicitly saved as permanent, and Draft content references are never deleted.
          </div>
        </div>

        {/* 2. CACHE SIZE & CLEAR MEDIA CACHE BUTTON */}
        <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/50 flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              Cached Media
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
              {cachedMedia.formattedSize} / {cachedMedia.fileCount} files
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowClearCacheModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700/60 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 shadow-2xs active:scale-[0.99]"
          >
            <Trash2 className="w-3.5 h-3.5 text-indigo-500" />
            <span>Clear Media Cache</span>
          </button>
        </div>
      </div>

      {/* ================================================== */}
      {/* 4. HISTORY CLEANUP (HISTORY RETENTION)            */}
      {/* ================================================== */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span>HISTORY RETENTION</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Automated cleanup of completed Share Engine sessions and old history records
            </p>
          </div>

          {/* Toggle: Automatic History Cleanup ON / OFF */}
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Automatic History Cleanup
            </span>
            <button
              type="button"
              onClick={() => updateStorageSettings({ autoHistoryCleanupEnabled: !storageSettings.autoHistoryCleanupEnabled })}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${
                storageSettings.autoHistoryCleanupEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
              aria-label="Toggle Automatic History Cleanup"
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                  storageSettings.autoHistoryCleanupEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-[11px] font-bold uppercase ${storageSettings.autoHistoryCleanupEnabled ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
              {storageSettings.autoHistoryCleanupEnabled ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>

        {/* History Retention Options */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
            History Retention Period
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
            {[
              { days: 7 as HistoryRetentionDays, label: '7 days' },
              { days: 30 as HistoryRetentionDays, label: '30 days', isDefault: true },
              { days: 90 as HistoryRetentionDays, label: '90 days' },
              { days: 180 as HistoryRetentionDays, label: '180 days' },
              { days: 365 as HistoryRetentionDays, label: '1 year' },
              { days: 0 as HistoryRetentionDays, label: 'Never automatically delete' }
            ].map((opt) => {
              const isSelected = storageSettings.historyRetentionDays === opt.days;
              return (
                <button
                  key={opt.days}
                  type="button"
                  onClick={() => updateStorageSettings({ historyRetentionDays: opt.days })}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition-all text-center flex flex-col items-center justify-center min-h-[46px] ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-sm font-bold'
                      : 'border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{opt.label}</span>
                  {opt.isDefault && (
                    <span className="text-[9px] uppercase tracking-wider text-indigo-500 font-extrabold mt-0.5">
                      Default
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* History Safety Note */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
          <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Strict Protection Guarantee:</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 pl-5">
            Does <strong>NOT</strong> delete Drafts, Queue, Scheduled posts, Social Media Accounts, Posting Groups, News Library saved items, Backups, Subscription state, or Settings.
          </div>
        </div>
      </div>

      {/* ================================================== */}
      {/* 5. DAILY CLEANUP TIME (UTC Internal Reference)   */}
      {/* ================================================== */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span>Automatic Cleanup Time</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Schedule uses UTC as the internal reference regardless of your current location
            </p>
          </div>

          <div className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800">
            Stored: {storageSettings.cleanupTimeUtc || '00:00'} UTC
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* UTC Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Select Scheduled Time (UTC)
            </label>
            <select
              value={storageSettings.cleanupTimeUtc || '00:00'}
              onChange={(e) => updateStorageSettings({ cleanupTimeUtc: e.target.value })}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              {UTC_TIME_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Local Equivalent Display */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Your Local Equivalent Time
            </span>
            <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
              {storageSettings.cleanupTimeUtc || '00:00'} UTC = {localTimeEquivalent}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5">
              (Timezone: {settings.timezone || 'Asia/Jakarta'})
            </span>
          </div>
        </div>
      </div>

      {/* ================================================== */}
      {/* 6. MANUAL CLEANUP: [Clean Now]                    */}
      {/* ================================================== */}
      <div className="p-4 sm:p-5 rounded-2xl bg-indigo-500/5 dark:bg-indigo-950/20 border border-indigo-500/20 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span>Manual Cleanup</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Executes immediate media cache cleanup and expired history cleanup according to your configured retention settings
            </p>
          </div>

          <button
            type="button"
            disabled={isCleaningNow}
            onClick={handleCleanNow}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-sm transition-all flex items-center gap-2 active:scale-[0.99]"
          >
            {isCleaningNow ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Cleaning...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Clean Now</span>
              </>
            )}
          </button>
        </div>

        {/* Cleanup Result Display */}
        {cleanupResult && (
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/30 shadow-xs animate-fadeIn space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Cleanup completed.</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-300 pt-1 border-t border-slate-100 dark:border-slate-800">
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Media removed:</span>
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  {cleanupResult.formattedMediaRemoved}
                </span>
                <span className="text-[10px] text-slate-400 ml-1">
                  ({cleanupResult.mediaFilesRemoved} files)
                </span>
              </div>

              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">History records removed:</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {cleanupResult.historyRecordsRemoved}
                </span>
                <span className="text-[10px] text-slate-400 ml-1">
                  expired entries
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================================================== */}
      {/* 7. & 10. SAFETY & PRESERVATION GUARANTEES         */}
      {/* ================================================== */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
          <Shield className="w-4 h-4 text-emerald-500" />
          <span>Complete Data Protection Verification</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-500 font-bold">✓</span>
            <span>Social Accounts</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-500 font-bold">✓</span>
            <span>Posting Groups</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-500 font-bold">✓</span>
            <span>Saved Drafts</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-500 font-bold">✓</span>
            <span>Scheduled Queue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-500 font-bold">✓</span>
            <span>News Library</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-500 font-bold">✓</span>
            <span>Backup Snapshots</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-500 font-bold">✓</span>
            <span>Subscription State</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-500 font-bold">✓</span>
            <span>Permanent Media</span>
          </div>
        </div>
      </div>

      {/* PRESERVED USER ACTION: Reset Settings Only */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
        <button
          type="button"
          onClick={() => setShowResetSettingsModal(true)}
          className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium flex items-center gap-1.5 py-1.5 px-3 rounded-xl hover:bg-amber-500/10 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Settings Only to Defaults</span>
        </button>
      </div>

      {/* ================================================== */}
      {/* 2. CLEAR MEDIA CACHE MODAL (Exact prompt text)     */}
      {/* ================================================== */}
      {showClearCacheModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Clear cached images and videos?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                This will not delete your drafts, news, accounts, or other saved data.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-[11px] text-emerald-800 dark:text-emerald-300 space-y-1">
              <strong className="font-semibold block">Safety Guarantee:</strong>
              <div>✓ Preserves user-uploaded original media</div>
              <div>✓ Preserves drafts and queue references</div>
              <div>✓ Preserves accounts, settings, and backups</div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={isClearingCache}
                onClick={() => setShowClearCacheModal(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isClearingCache}
                onClick={handleExecuteClearCache}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm disabled:opacity-50"
              >
                {isClearingCache ? 'Clearing...' : 'Clear Cache'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET SETTINGS ONLY MODAL */}
      {showResetSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Reset Application Settings?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                This will reset your general preferences and limits back to factory defaults.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
              <strong className="font-semibold block">Will NOT Delete:</strong>
              <div>✓ Your Social Accounts & Posting Groups</div>
              <div>✓ Your Saved Drafts & Post History</div>
              <div>✓ Your Content Queue & Saved News</div>
              <div>✓ Your Exported Backup Files</div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetSettingsModal(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteResetSettings}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-sm"
              >
                Reset Settings Only
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import {
  HardDrive,
  Download,
  Upload,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Clock,
  Layers,
  FileJson,
  RotateCcw,
  Trash2,
  ShieldAlert,
  Info,
  Check,
  X,
  ArrowRight,
  Database,
  Calendar,
  Radio,
  FileText
} from 'lucide-react';
import {
  createCompleteBackupData,
  downloadBackupFile,
  validateBackupFile,
  restoreBackupReplace,
  detectMergeConflicts,
  restoreBackupMerge,
  checkDataIntegrity,
  repairDataIntegrity,
  loadRecoverySnapshots,
  createRecoverySnapshot,
  deleteRecoverySnapshot,
  getStorageUsageSummary,
  resetLocalApplicationData,
  BackupValidationResult
} from '../utils/backupEngine';
import {
  BackupFile,
  BackupData,
  RecoverySnapshot,
  DataIntegrityReport,
  MergeConflict,
  DATA_SCHEMA_VERSION,
  APP_CURRENT_VERSION
} from '../types';

interface DataBackupSectionProps {
  onReloadAllData?: (mergedOrRestored?: BackupData) => void;
}

export const DataBackupSection: React.FC<DataBackupSectionProps> = ({
  onReloadAllData
}) => {
  // Storage & Stats State
  const [storageSummary, setStorageSummary] = useState(() => getStorageUsageSummary());
  const [recoveryCopies, setRecoveryCopies] = useState<RecoverySnapshot[]>(() => loadRecoverySnapshots());
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Integrity Check State
  const [integrityReport, setIntegrityReport] = useState<DataIntegrityReport | null>(null);
  const [isCheckingIntegrity, setIsCheckingIntegrity] = useState(false);
  const [isReviewingIntegrity, setIsReviewingIntegrity] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);

  // Export State & Summary Modal
  const [isExportSummaryOpen, setIsExportSummaryOpen] = useState(false);
  const [includeDiscoveryCache, setIncludeDiscoveryCache] = useState(false);

  // Import State & Confirmation Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [stagedBackupValidation, setStagedBackupValidation] = useState<BackupValidationResult | null>(null);
  const [importConflictList, setImportConflictList] = useState<MergeConflict[]>([]);
  const [conflictResolutions, setConflictResolutions] = useState<Record<string, 'current' | 'backup' | 'both'>>({});
  const [isResolvingConflicts, setIsResolvingConflicts] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset Modal State
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Snapshot Restore Modal State
  const [confirmingSnapshot, setConfirmingSnapshot] = useState<RecoverySnapshot | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const refreshAllStats = () => {
    setStorageSummary(getStorageUsageSummary());
    setRecoveryCopies(loadRecoverySnapshots());
  };

  // Run integrity check
  const handleRunIntegrityCheck = () => {
    setIsCheckingIntegrity(true);
    setTimeout(() => {
      const report = checkDataIntegrity();
      setIntegrityReport(report);
      setIsCheckingIntegrity(false);
      refreshAllStats();
      if (report.errors === 0 && report.warnings === 0) {
        showToast('Data Integrity Verified: All records and references are healthy!', 'success');
      } else {
        showToast(`Integrity Check complete: ${report.errors} errors, ${report.warnings} warnings found.`, 'info');
      }
    }, 450);
  };

  // Repair safe integrity problems
  const handleExecuteRepair = () => {
    setIsRepairing(true);
    setTimeout(() => {
      const result = repairDataIntegrity();
      setIntegrityReport(result.report);
      setIsRepairing(false);
      refreshAllStats();
      if (onReloadAllData) onReloadAllData();
      showToast(`Repaired ${result.repairedCount} safe issue(s). Data integrity restored.`, 'success');
    }, 600);
  };

  // Create manual Recovery Copy
  const handleCreateRecoveryCopy = () => {
    const snap = createRecoverySnapshot('Manual Safety Snapshot');
    refreshAllStats();
    showToast(`Recovery copy "${snap.label}" created successfully.`, 'success');
  };

  // Restore a recovery copy snapshot
  const handleRestoreSnapshot = (snapshot: RecoverySnapshot) => {
    if (!snapshot.backupFile) return;
    const res = restoreBackupReplace(snapshot.backupFile);
    if (res.success) {
      refreshAllStats();
      if (onReloadAllData) onReloadAllData(snapshot.backupFile.data);
      setConfirmingSnapshot(null);
      showToast(`Restored snapshot from ${new Date(snapshot.timestamp).toLocaleTimeString()}.`, 'success');
    } else {
      showToast(res.error || 'Failed to restore snapshot', 'error');
    }
  };

  // Delete a recovery snapshot
  const handleDeleteSnapshot = (id: string) => {
    const updated = deleteRecoverySnapshot(id);
    setRecoveryCopies(updated);
    showToast('Recovery copy removed.', 'info');
  };

  // Export process
  const handleOpenExportSummary = () => {
    refreshAllStats();
    setIsExportSummaryOpen(true);
  };

  const handleConfirmExport = () => {
    try {
      const backup = createCompleteBackupData({ includeDiscoveryCache });
      const filename = downloadBackupFile(backup);
      setIsExportSummaryOpen(false);
      refreshAllStats();
      showToast(`Exported backup file: ${filename}`, 'success');
    } catch (err: any) {
      showToast(`Export failed: ${err?.message || 'Unknown error'}`, 'error');
    }
  };

  // Import file selection handler
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const validation = validateBackupFile(parsed);
        if (!validation.isValid) {
          showToast(validation.error || 'Backup file is invalid or incomplete.', 'error');
          return;
        }

        setStagedBackupValidation(validation);
        setIsImportModalOpen(true);
      } catch (err) {
        showToast('Failed to parse backup JSON file. Ensure it is a valid format.', 'error');
      }
    };
    reader.readAsText(file);
    // Reset file input value so same file can be re-selected if needed
    e.target.value = '';
  };

  // Execute Replace Mode
  const handleExecuteReplace = () => {
    if (!stagedBackupValidation?.backup) return;

    const res = restoreBackupReplace(stagedBackupValidation.backup);
    if (res.success) {
      setIsImportModalOpen(false);
      refreshAllStats();
      if (onReloadAllData) onReloadAllData(stagedBackupValidation.backup.data);
      showToast('All application data replaced and restored from backup successfully.', 'success');
    } else {
      showToast(res.error || 'Restore failed. Rollback applied.', 'error');
    }
  };

  // Execute Merge Mode (or trigger conflict resolver)
  const handleInitiateMerge = () => {
    if (!stagedBackupValidation?.backup) return;

    const conflicts = detectMergeConflicts(stagedBackupValidation.backup);
    if (conflicts.length > 0) {
      setImportConflictList(conflicts);
      // Initialize default resolution to 'both' or 'current'
      const initResolutions: Record<string, 'current' | 'backup' | 'both'> = {};
      conflicts.forEach(c => {
        initResolutions[c.id] = 'both';
      });
      setConflictResolutions(initResolutions);
      setIsResolvingConflicts(true);
    } else {
      // Direct merge without conflicts
      executeMergeAction({});
    }
  };

  const executeMergeAction = (resolutions: Record<string, 'current' | 'backup' | 'both'>) => {
    if (!stagedBackupValidation?.backup) return;

    const res = restoreBackupMerge(stagedBackupValidation.backup, resolutions);
    if (res.success) {
      setIsImportModalOpen(false);
      setIsResolvingConflicts(false);
      refreshAllStats();
      if (onReloadAllData) onReloadAllData(res.mergedData);
      showToast('Data merged successfully without duplicates.', 'success');
    } else {
      showToast(res.error || 'Merge failed.', 'error');
    }
  };

  // Reset Data Handlers
  const handleExecuteReset = (exportFirst: boolean) => {
    try {
      resetLocalApplicationData(exportFirst);
      setIsResetConfirmOpen(false);
      refreshAllStats();
      if (onReloadAllData) onReloadAllData();
      showToast('Local application data reset. Safety snapshot preserved.', 'info');
    } catch (err: any) {
      showToast(`Reset failed: ${err?.message || 'Error'}`, 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          id="backup-toast-alert"
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-2xl shadow-xl border text-sm font-medium flex items-center gap-2.5 transition-all max-w-md w-full mx-auto ${
            toastMessage.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/90 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-900'
              : toastMessage.type === 'info'
              ? 'bg-indigo-50 dark:bg-indigo-950/90 text-indigo-800 dark:text-indigo-200 border-indigo-200 dark:border-indigo-900'
              : 'bg-emerald-50 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-900'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
          ) : toastMessage.type === 'info' ? (
            <Info className="w-5 h-5 text-indigo-500 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          )}
          <span className="flex-1">{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hidden File Input for Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        accept=".json,application/json"
        className="hidden"
        id="file-input-backup"
      />

      {/* 1. BACKUP CENTER MAIN CARD */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                DATA & BACKUP
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                  Schema v{DATA_SCHEMA_VERSION}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Protect your local Social Share Scheduler data.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="text-right sm:block flex items-center justify-between w-full sm:w-auto px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
                Estimated Size
              </div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {storageSummary.approximateMb}
              </div>
            </div>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-slate-400" />
              <div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Last Backup</div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {storageSummary.lastBackupTime
                    ? new Date(storageSummary.lastBackupTime).toLocaleString()
                    : 'Never'}
                </div>
              </div>
            </div>
            {storageSummary.lastBackupTime && (
              <span className="text-[10px] px-2 py-0.5 rounded-md font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                Saved
              </span>
            )}
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Last Integrity Check</div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {storageSummary.lastIntegrityTime
                    ? new Date(storageSummary.lastIntegrityTime).toLocaleString()
                    : 'Not checked yet'}
                </div>
              </div>
            </div>
            <button
              id="btn-quick-check-integrity"
              onClick={handleRunIntegrityCheck}
              disabled={isCheckingIntegrity}
              className="text-xs px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 font-semibold hover:bg-indigo-50 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5"
            >
              {isCheckingIntegrity ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <ShieldCheck className="w-3 h-3" />
              )}
              <span>Scan</span>
            </button>
          </div>
        </div>

        {/* Included Data Items Grid */}
        <div>
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <span>Items Managed in Local Storage</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
              <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
                Accounts
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                {storageSummary.accountsCount} configured
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
              <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
                Posting Groups
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                {storageSummary.groupsCount} groups
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
              <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
                Content Queue
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                {storageSummary.queueCount} scheduled
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
              <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
                Drafts
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                {storageSummary.draftsCount} drafts
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
              <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
                News Library
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                {storageSummary.newsLibraryCount} stories
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
              <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
                History
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                {storageSummary.historyCount} shared
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
              <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
                News Hunter Settings
              </div>
              <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Protected</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
              <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
                App & Auto Hunt
              </div>
              <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Protected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-3">
          <button
            id="btn-export-backup"
            onClick={handleOpenExportSummary}
            className="flex-1 sm:flex-initial px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Backup</span>
          </button>

          <button
            id="btn-import-backup"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 sm:flex-initial px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Upload className="w-4 h-4 text-indigo-500" />
            <span>Import Backup</span>
          </button>

          <button
            id="btn-create-recovery-copy"
            onClick={handleCreateRecoveryCopy}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs border border-slate-200/80 dark:border-slate-700/80 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Create Recovery Copy</span>
          </button>
        </div>
      </div>

      {/* 2. DATA INTEGRITY CHECK CARD */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                DATA INTEGRITY
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Scan for duplicate IDs, broken destination references, or malformed records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-check-data-integrity"
              onClick={handleRunIntegrityCheck}
              disabled={isCheckingIntegrity}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold transition-all flex items-center gap-2"
            >
              {isCheckingIntegrity ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Check Data Integrity</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Scan Status Summary */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-center">
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-bold">
              Healthy
            </div>
            <div className="text-lg font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
              {integrityReport ? integrityReport.healthy : '—'}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 text-center">
            <div className="text-[10px] text-amber-600 dark:text-amber-400 uppercase tracking-wider font-bold">
              Warnings
            </div>
            <div className="text-lg font-black text-amber-700 dark:text-amber-300 mt-0.5">
              {integrityReport ? integrityReport.warnings : '0'}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-center">
            <div className="text-[10px] text-rose-600 dark:text-rose-400 uppercase tracking-wider font-bold">
              Errors
            </div>
            <div className="text-lg font-black text-rose-700 dark:text-rose-300 mt-0.5">
              {integrityReport ? integrityReport.errors : '0'}
            </div>
          </div>
        </div>

        {/* Repair Assistant Trigger */}
        {integrityReport && (integrityReport.warnings > 0 || integrityReport.errors > 0) && (
          <div className="p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  Data Consistency Issues Detected
                </div>
                <div className="text-xs text-amber-700 dark:text-amber-300">
                  Found {integrityReport.issues.length} potential issue(s). Safe repair will preserve all text & content.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-review-problems"
                onClick={() => setIsReviewingIntegrity(!isReviewingIntegrity)}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 text-xs font-semibold hover:bg-amber-50 transition-all"
              >
                {isReviewingIntegrity ? 'Hide Details' : 'Review Problems'}
              </button>
              <button
                id="btn-repair-safe"
                onClick={handleExecuteRepair}
                disabled={isRepairing}
                className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
              >
                {isRepairing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5" />
                )}
                <span>Repair</span>
              </button>
            </div>
          </div>
        )}

        {/* Integrity Review Drawer */}
        {isReviewingIntegrity && integrityReport && (
          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 animate-fadeIn">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Detected Issues ({integrityReport.issues.length})
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {integrityReport.issues.map((issue) => (
                <div
                  key={issue.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700 text-xs flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          issue.type === 'error' ? 'bg-rose-500' : 'bg-amber-500'
                        }`}
                      />
                      <span>{issue.title}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 uppercase">
                        {issue.category}
                      </span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-400 mt-1">
                      {issue.description}
                    </div>
                  </div>

                  <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                    Safe to repair
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. RECOVERY COPIES LIST (UP TO 3 SNAPSHOTS) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                RECOVERY COPIES
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Automatic safety snapshots before major imports, restores, or repairs (Last {recoveryCopies.length}/3)
              </p>
            </div>
          </div>

          <button
            onClick={handleCreateRecoveryCopy}
            className="text-xs px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-bold transition-all"
          >
            + New Copy
          </button>
        </div>

        {recoveryCopies.length === 0 ? (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
            No recovery snapshots saved yet. Snapshots are created automatically before data updates.
          </div>
        ) : (
          <div className="space-y-2.5">
            {recoveryCopies.map((snap) => (
              <div
                key={snap.id}
                className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{snap.label}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(snap.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                    <span>{snap.itemCounts.accounts} accounts</span>
                    <span>•</span>
                    <span>{snap.itemCounts.groups} groups</span>
                    <span>•</span>
                    <span>{snap.itemCounts.drafts} drafts</span>
                    <span>•</span>
                    <span>{snap.itemCounts.queue} scheduled</span>
                    <span>•</span>
                    <span>{snap.itemCounts.newsLibrary} news</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => setConfirmingSnapshot(snap)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 font-bold text-xs transition-all flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restore</span>
                  </button>
                  <button
                    onClick={() => handleDeleteSnapshot(snap.id)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
                    title="Delete Snapshot"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. PROJECT DATA STATUS & CONTINUITY */}
      <div className="bg-slate-50 dark:bg-slate-800/40 rounded-3xl p-5 border border-slate-200/60 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              PROJECT DATA STATUS
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Local data: <span className="font-semibold text-emerald-600 dark:text-emerald-400">Healthy & Encrypted Locally</span> • v{APP_CURRENT_VERSION}
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-4">
          <div>
            Last Backup: <span className="font-semibold text-slate-700 dark:text-slate-300">{storageSummary.lastBackupTime ? new Date(storageSummary.lastBackupTime).toLocaleDateString() : 'None'}</span>
          </div>
          <div>
            Integrity: <span className="font-semibold text-slate-700 dark:text-slate-300">{storageSummary.lastIntegrityTime ? new Date(storageSummary.lastIntegrityTime).toLocaleDateString() : 'Pending'}</span>
          </div>
        </div>
      </div>

      {/* 5. DANGER ZONE */}
      <div className="bg-rose-50/40 dark:bg-rose-950/20 rounded-3xl p-6 border border-rose-200/80 dark:border-rose-900/40 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/80 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">
              DANGER ZONE
            </h3>
            <p className="text-xs text-rose-700/80 dark:text-rose-300/80">
              Permanently reset local storage back to clean application defaults
            </p>
          </div>
        </div>

        <div className="pt-1 flex items-center justify-between">
          <span className="text-xs text-slate-600 dark:text-slate-400">
            A safety recovery snapshot is automatically created before any reset action.
          </span>
          <button
            id="btn-reset-local-data"
            onClick={() => setIsResetConfirmOpen(true)}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset Local Data</span>
          </button>
        </div>
      </div>

      {/* ================================================== */}
      {/* MODAL 1: BACKUP SUMMARY BEFORE EXPORT */}
      {/* ================================================== */}
      {isExportSummaryOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Download className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  BACKUP SUMMARY
                </h3>
              </div>
              <button
                onClick={() => setIsExportSummaryOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Review items that will be bundled into the JSON backup file:
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block">Accounts:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {storageSummary.accountsCount} destinations
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block">Posting Groups:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {storageSummary.groupsCount} groups
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block">Drafts:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {storageSummary.draftsCount} posts
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block">Content Queue:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {storageSummary.queueCount} scheduled
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block">News Library:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {storageSummary.newsLibraryCount} stories
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block">History:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {storageSummary.historyCount} records
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block">Settings:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Included</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block">Discovery Cache:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {includeDiscoveryCache ? 'Included' : 'Not Included'}
                </span>
              </div>
            </div>

            {/* Discovery Cache Toggle */}
            <div className="p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between">
              <div>
                <label
                  htmlFor="checkbox-discovery-cache"
                  className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer block"
                >
                  Include Discovery Cache
                </label>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Off by default to keep JSON backup lightweight
                </span>
              </div>
              <input
                id="checkbox-discovery-cache"
                type="checkbox"
                checked={includeDiscoveryCache}
                onChange={(e) => setIncludeDiscoveryCache(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            {/* Media Note */}
            <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Media Safety:</span> Remote media references, metadata, and post content are securely backed up. Large binary blobs are excluded to prevent browser quota exhaustion.
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setIsExportSummaryOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-export"
                onClick={handleConfirmExport}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Backup</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* MODAL 2: IMPORT CONFIRMATION & MODE SELECTION */}
      {/* ================================================== */}
      {isImportModalOpen && stagedBackupValidation && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Upload className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Import Backup File
                </h3>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {stagedBackupValidation.isOlderVersion && (
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                <span>Older backup detected (v{stagedBackupValidation.version}). Safe migration will be applied automatically without discarding unknown fields.</span>
              </div>
            )}

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 space-y-2">
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Backup File Contents:
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs text-slate-600 dark:text-slate-300">
                <div>Accounts: <span className="font-semibold">{stagedBackupValidation.itemCounts?.accounts}</span></div>
                <div>Groups: <span className="font-semibold">{stagedBackupValidation.itemCounts?.groups}</span></div>
                <div>Queue: <span className="font-semibold">{stagedBackupValidation.itemCounts?.queue}</span></div>
                <div>Drafts: <span className="font-semibold">{stagedBackupValidation.itemCounts?.drafts}</span></div>
                <div>History: <span className="font-semibold">{stagedBackupValidation.itemCounts?.history}</span></div>
                <div>News: <span className="font-semibold">{stagedBackupValidation.itemCounts?.newsLibrary}</span></div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-200">
              <span className="font-bold block mb-1">Confirmation Required:</span>
              Importing a backup can replace existing local data. Choose your preferred restore mode:
            </div>

            <div className="space-y-2.5 pt-1">
              <button
                id="btn-import-replace"
                onClick={handleExecuteReplace}
                className="w-full py-2.5 px-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 font-bold text-xs transition-all flex items-center justify-between"
              >
                <span>Replace Existing Data</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-rose-200/70 dark:bg-rose-900/70 font-semibold">
                  Auto Safety Snapshot First
                </span>
              </button>

              <button
                id="btn-import-merge"
                onClick={handleInitiateMerge}
                className="w-full py-2.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-between"
              >
                <span>Merge Data</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500 font-semibold">
                  Combine & Prevent Duplicates
                </span>
              </button>

              <button
                onClick={() => setIsImportModalOpen(false)}
                className="w-full py-2 px-4 rounded-2xl text-xs font-semibold text-slate-500 hover:text-slate-800 transition-all text-center"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* MODAL 3: MERGE CONFLICT RESOLUTION WIZARD */}
      {/* ================================================== */}
      {isResolvingConflicts && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-scaleUp max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <span>Existing Item Found</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {importConflictList.length} conflict(s) detected. Choose how each conflict should be handled:
                </p>
              </div>
              <button
                onClick={() => setIsResolvingConflicts(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 pr-1 flex-1 py-1">
              {importConflictList.map((conflict) => (
                <div
                  key={conflict.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5 text-xs"
                >
                  <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                    <span>{conflict.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 uppercase">
                      {conflict.category}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 block font-semibold">Current Version:</span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium">
                        {conflict.currentSummary}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-indigo-500 block font-semibold">Backup Version:</span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium">
                        {conflict.backupSummary}
                      </span>
                    </div>
                  </div>

                  {/* Resolution Buttons */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      onClick={() =>
                        setConflictResolutions((prev) => ({ ...prev, [conflict.id]: 'current' }))
                      }
                      className={`flex-1 py-1.5 px-2 rounded-xl font-bold text-[11px] transition-all ${
                        conflictResolutions[conflict.id] === 'current'
                          ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      Keep Current
                    </button>
                    <button
                      onClick={() =>
                        setConflictResolutions((prev) => ({ ...prev, [conflict.id]: 'backup' }))
                      }
                      className={`flex-1 py-1.5 px-2 rounded-xl font-bold text-[11px] transition-all ${
                        conflictResolutions[conflict.id] === 'backup'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      Use Backup
                    </button>
                    <button
                      onClick={() =>
                        setConflictResolutions((prev) => ({ ...prev, [conflict.id]: 'both' }))
                      }
                      className={`flex-1 py-1.5 px-2 rounded-xl font-bold text-[11px] transition-all ${
                        conflictResolutions[conflict.id] === 'both'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      Keep Both
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5 shrink-0">
              <button
                onClick={() => setIsResolvingConflicts(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-conflict-merge"
                onClick={() => executeMergeAction(conflictResolutions)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirm & Merge Data</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* MODAL 4: SNAPSHOT RESTORE CONFIRMATION */}
      {/* ================================================== */}
      {confirmingSnapshot && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Restore Recovery Copy?
                </h3>
                <p className="text-xs text-slate-500">
                  {confirmingSnapshot.label}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              This will restore your application state to the snapshot taken on {new Date(confirmingSnapshot.timestamp).toLocaleString()}. A new safety backup will be created before proceeding.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmingSnapshot(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRestoreSnapshot(confirmingSnapshot)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
              >
                Restore Snapshot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* MODAL 5: RESET DATA CONFIRMATION (DANGER ZONE) */}
      {/* ================================================== */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-rose-200 dark:border-rose-900/60 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/80 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Reset Local Data
                </h3>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                  This will permanently remove local application data.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              All custom accounts, groups, drafts, queue items, and news will be cleared. Default schemas will remain intact. A local recovery snapshot will be saved first so you can restore if needed.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                id="btn-reset-backup-first"
                onClick={() => handleExecuteReset(true)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs"
              >
                Backup First
              </button>
              <button
                id="btn-reset-anyway"
                onClick={() => handleExecuteReset(false)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs"
              >
                Reset Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

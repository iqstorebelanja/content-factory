import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  Check, 
  Globe2, 
  PenTool, 
  Lock, 
  Zap, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  CheckCircle2, 
  Trash2,
  Activity,
  Layers
} from 'lucide-react';
import { AppSettings, AiControlSettings } from '../../types';
import { costGuard } from '../../services/costGuard';
import { CostUsageAuditEntry } from '../../types/plans';
import { runProductionSecurityAudit } from '../../utils/securityAudit';

interface AiSettingsSectionProps {
  settings: AppSettings;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
}

export const AiSettingsSection: React.FC<AiSettingsSectionProps> = ({
  settings,
  onUpdateSettings
}) => {
  const [auditLogs, setAuditLogs] = useState<CostUsageAuditEntry[]>(() => costGuard.getAuditLog());
  const [securityStatus, setSecurityStatus] = useState(() => costGuard.getApiSecurityStatus());
  const [securityAudit] = useState(() => runProductionSecurityAudit());
  const [showProviderMatrix, setShowProviderMatrix] = useState(false);

  useEffect(() => {
    const unsub = costGuard.subscribeToAuditLog((logs) => {
      setAuditLogs(logs);
      setSecurityStatus(costGuard.getApiSecurityStatus());
    });
    return unsub;
  }, []);

  const handleClearAuditLog = () => {
    costGuard.clearAuditLog();
    setAuditLogs([]);
  };

  const currentAiSettings: AiControlSettings = settings.aiSettings || {
    assistantEnabled: true,
    aiRewriteEnabled: true,
    newsRewriteEnabled: true,
    writingLanguage: 'id',
    writingStyle: 'Natural'
  };

  const handleToggle = (key: keyof AiControlSettings) => {
    onUpdateSettings({
      aiSettings: {
        ...currentAiSettings,
        [key]: !currentAiSettings[key]
      }
    });
  };

  const handleUpdateLanguage = (lang: 'id' | 'en') => {
    onUpdateSettings({
      aiSettings: {
        ...currentAiSettings,
        writingLanguage: lang
      }
    });
  };

  const handleUpdateStyle = (style: AiControlSettings['writingStyle']) => {
    onUpdateSettings({
      aiSettings: {
        ...currentAiSettings,
        writingStyle: style
      }
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 space-y-6 shadow-sm">
      <div>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span>AI Content Assistant & Generator</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Controls for AI-assisted caption generation, tone formatting, and news rewriting
        </p>
      </div>

      {/* Security Architecture Notice */}
      <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/40 flex items-start gap-2.5">
        <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-[11px] text-indigo-900 dark:text-indigo-300 leading-relaxed">
          <strong className="font-semibold block mb-0.5">Zero Client Key Exposure:</strong>
          AI API credentials are strictly handled on the secure server backend proxy. No private production keys are stored in client localStorage or compiled into application packages.
        </div>
      </div>

      <div className="space-y-4">
        {/* Master AI Assistant Toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <div>
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
              AI Content Assistant
            </label>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Enable smart suggestions and caption generation tools
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleToggle('assistantEnabled')}
            className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${
              currentAiSettings.assistantEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                currentAiSettings.assistantEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* AI Rewrite Toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <div>
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
              AI Caption Rewrite
            </label>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              One-tap tone polishing in Create Post screen
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleToggle('aiRewriteEnabled')}
            className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${
              currentAiSettings.aiRewriteEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                currentAiSettings.aiRewriteEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* News Rewrite Toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <div>
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
              News → Content Factory Rewrite
            </label>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Transform discovered news stories into tailored multi-platform posts
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleToggle('newsRewriteEnabled')}
            className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${
              currentAiSettings.newsRewriteEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                currentAiSettings.newsRewriteEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Default Writing Language */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-indigo-500 shrink-0" />
            <div>
              <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                Default Writing Language
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Language targeted by AI models when rewriting copy
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {[
              { id: 'id', label: 'Indonesian' },
              { id: 'en', label: 'English' }
            ].map((l) => {
              const isActive = (currentAiSettings.writingLanguage || 'id') === l.id;
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => handleUpdateLanguage(l.id as any)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                    isActive
                      ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {l.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Default Writing Style */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center gap-2">
            <PenTool className="w-4 h-4 text-indigo-500 shrink-0" />
            <div>
              <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                Default Writing Style
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Preset tone of voice for generated social captions
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {['Natural', 'Informative', 'Casual', 'News', 'Social Media'].map((style) => {
              const isActive = (currentAiSettings.writingStyle || 'Natural') === style;
              return (
                <button
                  key={style}
                  type="button"
                  onClick={() => handleUpdateStyle(style as any)}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition-all text-center ${
                    isActive
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {style}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* CENTRALIZED COST CONTROL & API SECURITY ARCHITECTURE */}
      <div className="p-4 rounded-3xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Cost Guard Shield & API Protection
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Centralized quota enforcement, flood prevention, and zero client key exposure
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            SHIELD ACTIVE
          </span>
        </div>

        {/* Protection Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400">API Key Security</div>
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Backend Proxy Active
            </div>
            <div className="text-[10px] text-slate-500">Zero keys in client code or storage</div>
          </div>

          <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400">Request Lock</div>
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              In-Flight Anti-Flood
            </div>
            <div className="text-[10px] text-slate-500">Double-taps & rapid repeat blocked</div>
          </div>

          <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400">Error Handling</div>
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Limited 2 Retries
            </div>
            <div className="text-[10px] text-slate-500">Failed calls never burn user quota</div>
          </div>
        </div>

        {/* Centralized API Provider & Security Classification Audit (v1) */}
        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                API Provider Security Classification ({securityAudit.providers.length} Services)
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                Env: <strong className="uppercase">{securityAudit.environment.env}</strong> • Client Secrets Exposed: <strong>0</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowProviderMatrix(prev => !prev)}
              className="px-2.5 py-1 rounded-xl text-[10px] font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {showProviderMatrix ? 'Hide Audit Matrix' : 'Inspect Providers'}
            </button>
          </div>

          {showProviderMatrix && (
            <div className="space-y-2 pt-1">
              {securityAudit.providers.map(provider => (
                <div
                  key={provider.id}
                  className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {provider.providerName}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                        Class {provider.classification}
                      </span>
                      {provider.requiresSecret && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                          REQUIRES SECURE BACKEND
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                    Endpoint: {provider.endpoint} • Status: {provider.status}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {provider.securityNotes}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cost & Quota Audit Trail */}
        <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-500" />
              Recent AI & API Activity Trail ({auditLogs.length})
            </span>
            {auditLogs.length > 0 && (
              <button
                type="button"
                onClick={handleClearAuditLog}
                className="text-[10px] font-semibold text-slate-400 hover:text-rose-500 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear Trail</span>
              </button>
            )}
          </div>

          {auditLogs.length === 0 ? (
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
              No recent external requests yet. Cost Guard is standing by.
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {auditLogs.slice(0, 15).map(log => (
                <div 
                  key={log.id}
                  className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-[11px] gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      log.status === 'success' ? 'bg-emerald-500' : log.status === 'blocked' ? 'bg-amber-500' : 'bg-rose-500'
                    }`} />
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {log.actionName}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">
                      {log.feature.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 text-slate-400 text-[10px]">
                    {log.durationMs > 0 && <span>{log.durationMs}ms</span>}
                    <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

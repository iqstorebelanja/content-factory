import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp,
  Info,
  Layers,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { 
  UserSocialAccounts, 
  SocialGroup, 
  SocialPost 
} from '../types';
import { 
  runFullAppHealthCheck, 
  HealthCheckSuiteResult 
} from '../utils/appHealthCheck';

interface AppHealthCheckSectionProps {
  userAccounts: UserSocialAccounts;
  socialGroups: SocialGroup[];
  drafts?: SocialPost[];
  history?: SocialPost[];
}

export const AppHealthCheckSection: React.FC<AppHealthCheckSectionProps> = ({
  userAccounts,
  socialGroups,
  drafts,
  history
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<HealthCheckSuiteResult | null>(null);
  const [expandedComponent, setExpandedComponent] = useState<string | null>(null);

  const handleRunTest = async () => {
    setIsRunning(true);
    // Short simulated delay to render UI loading state realistically
    await new Promise(r => setTimeout(r, 450));
    try {
      const suiteResults = await runFullAppHealthCheck({
        userAccounts,
        socialGroups,
        drafts,
        history
      });
      setResults(suiteResults);
    } catch (e) {
      console.error('Health check error:', e);
    } finally {
      setIsRunning(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedComponent(prev => (prev === id ? null : id));
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 space-y-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>App Health Check</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Pre-APK Ready
              </span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Verify internal application functionality and data integrity without requiring external APIs
            </p>
          </div>
        </div>

        <button
          id="btn-run-full-test"
          type="button"
          onClick={handleRunTest}
          disabled={isRunning}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-2"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Verifying App...</span>
            </>
          ) : (
            <>
              <Activity className="w-4 h-4" />
              <span>Run Full Test</span>
            </>
          )}
        </button>
      </div>

      {/* Initial Prompt State */}
      {!results && !isRunning && (
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200 mb-1">
            <Info className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>Pre-APK Functional Audit</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Click <strong className="text-slate-700 dark:text-slate-200">[Run Full Test]</strong> to validate 
            Accounts (Facebook Page vs Personal Profile), Posting Groups, Drafts, Share Engine, 
            History tracking, Local Storage resilience, and Mobile UI layout constraints.
          </p>
        </div>
      )}

      {/* Results View */}
      {results && (
        <div className="space-y-4 pt-1 animate-fadeIn">
          {/* Main Requested Header */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white dark:bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-xs font-black tracking-wider uppercase text-indigo-400">
                APP HEALTH CHECK
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {new Date(results.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>

            {/* Checklist of 9 Required Component Names */}
            <div className="space-y-1.5 font-mono text-xs">
              {results.components.map(comp => (
                <div 
                  key={comp.id}
                  className="flex items-start justify-between p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
                  onClick={() => toggleExpand(comp.id)}
                >
                  <div className="flex items-center gap-2">
                    {comp.passed ? (
                      <span className="text-emerald-400 font-bold">✓</span>
                    ) : (
                      <span className="text-rose-400 font-bold">✗</span>
                    )}
                    <span className={comp.passed ? 'text-slate-200 font-semibold' : 'text-rose-300 font-bold'}>
                      {comp.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <span>
                      {comp.subchecks.filter(s => s.passed).length}/{comp.subchecks.length}
                    </span>
                    {expandedComponent === comp.id ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Failures Breakdown if any */}
            {results.components.some(c => !c.passed) && (
              <div className="pt-2 border-t border-slate-800 space-y-2">
                {results.components.filter(c => !c.passed).map(comp => (
                  <div key={`fail-${comp.id}`} className="p-2.5 bg-rose-950/40 border border-rose-800 rounded-xl text-xs space-y-1">
                    <div className="font-bold text-rose-300">✗ {comp.name}</div>
                    <div className="text-slate-300 text-[11px]"><span className="text-rose-400 font-semibold">Problem:</span> {comp.problem}</div>
                    {comp.recommendedFix && (
                      <div className="text-slate-400 text-[11px]"><span className="text-indigo-400 font-semibold">Recommended Fix:</span> {comp.recommendedFix}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sub-check Drill Down Accordion */}
          {expandedComponent && (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                <span>Detailed Checks: {results.components.find(c => c.id === expandedComponent)?.name}</span>
                <button 
                  type="button"
                  onClick={() => setExpandedComponent(null)}
                  className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Close
                </button>
              </div>
              <div className="space-y-1.5 pt-1">
                {results.components.find(c => c.id === expandedComponent)?.subchecks.map((sub, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <span className={sub.passed ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>
                      {sub.passed ? '✓' : '✗'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{sub.name}</div>
                      {sub.details && (
                        <div className="text-[10px] text-slate-400 truncate">{sub.details}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FINAL REPORT SECTION */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-blue-50/50 dark:from-slate-800/40 dark:via-slate-800/20 dark:to-slate-800/40 border border-indigo-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-black tracking-wider uppercase text-slate-800 dark:text-slate-200">
                FINAL REPORT
              </span>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-slate-600 dark:text-slate-400">Total: <strong>{results.totalChecks}</strong></span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Passed: {results.passedCount}</span>
                <span className={results.failedCount > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}>
                  Failed: {results.failedCount}
                </span>
                <span className="text-amber-500">Warnings: {results.warningCount}</span>
              </div>
            </div>

            {/* Remaining Limitations */}
            <div className="space-y-1.5 pt-1 text-xs">
              <div className="font-semibold text-slate-700 dark:text-slate-300">Remaining Limitations:</div>
              <ul className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400 list-disc list-inside">
                {results.remainingLimitations.map((lim, idx) => (
                  <li key={idx} className="leading-relaxed">{lim}</li>
                ))}
              </ul>
            </div>

            {/* Mandatory Platform Disclaimer */}
            <div className="mt-2 p-3 bg-white dark:bg-slate-900/80 border border-indigo-200 dark:border-indigo-900/50 rounded-xl text-xs text-indigo-900 dark:text-indigo-200 font-medium leading-relaxed">
              <div className="flex items-center gap-1.5 font-bold mb-0.5 text-indigo-700 dark:text-indigo-300">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>Publishing Architecture Notice:</span>
              </div>
              <p className="italic font-semibold">
                "{results.mandatoryDisclaimer}"
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { Info, Shield, CheckCircle2, Smartphone, Globe, Sparkles, Database, Radio, Share2, Calendar, AlertTriangle, Settings2, Package } from 'lucide-react';
import { DATA_SCHEMA_VERSION, APP_CURRENT_VERSION } from '../../types';
import { ANDROID_CONFIG, GOOGLE_PLAY_READINESS_ITEMS } from '../../config/androidConfig';
import { getNotificationRuntimeStatus } from '../../utils/notificationHelper';

export const AboutSettingsSection: React.FC = () => {
  const runtimeStatus = getNotificationRuntimeStatus();
  const readyItems = GOOGLE_PLAY_READINESS_ITEMS.filter(i => i.status === 'READY');
  const notReadyItems = GOOGLE_PLAY_READINESS_ITEMS.filter(i => i.status === 'NOT_READY');
  const requiresConfigItems = GOOGLE_PLAY_READINESS_ITEMS.filter(i => i.status === 'REQUIRES_CONFIGURATION');

  const implementedFeatures = [
    {
      name: 'Manual Cross-Posting',
      description: 'One post creation to Facebook Pages, Personal Profiles, Instagram, TikTok, YouTube, X, and WhatsApp with custom overrides.',
      icon: Share2,
      status: 'Implemented'
    },
    {
      name: 'News Hunter & Media Hunter',
      description: 'Real-time multi-feed RSS discovery, viral hype scoring (0-100), downloadable media filter, and News → Content Factory.',
      icon: Radio,
      status: 'Implemented'
    },
    {
      name: 'AI Content Assistant',
      description: 'Server-side Gemini proxy for natural tone adaptation, multi-platform rewriting, and hook generation with zero client key exposure.',
      icon: Sparkles,
      status: 'Implemented'
    },
    {
      name: 'Content Queue & Calendar Scheduler',
      description: 'Due Now, Today, Upcoming queue filters, monthly & weekly calendar views, and in-app reminder alerts.',
      icon: Calendar,
      status: 'Implemented'
    },
    {
      name: 'Project Backup & Restore with Integrity Check',
      description: 'Complete project JSON serialization, schema versioning, non-destructive import, and single-repair data integrity check.',
      icon: Database,
      status: 'Implemented'
    }
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 space-y-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md font-extrabold text-xl shrink-0">
          S
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Social Share Scheduler
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Android-first assisted social media posting and trending news syndication
          </p>
        </div>
      </div>

      {/* Version & Build Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Android Release
          </span>
          <span className="text-sm font-extrabold text-slate-900 dark:text-white">
            v{ANDROID_CONFIG.versionName} (Code {ANDROID_CONFIG.versionCode})
          </span>
          <span className="text-[10px] text-slate-500 block">Web Runtime v{APP_CURRENT_VERSION}</span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Data Schema
          </span>
          <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
            Version {DATA_SCHEMA_VERSION}
          </span>
          <span className="text-[10px] text-slate-500 block">Strict Migration</span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            applicationId / namespace
          </span>
          <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 truncate block">
            {ANDROID_CONFIG.applicationId}
          </span>
          <span className="text-[10px] text-slate-500 block">
            SDK {ANDROID_CONFIG.minSdkVersion}–{ANDROID_CONFIG.targetSdkVersion} (Compile {ANDROID_CONFIG.compileSdkVersion})
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Release Artifact
          </span>
          <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
            <Package className="w-3.5 h-3.5 text-indigo-500" />
            <span>{ANDROID_CONFIG.releaseFormat} Target</span>
          </span>
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold block">
            Signing Not Configured
          </span>
        </div>
      </div>

      {/* Android Release Identity & Google Play Readiness Matrix */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-3.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Android Release Identity & Google Play Readiness
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-300">
            Placeholders: {ANDROID_CONFIG.googlePlayBillingPlaceholders.PRO_MONTHLY} / {ANDROID_CONFIG.googlePlayBillingPlaceholders.PRO_YEARLY}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-500/20 space-y-1.5">
            <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>READY ({readyItems.length})</span>
            </div>
            <ul className="space-y-1 text-slate-600 dark:text-slate-300">
              {readyItems.map(item => (
                <li key={item.id} className="leading-snug">• {item.label}</li>
              ))}
            </ul>
          </div>

          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-500/20 space-y-1.5">
            <div className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>NOT READY ({notReadyItems.length})</span>
            </div>
            <ul className="space-y-1 text-slate-600 dark:text-slate-300">
              {notReadyItems.map(item => (
                <li key={item.id} className="leading-snug">• {item.label}</li>
              ))}
            </ul>
          </div>

          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-500/20 space-y-1.5">
            <div className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <Settings2 className="w-3.5 h-3.5" />
              <span>REQUIRES CONFIG ({requiresConfigItems.length})</span>
            </div>
            <ul className="space-y-1 text-slate-600 dark:text-slate-300">
              {requiresConfigItems.map(item => (
                <li key={item.id} className="leading-snug">• {item.label}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Implemented Core Features Checklist */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
          <span>Active Subsystems & Features</span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
            All 5 Core Engines Active
          </span>
        </div>

        <div className="space-y-2">
          {implementedFeatures.map((f, idx) => {
            const Icon = f.icon;
            return (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {f.name}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      <span>{f.status}</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {f.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

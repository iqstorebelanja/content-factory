import React from 'react';
import { 
  Share2, 
  PlusCircle, 
  FileText, 
  Clock, 
  Settings as SettingsIcon,
  Sparkles,
  Layers,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  HardDrive,
  Radio,
  ArrowRight,
  CalendarClock
} from 'lucide-react';
import { SocialPost, PlatformId, NavigationTab } from '../types';
import { PLATFORMS } from '../data/platforms';

interface HomeProps {
  onCreatePost: () => void;
  onSelectTab: (tab: NavigationTab) => void;
  onOpenDriveModal: () => void;
  history: SocialPost[];
  drafts: SocialPost[];
  queueCount?: number;
  isDriveConnected: boolean;
  driveUserEmail?: string;
  isExpoGoMode: boolean;
}

export const HomeScreen: React.FC<HomeProps> = ({
  onCreatePost,
  onSelectTab,
  onOpenDriveModal,
  history,
  drafts,
  queueCount = 0,
  isDriveConnected,
  driveUserEmail,
  isExpoGoMode
}) => {
  const publishedCount = history.filter(h => 
    Object.values(h.platformStatuses).some((s: any) => s?.status === 'PUBLISHED' || s?.status === 'SHARED')
  ).length;

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Expo Go Status Pill Banner */}
      {isExpoGoMode && (
        <div id="expo-go-banner" className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start gap-3 text-amber-800 dark:text-amber-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
          <div className="leading-relaxed">
            <span className="font-semibold">Expo Go Compatibility Mode:</span> Push notifications require a development build. All local scheduling & manual sharing actions are active and ready.
          </div>
        </div>
      )}

      {/* Main Header / Android Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-white/10 rounded-full text-xs font-medium backdrop-blur-md">
                Android MVP v1.0
              </span>
              {isDriveConnected && (
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-medium flex items-center gap-1">
                  <HardDrive className="w-3 h-3" /> Drive Synced
                </span>
              )}
            </div>
            <span className="text-xs text-slate-400">Asia/Jakarta (GMT+7)</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">Social Share Scheduler</h1>
            <p className="text-slate-300 text-sm mt-1">
              Create ONE post, preview each network, and manually cross-post to Facebook Page, Instagram, TikTok, YouTube, X, and WhatsApp.
            </p>
          </div>

          {/* Primary Action Button */}
          <button
            id="btn-create-post-hero"
            onClick={onCreatePost}
            className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] transition-all text-white font-semibold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2.5 shadow-lg shadow-indigo-600/30 text-base"
          >
            <PlusCircle className="w-5 h-5" />
            CREATE POST
          </button>
        </div>

        {/* Decorative subtle background circle */}
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* News Hunter Discovery Quick Banner */}
      <div 
        id="btn-news-hunter-home-banner"
        onClick={() => onSelectTab('news')}
        className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/30 rounded-3xl p-4 cursor-pointer hover:border-indigo-500/60 transition-all flex items-center justify-between gap-3 shadow-xs active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shrink-0">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>News Hunter Discovery</span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                LIVE DISCOVERY
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
              Hunt RSS & web news, cluster duplicates, hype score, and rewrite for all platforms
            </p>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
      </div>

      {/* Quick Metrics & Integrations (4 Columns) */}
      <div className="grid grid-cols-4 gap-2">
        <div 
          onClick={() => onSelectTab('history')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 cursor-pointer hover:border-indigo-500/40 transition-colors text-center"
        >
          <div className="flex items-center justify-center gap-1 text-slate-500 dark:text-slate-400 text-[11px] font-medium mb-0.5">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <span>Shared</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {publishedCount}
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5 truncate">History</div>
        </div>

        <div 
          onClick={() => onSelectTab('queue')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 cursor-pointer hover:border-indigo-500/40 transition-colors text-center"
        >
          <div className="flex items-center justify-center gap-1 text-slate-500 dark:text-slate-400 text-[11px] font-medium mb-0.5">
            <CalendarClock className="w-3 h-3 text-indigo-500" />
            <span>Queue</span>
          </div>
          <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
            {queueCount}
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5 truncate">Scheduled</div>
        </div>

        <div 
          onClick={() => onSelectTab('drafts')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 cursor-pointer hover:border-indigo-500/40 transition-colors text-center"
        >
          <div className="flex items-center justify-center gap-1 text-slate-500 dark:text-slate-400 text-[11px] font-medium mb-0.5">
            <FileText className="w-3 h-3 text-amber-500" />
            <span>Drafts</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {drafts.length}
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5 truncate">Saved</div>
        </div>

        <div 
          onClick={onOpenDriveModal}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 cursor-pointer hover:border-indigo-500/40 transition-colors text-center"
        >
          <div className="flex items-center justify-center gap-1 text-slate-500 dark:text-slate-400 text-[11px] font-medium mb-0.5">
            <HardDrive className="w-3 h-3 text-blue-500" />
            <span>Drive</span>
          </div>
          <div className="text-xs font-semibold text-slate-900 dark:text-white truncate mt-1">
            {isDriveConnected ? 'Synced' : 'Connect'}
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5 truncate">
            {isDriveConnected ? 'Active' : 'Google Drive'}
          </div>
        </div>
      </div>


      {/* Supported Platforms Rail */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
            Target Platforms (6 Supported)
          </h2>
          <button 
            onClick={() => onSelectTab('settings')}
            className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
          >
            Manage Accounts
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {(['facebook_page', 'instagram', 'tiktok', 'youtube', 'twitter', 'whatsapp'] as PlatformId[]).map(pId => {
            const platform = PLATFORMS[pId];
            if (!platform) return null;
            return (
              <div 
                key={platform.id}
                className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-3"
              >
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
                  style={{ backgroundColor: platform.accentColor }}
                >
                  {platform.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {platform.name}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {platform.badge}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity or Next Step */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
            Recent Shares
          </h2>
          <button 
            onClick={() => onSelectTab('history')}
            className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
          >
            View All
          </button>
        </div>

        {history.length === 0 ? (
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center space-y-2">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              No posts shared yet
            </p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Tap "CREATE POST" to craft your first update and cross-post to Facebook, Instagram, YouTube, TikTok, and X.
            </p>
            <button
              onClick={onCreatePost}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800/40"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Start First Post
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {history.slice(0, 3).map(item => (
              <div 
                key={item.id}
                onClick={() => onSelectTab('history')}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 flex items-center justify-between cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {item.media?.url ? (
                    <img 
                      src={item.media.url} 
                      alt="" 
                      className="w-12 h-12 rounded-lg object-cover bg-slate-100 dark:bg-slate-800 shrink-0" 
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {item.title || item.caption || 'Untitled Post'}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{item.selectedPlatforms.length} platforms</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

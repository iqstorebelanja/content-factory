import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  Trash2, 
  Share2, 
  ExternalLink, 
  Calendar, 
  Clock, 
  AlertCircle,
  FileText,
  Layers,
  Sparkles,
  Newspaper,
  Copy,
  Search,
  Filter
} from 'lucide-react';
import { SocialPost, UserSocialAccounts, SocialGroup } from '../types';
import { PLATFORMS } from '../data/platforms';
import { getAllDestinations, normalizeUserAccounts } from '../utils/socialAccounts';

export type HistoryFilterType = 'all' | 'completed' | 'partial' | 'failed' | 'draft_sourced';

interface HistoryScreenProps {
  history: SocialPost[];
  onReShare: (post: SocialPost) => void;
  onDelete: (id: string) => void;
  onCreateNew: () => void;
  onDuplicate?: (post: SocialPost) => void;
  userAccounts?: UserSocialAccounts;
  socialGroups?: SocialGroup[];
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  history,
  onReShare,
  onDelete,
  onCreateNew,
  onDuplicate,
  userAccounts,
  socialGroups = []
}) => {
  const [activeFilter, setActiveFilter] = useState<HistoryFilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const allKnownDestinations = useMemo(() => {
    return getAllDestinations(normalizeUserAccounts(userAccounts));
  }, [userAccounts]);

  // Determine outcome status for an item
  const getItemOutcome = (item: SocialPost): 'completed' | 'partial' | 'failed' => {
    const statuses = item.platformStatuses ? Object.values(item.platformStatuses) : [];
    if (statuses.length === 0) {
      const fallbackStatus = (item as any).status;
      if (fallbackStatus === 'COMPLETED' || fallbackStatus === 'SHARED') return 'completed';
      return 'partial';
    }
    const completedCount = statuses.filter(s => s.status === 'COMPLETED' || s.status === 'SHARED').length;
    const failedCount = statuses.filter(s => s.status === 'FAILED').length;
    const totalCount = statuses.length;

    if (completedCount === totalCount && totalCount > 0) return 'completed';
    if (failedCount === totalCount && totalCount > 0) return 'failed';
    if (completedCount > 0) return 'partial';
    if (failedCount > 0) return 'failed';
    return 'partial';
  };

  const isDraftSourced = (item: SocialPost): boolean => {
    return Boolean(
      item.isDraft || 
      (item as any).sourceDraftId || 
      (item as any).fromDraft || 
      (item.hashtags && item.hashtags.some(t => t.toLowerCase().includes('draft')))
    );
  };

  // Filter counts
  const counts = useMemo(() => {
    return {
      all: history.length,
      completed: history.filter(i => getItemOutcome(i) === 'completed').length,
      partial: history.filter(i => getItemOutcome(i) === 'partial').length,
      failed: history.filter(i => getItemOutcome(i) === 'failed').length,
      draft_sourced: history.filter(i => isDraftSourced(i)).length
    };
  }, [history]);

  // Filtered and searched list
  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      // 1. Status Filter
      if (activeFilter === 'completed' && getItemOutcome(item) !== 'completed') return false;
      if (activeFilter === 'partial' && getItemOutcome(item) !== 'partial') return false;
      if (activeFilter === 'failed' && getItemOutcome(item) !== 'failed') return false;
      if (activeFilter === 'draft_sourced' && !isDraftSourced(item)) return false;

      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (item.title || '').toLowerCase().includes(q);
        const captionMatch = (item.caption || '').toLowerCase().includes(q);
        const tagsMatch = item.hashtags?.some(h => h.toLowerCase().includes(q));
        const newsMatch = item.newsSourceInfo?.sourceName?.toLowerCase().includes(q) ||
                          item.newsSourceInfo?.articleTitle?.toLowerCase().includes(q);
        if (!titleMatch && !captionMatch && !tagsMatch && !newsMatch) return false;
      }

      return true;
    });
  }, [history, activeFilter, searchQuery]);

  if (history.length === 0) {
    return (
      <div className="space-y-6 pb-20 animate-fadeIn">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Post History</h1>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto">
            <Share2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No Posts in History</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            When you create posts and share them across Facebook, Instagram, YouTube, TikTok, and X, their statuses and records will appear here.
          </p>
          <button
            onClick={onCreateNew}
            className="mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all"
          >
            Create First Post
          </button>
        </div>
      </div>
    );
  }

  const FILTER_TABS: { id: HistoryFilterType; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'completed', label: 'Completed', count: counts.completed },
    { id: 'partial', label: 'Partial', count: counts.partial },
    { id: 'failed', label: 'Failed', count: counts.failed },
    { id: 'draft_sourced', label: 'Draft-sourced', count: counts.draft_sourced }
  ];

  return (
    <div className="space-y-5 pb-24 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Post History</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {history.length} posts recorded across platforms
          </p>
        </div>
        <button
          onClick={onCreateNew}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-xs"
        >
          New Post
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="space-y-3">
        {/* Search bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search history by caption, title, or platform..."
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all shadow-xs"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {FILTER_TABS.map(tab => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filtered Posts List */}
      {filteredHistory.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            No history posts found matching "{activeFilter.replace('_', ' ')}"{searchQuery ? ` with query "${searchQuery}"` : ''}.
          </p>
          <button
            type="button"
            onClick={() => { setActiveFilter('all'); setSearchQuery(''); }}
            className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map(item => {
            const outcome = getItemOutcome(item);
            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    {item.media?.url ? (
                      <img
                        src={item.media.url}
                        alt=""
                        className="w-16 h-16 rounded-xl object-cover bg-slate-950 shrink-0 border border-slate-800"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                        <FileText className="w-6 h-6" />
                      </div>
                    )}

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Outcome Badge */}
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          outcome === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : outcome === 'failed'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                        }`}>
                          {outcome === 'completed' ? '✓ Completed' : outcome === 'failed' ? '⚠ Failed' : '● Partial'}
                        </span>

                        {isDraftSourced(item) && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            Draft-sourced
                          </span>
                        )}

                        {item.newsSourceInfo && (
                          <span className="px-1.5 py-0.5 rounded bg-indigo-600 text-white text-[9px] font-black tracking-wider uppercase flex items-center gap-1 shadow-xs">
                            <Newspaper className="w-2.5 h-2.5" />
                            <span>NEWS: {item.newsSourceInfo.sourceName}</span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {item.title || item.caption || 'Untitled Social Post'}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {item.caption}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => onDelete(item.id)}
                    title="Delete post from history"
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Platform Status Pills */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Platform Status
                    </span>
                    {item.selectedDestinationIds && item.selectedDestinationIds.length > 0 && (
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                        {item.selectedDestinationIds.length} {item.selectedDestinationIds.length === 1 ? 'destination' : 'destinations'}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {item.selectedGroupId && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        <Layers className="w-2.5 h-2.5" />
                        <span>{socialGroups.find(g => g.id === item.selectedGroupId)?.name || 'Group'}</span>
                      </span>
                    )}
                    {item.selectedPlatforms.map(pId => {
                      const plat = PLATFORMS[pId] || { name: pId, accentColor: '#6366F1' };
                      const state = item.platformStatuses?.[pId];
                      const status = state?.status || 'READY';
                      const isSuccess = status === 'SHARED' || status === 'COMPLETED';
                      const isSkipped = status === 'SKIPPED';
                      const isFailed = status === 'FAILED';

                      return (
                        <span
                          key={pId}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            isSuccess
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : isSkipped
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                              : isFailed
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                              : status === 'OPENED' || status === 'COPIED'
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: plat.accentColor }}
                          />
                          <span>{plat.name}</span>
                          <span>{isSuccess ? '✓' : isSkipped ? '(skipped)' : isFailed ? '(failed)' : `(${status.toLowerCase()})`}</span>
                        </span>
                      );
                    })}
                    {item.platformOverrides && Object.keys(item.platformOverrides).length > 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>{Object.keys(item.platformOverrides).length} tailored platforms</span>
                      </span>
                    )}
                  </div>

                  {/* Used Destination accounts breakdown */}
                  {item.selectedDestinationIds && item.selectedDestinationIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1 text-[10px]">
                      {item.selectedDestinationIds.map(dId => {
                        const dest = allKnownDestinations.find(d => d.id === dId);
                        const platId = dest?.platformId;
                        const platConfig = platId ? PLATFORMS[platId] : undefined;
                        const destStatus = item.platformStatuses?.[dId]?.status;
                        const isDestDone = destStatus === 'SHARED' || destStatus === 'COMPLETED';
                        const isDestSkipped = destStatus === 'SKIPPED';
                        const isDestFailed = destStatus === 'FAILED';

                        let contentTypeLabel = 'Post';
                        const overrideType = item.destinationContentTypes?.[dId];
                        if (overrideType) {
                          contentTypeLabel = overrideType === 'reel' ? 'Reel' : 'Post';
                        } else if (platId === 'facebook_page') {
                          contentTypeLabel = item.facebookPageContentType === 'reel' ? 'Page Reel' : 'Page Post';
                        } else if (platId === 'facebook_profile') {
                          contentTypeLabel = item.facebookProfileContentType === 'reel' ? 'Profile Reel' : 'Profile Post';
                        } else if (platId === 'youtube') {
                          contentTypeLabel = item.media?.type === 'video' ? 'Shorts' : 'Video';
                        } else if (platId === 'instagram') {
                          contentTypeLabel = item.media?.type === 'video' ? 'Reel' : 'Feed Post';
                        } else if (platId === 'tiktok') {
                          contentTypeLabel = 'Video';
                        } else if (platId === 'twitter') {
                          contentTypeLabel = 'X Post';
                        } else if (platId === 'whatsapp') {
                          contentTypeLabel = 'Message';
                        }

                        return (
                          <span
                            key={dId}
                            className={`px-2 py-1 rounded-lg text-[10px] font-medium inline-flex items-center gap-1.5 border transition-colors ${
                              isDestDone
                                ? 'bg-emerald-500/10 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                                : isDestSkipped
                                ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                                : isDestFailed
                                ? 'bg-rose-500/10 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-500/30'
                                : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-500/30'
                            }`}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: platConfig?.accentColor || '#6366F1' }}
                            />
                            <span className="font-semibold text-slate-900 dark:text-white max-w-[140px] truncate">
                              {dest?.name || dId}
                            </span>
                            <span className="px-1 py-0.2 rounded bg-black/10 dark:bg-white/10 text-[9px] uppercase font-bold tracking-tight">
                              {contentTypeLabel}
                            </span>
                            {isDestDone && (
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[9px]">
                                Completed ✓
                              </span>
                            )}
                            {isDestSkipped && (
                              <span className="text-slate-400 font-medium text-[9px]">
                                Skipped
                              </span>
                            )}
                            {isDestFailed && (
                              <span className="text-rose-600 dark:text-rose-400 font-bold text-[9px]">
                                Failed ✕
                              </span>
                            )}
                            {!isDestDone && !isDestSkipped && !isDestFailed && (
                              <span className="text-amber-600 dark:text-amber-400 font-medium text-[9px]">
                                Ready
                              </span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Card Action Buttons (Duplicate & Re-share) */}
                <div className="flex items-center justify-end gap-3 pt-1 border-t border-slate-100 dark:border-slate-800/40">
                  {onDuplicate && (
                    <button
                      type="button"
                      onClick={() => onDuplicate(item)}
                      className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5 transition-colors"
                      title="Duplicate content into Create Post"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Duplicate</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onReShare(item)}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 hover:underline"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Re-share Content</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

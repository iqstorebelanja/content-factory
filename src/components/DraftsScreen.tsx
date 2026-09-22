import React from 'react';
import { 
  FileText, 
  Trash2, 
  Edit3, 
  Share2, 
  PlusCircle, 
  Clock,
  Layers,
  Sparkles,
  Newspaper
} from 'lucide-react';
import { SocialPost, UserSocialAccounts, SocialGroup } from '../types';
import { PLATFORMS } from '../data/platforms';
import { getAllDestinations, normalizeUserAccounts } from '../utils/socialAccounts';

interface DraftsScreenProps {
  drafts: SocialPost[];
  onEditDraft: (draft: SocialPost) => void;
  onDeleteDraft: (id: string) => void;
  onShareDraft: (draft: SocialPost) => void;
  onCreateNew: () => void;
  userAccounts?: UserSocialAccounts;
  socialGroups?: SocialGroup[];
}

export const DraftsScreen: React.FC<DraftsScreenProps> = ({
  drafts,
  onEditDraft,
  onDeleteDraft,
  onShareDraft,
  onCreateNew,
  userAccounts,
  socialGroups = []
}) => {
  const allKnownDestinations = React.useMemo(() => {
    return getAllDestinations(normalizeUserAccounts(userAccounts));
  }, [userAccounts]);
  if (drafts.length === 0) {
    return (
      <div className="space-y-6 pb-20 animate-fadeIn">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Saved Drafts</h1>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No Saved Drafts</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            When creating a post, tap "Save Draft" to store your media, platform selections, and captions locally until you are ready to publish.
          </p>
          <button
            onClick={onCreateNew}
            className="mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all"
          >
            Create Draft
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Saved Drafts</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {drafts.length} draft post(s) ready to edit or share
          </p>
        </div>
        <button
          onClick={onCreateNew}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
        >
          New Draft
        </button>
      </div>

      <div className="space-y-3">
        {drafts.map(draft => (
          <div
            key={draft.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                {draft.media?.url ? (
                  <img
                    src={draft.media.url}
                    alt=""
                    className="w-14 h-14 rounded-xl object-cover bg-slate-950 shrink-0 border border-slate-800"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                )}

                <div className="min-w-0 space-y-0.5">
                  {draft.newsSourceInfo && (
                    <div className="flex items-center gap-1.5 pb-0.5">
                      <span className="px-1.5 py-0.5 rounded bg-indigo-600 text-white text-[9px] font-black tracking-wider uppercase flex items-center gap-1 shadow-xs">
                        <Newspaper className="w-2.5 h-2.5" />
                        <span>NEWS</span>
                      </span>
                      <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 truncate">
                        {draft.newsSourceInfo.sourceName}
                      </span>
                    </div>
                  )}
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {draft.title || draft.caption || 'Untitled Draft'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {draft.caption}
                  </p>
                  {draft.scheduledAt && (
                    <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium pt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>Scheduled for {new Date(draft.scheduledAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => onDeleteDraft(draft.id)}
                title="Delete draft"
                className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Targeted destinations & platforms pills */}
            <div className="space-y-1.5 pt-1">
              <div className="flex flex-wrap items-center gap-1.5">
                {draft.selectedGroupId && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                    <Layers className="w-2.5 h-2.5" />
                    <span>{socialGroups.find(g => g.id === draft.selectedGroupId)?.name || 'Group'}</span>
                  </span>
                )}
                {draft.selectedDestinationIds && draft.selectedDestinationIds.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                    {draft.selectedDestinationIds.length} {draft.selectedDestinationIds.length === 1 ? 'destination' : 'destinations'}
                  </span>
                )}
                {draft.selectedPlatforms.map(pId => (
                  <span
                    key={pId}
                    className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  >
                    {PLATFORMS[pId]?.name}
                  </span>
                ))}
                {draft.platformOverrides && Object.keys(draft.platformOverrides).length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>{Object.keys(draft.platformOverrides).length} tailored platforms</span>
                  </span>
                )}
              </div>

              {draft.selectedDestinationIds && draft.selectedDestinationIds.length > 0 && (
                <div className="flex flex-wrap gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                  {draft.selectedDestinationIds.map(dId => {
                    const dest = allKnownDestinations.find(d => d.id === dId);
                    return dest ? (
                      <span key={dId} className="bg-slate-100/80 dark:bg-slate-800/80 px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-700 dark:text-slate-300 truncate max-w-[140px]">
                        {dest.name}
                      </span>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            {/* Actions: Edit or Share */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
              <button
                onClick={() => onEditDraft(draft)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => onShareDraft(draft)}
                className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-sm"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

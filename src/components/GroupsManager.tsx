import React, { useState } from 'react';
import { 
  Plus, 
  Layers, 
  Edit3, 
  Copy, 
  Trash2, 
  Share2, 
  Check, 
  AlertCircle,
  FolderPlus,
  ArrowRight
} from 'lucide-react';
import { SocialGroup, UserSocialAccounts, PlatformId } from '../types';
import { PLATFORMS } from '../data/platforms';
import { 
  normalizeUserAccounts, 
  getAllDestinations 
} from '../utils/socialAccounts';
import { GroupEditModal } from './GroupEditModal';

interface GroupsManagerProps {
  groups: SocialGroup[];
  userAccounts: UserSocialAccounts;
  onCreateGroup: (newGroup: Omit<SocialGroup, 'id' | 'createdAt'>) => void;
  onUpdateGroup: (groupId: string, updates: Partial<Omit<SocialGroup, 'id' | 'createdAt'>>) => void;
  onDeleteGroup: (groupId: string) => void;
  onDuplicateGroup: (groupId: string) => void;
  onSelectGroupForPost?: (groupId: string) => void;
}

export const GroupsManager: React.FC<GroupsManagerProps> = ({
  groups,
  userAccounts,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  onDuplicateGroup,
  onSelectGroupForPost
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<SocialGroup | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  const normalizedAccounts = normalizeUserAccounts(userAccounts);
  const allDestinations = getAllDestinations(normalizedAccounts);

  const handleOpenCreate = () => {
    setEditingGroup(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (group: SocialGroup) => {
    setEditingGroup(group);
    setIsModalOpen(true);
  };

  const handleSaveGroup = (data: { name: string; description?: string; destinationIds: string[] }) => {
    if (editingGroup) {
      onUpdateGroup(editingGroup.id, data);
    } else {
      onCreateGroup(data);
    }
  };

  const handleDuplicate = (groupId: string, name: string) => {
    onDuplicateGroup(groupId);
    setCopiedToast(`Duplicated "${name}"`);
    setTimeout(() => setCopiedToast(null), 2500);
  };

  const handleDelete = (groupId: string) => {
    onDeleteGroup(groupId);
    setConfirmDeleteId(null);
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {copiedToast && (
        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl flex items-center gap-2 font-semibold animate-fadeIn">
          <Check className="w-4 h-4 shrink-0" />
          <span>{copiedToast}</span>
        </div>
      )}

      {/* Header & Create Button */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-1">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Social Media Groups</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200 dark:border-indigo-800">
              {groups.length} {groups.length === 1 ? 'group' : 'groups'}
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Bundle accounts into workspaces (e.g. NGABLOEVENTURE, PERSIB) for instant multi-destination selection
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm flex items-center gap-1.5 transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Create Group</span>
        </button>
      </div>

      {/* Groups List */}
      {groups.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No Groups Created Yet</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Create groups to organize accounts by brand, client, or topic (e.g. NGABLOEVENTURE or PERSIB).
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Group</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {groups.map(group => {
            const destIds = group.destinationIds || [];
            // Map destination ids to destinations
            const groupDestinations = destIds
              .map(id => allDestinations.find(d => d.id === id))
              .filter(Boolean);

            // Count platforms involved
            const platformSet = new Set(groupDestinations.map(d => d?.platformId));
            const isConfirmingDelete = confirmDeleteId === group.id;

            return (
              <div
                key={group.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                {/* Group Top Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                        {group.name}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                        {destIds.length} {destIds.length === 1 ? 'destination' : 'destinations'}
                      </span>
                      {destIds.some(id => !allDestinations.some(d => d.id === id)) && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                          <AlertCircle className="w-2.5 h-2.5" />
                          <span>Missing Accounts</span>
                        </span>
                      )}
                    </div>

                    {group.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {group.description}
                      </p>
                    )}
                  </div>

                  {/* Actions Dropdown / Row */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDuplicate(group.id, group.name)}
                      title="Duplicate Group"
                      className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(group)}
                      title="Edit Group"
                      className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(isConfirmingDelete ? null : group.id)}
                      title="Delete Group"
                      className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Inline Delete Confirmation */}
                {isConfirmingDelete && (
                  <div className="flex items-center justify-between p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/80 rounded-xl text-xs">
                    <span className="text-rose-700 dark:text-rose-300 font-semibold">
                      Delete "{group.name}"?
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(group.id)}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}

                {/* Destinations Details in this Group */}
                <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Included Destinations:
                  </div>

                  {destIds.length === 0 ? (
                    <div className="text-xs text-slate-400 italic">
                      No destinations assigned. Tap Edit to select accounts.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {destIds.map(dId => {
                        const dest = allDestinations.find(d => d.id === dId);
                        const platform = dest ? PLATFORMS[dest.platformId] : null;

                        if (!dest) {
                          return (
                            <div
                              key={dId}
                              className="flex items-center gap-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-400"
                            >
                              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate flex-1">
                                Account Deleted / Unavailable
                              </span>
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded">
                                Deleted
                              </span>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={dId}
                            className="flex items-center gap-2 p-2 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs"
                          >
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: platform?.accentColor || '#6366F1' }}
                            />
                            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate flex-1">
                              {dest.name}
                            </span>
                            <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                              {platform?.name || 'Account'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Optional "Use in Create Post" action button */}
                {onSelectGroupForPost && (
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => onSelectGroupForPost(group.id)}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 active:scale-[0.98]"
                    >
                      <span>Create post for this group</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for Create/Edit */}
      <GroupEditModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingGroup(null);
        }}
        onSave={handleSaveGroup}
        initialGroup={editingGroup}
        userAccounts={userAccounts}
      />
    </div>
  );
};

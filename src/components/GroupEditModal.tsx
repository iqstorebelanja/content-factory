import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  CheckSquare, 
  Square, 
  Layers, 
  AlertCircle 
} from 'lucide-react';
import { SocialGroup, UserSocialAccounts, PlatformId } from '../types';
import { PLATFORMS } from '../data/platforms';
import { 
  normalizeUserAccounts, 
  getDestinationsForPlatform 
} from '../utils/socialAccounts';

interface GroupEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (groupData: { name: string; description?: string; destinationIds: string[] }) => void;
  initialGroup?: SocialGroup | null;
  userAccounts: UserSocialAccounts;
}

const DESTINATION_PLATFORMS_CONFIG: { id: PlatformId; label: string }[] = [
  { id: 'facebook_page', label: 'Facebook Pages' },
  { id: 'facebook_profile', label: 'Facebook Personal Profiles' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'twitter', label: 'X' },
  { id: 'whatsapp', label: 'WhatsApp' }
];

export const GroupEditModal: React.FC<GroupEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialGroup,
  userAccounts
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDestinationIds, setSelectedDestinationIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const normalizedAccounts = normalizeUserAccounts(userAccounts);

  // Sync state when modal opens or initialGroup changes
  useEffect(() => {
    if (isOpen) {
      if (initialGroup) {
        setName(initialGroup.name);
        setDescription(initialGroup.description || '');
        setSelectedDestinationIds([...(initialGroup.destinationIds || [])]);
      } else {
        setName('');
        setDescription('');
        setSelectedDestinationIds([]);
      }
      setError(null);
    }
  }, [isOpen, initialGroup]);

  if (!isOpen) return null;

  // Toggle single destination checkbox
  const toggleDestination = (destId: string) => {
    setSelectedDestinationIds(prev =>
      prev.includes(destId) ? prev.filter(id => id !== destId) : [...prev, destId]
    );
  };

  // Toggle all destinations for a specific platform
  const togglePlatformDestinations = (platformId: PlatformId) => {
    const pDests = getDestinationsForPlatform(platformId, normalizedAccounts);
    const pDestIds = pDests.map(d => d.id);
    const isAllSelected = pDestIds.length > 0 && pDestIds.every(id => selectedDestinationIds.includes(id));

    if (isAllSelected) {
      setSelectedDestinationIds(prev => prev.filter(id => !pDestIds.includes(id)));
    } else {
      setSelectedDestinationIds(prev => Array.from(new Set([...prev, ...pDestIds])));
    }
  };

  // Select all destinations across all platforms
  const handleSelectAll = () => {
    const allIds: string[] = [];
    DESTINATION_PLATFORMS_CONFIG.forEach(({ id }) => {
      const pDests = getDestinationsForPlatform(id, normalizedAccounts);
      allIds.push(...pDests.map(d => d.id));
    });
    setSelectedDestinationIds(Array.from(new Set(allIds)));
  };

  // Clear all selections
  const handleClearAll = () => {
    setSelectedDestinationIds([]);
  };

  // Total available configured destinations
  const allValidDestIds = new Set(
    DESTINATION_PLATFORMS_CONFIG.flatMap(({ id }) => 
      getDestinationsForPlatform(id, normalizedAccounts).map(d => d.id)
    )
  );

  const missingSelectedIds = selectedDestinationIds.filter(id => !allValidDestIds.has(id));

  const totalConfiguredCount = DESTINATION_PLATFORMS_CONFIG.reduce((acc, { id }) => {
    return acc + getDestinationsForPlatform(id, normalizedAccounts).length;
  }, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please provide a Group Name (e.g. NGABLOEVENTURE, PERSIB).');
      return;
    }

    // Clean up any references to deleted accounts automatically on save
    const validDestIds = selectedDestinationIds.filter(id => allValidDestIds.has(id));

    onSave({
      name: trimmedName,
      description: description.trim() || undefined,
      destinationIds: validDestIds
    });
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {initialGroup ? 'Edit Social Group' : 'Create Social Group'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bundle destinations for one-tap cross-posting
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Group Name & Description */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Group Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="e.g. NGABLOEVENTURE, PERSIB, Main Brand"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Group Description <span className="text-slate-400 font-normal normal-case">(optional)</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="e.g. Outdoor adventure & fishing multi-channel network"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Destination Accounts Selector */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Group Destinations
                </h3>
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                  {selectedDestinationIds.length} of {totalConfiguredCount} destinations selected
                </p>
              </div>

              {totalConfiguredCount > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline px-2 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-xs text-slate-500 dark:text-slate-400 font-semibold hover:underline px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>

            {missingSelectedIds.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-700 dark:text-amber-400">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                  <span>{missingSelectedIds.length} previously selected account(s) were deleted.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDestinationIds(prev => prev.filter(id => allValidDestIds.has(id)))}
                  className="px-2.5 py-1 text-[11px] font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors shadow-xs"
                >
                  Clean up
                </button>
              </div>
            )}

            {/* Platform Groups List */}
            <div className="space-y-3">
              {DESTINATION_PLATFORMS_CONFIG.map(({ id: pId, label: groupLabel }) => {
                const platform = PLATFORMS[pId];
                const destinations = getDestinationsForPlatform(pId, normalizedAccounts);
                const hasAccounts = destinations.length > 0;
                const selectedForPlatform = destinations.filter(d => selectedDestinationIds.includes(d.id));
                const isAllSelected = hasAccounts && selectedForPlatform.length === destinations.length;

                return (
                  <div
                    key={pId}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 space-y-2"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded-lg flex items-center justify-center text-white font-bold text-[10px] shrink-0"
                          style={{ backgroundColor: platform?.accentColor || '#6366F1' }}
                        >
                          {platform?.name.charAt(0) || groupLabel.charAt(0)}
                        </div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {groupLabel}
                        </span>
                        {hasAccounts && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                            {selectedForPlatform.length}/{destinations.length}
                          </span>
                        )}
                      </div>

                      {hasAccounts && (
                        <button
                          type="button"
                          onClick={() => togglePlatformDestinations(pId)}
                          className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                        >
                          {isAllSelected ? 'Deselect All' : 'Select All'}
                        </button>
                      )}
                    </div>

                    {/* Destination Checkboxes */}
                    {hasAccounts ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {destinations.map(dest => {
                          const isChecked = selectedDestinationIds.includes(dest.id);
                          return (
                            <label
                              key={dest.id}
                              className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer select-none transition-all active:scale-[0.99] ${
                                isChecked
                                  ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 shadow-xs'
                                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleDestination(dest.id)}
                                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                  {dest.name}
                                </div>
                                <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                                  {dest.url || dest.secondaryInfo || 'Configured account'}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 dark:text-slate-500 italic py-0.5 px-1">
                        No accounts configured
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-sm flex items-center gap-1.5 transition-colors active:scale-[0.99]"
          >
            <Check className="w-4 h-4" />
            <span>{initialGroup ? 'Save Changes' : 'Create Group'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

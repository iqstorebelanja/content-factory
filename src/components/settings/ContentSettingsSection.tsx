import React, { useState } from 'react';
import { FileText, Hash, Plus, X, Layers, AlertCircle } from 'lucide-react';
import { AppSettings, ContentSettings } from '../../types';

interface ContentSettingsSectionProps {
  settings: AppSettings;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
}

export const ContentSettingsSection: React.FC<ContentSettingsSectionProps> = ({
  settings,
  onUpdateSettings
}) => {
  const [newTagInput, setNewTagInput] = useState('');

  const currentContentSettings: ContentSettings = settings.contentSettings || {
    defaultContentType: 'post',
    hashtagLimits: {
      facebook: 5,
      instagram: 10,
      tiktok: 5,
      youtube: 5,
      twitter: 3
    }
  };

  const handleUpdateContentType = (type: 'post' | 'reel' | 'video' | 'shorts') => {
    onUpdateSettings({
      contentSettings: {
        ...currentContentSettings,
        defaultContentType: type
      }
    });
  };

  const handleUpdateLimit = (platform: keyof ContentSettings['hashtagLimits'], delta: number, maxCap: number) => {
    const currentVal = currentContentSettings.hashtagLimits[platform] ?? 5;
    const newVal = Math.max(1, Math.min(maxCap, currentVal + delta));
    onUpdateSettings({
      contentSettings: {
        ...currentContentSettings,
        hashtagLimits: {
          ...currentContentSettings.hashtagLimits,
          [platform]: newVal
        }
      }
    });
  };

  const handleAddHashtag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagInput.trim()) return;
    let cleanTag = newTagInput.trim();
    if (!cleanTag.startsWith('#')) cleanTag = '#' + cleanTag;
    
    const existing = settings.defaultHashtags || [];
    if (!existing.includes(cleanTag)) {
      onUpdateSettings({ defaultHashtags: [...existing, cleanTag] });
    }
    setNewTagInput('');
  };

  const handleRemoveHashtag = (tagToRemove: string) => {
    const existing = settings.defaultHashtags || [];
    onUpdateSettings({ defaultHashtags: existing.filter(t => t !== tagToRemove) });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 space-y-6 shadow-sm">
      <div>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-500" />
          <span>Content Creation & Hashtag Rules</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Preset formats, platform hashtag allowances, and default social tags
        </p>
      </div>

      <div className="space-y-5">
        {/* Default Content Type */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-500 shrink-0" />
            <div>
              <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                Default Content Type
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Preset format selected when composing new social posts
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'post', label: 'Standard Post' },
              { id: 'reel', label: 'Reel (Vertical)' },
              { id: 'video', label: 'Landscape Video' },
              { id: 'shorts', label: 'Shorts' }
            ].map((ct) => {
              const isActive = (currentContentSettings.defaultContentType || 'post') === ct.id;
              return (
                <button
                  key={ct.id}
                  type="button"
                  onClick={() => handleUpdateContentType(ct.id as any)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all text-center ${
                    isActive
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {ct.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Platform Hashtag Limits */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
              Default Hashtag Limits per Platform
            </label>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Maximum hashtags automatically generated or attached per platform destination
            </span>
          </div>

          <div className="space-y-2">
            {[
              { key: 'facebook', name: 'Facebook (Pages & Profiles)', current: currentContentSettings.hashtagLimits.facebook ?? 5, maxCap: 20 },
              { key: 'instagram', name: 'Instagram', current: currentContentSettings.hashtagLimits.instagram ?? 10, maxCap: 30 },
              { key: 'tiktok', name: 'TikTok', current: currentContentSettings.hashtagLimits.tiktok ?? 5, maxCap: 15 },
              { key: 'youtube', name: 'YouTube (Shorts & Video)', current: currentContentSettings.hashtagLimits.youtube ?? 5, maxCap: 15 },
              { key: 'twitter', name: 'X (Twitter)', current: currentContentSettings.hashtagLimits.twitter ?? 3, maxCap: 10 }
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800"
              >
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    {item.name}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Max network limit: {item.maxCap} tags
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateLimit(item.key as any, -1, item.maxCap)}
                    className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                    {item.current}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleUpdateLimit(item.key as any, 1, item.maxCap)}
                    className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Global Default Hashtags */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-indigo-500" />
                <span>Global Default Hashtags</span>
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Preset tags auto-populated when creating fresh posts
              </span>
            </div>
            <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">
              {(settings.defaultHashtags || []).length} active
            </span>
          </div>

          <form onSubmit={handleAddHashtag} className="flex gap-2">
            <input
              type="text"
              placeholder="#BrandName or Keyword"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
            <button
              type="submit"
              disabled={!newTagInput.trim()}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 transition-all flex items-center gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {(settings.defaultHashtags || []).map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-800 shadow-2xs"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveHashtag(tag)}
                  className="w-3.5 h-3.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-red-500"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

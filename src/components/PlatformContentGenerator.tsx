import React, { useState } from 'react';
import { 
  Sparkles, 
  RefreshCw, 
  Copy, 
  Check, 
  RotateCcw, 
  Layers, 
  Info,
  Hash,
  Share2,
  Sliders,
  CheckCheck,
  AlertCircle
} from 'lucide-react';
import { PlatformId, MediaItem, PlatformCustomContent, UserSocialAccounts } from '../types';
import { PLATFORMS } from '../data/platforms';
import { copyCaptionToClipboard, formatPlatformCaption } from '../utils/shareEngine';
import { getDestinationsForPlatform, normalizeUserAccounts } from '../utils/socialAccounts';

interface PlatformContentGeneratorProps {
  selectedPlatforms: PlatformId[];
  selectedDestinationIds: string[];
  userAccounts: UserSocialAccounts;
  topic: string;
  onTopicChange: (topic: string) => void;
  media: MediaItem | null;
  platformOverrides: Partial<Record<PlatformId, PlatformCustomContent>>;
  onChangePlatformOverride: (platformId: PlatformId, content: PlatformCustomContent | undefined) => void;
  onApplyAllOverrides: (overrides: Partial<Record<PlatformId, PlatformCustomContent>>) => void;
  onResetAllOverrides: () => void;
  universalTitle: string;
  universalCaption: string;
  universalDescription: string;
  universalHashtags: string[];
}

const toSafeArray = (val: any): string[] => {
  if (Array.isArray(val)) {
    return val.map(v => (typeof v === 'string' ? v.trim() : String(v).trim())).filter(Boolean);
  }
  if (typeof val === 'string') {
    return val.split(/[,\s]+/).map(s => s.trim()).filter(Boolean);
  }
  return [];
};

export const PlatformContentGenerator: React.FC<PlatformContentGeneratorProps> = ({
  selectedPlatforms,
  selectedDestinationIds,
  userAccounts,
  topic,
  onTopicChange,
  media,
  platformOverrides,
  onChangePlatformOverride,
  onApplyAllOverrides,
  onResetAllOverrides,
  universalTitle,
  universalCaption,
  universalDescription,
  universalHashtags
}) => {
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [regeneratingPlatform, setRegeneratingPlatform] = useState<PlatformId | null>(null);
  const [activeTab, setActiveTab] = useState<PlatformId | 'ALL_CARDS'>(() => selectedPlatforms[0] || 'ALL_CARDS');
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);
  const [copySuccessNotice, setCopySuccessNotice] = useState<string | null>(null);

  // Keep activeTab synchronized if selectedPlatforms changes and activeTab is no longer selected
  React.useEffect(() => {
    if (activeTab !== 'ALL_CARDS' && !selectedPlatforms.includes(activeTab)) {
      setActiveTab(selectedPlatforms[0] || 'ALL_CARDS');
    }
  }, [selectedPlatforms, activeTab]);

  const normalizedAccounts = React.useMemo(() => normalizeUserAccounts(userAccounts), [userAccounts]);

  // Accounts attached to each platform
  const getPlatformAccountNames = (platformId: PlatformId): string[] => {
    const pDests = getDestinationsForPlatform(platformId, normalizedAccounts);
    if (selectedDestinationIds.length > 0) {
      const matched = pDests.filter(d => selectedDestinationIds.includes(d.id));
      if (matched.length > 0) return matched.map(m => m.name);
    }
    return pDests.map(d => d.name);
  };

  // Get current content for a platform (falls back to universal if not customized yet)
  const getContentForPlatform = (platformId: PlatformId): PlatformCustomContent => {
    const existing = platformOverrides[platformId];
    if (existing) {
      return {
        ...existing,
        hashtags: toSafeArray(existing.hashtags),
        tags: toSafeArray(existing.tags)
      };
    }

    const safeUniversalHashtags = toSafeArray(universalHashtags);

    // Default template from universal inputs
    switch (platformId) {
      case 'youtube':
        return {
          title: universalTitle || (topic ? `${topic} - Momen Seru & Inspirasi` : ''),
          description: universalDescription || universalCaption || '',
          tags: ['vlog', 'trip', 'review', 'creator', 'indonesia'],
          hashtags: safeUniversalHashtags.slice(0, 5)
        };
      case 'tiktok':
        return {
          hook: topic ? `Kalian harus tahu serunya ${topic}!` : '',
          caption: universalCaption || '',
          hashtags: safeUniversalHashtags.slice(0, 5)
        };
      case 'facebook_page':
        return {
          caption: universalCaption || universalDescription || '',
          callToAction: 'Simpan postingan ini dan bagikan ke teman-temanmu!',
          hashtags: safeUniversalHashtags.slice(0, 5)
        };
      case 'facebook_profile':
        return {
          caption: universalCaption || universalDescription || '',
          hashtags: safeUniversalHashtags.slice(0, 3)
        };
      case 'instagram':
        return {
          opening: topic ? `${topic} ✨` : '',
          caption: universalCaption || '',
          hashtags: safeUniversalHashtags.slice(0, 10)
        };
      case 'twitter':
        return {
          caption: universalCaption || universalTitle || '',
          hashtags: safeUniversalHashtags.slice(0, 3)
        };
      case 'whatsapp':
        return {
          caption: universalCaption || universalDescription || '',
          callToAction: 'Kira-kira kapan kita agendakan bareng lagi?'
        };
      default:
        return {
          caption: universalCaption || ''
        };
    }
  };

  // Generate All selected platforms
  const handleGenerateAll = async () => {
    if (selectedPlatforms.length === 0) return;
    setIsGeneratingAll(true);

    try {
      const response = await fetch('/api/ai/generate-platform-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic || universalTitle || universalCaption || 'Trip mancing Waduk Jangari dan wisata seru Jawa Barat',
          mediaType: media?.type,
          mediaName: media?.name,
          platforms: selectedPlatforms
        })
      });

      const resJson = await response.json();
      if (resJson.success && resJson.data) {
        const normalized: Partial<Record<PlatformId, PlatformCustomContent>> = {};
        for (const [k, v] of Object.entries(resJson.data as Record<string, any>)) {
          normalized[k as PlatformId] = {
            ...v,
            hashtags: toSafeArray(v.hashtags),
            tags: toSafeArray(v.tags)
          };
        }
        onApplyAllOverrides(normalized);
      }
    } catch (err) {
      console.warn('Generate All fallback triggered:', err);
      // Construct rich local fallbacks for selected platforms
      const localBatch: Partial<Record<PlatformId, PlatformCustomContent>> = {};
      selectedPlatforms.forEach(pId => {
        localBatch[pId] = getContentForPlatform(pId);
      });
      onApplyAllOverrides(localBatch);
    } finally {
      setIsGeneratingAll(false);
    }
  };

  // Regenerate single platform
  const handleRegenerateSingle = async (platformId: PlatformId) => {
    setRegeneratingPlatform(platformId);

    try {
      const response = await fetch('/api/ai/generate-platform-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic || universalTitle || universalCaption || 'Keseruan trip dan wisata seru',
          mediaType: media?.type,
          mediaName: media?.name,
          platforms: [platformId],
          singlePlatform: platformId
        })
      });

      const resJson = await response.json();
      if (resJson.success && resJson.data && resJson.data[platformId]) {
        const single = resJson.data[platformId];
        onChangePlatformOverride(platformId, {
          ...single,
          hashtags: toSafeArray(single.hashtags),
          tags: toSafeArray(single.tags)
        });
      }
    } catch (err) {
      console.warn(`Regenerate ${platformId} fallback:`, err);
      onChangePlatformOverride(platformId, getContentForPlatform(platformId));
    } finally {
      setRegeneratingPlatform(null);
    }
  };

  // Handle Copying formatted text for a platform
  const handleCopyPlatform = async (platformId: PlatformId) => {
    const current = getContentForPlatform(platformId);
    const formatted = formatPlatformCaption(platformId, current);

    const success = await copyCaptionToClipboard(formatted);
    if (success) {
      setCopiedPlatform(platformId);
      setCopySuccessNotice(`Copied ${PLATFORMS[platformId]?.name} post to clipboard!`);
      setTimeout(() => {
        setCopiedPlatform(null);
        setCopySuccessNotice(null);
      }, 3000);
    }
  };

  // Reset single platform
  const handleResetSingle = (platformId: PlatformId) => {
    onChangePlatformOverride(platformId, undefined);
  };

  // Render individual platform card
  const renderPlatformCard = (pId: PlatformId) => {
    const platform = PLATFORMS[pId] || PLATFORMS.facebook_page;
    const content = getContentForPlatform(pId);
    const safeHashtags = toSafeArray(content.hashtags);
    const safeTags = toSafeArray(content.tags);
    const isCustomized = !!platformOverrides[pId];
    const isRegen = regeneratingPlatform === pId;
    const accounts = getPlatformAccountNames(pId);

    return (
      <div 
        key={pId}
        id={`card-platform-${pId}`}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3.5 shadow-sm transition-all"
      >
        {/* Card Header */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span 
              className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white text-xs shadow-sm shrink-0"
              style={{ backgroundColor: platform.accentColor }}
            >
              {platform.badge}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {platform.name}
                </h4>
                {isCustomized ? (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    AI Generated
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500">
                    Default
                  </span>
                )}
              </div>
              {accounts.length > 0 && (
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[260px]">
                  Applied to: <span className="font-semibold text-slate-700 dark:text-slate-300">{accounts.join(', ')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              id={`btn-copy-${pId}`}
              onClick={() => handleCopyPlatform(pId)}
              title="Copy formatted post to clipboard"
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors active:scale-95"
            >
              {copiedPlatform === pId ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy</span>
                </>
              )}
            </button>

            <button
              type="button"
              id={`btn-regenerate-${pId}`}
              disabled={isRegen}
              onClick={() => handleRegenerateSingle(pId)}
              title="Regenerate with AI for this platform"
              className="p-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRegen ? 'animate-spin' : ''}`} />
            </button>

            {isCustomized && (
              <button
                type="button"
                id={`btn-reset-${pId}`}
                onClick={() => handleResetSingle(pId)}
                title="Reset to default content"
                className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-500 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Platform Specific Form Inputs */}
        <div className="space-y-3">
          {/* 1. FACEBOOK PAGE */}
          {(pId === 'facebook_page' || pId === 'facebook') && (
            <>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  <span>Facebook Page Caption (Descriptive & Natural)</span>
                  <span className="text-[10px] text-slate-400">{(content.caption || '').length} chars</span>
                </div>
                <textarea
                  rows={4}
                  id="fb-caption-input"
                  value={content.caption || ''}
                  onChange={(e) => onChangePlatformOverride(pId, { ...content, caption: e.target.value })}
                  placeholder="Natural Facebook caption with engaging paragraphs..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                  Optional Call-To-Action (CTA)
                </label>
                <input
                  type="text"
                  id="fb-cta-input"
                  value={content.callToAction || ''}
                  onChange={(e) => onChangePlatformOverride(pId, { ...content, callToAction: e.target.value })}
                  placeholder="e.g. Bagikan ke temanmu dan jangan lupa like page kami!"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  <span>Hashtags (up to 5)</span>
                  <span className="text-[10px] text-slate-400">{safeHashtags.length}/5</span>
                </div>
                <input
                  type="text"
                  value={safeHashtags.join(' ')}
                  onChange={(e) => {
                    const tags = e.target.value.split(/\s+/).filter(t => t.startsWith('#')).slice(0, 5);
                    onChangePlatformOverride(pId, { ...content, hashtags: tags });
                  }}
                  placeholder="#Jangari #Mancing #WisataJawaBarat"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </>
          )}

          {/* 1B. FACEBOOK PERSONAL PROFILE */}
          {pId === 'facebook_profile' && (
            <>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  <span>Facebook Profile Caption (Warm, Authentic & Personal)</span>
                  <span className="text-[10px] text-slate-400">{(content.caption || '').length} chars</span>
                </div>
                <textarea
                  rows={4}
                  id="fb-profile-caption-input"
                  value={content.caption || ''}
                  onChange={(e) => onChangePlatformOverride(pId, { ...content, caption: e.target.value })}
                  placeholder="Authentic, personal-story caption for friends and family..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  <span>Hashtags (up to 3-5 personal tags)</span>
                  <span className="text-[10px] text-slate-400">{safeHashtags.length}/5</span>
                </div>
                <input
                  type="text"
                  id="fb-profile-hashtags-input"
                  value={safeHashtags.join(' ')}
                  onChange={(e) => {
                    const tags = e.target.value.split(/\s+/).filter(t => t.startsWith('#')).slice(0, 5);
                    onChangePlatformOverride(pId, { ...content, hashtags: tags });
                  }}
                  placeholder="#CeritaHariIni #Jangari #MancingSantai"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </>
          )}

          {/* 2. INSTAGRAM */}
          {pId === 'instagram' && (
            <>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                  Engaging Opening Hook
                </label>
                <input
                  type="text"
                  id="ig-opening-input"
                  value={content.opening || ''}
                  onChange={(e) => onChangePlatformOverride(pId, { ...content, opening: e.target.value })}
                  placeholder="Spot mancing terbaik dengan view juara di Jangari! 🎣✨"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  <span>Instagram Caption</span>
                  <span className="text-[10px] text-slate-400">{(content.caption || '').length} chars</span>
                </div>
                <textarea
                  rows={4}
                  id="ig-caption-input"
                  value={content.caption || ''}
                  onChange={(e) => onChangePlatformOverride(pId, { ...content, caption: e.target.value })}
                  placeholder="Instagram caption with aesthetic formatting..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  <span>Hashtags (up to 10 for discoverability)</span>
                  <span className="text-[10px] text-slate-400">{safeHashtags.length}/10</span>
                </div>
                <textarea
                  rows={2}
                  id="ig-hashtags-input"
                  value={safeHashtags.join(' ')}
                  onChange={(e) => {
                    const tags = e.target.value.split(/\s+/).filter(t => t.startsWith('#')).slice(0, 10);
                    onChangePlatformOverride(pId, { ...content, hashtags: tags });
                  }}
                  placeholder="#Jangari #Mancing #WisataJawaBarat #Fishing #NgabloeVenture #MancingMania #Explore"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </>
          )}

          {/* 3. TIKTOK */}
          {pId === 'tiktok' && (
            <>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                  Strong Short Hook (Short-form Video)
                </label>
                <input
                  type="text"
                  id="tiktok-hook-input"
                  value={content.hook || ''}
                  onChange={(e) => onChangePlatformOverride(pId, { ...content, hook: e.target.value })}
                  placeholder="Spot mancing rahasia yang jarang orang tahu di Jangari!"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  <span>TikTok Caption</span>
                  <span className="text-[10px] text-slate-400">{(content.caption || '').length} chars</span>
                </div>
                <textarea
                  rows={3}
                  id="tiktok-caption-input"
                  value={content.caption || ''}
                  onChange={(e) => onChangePlatformOverride(pId, { ...content, caption: e.target.value })}
                  placeholder="Punchy, trend-friendly short-form caption..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  <span>TikTok Hashtags (up to 5)</span>
                  <span className="text-[10px] text-slate-400">{safeHashtags.length}/5</span>
                </div>
                <input
                  type="text"
                  id="tiktok-hashtags-input"
                  value={safeHashtags.join(' ')}
                  onChange={(e) => {
                    const tags = e.target.value.split(/\s+/).filter(t => t.startsWith('#')).slice(0, 5);
                    onChangePlatformOverride(pId, { ...content, hashtags: tags });
                  }}
                  placeholder="#Jangari #Mancing #TikTokTravel #FYP #Trending"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </>
          )}

          {/* 4. YOUTUBE */}
          {pId === 'youtube' && (
            <>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  <span>Video Title</span>
                  <span className={`text-[10px] ${(content.title || '').length > 100 ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                    {(content.title || '').length}/100
                  </span>
                </div>
                <input
                  type="text"
                  id="yt-title-input"
                  value={content.title || ''}
                  onChange={(e) => onChangePlatformOverride(pId, { ...content, title: e.target.value })}
                  placeholder="Catchy YouTube video title..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  <span>Video Description</span>
                  <span className="text-[10px] text-slate-400">{(content.description || '').length} chars</span>
                </div>
                <textarea
                  rows={4}
                  id="yt-desc-input"
                  value={content.description || ''}
                  onChange={(e) => onChangePlatformOverride(pId, { ...content, description: e.target.value })}
                  placeholder="Detailed video description with timestamps, details, and subscribe link..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  <span>Tags (up to 15 comma-separated keywords)</span>
                  <span className="text-[10px] text-slate-400">{safeTags.length}/15</span>
                </div>
                <input
                  type="text"
                  id="yt-tags-input"
                  value={safeTags.join(', ')}
                  onChange={(e) => {
                    const tagList = e.target.value.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean).slice(0, 15);
                    onChangePlatformOverride(pId, { ...content, tags: tagList });
                  }}
                  placeholder="jangari, mancing jangari, waduk jangari, spot mancing cianjur"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  <span>Hashtags (up to 5 for Shorts / title)</span>
                  <span className="text-[10px] text-slate-400">{safeHashtags.length}/5</span>
                </div>
                <input
                  type="text"
                  id="yt-hashtags-input"
                  value={safeHashtags.join(' ')}
                  onChange={(e) => {
                    const tags = e.target.value.split(/\s+/).filter(t => t.startsWith('#')).slice(0, 5);
                    onChangePlatformOverride(pId, { ...content, hashtags: tags });
                  }}
                  placeholder="#Jangari #Mancing #WisataJawaBarat #YouTubeShorts"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </>
          )}

          {/* 5. X (TWITTER) */}
          {pId === 'twitter' && (
            <>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  <span>X Post (Keep it concise, under 280 chars total)</span>
                  <span className={`text-[10px] font-mono ${
                    ((content.caption || '').length + (safeHashtags.length > 0 ? safeHashtags.join(' ').length + 2 : 0)) > 280 
                      ? 'text-rose-500 font-bold' 
                      : 'text-slate-400'
                  }`}>
                    {((content.caption || '').length + (safeHashtags.length > 0 ? safeHashtags.join(' ').length + 2 : 0))}/280
                  </span>
                </div>
                <textarea
                  rows={3}
                  id="x-post-input"
                  value={content.caption || ''}
                  onChange={(e) => onChangePlatformOverride(pId, { ...content, caption: e.target.value })}
                  placeholder="Short, high-engagement update for X..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  <span>Hashtags (up to 3)</span>
                  <span className="text-[10px] text-slate-400">{safeHashtags.length}/3</span>
                </div>
                <input
                  type="text"
                  id="x-hashtags-input"
                  value={safeHashtags.join(' ')}
                  onChange={(e) => {
                    const tags = e.target.value.split(/\s+/).filter(t => t.startsWith('#')).slice(0, 3);
                    onChangePlatformOverride(pId, { ...content, hashtags: tags });
                  }}
                  placeholder="#Jangari #Mancing #Wisata"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </>
          )}

          {/* 6. WHATSAPP */}
          {pId === 'whatsapp' && (
            <>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  <span>WhatsApp Message (Natural & Broadcast-friendly)</span>
                  <span className="text-[10px] text-slate-400">{(content.caption || '').length} chars</span>
                </div>
                <textarea
                  rows={4}
                  id="wa-message-input"
                  value={content.caption || ''}
                  onChange={(e) => onChangePlatformOverride(pId, { ...content, caption: e.target.value })}
                  placeholder="Halo teman-teman! Mau berbagi momen seru..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                  Optional Closing Call-To-Action
                </label>
                <input
                  type="text"
                  id="wa-cta-input"
                  value={content.callToAction || ''}
                  onChange={(e) => onChangePlatformOverride(pId, { ...content, callToAction: e.target.value })}
                  placeholder="e.g. Kira-kira kapan kita agendakan jalan atau mancing bareng lagi?"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4 shadow-sm">
      {/* Header & Generator Bar */}
      <div className="space-y-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Platform-Specific Content Generator
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                AI crafts tailored copy for each destination platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {Object.keys(platformOverrides).length > 0 && (
              <button
                type="button"
                onClick={onResetAllOverrides}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                title="Reset all customized platform outputs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All</span>
              </button>
            )}

            <button
              type="button"
              id="btn-generate-all-platforms"
              disabled={isGeneratingAll || selectedPlatforms.length === 0}
              onClick={handleGenerateAll}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-90 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingAll ? 'animate-spin' : ''}`} />
              <span>{isGeneratingAll ? 'Generating Content...' : 'Generate All with AI'}</span>
            </button>
          </div>
        </div>

        {/* Topic Input Field */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>Basic Topic or Description (Input for AI)</span>
            <span className="text-[10px] text-slate-400 font-normal">Used across Facebook, Instagram, TikTok, YouTube, X, WhatsApp</span>
          </label>
          <div className="relative">
            <textarea
              rows={2}
              id="ai-topic-input"
              value={topic}
              onChange={(e) => onTopicChange(e.target.value)}
              placeholder="e.g. Trip mancing di Waduk Jangari Jawa Barat bersama teman, spot ikan air tawar mantap dan panorama alam indah..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
            />
          </div>
        </div>

        {/* Copy notification popup */}
        {copySuccessNotice && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs px-3 py-2 rounded-xl flex items-center gap-2 animate-fadeIn">
            <CheckCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="font-medium">{copySuccessNotice}</span>
          </div>
        )}
      </div>

      {/* When no platforms are selected */}
      {selectedPlatforms.length === 0 ? (
        <div className="border border-dashed border-amber-300 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl p-6 text-center space-y-2">
          <AlertCircle className="w-6 h-6 text-amber-500 mx-auto" />
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
            No Destinations Selected
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Select a Posting Group or individual destination checkboxes above to generate customized content for each selected platform.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Navigation View Switcher (Tabs vs All Cards) */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 no-scrollbar">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('ALL_CARDS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === 'ALL_CARDS'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>All Cards ({selectedPlatforms.length})</span>
              </button>

              {selectedPlatforms.map(pId => {
                const p = PLATFORMS[pId];
                if (!p) return null;
                const isCustom = !!platformOverrides[pId];
                const isActive = activeTab === pId;

                return (
                  <button
                    key={pId}
                    type="button"
                    onClick={() => setActiveTab(pId)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span 
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: p.accentColor }}
                    />
                    <span>{p.name}</span>
                    {isCustom && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cards Content */}
          <div className="space-y-3">
            {activeTab === 'ALL_CARDS' ? (
              <div className="space-y-3">
                {selectedPlatforms.map(pId => renderPlatformCard(pId))}
              </div>
            ) : (
              renderPlatformCard(activeTab)
            )}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  Image as ImageIcon, 
  Video, 
  Sparkles, 
  X, 
  Check, 
  Calendar, 
  Clock, 
  ArrowRight, 
  AlertCircle, 
  Trash2, 
  RefreshCw,
  HardDrive,
  CheckCircle2,
  FolderOpen,
  CheckSquare,
  Square,
  Layers,
  ChevronDown,
  Download,
  ExternalLink,
  Flame,
  Newspaper,
  AlertTriangle,
  Link2,
  Copy,
  Edit2,
  Radio,
  Info
} from 'lucide-react';
import { PlatformId, MediaItem, SocialPost, PlatformCustomContent, UserSocialAccounts, SocialGroup, NewsTitleOption } from '../types';
import { PLATFORMS, SAMPLE_MEDIA_LIBRARY } from '../data/platforms';
import { 
  getAllDestinations, 
  getDestinationsForPlatform, 
  normalizeUserAccounts 
} from '../utils/socialAccounts';
import { PlatformPreview } from './PlatformPreview';
import { PlatformContentGenerator } from './PlatformContentGenerator';
import { isOnline } from '../services/networkState';
import { mediaStorage } from '../services/mediaStorage';

const DESTINATION_PLATFORMS_CONFIG: { id: PlatformId; label: string }[] = [
  { id: 'facebook_page', label: 'Facebook Pages' },
  { id: 'facebook_profile', label: 'Facebook Personal Profiles' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'twitter', label: 'X' },
  { id: 'whatsapp', label: 'WhatsApp' }
];

interface CreatePostScreenProps {
  initialPost?: SocialPost | null;
  onShareNow: (post: SocialPost) => void;
  onSaveDraft: (post: SocialPost) => void;
  onOpenDriveModal: () => void;
  isDriveConnected: boolean;
  isExpoGoMode: boolean;
  userAccounts?: UserSocialAccounts;
  socialGroups?: SocialGroup[];
  initialGroupId?: string | null;
}

export const CreatePostScreen: React.FC<CreatePostScreenProps> = ({
  initialPost,
  onShareNow,
  onSaveDraft,
  onOpenDriveModal,
  isDriveConnected,
  isExpoGoMode,
  userAccounts,
  socialGroups = [],
  initialGroupId
}) => {
  const normalizedAccounts = normalizeUserAccounts(userAccounts);
  const allDestinations = getAllDestinations(normalizedAccounts);

  // NEWS SOURCE METADATA (NEWS → CONTENT FACTORY)
  const newsInfo = initialPost?.newsSourceInfo;

  // Posting Group state
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(() => {
    if (initialPost?.selectedGroupId !== undefined) {
      return initialPost.selectedGroupId;
    }
    return initialGroupId || null;
  });

  // Post State
  const [title, setTitle] = useState(initialPost?.title || '');
  const [caption, setCaption] = useState(initialPost?.caption || '');
  const [description, setDescription] = useState(initialPost?.description || '');
  const [hashtags, setHashtags] = useState<string[]>(initialPost?.hashtags || ['#Jangari', '#Mancing', '#WisataJawaBarat', '#Fishing', '#NgabloeVenture']);
  const [hashtagInput, setHashtagInput] = useState('');
  
  // Destination Accounts selection state
  const [selectedDestinationIds, setSelectedDestinationIds] = useState<string[]>(() => {
    if (initialPost && Array.isArray(initialPost.selectedDestinationIds)) {
      return initialPost.selectedDestinationIds;
    }
    if (allDestinations.length > 0) {
      return allDestinations.map(d => d.id);
    }
    return [];
  });

  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformId[]>(() => {
    if (initialPost && Array.isArray(initialPost.selectedPlatforms)) {
      return initialPost.selectedPlatforms;
    }
    if (allDestinations.length > 0) {
      return Array.from(new Set(allDestinations.map(d => d.platformId)));
    }
    return ['facebook_page', 'facebook_profile', 'instagram', 'tiktok', 'youtube', 'twitter', 'whatsapp'];
  });

  // Media state: do not automatically download or force sample preset if coming from news without media
  const [media, setMedia] = useState<MediaItem | null>(() => {
    if (initialPost?.media) return initialPost.media;
    if (newsInfo?.media?.url) {
      return {
        id: newsInfo.media.id || `media-news-${Date.now()}`,
        name: (newsInfo.articleTitle || 'Discovered Media').slice(0, 30),
        type: newsInfo.media.type,
        url: newsInfo.media.url,
        thumbnailUrl: newsInfo.media.thumbnailUrl,
        source: 'local'
      };
    }
    if (newsInfo) return null;
    return SAMPLE_MEDIA_LIBRARY[0];
  });

  // Source Attribution Toggles
  const [includeSourceName, setIncludeSourceName] = useState<boolean>(newsInfo?.includeSourceNameInCaption ?? false);
  const [includeArticleLink, setIncludeArticleLink] = useState<boolean>(newsInfo?.includeArticleLinkInCaption ?? false);

  // AI Title Options state
  const [titleOptions, setTitleOptions] = useState<NewsTitleOption[]>(() => {
    if (newsInfo?.generatedTitles && newsInfo.generatedTitles.length > 0) {
      return newsInfo.generatedTitles;
    }
    if (newsInfo) {
      const raw = newsInfo.articleTitle || initialPost?.title || '';
      return [
        { type: 'informative', title: raw || 'Update Berita Terkini' },
        { type: 'seo', title: `${raw} - Informasi Lengkap Terkini`.slice(0, 70) },
        { type: 'short', title: raw.split(' - ')[0].split(' | ')[0].slice(0, 50) },
        { type: 'curiosity', title: `Fakta Menarik: ${raw}`.slice(0, 75) }
      ];
    }
    return [];
  });

  // Description Generator Options
  const [descOptions, setDescOptions] = useState<{ short?: string; medium?: string; social?: string }>(() => {
    if (newsInfo?.generatedDescriptions) {
      return newsInfo.generatedDescriptions;
    }
    if (newsInfo) {
      const sum = newsInfo.summary || initialPost?.description || '';
      return {
        short: sum.slice(0, 140),
        medium: sum,
        social: initialPost?.caption || sum
      };
    }
    return {};
  });

  // Media Download Behavior state
  const [isDownloadingMedia, setIsDownloadingMedia] = useState(false);
  const [mediaDownloadError, setMediaDownloadError] = useState<string | null>(null);
  const [mediaDownloadedSuccess, setMediaDownloadedSuccess] = useState(false);

  // News Content Assistant regeneration state
  const [isRegeneratingNews, setIsRegeneratingNews] = useState(false);
  const [editingTitleIndex, setEditingTitleIndex] = useState<number | null>(null);
  const [editingTitleText, setEditingTitleText] = useState('');

  const [platformOverrides, setPlatformOverrides] = useState<Partial<Record<PlatformId, PlatformCustomContent>>>(
    initialPost?.platformOverrides || {}
  );
  const [activeTab, setActiveTab] = useState<'ALL' | PlatformId>('ALL');

  // Scheduling State
  const [isScheduling, setIsScheduling] = useState(!!initialPost?.scheduledAt);
  const [scheduledDate, setScheduledDate] = useState(
    initialPost?.scheduledAt ? initialPost.scheduledAt.split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [scheduledTime, setScheduledTime] = useState(
    initialPost?.scheduledAt ? initialPost.scheduledAt.split('T')[1]?.slice(0, 5) || '14:00' : '14:00'
  );

  // AI Assistant State
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiPromptTopic, setAiPromptTopic] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);
  const [draftSavedToast, setDraftSavedToast] = useState(false);

  // Validation Warnings
  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  // Toggle individual destination account
  const toggleDestination = (destId: string) => {
    const isSelected = selectedDestinationIds.includes(destId);
    const nextIds = isSelected
      ? selectedDestinationIds.filter(id => id !== destId)
      : [...selectedDestinationIds, destId];

    setSelectedDestinationIds(nextIds);

    // Synchronize selectedPlatforms
    const activePlatforms = new Set<PlatformId>();
    nextIds.forEach(id => {
      const dest = allDestinations.find(d => d.id === id);
      if (dest) activePlatforms.add(dest.platformId);
    });
    setSelectedPlatforms(Array.from(activePlatforms));
  };

  // Handle Posting Group selection
  const handleSelectGroup = (groupId: string | null) => {
    setSelectedGroupId(groupId);
    if (!groupId) {
      // User chose "No Group" -> preserves existing selection for manual refinement
      return;
    }

    const group = (socialGroups || []).find(g => g.id === groupId);
    if (group && group.destinationIds) {
      // Automatically select all active valid destinations belonging to that group
      const validDestinationIds = group.destinationIds.filter(id =>
        allDestinations.some(d => d.id === id)
      );
      setSelectedDestinationIds(validDestinationIds);

      // Synchronize active platforms
      const activePlatforms = new Set<PlatformId>();
      validDestinationIds.forEach(id => {
        const dest = allDestinations.find(d => d.id === id);
        if (dest) activePlatforms.add(dest.platformId);
      });
      if (activePlatforms.size > 0) {
        setSelectedPlatforms(Array.from(activePlatforms));
      }
    }
  };

  // Sync initialGroupId if passed directly and no initialPost
  useEffect(() => {
    if (initialGroupId && !initialPost) {
      handleSelectGroup(initialGroupId);
    }
  }, [initialGroupId]);

  // Select all destinations across all platforms
  const handleSelectAllDestinations = () => {
    if (allDestinations.length > 0) {
      const allIds = allDestinations.map(d => d.id);
      setSelectedDestinationIds(allIds);
      const platforms = Array.from(new Set(allDestinations.map(d => d.platformId)));
      setSelectedPlatforms(platforms);
    } else {
      setSelectedPlatforms(Object.keys(PLATFORMS) as PlatformId[]);
    }
  };

  // Clear all destinations
  const handleClearAllDestinations = () => {
    setSelectedDestinationIds([]);
    setSelectedPlatforms([]);
  };

  // Toggle all destinations for a specific platform
  const togglePlatformDestinations = (platformId: PlatformId) => {
    const platformDestIds = getDestinationsForPlatform(platformId, normalizedAccounts).map(d => d.id);
    if (platformDestIds.length === 0) {
      // If no configured accounts, toggle fallback platform ID
      setSelectedPlatforms(prev =>
        prev.includes(platformId) ? prev.filter(p => p !== platformId) : [...prev, platformId]
      );
      return;
    }

    const allSelectedForPlatform = platformDestIds.every(id => selectedDestinationIds.includes(id));
    let nextIds: string[];
    if (allSelectedForPlatform) {
      nextIds = selectedDestinationIds.filter(id => !platformDestIds.includes(id));
    } else {
      nextIds = Array.from(new Set([...selectedDestinationIds, ...platformDestIds]));
    }
    setSelectedDestinationIds(nextIds);

    const activePlatforms = new Set<PlatformId>();
    nextIds.forEach(id => {
      const dest = allDestinations.find(d => d.id === id);
      if (dest) activePlatforms.add(dest.platformId);
    });
    setSelectedPlatforms(Array.from(activePlatforms));
  };

  // Toggle whole platform fallback
  const togglePlatform = (id: PlatformId) => {
    togglePlatformDestinations(id);
  };

  // Add Hashtag (max 5)
  const addHashtag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = hashtagInput.trim().replace(/^#/, '');
    if (!clean) return;
    if (hashtags.length >= 5) {
      setValidationWarning('Maximum 5 hashtags allowed per post guideline.');
      return;
    }
    const tag = `#${clean}`;
    if (!hashtags.includes(tag)) {
      setHashtags([...hashtags, tag]);
    }
    setHashtagInput('');
    setValidationWarning(null);
  };

  const removeHashtag = (index: number) => {
    setHashtags(hashtags.filter((_, i) => i !== index));
    setValidationWarning(null);
  };

  // Handle local media selection from file input
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate video format for YouTube Shorts if video selected
    if (type === 'video') {
      if (!file.type.includes('mp4') && !file.type.includes('quicktime') && !file.type.includes('webm')) {
        setValidationWarning('Notice: YouTube Shorts & TikTok prefer standard MP4 or WebM vertical video.');
      } else {
        setValidationWarning(null);
      }
    }

    const objectUrl = URL.createObjectURL(file);
    const mediaId = `local-${Date.now()}`;
    // Save binary into local mediaStorage in background
    mediaStorage.save(mediaId, file).catch(() => {});
    setMedia({
      id: mediaId,
      type,
      name: file.name,
      url: objectUrl,
      sizeBytes: file.size,
      source: 'local'
    });
  };

  // Select Sample Media
  const handleSelectSampleMedia = (item: typeof SAMPLE_MEDIA_LIBRARY[0]) => {
    setMedia(item);
  };

  // AI Generation via Gemini API
  const handleGenerateWithAi = async () => {
    if (!isOnline()) {
      setValidationWarning('Offline Mode: AI Generation requires an active internet connection.');
      setIsGeneratingAi(false);
      return;
    }

    setIsGeneratingAi(true);
    setValidationWarning(null);
    try {
      const response = await fetch('/api/ai/generate-platform-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiPromptTopic || title || 'Trip mancing Waduk Jangari dan wisata seru Jawa Barat',
          mediaType: media?.type,
          mediaName: media?.name,
          platforms: selectedPlatforms.length > 0 ? selectedPlatforms : ['facebook_page', 'instagram', 'tiktok', 'youtube', 'twitter', 'whatsapp']
        })
      });

      const resJson = await response.json();
      if (resJson.success && resJson.data) {
        setPlatformOverrides(resJson.data);
        
        // Sync universal fields from the primary generated platform
        const pData = resJson.data;
        if (pData.youtube?.title) setTitle(pData.youtube.title);
        else if (aiPromptTopic) setTitle(aiPromptTopic);

        const primaryCaption = pData.facebook_page?.caption || pData.instagram?.caption || pData.tiktok?.caption || pData.twitter?.caption || pData.whatsapp?.caption;
        if (primaryCaption) setCaption(primaryCaption);

        if (pData.youtube?.description) setDescription(pData.youtube.description);
        else if (pData.facebook_page?.caption) setDescription(pData.facebook_page.caption);

        const primaryHashtags = pData.instagram?.hashtags || pData.facebook_page?.hashtags || pData.tiktok?.hashtags || pData.youtube?.hashtags;
        if (Array.isArray(primaryHashtags)) {
          setHashtags(primaryHashtags.slice(0, 5));
        }
        setShowAiModal(false);
      }
    } catch (err: any) {
      console.warn('AI generation fallback to offline prompt sample:', err);
      // Fallback content directly matching prompt example
      setTitle('Jangari, Surga Pemancing di Jawa Barat');
      setCaption('Jangari bukan cuma tempat mancing, tapi juga menawarkan panorama dan suasana yang menarik untuk dijelajahi.');
      setDescription('Pemandangan danau air tenang dan keramba terapung yang luas di Jangari Cianjur Jawa Barat.');
      setHashtags(['#Jangari', '#Mancing', '#WisataJawaBarat', '#Fishing', '#NgabloeVenture']);
      setShowAiModal(false);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Validate YouTube Shorts & TikTok requirements
  const validatePost = () => {
    if (selectedPlatforms.length === 0 && selectedDestinationIds.length === 0) {
      setValidationWarning('Please select at least one social media destination or account.');
      return false;
    }
    if (selectedPlatforms.includes('youtube') && media?.type !== 'video') {
      setValidationWarning('YouTube Shorts requires a vertical video format.');
      return false;
    }
    if (selectedPlatforms.includes('tiktok') && media?.type !== 'video') {
      setValidationWarning('TikTok requires a video format.');
      return false;
    }
    if (!caption.trim() && !title.trim()) {
      setValidationWarning('Please write a caption or title for your post.');
      return false;
    }
    return true;
  };

  // Media explicit download handler
  const handleDownloadAndUseMedia = async () => {
    const mediaUrl = media?.url || newsInfo?.media?.url;
    if (!mediaUrl) {
      setMediaDownloadError('No media URL available for download in this news story.');
      return;
    }
    setIsDownloadingMedia(true);
    setMediaDownloadError(null);
    try {
      const res = await fetch(`/api/news/media-proxy-download?url=${encodeURIComponent(mediaUrl)}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}: Failed to download media from host`);
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const isVideo = blob.type.startsWith('video');
      const downloadedItem: MediaItem = {
        id: `downloaded-${Date.now()}`,
        name: `${(newsInfo?.articleTitle || 'news-media').slice(0, 24)}.${isVideo ? 'mp4' : 'jpg'}`,
        type: isVideo ? 'video' : 'image',
        url: objectUrl,
        sizeBytes: blob.size,
        source: 'local'
      };
      setMedia(downloadedItem);
      setMediaDownloadedSuccess(true);
      setTimeout(() => setMediaDownloadedSuccess(false), 4000);
    } catch (err: any) {
      console.error('Media download error:', err);
      setMediaDownloadError(err.message || 'Direct media download failed. Source host may block external downloads.');
    } finally {
      setIsDownloadingMedia(false);
    }
  };

  // Toggle Source Attribution in Caption
  const handleToggleSourceAttribution = (newIncludeSource: boolean, newIncludeLink: boolean) => {
    setIncludeSourceName(newIncludeSource);
    setIncludeArticleLink(newIncludeLink);

    if (!newsInfo) return;

    const sourceTag = `Sumber: ${newsInfo.sourceName}`;
    const linkTag = `Link: ${newsInfo.articleUrl}`;

    let newCaption = caption;
    // Strip previous attribution tags
    newCaption = newCaption.replace(new RegExp(`\\n*${sourceTag}`, 'g'), '');
    newCaption = newCaption.replace(new RegExp(`\\n*${linkTag}`, 'g'), '').trimEnd();

    const additions: string[] = [];
    if (newIncludeSource && newsInfo.sourceName) additions.push(sourceTag);
    if (newIncludeLink && newsInfo.articleUrl) additions.push(linkTag);

    if (additions.length > 0) {
      newCaption = `${newCaption}\n\n${additions.join('\n')}`;
    }
    setCaption(newCaption);
  };

  // Regenerate News Content via Gemini Fact-based rewrite
  const handleRegenerateNewsContent = async () => {
    if (!newsInfo) return;
    setIsRegeneratingNews(true);
    try {
      const res = await fetch('/api/news/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newsInfo.articleTitle || title,
          summary: newsInfo.summary || description,
          url: newsInfo.articleUrl,
          source: newsInfo.sourceName,
          category: newsInfo.category
        })
      });
      const data = await res.json();
      if (data.success && data.rewrite) {
        const rw = data.rewrite;
        if (rw.generatedTitles && rw.generatedTitles.length > 0) {
          setTitleOptions(rw.generatedTitles);
        }
        if (rw.generatedDescriptions) {
          setDescOptions(rw.generatedDescriptions);
        }
        if (rw.platformContent) {
          const pc = rw.platformContent;
          const newOverrides: Partial<Record<PlatformId, PlatformCustomContent>> = {};
          if (pc.facebookCaption) {
            newOverrides.facebook_page = { caption: pc.facebookCaption, hashtags: pc.hashtags || [] };
            newOverrides.facebook_profile = { caption: pc.facebookCaption, hashtags: pc.hashtags || [] };
          }
          if (pc.instagramCaption) {
            newOverrides.instagram = { caption: pc.instagramCaption, hashtags: pc.hashtags || [] };
          }
          if (pc.tiktokCaption) {
            newOverrides.tiktok = { caption: pc.tiktokCaption, hashtags: pc.hashtags || [] };
          }
          if (pc.youtubeTitle) {
            newOverrides.youtube = { title: pc.youtubeTitle, description: pc.youtubeDescription || '', hashtags: pc.hashtags || [] };
          }
          if (pc.twitterCaption) {
            newOverrides.twitter = { caption: pc.twitterCaption, hashtags: pc.hashtags?.slice(0, 3) || [] };
          }
          if (pc.whatsappCaption) {
            newOverrides.whatsapp = { caption: pc.whatsappCaption, hashtags: [] };
          }
          setPlatformOverrides(prev => ({ ...prev, ...newOverrides }));
        }
      }
    } catch (err) {
      console.error('Failed to regenerate news content:', err);
    } finally {
      setIsRegeneratingNews(false);
    }
  };

  const constructPostObject = (): SocialPost => {
    const scheduledAt = isScheduling ? `${scheduledDate}T${scheduledTime}:00` : null;
    const initialStatuses: any = {};

    // Populate statuses for all destination account IDs
    selectedDestinationIds.forEach(id => {
      initialStatuses[id] = {
        status: 'READY',
        note: 'Prepared for sharing',
        updatedAt: new Date().toISOString()
      };
    });

    // Also populate platform IDs for backward compatibility
    selectedPlatforms.forEach(p => {
      if (!initialStatuses[p]) {
        initialStatuses[p] = {
          status: 'READY',
          note: 'Prepared for sharing',
          updatedAt: new Date().toISOString()
        };
      }
    });

    return {
      id: initialPost?.id || `post-${Date.now()}`,
      title,
      caption,
      description,
      hashtags,
      media,
      selectedPlatforms,
      selectedDestinationIds,
      selectedGroupId: selectedGroupId || null,
      platformOverrides,
      createdAt: initialPost?.createdAt || new Date().toISOString(),
      scheduledAt,
      platformStatuses: initialPost?.platformStatuses || initialStatuses,
      newsSourceInfo: newsInfo ? {
        ...newsInfo,
        includeSourceNameInCaption: includeSourceName,
        includeArticleLinkInCaption: includeArticleLink,
        generatedTitles: titleOptions,
        generatedDescriptions: descOptions,
        media: media ? {
          id: media.id,
          type: media.type,
          url: media.url,
          sourceName: newsInfo.sourceName,
          sourceUrl: newsInfo.articleUrl
        } : null
      } : undefined
    };
  };

  const handleShareClick = () => {
    if (!validatePost()) return;
    const post = constructPostObject();
    onShareNow(post);
  };

  const handleSaveDraftClick = () => {
    const post = constructPostObject();
    post.isDraft = true;
    onSaveDraft(post);
    setDraftSavedToast(true);
    setTimeout(() => setDraftSavedToast(false), 3000);
  };

  return (
    <div className="space-y-6 pb-20 animate-fadeIn">
      {/* Top Breadcrumb & Status */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Create Post</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Craft once, customize per platform, and launch Android shares
          </p>
        </div>
        <button
          id="btn-save-draft"
          onClick={handleSaveDraftClick}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5"
        >
          <FolderOpen className="w-3.5 h-3.5 text-indigo-500" />
          <span>Save Draft</span>
        </button>
      </div>

      {/* Draft Saved Feedback Toast */}
      {draftSavedToast && (
        <div className="bg-emerald-500 text-white rounded-xl p-3 flex items-center justify-between text-xs font-semibold shadow-md animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
            <span>Post saved to Drafts! You can edit or share it anytime.</span>
          </div>
          <button onClick={() => setDraftSavedToast(false)} className="p-1 hover:bg-white/20 rounded">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Warning banner if validation fails */}
      {validationWarning && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>{validationWarning}</span>
          </div>
          <button onClick={() => setValidationWarning(null)} className="p-1 hover:bg-amber-500/20 rounded">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* NEWS → CONTENT FACTORY HEADER BANNER */}
      {newsInfo && (
        <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 space-y-3 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-black text-[10px] tracking-wider uppercase flex items-center gap-1.5 shadow-sm">
                <Newspaper className="w-3.5 h-3.5" />
                NEWS → CONTENT FACTORY
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                {newsInfo.category || 'News'}
              </span>
            </div>

            {/* Hype Score */}
            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-xl text-amber-300 text-xs font-bold">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Hype Score: {newsInfo.hypeScore ?? 80}/100</span>
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-sm sm:text-base font-bold text-white leading-snug">
              📰 News: "{newsInfo.articleTitle || title}"
            </h2>
            <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-[11px] text-slate-400">
              <span>Source: <strong className="text-slate-200">{newsInfo.sourceName}</strong></span>
              <span>•</span>
              <span>Published: <strong className="text-slate-200">{newsInfo.publishedAt ? new Date(newsInfo.publishedAt).toLocaleDateString() : 'Recent'}</strong></span>
              <span>•</span>
              <span>Media: <strong className="text-slate-200">{media ? media.type.toUpperCase() : 'NO MEDIA'}</strong></span>
            </div>
          </div>

          {/* Hype score note */}
          <div className="text-[10px] text-slate-500 flex items-center gap-1">
            <Info className="w-3 h-3 text-slate-400 shrink-0" />
            <span>Internal topic momentum score. Do not treat the Hype Score as an official popularity measurement.</span>
          </div>

          {/* Fact Status & Notice */}
          {newsInfo.factStatus === 'developing' && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{newsInfo.factNotice || 'Developing story — verify information before publishing.'}</span>
            </div>
          )}
          {newsInfo.factStatus === 'differing' && (
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-[11px] text-purple-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-purple-400 shrink-0" />
              <span>{newsInfo.factNotice || 'Sources differ — inspect source cluster.'}</span>
            </div>
          )}
        </div>
      )}

      {/* SECTION 1: MEDIA SELECTOR & PREVIEW */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            1. Media
          </span>
          {media && (
            <button
              onClick={() => setMedia(null)}
              className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Remove Media
            </button>
          )}
        </div>

        {/* Media Preview Box */}
        {media ? (
          <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video flex items-center justify-center group">
            {media.type === 'image' ? (
              <img 
                src={media.url} 
                alt="Selected media preview" 
                className="w-full h-full object-contain" 
              />
            ) : (
              <video 
                src={media.url} 
                controls 
                className="w-full h-full object-contain" 
              />
            )}
            <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center justify-between text-[11px] text-white">
              <span className="truncate max-w-[200px]">{media.name}</span>
              <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-indigo-600 font-semibold">
                {media.type}
              </span>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center text-slate-400 text-xs">
            {newsInfo ? 'No media attached to this story. You can upload or attach media below.' : 'No media attached. Select an image or vertical video (for Shorts/TikTok).'}
          </div>
        )}

        {/* News Media Specific Status & Original Source Info */}
        {newsInfo && (
          <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 flex-wrap gap-2">
              <div>
                Media Source: <strong className="text-slate-700 dark:text-slate-300">{newsInfo.mediaSource || newsInfo.sourceName}</strong>
              </div>
              {newsInfo.articleUrl && (
                <a
                  href={newsInfo.articleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1 text-[11px]"
                >
                  <span>View Source</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* Media Download Feedback */}
            {mediaDownloadedSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Media downloaded successfully and ready for social sharing!</span>
              </div>
            )}

            {mediaDownloadError && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{mediaDownloadError}</span>
                </div>
                {newsInfo.articleUrl && (
                  <a
                    href={newsInfo.articleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold underline text-xs shrink-0"
                  >
                    Open Source
                  </a>
                )}
              </div>
            )}

            {/* News Media Actions */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {(media?.url || newsInfo.media?.url) && (
                <button
                  type="button"
                  disabled={isDownloadingMedia}
                  onClick={handleDownloadAndUseMedia}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
                >
                  {isDownloadingMedia ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Downloading Media...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Download & Use Media</span>
                    </>
                  )}
                </button>
              )}

              {newsInfo.media?.url && !media && (
                <button
                  type="button"
                  onClick={() => setMedia({
                    id: newsInfo.media?.id || `media-news-${Date.now()}`,
                    name: (newsInfo.articleTitle || 'News Media').slice(0, 30),
                    type: newsInfo.media?.type || 'image',
                    url: newsInfo.media!.url,
                    source: 'local'
                  })}
                  className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
                >
                  Use This Media
                </button>
              )}
            </div>
          </div>
        )}

        {/* Media Selection Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* File Picker Image */}
          <label className="flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 py-2.5 px-3 rounded-xl cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors">
            <ImageIcon className="w-4 h-4 text-blue-500" />
            <span>Select Image</span>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => handleFileUpload(e, 'image')} 
            />
          </label>

          {/* File Picker Video */}
          <label className="flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 py-2.5 px-3 rounded-xl cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors">
            <Video className="w-4 h-4 text-purple-500" />
            <span>Select Video</span>
            <input 
              type="file" 
              accept="video/*" 
              className="hidden" 
              onChange={(e) => handleFileUpload(e, 'video')} 
            />
          </label>

          {/* Google Drive Picker */}
          <button
            onClick={onOpenDriveModal}
            className="flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 py-2.5 px-3 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
          >
            <HardDrive className="w-4 h-4 text-emerald-500" />
            <span>Google Drive</span>
          </button>

          {/* Sample Preset Picker */}
          <button
            onClick={() => handleSelectSampleMedia(SAMPLE_MEDIA_LIBRARY[2])}
            className="flex items-center justify-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40 py-2.5 px-3 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Load Sample</span>
          </button>
        </div>
      </div>

      {/* SOURCE ATTRIBUTION SECTION (NEWS CONTENT FACTORY) */}
      {newsInfo && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Source Attribution (Optional)
              </span>
            </div>
            {newsInfo.articleUrl && (
              <a 
                href={newsInfo.articleUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
              >
                <span>Open Source</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400">
            Source: <strong className="text-slate-700 dark:text-slate-300">{newsInfo.sourceName}</strong>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeSourceName}
                onChange={(e) => handleToggleSourceAttribution(e.target.checked, includeArticleLink)}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Include source name in caption
              </span>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeArticleLink}
                onChange={(e) => handleToggleSourceAttribution(includeSourceName, e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Include original article link
              </span>
            </label>
          </div>
        </div>
      )}

      {/* SECTION 2: AI ASSISTANT / NEWS CONTENT ASSISTANT */}
      {newsInfo ? (
        <div className="bg-gradient-to-br from-indigo-950/40 via-purple-950/30 to-slate-900 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 space-y-4 shadow-md">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  NEWS CONTENT ASSISTANT
                </h3>
                <p className="text-[11px] text-slate-400">
                  Fact-based rewrite & multi-option social media generation
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={isRegeneratingNews}
              onClick={handleRegenerateNewsContent}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRegeneratingNews ? 'animate-spin' : ''}`} />
              <span>{isRegeneratingNews ? 'Regenerating...' : 'Regenerate Content'}</span>
            </button>
          </div>

          {/* Fact-based Rewrite Rules info banner */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 space-y-1">
            <div className="font-semibold text-indigo-300 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Fact-based rewrite active:</span>
            </div>
            <p className="text-slate-400 leading-relaxed pl-5">
              Uses only verified information from the news source. No invented facts, quotes, statistics, or speculation.
            </p>
          </div>

          {/* AI TITLE OPTIONS */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                AI TITLE OPTIONS
              </span>
              <span className="text-[10px] text-slate-500">
                Tap to apply to post title
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {titleOptions.map((opt, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border transition-all ${
                    title === opt.title
                      ? 'border-indigo-500 bg-indigo-950/40 text-white shadow-xs'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between pb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                      {opt.type}
                    </span>
                    <button
                      type="button"
                      onClick={() => setTitle(opt.title)}
                      className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 px-2 py-0.5 rounded bg-indigo-900/50 hover:bg-indigo-900"
                    >
                      {title === opt.title ? 'Applied ✓' : 'Use This Title'}
                    </button>
                  </div>
                  <p className="text-xs font-semibold leading-snug line-clamp-2">
                    {opt.title}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* DESCRIPTION GENERATOR */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                DESCRIPTION GENERATOR
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {descOptions.short && (
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                      1. Short Description
                    </span>
                    <button
                      type="button"
                      onClick={() => setDescription(descOptions.short || '')}
                      className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 px-2 py-0.5 rounded bg-indigo-900/50 hover:bg-indigo-900"
                    >
                      Use in Description
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{descOptions.short}</p>
                </div>
              )}
              {descOptions.medium && (
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                      2. Medium Description
                    </span>
                    <button
                      type="button"
                      onClick={() => setDescription(descOptions.medium || '')}
                      className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 px-2 py-0.5 rounded bg-indigo-900/50 hover:bg-indigo-900"
                    >
                      Use in Description
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">{descOptions.medium}</p>
                </div>
              )}
              {descOptions.social && (
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                      3. Social Caption
                    </span>
                    <button
                      type="button"
                      onClick={() => setCaption(descOptions.social || '')}
                      className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 px-2 py-0.5 rounded bg-indigo-900/50 hover:bg-indigo-900"
                    >
                      Use in Caption
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">{descOptions.social}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white">AI Content Assistant</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  ONLINE REQUIRED
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Generate catchy title, caption, hashtags (max 5), & CTA
              </div>
            </div>
          </div>
          <button
            id="btn-generate-ai"
            onClick={() => setShowAiModal(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            GENERATE WITH AI
          </button>
        </div>
      )}

      {/* SECTION 3: CONTENT EDITING */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          2. Content
        </span>

        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Title (YouTube Shorts / Video Header)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Jangari, Surga Pemancing di Jawa Barat"
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Caption */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Caption (Instagram, TikTok, Facebook, X)
          </label>
          <textarea
            rows={3}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="e.g. Jangari bukan cuma tempat mancing, tapi juga menawarkan panorama dan suasana yang menarik untuk dijelajahi..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Description (Optional - YouTube Details / Fan Page Notes)
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed background or links..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
          />
        </div>

        {/* Hashtags (Max 5) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Hashtags (Max 5)
            </label>
            <span className="text-[11px] text-slate-400">
              {hashtags.length}/5 used
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {hashtags.map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 px-2.5 py-1 rounded-full text-xs font-medium"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeHashtag(idx)}
                  className="hover:text-rose-500 p-0.5 rounded-full"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          {hashtags.length < 5 && (
            <form onSubmit={addHashtag} className="flex gap-2">
              <input
                type="text"
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                placeholder="Type tag (e.g. Mancing) and tap Add"
                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors"
              >
                Add
              </button>
            </form>
          )}
        </div>
      </div>

      {/* SECTION 4: SELECT DESTINATIONS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
        {/* POSTING GROUP SELECTOR */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-750 space-y-2.5">
          <div className="flex items-center justify-between">
            <label 
              htmlFor="select-posting-group"
              className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>POSTING GROUP</span>
            </label>
            {selectedGroupId && (
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                {socialGroups.find(g => g.id === selectedGroupId)?.name} selected
              </span>
            )}
          </div>

          <div className="relative">
            <select
              id="select-posting-group"
              value={selectedGroupId || ''}
              onChange={(e) => handleSelectGroup(e.target.value || null)}
              className="w-full appearance-none px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 pr-9 cursor-pointer transition-all shadow-xs"
            >
              <option value="">No Group (Manual Selection)</option>
              {socialGroups.map(g => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.destinationIds?.length || 0} destinations)
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Quick group pills for touch / mobile */}
          {socialGroups.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pt-0.5 no-scrollbar">
              <button
                type="button"
                onClick={() => handleSelectGroup(null)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold shrink-0 transition-colors ${
                  !selectedGroupId
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                No Group
              </button>
              {socialGroups.map(g => {
                const isSelected = selectedGroupId === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => handleSelectGroup(g.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold shrink-0 transition-colors flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                    }`}
                  >
                    <span>{g.name}</span>
                    <span className={`text-[10px] px-1 py-0.2 rounded-full font-bold ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                      {g.destinationIds?.length || 0}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
              SELECT DESTINATIONS
            </h2>
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
              {selectedDestinationIds.length} {selectedDestinationIds.length === 1 ? 'destination' : 'destinations'} selected
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-select-all-destinations-top"
              onClick={handleSelectAllDestinations}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline px-2.5 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
            >
              Select All
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              id="btn-clear-all-destinations-top"
              onClick={handleClearAllDestinations}
              className="text-xs text-slate-500 dark:text-slate-400 font-semibold hover:underline px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* 6 Platform Groups with Checkboxes */}
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
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 space-y-2.5 transition-colors"
              >
                {/* Platform Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
                      style={{ backgroundColor: platform?.accentColor || '#6366F1' }}
                    >
                      {platform?.name.charAt(0) || groupLabel.charAt(0)}
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {groupLabel}
                    </span>
                    {hasAccounts && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
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

                {/* Destination Items Checkboxes */}
                {hasAccounts ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {destinations.map((dest) => {
                      const isChecked = selectedDestinationIds.includes(dest.id);
                      return (
                        <label
                          key={dest.id}
                          className={`flex items-center gap-3 p-3 min-h-[46px] rounded-xl border cursor-pointer select-none transition-all active:scale-[0.99] ${
                            isChecked
                              ? 'border-indigo-500 dark:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 shadow-xs'
                              : 'border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900'
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
                              {dest.url || dest.secondaryInfo || 'Configured destination'}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 dark:text-slate-500 italic py-1 px-1">
                    No accounts configured
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile Action Controls: [ Select All ] [ Clear All ] */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            id="btn-select-all-destinations-bottom"
            onClick={handleSelectAllDestinations}
            className="flex-1 py-2.5 px-3 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors active:scale-[0.99]"
          >
            <CheckSquare className="w-4 h-4" />
            <span>Select All</span>
          </button>
          <button
            type="button"
            id="btn-clear-all-destinations-bottom"
            onClick={handleClearAllDestinations}
            className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/70 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors active:scale-[0.99]"
          >
            <Square className="w-4 h-4" />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {/* SECTION 5: PLATFORM-SPECIFIC CONTENT GENERATOR */}
      <PlatformContentGenerator
        selectedPlatforms={selectedPlatforms}
        selectedDestinationIds={selectedDestinationIds}
        userAccounts={userAccounts}
        topic={aiPromptTopic || title}
        onTopicChange={(newTopic) => {
          setAiPromptTopic(newTopic);
          if (!title) setTitle(newTopic);
        }}
        media={media}
        platformOverrides={platformOverrides}
        onChangePlatformOverride={(pId, content) => {
          setPlatformOverrides(prev => {
            const next = { ...prev };
            if (content === undefined) {
              delete next[pId];
            } else {
              next[pId] = content;
            }
            return next;
          });
        }}
        onApplyAllOverrides={(overrides) => {
          setPlatformOverrides(prev => ({ ...prev, ...overrides }));
        }}
        onResetAllOverrides={() => {
          setPlatformOverrides({});
        }}
        universalTitle={title}
        universalCaption={caption}
        universalDescription={description}
        universalHashtags={hashtags}
      />

      {/* SECTION 6: SCHEDULING (OPTIONAL) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Schedule or Share Now
            </span>
          </div>
          <button
            onClick={() => setIsScheduling(!isScheduling)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              isScheduling
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {isScheduling ? 'SCHEDULE MODE' : 'SHARE NOW'}
          </button>
        </div>

        {isScheduling && (
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                  Post Date
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                  Time (Asia/Jakarta)
                </label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Expo Go Graceful Notification Notice */}
            <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl leading-relaxed">
              <span className="font-semibold text-amber-700 dark:text-amber-300">
                Notice (Expo Go):
              </span>{' '}
              {isExpoGoMode 
                ? 'Push notifications require a development build. Scheduled posts will be stored in your Drafts/Queue with ready alarms.' 
                : 'Reminder will notify you when it is time to open Android share targets.'}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 7: LIVE SOCIAL MEDIA PREVIEW */}
      <PlatformPreview
        post={constructPostObject()}
        media={media}
        userAccounts={userAccounts}
      />

      {/* FINAL ACTION BAR */}
      <div className="pt-2 space-y-2.5">
        <button
          id="btn-share-to-selected"
          onClick={handleShareClick}
          className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-semibold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 text-base transition-all"
        >
          <span>{isScheduling ? 'SCHEDULE POST' : 'PROCEED TO SHARE (MANUAL CROSS-POST)'}</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        <button
          id="btn-save-draft-bottom"
          type="button"
          onClick={handleSaveDraftClick}
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-colors"
        >
          <FolderOpen className="w-4 h-4 text-slate-400" />
          <span>Save as Draft</span>
        </button>
      </div>

      {/* AI GENERATION MODAL DIALOG */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  AI Social Copywriter
                </h3>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Provide a brief keyword or topic. Gemini will craft Title, Caption, CTA, and up to 5 hashtags tailored to your attached media.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Topic or Prompt
              </label>
              <textarea
                rows={3}
                value={aiPromptTopic}
                onChange={(e) => setAiPromptTopic(e.target.value)}
                placeholder="e.g. Trip mancing di waduk Jangari Jawa Barat bersama teman, spot ikan air tawar mantap..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isGeneratingAi}
                onClick={handleGenerateWithAi}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 flex items-center gap-2 disabled:opacity-50"
              >
                {isGeneratingAi ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Generate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

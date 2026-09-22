import React, { useState, useEffect, useMemo } from 'react';
import { 
  Radio, 
  Search, 
  Sparkles, 
  Layers, 
  RefreshCw, 
  ExternalLink, 
  Bookmark, 
  BookmarkCheck, 
  Globe, 
  Plus, 
  SlidersHorizontal, 
  AlertCircle, 
  Clock, 
  TrendingUp, 
  ArrowRight, 
  Trash2, 
  Check, 
  Share2,
  Info,
  Filter,
  Flame,
  X,
  Image as ImageIcon,
  Film,
  Play,
  Maximize2,
  Download,
  Zap
} from 'lucide-react';
import { 
  NewsArticle, 
  NewsCluster, 
  NewsCategory, 
  NewsRssSource, 
  SavedNewsItem, 
  NewsAiRewrite, 
  NewsHunterSettings,
  NewsMediaItem,
  PlatformId,
  SocialPost,
  AutoHuntSettings,
  AutoHuntResult,
  DiscoveredStoryRecord
} from '../types';
import { 
  loadNewsSources, 
  saveNewsSources, 
  loadNewsCache, 
  saveNewsCache, 
  clearNewsCache, 
  loadSavedNewsLibrary, 
  saveNewsItemToLibrary, 
  deleteSavedNewsItem, 
  loadNewsSettings, 
  saveNewsSettings, 
  fetchRssFeed, 
  fetchWebDiscovery, 
  clusterArticles,
  loadAutoHuntSettings,
  saveAutoHuntSettings,
  loadAutoHuntResult,
  executeAutoHuntRun,
  getUnviewedStoriesCount,
  markAllStoriesAsViewed,
  getStoryPriority,
  getStoryEventStatus,
  calculateNextHuntTimestamp
} from '../utils/newsEngine';
import { isRestrictedSourceUrl } from '../utils/mediaDownloader';
import { NewsSourcesModal } from './NewsSourcesModal';
import { StoryClusterModal } from './StoryClusterModal';
import { NewsRewriteModal } from './NewsRewriteModal';
import { MediaViewerModal } from './MediaViewerModal';
import { isOnline } from '../services/networkState';

interface NewsHunterScreenProps {
  onCreatePostWithNews: (newsData: {
    title: string;
    description: string;
    sourceUrl?: string;
    sourceName?: string;
    publishedAt?: string;
    hypeScore?: number;
    summary?: string;
    category?: string;
    imageUrl?: string | null;
    media?: NewsMediaItem | null;
    platformContent?: {
      facebookCaption?: string;
      instagramCaption?: string;
      tiktokCaption?: string;
      youtubeTitle?: string;
      youtubeDescription?: string;
      twitterCaption?: string;
      whatsappCaption?: string;
      hashtags?: string[];
    };
    rewrite?: any;
    factStatus?: 'verified' | 'developing' | 'differing';
    factNotice?: string;
  }) => void;
  onSaveDraftDirectly?: (post: SocialPost) => void;
  onOpenSettings?: () => void;
  onStoryCountChange?: (count: number) => void;
}

export const NewsHunterScreen: React.FC<NewsHunterScreenProps> = ({
  onCreatePostWithNews,
  onSaveDraftDirectly,
  onOpenSettings,
  onStoryCountChange
}) => {
  // Persistence state
  const [sources, setSources] = useState<NewsRssSource[]>(() => loadNewsSources());
  const [settings, setSettings] = useState<NewsHunterSettings>(() => loadNewsSettings());
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [clusters, setClusters] = useState<NewsCluster[]>([]);
  const [savedLibrary, setSavedLibrary] = useState<SavedNewsItem[]>(() => loadSavedNewsLibrary());
  const [lastHuntTime, setLastHuntTime] = useState<string | null>(null);

  // Active view filters
  const [activeTab, setActiveTab] = useState<'hunt' | 'library'>('hunt');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [discoveryMode, setDiscoveryMode] = useState<'rss_only' | 'rss_web'>('rss_web');
  const [xTrendingActive, setXTrendingActive] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hypeFilter, setHypeFilter] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'hype' | 'newest' | 'sources'>('hype');

  // Media Hunter Filters & Viewer State (Requirement #6 & #3)
  const [mediaFilter, setMediaFilter] = useState<'all' | 'image' | 'video' | 'no_media'>(() => settings.mediaFilter || 'all');
  const [onlyDownloadable, setOnlyDownloadable] = useState<boolean>(() => settings.onlyDownloadableMedia || false);
  const [selectedMediaViewer, setSelectedMediaViewer] = useState<{
    media: NewsMediaItem;
    articleTitle?: string;
    sourceName: string;
    sourceUrl: string;
  } | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(20);

  // Loading & error states
  const [isHunting, setIsHunting] = useState(false);
  const [sourceErrors, setSourceErrors] = useState<{ sourceName: string; error: string }[]>([]);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Auto Hunt State (Requirement #8, #9, #13, #14, #15, #16)
  const [autoHuntSettings, setAutoHuntSettings] = useState<AutoHuntSettings>(() => loadAutoHuntSettings());
  const [autoHuntResult, setAutoHuntResult] = useState<AutoHuntResult | null>(() => loadAutoHuntResult());
  const [unviewedCount, setUnviewedCount] = useState<number>(() => getUnviewedStoriesCount());
  const [isAutoHunting, setIsAutoHunting] = useState<boolean>(false);
  const [isSourceErrorsModalOpen, setIsSourceErrorsModalOpen] = useState<boolean>(false);
  const [activeErrorsList, setActiveErrorsList] = useState<{ sourceName: string; error: string }[]>([]);

  // Modals state
  const [isSourcesModalOpen, setIsSourcesModalOpen] = useState(false);
  const [activeCluster, setActiveCluster] = useState<NewsCluster | null>(null);
  const [rewriteArticle, setRewriteArticle] = useState<NewsArticle | null>(null);
  const [rewriteCluster, setRewriteCluster] = useState<NewsCluster | null>(null);
  const [initialRewriteData, setInitialRewriteData] = useState<NewsAiRewrite | null>(null);

  // Sync unviewed stories count to parent navigation
  useEffect(() => {
    onStoryCountChange?.(unviewedCount);
  }, [unviewedCount, onStoryCountChange]);

  // Load from cache on mount & check for auto hunt updates
  useEffect(() => {
    const cached = loadNewsCache();
    if (cached && Array.isArray(cached.articles) && cached.articles.length > 0) {
      setArticles(cached.articles);
      setClusters(cached.clusters || clusterArticles(cached.articles));
      setLastHuntTime(cached.lastHuntTime);
    }
  }, []);

  // Handler for Manual Auto Hunt trigger (Requirement #14)
  const handleManualAutoHuntNow = async () => {
    if (isHunting || isAutoHunting) {
      showToast('Hunt already in progress.');
      return;
    }

    setIsAutoHunting(true);
    try {
      const huntExecution = await executeAutoHuntRun();
      setAutoHuntResult(huntExecution.result);
      
      const newCount = getUnviewedStoriesCount();
      setUnviewedCount(newCount);
      onStoryCountChange?.(newCount);

      // Refresh loaded articles and clusters from cache
      const cached = loadNewsCache();
      if (cached && Array.isArray(cached.articles) && cached.articles.length > 0) {
        setArticles(cached.articles);
        setClusters(cached.clusters || clusterArticles(cached.articles));
        setLastHuntTime(cached.lastHuntTime);
      }

      showToast(`Auto Hunt complete! +${huntExecution.result.newStoriesCount} new stories discovered (${huntExecution.result.sourcesChecked} sources checked).`);
    } catch (err: any) {
      showToast(`Auto Hunt error: ${err.message || 'Check network connection'}`);
    } finally {
      setIsAutoHunting(false);
    }
  };

  // Handler for Pause / Resume Auto Hunt (Requirement #15)
  const handlePauseResumeAutoHunt = () => {
    const isCurrentlyOn = autoHuntSettings.status === 'on';
    const newStatus = isCurrentlyOn ? 'paused' : 'on';
    const updated: AutoHuntSettings = {
      ...autoHuntSettings,
      status: newStatus,
      enabled: true,
      nextHuntTimestamp: newStatus === 'on' ? calculateNextHuntTimestamp(autoHuntSettings.interval) : undefined
    };
    setAutoHuntSettings(updated);
    saveAutoHuntSettings(updated);
    showToast(isCurrentlyOn 
      ? 'Auto Hunt paused. Scheduled checks are on hold.' 
      : 'Auto Hunt resumed. Scheduled checks are ON.'
    );
  };

  // Handler for Mark All Stories as Viewed (Requirement #9)
  const handleMarkAllViewed = () => {
    markAllStoriesAsViewed();
    setUnviewedCount(0);
    onStoryCountChange?.(0);
    showToast('All stories marked as viewed.');
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Perform News Hunt
  const handleHuntNow = async () => {
    if (!isOnline()) {
      showToast('Offline Mode: Internet connection is required to hunt live RSS news. Saved library items remain accessible offline.');
      return;
    }

    setIsHunting(true);
    setSourceErrors([]);
    const errors: { sourceName: string; error: string }[] = [];

    // Filter active sources for selected category
    const activeSources = sources.filter(s => {
      if (!s.active) return false;
      if (selectedCategory === 'All Categories') return true;
      return s.category.toLowerCase() === selectedCategory.toLowerCase();
    });

    let collectedArticles: NewsArticle[] = [];

    // Fetch RSS in parallel batches
    const rssPromises = activeSources.map(async src => {
      try {
        const fetched = await fetchRssFeed(src);
        return fetched;
      } catch (err: any) {
        errors.push({
          sourceName: src.name,
          error: err?.message || 'Direct RSS access is blocked by the source/browser.'
        });
        return [];
      }
    });

    const rssResults = await Promise.all(rssPromises);
    for (const res of rssResults) {
      collectedArticles.push(...res);
    }

    // Optional Web Discovery
    if (discoveryMode === 'rss_web') {
      try {
        const webCategory = selectedCategory === 'All Categories' ? 'Nasional' : selectedCategory;
        const webArticles = await fetchWebDiscovery(webCategory);
        collectedArticles.push(...webArticles);
      } catch (err) {
        console.warn('Web discovery error:', err);
      }
    }

    // Group & Cluster
    const formedClusters = clusterArticles(collectedArticles);
    
    // Sort clusters based on initial preference
    formedClusters.sort((a, b) => b.averageHypeScore - a.averageHypeScore);

    const huntTimestamp = new Date().toISOString();
    setArticles(collectedArticles);
    setClusters(formedClusters);
    setSourceErrors(errors);
    setLastHuntTime(huntTimestamp);

    // Save to cache
    saveNewsCache({
      lastHuntTime: huntTimestamp,
      articles: collectedArticles,
      clusters: formedClusters,
      category: selectedCategory,
      discoveryMode
    });

    setIsHunting(false);
    showToast(`News Hunt complete! Found ${collectedArticles.length} stories in ${formedClusters.length} clusters.`);
  };

  const handleClearCache = () => {
    clearNewsCache();
    setArticles([]);
    setClusters([]);
    setLastHuntTime(null);
    showToast('News cache cleared.');
  };

  const handleSaveSources = (updated: NewsRssSource[]) => {
    setSources(updated);
    saveNewsSources(updated);
  };

  // Save article to News Library
  const handleSaveToLibrary = (art: NewsArticle, rewrite?: NewsAiRewrite) => {
    const item: SavedNewsItem = {
      id: `saved-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: rewrite?.selectedTitle || art.title,
      url: art.url,
      source: art.source,
      category: art.category,
      savedAt: new Date().toISOString(),
      publishedAt: art.publishedAt,
      imageUrl: art.imageUrl,
      media: art.media || null,
      summary: art.summary,
      rewrite: rewrite || null
    };
    const updated = saveNewsItemToLibrary(item);
    setSavedLibrary(updated);
    showToast('Saved to News Library!');
  };

  const handleDeleteSavedItem = (id: string) => {
    const updated = deleteSavedNewsItem(id);
    setSavedLibrary(updated);
    showToast('Removed from News Library.');
  };

  // Save Library item directly into Drafts with NEWS badge
  const handleSaveLibraryItemAsDraft = (item: SavedNewsItem) => {
    const newDraft: SocialPost = {
      id: `draft-news-${Date.now()}`,
      title: item.rewrite?.selectedTitle || item.title,
      caption: item.rewrite?.facebookCaption || item.summary || item.title,
      description: item.rewrite?.shortDescription || item.summary,
      hashtags: item.rewrite?.hashtags?.facebook || [],
      media: (item.media && item.media.type !== 'none') ? {
        id: (item.media as any).id || `media-${Date.now()}`,
        name: (item.title || 'Discovered Media').slice(0, 30),
        type: item.media.type === 'video' ? 'video' : 'image',
        url: item.media.url,
        thumbnailUrl: item.media.thumbnailUrl,
        source: 'local'
      } : item.imageUrl ? {
        id: `media-${Date.now()}`,
        name: (item.title || 'News Cover').slice(0, 30),
        type: 'image',
        url: item.imageUrl,
        source: 'local'
      } : null,
      selectedPlatforms: [],
      selectedDestinationIds: [],
      selectedGroupId: null,
      createdAt: new Date().toISOString(),
      isDraft: true,
      platformStatuses: {},
      newsSourceInfo: {
        articleTitle: item.title,
        sourceName: item.source,
        articleUrl: item.url,
        publishedAt: item.publishedAt,
        category: item.category,
        hypeScore: 80,
        summary: item.summary,
        media: item.media || (item.imageUrl ? {
          id: `media-${Date.now()}`,
          type: 'image',
          url: item.imageUrl,
          sourceName: item.source,
          sourceUrl: item.url
        } : null),
        factStatus: 'verified',
        includeSourceNameInCaption: true,
        includeArticleLinkInCaption: false,
        generatedTitles: item.rewrite ? [
          { type: 'Viral Hook', title: item.rewrite.selectedTitle || item.title },
          { type: 'Straightforward News', title: item.title }
        ] : undefined
      }
    };

    if (onSaveDraftDirectly) {
      onSaveDraftDirectly(newDraft);
      showToast('Saved directly to Drafts with NEWS badge!');
    }
  };

  // Open Create Post with News payload (NEWS → CONTENT FACTORY)
  const handleCreatePostFromNews = (
    art: NewsArticle,
    rewrite?: NewsAiRewrite,
    customTitle?: string
  ) => {
    const titleToUse = customTitle || rewrite?.selectedTitle || art.title;
    const descToUse = rewrite?.shortDescription || art.summary || art.title;

    onCreatePostWithNews({
      title: titleToUse,
      description: descToUse,
      sourceUrl: art.url,
      sourceName: art.source,
      publishedAt: art.publishedAt,
      hypeScore: art.hypeScore || 80,
      summary: art.summary,
      imageUrl: art.imageUrl,
      media: art.media || (art.imageUrl ? {
        id: `media-${Date.now()}`,
        type: 'image',
        url: art.imageUrl,
        sourceName: art.source,
        sourceUrl: art.url,
        status: 'downloadable'
      } : null),
      category: art.category,
      rewrite: rewrite,
      factStatus: (art as any).factStatus || 'verified',
      factNotice: (art as any).factNotice,
      platformContent: rewrite ? {
        facebookCaption: rewrite.facebookCaption,
        instagramCaption: rewrite.instagramCaption,
        tiktokCaption: `${rewrite.tiktokHook ? `${rewrite.tiktokHook}\n\n` : ''}${rewrite.tiktokCaption}`,
        youtubeTitle: rewrite.youtubeTitle,
        youtubeDescription: rewrite.youtubeDescription,
        twitterCaption: rewrite.xPost,
        whatsappCaption: rewrite.whatsappMessage,
        hashtags: rewrite.hashtags?.facebook || []
      } : undefined
    });
  };

  // Filtered clusters with Media Hunter filters
  const filteredClusters = useMemo(() => {
    return clusters.filter(cl => {
      // Category filter
      if (selectedCategory !== 'All Categories') {
        const matchesCategory = cl.articles.some(
          a => a.category.toLowerCase() === selectedCategory.toLowerCase()
        );
        if (!matchesCategory) return false;
      }

      // Hype filter
      if (hypeFilter > 0 && cl.averageHypeScore < hypeFilter) {
        return false;
      }

      // Media filter (Requirement #6)
      if (mediaFilter !== 'all') {
        const hasImage = cl.articles.some(a => a.media?.type === 'image' || (!a.media && a.imageUrl));
        const hasVideo = cl.articles.some(a => a.media?.type === 'video');
        const hasAnyMedia = hasImage || hasVideo;

        if (mediaFilter === 'image' && !hasImage) return false;
        if (mediaFilter === 'video' && !hasVideo) return false;
        if (mediaFilter === 'no_media' && hasAnyMedia) return false;
      }

      // Downloadable only filter (Requirement #6)
      if (onlyDownloadable) {
        const hasDownloadable = cl.articles.some(
          a => a.media && a.media.status === 'downloadable' && !isRestrictedSourceUrl(a.media.url)
        );
        if (!hasDownloadable) return false;
      }

      // Search keyword
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTopic = cl.mainTopic.toLowerCase().includes(q);
        const inArticles = cl.articles.some(
          a => a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q) || a.source.toLowerCase().includes(q)
        );
        if (!inTopic && !inArticles) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'hype') return b.averageHypeScore - a.averageHypeScore;
      if (sortBy === 'sources') return b.sourcesCount - a.sourcesCount;
      const timeA = new Date(a.representativeArticle.publishedAt).getTime();
      const timeB = new Date(b.representativeArticle.publishedAt).getTime();
      return timeB - timeA;
    });
  }, [clusters, selectedCategory, hypeFilter, mediaFilter, onlyDownloadable, searchQuery, sortBy]);

  const categories: NewsCategory[] = [
    'All Categories',
    'Hype / Viral',
    'Nasional',
    'Internasional',
    'Sepakbola',
    'Persib',
    'Teknologi',
    'Ekonomi',
    'Lifestyle',
    'Adventure'
  ];

  return (
    <div className="space-y-5 pb-24 animate-fadeIn">
      
      {/* Toast */}
      {successToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-700 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* SECTION 1: HEADER & STATUS */}
      <div className="bg-gradient-to-br from-indigo-900/40 via-purple-900/30 to-slate-900/40 border border-indigo-500/20 rounded-3xl p-4.5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                NEWS HUNTER
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                  DISCOVERY & REWRITE
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  ONLINE REQUIRED
                </span>
              </h1>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>
                  {lastHuntTime 
                    ? `Last Hunt: ${new Date(lastHuntTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, ${new Date(lastHuntTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}` 
                    : 'No news hunted yet'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsSourcesModalOpen(true)}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-white/80 dark:bg-slate-800/80 hover:bg-white border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>RSS Sources</span>
          </button>
        </div>

        {/* Action Controls & Hunt Now */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {/* Category Dropdown */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Discovery Mode Selector */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Discovery Mode
            </label>
            <div className="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setDiscoveryMode('rss_only')}
                className={`text-[11px] font-bold py-1.5 rounded-lg transition-all ${
                  discoveryMode === 'rss_only'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                RSS Only
              </button>
              <button
                type="button"
                onClick={() => setDiscoveryMode('rss_web')}
                className={`text-[11px] font-bold py-1.5 rounded-lg transition-all ${
                  discoveryMode === 'rss_web'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                RSS + Web Search
              </button>
            </div>
          </div>
        </div>

        {/* X Trending Toggle & Notice */}
        <div className="pt-1 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              X Trending
            </span>
            <span className="text-[10px] text-slate-400">
              (Live trend stream)
            </span>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={xTrendingActive}
              onChange={e => setXTrendingActive(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {/* X Trending Warning when checked (Requirement #5) */}
        {xTrendingActive && (
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">X Trending unavailable — valid X API/access is required.</div>
              <p className="mt-0.5 text-slate-600 dark:text-slate-300">
                News Hunter continues operating normally with verified RSS sources and Web Search without X.
              </p>
            </div>
          </div>
        )}

        {/* Hunt Now Primary Button */}
        <div className="flex items-center gap-2 pt-1">
          <button
            id="btn-hunt-now"
            type="button"
            disabled={isHunting}
            onClick={handleHuntNow}
            className="flex-1 py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            {isHunting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Hunting News from {sources.filter(s => s.active).length} Sources...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Hunt Now ({selectedCategory})</span>
              </>
            )}
          </button>

          {articles.length > 0 && (
            <button
              type="button"
              onClick={handleClearCache}
              title="Clear News Cache"
              className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors shadow-sm"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* SECTION: AUTO HUNT DASHBOARD & RESULTS (Requirement #8, #9, #13, #14, #15, #16) */}
      <div className="bg-white dark:bg-slate-900 border border-indigo-500/20 rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className={`w-3 h-3 rounded-full shrink-0 ${
              autoHuntSettings.status === 'on' 
                ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50 animate-pulse' 
                : autoHuntSettings.status === 'paused' 
                ? 'bg-amber-500' 
                : 'bg-slate-400'
            }`} />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black tracking-wide text-slate-900 dark:text-white uppercase">
                  AUTO HUNT
                </span>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                  autoHuntSettings.status === 'on' 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : autoHuntSettings.status === 'paused'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  Status: {autoHuntSettings.status.toUpperCase()}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  (Every {autoHuntSettings.interval})
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Automatically checks configured news sources for new stories on schedule, without publishing anything.
              </p>
            </div>
          </div>

          {/* Quick Action Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="btn-auto-hunt-hunt-now"
              type="button"
              disabled={isHunting || isAutoHunting}
              onClick={handleManualAutoHuntNow}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAutoHunting ? 'animate-spin' : ''}`} />
              <span>{isAutoHunting ? 'Hunting...' : 'Hunt Now'}</span>
            </button>

            <button
              id="btn-auto-hunt-pause-toggle"
              type="button"
              onClick={handlePauseResumeAutoHunt}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                autoHuntSettings.status === 'on'
                  ? 'border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                  : 'border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
              }`}
            >
              {autoHuntSettings.status === 'on' ? 'Pause' : 'Resume'}
            </button>

            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                Settings
              </button>
            )}
          </div>
        </div>

        {/* Dashboard Metrics (Requirement #13) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Next Hunt</div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 font-mono">
              {autoHuntSettings.status === 'on' && autoHuntSettings.nextHuntTimestamp
                ? new Date(autoHuntSettings.nextHuntTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : autoHuntSettings.status === 'paused' ? 'Paused' : 'Off'}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Last Hunt</div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 font-mono truncate">
              {autoHuntResult?.timestamp
                ? new Date(autoHuntResult.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'None yet'}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">New Stories</div>
            <div className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5 font-mono flex items-center gap-1.5">
              <span>{unviewedCount}</span>
              {unviewedCount > 0 && (
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-bold animate-pulse">
                  NEW
                </span>
              )}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">High Priority</div>
            <div className="text-xs font-extrabold text-rose-600 dark:text-rose-400 mt-0.5 font-mono">
              {autoHuntResult?.highPriorityCount ?? 0} stories
            </div>
          </div>
        </div>

        {/* Auto Hunt Result Summary Card (Requirement #8) */}
        {autoHuntResult && (
          <div className="bg-slate-50/80 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                AUTO HUNT RESULT
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {new Date(autoHuntResult.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(autoHuntResult.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60">
                <div className="text-[10px] text-slate-400">Sources Checked</div>
                <div className="font-extrabold text-slate-800 dark:text-white mt-0.5 font-mono">{autoHuntResult.sourcesChecked}</div>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60">
                <div className="text-[10px] text-slate-400">New Stories</div>
                <div className="font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">+{autoHuntResult.newStoriesCount}</div>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60">
                <div className="text-[10px] text-slate-400">Clusters</div>
                <div className="font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5 font-mono">{autoHuntResult.clustersFormed}</div>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60">
                <div className="text-[10px] text-slate-400">Duplicates Ignored</div>
                <div className="font-extrabold text-slate-500 mt-0.5 font-mono">{autoHuntResult.duplicatesIgnored}</div>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60">
                <div className="text-[10px] text-slate-400">Errors</div>
                <div className={`font-extrabold mt-0.5 font-mono ${autoHuntResult.errorsCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'}`}>
                  {autoHuntResult.errorsCount}
                </div>
              </div>
            </div>

            {autoHuntResult.errors && autoHuntResult.errors.length > 0 && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-rose-600 dark:text-rose-400">
                  {autoHuntResult.errors.length} source(s) could not be reached.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveErrorsList(autoHuntResult.errors || []);
                    setIsSourceErrorsModalOpen(true);
                  }}
                  className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline"
                >
                  View Source Errors →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Mark All as Viewed Action (Requirement #9) */}
        {unviewedCount > 0 && (
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 gap-2 flex-wrap">
            <div className="text-xs text-indigo-900 dark:text-indigo-200">
              You have <strong>{unviewedCount}</strong> new unviewed stories from Auto Hunt.
            </div>
            <button
              type="button"
              onClick={handleMarkAllViewed}
              className="px-3 py-1 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 shadow-xs"
            >
              Mark All as Viewed
            </button>
          </div>
        )}
      </div>

      {/* Source Fetching Errors (Requirement #3 & #17) */}
      {sourceErrors.length > 0 && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 rounded-2xl space-y-1.5">
          <div className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Notice: {sourceErrors.length} source(s) could not be reached</span>
          </div>
          <div className="text-[11px] text-rose-700 dark:text-rose-400 space-y-0.5">
            {sourceErrors.slice(0, 3).map((err, i) => (
              <div key={i}>• {err.sourceName}: {err.error}</div>
            ))}
            {sourceErrors.length > 3 && (
              <div>• ...and {sourceErrors.length - 3} more sources.</div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: VIEW TABS (DISCOVERED vs NEWS LIBRARY) */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('hunt')}
            className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'hunt'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Discovered Stories ({filteredClusters.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('library')}
            className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'library'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>News Library ({savedLibrary.length})</span>
          </button>
        </div>
      </div>

      {/* SECTION 3: TAB CONTENT */}
      {activeTab === 'hunt' ? (
        <div className="space-y-4">
          {/* Filters & Search Toolbar */}
          {clusters.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 space-y-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search discovered stories..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="text-xs font-semibold px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
                >
                  <option value="hype">Highest Hype</option>
                  <option value="newest">Newest</option>
                  <option value="sources">Most Sources</option>
                </select>
              </div>

              {/* Hype Score Pill Filters */}
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Hype:
                </span>
                {[
                  { label: 'All', val: 0 },
                  { label: '50+', val: 50 },
                  { label: '70+', val: 70 },
                  { label: '85+ (Viral)', val: 85 }
                ].map(h => (
                  <button
                    key={h.val}
                    type="button"
                    onClick={() => setHypeFilter(h.val)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      hypeFilter === h.val
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {h.label}
                  </button>
                ))}
              </div>

              {/* Media Filter Pills & Downloadable Toggle (Requirement #6) */}
              <div className="flex items-center justify-between gap-2 flex-wrap pt-2.5 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                  <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
                    <Film className="w-3 h-3 text-indigo-500" /> Media:
                  </span>
                  {[
                    { label: 'All Media', val: 'all' as const },
                    { label: 'Images Only', val: 'image' as const },
                    { label: 'Videos Only', val: 'video' as const },
                    { label: 'No Media', val: 'no_media' as const }
                  ].map(m => (
                    <button
                      key={m.val}
                      type="button"
                      onClick={() => {
                        setMediaFilter(m.val);
                        const updated = { ...settings, mediaFilter: m.val };
                        setSettings(updated);
                        saveNewsSettings(updated);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        mediaFilter === m.val
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !onlyDownloadable;
                    setOnlyDownloadable(nextVal);
                    const updated = { ...settings, onlyDownloadableMedia: nextVal };
                    setSettings(updated);
                    saveNewsSettings(updated);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                    onlyDownloadable
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Check className={`w-3 h-3 ${onlyDownloadable ? 'opacity-100' : 'opacity-40'}`} />
                  <span>Downloadable Only</span>
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {clusters.length === 0 && !isHunting && (
            <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                No Stories Hunted Yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                Tap "Hunt Now" to scan active RSS feeds and web discovery for {selectedCategory}.
              </p>
              <button
                type="button"
                onClick={handleHuntNow}
                className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-sm"
              >
                Hunt Now
              </button>
            </div>
          )}

          {/* Story Cards List with Media Preview & Pagination */}
          <div className="space-y-3">
            {filteredClusters.slice(0, visibleCount).map(cluster => {
              const art = cluster.representativeArticle;
              const hasMultipleSources = cluster.sourcesCount > 1;
              const priority = getStoryPriority(cluster.averageHypeScore);
              const eventStatus = getStoryEventStatus(art, cluster);

              return (
                <div
                  key={cluster.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm hover:border-indigo-500/40 transition-all"
                >
                  {/* Card Top: Hype Score, Priority, Status, Category (Requirement #10, #11) */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Hype Score */}
                      <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 rounded-lg">
                        <Flame className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        <span className="text-[11px] font-extrabold text-amber-700 dark:text-amber-400">
                          {cluster.averageHypeScore}/100
                        </span>
                      </div>

                      {/* Priority Label (Requirement #10) */}
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg uppercase border ${priority.colorClass}`}>
                        {priority.badge}
                      </span>

                      {/* Event Status Tag (Requirement #11) */}
                      {eventStatus.status !== 'confirmed' && (
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg flex items-center gap-1 uppercase shadow-xs ${eventStatus.badgeClass}`}>
                          {eventStatus.status === 'breaking' && <Zap className="w-2.5 h-2.5" />}
                          {eventStatus.status === 'developing' && <Radio className="w-2.5 h-2.5" />}
                          {eventStatus.status === 'differing' && <AlertCircle className="w-2.5 h-2.5" />}
                          <span>
                            {eventStatus.label}
                          </span>
                        </span>
                      )}

                      {/* Category Badge */}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {art.category}
                      </span>
                    </div>

                    {/* Sources Badge & Differing Action */}
                    <div className="flex items-center gap-1.5">
                      {eventStatus.status === 'differing' && (
                        <button
                          type="button"
                          onClick={() => setActiveCluster(cluster)}
                          className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-0.5"
                        >
                          Compare Sources →
                        </button>
                      )}
                      <span 
                        onClick={() => hasMultipleSources && setActiveCluster(cluster)}
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          hasMultipleSources 
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 cursor-pointer hover:bg-indigo-100' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        Sources: {cluster.sourcesCount}
                      </span>
                    </div>
                  </div>

                  {/* Mandatory disclaimer on hype score */}
                  <div className="text-[10px] text-slate-400 italic">
                    Internal topic momentum score — not an official popularity measurement.
                  </div>

                  {/* Media Discovery Preview (Requirement #2, #3, #4) */}
                  {art.media ? (
                    <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-200/80 dark:border-slate-800 group my-1">
                      {art.media.type === 'video' ? (
                        <div 
                          onClick={() => setSelectedMediaViewer({
                            media: art.media!,
                            articleTitle: art.title,
                            sourceName: art.source,
                            sourceUrl: art.url
                          })}
                          className="relative cursor-pointer aspect-video w-full bg-slate-900 flex items-center justify-center overflow-hidden"
                        >
                          {art.media.thumbnailUrl ? (
                            <img 
                              src={art.media.thumbnailUrl} 
                              alt={art.title} 
                              loading="lazy"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-slate-400 p-4">
                              <Film className="w-8 h-8 text-rose-400" />
                              <span className="text-xs font-semibold">Video Preview Available</span>
                            </div>
                          )}
                          {/* Play Icon Overlay */}
                          <div className="absolute inset-0 bg-black/35 flex items-center justify-center group-hover:bg-black/25 transition-colors">
                            <div className="w-11 h-11 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                              <Play className="w-5 h-5 ml-0.5 fill-current" />
                            </div>
                          </div>
                          {/* Video Duration Badge */}
                          {art.media.durationSeconds && (
                            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-black/75 text-white text-[10px] font-mono font-bold flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              <span>{Math.floor(art.media.durationSeconds / 60)}:{String(art.media.durationSeconds % 60).padStart(2, '0')}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div 
                          onClick={() => setSelectedMediaViewer({
                            media: art.media!,
                            articleTitle: art.title,
                            sourceName: art.source,
                            sourceUrl: art.url
                          })}
                          className="relative cursor-pointer max-h-56 sm:max-h-64 w-full bg-slate-900 flex items-center justify-center overflow-hidden"
                        >
                          <img 
                            src={art.media.url} 
                            alt={art.title} 
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover max-h-56 sm:max-h-64 group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}

                      {/* Media Status and Type Badges */}
                      <div className="absolute top-2 left-2 flex items-center gap-1.5 flex-wrap pointer-events-none">
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm ${
                          art.media.type === 'video'
                            ? 'bg-rose-600 text-white'
                            : 'bg-indigo-600 text-white'
                        }`}>
                          {art.media.type === 'video' ? <Film className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                          <span>{art.media.type === 'video' ? 'Video' : 'Image'}</span>
                        </span>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm ${
                          art.media.status === 'downloadable'
                            ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/40'
                            : art.media.status === 'preview_only'
                            ? 'bg-amber-950/90 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-950/90 text-slate-300 border border-slate-600/40'
                        }`}>
                          {art.media.status === 'downloadable' ? 'Downloadable' : art.media.status === 'preview_only' ? 'Preview Only' : 'Source Only'}
                        </span>
                      </div>

                      {/* Media Source Attribution Footer */}
                      <div className="px-3 py-1.5 bg-slate-900/90 backdrop-blur-xs flex items-center justify-between text-[10px] text-slate-300 border-t border-slate-800">
                        <span className="truncate max-w-[200px]">
                          Media: <strong className="text-white">{art.media.sourceName || art.source}</strong>
                        </span>
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMediaViewer({
                              media: art.media!,
                              articleTitle: art.title,
                              sourceName: art.source,
                              sourceUrl: art.url
                            });
                          }}
                          className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                        >
                          <span>Open Viewer</span>
                          <Maximize2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  ) : art.imageUrl ? (
                    <div 
                      onClick={() => setSelectedMediaViewer({
                        media: {
                          id: `img-${art.id}`,
                          type: 'image',
                          url: art.imageUrl!,
                          sourceName: art.source,
                          sourceUrl: art.url,
                          status: 'downloadable'
                        },
                        articleTitle: art.title,
                        sourceName: art.source,
                        sourceUrl: art.url
                      })}
                      className="relative cursor-pointer rounded-2xl overflow-hidden bg-slate-950 border border-slate-200/80 dark:border-slate-800 max-h-56 group my-1"
                    >
                      <img 
                        src={art.imageUrl} 
                        alt={art.title} 
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover max-h-56 group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 left-2 pointer-events-none">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-indigo-600 text-white flex items-center gap-1 shadow-sm">
                          <ImageIcon className="w-3 h-3" />
                          <span>Image</span>
                        </span>
                      </div>
                    </div>
                  ) : null}

                  {/* Title */}
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {cluster.mainTopic}
                  </h3>

                  {/* Metadata: Source + Published */}
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-3 flex-wrap">
                    <span>
                      <strong className="text-slate-700 dark:text-slate-300">Source:</strong> {art.source}
                    </span>
                    <span>•</span>
                    <span>
                      <strong className="text-slate-700 dark:text-slate-300">Published:</strong> {new Date(art.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {art.sourceType && (
                      <>
                        <span>•</span>
                        <span className="font-semibold uppercase text-indigo-500">{art.sourceType}</span>
                      </>
                    )}
                  </div>

                  {/* Summary */}
                  {art.summary && art.summary !== cluster.mainTopic && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl">
                      {art.summary}
                    </p>
                  )}

                  {/* Card Action Buttons (Requirement #9) */}
                  <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* View Source */}
                      <a
                        href={art.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <span>View Source</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      {/* Media Quick Preview Button */}
                      {(art.media || art.imageUrl) && (
                        <button
                          type="button"
                          onClick={() => {
                            if (art.media) {
                              setSelectedMediaViewer({
                                media: art.media,
                                articleTitle: art.title,
                                sourceName: art.source,
                                sourceUrl: art.url
                              });
                            } else if (art.imageUrl) {
                              setSelectedMediaViewer({
                                media: {
                                  id: `img-${art.id}`,
                                  type: 'image',
                                  url: art.imageUrl,
                                  sourceName: art.source,
                                  sourceUrl: art.url,
                                  status: 'downloadable'
                                },
                                articleTitle: art.title,
                                sourceName: art.source,
                                sourceUrl: art.url
                              });
                            }
                          }}
                          className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                        >
                          {art.media?.type === 'video' ? <Film className="w-3 h-3 text-rose-500" /> : <ImageIcon className="w-3 h-3 text-indigo-500" />}
                          <span>Media</span>
                        </button>
                      )}

                      {/* View Cluster */}
                      {hasMultipleSources && (
                        <button
                          type="button"
                          onClick={() => setActiveCluster(cluster)}
                          className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1.5 rounded-lg flex items-center gap-1 hover:bg-indigo-100"
                        >
                          <Layers className="w-3 h-3" />
                          <span>View Cluster ({cluster.sourcesCount})</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Rewrite */}
                      <button
                        type="button"
                        onClick={() => {
                          setRewriteArticle(art);
                          setRewriteCluster(cluster);
                          setInitialRewriteData(null);
                        }}
                        className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-sm"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Rewrite</span>
                      </button>

                      {/* Save */}
                      <button
                        type="button"
                        onClick={() => handleSaveToLibrary(art)}
                        className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Save to News Library"
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                      </button>

                      {/* Create Post */}
                      <button
                        type="button"
                        onClick={() => handleCreatePostFromNews(art)}
                        className="text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-sm"
                      >
                        <span>Create Post</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Show More Pagination Button */}
          {filteredClusters.length > visibleCount && (
            <div className="text-center pt-2 pb-1">
              <button
                type="button"
                onClick={() => setVisibleCount(prev => prev + 20)}
                className="px-5 py-2.5 rounded-2xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800/60 transition-all shadow-xs"
              >
                Show More Stories ({filteredClusters.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>
      ) : (
        /* SECTION 4: NEWS LIBRARY TAB (Requirement #14) */
        <div className="space-y-3">
          {savedLibrary.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-3">
              <Bookmark className="w-8 h-8 mx-auto text-slate-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                News Library is Empty
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                Save stories or generated rewrites from the Discovered Stories tab to access them anytime here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedLibrary.map(item => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                        {item.category}
                      </span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {item.source}
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-400 font-mono">
                      Saved {new Date(item.savedAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Media Discovery Preview in Saved Library (Requirement #14 & #3) */}
                  {item.media ? (
                    <div 
                      onClick={() => setSelectedMediaViewer({
                        media: item.media!,
                        articleTitle: item.title,
                        sourceName: item.source,
                        sourceUrl: item.url
                      })}
                      className="relative cursor-pointer rounded-xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-slate-800 max-h-48 group my-1"
                    >
                      <img 
                        src={item.media.type === 'video' ? (item.media.thumbnailUrl || item.media.url) : item.media.url} 
                        alt={item.title} 
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover max-h-48 group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 left-2 flex items-center gap-1.5">
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md flex items-center gap-1 ${
                          item.media.type === 'video' ? 'bg-rose-600 text-white' : 'bg-indigo-600 text-white'
                        }`}>
                          {item.media.type === 'video' ? <Film className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                          <span>{item.media.type === 'video' ? 'Video' : 'Image'}</span>
                        </span>
                      </div>
                      {item.media.type === 'video' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20">
                          <div className="w-9 h-9 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-md">
                            <Play className="w-4 h-4 ml-0.5 fill-current" />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : item.imageUrl ? (
                    <div 
                      onClick={() => setSelectedMediaViewer({
                        media: {
                          id: `img-${item.id}`,
                          type: 'image',
                          url: item.imageUrl!,
                          sourceName: item.source,
                          sourceUrl: item.url,
                          status: 'downloadable'
                        },
                        articleTitle: item.title,
                        sourceName: item.source,
                        sourceUrl: item.url
                      })}
                      className="relative cursor-pointer rounded-xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-slate-800 max-h-48 group my-1"
                    >
                      <img 
                        src={item.imageUrl} 
                        alt={item.title} 
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover max-h-48 group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : null}

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {item.title}
                  </h3>

                  {item.summary && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl">
                      {item.summary}
                    </p>
                  )}

                    {/* Actions: Rewrite Again, Create Post, Save Draft, View Source */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <span>View Source</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>

                        {(item.media || item.imageUrl) && (
                          <button
                            type="button"
                            onClick={() => {
                              if (item.media) {
                                setSelectedMediaViewer({
                                  media: item.media,
                                  articleTitle: item.title,
                                  sourceName: item.source,
                                  sourceUrl: item.url
                                });
                              } else if (item.imageUrl) {
                                setSelectedMediaViewer({
                                  media: {
                                    id: `img-${item.id}`,
                                    type: 'image',
                                    url: item.imageUrl,
                                    sourceName: item.source,
                                    sourceUrl: item.url,
                                    status: 'downloadable'
                                  },
                                  articleTitle: item.title,
                                  sourceName: item.source,
                                  sourceUrl: item.url
                                });
                              }
                            }}
                            className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 px-2 py-1 rounded-lg flex items-center gap-1"
                          >
                            {item.media?.type === 'video' ? <Film className="w-3 h-3 text-rose-500" /> : <ImageIcon className="w-3 h-3 text-indigo-500" />}
                            <span>View Media</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Rewrite Again */}
                        <button
                          type="button"
                          onClick={() => {
                            setRewriteArticle({
                              id: item.id,
                              title: item.title,
                              url: item.url,
                              source: item.source,
                              category: item.category,
                              publishedAt: item.publishedAt,
                              summary: item.summary,
                              sourceType: 'RSS',
                              discoveredAt: item.savedAt,
                              media: item.media || null,
                              imageUrl: item.imageUrl || null,
                              hypeScore: 80
                            });
                            setInitialRewriteData(item.rewrite || null);
                          }}
                          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition-colors"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>{item.rewrite ? 'Rewrite Again' : 'Rewrite'}</span>
                        </button>

                        {/* Save Draft */}
                        <button
                          type="button"
                          onClick={() => handleSaveLibraryItemAsDraft(item)}
                          className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition-colors"
                          title="Directly save as draft with NEWS badge"
                        >
                          <BookmarkCheck className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Save Draft</span>
                        </button>

                        {/* Create Post */}
                        <button
                          type="button"
                          onClick={() => {
                            onCreatePostWithNews({
                              title: item.rewrite?.selectedTitle || item.title,
                              description: item.rewrite?.shortDescription || item.summary,
                              sourceUrl: item.url,
                              sourceName: item.source,
                              publishedAt: item.publishedAt,
                              hypeScore: 80,
                              summary: item.summary,
                              category: item.category,
                              imageUrl: item.imageUrl,
                              media: item.media || (item.imageUrl ? {
                                id: `media-${item.id}`,
                                type: 'image',
                                url: item.imageUrl,
                                sourceName: item.source,
                                sourceUrl: item.url,
                                status: 'downloadable'
                              } : null),
                              rewrite: item.rewrite,
                              factStatus: 'verified',
                              platformContent: item.rewrite ? {
                                facebookCaption: item.rewrite.facebookCaption,
                                instagramCaption: item.rewrite.instagramCaption,
                                tiktokCaption: item.rewrite.tiktokCaption,
                                youtubeTitle: item.rewrite.youtubeTitle,
                                youtubeDescription: item.rewrite.youtubeDescription,
                                twitterCaption: item.rewrite.xPost,
                                whatsappCaption: item.rewrite.whatsappMessage,
                                hashtags: item.rewrite.hashtags?.facebook || []
                              } : undefined
                            });
                          }}
                          className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-sm transition-all"
                        >
                          <span>Create Post</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>

                        {/* Delete from library */}
                        <button
                          type="button"
                          onClick={() => handleDeleteSavedItem(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                          title="Delete saved item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODALS */}
      {/* 1. RSS Sources Manager Modal */}
      <NewsSourcesModal
        isOpen={isSourcesModalOpen}
        onClose={() => setIsSourcesModalOpen(false)}
        sources={sources}
        onSaveSources={handleSaveSources}
      />

      {/* 2. Story Cluster Modal */}
      <StoryClusterModal
        isOpen={!!activeCluster}
        onClose={() => setActiveCluster(null)}
        cluster={activeCluster}
        onRewrite={(art, cl) => {
          setRewriteArticle(art);
          setRewriteCluster(cl);
          setInitialRewriteData(null);
        }}
        onCreatePost={(art, cl) => handleCreatePostFromNews(art, undefined, cl?.mainTopic)}
      />

      {/* 3. AI Rewrite Modal */}
      <NewsRewriteModal
        isOpen={!!rewriteArticle}
        onClose={() => {
          setRewriteArticle(null);
          setRewriteCluster(null);
          setInitialRewriteData(null);
        }}
        article={rewriteArticle}
        cluster={rewriteCluster}
        initialRewrite={initialRewriteData}
        onCreatePost={(art, rw, title) => {
          setRewriteArticle(null);
          handleCreatePostFromNews(art, rw, title);
        }}
        onSaveToLibrary={(art, rw) => {
          handleSaveToLibrary(art, rw);
        }}
      />

      {/* 4. Media Viewer Modal (Requirement #3 & #4) */}
      {selectedMediaViewer && (
        <MediaViewerModal
          media={selectedMediaViewer.media}
          articleTitle={selectedMediaViewer.articleTitle}
          sourceName={selectedMediaViewer.sourceName}
          sourceUrl={selectedMediaViewer.sourceUrl}
          downloadLimitMb={settings.mediaDownloadLimitMb ?? 25}
          onClose={() => setSelectedMediaViewer(null)}
          onOpenSettings={onOpenSettings}
        />
      )}

      {/* 5. Auto Hunt Source Errors Modal (Requirement #8, #17) */}
      {isSourceErrorsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Source Connection Notices ({activeErrorsList.length})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Sources skipped during discovery without halting the hunt
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSourceErrorsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {activeErrorsList.map((err, idx) => (
                <div 
                  key={idx}
                  className="p-2.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-xs space-y-0.5"
                >
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    {err.sourceName}
                  </div>
                  <div className="text-[11px] text-rose-600 dark:text-rose-400 font-mono">
                    {err.error}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl">
              <strong>Notice:</strong> These sources may be temporarily experiencing rate limits, CORS restrictions, or server outages. They will be retried automatically on the next scheduled hunt.
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsSourceErrorsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

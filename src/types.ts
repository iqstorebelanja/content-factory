export type PlatformId = 
  | 'facebook_page' 
  | 'facebook_profile'
  | 'instagram' 
  | 'tiktok' 
  | 'youtube' 
  | 'twitter' 
  | 'whatsapp'
  | 'facebook'; // backwards-compatible alias

export type PostStatus = 
  | 'READY' 
  | 'COPIED'
  | 'OPENED' 
  | 'SHARED' 
  | 'COMPLETED'
  | 'SKIPPED'
  | 'FAILED';

export type FacebookContentType = 'post' | 'reel';

export type ShareDestinationStatus = 
  | 'Ready'
  | 'Sharing'
  | 'Waiting for user'
  | 'Completed'
  | 'Skipped'
  | 'Error';

export type DestinationContentType = 
  | 'post' 
  | 'reel' 
  | 'video' 
  | 'short' 
  | 'tweet' 
  | 'message';

export interface ShareSessionDestination {
  id: string; // unique destination account id or platformId
  platformId: PlatformId;
  name: string;
  accountName?: string;
  accountIdentifier?: string;
  url?: string;
  contentType: DestinationContentType;
  status: ShareDestinationStatus;
  statusNote?: string;
  completedAt?: string;
  copiedCaption?: boolean;
  openedPlatform?: boolean;
  captionPayload?: string;
}

export interface ShareSession {
  id: string;
  postId: string;
  post: SocialPost;
  startedAt: string;
  updatedAt: string;
  currentDestinationIndex: number;
  destinations: ShareSessionDestination[];
  isComplete: boolean;
  isPaused?: boolean;
  isFromDraft?: boolean;
  groupId?: string | null;
  groupName?: string | null;
}

export interface PlatformConfig {
  id: PlatformId;
  name: string;
  badge: string;
  color: string;
  bgColor: string;
  accentColor: string;
  iconName: string;
  supportsImage: boolean;
  supportsVideo: boolean;
  maxHashtags: number;
  playStoreUrl: string;
  packageName: string;
  deepLinkScheme: string;
  webShareUrl?: (text: string, mediaUrl?: string) => string;
  apiPublishSupported: boolean;
  defaultStatus: 'Connected' | 'Not Connected' | 'Authorization Required' | 'Unavailable';
}

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  name: string;
  url: string;
  thumbnailUrl?: string;
  sizeBytes?: number;
  durationSeconds?: number;
  width?: number;
  height?: number;
  source?: 'local' | 'drive' | 'sample';
}

export interface PlatformCustomContent {
  title?: string;
  caption?: string;
  description?: string;
  hook?: string;
  opening?: string;
  tags?: string[];
  hashtags?: string[];
  callToAction?: string;
  contentType?: 'post' | 'reel';
}

export interface SocialPost {
  id: string;
  title: string;
  caption: string;
  description: string;
  hashtags: string[];
  callToAction?: string;
  media?: MediaItem | null;
  selectedPlatforms: PlatformId[];
  selectedDestinationIds?: string[];
  selectedGroupId?: string | null;
  facebookPageContentType?: FacebookContentType;
  facebookProfileContentType?: FacebookContentType;
  destinationContentTypes?: Record<string, FacebookContentType>;
  platformOverrides?: Partial<Record<PlatformId, PlatformCustomContent>>;
  createdAt: string;
  scheduledAt?: string | null;
  platformStatuses: Record<string, {
    status: PostStatus;
    note?: string;
    updatedAt: string;
  }>;
  isDraft?: boolean;
  newsSourceInfo?: {
    sourceName: string;
    articleTitle: string;
    articleUrl: string;
    media?: NewsMediaItem | { id?: string; type: any; url: string; sourceName?: string; sourceUrl?: string; status?: any } | null;
    publishedAt?: string;
    category?: string;
    hypeScore?: number;
    summary?: string;
    mediaSource?: string;
    generatedTitles?: TitleOption[];
    generatedDescriptions?: {
      short?: string;
      medium?: string;
      social?: string;
    };
    factStatus?: 'confirmed' | 'developing' | 'differing' | 'verified';
    factNotice?: string;
    includeSourceNameInCaption?: boolean;
    includeArticleLinkInCaption?: boolean;
  };
}

export interface SocialAccountStatus {
  platformId: PlatformId;
  status: 'Connected' | 'Not Connected' | 'Authorization Required' | 'Unavailable';
  accountName?: string;
  connectedAt?: string;
  avatarUrl?: string;
}

export interface AppSettings {
  language: string;
  timezone: string;
  notificationEnabled: boolean;
  isExpoGoMode: boolean; // Expo Go compatibility flag
  hasDevBuild: boolean;
  defaultHashtags: string[];
  theme: 'dark' | 'light' | 'system';
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  webViewLink?: string;
  webContentLink?: string;
  size?: string;
}

// Platform Account Items for Multiple Accounts Support
export interface FacebookPageAccount {
  id: string;
  pageName: string;
  pageUrl: string;
}

export interface FacebookProfileAccount {
  id: string;
  profileName: string;
  profileUrl: string;
}

export interface InstagramAccount {
  id: string;
  username: string;
  profileUrl: string;
}

export interface TikTokAccount {
  id: string;
  username: string;
  profileUrl: string;
}

export interface YouTubeChannelAccount {
  id: string;
  channelName: string;
  channelUrl: string;
}

export interface TwitterAccount {
  id: string;
  username: string;
  profileUrl: string;
}

export interface WhatsAppAccount {
  id: string;
  name: string; // Account/Contact Name
  phoneNumber: string;
  waLink?: string;
}

export interface UserSocialAccounts {
  facebook_page: FacebookPageAccount[];
  facebook_profile: FacebookProfileAccount[];
  instagram: InstagramAccount[];
  tiktok: TikTokAccount[];
  youtube: YouTubeChannelAccount[];
  twitter: TwitterAccount[];
  whatsapp: WhatsAppAccount[];
}

export interface SocialAccountDestination {
  id: string;
  platformId: PlatformId;
  name: string;
  identifier?: string;
  url?: string;
  secondaryInfo?: string;
  isConfigured?: boolean;
}

export const DEFAULT_USER_ACCOUNTS: UserSocialAccounts = {
  facebook_page: [
    {
      id: 'fb-page-1',
      pageName: 'Jangari Adventure & Fishing',
      pageUrl: 'https://facebook.com/jangarioutdoor'
    }
  ],
  facebook_profile: [
    {
      id: 'fb-prof-1',
      profileName: 'Budi Santoso (Personal)',
      profileUrl: 'https://facebook.com/budi.santoso.angler'
    }
  ],
  instagram: [
    {
      id: 'ig-acc-1',
      username: 'jangari_venture',
      profileUrl: 'https://instagram.com/jangari_venture'
    }
  ],
  tiktok: [
    {
      id: 'tt-acc-1',
      username: 'jangari_official',
      profileUrl: 'https://tiktok.com/@jangari_official'
    }
  ],
  youtube: [
    {
      id: 'yt-channel-1',
      channelName: 'Jangari Fishing TV',
      channelUrl: 'https://youtube.com/@jangarifishing'
    }
  ],
  twitter: [
    {
      id: 'x-acc-1',
      username: 'jangariview',
      profileUrl: 'https://x.com/jangariview'
    }
  ],
  whatsapp: [
    {
      id: 'wa-acc-1',
      name: 'Admin Pemancingan',
      phoneNumber: '+6281234567890',
      waLink: 'https://wa.me/6281234567890'
    }
  ]
};

export interface SocialGroup {
  id: string;
  name: string;
  description?: string;
  destinationIds: string[];
  createdAt: string;
  updatedAt?: string;
}

export const DEFAULT_SOCIAL_GROUPS: SocialGroup[] = [
  {
    id: 'group-ngabloeventure',
    name: 'NGABLOEVENTURE',
    description: 'Outdoor fishing & adventure multi-channel brand',
    destinationIds: ['fb-page-1', 'fb-prof-1', 'ig-acc-1', 'tt-acc-1'],
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'group-persib',
    name: 'PERSIB',
    description: 'Supporter & football fanbase network',
    destinationIds: ['fb-page-1', 'fb-prof-1', 'yt-channel-1'],
    createdAt: '2026-01-01T00:00:00.000Z'
  }
];

// ==========================================
// NEWS HUNTER INTERFACES & TYPES
// ==========================================

export type NewsCategory = 
  | 'All Categories'
  | 'Hype / Viral' 
  | 'Nasional' 
  | 'Internasional' 
  | 'Sepakbola' 
  | 'Persib' 
  | 'Teknologi' 
  | 'Ekonomi' 
  | 'Lifestyle' 
  | 'Adventure' 
  | 'Custom';

export type NewsSourceType = 'RSS' | 'WEB' | 'X';
export type NewsMediaType = 'image' | 'video' | 'none';
export type NewsMediaStatus = 'downloadable' | 'preview_only' | 'source_only' | 'no_media';

export interface NewsMediaItem {
  url: string;
  type: NewsMediaType;
  sourceUrl: string;
  sourceName: string;
  title?: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
  mimeType?: string;
  durationSeconds?: number;
  thumbnailUrl?: string;
  status: NewsMediaStatus;
  isDownloadable?: boolean;
  aspectRatio?: string;
}

export interface NewsRssSource {
  id: string;
  name: string;
  url: string;
  category: string;
  active: boolean;
  priority: 'high' | 'medium' | 'low';
  lastTested?: string;
  lastStatus?: 'ok' | 'error' | 'untested';
  errorMessage?: string;
  itemCount?: number;
}

export interface NewsArticle {
  id: string;
  title: string;
  url: string;
  source: string;
  sourceId?: string;
  publishedAt: string;
  summary: string;
  imageUrl?: string | null;
  media?: NewsMediaItem | null;
  category: string;
  sourceType: NewsSourceType;
  discoveredAt: string;
  hypeScore: number;
  hypeSignals?: {
    sourceCount: number;
    freshnessScore: number;
    relevanceScore: number;
    keywordScore: number;
  };
  clusterId?: string;
}

export interface NewsCluster {
  id: string;
  mainTopic: string;
  articles: NewsArticle[];
  sourcesCount: number;
  representativeArticle: NewsArticle;
  averageHypeScore: number;
  factStatus: 'confirmed' | 'developing' | 'differing';
  differingSummary?: string;
}

export interface TitleOption {
  type: 'informative' | 'curiosity' | 'short_viral' | 'seo' | string;
  label?: string;
  title: string;
}

export type NewsTitleOption = TitleOption;

export interface NewsAiRewrite {
  selectedTitle: string;
  titleOptions: TitleOption[];
  shortDescription: string;
  factStatus: 'confirmed' | 'developing' | 'differing';
  factNotice?: string;
  facebookCaption: string;
  instagramCaption: string;
  tiktokHook: string;
  tiktokCaption: string;
  youtubeTitle: string;
  youtubeDescription: string;
  xPost: string;
  whatsappMessage: string;
  hashtags: {
    facebook: string[];
    instagram: string[];
    tiktok: string[];
    youtube: string[];
    x: string[];
  };
}

export interface SavedNewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  category: string;
  savedAt: string;
  publishedAt: string;
  imageUrl?: string | null;
  media?: NewsMediaItem | null;
  summary: string;
  rewrite?: NewsAiRewrite | null;
  selectedPlatforms?: PlatformId[];
}

export interface NewsHunterSettings {
  defaultCategory: string;
  discoveryMode: 'rss_only' | 'rss_web';
  xTrendingEnabled: boolean;
  defaultHypeThreshold: number;
  refreshIntervalMinutes: number;
  xApiKeyConfigured?: boolean;
  mediaDownloadLimitMb: number; // 10, 25 (default), 50, 100, or 0 (unlimited)
  mediaFilter?: 'all' | 'image' | 'video' | 'none';
  onlyDownloadableMedia?: boolean;
}

export type AutoHuntInterval = '15m' | '30m' | '1h' | '3h' | '6h' | '12h' | '24h';
export type AutoHuntStatus = 'off' | 'on' | 'paused';
export type HypeThresholdOption = 'any' | '50' | '70' | '85';

export interface AutoHuntResult {
  lastHuntTime: string;
  sourcesChecked: number;
  newStoriesCount: number;
  updatedClustersCount: number;
  duplicatesIgnoredCount: number;
  errorsCount: number;
  errorDetails?: { sourceName: string; error: string; timestamp: string }[];
}

export interface DiscoveredStoryRecord {
  fingerprint: string;
  url: string;
  title: string;
  normalizedTitle: string;
  sourceId?: string;
  sourceName: string;
  publishedAt: string;
  discoveredAt: string;
  hypeScore: number;
  category: string;
  viewed: boolean;
  clusterId?: string;
}

export interface AutoHuntSettings {
  enabled: boolean;
  status: AutoHuntStatus;
  interval: AutoHuntInterval;
  categories: string[];
  customCategory?: string;
  sources: {
    rss: boolean;
    web: boolean;
    xTrending: boolean;
  };
  minimumHype: HypeThresholdOption;
  notifyOnHighPriority: boolean;
  lastHuntResult?: AutoHuntResult;
  lastHuntTimestamp?: string;
  nextHuntTimestamp?: string;
}

export const DEFAULT_AUTO_HUNT_SETTINGS: AutoHuntSettings = {
  enabled: false,
  status: 'off',
  interval: '3h',
  categories: ['Hype / Viral', 'Nasional', 'Internasional', 'Sepakbola', 'Persib'],
  customCategory: '',
  sources: {
    rss: true,
    web: false,
    xTrending: false
  },
  minimumHype: '70',
  notifyOnHighPriority: true
};

export const DEFAULT_NEWS_HUNTER_SETTINGS: NewsHunterSettings = {
  defaultCategory: 'All Categories',
  discoveryMode: 'rss_web',
  xTrendingEnabled: false,
  defaultHypeThreshold: 60,
  refreshIntervalMinutes: 30,
  xApiKeyConfigured: false,
  mediaDownloadLimitMb: 25,
  mediaFilter: 'all',
  onlyDownloadableMedia: false
};

export const DEFAULT_RSS_SOURCES: NewsRssSource[] = [
  // Persib / Jabar
  {
    id: 'src-detikjabar',
    name: 'detikJabar',
    url: 'https://rss.detik.com/index.php/detikjabar',
    category: 'Persib',
    active: true,
    priority: 'high'
  },
  {
    id: 'src-tribunjabar',
    name: 'Tribun Jabar Persib',
    url: 'https://jabar.tribunnews.com/rss',
    category: 'Persib',
    active: true,
    priority: 'high'
  },
  {
    id: 'src-bolacom-persib',
    name: 'Bola.com Indonesia',
    url: 'https://www.bola.com/feed',
    category: 'Persib',
    active: true,
    priority: 'medium'
  },
  // Sepakbola
  {
    id: 'src-detiksport',
    name: 'detikSport',
    url: 'https://rss.detik.com/index.php/sport',
    category: 'Sepakbola',
    active: true,
    priority: 'high'
  },
  {
    id: 'src-bolasport',
    name: 'BolaSport',
    url: 'https://www.bolasport.com/rss',
    category: 'Sepakbola',
    active: true,
    priority: 'high'
  },
  {
    id: 'src-bbcsport',
    name: 'BBC Sport Football',
    url: 'http://feeds.bbci.co.uk/sport/football/rss.xml',
    category: 'Sepakbola',
    active: true,
    priority: 'medium'
  },
  {
    id: 'src-guardian-sport',
    name: 'Guardian Football',
    url: 'https://www.theguardian.com/football/rss',
    category: 'Sepakbola',
    active: true,
    priority: 'medium'
  },
  // Nasional
  {
    id: 'src-detiknews',
    name: 'detikNews',
    url: 'https://rss.detik.com/index.php/detikcom',
    category: 'Nasional',
    active: true,
    priority: 'high'
  },
  {
    id: 'src-cnn-nasional',
    name: 'CNN Indonesia',
    url: 'https://www.cnnindonesia.com/nasional/rss',
    category: 'Nasional',
    active: true,
    priority: 'high'
  },
  {
    id: 'src-antara-terkini',
    name: 'Antara News',
    url: 'https://www.antaranews.com/rss/terkini.xml',
    category: 'Nasional',
    active: true,
    priority: 'high'
  },
  {
    id: 'src-tempo-nasional',
    name: 'Tempo Nasional',
    url: 'https://rss.tempo.co/nasional',
    category: 'Nasional',
    active: true,
    priority: 'medium'
  },
  {
    id: 'src-liputan6',
    name: 'Liputan6',
    url: 'https://feed.liputan6.com/rss',
    category: 'Nasional',
    active: true,
    priority: 'medium'
  },
  // Hype / Viral
  {
    id: 'src-antara-top',
    name: 'Antara Top News',
    url: 'https://www.antaranews.com/rss/top-news.xml',
    category: 'Hype / Viral',
    active: true,
    priority: 'high'
  },
  // Internasional
  {
    id: 'src-bbc-world',
    name: 'BBC World News',
    url: 'http://feeds.bbci.co.uk/news/world/rss.xml',
    category: 'Internasional',
    active: true,
    priority: 'high'
  },
  {
    id: 'src-cnn-inter',
    name: 'CNN Internasional',
    url: 'https://www.cnnindonesia.com/internasional/rss',
    category: 'Internasional',
    active: true,
    priority: 'medium'
  },
  // Teknologi
  {
    id: 'src-detikinet',
    name: 'detikInet',
    url: 'https://rss.detik.com/index.php/inet',
    category: 'Teknologi',
    active: true,
    priority: 'medium'
  },
  {
    id: 'src-antara-tekno',
    name: 'Antara Tekno',
    url: 'https://www.antaranews.com/rss/tekno.xml',
    category: 'Teknologi',
    active: true,
    priority: 'medium'
  }
];

// ==========================================
// NAVIGATION TAB TYPE
// ==========================================
export type NavigationTab = 'home' | 'news' | 'create' | 'queue' | 'drafts' | 'history' | 'settings';

// ==========================================
// CONTENT QUEUE INTERFACES & TYPES
// ==========================================

export type QueueItemStatus = 
  | 'scheduled'   // Awaiting scheduled date/time
  | 'queued'      // Ready in pipeline for manual/auto cross-posting
  | 'publishing'  // Currently undergoing cross-post share session
  | 'published'   // Successfully completed sharing
  | 'paused'      // Temporarily held back by user
  | 'failed';     // Encountered an issue or skipped

export type QueueItemPriority = 
  | 'urgent' 
  | 'high' 
  | 'medium' 
  | 'low';

export interface ContentQueueMetadata {
  category?: string;
  source?: 'manual' | 'news_hunter' | 'ai_generated' | 'draft' | 'campaign' | string;
  notes?: string;
  autoPublish?: boolean;
  timezone?: string;
  tags?: string[];
  retryCount?: number;
  maxRetries?: number;
  targetAudience?: string;
  campaignName?: string;
  newsSourceTitle?: string;
  newsSourceUrl?: string;
  [key: string]: any;
}

export interface ContentQueueItem {
  id: string;
  postId?: string;
  title: string;
  caption: string;
  description?: string;
  hashtags: string[];
  callToAction?: string;
  media?: MediaItem | null;
  selectedPlatforms: PlatformId[];
  selectedDestinationIds?: string[];
  selectedGroupId?: string | null;
  scheduledAt: string; // ISO 8601 string: YYYY-MM-DDTHH:mm:ss
  status: QueueItemStatus;
  priority: QueueItemPriority;
  createdAt: string;
  updatedAt: string;
  lastAttemptAt?: string;
  errorMessage?: string;
  metadata?: ContentQueueMetadata;
  platformOverrides?: Partial<Record<PlatformId, PlatformCustomContent>>;
  post?: SocialPost;
}

export const SAMPLE_QUEUE_ITEMS: ContentQueueItem[] = [
  {
    id: 'queue-sample-1',
    postId: 'post-q1',
    title: 'Spot Mancing Waduk Jangari Paling Rekomended',
    caption: 'Berikut 5 rekomendasi lapak mancing apung terbaik di Jangari Cianjur dengan tarikan ikan nila badot yang melimpah! Jangan lupa persiapkan umpan racikan jitu.',
    description: 'Panduan lengkap spot mancing waduk Jangari Jawa Barat untuk akhir pekan.',
    hashtags: ['#Jangari', '#MancingMania', '#NilaBadot', '#SpotMancing', '#Cianjur'],
    callToAction: 'Simpan postingan ini untuk referensi liburan mancing kalian!',
    media: {
      id: 'media-q1',
      name: 'Spot Jangari Pagi.jpg',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&auto=format&fit=crop&q=80',
      source: 'sample'
    },
    selectedPlatforms: ['facebook_page', 'instagram', 'tiktok', 'youtube'],
    selectedGroupId: 'group-ngabloeventure',
    scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(),
    status: 'scheduled',
    priority: 'high',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {
      category: 'Wisata & Hobi',
      source: 'manual',
      notes: 'Post di jam istirahat siang untuk engagement optimal',
      campaignName: 'Weekend Fishing 2026'
    }
  },
  {
    id: 'queue-sample-2',
    postId: 'post-q2',
    title: 'Breaking News: Update Terkini Jadwal Laga Pekan Ini',
    caption: 'Info penting untuk seluruh Bobotoh! Simak persiapan tim dan jadwal laga besar akhir pekan ini.',
    description: 'Update kabar latihan dan persiapan taktik jelang pertandingan akbar.',
    hashtags: ['#Persib', '#Bobotoh', '#SepakbolaIndonesia', '#JadwalBola'],
    selectedPlatforms: ['facebook_page', 'facebook_profile', 'twitter', 'whatsapp'],
    selectedGroupId: 'group-persib',
    scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 18).toISOString(),
    status: 'queued',
    priority: 'urgent',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {
      category: 'Sepakbola',
      source: 'news_hunter',
      notes: 'Prioritas tinggi menjelang matchday'
    }
  },
  {
    id: 'queue-sample-3',
    postId: 'post-q3',
    title: 'Tips Merawat Joran & Reel Pancing Air Tawar',
    caption: 'Setelah mancing di waduk atau kolam, jangan lupa bersihkan joran & reel dengan air tawar hangat. Ini langkah mudah agar gear pancing tetap awet dan tarikan tetap smooth!',
    hashtags: ['#TipsMancing', '#FishingGear', '#ReelPancing', '#HobiMancing'],
    callToAction: 'Bagikan ke teman-teman pemancing kalian!',
    media: {
      id: 'media-q3',
      name: 'Reel Maintenance.jpg',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
      source: 'sample'
    },
    selectedPlatforms: ['facebook_page', 'instagram', 'tiktok'],
    selectedGroupId: 'group-ngabloeventure',
    scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 36).toISOString(),
    status: 'scheduled',
    priority: 'medium',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {
      category: 'Tips & Tutorial',
      source: 'manual',
      campaignName: 'Edukasi Pemancing'
    }
  },
  {
    id: 'queue-sample-4',
    postId: 'post-q4',
    title: 'Highlight Gol Spektakuler & Analisis Taktik',
    caption: 'Koleksi gol tendangan bebas dan kombinasi operan satu-dua terbaik pekan ini. Siapa pemain terbaik menurut kalian?',
    hashtags: ['#GolTerbaik', '#HighlightBola', '#TaktikSepakbola'],
    selectedPlatforms: ['instagram', 'tiktok', 'youtube'],
    scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString(),
    status: 'scheduled',
    priority: 'high',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {
      category: 'Highlight',
      source: 'news_hunter'
    }
  }
];

// ==========================================
// BACKUP & RESTORE / DATA INTEGRITY TYPES
// ==========================================

export const DATA_SCHEMA_VERSION = 1;
export const APP_CURRENT_VERSION = '1.4.0';

export interface BackupData {
  accounts: UserSocialAccounts;
  groups: SocialGroup[];
  drafts: SocialPost[];
  history: SocialPost[];
  newsLibrary: SavedNewsItem[];
  newsHunter: NewsHunterSettings;
  autoHunt: AutoHuntSettings;
  newsSources?: NewsRssSource[];
  queue: ContentQueueItem[];
  settings: AppSettings;
  discoveryCache?: any;
}

export interface BackupFile {
  backupVersion: number;
  createdAt: string;
  appVersion: string;
  timezone: string;
  data: BackupData;
}

export interface RecoverySnapshot {
  id: string;
  timestamp: string;
  label: string;
  sizeEstimateBytes: number;
  itemCounts: {
    accounts: number;
    groups: number;
    drafts: number;
    queue: number;
    history: number;
    newsLibrary: number;
  };
  backupFile: BackupFile;
}

export interface DataIntegrityIssue {
  id: string;
  type: 'error' | 'warning';
  category: 'account' | 'group' | 'draft' | 'queue' | 'history' | 'news';
  title: string;
  description: string;
  repairable: boolean;
  repairAction?: 'regenerate_id' | 'detach_deleted_accounts' | 'mark_missing_media' | 'remove_duplicate_id';
  details?: any;
}

export interface DataIntegrityReport {
  timestamp: string;
  healthy: number;
  warnings: number;
  errors: number;
  issues: DataIntegrityIssue[];
}

export interface MergeConflict {
  id: string;
  category: 'account' | 'group' | 'draft' | 'queue' | 'history' | 'news';
  title: string;
  currentSummary: string;
  backupSummary: string;
  currentItem: any;
  backupItem: any;
}



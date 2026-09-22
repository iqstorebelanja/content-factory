import {
  NewsRssSource,
  NewsArticle,
  NewsCluster,
  SavedNewsItem,
  NewsHunterSettings,
  AutoHuntSettings,
  AutoHuntResult,
  DiscoveredStoryRecord,
  AutoHuntInterval,
  DEFAULT_RSS_SOURCES,
  DEFAULT_NEWS_HUNTER_SETTINGS,
  DEFAULT_AUTO_HUNT_SETTINGS,
  NewsAiRewrite
} from '../types';
import { parseRssXml } from './rssParser';

const STORAGE_KEY_SOURCES = 'sss_news_sources';
const STORAGE_KEY_CACHE = 'sss_news_cache';
const STORAGE_KEY_LIBRARY = 'sss_news_library';
const STORAGE_KEY_SETTINGS = 'sss_news_settings';
const STORAGE_KEY_AUTO_HUNT_SETTINGS = 'sss_auto_hunt_settings';
const STORAGE_KEY_DISCOVERED_HISTORY = 'sss_discovered_stories_history';
const STORAGE_KEY_AUTO_HUNT_RESULT = 'sss_auto_hunt_last_result';
const STORAGE_KEY_SOURCE_ERRORS = 'sss_auto_hunt_source_errors';

// ==========================================
// 1. STORAGE: SOURCES
// ==========================================

export function loadNewsSources(): NewsRssSource[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SOURCES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_SOURCES, JSON.stringify(DEFAULT_RSS_SOURCES));
      return DEFAULT_RSS_SOURCES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_RSS_SOURCES;
  } catch (err) {
    console.error('Failed to load news sources from localStorage:', err);
    return DEFAULT_RSS_SOURCES;
  }
}

export function saveNewsSources(sources: NewsRssSource[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_SOURCES, JSON.stringify(sources));
  } catch (err) {
    console.error('Failed to save news sources to localStorage:', err);
  }
}

// ==========================================
// 2. STORAGE: SETTINGS
// ==========================================

export function loadNewsSettings(): NewsHunterSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(DEFAULT_NEWS_HUNTER_SETTINGS));
      return DEFAULT_NEWS_HUNTER_SETTINGS;
    }
    return { ...DEFAULT_NEWS_HUNTER_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_NEWS_HUNTER_SETTINGS;
  }
}

export function saveNewsSettings(settings: NewsHunterSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save news settings:', err);
  }
}

// ==========================================
// 3. STORAGE: CACHE
// ==========================================

export interface NewsCacheData {
  lastHuntTime: string;
  articles: NewsArticle[];
  clusters: NewsCluster[];
  category: string;
  discoveryMode: string;
}

export function loadNewsCache(): NewsCacheData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CACHE);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveNewsCache(data: NewsCacheData): void {
  try {
    localStorage.setItem(STORAGE_KEY_CACHE, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save news cache:', err);
  }
}

export function clearNewsCache(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_CACHE);
  } catch (err) {
    console.error('Failed to clear news cache:', err);
  }
}

// ==========================================
// 4. STORAGE: NEWS LIBRARY
// ==========================================

export function loadSavedNewsLibrary(): SavedNewsItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LIBRARY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveNewsItemToLibrary(item: SavedNewsItem): SavedNewsItem[] {
  try {
    const existing = loadSavedNewsLibrary();
    // Avoid duplicate URLs in library
    const filtered = existing.filter(i => i.url !== item.url && i.id !== item.id);
    const updated = [item, ...filtered];
    localStorage.setItem(STORAGE_KEY_LIBRARY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to save news item to library:', err);
    return [];
  }
}

export function deleteSavedNewsItem(id: string): SavedNewsItem[] {
  try {
    const existing = loadSavedNewsLibrary();
    const updated = existing.filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEY_LIBRARY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

// ==========================================
// 4B. STORAGE: AUTO HUNT SETTINGS & DISCOVERY
// ==========================================

export function loadAutoHuntSettings(): AutoHuntSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTO_HUNT_SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_AUTO_HUNT_SETTINGS, JSON.stringify(DEFAULT_AUTO_HUNT_SETTINGS));
      return DEFAULT_AUTO_HUNT_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_AUTO_HUNT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_AUTO_HUNT_SETTINGS;
  }
}

export function saveAutoHuntSettings(settings: AutoHuntSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_AUTO_HUNT_SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save auto hunt settings:', err);
  }
}

export function loadDiscoveredStoriesHistory(): DiscoveredStoryRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DISCOVERED_HISTORY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDiscoveredStoriesHistory(records: DiscoveredStoryRecord[]): void {
  try {
    // Keep max 2000 most recent records to protect local storage
    const trimmed = records.slice(0, 2000);
    localStorage.setItem(STORAGE_KEY_DISCOVERED_HISTORY, JSON.stringify(trimmed));
  } catch (err) {
    console.error('Failed to save discovered stories history:', err);
  }
}

export function clearDiscoveredStoriesHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_DISCOVERED_HISTORY);
  } catch (err) {
    console.error('Failed to clear discovered stories history:', err);
  }
}

export function getDiscoveredStoriesCount(): number {
  return loadDiscoveredStoriesHistory().length;
}

export function getUnviewedStoriesCount(): number {
  const history = loadDiscoveredStoriesHistory();
  return history.filter(h => !h.viewed).length;
}

export function markAllStoriesAsViewed(): void {
  const history = loadDiscoveredStoriesHistory();
  let changed = false;
  const updated = history.map(h => {
    if (!h.viewed) {
      changed = true;
      return { ...h, viewed: true };
    }
    return h;
  });
  if (changed) {
    saveDiscoveredStoriesHistory(updated);
  }
}

export function loadLastAutoHuntResult(): AutoHuntResult | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTO_HUNT_RESULT);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export const loadAutoHuntResult = loadLastAutoHuntResult;

export function saveLastAutoHuntResult(result: AutoHuntResult): void {
  try {
    localStorage.setItem(STORAGE_KEY_AUTO_HUNT_RESULT, JSON.stringify(result));
  } catch (err) {
    console.error('Failed to save last auto hunt result:', err);
  }
}

export function loadStoredSourceErrors(): { sourceName: string; error: string; timestamp: string }[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SOURCE_ERRORS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredSourceErrors(errors: { sourceName: string; error: string; timestamp: string }[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_SOURCE_ERRORS, JSON.stringify(errors.slice(0, 50)));
  } catch (err) {
    console.error('Failed to save source errors:', err);
  }
}

// Canonical URL & Fingerprint Helpers (Requirement #4)
export function normalizeCanonicalUrl(url: string): string {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    const searchParams = new URLSearchParams(parsed.search);
    const trackingKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'fbclid', 'gclid', 'rss'];
    for (const key of trackingKeys) {
      searchParams.delete(key);
    }
    const cleanSearch = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const cleanPath = parsed.pathname.replace(/\/+$/, '');
    return `${parsed.protocol}//${parsed.hostname.toLowerCase()}${cleanPath}${cleanSearch}`;
  } catch {
    return url.trim().toLowerCase().replace(/\/+$/, '');
  }
}

export function normalizeTitle(title: string): string {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/[^\w\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function generateStoryFingerprint(url: string, title: string, sourceId?: string): string {
  const normUrl = normalizeCanonicalUrl(url);
  const normTitle = normalizeTitle(title);
  return `${sourceId || ''}:::${normUrl}:::${normTitle}`;
}

export function calculateNextHuntTimestamp(interval: AutoHuntInterval): string {
  const now = Date.now();
  let msToAdd = 3 * 60 * 60 * 1000;
  switch (interval) {
    case '15m': msToAdd = 15 * 60 * 1000; break;
    case '30m': msToAdd = 30 * 60 * 1000; break;
    case '1h': msToAdd = 60 * 60 * 1000; break;
    case '3h': msToAdd = 3 * 60 * 60 * 1000; break;
    case '6h': msToAdd = 6 * 60 * 60 * 1000; break;
    case '12h': msToAdd = 12 * 60 * 60 * 1000; break;
    case '24h': msToAdd = 24 * 60 * 60 * 1000; break;
  }
  return new Date(now + msToAdd).toISOString();
}

export function getStorageRetentionStats(): {
  discoveredCount: number;
  libraryCount: number;
  cacheSizeKb: number;
} {
  const discovered = loadDiscoveredStoriesHistory();
  const library = loadSavedNewsLibrary();
  let totalBytes = 0;
  for (const key of [
    STORAGE_KEY_SOURCES,
    STORAGE_KEY_CACHE,
    STORAGE_KEY_LIBRARY,
    STORAGE_KEY_SETTINGS,
    STORAGE_KEY_AUTO_HUNT_SETTINGS,
    STORAGE_KEY_DISCOVERED_HISTORY,
    STORAGE_KEY_AUTO_HUNT_RESULT,
    STORAGE_KEY_SOURCE_ERRORS
  ]) {
    const val = localStorage.getItem(key);
    if (val) totalBytes += val.length * 2;
  }
  return {
    discoveredCount: discovered.length,
    libraryCount: library.length,
    cacheSizeKb: Math.max(1, Math.round(totalBytes / 1024))
  };
}

export function clearDiscoveryCacheOnly(): void {
  clearNewsCache();
  clearDiscoveredStoriesHistory();
}

// ==========================================
// 5. HYPE SCORE CALCULATION (0 - 100)
// ==========================================
// Internal topic momentum score — not an official popularity measurement.

const MOMENTUM_KEYWORDS = [
  'persib', 'juara', 'menang', 'skor', 'derby', 'transfer', 'resmi', 'gol',
  'viral', 'heboh', 'breaking', 'terbaru', 'update', 'gempa', 'banjir',
  'waspada', 'penting', 'eksklusif', 'sorotan', 'live', 'final', 'champions'
];

export function calculateHypeScore(
  article: { title: string; publishedAt: string; summary?: string; category?: string },
  sourceCount: number = 1
): { score: number; signals: { sourceCount: number; freshnessScore: number; relevanceScore: number; keywordScore: number } } {
  let score = 32;

  // Signal 1: Source Count (Multiple independent sources covering same event)
  let sourceSignal = 5;
  if (sourceCount >= 4) {
    sourceSignal = 42;
  } else if (sourceCount === 3) {
    sourceSignal = 32;
  } else if (sourceCount === 2) {
    sourceSignal = 18;
  }
  score += sourceSignal;

  // Signal 2: Freshness
  let freshnessScore = 0;
  const pubTime = new Date(article.publishedAt).getTime();
  const now = Date.now();
  const diffHours = (now - pubTime) / (1000 * 60 * 60);

  if (!isNaN(diffHours)) {
    if (diffHours <= 2) {
      freshnessScore = 18;
    } else if (diffHours <= 6) {
      freshnessScore = 12;
    } else if (diffHours <= 18) {
      freshnessScore = 6;
    } else if (diffHours <= 36) {
      freshnessScore = 2;
    }
  }
  score += freshnessScore;

  // Signal 3: Keyword momentum in title or summary
  let keywordScore = 0;
  const textCombined = `${article.title} ${article.summary || ''}`.toLowerCase();
  for (const kw of MOMENTUM_KEYWORDS) {
    if (textCombined.includes(kw)) {
      keywordScore += 4;
      if (keywordScore >= 16) break;
    }
  }
  score += keywordScore;

  // Signal 4: Category weight
  let relevanceScore = 4;
  if (article.category === 'Hype / Viral' || article.category === 'Persib') {
    relevanceScore = 8;
  } else if (article.category === 'Sepakbola' || article.category === 'Nasional') {
    relevanceScore = 6;
  }
  score += relevanceScore;

  // Clamp strictly between 15 and 98
  const finalScore = Math.min(98, Math.max(15, Math.round(score)));

  return {
    score: finalScore,
    signals: {
      sourceCount: sourceSignal,
      freshnessScore,
      relevanceScore,
      keywordScore
    }
  };
}

// ==========================================
// 6. DUPLICATE DETECTION & STORY CLUSTERING
// ==========================================

// Clean tokens, stripping common Indonesian & English stop words
const STOP_WORDS = new Set([
  'di', 'ke', 'dari', 'pada', 'dan', 'yang', 'untuk', 'dengan', 'ini', 'itu',
  'adalah', 'akan', 'bisa', 'ada', 'atau', 'saat', 'sudah', 'oleh', 'bagi',
  'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'is', 'are', 'was'
]);

function extractKeywords(title: string): Set<string> {
  const words = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
  return new Set(words);
}

function calculateSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const word of setA) {
    if (setB.has(word)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

export function clusterArticles(articles: NewsArticle[]): NewsCluster[] {
  const clusters: NewsCluster[] = [];
  const visited = new Set<string>();

  for (let i = 0; i < articles.length; i++) {
    const art = articles[i];
    if (visited.has(art.id)) continue;

    const clusterMembers: NewsArticle[] = [art];
    visited.add(art.id);
    const keywordsA = extractKeywords(art.title);

    for (let j = i + 1; j < articles.length; j++) {
      const other = articles[j];
      if (visited.has(other.id)) continue;

      const keywordsB = extractKeywords(other.title);
      const similarity = calculateSimilarity(keywordsA, keywordsB);

      // Threshold: 0.28 jaccard similarity or same core subject
      if (similarity >= 0.28) {
        clusterMembers.push(other);
        visited.add(other.id);
      }
    }

    // Determine fact status based on cluster size and titles
    let factStatus: 'confirmed' | 'developing' | 'differing' = 'confirmed';
    let differingSummary: string | undefined = undefined;

    if (clusterMembers.length === 1) {
      // Single source: check if breaking/uncertain
      const isBreaking = /breaking|diduga|potensi|belum pasti|rumor/i.test(art.title);
      factStatus = isBreaking ? 'developing' : 'confirmed';
    } else {
      // Check if sources differ in scores or conclusions
      const titles = clusterMembers.map(m => m.title.toLowerCase());
      const hasDispute = titles.some(t => /bantah|berbeda|kontroversi|klaim/i.test(t));
      if (hasDispute) {
        factStatus = 'differing';
        differingSummary = 'Sumber melaporkan sudut pandang berbeda mengenai kejadian ini.';
      } else {
        factStatus = 'confirmed';
      }
    }

    // Re-calculate hype score based on total cluster sources
    const sourcesCount = clusterMembers.length;
    const avgHype = Math.round(
      clusterMembers.reduce((sum, item) => sum + item.hypeScore, 0) / sourcesCount
    );

    // Give boost to all members in cluster
    const clusterId = `cluster-${art.id}`;
    for (const member of clusterMembers) {
      member.clusterId = clusterId;
      const reScore = calculateHypeScore(member, sourcesCount);
      member.hypeScore = reScore.score;
      member.hypeSignals = reScore.signals;
    }

    clusters.push({
      id: clusterId,
      mainTopic: art.title,
      articles: clusterMembers,
      sourcesCount,
      representativeArticle: art,
      averageHypeScore: Math.max(avgHype, art.hypeScore),
      factStatus,
      differingSummary
    });
  }

  // Sort clusters by highest average hype score
  return clusters.sort((a, b) => b.averageHypeScore - a.averageHypeScore);
}

// ==========================================
// 7. RSS FETCHER (Universal + Fallback Handling)
// ==========================================

export async function fetchRssFeed(source: NewsRssSource): Promise<NewsArticle[]> {
  try {
    // 1. Try secure server-side proxy endpoint first
    const res = await fetch('/api/news/fetch-rss', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: source.url, sourceName: source.name, category: source.category })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.articles)) {
        return data.articles.map((item: any, idx: number) => {
          const { score, signals } = calculateHypeScore(item, 1);
          return {
            ...item,
            id: item.id || `rss-${source.id}-${idx}-${Date.now()}`,
            source: source.name,
            sourceId: source.id,
            sourceType: 'RSS' as const,
            discoveredAt: item.discoveredAt || new Date().toISOString(),
            hypeScore: score,
            hypeSignals: signals
          };
        });
      }
    }
  } catch {
    // Server proxy failed or in standalone browser mode
  }

  // 2. Direct browser fetch attempt
  try {
    const directRes = await fetch(source.url, { mode: 'cors' });
    if (!directRes.ok) {
      throw new Error(`HTTP Error ${directRes.status}`);
    }
    const xmlText = await directRes.text();
    const parsed = parseRssXml(xmlText, source.category);
    
    return parsed.items.map((item, idx) => {
      const { score, signals } = calculateHypeScore(item, 1);
      return {
        id: `rss-${source.id}-${idx}-${Date.now()}`,
        title: item.title,
        url: item.link,
        source: source.name,
        sourceId: source.id,
        publishedAt: item.publishedAt,
        summary: item.summary,
        imageUrl: item.imageUrl,
        category: source.category,
        sourceType: 'RSS' as const,
        discoveredAt: new Date().toISOString(),
        hypeScore: score,
        hypeSignals: signals
      };
    });
  } catch (directErr: any) {
    // Informative CORS or network error without crashing
    const isCors = directErr?.message?.includes('Failed to fetch') || directErr?.name === 'TypeError';
    const errorMsg = isCors
      ? 'Direct RSS access is blocked by the source/browser (CORS).'
      : (directErr?.message || 'Source unavailable');
    
    console.warn(`[NewsHunter] Source '${source.name}' error:`, errorMsg);
    throw new Error(errorMsg);
  }
}

// ==========================================
// 8. TEST RSS SOURCE
// ==========================================

export async function testRssSource(url: string, sourceName: string): Promise<{
  success: boolean;
  message: string;
  itemCount: number;
  sampleTitle?: string;
  latencyMs: number;
}> {
  const start = Date.now();
  try {
    // Try server test endpoint
    const res = await fetch('/api/news/test-rss', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, name: sourceName })
    });

    if (res.ok) {
      const data = await res.json();
      return {
        ...data,
        latencyMs: Date.now() - start
      };
    }
  } catch {
    // Fallback direct check
  }

  try {
    const direct = await fetch(url, { mode: 'cors' });
    const text = await direct.text();
    const parsed = parseRssXml(text);
    return {
      success: true,
      message: `Successfully connected. Found ${parsed.items.length} articles.`,
      itemCount: parsed.items.length,
      sampleTitle: parsed.items[0]?.title,
      latencyMs: Date.now() - start
    };
  } catch (err: any) {
    return {
      success: false,
      message: 'Direct RSS access is blocked by the source/browser.',
      itemCount: 0,
      latencyMs: Date.now() - start
    };
  }
}

// ==========================================
// 9. WEB / SEO DISCOVERY
// ==========================================

export async function fetchWebDiscovery(category: string): Promise<NewsArticle[]> {
  try {
    const res = await fetch('/api/news/web-discover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.articles)) {
        return data.articles.map((item: any, idx: number) => {
          const { score, signals } = calculateHypeScore(item, 1);
          return {
            ...item,
            id: item.id || `web-${idx}-${Date.now()}`,
            sourceType: 'WEB' as const,
            discoveredAt: item.discoveredAt || new Date().toISOString(),
            hypeScore: score,
            hypeSignals: signals
          };
        });
      }
    }
  } catch (err) {
    console.warn('[NewsHunter] Web discovery failed:', err);
  }
  return [];
}

// ==========================================
// 10. AI REWRITE GENERATOR
// ==========================================

export async function requestNewsAiRewrite(
  article: NewsArticle,
  cluster?: NewsCluster
): Promise<NewsAiRewrite> {
  const res = await fetch('/api/news/rewrite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: article.title,
      summary: article.summary,
      url: article.url,
      source: article.source,
      category: article.category,
      clusterSources: cluster ? cluster.articles.map(a => ({ source: a.source, title: a.title })) : []
    })
  });

  if (!res.ok) {
    throw new Error(`Server returned HTTP ${res.status}`);
  }

  const data = await res.json();
  if (!data.success || !data.rewrite) {
    throw new Error(data.error || 'Failed to generate rewrite');
  }

  return data.rewrite;
}

// ==========================================
// 11. PRIORITY & EVENT STATUS HELPERS
// ==========================================

export function getStoryPriority(hypeScore: number): {
  level: 'high' | 'medium' | 'low';
  label: string;
  badge: string;
  colorClass: string;
} {
  if (hypeScore >= 85) {
    return {
      level: 'high',
      label: 'HIGH',
      badge: '🔥 HIGH',
      colorClass: 'text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/50 dark:border-rose-800/60 dark:text-rose-300'
    };
  }
  if (hypeScore >= 70) {
    return {
      level: 'medium',
      label: 'MEDIUM',
      badge: '🟡 MEDIUM',
      colorClass: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:border-amber-800/60 dark:text-amber-300'
    };
  }
  return {
    level: 'low',
    label: 'LOW',
    badge: '⚪ LOW',
    colorClass: 'text-slate-500 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
  };
}

export function getStoryEventStatus(
  article: NewsArticle,
  cluster?: NewsCluster
): {
  status: 'breaking' | 'developing' | 'differing' | 'confirmed';
  label: string;
  badgeClass: string;
} {
  // 1. Check if source itself clearly indicates BREAKING in title or summary (Requirement #11)
  const isSourceBreaking = /\bbreaking\b|^\[breaking\]|^\(breaking\)/i.test(article.title) ||
    /\bbreaking news\b/i.test(article.summary || '');

  if (isSourceBreaking) {
    return {
      status: 'breaking',
      label: 'BREAKING',
      badgeClass: 'bg-red-600 text-white animate-pulse'
    };
  }

  // 2. Sources Differ check (Requirement #11)
  if (cluster && cluster.factStatus === 'differing') {
    return {
      status: 'differing',
      label: 'SOURCES DIFFER',
      badgeClass: 'bg-amber-500 text-white'
    };
  }

  // 3. Developing: Very recent (< 3 hours) or multiple sources reporting a live event
  const pubTime = new Date(article.publishedAt).getTime();
  const isRecent = !isNaN(pubTime) && (Date.now() - pubTime < 3 * 60 * 60 * 1000);
  const isMultiSource = (cluster?.sourcesCount || 1) >= 2;

  if (isRecent || isMultiSource) {
    return {
      status: 'developing',
      label: 'DEVELOPING',
      badgeClass: 'bg-indigo-600 text-white'
    };
  }

  return {
    status: 'confirmed',
    label: 'VERIFIED',
    badgeClass: 'bg-emerald-600 text-white'
  };
}

// Notification Architecture (Requirement #12 & #20)
export function notifyHighInterestStory(story: { title: string; category: string; hypeScore: number }): void {
  try {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('New High-Interest Story Detected', {
          body: `[${story.category}] ${story.title} (Hype Score: ${story.hypeScore})`,
          icon: '/favicon.ico'
        });
      }
    }
  } catch {
    // Safe fail in browser sandboxes/iframes
  }
}

// ==========================================
// 12. AUTO HUNT EXECUTION ENGINE
// ==========================================

let isHuntExecutionInProgress = false;

export function isAutoHuntExecuting(): boolean {
  return isHuntExecutionInProgress;
}

export async function executeAutoHuntRun(options?: {
  sources?: NewsRssSource[];
  autoHuntSettings?: AutoHuntSettings;
  newsSettings?: NewsHunterSettings;
  forceAllSources?: boolean;
}): Promise<{
  success: boolean;
  alreadyRunning?: boolean;
  result: AutoHuntResult;
  newArticles: NewsArticle[];
  allArticles: NewsArticle[];
  clusters: NewsCluster[];
  errors: { sourceName: string; error: string; timestamp: string }[];
  highPriorityStories: NewsArticle[];
}> {
  if (isHuntExecutionInProgress) {
    const existingResult = loadLastAutoHuntResult() || {
      lastHuntTime: new Date().toISOString(),
      sourcesChecked: 0,
      newStoriesCount: 0,
      updatedClustersCount: 0,
      duplicatesIgnoredCount: 0,
      errorsCount: 0
    };
    return {
      success: false,
      alreadyRunning: true,
      result: existingResult,
      newArticles: [],
      allArticles: [],
      clusters: [],
      errors: [],
      highPriorityStories: []
    };
  }

  isHuntExecutionInProgress = true;

  try {
    const currentSources = options?.sources || loadNewsSources();
    const autoSettings = options?.autoHuntSettings || loadAutoHuntSettings();
    const errors: { sourceName: string; error: string; timestamp: string }[] = [];

    // 1. Filter sources based on auto hunt categories (Requirement #2)
    const monitoredCategories = new Set(
      (autoSettings.categories || []).map(c => c.toLowerCase())
    );
    if (autoSettings.customCategory && autoSettings.customCategory.trim()) {
      monitoredCategories.add(autoSettings.customCategory.trim().toLowerCase());
    }

    const activeSources = currentSources.filter(s => {
      if (!s.active) return false;
      if (options?.forceAllSources) return true;
      if (monitoredCategories.size === 0) return true;
      return monitoredCategories.has(s.category.toLowerCase()) || monitoredCategories.has('all categories');
    });

    const collectedArticles: NewsArticle[] = [];

    // 2. Fetch RSS sources if enabled (Requirement #3)
    if (autoSettings.sources.rss !== false && activeSources.length > 0) {
      const rssPromises = activeSources.map(async src => {
        try {
          const articles = await fetchRssFeed(src);
          return articles;
        } catch (err: any) {
          const errObj = {
            sourceName: src.name,
            error: err?.message || 'Direct RSS access blocked or timed out.',
            timestamp: new Date().toISOString()
          };
          errors.push(errObj);
          return [];
        }
      });

      const rssResults = await Promise.all(rssPromises);
      for (const res of rssResults) {
        collectedArticles.push(...res);
      }
    }

    // 3. Optional Web Search (Requirement #3)
    if (autoSettings.sources.web) {
      try {
        const catsToSearch = Array.from(monitoredCategories).slice(0, 3);
        const searchPromises = catsToSearch.map(cat => fetchWebDiscovery(cat));
        const webResults = await Promise.all(searchPromises);
        for (const res of webResults) {
          collectedArticles.push(...res);
        }
      } catch (err) {
        console.warn('Auto Hunt web search warning:', err);
      }
    }

    // 4. X Trending check (Requirement #3)
    // NOTE: Only use X Trending when valid access/API data is actually available. Do not simulate X trends.
    if (autoSettings.sources.xTrending) {
      if (!options?.newsSettings?.xApiKeyConfigured) {
        errors.push({
          sourceName: 'X Trending',
          error: 'X Trending unavailable — valid access is required. Do not simulate X trends.',
          timestamp: new Date().toISOString()
        });
      }
    }

    // 5. Deduplication using Canonical URL & Fingerprint (Requirement #4)
    const history = loadDiscoveredStoriesHistory();
    const knownFingerprints = new Set(history.map(h => h.fingerprint));
    const knownUrls = new Set(history.map(h => normalizeCanonicalUrl(h.url)));

    const newArticles: NewsArticle[] = [];
    const newDiscoveredRecords: DiscoveredStoryRecord[] = [];
    let duplicatesIgnoredCount = 0;

    for (const art of collectedArticles) {
      const canonicalUrl = normalizeCanonicalUrl(art.url);
      const fp = generateStoryFingerprint(art.url, art.title, art.sourceId);

      if (knownFingerprints.has(fp) || (canonicalUrl && knownUrls.has(canonicalUrl))) {
        duplicatesIgnoredCount++;
      } else {
        newArticles.push(art);
        knownFingerprints.add(fp);
        if (canonicalUrl) knownUrls.add(canonicalUrl);

        newDiscoveredRecords.push({
          fingerprint: fp,
          url: art.url,
          title: art.title,
          normalizedTitle: normalizeTitle(art.title),
          sourceId: art.sourceId,
          sourceName: art.source,
          publishedAt: art.publishedAt,
          discoveredAt: new Date().toISOString(),
          hypeScore: art.hypeScore,
          category: art.category,
          viewed: false
        });
      }
    }

    // Save updated discovery history (Requirement #4 & #18)
    if (newDiscoveredRecords.length > 0) {
      saveDiscoveredStoriesHistory([...newDiscoveredRecords, ...history]);
    }

    // 6. Cluster all collected articles (Requirement #5)
    const formedClusters = clusterArticles(collectedArticles);
    formedClusters.sort((a, b) => b.averageHypeScore - a.averageHypeScore);

    // 7. Check Priority Stories (Requirement #10)
    const highPriorityStories = collectedArticles.filter(a => a.hypeScore >= 85);

    // If new high-priority story detected, notify if configured (Requirement #12)
    if (highPriorityStories.length > 0 && autoSettings.notifyOnHighPriority) {
      const topStory = highPriorityStories[0];
      notifyHighInterestStory({
        title: topStory.title,
        category: topStory.category,
        hypeScore: topStory.hypeScore
      });
    }

    // 8. Build Auto Hunt Result (Requirement #8)
    const huntTimestamp = new Date().toISOString();
    const result: AutoHuntResult = {
      lastHuntTime: huntTimestamp,
      sourcesChecked: activeSources.length + (autoSettings.sources.web ? 1 : 0),
      newStoriesCount: newArticles.length,
      updatedClustersCount: formedClusters.filter(c => c.sourcesCount > 1).length,
      duplicatesIgnoredCount,
      errorsCount: errors.length,
      errorDetails: errors
    };

    // Save result & update next hunt time
    saveLastAutoHuntResult(result);
    if (errors.length > 0) {
      saveStoredSourceErrors(errors);
    }

    const updatedSettings: AutoHuntSettings = {
      ...autoSettings,
      lastHuntResult: result,
      lastHuntTimestamp: huntTimestamp,
      nextHuntTimestamp: calculateNextHuntTimestamp(autoSettings.interval)
    };
    saveAutoHuntSettings(updatedSettings);

    // Also update news cache for the active view
    saveNewsCache({
      lastHuntTime: huntTimestamp,
      articles: collectedArticles,
      clusters: formedClusters,
      category: autoSettings.categories[0] || 'All Categories',
      discoveryMode: autoSettings.sources.web ? 'rss_web' : 'rss_only'
    });

    return {
      success: true,
      result,
      newArticles,
      allArticles: collectedArticles,
      clusters: formedClusters,
      errors,
      highPriorityStories
    };
  } finally {
    isHuntExecutionInProgress = false;
  }
}

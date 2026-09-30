/**
 * Centralized Backend & External API Service Abstraction Layer
 * Social Share Scheduler
 *
 * Architecture:
 *   Frontend UI Components -> Service Layer (apiService) -> Backend/API Proxy (/api/*) -> External Provider
 *
 * Ensures:
 * - Zero private API keys or credentials in UI components or Android APK bundles
 * - Environment-aware base URL resolution (Web Preview vs Android APK remote backend)
 * - Request timeouts and sanitized user-facing error messages
 * - Clean interface (`generateAI`, `searchNews`, `discoverMedia`, `fetchTrending`, `rewriteNews`)
 */

import { buildBackendEndpointUrl, getEnvironmentConfig } from '../config/environmentConfig';
import { isSecureBackendReachable } from '../config/apiProviders';
import { sanitizeUserFacingError } from '../utils/errorSanitizer';
import { errorReporter } from './errorReporter';
import { NewsAiRewrite, NewsArticle, NewsRssSource, PlatformId } from '../types';
import { BackendFoundationStatusResult, ServerEntitlementVerificationResult } from '../types/cloudData';

export interface GenerateAIParams {
  topic: string;
  mediaType?: 'image' | 'video';
  mediaName?: string;
  platforms?: PlatformId[] | string[];
  singlePlatform?: PlatformId | string;
  fbPageContentType?: 'post' | 'reel';
  fbProfileContentType?: 'post' | 'reel';
}

export interface GenerateAIResult {
  success: boolean;
  data?: Record<string, any>;
  isFallback?: boolean;
  error?: string;
  requiresBackend?: boolean;
}

export interface SearchNewsParams {
  category: string;
  countryCode?: string;
  countryName?: string;
  language?: string;
  customQuery?: string;
}

export interface SearchNewsResult {
  success: boolean;
  articles: any[];
  error?: string;
  requiresBackend?: boolean;
}

export interface RewriteNewsParams {
  title: string;
  summary: string;
  url?: string;
  source?: string;
  category?: string;
  clusterSources?: Array<{ source: string; title: string }>;
  mediaMetadata?: any;
  targetLanguage?: string;
  sourceLanguage?: string;
}

export interface RewriteNewsResult {
  success: boolean;
  rewrite?: NewsAiRewrite & Record<string, any>;
  isFallback?: boolean;
  error?: string;
  requiresBackend?: boolean;
}

export interface DiscoverMediaProbeResult {
  success: boolean;
  accessible: boolean;
  isDownloadable: boolean;
  sizeBytes?: number;
  contentType?: string;
  statusCode?: number;
  isHtmlRedirect?: boolean;
  error?: string;
}

export interface FetchTrendingParams {
  sources?: NewsRssSource[];
  category?: string;
  countryCode?: string;
}

/**
 * Helper to execute a JSON POST request to the backend proxy with timeout and error sanitization.
 */
async function postBackendJson<T = any>(
  endpointPath: string,
  payload: Record<string, any>,
  featureName: string,
  customTimeoutMs?: number
): Promise<{ ok: boolean; status: number; data?: T; error?: string; requiresBackend?: boolean }> {
  if (!isSecureBackendReachable()) {
    return {
      ok: false,
      status: 503,
      requiresBackend: true,
      error: 'REQUIRES SECURE BACKEND: Configure VITE_API_BASE_URL for standalone APK backend services.'
    };
  }

  const envConfig = getEnvironmentConfig();
  const timeoutMs = customTimeoutMs || envConfig.requestTimeoutMs;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = buildBackendEndpointUrl(endpointPath);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timer);

    const json = await response.json().catch(() => null);
    if (!response.ok) {
      const rawErr = json?.error || json?.message || `HTTP ${response.status}`;
      const safeErr = sanitizeUserFacingError(rawErr);
      return {
        ok: false,
        status: response.status,
        data: json,
        error: safeErr
      };
    }

    return {
      ok: true,
      status: response.status,
      data: json as T
    };
  } catch (err: any) {
    clearTimeout(timer);
    const isAbort =
      err?.name === 'AbortError' ||
      err?.name === 'TimeoutError' ||
      /aborted/i.test(String(err?.message || ''));
    const safeMsg = isAbort
      ? 'Request timed out. Please check your connection and try again.'
      : sanitizeUserFacingError(err);

    errorReporter.report(
      isAbort ? 'API_TIMEOUT' : 'API_NETWORK_ERR',
      featureName,
      isAbort ? `Request timed out after ${timeoutMs}ms` : (err?.message || 'Network request failed'),
      safeMsg,
      true
    );

    return {
      ok: false,
      status: 0,
      error: safeMsg
    };
  }
}

/**
 * 1. generateAI()
 * Calls the backend AI content proxy (/api/ai/generate-platform-content) without exposing GEMINI_API_KEY.
 */
export async function generateAI(params: GenerateAIParams): Promise<GenerateAIResult> {
  const res = await postBackendJson<{ success: boolean; data?: Record<string, any>; isFallback?: boolean; error?: string }>(
    '/api/ai/generate-platform-content',
    {
      topic: params.topic,
      mediaType: params.mediaType,
      mediaName: params.mediaName,
      platforms: params.platforms,
      singlePlatform: params.singlePlatform,
      fbPageContentType: params.fbPageContentType || 'post',
      fbProfileContentType: params.fbProfileContentType || 'post'
    },
    'AI_GENERATION'
  );

  if (res.ok && res.data?.success && res.data?.data) {
    return {
      success: true,
      data: res.data.data,
      isFallback: res.data.isFallback
    };
  }

  return {
    success: false,
    requiresBackend: res.requiresBackend,
    error: res.error || sanitizeUserFacingError(res.data?.error, 'Unable to generate AI content right now.')
  };
}

/**
 * 2. searchNews()
 * Calls the backend Web News Discovery proxy (/api/news/web-discover).
 */
export async function searchNews(params: SearchNewsParams): Promise<SearchNewsResult> {
  const res = await postBackendJson<{ success: boolean; articles?: any[]; error?: string }>(
    '/api/news/web-discover',
    {
      category: params.category,
      countryCode: params.countryCode || 'GLOBAL',
      countryName: params.countryName || 'Global / International',
      language: params.language || 'en',
      customQuery: params.customQuery ? params.customQuery.trim() : undefined
    },
    'WEB_NEWS_SEARCH'
  );

  if (res.ok && res.data?.success && Array.isArray(res.data.articles)) {
    return {
      success: true,
      articles: res.data.articles
    };
  }

  return {
    success: false,
    articles: [],
    requiresBackend: res.requiresBackend,
    error: res.error
  };
}

/**
 * 3. rewriteNews()
 * Calls the backend Fact-Safe News Rewrite proxy (/api/news/rewrite).
 */
export async function rewriteNews(params: RewriteNewsParams): Promise<RewriteNewsResult> {
  const res = await postBackendJson<{ success: boolean; rewrite?: any; isFallback?: boolean; error?: string }>(
    '/api/news/rewrite',
    {
      title: params.title,
      summary: params.summary,
      url: params.url,
      source: params.source,
      category: params.category,
      clusterSources: params.clusterSources || [],
      mediaMetadata: params.mediaMetadata,
      targetLanguage: params.targetLanguage || 'same_as_news',
      sourceLanguage: params.sourceLanguage || 'auto'
    },
    'NEWS_REWRITE'
  );

  if (res.ok && res.data?.success && res.data?.rewrite) {
    return {
      success: true,
      rewrite: res.data.rewrite,
      isFallback: res.data.isFallback
    };
  }

  return {
    success: false,
    requiresBackend: res.requiresBackend,
    error: res.error || sanitizeUserFacingError(res.data?.error, 'Failed to generate news rewrite.')
  };
}

/**
 * 4. discoverMedia()
 * Probes remote media headers via backend proxy (/api/news/media-probe) to check size, MIME type, and downloadability.
 */
export async function discoverMedia(url: string): Promise<DiscoverMediaProbeResult> {
  if (!url || !/^https?:\/\//i.test(url)) {
    return {
      success: false,
      accessible: false,
      isDownloadable: false,
      error: 'Invalid media URL.'
    };
  }

  const res = await postBackendJson<DiscoverMediaProbeResult>(
    '/api/news/media-probe',
    { url },
    'MEDIA_DISCOVERY',
    8000
  );

  if (res.ok && res.data) {
    return {
      success: Boolean(res.data.success),
      accessible: Boolean(res.data.accessible),
      isDownloadable: Boolean(res.data.isDownloadable),
      sizeBytes: res.data.sizeBytes,
      contentType: res.data.contentType,
      statusCode: res.data.statusCode,
      isHtmlRedirect: Boolean(res.data.isHtmlRedirect),
      error: res.data.error ? sanitizeUserFacingError(res.data.error) : undefined
    };
  }

  return {
    success: false,
    accessible: true,
    isDownloadable: true,
    error: res.error
  };
}

/**
 * Helper to get the safe backend media proxy download URL.
 */
export function getMediaProxyDownloadUrl(mediaUrl: string, maxLimitMb = 25): string {
  const path = `/api/news/media-proxy-download?url=${encodeURIComponent(mediaUrl)}&limitMb=${maxLimitMb}`;
  return buildBackendEndpointUrl(path);
}

/**
 * 5. fetchTrending() / fetchRssProxy()
 * Fetches RSS XML items or trending stories via the backend CORS proxy (/api/news/fetch-rss).
 */
export async function fetchTrending(params: {
  url: string;
  sourceName?: string;
  category?: string;
}): Promise<{
  success: boolean;
  feedTitle?: string;
  articles: Partial<NewsArticle>[];
  error?: string;
}> {
  const res = await postBackendJson<{
    success: boolean;
    feedTitle?: string;
    articles?: Partial<NewsArticle>[];
    error?: string;
  }>(
    '/api/news/fetch-rss',
    {
      url: params.url,
      sourceName: params.sourceName || 'RSS Source',
      category: params.category || 'General'
    },
    'RSS_TRENDING_FETCH',
    10000
  );

  if (res.ok && res.data?.success && Array.isArray(res.data.articles)) {
    return {
      success: true,
      feedTitle: res.data.feedTitle,
      articles: res.data.articles
    };
  }

  return {
    success: false,
    articles: [],
    error: res.error
  };
}

/**
 * Tests an RSS feed URL via backend proxy (/api/news/test-rss).
 */
export async function testRssEndpoint(url: string, name = 'RSS Source'): Promise<{
  ok: boolean;
  success: boolean;
  message: string;
  itemCount: number;
  sampleTitle?: string;
}> {
  const res = await postBackendJson<{
    success: boolean;
    message?: string;
    itemCount?: number;
    sampleTitle?: string;
  }>(
    '/api/news/test-rss',
    { url, name },
    'RSS_TEST',
    8000
  );

  if (res.ok && res.data) {
    return {
      ok: true,
      success: Boolean(res.data.success),
      message: sanitizeUserFacingError(res.data.message || 'Connected'),
      itemCount: res.data.itemCount || 0,
      sampleTitle: res.data.sampleTitle
    };
  }

  return {
    ok: false,
    success: false,
    message: res.error || 'Unable to reach RSS test proxy.',
    itemCount: 0
  };
}

/**
 * 6. verifyServerEntitlement()
 * Queries the server-authoritative entitlement verification endpoint (/api/entitlements/verify).
 * Never trusts local storage PRO claims; falls back safely to FREE if backend is unreachable.
 */
export async function verifyServerEntitlement(userId: string): Promise<ServerEntitlementVerificationResult> {
  const res = await postBackendJson<ServerEntitlementVerificationResult>(
    '/api/entitlements/verify',
    { userId },
    'ENTITLEMENT_VERIFY',
    6000
  );

  if (res.ok && res.data?.success) {
    return {
      success: true,
      serverReachable: true,
      databaseConnected: Boolean(res.data.databaseConnected),
      verifiedByServer: Boolean(res.data.verifiedByServer),
      authoritativePlan: res.data.authoritativePlan === 'PRO' && res.data.verifiedByServer ? 'PRO' : 'FREE',
      paymentStatus: res.data.paymentStatus || 'PAYMENT_NOT_CONFIGURED',
      paymentProvider: res.data.paymentProvider || 'none',
      entitlementSource: res.data.entitlementSource || 'SERVER_DEFAULT_FREE',
      evaluatedAt: res.data.evaluatedAt || new Date().toISOString(),
      message: sanitizeUserFacingError(res.data.message || 'Server entitlement verified.')
    };
  }

  return {
    success: false,
    serverReachable: false,
    databaseConnected: false,
    verifiedByServer: false,
    authoritativePlan: 'FREE',
    paymentStatus: 'PAYMENT_NOT_CONFIGURED',
    paymentProvider: 'none',
    entitlementSource: 'LOCAL_FALLBACK',
    evaluatedAt: new Date().toISOString(),
    message: res.error || 'Server entitlement endpoint unreachable; operating in local fallback mode (FREE).'
  };
}

/**
 * 7. getBackendFoundationStatus()
 * Queries the backend foundation status (/api/backend/foundation-status).
 */
export async function getBackendFoundationStatus(): Promise<BackendFoundationStatusResult> {
  if (!isSecureBackendReachable()) {
    return {
      success: false,
      serverProxyActive: false,
      databaseProvider: 'local_storage_only',
      databaseConnected: false,
      authProvider: 'local_guest',
      authProviderConnected: false,
      paymentProvider: 'none',
      paymentWebhookConfigured: false,
      entitlementAuthority: 'SERVER_AUTHORITATIVE_READY',
      supportedWebhookProviders: ['google_play_billing', 'paddle', 'lemon_squeezy', 'stripe'],
      timestamp: new Date().toISOString()
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const url = buildBackendEndpointUrl('/api/backend/foundation-status');
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timer);
    if (response.ok) {
      const json = await response.json();
      return json as BackendFoundationStatusResult;
    }
  } catch {
    clearTimeout(timer);
  }

  return {
    success: false,
    serverProxyActive: false,
    databaseProvider: 'local_storage_only',
    databaseConnected: false,
    authProvider: 'local_guest',
    authProviderConnected: false,
    paymentProvider: 'none',
    paymentWebhookConfigured: false,
    entitlementAuthority: 'SERVER_AUTHORITATIVE_READY',
    supportedWebhookProviders: ['google_play_billing', 'paddle', 'lemon_squeezy', 'stripe'],
    timestamp: new Date().toISOString()
  };
}

export const apiService = {
  generateAI,
  searchNews,
  rewriteNews,
  discoverMedia,
  getMediaProxyDownloadUrl,
  fetchTrending,
  testRssEndpoint,
  verifyServerEntitlement,
  getBackendFoundationStatus
};

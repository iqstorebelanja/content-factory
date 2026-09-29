/**
 * Centralized API Provider Configuration & Security Classification
 * Social Share Scheduler
 *
 * Classifies every external service and internal proxy route according to
 * Production Security & API Architecture Audit v1:
 *   A. Safe for client-side/public use
 *   B. Requires backend proxy
 *   C. Requires authentication
 *   D. Requires secret credential
 *   E. Unknown — needs configuration
 *
 * IMPORTANT: Never place secret values or API keys into this file.
 */

import { detectNativeAndroidShell, resolveApiBaseUrl } from './environmentConfig';

export type SecurityClassificationCode = 'A' | 'B' | 'C' | 'D' | 'E';

export type ServiceType =
  | 'ai_generation'
  | 'news_rewrite'
  | 'web_search'
  | 'rss_discovery'
  | 'media_discovery'
  | 'trending_discovery'
  | 'cloud_storage_oauth'
  | 'payment_billing'
  | 'platform_sharing';

export type ProviderOperationalStatus =
  | 'ACTIVE_BACKEND_PROXY'
  | 'PUBLIC_CLIENT_SAFE'
  | 'OAUTH_CLIENT_TOKEN'
  | 'REQUIRES_SECURE_BACKEND'
  | 'DISABLED_COMING_SOON';

export interface ApiProviderConfig {
  id: string;
  providerName: string;
  serviceType: ServiceType;
  endpoint: string;
  requiresSecret: boolean;
  requiresBackend: boolean;
  enabled: boolean;
  status: ProviderOperationalStatus;
  classification: SecurityClassificationCode;
  classificationLabel: string;
  securityNotes: string;
}

export const CLASSIFICATION_LABELS: Record<SecurityClassificationCode, string> = {
  A: 'A. Safe for client-side/public use',
  B: 'B. Requires backend proxy',
  C: 'C. Requires authentication',
  D: 'D. Requires secret credential',
  E: 'E. Unknown — needs configuration'
};

/**
 * Evaluates whether backend-dependent providers can reach a secure backend
 * in the current runtime (Web same-origin proxy vs standalone Android APK).
 */
export function isSecureBackendReachable(): boolean {
  const isAndroidApk = detectNativeAndroidShell();
  const configuredRemoteBase = resolveApiBaseUrl();
  // In standalone Android APK without a configured remote backend URL, backend proxy routes require a configured remote server
  if (isAndroidApk && !configuredRemoteBase) {
    return false;
  }
  return true;
}

/**
 * Centralized registry of all external and proxied service providers.
 * No secret values are ever stored here.
 */
export function getApiProvidersRegistry(): ApiProviderConfig[] {
  const backendReachable = isSecureBackendReachable();
  const aiStatus: ProviderOperationalStatus = backendReachable
    ? 'ACTIVE_BACKEND_PROXY'
    : 'REQUIRES_SECURE_BACKEND';

  return [
    {
      id: 'gemini_ai_generator',
      providerName: 'Google Gemini AI (Multi-Platform Content Generator)',
      serviceType: 'ai_generation',
      endpoint: '/api/ai/generate-platform-content',
      requiresSecret: true,
      requiresBackend: true,
      enabled: true,
      status: aiStatus,
      classification: 'D',
      classificationLabel: CLASSIFICATION_LABELS.D,
      securityNotes:
        'REQUIRES SECURE BACKEND. Uses server-side GEMINI_API_KEY via Express proxy. Never expose key in browser JS or Android APK.'
    },
    {
      id: 'gemini_news_rewriter',
      providerName: 'Google Gemini AI (News Fact-Safe Rewrite Engine)',
      serviceType: 'news_rewrite',
      endpoint: '/api/news/rewrite',
      requiresSecret: true,
      requiresBackend: true,
      enabled: true,
      status: aiStatus,
      classification: 'D',
      classificationLabel: CLASSIFICATION_LABELS.D,
      securityNotes:
        'REQUIRES SECURE BACKEND. Proxied through server.ts with Cost Guard rate limiting. Secret key strictly on backend.'
    },
    {
      id: 'gemini_web_news_discovery',
      providerName: 'Web News Discovery Engine (AI Search Proxy)',
      serviceType: 'web_search',
      endpoint: '/api/news/web-discover',
      requiresSecret: true,
      requiresBackend: true,
      enabled: true,
      status: aiStatus,
      classification: 'D',
      classificationLabel: CLASSIFICATION_LABELS.D,
      securityNotes:
        'REQUIRES SECURE BACKEND. Uses server-side credential via /api/news/web-discover with rate limiting and retry caps.'
    },
    {
      id: 'rss_feed_proxy',
      providerName: 'Public RSS Syndication Feeds (Server CORS Proxy + Direct Fallback)',
      serviceType: 'rss_discovery',
      endpoint: '/api/news/fetch-rss',
      requiresSecret: false,
      requiresBackend: true,
      enabled: true,
      status: backendReachable ? 'ACTIVE_BACKEND_PROXY' : 'PUBLIC_CLIENT_SAFE',
      classification: 'B',
      classificationLabel: CLASSIFICATION_LABELS.B,
      securityNotes:
        'Public XML feeds require no secret credentials, but use backend proxy (/api/news/fetch-rss) to bypass browser CORS restrictions with SSRF protection.'
    },
    {
      id: 'media_probe_and_proxy',
      providerName: 'News Media Inspector & Safe Download Proxy',
      serviceType: 'media_discovery',
      endpoint: '/api/news/media-probe',
      requiresSecret: false,
      requiresBackend: true,
      enabled: true,
      status: backendReachable ? 'ACTIVE_BACKEND_PROXY' : 'PUBLIC_CLIENT_SAFE',
      classification: 'B',
      classificationLabel: CLASSIFICATION_LABELS.B,
      securityNotes:
        'Uses backend proxy (/api/news/media-probe & /api/news/media-proxy-download) to inspect MIME headers, enforce MB size limits, and block HTML redirects.'
    },
    {
      id: 'trending_momentum_engine',
      providerName: 'News Hunter Trending & Hype Momentum Scorer',
      serviceType: 'trending_discovery',
      endpoint: '/api/news/fetch-rss',
      requiresSecret: false,
      requiresBackend: false,
      enabled: true,
      status: 'PUBLIC_CLIENT_SAFE',
      classification: 'A',
      classificationLabel: CLASSIFICATION_LABELS.A,
      securityNotes:
        'Computes hype scores and cross-source story clustering locally from discovered RSS/news items; external X API trending requires backend credential if connected.'
    },
    {
      id: 'google_drive_picker',
      providerName: 'Google Drive Readonly Media Picker (GIS OAuth 2.0)',
      serviceType: 'cloud_storage_oauth',
      endpoint: 'https://www.googleapis.com/drive/v3/files',
      requiresSecret: false,
      requiresBackend: false,
      enabled: true,
      status: 'OAUTH_CLIENT_TOKEN',
      classification: 'C',
      classificationLabel: CLASSIFICATION_LABELS.C,
      securityNotes:
        'Uses client-side Google Identity Services implicit token flow (drive.readonly scope). Access token stored only in ephemeral sessionStorage; never in localStorage or backups.'
    },
    {
      id: 'subscription_billing_provider',
      providerName: 'Pro Subscription & Payment Verification Service',
      serviceType: 'payment_billing',
      endpoint: '/api/billing/verify',
      requiresSecret: true,
      requiresBackend: true,
      enabled: false,
      status: 'DISABLED_COMING_SOON',
      classification: 'E',
      classificationLabel: CLASSIFICATION_LABELS.E,
      securityNotes:
        'REQUIRES SECURE BACKEND when live billing is enabled. Currently in local FREE / PRO preview mode (PAYMENT_COMING_SOON = true).'
    },
    {
      id: 'manual_social_share_intents',
      providerName: 'Assisted Social Platform Web Composers & Deep Links',
      serviceType: 'platform_sharing',
      endpoint: 'client://native-intent-or-web-url',
      requiresSecret: false,
      requiresBackend: false,
      enabled: true,
      status: 'PUBLIC_CLIENT_SAFE',
      classification: 'A',
      classificationLabel: CLASSIFICATION_LABELS.A,
      securityNotes:
        'Safe for client-side and Android APK use. Uses official web share URLs, clipboard copy, and Android Share Sheet without storing platform passwords or private API tokens.'
    }
  ];
}

import 'dotenv/config';
import crypto from 'crypto';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { parseRssXml } from './src/utils/rssParser';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));

// Server-Side Cost Guard Rate Limiter & Flood Protection
const requestTimestamps = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 40;     // 40 requests per minute per IP

function costControlRateLimiter(req: express.Request, res: express.Response, next: express.NextFunction) {
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'client';
  const ipKey = String(clientIp).split(',')[0].trim();
  const now = Date.now();

  const history = (requestTimestamps.get(ipKey) || []).filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  
  if (history.length >= MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded: Too many AI / API requests within a short period. Please wait a moment.'
    });
  }

  history.push(now);
  requestTimestamps.set(ipKey, history);
  next();
}

// Lazy initialize Gemini API client to ensure stability if key is updated
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing');
    }
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

async function generateContentWithTimeout(ai: GoogleGenAI, params: any, timeoutMs = 8000): Promise<any> {
  return Promise.race([
    ai.models.generateContent(params),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Gemini request timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

// Health & Cost Control check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/api/cost-control/status', (req, res) => {
  res.json({
    status: 'active',
    serverProxyActive: true,
    geminiApiKeyConfigured: !!process.env.GEMINI_API_KEY,
    rateLimitingEnabled: true,
    maxRequestsPerMinute: MAX_REQUESTS_PER_WINDOW,
    time: new Date().toISOString()
  });
});

// ============================================================
// PRODUCTION BACKEND, ENTITLEMENT AUTHORITY & WEBHOOK FOUNDATION
// ============================================================

function getServerPaymentConfigStatus() {
  const paddleApiKeyConfigured = Boolean(process.env.PADDLE_API_KEY && process.env.PADDLE_API_KEY.trim());
  const paddleWebhookSecretConfigured = Boolean(process.env.PADDLE_WEBHOOK_SECRET && process.env.PADDLE_WEBHOOK_SECRET.trim());
  const paddleMonthlyPriceConfigured = Boolean(process.env.VITE_PADDLE_PRO_MONTHLY_PRICE_ID && process.env.VITE_PADDLE_PRO_MONTHLY_PRICE_ID.trim());
  const paddleYearlyPriceConfigured = Boolean(process.env.VITE_PADDLE_PRO_YEARLY_PRICE_ID && process.env.VITE_PADDLE_PRO_YEARLY_PRICE_ID.trim());
  const paddleConfigured = paddleApiKeyConfigured && paddleWebhookSecretConfigured && (paddleMonthlyPriceConfigured || paddleYearlyPriceConfigured);

  const googlePlayServiceAccountConfigured = Boolean(process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON && process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON.trim());
  const googlePlayRtdnTokenConfigured = Boolean(process.env.GOOGLE_PLAY_RTDN_WEBHOOK_TOKEN && process.env.GOOGLE_PLAY_RTDN_WEBHOOK_TOKEN.trim());
  const googlePlayConfigured = googlePlayServiceAccountConfigured;

  return {
    paddle: {
      provider: 'paddle' as const,
      role: 'WEB_GLOBAL_MERCHANT_OF_RECORD' as const,
      configured: paddleConfigured,
      environment: (process.env.PADDLE_ENVIRONMENT || process.env.VITE_PADDLE_ENV || 'sandbox') as 'sandbox' | 'production',
      hasApiKey: paddleApiKeyConfigured,
      hasWebhookSecret: paddleWebhookSecretConfigured,
      hasMonthlyPriceId: paddleMonthlyPriceConfigured,
      hasYearlyPriceId: paddleYearlyPriceConfigured
    },
    googlePlay: {
      provider: 'google_play_billing' as const,
      role: 'ANDROID_NATIVE_BILLING' as const,
      configured: googlePlayConfigured,
      packageName: process.env.GOOGLE_PLAY_PACKAGE_NAME || 'com.socialsharescheduler.app',
      hasServiceAccountCredentials: googlePlayServiceAccountConfigured,
      hasRtdnWebhookToken: googlePlayRtdnTokenConfigured,
      isPlaceholderProductIds: !process.env.VITE_PLAY_BILLING_MONTHLY_PRODUCT_ID && !process.env.VITE_PLAY_BILLING_YEARLY_PRODUCT_ID,
      monthlyProductId: process.env.VITE_PLAY_BILLING_MONTHLY_PRODUCT_ID || 'PRO_MONTHLY',
      yearlyProductId: process.env.VITE_PLAY_BILLING_YEARLY_PRODUCT_ID || 'PRO_YEARLY'
    },
    anyProviderConfigured: paddleConfigured || googlePlayConfigured
  };
}

/**
 * Verifies a Paddle Billing webhook signature (`Paddle-Signature: ts=12345;h1=abcdef...`)
 * using HMAC-SHA256 and constant-time comparison.
 */
function verifyPaddleWebhookSignature(rawSignatureHeader: string | undefined, rawBodyString: string, secret: string): boolean {
  if (!rawSignatureHeader || !secret || !rawBodyString) return false;
  try {
    const parts = rawSignatureHeader.split(';').map(p => p.trim());
    const tsPart = parts.find(p => p.startsWith('ts='));
    const h1Part = parts.find(p => p.startsWith('h1='));
    if (!tsPart || !h1Part) return false;

    const timestamp = tsPart.slice(3);
    const receivedHmacHex = h1Part.slice(3);
    if (!timestamp || !receivedHmacHex) return false;

    const signedPayload = `${timestamp}:${rawBodyString}`;
    const expectedHmacHex = crypto
      .createHmac('sha256', secret)
      .update(signedPayload, 'utf8')
      .digest('hex');

    const a = Buffer.from(receivedHmacHex, 'hex');
    const b = Buffer.from(expectedHmacHex, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// 1. Backend & Cloud Data Foundation Status Endpoint
app.get('/api/backend/foundation-status', (_req, res) => {
  const paymentConfig = getServerPaymentConfigStatus();
  res.json({
    success: true,
    serverProxyActive: true,
    databaseProvider: 'local_storage_only',
    databaseConnected: false,
    authProvider: 'local_guest',
    authProviderConnected: false,
    paymentProvider: paymentConfig.anyProviderConfigured
      ? (paymentConfig.paddle.configured ? 'paddle' : 'google_play_billing')
      : 'none',
    paymentWebhookConfigured: paymentConfig.paddle.hasWebhookSecret || paymentConfig.googlePlay.hasRtdnWebhookToken,
    entitlementAuthority: 'SERVER_AUTHORITATIVE_READY',
    supportedWebhookProviders: ['google_play_billing', 'paddle', 'lemon_squeezy', 'stripe'],
    paymentProvidersStatus: paymentConfig,
    timestamp: new Date().toISOString()
  });
});

// 1b. Dedicated Subscription & Payment Provider Configuration Status Endpoint
app.get('/api/subscriptions/config-status', (_req, res) => {
  const paymentConfig = getServerPaymentConfigStatus();
  res.json({
    success: true,
    configured: paymentConfig.anyProviderConfigured,
    paddle: paymentConfig.paddle,
    googlePlay: paymentConfig.googlePlay,
    timestamp: new Date().toISOString()
  });
});

// 2. Server-Authoritative Entitlement Verification Endpoint
// Security rule: Never trust client-supplied `plan: 'PRO'` from localStorage or request body.
// Only grant verified PRO when a connected billing database confirms an ACTIVE subscription for a verified user token.
app.post('/api/entitlements/verify', (req, res) => {
  const { userId } = req.body || {};
  const authHeader = req.headers.authorization;
  const hasBearerToken = typeof authHeader === 'string' && authHeader.startsWith('Bearer ');
  const paymentConfig = getServerPaymentConfigStatus();

  // Currently no production billing database or payment webhook store is connected.
  // Therefore, server authority strictly returns 'FREE' with verifiedByServer: false.
  res.json({
    success: true,
    serverReachable: true,
    databaseConnected: false,
    verifiedByServer: false,
    hasAuthToken: hasBearerToken,
    userId: typeof userId === 'string' && userId.trim() ? userId.trim() : 'anonymous_guest',
    authoritativePlan: 'FREE',
    paymentStatus: paymentConfig.anyProviderConfigured ? 'EXPIRED' : 'PAYMENT_NOT_CONFIGURED',
    paymentProvider: 'none',
    entitlementSource: 'SERVER_DEFAULT_FREE',
    evaluatedAt: new Date().toISOString(),
    message: 'Server entitlement check completed. No production billing database connected; authoritative public plan is FREE.'
  });
});

// 3. Create Checkout Session Endpoint (Web / Global Paddle MoR & Android Google Play Billing)
// Security rule: Never simulate fake payment success or automatically upgrade FREE -> PRO.
app.post('/api/subscriptions/checkout-session', (req, res) => {
  const { userId, billingCycle = 'monthly', platform = 'web_paddle', countryCode = 'US' } = req.body || {};
  const cleanCycle = billingCycle === 'yearly' ? 'yearly' : 'monthly';
  const paymentConfig = getServerPaymentConfigStatus();

  if (platform === 'android_google_play') {
    const productId = cleanCycle === 'yearly'
      ? paymentConfig.googlePlay.yearlyProductId
      : paymentConfig.googlePlay.monthlyProductId;

    if (!paymentConfig.googlePlay.configured) {
      return res.json({
        success: false,
        connected: false,
        configured: false,
        provider: 'google_play_billing',
        billingCycle: cleanCycle,
        productId,
        paymentStatus: 'PAYMENT_NOT_CONFIGURED',
        message: 'PRO billing is not connected yet.'
      });
    }

    return res.json({
      success: true,
      connected: true,
      configured: true,
      provider: 'google_play_billing',
      billingCycle: cleanCycle,
      productId,
      packageName: paymentConfig.googlePlay.packageName,
      userId: typeof userId === 'string' ? userId : 'anonymous_guest',
      paymentStatus: 'PAYMENT_PENDING',
      message: 'Launch Google Play Billing sheet on Android device and submit purchaseToken for server verification.'
    });
  }

  // Default Web / Global: Paddle Merchant of Record
  const priceId = cleanCycle === 'yearly'
    ? process.env.VITE_PADDLE_PRO_YEARLY_PRICE_ID || ''
    : process.env.VITE_PADDLE_PRO_MONTHLY_PRICE_ID || '';

  if (!paymentConfig.paddle.configured || !priceId) {
    return res.json({
      success: false,
      connected: false,
      configured: false,
      provider: 'paddle',
      billingCycle: cleanCycle,
      priceId: priceId || null,
      countryCode,
      paymentStatus: 'PAYMENT_NOT_CONFIGURED',
      message: 'PRO billing is not connected yet.'
    });
  }

  return res.json({
    success: true,
    connected: true,
    configured: true,
    provider: 'paddle',
    environment: paymentConfig.paddle.environment,
    billingCycle: cleanCycle,
    priceId,
    customData: {
      userId: typeof userId === 'string' ? userId : 'anonymous_guest',
      billingCycle: cleanCycle
    },
    paymentStatus: 'PAYMENT_PENDING',
    message: 'Paddle checkout session parameters prepared. Awaiting verified webhook completion before granting PRO.'
  });
});

// 4. Android Google Play Billing Purchase Token Verification Endpoint
// Security rule: Never grant PRO from an Android purchase unless verified with Google Play Developer API on the backend.
app.post('/api/subscriptions/google-play/verify', (req, res) => {
  const { userId, productId, purchaseToken, packageName } = req.body || {};
  const paymentConfig = getServerPaymentConfigStatus();

  if (!productId || !purchaseToken || typeof purchaseToken !== 'string') {
    return res.status(400).json({
      success: false,
      verified: false,
      configured: paymentConfig.googlePlay.configured,
      message: 'Missing required Google Play Billing productId or purchaseToken.'
    });
  }

  if (!paymentConfig.googlePlay.configured) {
    return res.json({
      success: false,
      verified: false,
      configured: false,
      provider: 'google_play_billing',
      userId: typeof userId === 'string' ? userId : 'anonymous_guest',
      productId,
      packageName: packageName || paymentConfig.googlePlay.packageName,
      paymentStatus: 'PAYMENT_NOT_CONFIGURED',
      message: 'PRO billing is not connected yet.'
    });
  }

  // Until connected to live Google Play Developer API + persistent billing database, do not fabricate verification
  return res.json({
    success: false,
    verified: false,
    configured: true,
    provider: 'google_play_billing',
    paymentStatus: 'PAYMENT_PENDING',
    message: 'Google Play Developer API live token verification database is not connected yet. Purchase was not marked active.'
  });
});

// 5. Server-Authoritative Subscription Status, Restore, Cancel & Manage Endpoints
app.post('/api/subscriptions/status', (req, res) => {
  const { userId } = req.body || {};
  const paymentConfig = getServerPaymentConfigStatus();
  res.json({
    success: true,
    connected: paymentConfig.anyProviderConfigured,
    verifiedByBackend: false,
    userId: typeof userId === 'string' ? userId : 'anonymous_guest',
    plan: 'FREE',
    paymentStatus: 'PAYMENT_NOT_CONFIGURED',
    provider: 'none',
    billingCycle: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    managementUrl: null,
    message: 'PRO billing is not connected yet.'
  });
});

app.post('/api/subscriptions/restore', (req, res) => {
  const { userId, platform = 'web_paddle', purchaseToken, productId } = req.body || {};
  const paymentConfig = getServerPaymentConfigStatus();
  res.json({
    success: false,
    connected: paymentConfig.anyProviderConfigured,
    restored: false,
    verifiedByBackend: false,
    userId: typeof userId === 'string' ? userId : 'anonymous_guest',
    platform,
    hasPurchaseToken: Boolean(purchaseToken && productId),
    plan: 'FREE',
    paymentStatus: 'PAYMENT_NOT_CONFIGURED',
    message: 'PRO billing is not connected yet.'
  });
});

app.post('/api/subscriptions/cancel', (req, res) => {
  const { userId } = req.body || {};
  const paymentConfig = getServerPaymentConfigStatus();
  res.json({
    success: false,
    connected: paymentConfig.anyProviderConfigured,
    cancelled: false,
    userId: typeof userId === 'string' ? userId : 'anonymous_guest',
    message: 'PRO billing is not connected yet.'
  });
});

app.post('/api/subscriptions/manage', (req, res) => {
  const { userId, platform = 'web_paddle' } = req.body || {};
  const paymentConfig = getServerPaymentConfigStatus();
  res.json({
    success: false,
    connected: paymentConfig.anyProviderConfigured,
    userId: typeof userId === 'string' ? userId : 'anonymous_guest',
    platform,
    managementUrl: null,
    message: 'PRO billing is not connected yet.'
  });
});

// 6. Dedicated Paddle Webhook Endpoint (HMAC-SHA256 Signature Verification)
app.post('/api/webhooks/paddle', (req, res) => {
  const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET || '';
  const signatureHeader = req.headers['paddle-signature'] as string | undefined;

  if (!webhookSecret.trim()) {
    return res.status(501).json({
      success: false,
      configured: false,
      provider: 'paddle',
      signatureHeaderPresent: Boolean(signatureHeader),
      message: 'Paddle webhook secret is not configured on the server. Event ignored.'
    });
  }

  const rawBody = JSON.stringify(req.body || {});
  const isValidSignature = verifyPaddleWebhookSignature(signatureHeader, rawBody, webhookSecret);
  if (!isValidSignature) {
    return res.status(401).json({
      success: false,
      configured: true,
      provider: 'paddle',
      signatureVerified: false,
      message: 'Invalid or missing Paddle-Signature header.'
    });
  }

  const eventType = String(req.body?.event_type || 'unknown');
  return res.status(202).json({
    success: true,
    configured: true,
    provider: 'paddle',
    signatureVerified: true,
    eventType,
    message: 'Paddle webhook signature verified. Connect persistent billing database to store entitlement update.'
  });
});

// 7. Dedicated Google Play RTDN (Real-Time Developer Notifications) Webhook Endpoint
app.post('/api/webhooks/google-play', (req, res) => {
  const rtdnToken = process.env.GOOGLE_PLAY_RTDN_WEBHOOK_TOKEN || '';
  const queryToken = String(req.query.token || '');
  const authHeader = req.headers.authorization;

  if (!rtdnToken.trim()) {
    return res.status(501).json({
      success: false,
      configured: false,
      provider: 'google_play_billing',
      message: 'Google Play RTDN webhook verification token is not configured on the server. Event ignored.'
    });
  }

  const tokenMatches = queryToken === rtdnToken || authHeader === `Bearer ${rtdnToken}`;
  if (!tokenMatches) {
    return res.status(401).json({
      success: false,
      configured: true,
      provider: 'google_play_billing',
      signatureVerified: false,
      message: 'Unauthorized Google Play RTDN webhook request.'
    });
  }

  return res.status(202).json({
    success: true,
    configured: true,
    provider: 'google_play_billing',
    signatureVerified: true,
    message: 'Google Play RTDN token verified. Connect persistent billing database to store entitlement update.'
  });
});

// 8. Provider-Agnostic Payment Webhook Receiver Stub
// Prepared for Google Play RTDN, Paddle, Lemon Squeezy, or Stripe webhook signature verification.
// Never processes fake transactions or unsigned webhook requests.
app.post('/api/webhooks/payment', (req, res) => {
  const providerHeader = String(req.headers['x-webhook-provider'] || 'unknown').toLowerCase();
  const hasSignature = Boolean(
    req.headers['stripe-signature'] ||
    req.headers['paddle-signature'] ||
    req.headers['x-signature'] ||
    req.headers['authorization']
  );

  res.status(501).json({
    success: false,
    configured: false,
    providerDetected: providerHeader,
    signatureHeaderPresent: hasSignature,
    message: 'Payment provider webhook secret and billing database are not connected yet. No subscription state was modified.'
  });
});

// 9. Cloud Data Sync Readiness Endpoint
app.post('/api/data/sync-status', (req, res) => {
  const { userId, deviceId, schemaVersion } = req.body || {};
  res.json({
    success: true,
    cloudDatabaseConnected: false,
    syncMode: 'LOCAL_FIRST_GUEST',
    syncState: 'READY_FOR_CLOUD',
    userId: typeof userId === 'string' ? userId : null,
    deviceId: typeof deviceId === 'string' ? deviceId : null,
    schemaVersion: typeof schemaVersion === 'number' ? schemaVersion : 3,
    evaluatedAt: new Date().toISOString(),
    message: 'Local-first data repository active. Connect a cloud database adapter to enable multi-device sync.'
  });
});

// Apply rate limiter to expensive AI and Discovery endpoints
app.use('/api/ai', costControlRateLimiter);
app.use('/api/news/web-discover', costControlRateLimiter);
app.use('/api/news/rewrite', costControlRateLimiter);

function toCleanArray(val: any): string[] {
  if (Array.isArray(val)) {
    return val.map(v => typeof v === 'string' ? v.trim() : String(v).trim()).filter(Boolean);
  }
  if (typeof val === 'string') {
    return val.split(/[,\s]+/).map(s => s.trim()).filter(Boolean);
  }
  return [];
}

// SSRF Protection: Validate that external URLs fetched by server proxy are public HTTP/HTTPS hosts
function isSafePublicUrl(rawUrl: string): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '[::1]' ||
      host === '169.254.169.254' ||
      host.endsWith('.local') ||
      host.endsWith('.internal') ||
      /^10\.\d+\.\d+\.\d+$/.test(host) ||
      /^192\.168\.\d+\.\d+$/.test(host) ||
      /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(host)
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// Server Error Sanitizer: Never leak API keys, env var names, or raw upstream gRPC quota dumps
function sanitizeServerError(err: any, fallback = 'Service request could not be completed'): string {
  const raw = typeof err === 'string' ? err : (err?.message || '');
  if (!raw) return fallback;
  if (/resource_exhausted|Quota exceeded|rate-limit|429/i.test(raw)) {
    return 'AI service is temporarily busy due to high demand. Fallback applied.';
  }
  if (/GEMINI_API_KEY|AIza[0-9A-Za-z_-]+|Bearer\s+/i.test(raw)) {
    return 'Backend service credential configuration notice.';
  }
  return raw.replace(/(AIza[0-9A-Za-z_-]{15,}|ya29\.[0-9A-Za-z_-]{15,})/g, '[REDACTED]').slice(0, 180);
}

// Helper to generate context-aware copy if all upstream AI models face transient demand spikes
function generateContextualFallback(topic?: string, mediaType?: string, mediaName?: string) {
  const cleanTopic = (topic || 'Keseruan Trip & Wisata Jangari').trim();
  const isJangari = /jangari/i.test(cleanTopic);
  const isFishing = /mancing|fish/i.test(cleanTopic);

  let title = cleanTopic;
  if (!/^(seru|tips|review|jelajah|spot|strike)/i.test(title)) {
    title = `${cleanTopic} - Momen Seru & Inspirasi Menarik`;
  }

  let caption = `${cleanTopic}! Pengalaman menarik yang wajib dicoba dan dibagikan bersama teman serta keluarga.`;
  if (isJangari || isFishing) {
    caption = `Sensasi seru di Waduk Jangari! Pemandangan danau yang tenang dan spot mancing terbaik untuk refreshing akhir pekan.`;
  }

  const description = `${cleanTopic}.\n\nMenikmati suasana yang asri dengan panorama indah di sekitar waduk serta keramahan warga lokal. Dokumentasi perjalanan seru yang terekam sempurna.`;
  const callToAction = 'Tonton selengkapnya, simpan, dan bagikan ke teman-temanmu!';
  
  let hashtags = ['#Wisata', '#Trending', '#ExploreIndonesia', '#Creator', '#Viral'];
  if (isJangari || isFishing) {
    hashtags = ['#Jangari', '#MancingMania', '#WadukJangari', '#WisataJawaBarat', '#SpotMancing'];
  }

  return { title, caption, description, callToAction, hashtags: hashtags.slice(0, 5) };
}

// Fallback generator for platform-specific content
function generatePlatformSpecificFallback(
  topic?: string,
  mediaType?: string,
  mediaName?: string,
  platforms: string[] = [],
  fbPageContentType: 'post' | 'reel' = 'post',
  fbProfileContentType: 'post' | 'reel' = 'post'
) {
  const cleanTopic = (topic || 'Keseruan Trip & Wisata Jangari').trim();
  const isJangari = /jangari/i.test(cleanTopic);
  const isFishing = /mancing|fish/i.test(cleanTopic);

  const outputs: Record<string, any> = {};

  if (platforms.includes('facebook_page')) {
    if (fbPageContentType === 'reel') {
      outputs['facebook_page'] = {
        opening: isJangari || isFishing ? 'Momen strike mantap di Waduk Jangari! 🎣🔥' : `Keseruan ${cleanTopic} yang wajib kamu tonton! 🔥`,
        caption: isJangari || isFishing
          ? 'Sensasi strike ikan air tawar di Waduk Jangari, suasana sejuk dan spot keramba terapung yang memukau. Tonton keseruannya sampai selesai ya!'
          : `Highlight seru seputar ${cleanTopic}! Momen berharga yang penuh energi positif dan pengalaman menarik.`,
        callToAction: 'Follow halaman kami untuk video reel seru lainnya!',
        hashtags: isJangari || isFishing 
          ? ['#FacebookReels', '#ReelsFB', '#Jangari', '#MancingMania', '#WisataJawaBarat']
          : ['#FacebookReels', '#Reels', '#Trending', '#Explore', '#Viral']
      };
    } else {
      outputs['facebook_page'] = {
        caption: isJangari || isFishing
          ? `Sensasi seru di Waduk Jangari, Jawa Barat! Bagi pecinta mancing dan penikmat alam, Jangari bukan sekadar tempat refreshing, tapi juga surganya strike ikan air tawar dengan panorama perairan dan keramba terapung yang menenangkan.\n\nBanyak spot menarik yang bisa dijelajahi mulai dari pagi hingga sore hari bersama keluarga atau komunitas mancing.`
          : `${cleanTopic}!\n\nPengalaman seru dan momen inspiratif yang sayang untuk dilewatkan. Suasana menyenangkan dan pemandangan menarik yang cocok dinikmati bersama teman dan keluarga tercinta.`,
        callToAction: 'Simpan postingan ini untuk referensi liburanmu dan bagikan ke teman-temanmu ya!',
        hashtags: isJangari || isFishing 
          ? ['#Jangari', '#MancingMania', '#WisataJawaBarat', '#WadukJangari', '#NgabloeVenture']
          : ['#Wisata', '#Trending', '#ExploreIndonesia', '#Creator', '#Viral']
      };
    }
  }

  if (platforms.includes('facebook_profile') || platforms.includes('facebook')) {
    const profKey = platforms.includes('facebook_profile') ? 'facebook_profile' : 'facebook';
    if (fbProfileContentType === 'reel') {
      outputs[profKey] = {
        opening: isJangari || isFishing ? 'Nggak nyangka dapet momen sekeren ini di Jangari! 🎣' : `Serunya hari ini bareng teman-teman! ✨`,
        caption: isJangari || isFishing
          ? 'Nggak nyangka dapet momen sekeren ini di Jangari! Suasana tenang, ikan makan kencang, bener-bener refreshing yang mantap.'
          : `Momen seru ${cleanTopic} yang berkesan banget hari ini. Senang bisa mengabadikan suasana ini!`,
        hashtags: isJangari || isFishing
          ? ['#FacebookReels', '#Mancing', '#Jangari', '#LiburanSeru']
          : ['#Reels', '#DailyVibe', '#StoryToday', '#Friends']
      };
    } else {
      outputs[profKey] = {
        caption: isJangari || isFishing
          ? 'Alhamdulillah bisa refreshing ke Waduk Jangari hari ini. Suasananya tenang banget, angin sepoi-sepoi sambil nunggu joran. Pas banget buat lepas penat bareng kawan-kawan setelah rutinitas seminggu. Ada yang hobi mancing ke sini juga?'
          : `Hari ini seru banget berkesempatan menikmati ${cleanTopic}. Pengalaman yang berharga dan banyak pelajaran baru yang bisa diambil. Senang rasanya bisa berbagi momen ini dengan kalian semua.`,
        hashtags: isJangari || isFishing
          ? ['#CeritaHariIni', '#Jangari', '#MancingSantai', '#WeekendVibes']
          : ['#CatatanHariIni', '#LifeUpdate', '#MomenBahagia', '#Bersyukur']
      };
    }
  }

  if (platforms.includes('instagram')) {
    outputs['instagram'] = {
      opening: isJangari || isFishing ? 'Spot mancing terbaik dengan view juara di Jangari! 🎣✨' : `${cleanTopic}! Momen seru yang wajib diabadikan ✨`,
      caption: isJangari || isFishing
        ? `Spot mancing terbaik dengan view juara di Jangari! 🎣✨\n\nMenikmati ketenangan danau sambil nunggu joran melengkung. Udara sejuk, air tenang, dan suasana santai bikin betah berlama-lama.\n\nTag partner mancing kamu yang wajib diajak ke sini!`
        : `${cleanTopic}! Momen seru yang wajib diabadikan ✨\n\nMenikmati setiap detik petualangan dengan pemandangan luar biasa dan cerita baru.\n\nDouble tap kalau kamu suka vibes seperti ini! ❤️`,
      hashtags: isJangari || isFishing
        ? ['#Jangari', '#Mancing', '#WisataJawaBarat', '#Fishing', '#NgabloeVenture', '#MancingMania', '#SpotMancing', '#DanauJangari', '#CianjurExplore', '#IndoFishing']
        : ['#Explore', '#TravelGram', '#Visuals', '#Inspiration', '#Community', '#Storytelling', '#IndoTravel', '#Creators', '#DailyPost', '#InstaGood']
    };
  }

  if (platforms.includes('tiktok')) {
    outputs['tiktok'] = {
      hook: isJangari || isFishing ? 'Spot mancing rahasia di Waduk Jangari yang wajib kamu coba!' : `Kalian harus tahu serunya ${cleanTopic}!`,
      caption: isJangari || isFishing
        ? 'Spot mancing rahasia di Waduk Jangari! View tenang, strike mantap. Jangan lupa bookmark buat trip weekend kamu! 🎣'
        : `Momen seru ${cleanTopic} yang bikin nagih! Tonton sampai habis ya! 🔥`,
      hashtags: isJangari || isFishing
        ? ['#Jangari', '#Mancing', '#TikTokTravel', '#MancingMania', '#SpotMancing']
        : ['#Trending', '#FYP', '#TikTokCreator', '#SerunyaLiburan', '#Viral']
    };
  }

  if (platforms.includes('youtube')) {
    outputs['youtube'] = {
      title: isJangari || isFishing ? 'Jangari, Surga Pemancing di Jawa Barat - Spot & Suasana Seru' : `${cleanTopic} - Momen Seru & Dokumentasi Lengkap`,
      description: isJangari || isFishing
        ? `Jangari bukan cuma tempat mancing, tapi juga menawarkan panorama dan suasana yang menarik untuk dijelajahi.\n\nDi video ini kami mengabadikan keseruan suasana danau, spot keramba terapung, dan keindahan alam Waduk Jangari di Cianjur, Jawa Barat.\n\nJangan lupa Like, Comment, dan Subscribe untuk update video petualangan berikutnya!`
        : `Dokumentasi lengkap mengenai ${cleanTopic}.\n\nTerima kasih sudah menonton, jangan lupa Like, Comment, dan Subscribe ya!`,
      tags: isJangari || isFishing
        ? ['jangari', 'mancing jangari', 'waduk jangari', 'mancing cianjur', 'spot mancing liar', 'mancing mania', 'wisata jawa barat', 'ikan nila babon', 'keramba terapung', 'fishing vlog', 'petualangan mancing', 'danau cirata jangari']
        : ['vlog', 'trip', 'review', 'inspirasi', 'video viral', 'kreator', 'dokumentasi', 'travel'],
      hashtags: isJangari || isFishing
        ? ['#Jangari', '#Mancing', '#WisataJawaBarat', '#Fishing', '#YouTubeShorts']
        : ['#Explore', '#Creator', '#Trending', '#Video', '#Shorts']
    };
  }

  if (platforms.includes('twitter')) {
    outputs['twitter'] = {
      caption: isJangari || isFishing
        ? 'Keseruan trip mancing di Waduk Jangari hari ini! Suasana tenang, spot keramba mantap untuk refreshing.'
        : `Update seru seputar ${cleanTopic}! Pengalaman menarik yang layak dibagikan.`,
      hashtags: isJangari || isFishing
        ? ['#Jangari', '#Mancing', '#Wisata']
        : ['#Explore', '#Update', '#Trending']
    };
  }

  if (platforms.includes('threads')) {
    outputs['threads'] = {
      caption: isJangari || isFishing
        ? `Halo kawan-kawan! Mau share momen seru trip mancing di Waduk Jangari, Jawa Barat nih. Pemandangannya adem dan spotnya asyik banget buat kumpul sambil mancing.`
        : `Halo semuanya! Mau berbagi info dan dokumentasi seru tentang ${cleanTopic}. Semoga bisa jadi inspirasi ya!`,
      callToAction: 'Kira-kira kapan kita agendakan jalan atau mancing bareng lagi? Kabari ya!',
      hashtags: isJangari || isFishing
        ? ['#Jangari', '#Mancing', '#ThreadsID']
        : ['#Explore', '#Update', '#Threads']
    };
  }

  return outputs;
}

// Dedicated Platform-Specific Content Generator Endpoint
app.post('/api/ai/generate-platform-content', async (req, res) => {
  const { topic, mediaType, mediaName, platforms, singlePlatform, fbPageContentType = 'post', fbProfileContentType = 'post' } = req.body;

  const targetPlatforms: string[] = singlePlatform 
    ? [singlePlatform] 
    : (Array.isArray(platforms) && platforms.length > 0 ? platforms : ['facebook_page', 'facebook_profile', 'instagram', 'tiktok', 'youtube', 'twitter', 'threads']);

  try {
    const ai = getGeminiClient();

    const fbPageRule = fbPageContentType === 'reel'
      ? `1. FACEBOOK PAGE (REEL format):
   - "opening": catchy hook line for Facebook Reel
   - "caption": short engaging Reel caption with energetic tone
   - "callToAction": optional quick call-to-action (e.g. "Follow halaman kami untuk update berikutnya!")
   - "hashtags": up to 5 relevant hashtags with # (including #FacebookReels or #Reels)`
      : `1. FACEBOOK PAGE (PAGE POST format):
   - "caption": natural Facebook page style, descriptive, engaging paragraphs
   - "callToAction": optional call-to-action
   - "hashtags": up to 5 relevant hashtags with #`;

    const fbProfileRule = fbProfileContentType === 'reel'
      ? `2. FACEBOOK PERSONAL PROFILE (PROFILE REEL format):
   - "opening": engaging opening hook for personal profile Reel
   - "caption": short Reel caption with an engaging opening, fun and personal
   - "hashtags": up to 5 relevant hashtags with # (e.g. #FacebookReels #StoryToday)`
      : `2. FACEBOOK PERSONAL PROFILE (PROFILE POST format):
   - "caption": natural personal-profile style caption (authentic, friendly, warm first-person perspective, sharing genuine moments with friends & family, less commercial)
   - "hashtags": up to 3-5 relevant hashtags with #`;

    const prompt = `You are an expert multi-platform social media content generator.
The user wants tailored social media copy for specific platforms based strictly on their topic.

Topic / Description provided by user: "${topic || 'General social media update'}"
Media Attached: ${mediaType ? `${mediaType} (filename: ${mediaName || 'file'})` : 'None specified'}
Target Platforms to generate: ${targetPlatforms.join(', ')}

Platform Requirements:
${fbPageRule}

${fbProfileRule}

3. INSTAGRAM:
   - "opening": engaging opening hook line
   - "caption": visually structured caption with line breaks
   - "hashtags": up to 10 relevant hashtags with #
4. TIKTOK:
   - "hook": strong short hook for short-form video
   - "caption": punchy short caption
   - "hashtags": up to 5 relevant hashtags with #
5. YOUTUBE:
   - "title": catchy video title (under 100 characters)
   - "description": detailed video description with overview and call-to-action
   - "tags": array of up to 15 search keywords (plain words, no #)
   - "hashtags": up to 5 hashtags with #
6. TWITTER (X):
   - "caption": concise post suitable for X (must stay under 240 characters)
   - "hashtags": up to 3 hashtags with #
7. THREADS:
   - "caption": conversational post suitable for Threads (under 450 characters)
   - "callToAction": optional closing question or call-to-action
   - "hashtags": up to 5 hashtags with #

AI SAFETY & ACCURACY RULES:
- Do NOT invent facts, fake quotes, or false claims about the attached media.
- If the user provides sparse information, only expand creatively using the provided words without hallucinating visual elements.
- DO NOT claim that you visually scanned or recognized anything in the image unless explicitly told by the user.
- Generate outputs ONLY for the requested platforms: ${targetPlatforms.join(', ')}.`;

    const candidateModels = [
      'gemini-3.1-flash-lite',
      'gemini-3.8-flash'
    ];

    let response: any = null;
    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        response = await generateContentWithTimeout(
          ai,
          {
            model,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              ...(model === 'gemini-3.8-flash' ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {})
            }
          },
          8000
        );
        if (response?.text) break;
      } catch (err: any) {
        lastError = err;
        await new Promise(r => setTimeout(r, 150));
      }
    }

    let parsed: any = null;
    if (response?.text) {
      try {
        parsed = JSON.parse(response.text.trim());
      } catch {
        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        }
      }
    }

    const fallback = generatePlatformSpecificFallback(topic, mediaType, mediaName, targetPlatforms);
    const merged: Record<string, any> = {};

    for (const p of targetPlatforms) {
      const pKey = p === 'facebook' ? 'facebook_page' : p;
      if (parsed && parsed[pKey]) {
        merged[pKey] = parsed[pKey];
      } else if (parsed && parsed[p]) {
        merged[pKey] = parsed[p];
      } else {
        merged[pKey] = fallback[pKey] || fallback[p];
      }

      // Enforce caps and array types
      if (merged[pKey]) {
        if (merged[pKey].hashtags !== undefined) {
          merged[pKey].hashtags = toCleanArray(merged[pKey].hashtags);
        }
        if (merged[pKey].tags !== undefined) {
          merged[pKey].tags = toCleanArray(merged[pKey].tags);
        }

        if (pKey === 'facebook_page') {
          merged[pKey].hashtags = (merged[pKey].hashtags || []).slice(0, 5);
        } else if (pKey === 'instagram') {
          merged[pKey].hashtags = (merged[pKey].hashtags || []).slice(0, 10);
        } else if (pKey === 'tiktok') {
          merged[pKey].hashtags = (merged[pKey].hashtags || []).slice(0, 5);
        } else if (pKey === 'youtube') {
          merged[pKey].tags = (merged[pKey].tags || []).slice(0, 15);
          merged[pKey].hashtags = (merged[pKey].hashtags || []).slice(0, 5);
        } else if (pKey === 'twitter') {
          merged[pKey].hashtags = (merged[pKey].hashtags || []).slice(0, 3);
          if (merged[pKey].caption && merged[pKey].caption.length > 250) {
            merged[pKey].caption = merged[pKey].caption.slice(0, 247) + '...';
          }
        }
      }
    }

    res.json({ success: true, data: merged });
  } catch (error: any) {
    console.warn('Platform AI generation fallback applied:', error?.message || error);
    const fallback = generatePlatformSpecificFallback(topic, mediaType, mediaName, targetPlatforms, fbPageContentType, fbProfileContentType);
    res.json({ success: true, data: fallback, isFallback: true });
  }
});

// AI Content Generation endpoint
app.post('/api/ai/generate', async (req, res) => {
  const { topic, mediaType, mediaName, platformHints } = req.body;

  try {
    const ai = getGeminiClient();

    const prompt = `You are an expert social media copywriter for an Android cross-posting application.
Create a high-performing social media package based on:
Topic / Brief: "${topic || 'General engaging social media update'}"
Media Attached: ${mediaType ? `${mediaType} named ${mediaName || 'user_file'}` : 'None'}
Target Platforms: ${platformHints?.join(', ') || 'Facebook, Instagram, YouTube, TikTok, X'}

Important Rules:
1. Provide exactly maximum 5 relevant hashtags without spaces, formatted with #.
2. The title and caption should feel natural, authentic, and ready to share.`;

    // Try multiple model tiers starting with the lightweight, fastest model to prevent 503 spikes
    const candidateModels = [
      'gemini-3.1-flash-lite',
      'gemini-3.8-flash'
    ];
    let lastError: any = null;
    let response: any = null;

    for (const model of candidateModels) {
      try {
        response = await generateContentWithTimeout(
          ai,
          {
            model,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              ...(model === 'gemini-3.8-flash' ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {}),
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: {
                    type: Type.STRING,
                    description: 'Short catchy title (e.g. Jangari, Surga Pemancing di Jawa Barat)',
                  },
                  caption: {
                    type: Type.STRING,
                    description: 'Engaging conversational caption (2-3 sentences)',
                  },
                  description: {
                    type: Type.STRING,
                    description: 'Full detailed description suitable for YouTube, Facebook Page or blog notes',
                  },
                  callToAction: {
                    type: Type.STRING,
                    description: 'Direct, punchy CTA (e.g. Tonton video selengkapnya dan bagikan ke teman mancingmu!)',
                  },
                  hashtags: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.STRING,
                    },
                    description: 'Up to 5 relevant hashtags including the # symbol',
                  },
                },
                required: ['title', 'caption', 'description', 'callToAction', 'hashtags'],
              },
            },
          },
          8000
        );
        if (response?.text) {
          break;
        }
      } catch (err: any) {
        console.warn(`Model ${model} attempt notice:`, err?.message || err);
        lastError = err;
        await new Promise(resolve => setTimeout(resolve, 150));
      }
    }

    let parsedData: any = null;
    if (response?.text) {
      try {
        parsedData = JSON.parse(response.text.trim());
      } catch {
        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
        }
      }
    }

    if (!parsedData || !parsedData.title) {
      parsedData = generateContextualFallback(topic, mediaType, mediaName);
    }

    // Ensure hashtags is strictly an array capped at 5
    parsedData.hashtags = toCleanArray(parsedData.hashtags).slice(0, 5);

    res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.warn('AI generation graceful fallback applied:', error?.message || error);
    const fallbackData = generateContextualFallback(topic, mediaType, mediaName);
    res.json({ 
      success: true, 
      data: fallbackData,
      isFallback: true
    });
  }
});

// Mock simulation endpoint for platform status validation (simulating official API vs intent fallback)
app.post('/api/publish/check-status', (req, res) => {
  const { platformId } = req.body;
  // X and Facebook Fan Page support direct Page API simulation
  if (platformId === 'facebook_page' || platformId === 'twitter') {
    res.json({
      platformId,
      canPublishApi: true,
      apiAuthStatus: 'Authorized'
    });
  } else {
    res.json({
      platformId,
      canPublishApi: false,
      reason: 'Android native share intent required for profile or media verification'
    });
  }
});

// ============================================================
// NEWS HUNTER ENDPOINTS
// ============================================================

// 1. Fetch RSS Feed Server-Side (Bypasses CORS restrictions)
app.post('/api/news/fetch-rss', async (req, res) => {
  const { url, sourceName = 'RSS Source', category = 'General' } = req.body;

  if (!url || typeof url !== 'string' || !isSafePublicUrl(url)) {
    return res.status(400).json({ success: false, error: 'A valid public HTTP/HTTPS RSS URL is required' });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8500);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsHunter/1.0; +https://social-scheduler.local)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      }
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(502).json({
        success: false,
        error: `Remote server responded with HTTP ${response.status}`
      });
    }

    const xmlText = await response.text();
    const parsed = parseRssXml(xmlText, category);

    const articles = parsed.items.map((item, idx) => ({
      id: `rss-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      title: item.title,
      url: item.link,
      source: sourceName,
      publishedAt: item.publishedAt,
      summary: item.summary,
      imageUrl: item.imageUrl || (item.media?.type === 'image' ? item.media.url : item.media?.thumbnailUrl || null),
      media: item.media || null,
      category,
      sourceType: 'RSS',
      discoveredAt: new Date().toISOString()
    }));

    res.json({
      success: true,
      feedTitle: parsed.title,
      articles
    });
  } catch (err: any) {
    const isTimeout = err?.name === 'AbortError';
    res.status(500).json({
      success: false,
      error: isTimeout ? 'Request timed out' : sanitizeServerError(err, 'Failed to fetch RSS feed')
    });
  }
});

// 2. Test RSS Feed Endpoint
app.post('/api/news/test-rss', async (req, res) => {
  const { url, name = 'RSS Source' } = req.body;
  if (!url || typeof url !== 'string' || !isSafePublicUrl(url)) {
    return res.status(400).json({ success: false, error: 'Valid public HTTP/HTTPS URL required' });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsHunter/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      }
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return res.json({
        success: false,
        message: `HTTP ${response.status} from source`,
        itemCount: 0
      });
    }

    const xml = await response.text();
    const parsed = parseRssXml(xml);

    res.json({
      success: true,
      message: `Berhasil terhubung. Ditemukan ${parsed.items.length} artikel.`,
      itemCount: parsed.items.length,
      sampleTitle: parsed.items[0]?.title || 'Tidak ada judul'
    });
  } catch (err: any) {
    res.json({
      success: false,
      message: err?.name === 'AbortError' ? 'Koneksi timeout (server tidak merespons)' : (err?.message || 'Gagal mengakses RSS'),
      itemCount: 0
    });
  }
});

// 3. Web News Discovery Endpoint (Country- & Language-Aware)
app.post('/api/news/web-discover', async (req, res) => {
  const { 
    category = 'National', 
    countryCode = 'GLOBAL', 
    countryName = 'Global / International', 
    language = 'en',
    customQuery
  } = req.body;

  try {
    const ai = getGeminiClient();
    const cleanCategory = String(category);
    const cleanCustomQuery = customQuery ? String(customQuery).trim() : '';
    const cleanCountryCode = String(countryCode).toUpperCase();
    const cleanCountryName = String(countryName);

    // Resolve prompt language instruction
    const isId = cleanCountryCode === 'ID' || language === 'id';
    const isJa = cleanCountryCode === 'JP' || language === 'ja';
    const isDe = cleanCountryCode === 'DE' || language === 'de';
    const isFr = cleanCountryCode === 'FR' || language === 'fr';
    const isEs = cleanCountryCode === 'ES' || language === 'es';

    let regionContext = `Region / Country: "${cleanCountryName} (${cleanCountryCode})"`;
    if (cleanCountryCode === 'GLOBAL') {
      regionContext = `Region: "Global / Worldwide International News"`;
    }

    const topicDescriptor = cleanCustomQuery
      ? (cleanCategory && cleanCategory !== 'All Categories' && cleanCategory !== 'Custom Search'
          ? `Custom Topic / Keyword: "${cleanCustomQuery}" (within category: "${cleanCategory}")`
          : `Custom Topic / Keyword: "${cleanCustomQuery}"`)
      : `Category / Topic: "${cleanCategory}"`;

    const assignedCategory = cleanCustomQuery
      ? (cleanCategory && cleanCategory !== 'All Categories' && cleanCategory !== 'Custom Search' ? cleanCategory : cleanCustomQuery)
      : cleanCategory;

    const prompt = `Perform a discovery search for the latest verified news and topical stories for:
${regionContext}
${topicDescriptor}

Find up to 4 real, factual, and verified news stories from reputable news organizations in this country/region (or global sources covering this topic).
For United States: NPR, AP, Reuters, ABC, CNN, Politico, ESPN, The Verge
For United Kingdom: BBC News, The Guardian, Sky News, The Telegraph
For Indonesia: Detik, Kompas, CNN Indonesia, Antara News, Tempo, Bola.com
For Japan: NHK News, Asahi Shimbun, Yahoo! JAPAN, Mainichi
For Germany: Tagesschau, Der Spiegel, Die Zeit, Kicker
For France: Le Monde, France 24, Le Figaro
For Spain: El País, RTVE, Marca, El Mundo
For Global: BBC World, Al Jazeera, Reuters, UN News, France 24 EN

IMPORTANT:
- Do NOT fabricate fake news or hallucinate non-existent events.
- Return real news headlines, reputable source media names, approximate source domain or link, concise 1-2 sentence factual summary, and recent publication date.
- Language of content: prefer the local primary language for this country (${isId ? 'Indonesian' : isJa ? 'Japanese' : isDe ? 'German' : isFr ? 'French' : isEs ? 'Spanish' : 'English'}) or high quality English.
- Return strictly a JSON Array:
[
  {
    "title": "Headline",
    "source": "Reputable Media Name",
    "url": "https://...",
    "summary": "Factual 1-2 sentence summary",
    "publishedAt": "${new Date().toISOString()}"
  }
]`;

    let response: any = null;
    for (const model of ['gemini-3.1-flash-lite', 'gemini-3.8-flash']) {
      try {
        response = await generateContentWithTimeout(
          ai,
          {
            model,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              ...(model === 'gemini-3.8-flash' ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {})
            }
          },
          7000
        );
        if (response?.text) break;
      } catch (apiErr: any) {
        console.warn(`Gemini web-discover (${model}) notice:`, apiErr?.message || apiErr);
      }
    }

    let articles: any[] = [];
    if (response?.text) {
      try {
        const parsed = JSON.parse(response.text.trim());
        if (Array.isArray(parsed)) {
          articles = parsed.map((item, idx) => ({
            id: `web-${Date.now()}-${idx}`,
            title: item.title || 'Top News Story',
            url: item.url || 'https://news.google.com',
            source: item.source || `${cleanCountryName} Media`,
            summary: item.summary || item.title || '',
            publishedAt: item.publishedAt || new Date().toISOString(),
            imageUrl: null,
            category: assignedCategory,
            countryCode: cleanCountryCode,
            countryName: cleanCountryName,
            sourceLanguage: language || (cleanCountryCode === 'ID' ? 'id' : 'en'),
            sourceType: 'WEB',
            discoveredAt: new Date().toISOString()
          }));
        }
      } catch {
        // Safe fallback
      }
    }

    res.json({ success: true, articles });
  } catch (err: any) {
    console.warn('Web discover error:', err?.message || err);
    res.json({ success: true, articles: [] });
  }
});

// 4. AI Rewrite & Fact Safety Endpoint (Cross-Language Supported)
app.post('/api/news/rewrite', async (req, res) => {
  const { 
    title, 
    summary, 
    url, 
    source, 
    category, 
    clusterSources, 
    mediaMetadata,
    targetLanguage = 'same_as_news',
    sourceLanguage = 'id'
  } = req.body;

  try {
    const ai = getGeminiClient();

    const isBreaking = /breaking|diduga|sementara|korban|terkini|breaking news/i.test(title || '');
    const sourcesSummary = Array.isArray(clusterSources) && clusterSources.length > 1
      ? `Cluster sources (${clusterSources.length}): ${clusterSources.map((s: any) => `${s.source} ("${s.title}")`).join('; ')}`
      : `Single source: ${source}`;

    const mediaInfoText = mediaMetadata 
      ? `Type: ${mediaMetadata.type || 'image'}, Source: ${mediaMetadata.sourceName || source}, Format: ${mediaMetadata.mimeType || 'standard'}`
      : 'No media attached';

    // Target Language Determination
    let targetLangInstruction = 'the same language as the news source';
    if (targetLanguage === 'en') {
      targetLangInstruction = 'English';
    } else if (targetLanguage === 'id') {
      targetLangInstruction = 'Indonesian (Bahasa Indonesia)';
    } else if (targetLanguage === 'ja') {
      targetLangInstruction = 'Japanese (日本語)';
    } else if (targetLanguage === 'de') {
      targetLangInstruction = 'German (Deutsch)';
    } else if (targetLanguage === 'fr') {
      targetLangInstruction = 'French (Français)';
    } else if (targetLanguage === 'es') {
      targetLangInstruction = 'Spanish (Español)';
    } else if (targetLanguage === 'pt') {
      targetLangInstruction = 'Portuguese (Português)';
    } else if (targetLanguage === 'ko') {
      targetLangInstruction = 'Korean (한국어)';
    }

    const prompt = `You are an expert news journalist and social media copywriter.
Your task is to produce an ORIGINAL FACTUAL REWRITE and social media platform copies for the news story below.

TARGET OUTPUT LANGUAGE: ${targetLangInstruction}.
All rewritten titles, descriptions, and platform-specific copies MUST be written in ${targetLangInstruction}.
If the original news source is in another language, translate and adapt fluently into ${targetLangInstruction} while preserving all factual names, entities, numbers, and dates accurately without hallucination.

NEWS MATERIAL:
Original Headline: "${title || ''}"
Original Summary: "${summary || ''}"
Source(s): ${sourcesSummary}
Category: "${category || 'General'}"
Source Language: ${sourceLanguage || 'auto'}
Media context: ${mediaInfoText}

STRICT SAFETY & QUALITY RULES:
1. DO NOT verbatim copy phrases from the source (write an original paraphrase).
2. DO NOT fabricate new facts beyond what is stated in the headline, summary, and verified sources.
3. MEDIA RESTRICTION:
   - Images/videos are supporting visual assets, NOT proof of additional unverified events.
   - Do NOT invent quotes, people, numbers, or casualty figures from media inspection.
4. ACCURACY STATUS:
   - If developing/breaking/allegations: factStatus = "developing", factNotice = "Developing story — verify before publishing."
   - If sources conflict: factStatus = "differing", factNotice = "Sources differ on key details."
   - If confirmed facts/official match results/official statements: factStatus = "confirmed".
5. Provide 4 Title Variations in ${targetLangInstruction}:
   - informative: Direct, factual, professional
   - curiosity: Engaging hook without deceptive clickbait
   - short_viral: Punchy, concise, social-media ready
   - seo: Keyword-optimized for discovery
6. Produce Platform-Specific Copies in ${targetLangInstruction}:
   - facebookCaption: informative, well-spaced post with clean structure
   - instagramCaption: hook opening line, bullet points, engaging question
   - tiktokHook: 1 powerful hook sentence for opening a short video
   - tiktokCaption: short, snappy video caption
   - youtubeTitle: clear and engaging video title
   - youtubeDescription: structured summary with key takeaways
   - xPost: punchy tweet STRICTLY UNDER 260 CHARACTERS
   - threadsPost: conversational Threads post with engaging discussion prompt
7. HASHTAGS:
   - facebook: max 5 hashtags
   - instagram: max 10 hashtags
   - tiktok: max 5 hashtags
   - youtube: max 5 hashtags
   - x: max 3 hashtags
   - threads: max 5 hashtags

STRICT JSON OUTPUT FORMAT:
{
  "selectedTitle": "...",
  "titleOptions": [
    { "type": "informative", "label": "Informative", "title": "..." },
    { "type": "curiosity", "label": "Curiosity", "title": "..." },
    { "type": "short_viral", "label": "Short Viral", "title": "..." },
    { "type": "seo", "label": "SEO-Friendly", "title": "..." }
  ],
  "shortDescription": "2-sentence original summary...",
  "factStatus": "confirmed" | "developing" | "differing",
  "factNotice": "...",
  "facebookCaption": "...",
  "instagramCaption": "...",
  "tiktokHook": "...",
  "tiktokCaption": "...",
  "youtubeTitle": "...",
  "youtubeDescription": "...",
  "xPost": "...",
  "threadsPost": "...",
  "hashtags": {
    "facebook": ["#..."],
    "instagram": ["#..."],
    "tiktok": ["#..."],
    "youtube": ["#..."],
    "x": ["#..."],
    "threads": ["#..."]
  }
}`;

    let response: any = null;
    for (const model of ['gemini-3.1-flash-lite', 'gemini-3.8-flash']) {
      try {
        response = await generateContentWithTimeout(
          ai,
          {
            model,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              ...(model === 'gemini-3.8-flash' ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {})
            }
          },
          8500
        );
        if (response?.text) break;
      } catch (err) {
        await new Promise(r => setTimeout(r, 150));
      }
    }

    let rewrite: any = null;
    if (response?.text) {
      try {
        rewrite = JSON.parse(response.text.trim());
      } catch {
        const match = response.text.match(/\{[\s\S]*\}/);
        if (match) rewrite = JSON.parse(match[0]);
      }
    }

    if (!rewrite || !rewrite.selectedTitle) {
      // High-quality contextual fallback
      rewrite = generateNewsRewriteFallback(title, summary, category, isBreaking);
    }

    // Safety enforce hashtag counts and X post length
    if (rewrite.hashtags) {
      rewrite.hashtags.facebook = (rewrite.hashtags.facebook || []).slice(0, 5);
      rewrite.hashtags.instagram = (rewrite.hashtags.instagram || []).slice(0, 10);
      rewrite.hashtags.tiktok = (rewrite.hashtags.tiktok || []).slice(0, 5);
      rewrite.hashtags.youtube = (rewrite.hashtags.youtube || []).slice(0, 5);
      rewrite.hashtags.x = (rewrite.hashtags.x || []).slice(0, 3);
      rewrite.hashtags.threads = (rewrite.hashtags.threads || []).slice(0, 5);
    }
    if (rewrite.xPost && rewrite.xPost.length > 270) {
      rewrite.xPost = rewrite.xPost.slice(0, 267) + '...';
    }

    res.json({ success: true, rewrite });
  } catch (err: any) {
    console.warn('News rewrite fallback applied:', err?.message || err);
    const fallback = generateNewsRewriteFallback(title, summary, category, false);
    res.json({ success: true, rewrite: fallback, isFallback: true });
  }
});

function generateNewsRewriteFallback(title: string = '', summary: string = '', category: string = '', isBreaking: boolean = false) {
  const cleanTitle = title.trim() || 'Kabar Terkini';
  const cleanSummary = summary.trim() || cleanTitle;
  const cleanCategory = category || 'Berita';

  return {
    selectedTitle: cleanTitle,
    titleOptions: [
      { type: 'informative', label: 'Informatif', title: cleanTitle },
      { type: 'curiosity', label: 'Curiosity', title: `Fakta Menarik Seputar: ${cleanTitle}` },
      { type: 'short_viral', label: 'Viral Singkat', title: `${cleanTitle} — Simak Selengkapnya!` },
      { type: 'seo', label: 'SEO-Friendly', title: `${cleanTitle} Update Berita ${cleanCategory}` }
    ],
    shortDescription: cleanSummary.slice(0, 180),
    factStatus: isBreaking ? 'developing' : 'confirmed',
    factNotice: isBreaking ? 'Developing story — verify before publishing.' : undefined,
    facebookCaption: `${cleanTitle}\n\n${cleanSummary}\n\nBagaimana pandangan Anda mengenai perkembangan berita ini? Tulis pendapat Anda di kolom komentar.`,
    instagramCaption: `📌 UPDATE ${cleanCategory.toUpperCase()}:\n\n${cleanTitle}\n\n${cleanSummary}\n\nSimpan dan bagikan informasi ini agar temanmu tidak ketinggalan berita terkini!`,
    tiktokHook: `Kalian udah dengar kabar terbaru ini belum?`,
    tiktokCaption: `${cleanTitle}! Simak rangkuman lengkapnya di video ini.`,
    youtubeTitle: cleanTitle,
    youtubeDescription: `Rangkuman berita seputar ${cleanTitle}.\n\n${cleanSummary}\n\nKategori: ${cleanCategory}\nJangan lupa like, share, dan subscribe untuk update berikutnya!`,
    xPost: `${cleanTitle.slice(0, 180)} — update berita ${cleanCategory}. Simak fakta selengkapnya.`,
    threadsPost: `${cleanTitle}\n\n${cleanSummary}\n\nBagaimana pendapat kalian tentang kabar ini? Yuk diskusi di bawah!`,
    hashtags: {
      facebook: ['#BeritaTerkini', '#Update', `#${cleanCategory.replace(/\s+/g, '')}`, '#KabarHariIni', '#Informasi'],
      instagram: ['#BeritaTerkini', '#KabarTerbaru', '#TrendingNews', '#UpdateHariIni', `#${cleanCategory.replace(/\s+/g, '')}`, '#ViralNews', '#BeritaIndonesia', '#KilasBerita', '#Wawasan', '#Fakta'],
      tiktok: ['#BeritaTerkini', '#UpdateNews', '#ViralHariIni', '#Trending', '#Fakta'],
      youtube: ['#BeritaTerkini', '#TrendingNews', '#Update', '#News', '#KabarHariIni'],
      x: ['#BeritaTerkini', '#Update', '#News'],
      threads: ['#BeritaTerkini', '#ThreadsID', `#${cleanCategory.replace(/\s+/g, '')}`, '#Update', '#Diskusi']
    }
  };
}


// 5. Media Probe Endpoint
app.post('/api/news/media-probe', async (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string' || !isSafePublicUrl(url)) {
    return res.status(400).json({ success: false, error: 'Valid public HTTP/HTTPS URL required' });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    
    // Perform HEAD request first
    let response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsHunter/1.0)',
        'Accept': '*/*'
      }
    });

    if (response.status === 405 || response.status === 501) {
      response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; NewsHunter/1.0)',
          'Range': 'bytes=0-1024',
          'Accept': '*/*'
        }
      });
    }
    clearTimeout(timeout);

    if (!response.ok) {
      return res.json({
        success: false,
        accessible: false,
        statusCode: response.status,
        error: `Server responded with HTTP ${response.status}`
      });
    }

    const contentType = response.headers.get('content-type') || '';
    const contentLength = response.headers.get('content-length');
    const sizeBytes = contentLength ? parseInt(contentLength, 10) : undefined;

    if (contentType.includes('text/html')) {
      return res.json({
        success: false,
        accessible: false,
        isHtmlRedirect: true,
        error: 'Media URL redirected to an HTML page (requires authentication or viewing on source)'
      });
    }

    res.json({
      success: true,
      accessible: true,
      statusCode: response.status,
      contentType,
      sizeBytes,
      isDownloadable: true
    });
  } catch (err: any) {
    res.json({
      success: false,
      accessible: false,
      error: err?.name === 'AbortError' ? 'Probe timed out' : sanitizeServerError(err, 'Failed to reach media server')
    });
  }
});

// 6. Safe Media Download Proxy Endpoint (Respects download limits & public availability)
app.get('/api/news/media-proxy-download', async (req, res) => {
  const mediaUrl = req.query.url as string;
  const maxLimitMb = parseInt((req.query.limitMb as string) || '25', 10);
  const maxBytes = maxLimitMb > 0 ? maxLimitMb * 1024 * 1024 : 100 * 1024 * 1024;

  if (!mediaUrl || !isSafePublicUrl(mediaUrl)) {
    return res.status(400).send('Invalid or restricted media URL');
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 35000);

    const remoteRes = await fetch(mediaUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsHunter/1.0)',
        'Accept': '*/*'
      }
    });
    clearTimeout(timeout);

    if (!remoteRes.ok) {
      return res.status(remoteRes.status).send(`Remote media server returned HTTP ${remoteRes.status}`);
    }

    const contentType = remoteRes.headers.get('content-type') || 'application/octet-stream';
    if (contentType.includes('text/html')) {
      return res.status(403).send('Direct download unavailable: media requires authentication or redirected to web page');
    }

    const contentLength = remoteRes.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > maxBytes) {
      return res.status(413).send(`File exceeds download limit (${maxLimitMb} MB)`);
    }

    let filename = 'news-media';
    try {
      const parsedUrl = new URL(mediaUrl);
      const pathname = parsedUrl.pathname;
      const basename = pathname.split('/').filter(Boolean).pop();
      if (basename && basename.includes('.')) {
        filename = basename.slice(0, 60);
      } else {
        const ext = contentType.includes('video') ? 'mp4' : (contentType.includes('png') ? 'png' : 'jpg');
        filename = `news-media-${Date.now()}.${ext}`;
      }
    } catch {
      filename = `news-media-${Date.now()}.bin`;
    }

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', contentType);
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }

    if (remoteRes.body) {
      // @ts-ignore
      const { Readable } = await import('stream');
      // @ts-ignore
      Readable.fromWeb(remoteRes.body).pipe(res);
    } else {
      res.status(500).send('Empty response from media server');
    }
  } catch (err: any) {
    res.status(500).send(sanitizeServerError(err, 'Download proxy failed'));
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

import { BillingCycle, PlanLimits, PlanType, SupportedCurrencyCode } from '../types/plans';

// ==========================================
// CENTRALIZED GLOBAL PRICING & CURRENCY CONFIG
// ==========================================

export interface CurrencyMetadata {
  code: SupportedCurrencyCode;
  symbol: string;
  name: string;
  exampleRegion: string;
}

export const REGIONAL_CURRENCY_CATALOG: Record<string, CurrencyMetadata> = {
  US: { code: 'USD', symbol: '$', name: 'US Dollar', exampleRegion: 'United States' },
  ID: { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', exampleRegion: 'Indonesia' },
  JP: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', exampleRegion: 'Japan' },
  IN: { code: 'INR', symbol: '₹', name: 'Indian Rupee', exampleRegion: 'India' },
  TH: { code: 'THB', symbol: '฿', name: 'Thai Baht', exampleRegion: 'Thailand' },
  GB: { code: 'GBP', symbol: '£', name: 'British Pound', exampleRegion: 'United Kingdom' },
  EU: { code: 'EUR', symbol: '€', name: 'Euro', exampleRegion: 'Euro Countries' }
};

export const PLAN_PRICING = {
  BASE_CURRENCY: 'USD' as SupportedCurrencyCode,
  CURRENCY_SYMBOL: '$',
  PRO_MONTHLY_PRICE: 4.99,
  PRO_YEARLY_PRICE: 49.99,
  PRICING_DISPLAY_NOTE: 'PRO billing is not connected yet.',
  PAYMENT_COMING_SOON: true,
  SUPPORTED_FUTURE_PROVIDERS: [
    'Google Play Billing',
    'Paddle',
    'Lemon Squeezy'
  ] as const,
  PRODUCT_CATALOG: {
    googlePlay: {
      packageName: 'com.socialsharescheduler.app',
      isPlaceholderProductIds: true,
      placeholders: {
        PRO_MONTHLY: 'PRO_MONTHLY',
        PRO_YEARLY: 'PRO_YEARLY'
      },
      monthlyProductId: (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_PLAY_BILLING_MONTHLY_PRODUCT_ID) || 'PRO_MONTHLY',
      yearlyProductId: (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_PLAY_BILLING_YEARLY_PRODUCT_ID) || 'PRO_YEARLY',
      subscriptionManageUrlBase: 'https://play.google.com/store/account/subscriptions'
    },
    paddle: {
      environment: ((typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_PADDLE_ENV) || 'sandbox') as 'sandbox' | 'production',
      clientToken: (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_PADDLE_CLIENT_TOKEN) || '',
      monthlyPriceId: (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_PADDLE_PRO_MONTHLY_PRICE_ID) || '',
      yearlyPriceId: (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_PADDLE_PRO_YEARLY_PRICE_ID) || ''
    }
  }
};

/**
 * Dynamically calculates the percentage saved when choosing the yearly plan
 * compared to 12 months of the configured monthly price.
 * Example: (4.99 * 12 = 59.88) vs 49.99 -> ~17%
 */
export function calculateYearlySavingsPercent(
  monthlyPrice = PLAN_PRICING.PRO_MONTHLY_PRICE,
  yearlyPrice = PLAN_PRICING.PRO_YEARLY_PRICE
): number {
  const annualizedMonthly = monthlyPrice * 12;
  if (annualizedMonthly <= 0 || yearlyPrice >= annualizedMonthly) {
    return 0;
  }
  const rawPercent = ((annualizedMonthly - yearlyPrice) / annualizedMonthly) * 100;
  return Math.round(rawPercent);
}

/**
 * Formats the configured PRO price for UI presentation from centralized config.
 * Example: "$4.99 / month" or "$49.99 / year"
 */
export function formatProPriceDisplay(cycle: BillingCycle): {
  amountFormatted: string;
  periodLabel: string;
  fullLabel: string;
  isoLabel: string;
  savingsPercent: number;
  savingsBadgeText: string | null;
} {
  const amount = cycle === 'monthly' ? PLAN_PRICING.PRO_MONTHLY_PRICE : PLAN_PRICING.PRO_YEARLY_PRICE;
  const periodLabel = cycle === 'monthly' ? 'month' : 'year';
  const amountFormatted = `${PLAN_PRICING.CURRENCY_SYMBOL}${amount.toFixed(2)}`;
  const fullLabel = `${amountFormatted} / ${periodLabel}`;
  const isoLabel = `${PLAN_PRICING.BASE_CURRENCY} ${amount.toFixed(2)} / ${periodLabel}`;
  const savingsPercent = cycle === 'yearly' ? calculateYearlySavingsPercent() : 0;

  return {
    amountFormatted,
    periodLabel,
    fullLabel,
    isoLabel,
    savingsPercent,
    savingsBadgeText: savingsPercent > 0 ? `Save approximately ${savingsPercent}%` : null
  };
}

/**
 * Resolves the target localized settlement currency for a country code.
 * Actual conversion & tax calculation is delegated to the payment provider at checkout.
 */
export function getLocalizedCurrencyMetadata(countryCode?: string): CurrencyMetadata {
  if (!countryCode) return REGIONAL_CURRENCY_CATALOG.US;
  const upper = countryCode.toUpperCase();
  if (['DE', 'FR', 'ES', 'IT', 'NL'].includes(upper)) {
    return REGIONAL_CURRENCY_CATALOG.EU;
  }
  return REGIONAL_CURRENCY_CATALOG[upper] || REGIONAL_CURRENCY_CATALOG.US;
}

// Admin / Owner test configuration (DEVELOPMENT / TEST ONLY — not production authentication)
export const OWNER_CONFIG = {
  DEFAULT_OWNER_ID: 'admin-owner-test',
  ENABLE_OWNER_TEST_MODE: true,
  ALLOW_DEV_TEST_IN_PREVIEW: true,
  INTERNAL_LABEL: 'ADMIN / OWNER TEST'
};

// ==========================================
// CENTRALIZED PLAN LIMITS (FREE, PRO, ADMIN_TEST)
// ==========================================

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  ADMIN_TEST: {
    maxAccountsPerPlatform: 9999,
    maxGroups: 9999,
    aiGenerationsPerMonth: 99999,
    newsHuntsPerDay: 99999,
    maxRssSources: 9999,
    webSearchEnabled: true,
    webSearchesPerDay: 99999,
    xTrendingEnabled: true,
    xTrendingPerDay: 99999,
    newsRewritesPerDay: 99999,
    mediaDiscoveryMode: 'advanced',
    mediaDiscoveryPerDay: 99999,
    maxAutoHuntSchedules: 999,
    maxQueueItems: 99999,
    maxScheduledPosts: 99999,
    aiContentFactoryMode: 'advanced'
  },
  PRO: {
    maxAccountsPerPlatform: 9999,
    maxGroups: 9999,
    aiGenerationsPerMonth: 1000,
    newsHuntsPerDay: 500,
    maxRssSources: 9999,
    webSearchEnabled: true,
    webSearchesPerDay: 200,
    xTrendingEnabled: true,
    xTrendingPerDay: 200,
    newsRewritesPerDay: 500,
    mediaDiscoveryMode: 'advanced',
    mediaDiscoveryPerDay: 500,
    maxAutoHuntSchedules: 50,
    maxQueueItems: 99999,
    maxScheduledPosts: 99999,
    aiContentFactoryMode: 'advanced'
  },
  FREE: {
    maxAccountsPerPlatform: 3,
    maxGroups: 3,
    aiGenerationsPerMonth: 20,
    newsHuntsPerDay: 10,
    maxRssSources: 10,
    webSearchEnabled: false,
    webSearchesPerDay: 0,
    xTrendingEnabled: false,
    xTrendingPerDay: 0,
    newsRewritesPerDay: 10,
    mediaDiscoveryMode: 'basic',
    mediaDiscoveryPerDay: 20,
    maxAutoHuntSchedules: 1,
    maxQueueItems: 20,
    maxScheduledPosts: 5,
    aiContentFactoryMode: 'basic'
  }
};

// ==========================================
// FEATURE DEFINITIONS & PLAN COMPARISON
// ==========================================

export interface PlanFeatureDefinition {
  key: string;
  name: string;
  description: string;
  freeLimitDescription: string;
  proLimitDescription: string;
  proOnly: boolean;
}

export const PLAN_FEATURES_LIST: PlanFeatureDefinition[] = [
  {
    key: 'social_accounts',
    name: 'Social Media Accounts',
    description: 'Add multiple accounts per platform (FB Pages, Profiles, IG, TikTok, YouTube, X, WhatsApp)',
    freeLimitDescription: 'Up to 3 accounts per platform',
    proLimitDescription: 'Unlimited accounts',
    proOnly: false
  },
  {
    key: 'posting_groups',
    name: 'Posting Groups',
    description: 'Bundle accounts into multi-channel one-click distribution networks',
    freeLimitDescription: 'Up to 3 posting groups',
    proLimitDescription: 'Unlimited groups',
    proOnly: false
  },
  {
    key: 'ai_generations',
    name: 'AI Content Assistant',
    description: 'Tailored captions, hooks, SEO titles, descriptions & hashtags for each platform',
    freeLimitDescription: '20 generations / month',
    proLimitDescription: '1,000 generations / month',
    proOnly: false
  },
  {
    key: 'news_hunts',
    name: 'News Hunter & Custom Search',
    description: 'Discover regional RSS news, custom keyword search, and viral hype scoring',
    freeLimitDescription: '10 hunts / day (RSS + Basic Search)',
    proLimitDescription: '500 hunts / day (RSS + Web Search)',
    proOnly: false
  },
  {
    key: 'web_search',
    name: 'Web Search News Discovery',
    description: 'Real-time broader web search integration beyond RSS feeds',
    freeLimitDescription: 'Not included on Free',
    proLimitDescription: '200 searches / day',
    proOnly: true
  },
  {
    key: 'x_trending',
    name: 'X (Twitter) Trending Topics',
    description: 'Real-time trending topics discovery from X platform',
    freeLimitDescription: 'Not included on Free',
    proLimitDescription: '200 requests / day',
    proOnly: true
  },
  {
    key: 'news_rewrites',
    name: 'News Rewriting & Angles',
    description: 'Fact-safe AI rewrites with Informative, Curiosity, Short Viral, and SEO angles',
    freeLimitDescription: '10 rewrites / day',
    proLimitDescription: '500 rewrites / day',
    proOnly: false
  },
  {
    key: 'media_discovery',
    name: 'Media Discovery & Download Limits',
    description: 'Inspect and download public news images and videos with size verification',
    freeLimitDescription: '20 / day (Basic mode)',
    proLimitDescription: '500 / day (Advanced mode)',
    proOnly: false
  },
  {
    key: 'scheduled_posts',
    name: 'Content Scheduler & Queue',
    description: 'Timeline and calendar reminder scheduler for multi-platform distribution',
    freeLimitDescription: 'Max 5 scheduled & 20 queue items',
    proLimitDescription: 'Unlimited queue & scheduling',
    proOnly: false
  },
  {
    key: 'auto_hunt',
    name: 'Auto Hunt Background Schedules',
    description: 'Automated periodic background hunting with in-app new stories alert',
    freeLimitDescription: '1 active schedule',
    proLimitDescription: 'Up to 50 schedules',
    proOnly: false
  }
];

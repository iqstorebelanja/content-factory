/**
 * Centralized Subscription & Payment Integration Service
 * Social Share Scheduler
 *
 * TARGET PAYMENT ARCHITECTURE:
 * - ANDROID: Google Play Billing (`GooglePlayBillingAdapter`)
 * - WEB / GLOBAL: Paddle as Merchant of Record (`PaddleBillingAdapter`)
 *
 * ARCHITECTURE FLOW:
 * UI -> Subscription Service -> Backend -> Payment Provider -> Verified Webhook / Purchase -> Entitlement Service -> PRO access
 *
 * STRICT SECURITY RULES:
 * - Never expose payment secrets, API keys, webhook secrets, or service account keys in frontend code.
 * - Never simulate fake successful payments or automatically grant PRO when a frontend button is clicked.
 * - Production PRO entitlement is granted ONLY after server-side webhook or Google Play Developer API verification.
 * - ADMIN_TEST remains strictly development/test-only.
 */

import {
  BillingCycle,
  PaymentPlatformTarget,
  PaymentProviderStatus,
  PlanType,
  SubscriptionProviderType
} from '../types/plans';
import { PLAN_PRICING, formatProPriceDisplay } from '../config/plans';
import { detectNativeAndroidShell, buildBackendEndpointUrl } from '../config/environmentConfig';
import { loadSubscriptionState } from '../utils/planManager';
import { accountService } from './accountService';
import { platformCapabilities, NativePlayBillingPurchase } from './nativeBridge';

export interface CheckoutSessionResult {
  connected: boolean;
  configured: boolean;
  success: boolean;
  billingCycle: BillingCycle;
  referencePriceUsd: number;
  formattedReferencePrice: string;
  provider: SubscriptionProviderType;
  platformTarget: PaymentPlatformTarget;
  productIdOrPriceId: string | null;
  paymentStatus: PaymentProviderStatus;
  requiresServerVerification: boolean;
  message: string;
}

export interface SubscriptionStatusResult {
  plan: PlanType;
  paymentStatus: PaymentProviderStatus;
  provider: SubscriptionProviderType;
  platformTarget: PaymentPlatformTarget;
  connected: boolean;
  verifiedByBackend: boolean;
  billingCycle: BillingCycle | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  managementUrl: string | null;
  message: string;
}

export interface SubscriptionActionResult {
  connected: boolean;
  success: boolean;
  provider: SubscriptionProviderType;
  platformTarget: PaymentPlatformTarget;
  managementUrl?: string | null;
  message: string;
}

export interface BillingArchitectureSummary {
  activePlatformTarget: PaymentPlatformTarget;
  activeProvider: SubscriptionProviderType;
  activeProviderDisplayName: string;
  androidProviderName: string;
  webGlobalProviderName: string;
  isNativeAndroidRuntime: boolean;
  nativePlayBillingBridgeReady: boolean;
  paddleClientTokenConfigured: boolean;
  paddlePricesConfigured: boolean;
  monthlySkuOrPriceId: string;
  yearlySkuOrPriceId: string;
  billingConnected: boolean;
  statusNote: string;
}

export interface SubscriptionProviderAdapter {
  readonly providerType: SubscriptionProviderType;
  readonly platformTarget: PaymentPlatformTarget;
  readonly displayName: string;
  isClientConfigured(): boolean;
  createCheckout(billingCycle: BillingCycle): Promise<CheckoutSessionResult>;
  getSubscriptionStatus(): Promise<SubscriptionStatusResult>;
  restoreSubscription(): Promise<SubscriptionActionResult>;
  cancelSubscription(): Promise<SubscriptionActionResult>;
  openManageSubscription(): Promise<SubscriptionActionResult>;
}

async function postSubscriptionBackend<T>(path: string, body: Record<string, unknown>): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);
  try {
    const token = accountService.getSessionToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(buildBackendEndpointUrl(path), {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal
    });
    clearTimeout(timer);
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    clearTimeout(timer);
    return null;
  }
}

// ============================================================================
// 1. ANDROID ADAPTER: Google Play Billing (`google_play_billing`)
// ============================================================================
class GooglePlayBillingAdapter implements SubscriptionProviderAdapter {
  readonly providerType: SubscriptionProviderType = 'google_play_billing';
  readonly platformTarget: PaymentPlatformTarget = 'android_google_play';
  readonly displayName = 'Google Play Billing (Android)';

  isClientConfigured(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(
      platformCapabilities.isNativeAndroid() &&
      window.AndroidBridge?.billing?.isAvailable?.()
    );
  }

  async createCheckout(billingCycle: BillingCycle = 'monthly'): Promise<CheckoutSessionResult> {
    const pricing = formatProPriceDisplay(billingCycle);
    const priceUsd = billingCycle === 'monthly' ? PLAN_PRICING.PRO_MONTHLY_PRICE : PLAN_PRICING.PRO_YEARLY_PRICE;
    const productId = billingCycle === 'yearly'
      ? PLAN_PRICING.PRODUCT_CATALOG.googlePlay.yearlyProductId
      : PLAN_PRICING.PRODUCT_CATALOG.googlePlay.monthlyProductId;
    const user = accountService.getCurrentUser();

    // 1. Ask backend whether Google Play Developer API verification is configured
    const sessionRes = await postSubscriptionBackend<{
      success: boolean;
      connected: boolean;
      configured: boolean;
      productId?: string;
      packageName?: string;
      paymentStatus?: PaymentProviderStatus;
      message?: string;
    }>('/api/subscriptions/checkout-session', {
      userId: user.userId,
      billingCycle,
      platform: 'android_google_play'
    });

    if (!sessionRes?.configured || !this.isClientConfigured()) {
      return {
        connected: false,
        configured: false,
        success: false,
        billingCycle,
        referencePriceUsd: priceUsd,
        formattedReferencePrice: pricing.fullLabel,
        provider: 'google_play_billing',
        platformTarget: 'android_google_play',
        productIdOrPriceId: productId,
        paymentStatus: 'PAYMENT_NOT_CONFIGURED',
        requiresServerVerification: true,
        message: PLAN_PRICING.PRICING_DISPLAY_NOTE // "PRO billing is not connected yet."
      };
    }

    // 2. If native Android Google Play Billing bridge is available, launch native sheet
    try {
      const rawPurchase = await window.AndroidBridge?.billing?.launchBillingFlow?.(
        JSON.stringify({
          productId,
          obfuscatedAccountId: user.userId,
          packageName: PLAN_PRICING.PRODUCT_CATALOG.googlePlay.packageName
        })
      );

      if (!rawPurchase) {
        return {
          connected: true,
          configured: true,
          success: false,
          billingCycle,
          referencePriceUsd: priceUsd,
          formattedReferencePrice: pricing.fullLabel,
          provider: 'google_play_billing',
          platformTarget: 'android_google_play',
          productIdOrPriceId: productId,
          paymentStatus: 'PAYMENT_PENDING',
          requiresServerVerification: true,
          message: 'Google Play Billing flow did not return a purchase token.'
        };
      }

      const parsedPurchase: NativePlayBillingPurchase = JSON.parse(rawPurchase);

      // 3. Submit purchaseToken to backend for authoritative Google Play Developer API verification
      const verifyRes = await postSubscriptionBackend<{
        success: boolean;
        verified: boolean;
        configured: boolean;
        paymentStatus?: PaymentProviderStatus;
        message?: string;
      }>('/api/subscriptions/google-play/verify', {
        userId: user.userId,
        productId: parsedPurchase.productId || productId,
        purchaseToken: parsedPurchase.purchaseToken,
        packageName: parsedPurchase.packageName || PLAN_PRICING.PRODUCT_CATALOG.googlePlay.packageName
      });

      return {
        connected: Boolean(verifyRes?.configured),
        configured: Boolean(verifyRes?.configured),
        success: Boolean(verifyRes?.verified),
        billingCycle,
        referencePriceUsd: priceUsd,
        formattedReferencePrice: pricing.fullLabel,
        provider: 'google_play_billing',
        platformTarget: 'android_google_play',
        productIdOrPriceId: productId,
        paymentStatus: verifyRes?.paymentStatus || 'PAYMENT_PENDING',
        requiresServerVerification: true,
        message: verifyRes?.message || PLAN_PRICING.PRICING_DISPLAY_NOTE
      };
    } catch {
      return {
        connected: false,
        configured: false,
        success: false,
        billingCycle,
        referencePriceUsd: priceUsd,
        formattedReferencePrice: pricing.fullLabel,
        provider: 'google_play_billing',
        platformTarget: 'android_google_play',
        productIdOrPriceId: productId,
        paymentStatus: 'PAYMENT_NOT_CONFIGURED',
        requiresServerVerification: true,
        message: PLAN_PRICING.PRICING_DISPLAY_NOTE
      };
    }
  }

  async getSubscriptionStatus(): Promise<SubscriptionStatusResult> {
    const state = loadSubscriptionState();
    const user = accountService.getCurrentUser();
    const backendRes = await postSubscriptionBackend<{
      success: boolean;
      connected: boolean;
      verifiedByBackend: boolean;
      plan: PlanType;
      paymentStatus: PaymentProviderStatus;
      provider: SubscriptionProviderType;
      billingCycle: BillingCycle | null;
      currentPeriodEnd: string | null;
      cancelAtPeriodEnd: boolean;
      managementUrl: string | null;
      message: string;
    }>('/api/subscriptions/status', {
      userId: user.userId,
      platform: 'android_google_play'
    });

    if (backendRes && backendRes.verifiedByBackend) {
      return {
        plan: backendRes.plan,
        paymentStatus: backendRes.paymentStatus,
        provider: backendRes.provider,
        platformTarget: 'android_google_play',
        connected: backendRes.connected,
        verifiedByBackend: true,
        billingCycle: backendRes.billingCycle,
        currentPeriodEnd: backendRes.currentPeriodEnd,
        cancelAtPeriodEnd: backendRes.cancelAtPeriodEnd,
        managementUrl: backendRes.managementUrl,
        message: backendRes.message
      };
    }

    return {
      plan: state.plan,
      paymentStatus: 'PAYMENT_NOT_CONFIGURED',
      provider: 'none',
      platformTarget: 'android_google_play',
      connected: false,
      verifiedByBackend: false,
      billingCycle: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      managementUrl: null,
      message: PLAN_PRICING.PRICING_DISPLAY_NOTE
    };
  }

  async restoreSubscription(): Promise<SubscriptionActionResult> {
    const user = accountService.getCurrentUser();
    const backendRes = await postSubscriptionBackend<{
      success: boolean;
      connected: boolean;
      restored: boolean;
      message: string;
    }>('/api/subscriptions/restore', {
      userId: user.userId,
      platform: 'android_google_play'
    });

    return {
      connected: Boolean(backendRes?.connected),
      success: Boolean(backendRes?.restored),
      provider: 'google_play_billing',
      platformTarget: 'android_google_play',
      message: backendRes?.message || PLAN_PRICING.PRICING_DISPLAY_NOTE
    };
  }

  async cancelSubscription(): Promise<SubscriptionActionResult> {
    const user = accountService.getCurrentUser();
    const backendRes = await postSubscriptionBackend<{
      success: boolean;
      connected: boolean;
      cancelled: boolean;
      message: string;
    }>('/api/subscriptions/cancel', {
      userId: user.userId,
      platform: 'android_google_play'
    });

    return {
      connected: Boolean(backendRes?.connected),
      success: Boolean(backendRes?.cancelled),
      provider: 'google_play_billing',
      platformTarget: 'android_google_play',
      message: backendRes?.message || PLAN_PRICING.PRICING_DISPLAY_NOTE
    };
  }

  async openManageSubscription(): Promise<SubscriptionActionResult> {
    const user = accountService.getCurrentUser();
    const backendRes = await postSubscriptionBackend<{
      success: boolean;
      connected: boolean;
      managementUrl: string | null;
      message: string;
    }>('/api/subscriptions/manage', {
      userId: user.userId,
      platform: 'android_google_play'
    });

    return {
      connected: Boolean(backendRes?.connected),
      success: Boolean(backendRes?.success),
      provider: 'google_play_billing',
      platformTarget: 'android_google_play',
      managementUrl: backendRes?.managementUrl || null,
      message: backendRes?.message || PLAN_PRICING.PRICING_DISPLAY_NOTE
    };
  }
}

// ============================================================================
// 2. WEB / GLOBAL ADAPTER: Paddle Merchant of Record (`paddle`)
// ============================================================================
class PaddleBillingAdapter implements SubscriptionProviderAdapter {
  readonly providerType: SubscriptionProviderType = 'paddle';
  readonly platformTarget: PaymentPlatformTarget = 'web_paddle';
  readonly displayName = 'Paddle Merchant of Record (Web / Global)';

  isClientConfigured(): boolean {
    const { clientToken, monthlyPriceId, yearlyPriceId } = PLAN_PRICING.PRODUCT_CATALOG.paddle;
    return Boolean(clientToken.trim() && (monthlyPriceId.trim() || yearlyPriceId.trim()));
  }

  async createCheckout(billingCycle: BillingCycle = 'monthly'): Promise<CheckoutSessionResult> {
    const pricing = formatProPriceDisplay(billingCycle);
    const priceUsd = billingCycle === 'monthly' ? PLAN_PRICING.PRO_MONTHLY_PRICE : PLAN_PRICING.PRO_YEARLY_PRICE;
    const priceId = billingCycle === 'yearly'
      ? PLAN_PRICING.PRODUCT_CATALOG.paddle.yearlyPriceId
      : PLAN_PRICING.PRODUCT_CATALOG.paddle.monthlyPriceId;
    const user = accountService.getCurrentUser();

    const sessionRes = await postSubscriptionBackend<{
      success: boolean;
      connected: boolean;
      configured: boolean;
      priceId?: string | null;
      paymentStatus?: PaymentProviderStatus;
      message?: string;
    }>('/api/subscriptions/checkout-session', {
      userId: user.userId,
      billingCycle,
      platform: 'web_paddle'
    });

    if (!sessionRes?.configured || !this.isClientConfigured()) {
      return {
        connected: false,
        configured: false,
        success: false,
        billingCycle,
        referencePriceUsd: priceUsd,
        formattedReferencePrice: pricing.fullLabel,
        provider: 'paddle',
        platformTarget: 'web_paddle',
        productIdOrPriceId: priceId || null,
        paymentStatus: 'PAYMENT_NOT_CONFIGURED',
        requiresServerVerification: true,
        message: PLAN_PRICING.PRICING_DISPLAY_NOTE // "PRO billing is not connected yet."
      };
    }

    return {
      connected: true,
      configured: true,
      success: false, // Never grant PRO before verified webhook completes!
      billingCycle,
      referencePriceUsd: priceUsd,
      formattedReferencePrice: pricing.fullLabel,
      provider: 'paddle',
      platformTarget: 'web_paddle',
      productIdOrPriceId: sessionRes.priceId || priceId || null,
      paymentStatus: 'PAYMENT_PENDING',
      requiresServerVerification: true,
      message: sessionRes.message || 'Paddle checkout prepared. PRO unlocks only after verified server webhook confirmation.'
    };
  }

  async getSubscriptionStatus(): Promise<SubscriptionStatusResult> {
    const state = loadSubscriptionState();
    const user = accountService.getCurrentUser();
    const backendRes = await postSubscriptionBackend<{
      success: boolean;
      connected: boolean;
      verifiedByBackend: boolean;
      plan: PlanType;
      paymentStatus: PaymentProviderStatus;
      provider: SubscriptionProviderType;
      billingCycle: BillingCycle | null;
      currentPeriodEnd: string | null;
      cancelAtPeriodEnd: boolean;
      managementUrl: string | null;
      message: string;
    }>('/api/subscriptions/status', {
      userId: user.userId,
      platform: 'web_paddle'
    });

    if (backendRes && backendRes.verifiedByBackend) {
      return {
        plan: backendRes.plan,
        paymentStatus: backendRes.paymentStatus,
        provider: backendRes.provider,
        platformTarget: 'web_paddle',
        connected: backendRes.connected,
        verifiedByBackend: true,
        billingCycle: backendRes.billingCycle,
        currentPeriodEnd: backendRes.currentPeriodEnd,
        cancelAtPeriodEnd: backendRes.cancelAtPeriodEnd,
        managementUrl: backendRes.managementUrl,
        message: backendRes.message
      };
    }

    return {
      plan: state.plan,
      paymentStatus: 'PAYMENT_NOT_CONFIGURED',
      provider: 'none',
      platformTarget: 'web_paddle',
      connected: false,
      verifiedByBackend: false,
      billingCycle: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      managementUrl: null,
      message: PLAN_PRICING.PRICING_DISPLAY_NOTE
    };
  }

  async restoreSubscription(): Promise<SubscriptionActionResult> {
    const user = accountService.getCurrentUser();
    const backendRes = await postSubscriptionBackend<{
      success: boolean;
      connected: boolean;
      restored: boolean;
      message: string;
    }>('/api/subscriptions/restore', {
      userId: user.userId,
      platform: 'web_paddle'
    });

    return {
      connected: Boolean(backendRes?.connected),
      success: Boolean(backendRes?.restored),
      provider: 'paddle',
      platformTarget: 'web_paddle',
      message: backendRes?.message || PLAN_PRICING.PRICING_DISPLAY_NOTE
    };
  }

  async cancelSubscription(): Promise<SubscriptionActionResult> {
    const user = accountService.getCurrentUser();
    const backendRes = await postSubscriptionBackend<{
      success: boolean;
      connected: boolean;
      cancelled: boolean;
      message: string;
    }>('/api/subscriptions/cancel', {
      userId: user.userId,
      platform: 'web_paddle'
    });

    return {
      connected: Boolean(backendRes?.connected),
      success: Boolean(backendRes?.cancelled),
      provider: 'paddle',
      platformTarget: 'web_paddle',
      message: backendRes?.message || PLAN_PRICING.PRICING_DISPLAY_NOTE
    };
  }

  async openManageSubscription(): Promise<SubscriptionActionResult> {
    const user = accountService.getCurrentUser();
    const backendRes = await postSubscriptionBackend<{
      success: boolean;
      connected: boolean;
      managementUrl: string | null;
      message: string;
    }>('/api/subscriptions/manage', {
      userId: user.userId,
      platform: 'web_paddle'
    });

    return {
      connected: Boolean(backendRes?.connected),
      success: Boolean(backendRes?.success),
      provider: 'paddle',
      platformTarget: 'web_paddle',
      managementUrl: backendRes?.managementUrl || null,
      message: backendRes?.message || PLAN_PRICING.PRICING_DISPLAY_NOTE
    };
  }
}

// ============================================================================
// 3. CENTRAL SUBSCRIPTION SERVICE (Provider-Agnostic Orchestrator)
// ============================================================================
class CentralSubscriptionService {
  private readonly googlePlayAdapter = new GooglePlayBillingAdapter();
  private readonly paddleAdapter = new PaddleBillingAdapter();

  /**
   * Resolves the active payment adapter based on runtime platform
   * (Android Native Shell -> Google Play Billing, Web/Global -> Paddle MoR).
   */
  getActiveAdapter(): SubscriptionProviderAdapter {
    const isAndroid = detectNativeAndroidShell() || platformCapabilities.isNativeAndroid();
    return isAndroid ? this.googlePlayAdapter : this.paddleAdapter;
  }

  /**
   * Returns a transparent summary of the payment integration architecture and readiness.
   */
  getBillingArchitectureSummary(): BillingArchitectureSummary {
    const isAndroid = detectNativeAndroidShell() || platformCapabilities.isNativeAndroid();
    const activeAdapter = this.getActiveAdapter();
    const { googlePlay, paddle } = PLAN_PRICING.PRODUCT_CATALOG;

    const monthlySkuOrPriceId = isAndroid
      ? googlePlay.monthlyProductId
      : (paddle.monthlyPriceId || 'pri_unconfigured_monthly');
    const yearlySkuOrPriceId = isAndroid
      ? googlePlay.yearlyProductId
      : (paddle.yearlyPriceId || 'pri_unconfigured_yearly');

    return {
      activePlatformTarget: activeAdapter.platformTarget,
      activeProvider: activeAdapter.providerType,
      activeProviderDisplayName: activeAdapter.displayName,
      androidProviderName: this.googlePlayAdapter.displayName,
      webGlobalProviderName: this.paddleAdapter.displayName,
      isNativeAndroidRuntime: isAndroid,
      nativePlayBillingBridgeReady: this.googlePlayAdapter.isClientConfigured(),
      paddleClientTokenConfigured: Boolean(paddle.clientToken.trim()),
      paddlePricesConfigured: Boolean(paddle.monthlyPriceId.trim() && paddle.yearlyPriceId.trim()),
      monthlySkuOrPriceId,
      yearlySkuOrPriceId,
      billingConnected: activeAdapter.isClientConfigured(),
      statusNote: PLAN_PRICING.PRICING_DISPLAY_NOTE
    };
  }

  /**
   * 0. selectFreePlan()
   * Handles explicit selection of the FREE plan tier without invoking any payment provider,
   * checkout session, or external redirect.
   */
  selectFreePlan(): SubscriptionActionResult {
    const activeAdapter = this.getActiveAdapter();
    return {
      connected: activeAdapter.isClientConfigured(),
      success: true,
      provider: 'none',
      platformTarget: activeAdapter.platformTarget,
      managementUrl: null,
      message: 'You are currently on the FREE plan.'
    };
  }

  /**
   * 1. createCheckout()
   * Initiates a PRO subscription checkout flow through the active platform adapter & backend.
   * Never simulates payment or grants PRO without verified backend entitlement.
   */
  async createCheckout(billingCycle: BillingCycle = 'monthly'): Promise<CheckoutSessionResult> {
    return this.getActiveAdapter().createCheckout(billingCycle);
  }

  /**
   * 2. getSubscriptionStatus()
   * Queries authoritative subscription status via backend.
   */
  async getSubscriptionStatus(): Promise<SubscriptionStatusResult> {
    return this.getActiveAdapter().getSubscriptionStatus();
  }

  /**
   * 3. restoreSubscription()
   * Restores verified purchases across devices via backend / provider.
   */
  async restoreSubscription(): Promise<SubscriptionActionResult> {
    return this.getActiveAdapter().restoreSubscription();
  }

  /**
   * 4. cancelSubscription()
   * Requests cancellation of an active recurring subscription via backend / provider.
   */
  async cancelSubscription(): Promise<SubscriptionActionResult> {
    return this.getActiveAdapter().cancelSubscription();
  }

  /**
   * 5. openManageSubscription()
   * Opens or retrieves the provider's subscription management portal (Google Play Store or Paddle Customer Portal).
   */
  async openManageSubscription(): Promise<SubscriptionActionResult> {
    return this.getActiveAdapter().openManageSubscription();
  }
}

export const subscriptionService = new CentralSubscriptionService();

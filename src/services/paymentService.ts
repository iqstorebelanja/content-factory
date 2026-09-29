/**
 * Abstract Payment & Subscription Provider Service
 * Social Share Scheduler
 *
 * Delegates all subscription and checkout operations to the centralized `subscriptionService`
 * (supporting Google Play Billing on Android and Paddle Merchant of Record on Web / Global).
 */

import { BillingCycle } from '../types/plans';
import {
  subscriptionService,
  CheckoutSessionResult,
  SubscriptionStatusResult,
  SubscriptionActionResult
} from './subscriptionService';

export type {
  CheckoutSessionResult,
  SubscriptionStatusResult,
  SubscriptionActionResult
};

export interface PaymentProviderAdapter {
  createCheckout: (billingCycle?: BillingCycle) => Promise<CheckoutSessionResult>;
  getSubscriptionStatus: () => Promise<SubscriptionStatusResult>;
  cancelSubscription: () => Promise<SubscriptionActionResult>;
  restoreSubscription: () => Promise<SubscriptionActionResult>;
  openManageSubscription: () => Promise<SubscriptionActionResult>;
}

export async function createCheckout(billingCycle: BillingCycle = 'monthly'): Promise<CheckoutSessionResult> {
  return subscriptionService.createCheckout(billingCycle);
}

export async function getSubscriptionStatus(): Promise<SubscriptionStatusResult> {
  return subscriptionService.getSubscriptionStatus();
}

export async function cancelSubscription(): Promise<SubscriptionActionResult> {
  return subscriptionService.cancelSubscription();
}

export async function restoreSubscription(): Promise<SubscriptionActionResult> {
  return subscriptionService.restoreSubscription();
}

export async function openManageSubscription(): Promise<SubscriptionActionResult> {
  return subscriptionService.openManageSubscription();
}

export const paymentService: PaymentProviderAdapter = {
  createCheckout,
  getSubscriptionStatus,
  cancelSubscription,
  restoreSubscription,
  openManageSubscription
};

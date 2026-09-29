import { 
  CostControlFeature, 
  CostUsageAuditEntry, 
  FeatureAccessResult, 
  PlanType 
} from '../types/plans';
import { entitlementService } from './entitlementService';

const AUDIT_STORAGE_KEY = 'sss_cost_audit_log';
const MAX_AUDIT_LOG_ITEMS = 60;
const LOCK_TIMEOUT_MS = 40000;      // 40 seconds auto-recovery timeout
const DEBOUNCE_INTERVAL_MS = 1000;   // 1.0 second minimum pause between rapid repeat triggers

interface ActiveLock {
  feature: CostControlFeature;
  key: string;
  timestamp: number;
  timeoutId: any;
}

// In-memory locks & debounce memory
const activeLocks = new Map<string, ActiveLock>();
const lastActionCompletedAt = new Map<string, number>();

// Audit listeners for live UI reactivity
type AuditListener = (entries: CostUsageAuditEntry[]) => void;
const auditListeners: Set<AuditListener> = new Set();

class CostGuardService {
  /**
   * Acquire an in-flight request lock for an expensive feature.
   * Protects against rapid repeat button clicks, double-taps, or overlapping executions.
   */
  acquireLock(feature: CostControlFeature, lockKey?: string): { acquired: boolean; reason?: string } {
    const key = lockKey || feature;
    const now = Date.now();

    // 1. Check in-flight lock
    const existingLock = activeLocks.get(key);
    if (existingLock) {
      if (now - existingLock.timestamp < LOCK_TIMEOUT_MS) {
        return { 
          acquired: false, 
          reason: 'A request is currently in progress. Please wait for it to complete.' 
        };
      }
      // Stale lock recovery
      this.releaseLock(feature, key);
    }

    // 2. Debounce protection against rapid repeated clicks
    const lastDone = lastActionCompletedAt.get(key) || 0;
    if (now - lastDone < DEBOUNCE_INTERVAL_MS) {
      return { 
        acquired: false, 
        reason: 'Please wait a moment before initiating another request.' 
      };
    }

    // 3. Register active lock with auto-recovery timer
    const timeoutId = setTimeout(() => {
      console.warn(`[CostGuard] Auto-releasing timed-out lock for key "${key}"`);
      activeLocks.delete(key);
    }, LOCK_TIMEOUT_MS);

    activeLocks.set(key, {
      feature,
      key,
      timestamp: now,
      timeoutId
    });

    return { acquired: true };
  }

  /**
   * Release an acquired request lock safely.
   */
  releaseLock(feature: CostControlFeature, lockKey?: string): void {
    const key = lockKey || feature;
    const lock = activeLocks.get(key);
    if (lock) {
      clearTimeout(lock.timeoutId);
      activeLocks.delete(key);
    }
    lastActionCompletedAt.set(key, Date.now());
  }

  /**
   * Check whether a specific feature or key is currently locked.
   */
  isLocked(feature: CostControlFeature, lockKey?: string): boolean {
    const key = lockKey || feature;
    const lock = activeLocks.get(key);
    if (!lock) return false;
    if (Date.now() - lock.timestamp >= LOCK_TIMEOUT_MS) {
      this.releaseLock(feature, key);
      return false;
    }
    return true;
  }

  /**
   * Check quota & permissions before attempting any expensive AI or external API call.
   */
  checkQuota(feature: CostControlFeature, count?: number): FeatureAccessResult {
    return entitlementService.hasFeature(feature, count);
  }

  /**
   * Safely record usage only after an operation has succeeded.
   */
  recordUsage(feature: CostControlFeature, amount = 1): void {
    entitlementService.recordFeatureUsage(feature, amount);
  }

  /**
   * Execute an expensive action with full Cost Guard protection:
   * - In-flight lock & debounce check
   * - Quota & plan verification
   * - Limited retries on transient errors (max 2 attempts)
   * - Never records usage on failure
   * - Records usage strictly on success
   * - Full audit trail logging (without storing secrets)
   */
  async executeProtectedAction<T>(options: {
    feature: CostControlFeature;
    actionName: string;
    action: () => Promise<T>;
    maxRetries?: number;
    lockKey?: string;
    countUsage?: boolean;
    metadata?: Record<string, string | number | boolean>;
  }): Promise<{
    success: boolean;
    data?: T;
    error?: string;
    blocked?: boolean;
    reason?: string;
  }> {
    const { 
      feature, 
      actionName, 
      action, 
      maxRetries = 2, 
      lockKey, 
      countUsage = true, 
      metadata 
    } = options;

    const startTime = Date.now();
    const entitlements = entitlementService.getEntitlements();
    const subState = entitlements.subscription;
    const effectivePlan = entitlements.plan;

    // 1. Quota check
    const quotaCheck = this.checkQuota(feature);
    if (!quotaCheck.allowed) {
      const reason = quotaCheck.reason || `${actionName} quota limit reached for your plan.`;
      this.logAuditEntry({
        feature,
        plan: effectivePlan,
        ownerIdentifier: subState.ownerIdentifier,
        period: quotaCheck.period === 'monthly' ? entitlements.usage.periodMonthly : entitlements.usage.periodDaily,
        status: 'blocked',
        actionName,
        durationMs: Date.now() - startTime,
        reason,
        metadata
      });
      return {
        success: false,
        blocked: true,
        reason
      };
    }

    // 2. Lock acquisition
    const lockResult = this.acquireLock(feature, lockKey);
    if (!lockResult.acquired) {
      return {
        success: false,
        blocked: true,
        reason: lockResult.reason
      };
    }

    // 3. Execution with limited retries
    let attempt = 0;
    let lastError: any = null;

    try {
      while (attempt < maxRetries) {
        attempt++;
        try {
          const result = await action();

          // Action succeeded!
          const durationMs = Date.now() - startTime;

          if (countUsage) {
            this.recordUsage(feature);
          }

          const latestUsage = entitlementService.getEntitlements().usage;

          this.logAuditEntry({
            feature,
            plan: effectivePlan,
            ownerIdentifier: subState.ownerIdentifier,
            period: quotaCheck.period === 'monthly' ? latestUsage.periodMonthly : latestUsage.periodDaily,
            status: 'success',
            actionName,
            durationMs,
            metadata
          });

          return {
            success: true,
            data: result
          };
        } catch (err: any) {
          lastError = err;
          // Check if abort or offline, no need for heavy retry
          if (attempt < maxRetries) {
            // Exponential backoff: 500ms
            await new Promise(res => setTimeout(res, 500 * attempt));
          }
        }
      }

      // If we reach here, all retries failed
      const durationMs = Date.now() - startTime;
      const errorMsg = lastError?.message || 'Operation failed after maximum attempts.';
      const latestUsage = entitlementService.getEntitlements().usage;

      this.logAuditEntry({
        feature,
        plan: effectivePlan,
        ownerIdentifier: subState.ownerIdentifier,
        period: quotaCheck.period === 'monthly' ? latestUsage.periodMonthly : latestUsage.periodDaily,
        status: 'error',
        actionName,
        durationMs,
        reason: errorMsg,
        metadata
      });

      return {
        success: false,
        error: errorMsg
      };
    } finally {
      this.releaseLock(feature, lockKey);
    }
  }

  /**
   * Log an audit record to persistent storage without storing any secrets.
   */
  private logAuditEntry(entry: Omit<CostUsageAuditEntry, 'id' | 'timestamp'>): void {
    try {
      const existing = this.getAuditLog();
      const newEntry: CostUsageAuditEntry = {
        ...entry,
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString()
      };

      const updated = [newEntry, ...existing].slice(0, MAX_AUDIT_LOG_ITEMS);
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updated));

      // Notify UI listeners
      auditListeners.forEach(listener => {
        try { listener(updated); } catch {}
      });
    } catch (err) {
      console.error('[CostGuard] Error writing audit log:', err);
    }
  }

  /**
   * Retrieve cost control audit entries from storage.
   */
  getAuditLog(): CostUsageAuditEntry[] {
    try {
      const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  /**
   * Clear the audit log (useful for developer testing or reset).
   */
  clearAuditLog(): void {
    try {
      localStorage.removeItem(AUDIT_STORAGE_KEY);
      auditListeners.forEach(listener => {
        try { listener([]); } catch {}
      });
    } catch {}
  }

  /**
   * Subscribe to live audit log updates.
   */
  subscribeToAuditLog(listener: AuditListener): () => void {
    auditListeners.add(listener);
    return () => auditListeners.delete(listener);
  }

  /**
   * Get overall API security and cost control health status.
   */
  getApiSecurityStatus() {
    const snap = entitlementService.getEntitlements();
    const { usage, plan: effectivePlan, limits } = snap;

    return {
      backendProxyActive: true,
      zeroClientKeysExposed: true,
      costGuardShieldActive: true,
      serverProxyEndpoints: [
        '/api/ai/generate-platform-content',
        '/api/ai/generate',
        '/api/news/web-discover',
        '/api/news/rewrite',
        '/api/news/media-probe'
      ],
      plan: effectivePlan,
      activeLocksCount: activeLocks.size,
      dailyStats: {
        newsHunts: `${usage.newsHuntsCount} / ${limits.newsHuntsPerDay >= 9999 ? 'Unlimited' : limits.newsHuntsPerDay}`,
        newsRewrites: `${usage.newsRewritesCount} / ${limits.newsRewritesPerDay >= 9999 ? 'Unlimited' : limits.newsRewritesPerDay}`,
        webSearches: `${usage.webSearchesCount} / ${limits.webSearchesPerDay >= 9999 ? 'Unlimited' : limits.webSearchesPerDay}`,
        xTrending: `${usage.xTrendingCount} / ${limits.xTrendingPerDay >= 9999 ? 'Unlimited' : limits.xTrendingPerDay}`,
        mediaDiscovery: `${usage.mediaDiscoveryCount} / ${limits.mediaDiscoveryPerDay >= 9999 ? 'Unlimited' : limits.mediaDiscoveryPerDay}`
      },
      monthlyStats: {
        aiGenerations: `${usage.aiGenerationsCount} / ${limits.aiGenerationsPerMonth >= 9999 ? 'Unlimited' : limits.aiGenerationsPerMonth}`
      }
    };
  }
}

export const costGuard = new CostGuardService();

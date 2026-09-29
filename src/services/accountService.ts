import { PlanType } from '../types/plans';

// ==========================================
// USER ACCOUNT & IDENTITY ARCHITECTURE
// Provider-Agnostic Interfaces + Local/Dev Adapter
// ==========================================

export type AccountMode = 'GUEST_LOCAL' | 'AUTHENTICATED';

export type AuthProviderType =
  | 'local_guest'
  | 'development_mock'
  | 'supabase'
  | 'firebase'
  | 'custom_backend';

export type CloudSyncReadiness =
  | 'LOCAL_ONLY_READY_FOR_CLOUD'
  | 'CLOUD_CONNECTED';

export interface UserProfile {
  userId: string;
  email: string | null;
  displayName: string;
  accountMode: AccountMode;
  authProvider: AuthProviderType;
  isAuthenticated: boolean;
  isDevelopmentAuthOnly: boolean;
  cloudSyncStatus: CloudSyncReadiness;
  createdAt: string;
  lastActiveAt: string;
}

export interface AuthActionResult {
  success: boolean;
  user: UserProfile;
  message: string;
  isDevelopmentOnly: boolean;
}

export interface AccountRecoveryResult {
  success: boolean;
  message: string;
  isConfigured: boolean;
}

/**
 * Provider-agnostic authentication & account adapter contract.
 * Replace `LocalGuestAccountAdapter` with a real backend adapter (Supabase, Firebase, or Custom API)
 * when production authentication is connected.
 */
export interface AccountProviderAdapter {
  readonly providerId: AuthProviderType;
  readonly isProductionBackend: boolean;
  getCurrentUser(): UserProfile;
  getSessionToken?(): string | null;
  signUp(email: string, displayName?: string): Promise<AuthActionResult>;
  signIn(email: string): Promise<AuthActionResult>;
  signOut(): Promise<AuthActionResult>;
  updateProfile(updates: Partial<Pick<UserProfile, 'displayName' | 'email'>>): Promise<UserProfile>;
  requestAccountRecovery(email: string): Promise<AccountRecoveryResult>;
}

const ACCOUNT_STORAGE_KEY = 'sss_account_profile_v1';

function generateLocalGuestId(): string {
  const randomPart = Math.random().toString(36).substring(2, 10);
  const timePart = Date.now().toString(36);
  return `local_guest_${timePart}_${randomPart}`;
}

function createDefaultGuestProfile(): UserProfile {
  const now = new Date().toISOString();
  return {
    userId: generateLocalGuestId(),
    email: null,
    displayName: 'Local Workspace User',
    accountMode: 'GUEST_LOCAL',
    authProvider: 'local_guest',
    isAuthenticated: false,
    isDevelopmentAuthOnly: true,
    cloudSyncStatus: 'LOCAL_ONLY_READY_FOR_CLOUD',
    createdAt: now,
    lastActiveAt: now
  };
}

/**
 * Default Local / Guest Account Adapter.
 * Explicitly separates local/development identity from production cloud authentication.
 * Does NOT pretend that mock or local storage identity is a verified cloud account.
 */
class LocalGuestAccountAdapter implements AccountProviderAdapter {
  readonly providerId: AuthProviderType = 'local_guest';
  readonly isProductionBackend: boolean = false;

  getCurrentUser(): UserProfile {
    try {
      const raw = localStorage.getItem(ACCOUNT_STORAGE_KEY);
      if (!raw) {
        const initial = createDefaultGuestProfile();
        this.saveProfile(initial);
        return initial;
      }

      const parsed = JSON.parse(raw);
      // Never allow localStorage tampering to claim a production authenticated provider when no backend is configured
      const safeProfile: UserProfile = {
        userId: typeof parsed.userId === 'string' && parsed.userId.trim() ? parsed.userId : generateLocalGuestId(),
        email: typeof parsed.email === 'string' && parsed.email.trim() ? parsed.email.trim() : null,
        displayName: typeof parsed.displayName === 'string' && parsed.displayName.trim() ? parsed.displayName.trim() : 'Local Workspace User',
        accountMode: 'GUEST_LOCAL',
        authProvider: 'local_guest',
        isAuthenticated: false,
        isDevelopmentAuthOnly: true,
        cloudSyncStatus: 'LOCAL_ONLY_READY_FOR_CLOUD',
        createdAt: typeof parsed.createdAt === 'string' ? parsed.createdAt : new Date().toISOString(),
        lastActiveAt: new Date().toISOString()
      };

      return safeProfile;
    } catch {
      return createDefaultGuestProfile();
    }
  }

  private saveProfile(profile: UserProfile): void {
    try {
      localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(profile));
    } catch (err) {
      console.error('[AccountService] Failed to persist local profile:', err);
    }
  }

  async signUp(_email: string, _displayName?: string): Promise<AuthActionResult> {
    const current = this.getCurrentUser();
    return {
      success: false,
      user: current,
      message: 'Cloud account registration is not connected yet. Operating in Guest / Local Mode.',
      isDevelopmentOnly: true
    };
  }

  async signIn(_email: string): Promise<AuthActionResult> {
    const current = this.getCurrentUser();
    return {
      success: false,
      user: current,
      message: 'Cloud sign-in backend is not connected yet. Operating in Guest / Local Mode.',
      isDevelopmentOnly: true
    };
  }

  async signOut(): Promise<AuthActionResult> {
    const resetGuest = createDefaultGuestProfile();
    this.saveProfile(resetGuest);
    return {
      success: true,
      user: resetGuest,
      message: 'Session reset to Guest / Local Mode.',
      isDevelopmentOnly: true
    };
  }

  async updateProfile(updates: Partial<Pick<UserProfile, 'displayName' | 'email'>>): Promise<UserProfile> {
    const current = this.getCurrentUser();
    const updated: UserProfile = {
      ...current,
      displayName: updates.displayName !== undefined ? updates.displayName.trim() || 'Local Workspace User' : current.displayName,
      email: updates.email !== undefined ? (updates.email ? updates.email.trim() : null) : current.email,
      lastActiveAt: new Date().toISOString()
    };
    this.saveProfile(updated);
    return updated;
  }

  async requestAccountRecovery(_email: string): Promise<AccountRecoveryResult> {
    return {
      success: false,
      isConfigured: false,
      message: 'Cloud account recovery is not connected yet. Use Settings → Data & Backup to export or restore local backups.'
    };
  }
}

class AccountService {
  private adapter: AccountProviderAdapter = new LocalGuestAccountAdapter();

  /**
   * Register a production authentication adapter (e.g., Supabase, Firebase, Custom Backend)
   * when cloud authentication is connected in the future.
   */
  registerAdapter(newAdapter: AccountProviderAdapter): void {
    this.adapter = newAdapter;
  }

  getAdapterInfo(): { providerId: AuthProviderType; isProductionBackend: boolean } {
    return {
      providerId: this.adapter.providerId,
      isProductionBackend: this.adapter.isProductionBackend
    };
  }

  getCurrentUser(): UserProfile {
    return this.adapter.getCurrentUser();
  }

  getSessionToken(): string | null {
    return this.adapter.getSessionToken ? this.adapter.getSessionToken() : null;
  }

  getAccountStatusDisplay(): 'Guest / Local Mode' | 'Signed In' {
    const user = this.getCurrentUser();
    if (this.adapter.isProductionBackend && user.isAuthenticated && user.accountMode === 'AUTHENTICATED') {
      return 'Signed In';
    }
    return 'Guest / Local Mode';
  }

  getFutureAccountSyncDisplay(): string {
    const user = this.getCurrentUser();
    if (this.adapter.isProductionBackend && user.cloudSyncStatus === 'CLOUD_CONNECTED') {
      return 'Connected to cloud account';
    }
    return 'Ready for cloud account integration';
  }

  async signUp(email: string, displayName?: string): Promise<AuthActionResult> {
    return this.adapter.signUp(email, displayName);
  }

  async signIn(email: string): Promise<AuthActionResult> {
    return this.adapter.signIn(email);
  }

  async signOut(): Promise<AuthActionResult> {
    return this.adapter.signOut();
  }

  async updateProfile(updates: Partial<Pick<UserProfile, 'displayName' | 'email'>>): Promise<UserProfile> {
    return this.adapter.updateProfile(updates);
  }

  async requestAccountRecovery(email: string): Promise<AccountRecoveryResult> {
    return this.adapter.requestAccountRecovery(email);
  }
}

export const accountService = new AccountService();

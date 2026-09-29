/**
 * Centralized Environment Configuration (Development / Test / Production)
 * Social Share Scheduler
 *
 * Separates runtime configuration by environment without embedding any private secrets
 * in client-side source code or Android APK bundles.
 */

export type AppEnvironment = 'development' | 'test' | 'production';

export interface EnvironmentConfig {
  env: AppEnvironment;
  isDevelopment: boolean;
  isTest: boolean;
  isProduction: boolean;
  isNativeAndroidShell: boolean;
  apiBaseUrl: string;
  enableDebugLogging: boolean;
  enableWebContentsDebugging: boolean;
  allowMixedContent: boolean;
  requestTimeoutMs: number;
  maxClientRetries: number;
}

/**
 * Detects whether the app is currently running inside an Android WebView / Capacitor shell
 * where relative `/api/*` paths require an explicit remote backend origin.
 */
export function detectNativeAndroidShell(): boolean {
  if (typeof window === 'undefined') return false;
  const protocol = window.location?.protocol || '';
  const hostname = window.location?.hostname || '';
  const userAgent = window.navigator?.userAgent || '';

  if (protocol === 'capacitor:' || protocol === 'file:') {
    return true;
  }
  if (
    hostname === 'localhost' &&
    /Android/i.test(userAgent) &&
    /wv|Version\/\d+\.\d+/i.test(userAgent)
  ) {
    return true;
  }
  return Boolean((window as any).Capacitor?.isNativePlatform?.());
}

/**
 * Resolves the current application environment ('development' | 'test' | 'production').
 */
export function resolveAppEnvironment(): AppEnvironment {
  try {
    const viteMode = (import.meta as any)?.env?.MODE;
    if (viteMode === 'test') return 'test';
    if (viteMode === 'production') return 'production';
    if (viteMode === 'development') return 'development';
  } catch {
    // Fallback for Node / server / non-Vite contexts
  }

  if (typeof process !== 'undefined' && process.env?.NODE_ENV) {
    if (process.env.NODE_ENV === 'test') return 'test';
    if (process.env.NODE_ENV === 'production') return 'production';
  }

  return 'development';
}

/**
 * Resolves the configured Backend API Base URL.
 * - In Web / Cloud Run deployments: defaults to '' (same-origin `/api/*` proxy).
 * - In Android APK builds: uses `VITE_API_BASE_URL` if configured; never embeds private keys.
 */
export function resolveApiBaseUrl(): string {
  try {
    const configuredUrl = (import.meta as any)?.env?.VITE_API_BASE_URL;
    if (configuredUrl && typeof configuredUrl === 'string' && configuredUrl.trim()) {
      return configuredUrl.trim().replace(/\/+$/, '');
    }
  } catch {
    // Ignore if import.meta is unavailable
  }
  return '';
}

const ENVIRONMENT_PRESETS: Record<AppEnvironment, Omit<EnvironmentConfig, 'isNativeAndroidShell' | 'apiBaseUrl'>> = {
  development: {
    env: 'development',
    isDevelopment: true,
    isTest: false,
    isProduction: false,
    enableDebugLogging: true,
    enableWebContentsDebugging: false,
    allowMixedContent: false,
    requestTimeoutMs: 25000,
    maxClientRetries: 2
  },
  test: {
    env: 'test',
    isDevelopment: false,
    isTest: true,
    isProduction: false,
    enableDebugLogging: false,
    enableWebContentsDebugging: false,
    allowMixedContent: false,
    requestTimeoutMs: 10000,
    maxClientRetries: 1
  },
  production: {
    env: 'production',
    isDevelopment: false,
    isTest: false,
    isProduction: true,
    enableDebugLogging: false,
    enableWebContentsDebugging: false,
    allowMixedContent: false,
    requestTimeoutMs: 20000,
    maxClientRetries: 2
  }
};

export function getEnvironmentConfig(): EnvironmentConfig {
  const env = resolveAppEnvironment();
  const preset = ENVIRONMENT_PRESETS[env];
  return {
    ...preset,
    isNativeAndroidShell: detectNativeAndroidShell(),
    apiBaseUrl: resolveApiBaseUrl()
  };
}

/**
 * Builds a full backend endpoint URL (e.g. `/api/ai/generate` -> `https://api.example.com/api/ai/generate` or `/api/ai/generate`).
 */
export function buildBackendEndpointUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const baseUrl = resolveApiBaseUrl();
  return baseUrl ? `${baseUrl}${cleanPath}` : cleanPath;
}

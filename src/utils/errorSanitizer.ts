/**
 * Production Error Message & Diagnostic Sanitizer
 * Social Share Scheduler
 *
 * Ensures that user-facing errors, audit trails, and diagnostic reports NEVER expose:
 * - Private API keys (e.g. AIza..., sk-..., GEMINI_API_KEY)
 * - OAuth Bearer / access tokens (e.g. ya29....)
 * - Raw upstream provider quota/rate-limit dumps (e.g. generic::resource_exhausted, generativelanguage.googleapis.com)
 * - Internal server file paths or stack traces
 */

const SECRET_PATTERNS: RegExp[] = [
  /AIza[0-9A-Za-z_-]{20,}/g,
  /sk-[0-9A-Za-z_-]{20,}/g,
  /ya29\.[0-9A-Za-z_-]{20,}/g,
  /Bearer\s+[0-9A-Za-z._~+/-]+=*/gi,
  /GEMINI_API_KEY\s*[:=]\s*[^\s,;]+/gi,
  /api[_-]?key\s*[:=]\s*['"]?[^\s'"&]+['"]?/gi,
  /access[_-]?token\s*[:=]\s*['"]?[^\s'"&]+['"]?/gi,
  /client[_-]?secret\s*[:=]\s*['"]?[^\s'"&]+['"]?/gi
];

const UPSTREAM_QUOTA_PATTERNS: RegExp[] = [
  /generic::resource_exhausted/i,
  /resource_exhausted/i,
  /generativelanguage\.googleapis\.com/i,
  /ai\.google\.dev\/gemini-api\/docs\/rate-limits/i,
  /ai\.dev\/rate-limit/i,
  /You exceeded your current quota/i,
  /Quota exceeded for metric/i,
  /429\s+Too\s+Many\s+Requests/i
];

const INTERNAL_ENV_PATTERNS: RegExp[] = [
  /GEMINI_API_KEY/i,
  /environment variable is missing/i,
  /ECONNREFUSED/i,
  /ENOTFOUND/i,
  /at\s+[A-Za-z0-9_$.]+\s+\([^)]+:\d+:\d+\)/
];

/**
 * Redacts any secret token, API key, or internal path from a raw string.
 */
export function redactSecretsFromString(input: string): string {
  if (!input || typeof input !== 'string') return '';
  let result = input;
  for (const pattern of SECRET_PATTERNS) {
    result = result.replace(pattern, '[REDACTED_SECRET]');
  }
  // Redact server file paths like /app/server.ts:123:45
  result = result.replace(/(\/[a-zA-Z0-9_.-]+){2,}\.(ts|tsx|js|json)(:\d+(:\d+)?)?/g, '[INTERNAL_PATH]');
  return result;
}

/**
 * Converts any raw error or exception into a safe, user-friendly message
 * suitable for UI notifications and error banners.
 */
export function sanitizeUserFacingError(
  rawError: unknown,
  fallbackMessage = 'Service temporarily unavailable. Please try again in a moment.'
): string {
  if (!rawError) return fallbackMessage;

  const rawMessage =
    typeof rawError === 'string'
      ? rawError
      : rawError instanceof Error
      ? rawError.message
      : typeof (rawError as any)?.message === 'string'
      ? (rawError as any).message
      : typeof (rawError as any)?.error === 'string'
      ? (rawError as any).error
      : String(rawError);

  if (!rawMessage || rawMessage === '[object Object]') {
    return fallbackMessage;
  }

  // 1. Check for upstream AI / API quota or rate-limit errors
  if (UPSTREAM_QUOTA_PATTERNS.some(p => p.test(rawMessage))) {
    return 'AI service is currently busy due to high request volume. Smart local fallback has been applied automatically—please wait a moment before retrying.';
  }

  // 2. Check for missing backend configuration or internal environment variables
  if (INTERNAL_ENV_PATTERNS.some(p => p.test(rawMessage))) {
    return 'This feature requires an active backend connection. Please verify your network or backend configuration.';
  }

  // 3. Check for network / CORS / offline errors
  if (/Failed to fetch|NetworkError|Load failed|CORS/i.test(rawMessage)) {
    return 'Unable to reach the remote service. Please check your internet connection or source availability.';
  }

  // 4. Redact any accidental token/key patterns and cap length
  const redacted = redactSecretsFromString(rawMessage).trim();
  if (redacted.length > 220) {
    return fallbackMessage;
  }

  return redacted || fallbackMessage;
}

/**
 * Sanitizes internal diagnostic details before storing in memory or audit logs.
 */
export function sanitizeDiagnosticDetails(details: any): any {
  if (details === null || details === undefined) return undefined;
  if (typeof details === 'string') {
    return redactSecretsFromString(details).slice(0, 300);
  }
  if (details instanceof Error) {
    return {
      name: details.name,
      message: sanitizeUserFacingError(details.message)
    };
  }
  if (Array.isArray(details)) {
    return details.map(item => sanitizeDiagnosticDetails(item));
  }
  if (typeof details === 'object') {
    const clean: Record<string, any> = {};
    for (const [k, v] of Object.entries(details)) {
      if (/key|token|secret|password|credential|authorization|cookie/i.test(k)) {
        clean[k] = '[REDACTED]';
      } else {
        clean[k] = sanitizeDiagnosticDetails(v);
      }
    }
    return clean;
  }
  return details;
}

/**
 * Safe Application Logger
 * Automatically sanitizes and redacts sensitive data (tokens, passwords, keys, large base64 blobs)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const SENSITIVE_KEYS = [
  'token',
  'accesstoken',
  'access_token',
  'refreshtoken',
  'refresh_token',
  'password',
  'secret',
  'apikey',
  'api_key',
  'credential',
  'authorization'
];

/**
 * Recursively redacts sensitive keys and truncates huge strings
 */
function sanitizeData(data: any): any {
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') {
    // Truncate data URIs or huge base64 strings
    if (data.startsWith('data:') && data.length > 100) {
      return `[BASE64_DATA: length ${data.length}]`;
    }
    if (data.length > 500) {
      return data.slice(0, 200) + `... [TRUNCATED ${data.length - 200} chars]`;
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }

  if (typeof data === 'object') {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      const lower = key.toLowerCase();
      const isSensitive = SENSITIVE_KEYS.some(s => lower.includes(s));
      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeData(value);
      }
    }
    return sanitized;
  }

  return data;
}

const isProduction = process.env.NODE_ENV === 'production';

export const logger = {
  debug(message: string, context?: any) {
    if (!isProduction) {
      console.debug(`[SSS:DEBUG] ${message}`, context ? sanitizeData(context) : '');
    }
  },

  info(message: string, context?: any) {
    console.info(`[SSS:INFO] ${message}`, context ? sanitizeData(context) : '');
  },

  warn(message: string, context?: any) {
    console.warn(`[SSS:WARN] ${message}`, context ? sanitizeData(context) : '');
  },

  error(message: string, error?: any) {
    console.error(`[SSS:ERROR] ${message}`, error ? sanitizeData(error) : '');
  }
};

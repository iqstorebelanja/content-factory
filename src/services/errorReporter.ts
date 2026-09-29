/**
 * Consistent Internal Error Reporting Structure
 */

import { logger } from './logger';
import { redactSecretsFromString, sanitizeDiagnosticDetails, sanitizeUserFacingError } from '../utils/errorSanitizer';

export interface AppError {
  code: string;
  message: string;
  userFacingMessage: string;
  feature: string;
  timestamp: string;
  recoverable: boolean;
  details?: any;
}

// In-memory circular buffer for the last 50 errors (no secrets stored)
const errorLogBuffer: AppError[] = [];
const MAX_ERROR_LOGS = 50;

export const errorReporter = {
  report(
    code: string,
    feature: string,
    internalMessage: string,
    userFacingMessage: string,
    recoverable = true,
    details?: any
  ): AppError {
    const safeInternal = redactSecretsFromString(internalMessage || 'Unknown error');
    const safeUserFacing = sanitizeUserFacingError(userFacingMessage || internalMessage);
    const safeDetails = sanitizeDiagnosticDetails(details);

    const errorObj: AppError = {
      code,
      message: safeInternal,
      userFacingMessage: safeUserFacing,
      feature,
      timestamp: new Date().toISOString(),
      recoverable,
      details: safeDetails
    };

    errorLogBuffer.unshift(errorObj);
    if (errorLogBuffer.length > MAX_ERROR_LOGS) {
      errorLogBuffer.pop();
    }

    logger.error(`[${feature}] ${code}: ${safeInternal}`, safeDetails);
    return errorObj;
  },

  getRecentErrors(): AppError[] {
    return [...errorLogBuffer];
  },

  clearErrors(): void {
    errorLogBuffer.length = 0;
  }
};

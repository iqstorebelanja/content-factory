/**
 * Consistent Internal Error Reporting Structure
 */

import { logger } from './logger';

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
    const errorObj: AppError = {
      code,
      message: internalMessage,
      userFacingMessage,
      feature,
      timestamp: new Date().toISOString(),
      recoverable,
      details
    };

    errorLogBuffer.unshift(errorObj);
    if (errorLogBuffer.length > MAX_ERROR_LOGS) {
      errorLogBuffer.pop();
    }

    logger.error(`[${feature}] ${code}: ${internalMessage}`, details);
    return errorObj;
  },

  getRecentErrors(): AppError[] {
    return [...errorLogBuffer];
  },

  clearErrors(): void {
    errorLogBuffer.length = 0;
  }
};

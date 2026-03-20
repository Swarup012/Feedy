/**
 * Centralized Error Handler
 *
 * Provides consistent error handling across the application with:
 * - User-friendly message mapping
 * - Error classification (network, validation, auth, server, etc.)
 * - Automatic retry for transient errors
 * - Detailed logging for debugging
 */

type ErrorType = 'network' | 'validation' | 'auth' | 'server' | 'not-found' | 'permission' | 'unknown';

interface ErrorInfo {
  type: ErrorType;
  title: string;
  description: string;
  userAction?: string;
  logLevel: 'error' | 'warn' | 'info';
  shouldRetry?: boolean;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
      error?: string;
      errors?: Record<string, string[]>;
    };
    status?: number;
  };
  message?: string;
  code?: string;
}

/**
 * Classify error type based on error object
 */
export function classifyError(error: unknown): ErrorType {
  if (!error) return 'unknown';

  // Axios/network errors
  if (typeof error === 'object' && 'message' in error) {
    const err = error as { message?: string; code?: string; response?: { status?: number } };

    // Network errors
    if (err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED' || err.message?.includes('Network Error')) {
      return 'network';
    }

    // HTTP status codes
    const status = err.response?.status;
    if (status) {
      if (status === 401 || status === 403) return 'auth';
      if (status === 404) return 'not-found';
      if (status === 400 || status === 422) return 'validation';
      if (status >= 500) return 'server';
    }
  }

  return 'unknown';
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: unknown): ErrorInfo {
  const errorType = classifyError(error);

  const errorMessages: Record<ErrorType, ErrorInfo> = {
    network: {
      type: 'network',
      title: 'Connection Error',
      description: 'Unable to connect to the server. Please check your internet connection.',
      userAction: 'Try refreshing the page or check your connection',
      logLevel: 'error',
      shouldRetry: true,
    },
    auth: {
      type: 'auth',
      title: 'Authentication Required',
      description: 'Your session has expired. Please log in again.',
      userAction: 'Click here to log in',
      logLevel: 'warn',
      shouldRetry: false,
    },
    validation: {
      type: 'validation',
      title: 'Invalid Input',
      description: 'Please check your input and try again.',
      logLevel: 'warn',
      shouldRetry: false,
    },
    server: {
      type: 'server',
      title: 'Server Error',
      description: 'Something went wrong on our end. Our team has been notified.',
      userAction: 'Please try again in a few minutes',
      logLevel: 'error',
      shouldRetry: true,
    },
    'not-found': {
      type: 'not-found',
      title: 'Not Found',
      description: 'The requested resource was not found.',
      logLevel: 'warn',
      shouldRetry: false,
    },
    permission: {
      type: 'permission',
      title: 'Access Denied',
      description: 'You don\'t have permission to perform this action.',
      logLevel: 'warn',
      shouldRetry: false,
    },
    unknown: {
      type: 'unknown',
      title: 'Something Went Wrong',
      description: 'An unexpected error occurred.',
      logLevel: 'error',
      shouldRetry: false,
    },
  };

  const baseErrorInfo = errorMessages[errorType];

  // Try to extract specific error message from response
  if (typeof error === 'object' && 'response' in error) {
    const apiError = error as ApiError;

    if (apiError.response?.data?.message) {
      return {
        ...baseErrorInfo,
        description: apiError.response.data.message,
      };
    }

    if (apiError.response?.data?.error) {
      return {
        ...baseErrorInfo,
        description: apiError.response.data.error,
      };
    }

    if (apiError.response?.data?.errors) {
      // Validation errors with field-specific messages
      const fieldErrors = apiError.response.data.errors;
      const firstError = Object.values(fieldErrors)[0]?.[0];
      if (firstError) {
        return {
          ...baseErrorInfo,
          description: firstError,
        };
      }
    }

    // Handle specific status codes
    const status = apiError.response?.status;
    if (status === 403) {
      return {
        type: 'permission',
        title: 'Access Denied',
        description: 'You don\'t have permission to perform this action.',
        logLevel: 'warn',
      };
    }
  }

  return baseErrorInfo;
}

/**
 * Log error with appropriate level and context
 */
export function logError(error: unknown, context?: string, additionalData?: Record<string, unknown>) {
  const errorInfo = getErrorMessage(error);

  const logData = {
    type: errorInfo.type,
    context,
    error,
    ...additionalData,
  };

  switch (errorInfo.logLevel) {
    case 'error':
      console.error(`[Error] ${context || 'Unknown context'}`, logData);
      break;
    case 'warn':
      console.warn(`[Warning] ${context || 'Unknown context'}`, logData);
      break;
    case 'info':
      console.info(`[Info] ${context || 'Unknown context'}`, logData);
      break;
  }
}

/**
 * Format error for toast notification
 */
export function formatErrorForToast(error: unknown): {
  title: string;
  description: string;
  variant?: 'default' | 'destructive' | 'success';
} {
  const errorInfo = getErrorMessage(error);

  return {
    title: errorInfo.title,
    description: errorInfo.userAction
      ? `${errorInfo.description} ${errorInfo.userAction}.`
      : errorInfo.description,
    variant: errorInfo.type === 'success' ? 'success' : 'destructive',
  };
}

/**
 * Check if error is retryable
 */
export function isRetryable(error: unknown): boolean {
  const errorInfo = getErrorMessage(error);
  return errorInfo.shouldRetry === true;
}

/**
 * Get context-aware error message for specific actions
 */
export function getActionErrorMessage(action: string, error: unknown): ErrorInfo {
  const baseError = getErrorMessage(error);

  const actionMessages: Record<string, Partial<ErrorInfo>> = {
    create: {
      title: `Failed to Create`,
      description: `Could not create ${action}. Please try again.`,
    },
    update: {
      title: `Failed to Update`,
      description: `Could not update ${action}. Please try again.`,
    },
    delete: {
      title: `Failed to Delete`,
      description: `Could not delete ${action}. Please try again.`,
    },
    load: {
      title: `Failed to Load`,
      description: `Could not load ${action}. Please refresh the page.`,
    },
  };

  const actionOverride = Object.entries(actionMessages).find(([key]) =>
    action.toLowerCase().includes(key)
  )?.[1];

  return {
    ...baseError,
    ...actionOverride,
  };
}

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  constructor(
    public type: ErrorType,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}
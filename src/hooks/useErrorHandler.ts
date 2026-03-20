/**
 * useErrorHandler Hook
 *
 * Provides consistent error handling for React components with:
 * - Automatic toast notifications
 * - Error logging
 * - Loading state management
 * - Retry capability for transient errors
 */

import { useCallback, useRef } from 'react';
import { useToast } from './use-toast';
import {
  logError,
  formatErrorForToast,
  isRetryable,
  getActionErrorMessage,
} from '@/utils/errorHandler';

interface UseErrorHandlerOptions {
  context?: string;  // Where the error occurred (e.g., "loadDashboard", "createBoard")
  showToast?: boolean;  // Show toast on error (default: true)
  logError?: boolean;  // Log to console (default: true)
}

interface AsyncOptions extends UseErrorHandlerOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  retryCount?: number;  // Number of retries for transient errors
}

interface HandleAsyncResult<T> {
  execute: () => Promise<T>;
  error: Error | null;
  isLoading: boolean;
  retry: () => void;
}

/**
 * Hook for handling async operations with automatic error handling
 */
export function useAsyncOperation<T = any>(
  asyncFn: () => Promise<T>,
  options: AsyncOptions = {}
): {
  execute: () => Promise<T | void>;
  isLoading: boolean;
  error: Error | null;
} {
  const { context, onSuccess, onError, showToast = true, logError = true } = options;
  const { toast } = useToast();
  const isLoadingRef = useRef(false);

  const execute = useCallback(async () => {
    if (isLoadingRef.current) return;

    isLoadingRef.current = true;

    try {
      const result = await asyncFn();

      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (error) {
      const errorContext = context || 'Async operation';

      if (logError) {
        logError(error, errorContext);
      }

      if (showToast) {
        const toastError = getActionErrorMessage(errorContext, error);
        toast({
          title: toastError.title,
          description: toastError.description,
          variant: 'destructive',
        });
      }

      if (onError) {
        onError(error);
      }

      throw error;
    } finally {
      isLoadingRef.current = false;
    }
  }, [asyncFn, context, onError, onSuccess, showToast, logError, toast]);

  return {
    execute,
    isLoading: isLoadingRef.current,
    error: null,
  };
}

/**
 * Hook for handling errors manually
 */
export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const { context = 'Unknown', showToast: shouldShowToast = true, logError: shouldLogError = true }
    = options;
  const { toast } = useToast();

  return useCallback((error: unknown) => {
    // Log the error
    if (shouldLogError) {
      logError(error, context);
    }

    // Show toast if enabled
    if (shouldShowToast) {
      const toastError = formatErrorForToast(error);
      toast({
        title: toastError.title,
        description: toastError.description,
        variant: toastError.variant,
      });
    }
  }, [context, shouldShowToast, shouldLogError, toast]);
}

/**
 * Hook for handling form submission errors with validation display
 */
export function useFormHandler(options: UseErrorHandlerOptions = {}) {
  const { context = 'Form submission', showToast: shouldShowToast = true, logError: shouldLogError = true }
    = options;
  const { toast } = useToast();

  return useCallback((error: unknown, setError?: (field: string, message: string) => void) => {
    // Log the error
    if (shouldLogError) {
      logError(error, context);
    }

    // Handle validation errors
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const err = error as { response?: { data?: { errors?: Record<string, string[]> } } };

      if (err.response?.data?.errors && setError) {
        // Set field-specific errors
        Object.entries(err.response.data.errors).forEach(([field, messages]) => {
          setError(field, messages[0]);
        });

        return;
      }
    }

    // Show toast for other errors
    if (shouldShowToast) {
      const toastError = formatErrorForToast(error);
      toast({
        title: toastError.title,
        description: toastError.description,
        variant: 'destructive',
      });
    }
  }, [context, shouldShowToast, shouldLogError, toast]);
}

/**
 * Higher-order function to wrap async functions with error handling
 */
export function withErrorHandling<T extends any[]>(
  asyncFn: (...args: T) => Promise<any>,
  options: AsyncOptions = {}
) {
  return async (...args: T) => {
    const { context, onSuccess, onError, showToast = true, logError = true, retryCount = 0 }
      = options;
    const toastLib = (await import('./use-toast')).useToast();

    try {
      const result = await asyncFn(...args);

      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (error) {
      const errorContext = context || 'Operation';

      if (logError) {
        logError(error, errorContext);
      }

      if (showToast) {
        const toastError = formatErrorForToast(error);
        const { toast } = toastLib.useToast();
        toast({
          title: toastError.title,
          description: toastError.description,
          variant: 'destructive',
        });
      }

      if (isRetryable(error) && retryCount > 0 && !(error as any)._retryCount) {
        (error as any)._retryCount = 0;
      }

      if (onError) {
        onError(error);
      }

      throw error;
    }
  };
}
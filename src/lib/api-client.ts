/**
 * @fileoverview Base API client with retry logic and error handling.
 *
 * Implements exponential backoff for transient failures (429, 5xx errors)
 * to handle the API's intermittent failure behavior gracefully.
 */

import {
  MAX_RETRY_ATTEMPTS,
  RETRY_BASE_DELAY_MS,
  RETRYABLE_STATUS_CODES,
} from '@/features/risk-assessment/constants/thresholds';

// ============================================================================
// CUSTOM ERROR CLASSES
// ============================================================================

/**
 * Base error class for API-related errors.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Error thrown when rate limit is exceeded (HTTP 429).
 */
export class RateLimitError extends ApiError {
  constructor(retryAfter?: number) {
    super(
      `Rate limit exceeded${retryAfter ? `. Retry after ${retryAfter}s` : ''}`,
      429,
      true
    );
    this.name = 'RateLimitError';
  }
}

/**
 * Error thrown when max retries are exhausted.
 */
export class MaxRetriesExceededError extends ApiError {
  constructor(lastStatusCode: number) {
    super(
      `Max retries (${MAX_RETRY_ATTEMPTS}) exceeded. Last status: ${lastStatusCode}`,
      lastStatusCode,
      false
    );
    this.name = 'MaxRetriesExceededError';
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Delays execution for the specified duration.
 * @param ms - Milliseconds to delay
 */
const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Calculates delay using exponential backoff with jitter.
 * @param attempt - Current attempt number (1-indexed)
 * @returns Delay in milliseconds
 */
const calculateBackoffDelay = (attempt: number): number => {
  const exponentialDelay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
  // Add jitter (±20%) to prevent thundering herd
  const jitter = exponentialDelay * 0.2 * (Math.random() - 0.5);
  return Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds
};

/**
 * Determines if an HTTP status code should trigger a retry.
 * @param statusCode - HTTP status code
 */
const isRetryableStatus = (statusCode: number): boolean =>
  (RETRYABLE_STATUS_CODES as readonly number[]).includes(statusCode);

// ============================================================================
// API CLIENT
// ============================================================================

interface FetchOptions extends RequestInit {
  /** Custom timeout in milliseconds (default: 30000) */
  timeout?: number;
}

/**
 * Performs an HTTP request with automatic retry on transient failures.
 *
 * @template T - Expected response type
 * @param url - Request URL
 * @param options - Fetch options
 * @param attempt - Current attempt number (internal use)
 * @returns Parsed JSON response
 * @throws {ApiError} On non-retryable errors
 * @throws {MaxRetriesExceededError} When retries are exhausted
 *
 * @example
 * ```typescript
 * const data = await fetchWithRetry<PatientResponse>('/api/patients?page=1');
 * ```
 */
export async function fetchWithRetry<T>(
  url: string,
  options: FetchOptions = {},
  attempt: number = 1
): Promise<T> {
  const { timeout = 30000, ...fetchOptions } = options;

  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle retryable status codes
    if (isRetryableStatus(response.status)) {
      if (attempt < MAX_RETRY_ATTEMPTS) {
        const backoffDelay = calculateBackoffDelay(attempt);
        console.warn(
          `Request failed with ${response.status}. Retrying in ${Math.round(backoffDelay)}ms (attempt ${attempt + 1}/${MAX_RETRY_ATTEMPTS})`
        );
        await delay(backoffDelay);
        return fetchWithRetry<T>(url, options, attempt + 1);
      }
      throw new MaxRetriesExceededError(response.status);
    }

    // Handle non-retryable errors
    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unknown error');
      throw new ApiError(
        `API request failed: ${response.status} - ${errorBody}`,
        response.status
      );
    }

    return response.json();
  } catch (error) {
    // Handle timeout/abort
    if (error instanceof Error && error.name === 'AbortError') {
      if (attempt < MAX_RETRY_ATTEMPTS) {
        console.warn(`Request timed out. Retrying (attempt ${attempt + 1}/${MAX_RETRY_ATTEMPTS})`);
        await delay(calculateBackoffDelay(attempt));
        return fetchWithRetry<T>(url, options, attempt + 1);
      }
      throw new ApiError('Request timed out', 408, false);
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      if (attempt < MAX_RETRY_ATTEMPTS) {
        console.warn(`Network error. Retrying (attempt ${attempt + 1}/${MAX_RETRY_ATTEMPTS})`);
        await delay(calculateBackoffDelay(attempt));
        return fetchWithRetry<T>(url, options, attempt + 1);
      }
      throw new ApiError('Network error - unable to reach server', 0, false);
    }

    // Re-throw API errors
    if (error instanceof ApiError) {
      throw error;
    }

    // Wrap unknown errors
    throw new ApiError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      500
    );
  }
}

/**
 * @fileoverview Shared API response types for the Healthcare Assessment API.
 * These types represent the contract between client and server.
 */

/**
 * Pagination metadata returned by list endpoints.
 */
export interface PaginationInfo {
  /** Current page number (1-indexed) */
  page: number;
  /** Number of items per page */
  limit: number;
  /** Total number of items across all pages */
  total: number;
  /** Total number of pages available */
  totalPages: number;
  /** Whether more pages exist after current */
  hasNext: boolean;
  /** Whether pages exist before current */
  hasPrevious: boolean;
}

/**
 * Standard metadata included in all API responses.
 */
export interface ApiMetadata {
  /** ISO 8601 timestamp of response generation */
  timestamp: string;
  /** API version identifier */
  version: string;
  /** Unique identifier for request tracing */
  requestId: string;
}

/**
 * Generic wrapper for paginated API responses.
 * @template T - The type of items in the data array
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
  metadata: ApiMetadata;
}

/**
 * Assessment submission response from the API.
 */
export interface SubmissionResponse {
  success: boolean;
  message: string;
  results: {
    score: number;
    percentage: number;
    status: 'PASS' | 'FAIL';
    breakdown: {
      high_risk: CategoryScore;
      fever: CategoryScore;
      data_quality: CategoryScore;
    };
    feedback: {
      strengths: string[];
      issues: string[];
    };
    attempt_number: number;
    remaining_attempts: number;
    is_personal_best: boolean;
    can_resubmit: boolean;
  };
}

/**
 * Score breakdown for a single assessment category.
 */
interface CategoryScore {
  score: number;
  max: number;
  correct: number;
  submitted: number;
  matches: number;
}

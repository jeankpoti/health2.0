/**
 * @fileoverview Named constants for risk scoring thresholds.
 *
 * Centralizing these values provides:
 * - Self-documenting code (no magic numbers)
 * - Single source of truth for business rules
 * - Easy adjustment if requirements change
 *
 * @see https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings
 */

// ============================================================================
// BLOOD PRESSURE THRESHOLDS
// ============================================================================

/**
 * Blood pressure classification thresholds based on AHA guidelines.
 * When systolic and diastolic fall into different categories,
 * the HIGHER risk stage is used for scoring.
 */
export const BLOOD_PRESSURE = {
  /** Normal: Systolic <120 AND Diastolic <80 */
  NORMAL: {
    systolic: { max: 119 },
    diastolic: { max: 79 },
    score: 1,
    label: 'Normal',
  },
  /** Elevated: Systolic 120-129 AND Diastolic <80 */
  ELEVATED: {
    systolic: { min: 120, max: 129 },
    diastolic: { max: 79 },
    score: 2,
    label: 'Elevated',
  },
  /** Stage 1 Hypertension: Systolic 130-139 OR Diastolic 80-89 */
  STAGE_1: {
    systolic: { min: 130, max: 139 },
    diastolic: { min: 80, max: 89 },
    score: 3,
    label: 'Stage 1 Hypertension',
  },
  /** Stage 2 Hypertension: Systolic >=140 OR Diastolic >=90 */
  STAGE_2: {
    systolic: { min: 140 },
    diastolic: { min: 90 },
    score: 4,
    label: 'Stage 2 Hypertension',
  },
} as const;

// ============================================================================
// TEMPERATURE THRESHOLDS
// ============================================================================

/**
 * Body temperature classification thresholds (Fahrenheit).
 */
export const TEMPERATURE = {
  /** Normal: <=99.5°F */
  NORMAL: {
    max: 99.5,
    score: 0,
    label: 'Normal',
  },
  /** Low-grade fever: 99.6°F - 100.9°F */
  LOW_FEVER: {
    min: 99.6,
    max: 100.9,
    score: 1,
    label: 'Low Fever',
  },
  /** High fever: >=101.0°F */
  HIGH_FEVER: {
    min: 101.0,
    score: 2,
    label: 'High Fever',
  },
} as const;

/** Temperature threshold for fever classification (used for fever patient list) */
export const FEVER_THRESHOLD = 99.6;

// ============================================================================
// AGE THRESHOLDS
// ============================================================================

/**
 * Age-based risk classification thresholds.
 */
export const AGE = {
  /** Under 40 years */
  UNDER_40: {
    max: 39,
    score: 1,
    label: 'Under 40',
  },
  /** 40-65 years (inclusive) */
  MIDDLE: {
    min: 40,
    max: 65,
    score: 1,
    label: '40-65',
  },
  /** Over 65 years */
  OVER_65: {
    min: 66,
    score: 2,
    label: 'Over 65',
  },
} as const;

// ============================================================================
// RISK CLASSIFICATION
// ============================================================================

/** Minimum total score to be classified as high-risk */
export const HIGH_RISK_THRESHOLD = 4;

/** Invalid data score (used when data is missing or malformed) */
export const INVALID_DATA_SCORE = 0;

// ============================================================================
// API CONFIGURATION
// ============================================================================

/** Patients per page for display */
export const API_PAGE_LIMIT = 10;

/** Maximum retry attempts for failed requests */
export const MAX_RETRY_ATTEMPTS = 3;

/** Base delay for exponential backoff (milliseconds) */
export const RETRY_BASE_DELAY_MS = 1000;

/** HTTP status codes that trigger retry */
export const RETRYABLE_STATUS_CODES = [429, 500, 502, 503, 504] as const;

/**
 * @fileoverview Pure functions for calculating patient risk scores.
 *
 * This module contains ZERO external dependencies, making it:
 * - 100% unit testable without mocking
 * - Easy to reason about (pure input → output)
 * - Reusable across different contexts
 *
 * @example
 * ```typescript
 * const bpRisk = calculateBloodPressureRisk('140/95');
 * // { score: 4, isValid: true }
 *
 * const patients = categorizePatients(allPatients);
 * // { highRiskPatients: [...], feverPatients: [...], dataQualityIssues: [...] }
 * ```
 */

import {
  BLOOD_PRESSURE,
  TEMPERATURE,
  AGE,
  HIGH_RISK_THRESHOLD,
  FEVER_THRESHOLD,
  INVALID_DATA_SCORE,
} from '../constants/thresholds';
import type {
  Patient,
  BloodPressureResult,
  RiskResult,
  PatientRiskScore,
  CategorizedPatients,
} from '../types';

// ============================================================================
// BLOOD PRESSURE CALCULATIONS
// ============================================================================

/**
 * Parses a blood pressure string into systolic and diastolic components.
 *
 * @param bp - Blood pressure string in "systolic/diastolic" format
 * @returns Parsed reading or error with reason
 *
 * @example
 * parseBloodPressure('120/80')  // { systolic: 120, diastolic: 80, isValid: true }
 * parseBloodPressure('150/')    // { isValid: false, reason: 'Missing diastolic value' }
 * parseBloodPressure('N/A')     // { isValid: false, reason: 'Non-numeric values' }
 */
export function parseBloodPressure(bp: string): BloodPressureResult {
  // Guard: Check for empty or whitespace-only strings
  if (!bp.trim()) {
    return { isValid: false, reason: 'Empty blood pressure value' };
  }

  // Guard: Must contain exactly one forward slash
  const parts = bp.split('/');
  if (parts.length !== 2) {
    return { isValid: false, reason: 'Invalid format (expected systolic/diastolic)' };
  }

  const [systolicStr, diastolicStr] = parts;

  // Guard: Both parts must be present
  if (!systolicStr.trim() || !diastolicStr.trim()) {
    const missing = !systolicStr.trim() ? 'systolic' : 'diastolic';
    return { isValid: false, reason: `Missing ${missing} value` };
  }

  // Parse numeric values
  const systolic = Number(systolicStr.trim());
  const diastolic = Number(diastolicStr.trim());

  // Guard: Both must be valid numbers
  if (Number.isNaN(systolic) || Number.isNaN(diastolic)) {
    return { isValid: false, reason: 'Non-numeric values' };
  }

  // Guard: Values must be physiologically plausible
  if (systolic <= 0 || diastolic <= 0) {
    return { isValid: false, reason: 'Values must be positive' };
  }

  return { systolic, diastolic, isValid: true };
}

/**
 * Determines the risk stage based on systolic pressure.
 * @param systolic - Systolic blood pressure value
 * @returns Risk score (1-4)
 */
function getSystolicStage(systolic: number): number {
  if (systolic >= BLOOD_PRESSURE.STAGE_2.systolic.min) {
    return BLOOD_PRESSURE.STAGE_2.score;
  }
  if (systolic >= BLOOD_PRESSURE.STAGE_1.systolic.min) {
    return BLOOD_PRESSURE.STAGE_1.score;
  }
  if (systolic >= BLOOD_PRESSURE.ELEVATED.systolic.min) {
    return BLOOD_PRESSURE.ELEVATED.score;
  }
  return BLOOD_PRESSURE.NORMAL.score;
}

/**
 * Determines the risk stage based on diastolic pressure.
 * @param diastolic - Diastolic blood pressure value
 * @returns Risk score (1-4)
 */
function getDiastolicStage(diastolic: number): number {
  if (diastolic >= BLOOD_PRESSURE.STAGE_2.diastolic.min) {
    return BLOOD_PRESSURE.STAGE_2.score;
  }
  if (diastolic >= BLOOD_PRESSURE.STAGE_1.diastolic.min) {
    return BLOOD_PRESSURE.STAGE_1.score;
  }
  // Diastolic < 80 is either Normal or Elevated (same score for diastolic)
  return BLOOD_PRESSURE.NORMAL.score;
}

/**
 * Calculates blood pressure risk score.
 *
 * When systolic and diastolic readings fall into different risk categories,
 * the HIGHER risk stage is used for scoring (per assessment requirements).
 *
 * @param bp - Blood pressure value (string, null, or undefined)
 * @returns Risk result with score and validity
 *
 * @example
 * calculateBloodPressureRisk('120/80')   // { score: 1, isValid: true }
 * calculateBloodPressureRisk('135/75')   // { score: 3, isValid: true } - Stage 1 from systolic
 * calculateBloodPressureRisk('125/85')   // { score: 3, isValid: true } - Stage 1 from diastolic
 * calculateBloodPressureRisk(null)       // { score: 0, isValid: false, reason: '...' }
 */
export function calculateBloodPressureRisk(
  bp: string | null | undefined
): RiskResult {
  // Guard: Handle null/undefined
  if (bp === null || bp === undefined) {
    return {
      score: INVALID_DATA_SCORE,
      isValid: false,
      reason: 'Missing blood pressure value',
    };
  }

  // Guard: Handle non-string types
  if (typeof bp !== 'string') {
    return {
      score: INVALID_DATA_SCORE,
      isValid: false,
      reason: 'Blood pressure must be a string',
    };
  }

  // Parse the blood pressure string
  const parsed = parseBloodPressure(bp);
  if (!parsed.isValid) {
    return {
      score: INVALID_DATA_SCORE,
      isValid: false,
      reason: parsed.reason,
    };
  }

  // Calculate risk using the HIGHER of systolic or diastolic stage
  const systolicStage = getSystolicStage(parsed.systolic);
  const diastolicStage = getDiastolicStage(parsed.diastolic);
  const score = Math.max(systolicStage, diastolicStage);

  return { score, isValid: true };
}

// ============================================================================
// TEMPERATURE CALCULATIONS
// ============================================================================

/**
 * Calculates temperature risk score.
 *
 * @param temp - Temperature value (number, string, null, or undefined)
 * @returns Risk result with score and validity
 *
 * @example
 * calculateTemperatureRisk(98.6)      // { score: 0, isValid: true }
 * calculateTemperatureRisk(100.5)     // { score: 1, isValid: true }
 * calculateTemperatureRisk(102.0)     // { score: 2, isValid: true }
 * calculateTemperatureRisk('invalid') // { score: 0, isValid: false, reason: '...' }
 */
export function calculateTemperatureRisk(
  temp: number | string | null | undefined
): RiskResult {
  // Guard: Handle null/undefined
  if (temp === null || temp === undefined) {
    return {
      score: INVALID_DATA_SCORE,
      isValid: false,
      reason: 'Missing temperature value',
    };
  }

  // Convert to number if string
  const tempValue = typeof temp === 'string' ? Number(temp) : temp;

  // Guard: Must be a valid number
  if (Number.isNaN(tempValue)) {
    return {
      score: INVALID_DATA_SCORE,
      isValid: false,
      reason: 'Non-numeric temperature value',
    };
  }

  // Guard: Must be physiologically plausible (basic sanity check)
  if (tempValue < 90 || tempValue > 115) {
    return {
      score: INVALID_DATA_SCORE,
      isValid: false,
      reason: 'Temperature outside plausible range (90-115°F)',
    };
  }

  // Calculate score based on thresholds
  if (tempValue >= TEMPERATURE.HIGH_FEVER.min) {
    return { score: TEMPERATURE.HIGH_FEVER.score, isValid: true };
  }
  if (tempValue >= TEMPERATURE.LOW_FEVER.min) {
    return { score: TEMPERATURE.LOW_FEVER.score, isValid: true };
  }
  return { score: TEMPERATURE.NORMAL.score, isValid: true };
}

/**
 * Checks if a temperature value indicates fever.
 *
 * @param temp - Temperature value
 * @returns True if temperature >= 99.6°F and is valid
 */
export function hasFever(temp: number | string | null | undefined): boolean {
  if (temp === null || temp === undefined) {
    return false;
  }

  const tempValue = typeof temp === 'string' ? Number(temp) : temp;

  if (Number.isNaN(tempValue)) {
    return false;
  }

  return tempValue >= FEVER_THRESHOLD;
}

// ============================================================================
// AGE CALCULATIONS
// ============================================================================

/**
 * Calculates age risk score.
 *
 * @param age - Age value (number, string, null, or undefined)
 * @returns Risk result with score and validity
 *
 * @example
 * calculateAgeRisk(35)       // { score: 1, isValid: true }
 * calculateAgeRisk(50)       // { score: 1, isValid: true }
 * calculateAgeRisk(70)       // { score: 2, isValid: true }
 * calculateAgeRisk('fifty')  // { score: 0, isValid: false, reason: '...' }
 */
export function calculateAgeRisk(
  age: number | string | null | undefined
): RiskResult {
  // Guard: Handle null/undefined
  if (age === null || age === undefined) {
    return {
      score: INVALID_DATA_SCORE,
      isValid: false,
      reason: 'Missing age value',
    };
  }

  // Convert to number if string
  const ageValue = typeof age === 'string' ? Number(age) : age;

  // Guard: Must be a valid number
  if (Number.isNaN(ageValue)) {
    return {
      score: INVALID_DATA_SCORE,
      isValid: false,
      reason: 'Non-numeric age value',
    };
  }

  // Guard: Must be a reasonable age
  if (ageValue < 0 || ageValue > 150) {
    return {
      score: INVALID_DATA_SCORE,
      isValid: false,
      reason: 'Age outside plausible range (0-150)',
    };
  }

  // Calculate score based on age brackets
  if (ageValue > AGE.MIDDLE.max) {
    return { score: AGE.OVER_65.score, isValid: true };
  }
  if (ageValue >= AGE.MIDDLE.min) {
    return { score: AGE.MIDDLE.score, isValid: true };
  }
  return { score: AGE.UNDER_40.score, isValid: true };
}

// ============================================================================
// COMPOSITE CALCULATIONS
// ============================================================================

/**
 * Calculates complete risk assessment for a single patient.
 *
 * @param patient - Patient data
 * @returns Complete risk score breakdown
 *
 * @example
 * const score = calculatePatientRisk({
 *   patient_id: 'DEMO001',
 *   blood_pressure: '140/90',
 *   temperature: 99.8,
 *   age: 70,
 *   ...
 * });
 * // {
 * //   patientId: 'DEMO001',
 * //   bpRisk: { score: 4, isValid: true },
 * //   tempRisk: { score: 1, isValid: true },
 * //   ageRisk: { score: 2, isValid: true },
 * //   totalScore: 7,
 * //   hasDataQualityIssue: false,
 * //   dataQualityIssues: []
 * // }
 */
export function calculatePatientRisk(patient: Patient): PatientRiskScore {
  const bpRisk = calculateBloodPressureRisk(patient.blood_pressure);
  const tempRisk = calculateTemperatureRisk(patient.temperature);
  const ageRisk = calculateAgeRisk(patient.age);

  // Collect data quality issues
  const dataQualityIssues: string[] = [];
  if (!bpRisk.isValid) {
    dataQualityIssues.push(`Blood pressure: ${bpRisk.reason}`);
  }
  if (!tempRisk.isValid) {
    dataQualityIssues.push(`Temperature: ${tempRisk.reason}`);
  }
  if (!ageRisk.isValid) {
    dataQualityIssues.push(`Age: ${ageRisk.reason}`);
  }

  // Total score is sum of all valid risk scores
  const totalScore = bpRisk.score + tempRisk.score + ageRisk.score;

  return {
    patientId: patient.patient_id,
    bpRisk,
    tempRisk,
    ageRisk,
    totalScore,
    hasDataQualityIssue: dataQualityIssues.length > 0,
    dataQualityIssues,
  };
}

/**
 * Categorizes patients into alert lists for assessment submission.
 *
 * @param patients - Array of patients to categorize
 * @returns Categorized patient ID lists
 *
 * @example
 * const categories = categorizePatients(patients);
 * // {
 * //   highRiskPatients: ['DEMO002', 'DEMO015', ...],
 * //   feverPatients: ['DEMO005', 'DEMO021', ...],
 * //   dataQualityIssues: ['DEMO004', 'DEMO007', ...]
 * // }
 */
export function categorizePatients(patients: Patient[]): CategorizedPatients {
  const highRiskPatients: string[] = [];
  const feverPatients: string[] = [];
  const dataQualityIssues: string[] = [];

  for (const patient of patients) {
    const riskScore = calculatePatientRisk(patient);

    // Check for high risk (total score >= 4)
    if (riskScore.totalScore >= HIGH_RISK_THRESHOLD) {
      highRiskPatients.push(patient.patient_id);
    }

    // Check for fever (temp >= 99.6°F) - independent of data quality
    if (hasFever(patient.temperature)) {
      feverPatients.push(patient.patient_id);
    }

    // Check for data quality issues
    if (riskScore.hasDataQualityIssue) {
      dataQualityIssues.push(patient.patient_id);
    }
  }

  return {
    highRiskPatients,
    feverPatients,
    dataQualityIssues,
  };
}

/**
 * Calculates risk scores for all patients.
 *
 * @param patients - Array of patients
 * @returns Array of patients with their risk scores
 */
export function calculateAllPatientRisks(
  patients: Patient[]
): PatientRiskScore[] {
  return patients.map(calculatePatientRisk);
}

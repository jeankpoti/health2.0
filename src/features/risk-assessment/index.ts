/**
 * @fileoverview Public API for the Risk Assessment feature.
 *
 * This barrel export defines what is accessible from outside the feature.
 * Import from '@/features/risk-assessment' instead of deep paths.
 *
 * @example
 * ```typescript
 * import {
 *   PatientTable,
 *   RiskSummaryCards,
 *   usePatientStore,
 *   calculatePatientRisk
 * } from '@/features/risk-assessment';
 * ```
 */

// Components
export { PatientTable } from './components/patient-table';
export { RiskSummaryCards } from './components/risk-summary-cards';
export { SubmissionPanel } from './components/submission-panel';
export { AlertLists } from './components/alert-lists';

// Store
export {
  usePatientStore,
  selectHighRiskPatients,
  selectFeverPatients,
  selectDataQualityIssues,
  selectStats,
  selectLoadingProgress,
} from './store/patient-store';

// Utils (for testing or external use)
export {
  calculateBloodPressureRisk,
  calculateTemperatureRisk,
  calculateAgeRisk,
  calculatePatientRisk,
  categorizePatients,
  parseBloodPressure,
  hasFever,
} from './utils/risk-calculator';

// Constants (for reference)
export {
  BLOOD_PRESSURE,
  TEMPERATURE,
  AGE,
  HIGH_RISK_THRESHOLD,
  FEVER_THRESHOLD,
} from './constants/thresholds';

// Types
export type {
  Patient,
  PatientRiskScore,
  PatientWithRisk,
  CategorizedPatients,
  AssessmentPayload,
  RiskResult,
} from './types';

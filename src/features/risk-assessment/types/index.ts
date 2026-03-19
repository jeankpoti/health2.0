/**
 * @fileoverview Domain types for the Risk Assessment feature.
 * These types model the core business entities and value objects.
 */

/**
 * Patient entity as received from the API.
 * Note: Fields may be missing or malformed due to data quality issues.
 */
export interface Patient {
  /** Unique patient identifier (e.g., "DEMO001") */
  patient_id: string;
  /** Patient full name in "Last, First" format */
  name: string;
  /** Patient age in years - may be missing or non-numeric */
  age: number | string | null | undefined;
  /** Gender code (e.g., "M", "F") */
  gender: string;
  /** Blood pressure reading in "systolic/diastolic" format - may be malformed */
  blood_pressure: string | null | undefined;
  /** Body temperature in Fahrenheit - may be missing or non-numeric */
  temperature: number | string | null | undefined;
  /** Date of visit in ISO format */
  visit_date: string;
  /** Primary diagnosis */
  diagnosis: string;
  /** Comma-separated list of medications */
  medications: string;
}

/**
 * Result of parsing a blood pressure string.
 */
export interface BloodPressureReading {
  /** Systolic pressure (top number) */
  systolic: number;
  /** Diastolic pressure (bottom number) */
  diastolic: number;
  /** Whether the parsing was successful */
  isValid: true;
}

/**
 * Failed blood pressure parsing result.
 */
export interface InvalidBloodPressure {
  isValid: false;
  /** Human-readable reason for the failure */
  reason: string;
}

/**
 * Union type for blood pressure parsing outcomes.
 */
export type BloodPressureResult = BloodPressureReading | InvalidBloodPressure;

/**
 * Individual risk calculation result.
 */
export interface RiskResult {
  /** Calculated risk score */
  score: number;
  /** Whether the input data was valid */
  isValid: boolean;
  /** Reason for invalidity (if applicable) */
  reason?: string;
}

/**
 * Complete risk assessment for a single patient.
 */
export interface PatientRiskScore {
  /** Patient identifier */
  patientId: string;
  /** Blood pressure risk score (0-4) */
  bpRisk: RiskResult;
  /** Temperature risk score (0-2) */
  tempRisk: RiskResult;
  /** Age risk score (0-2) */
  ageRisk: RiskResult;
  /** Sum of all valid risk scores */
  totalScore: number;
  /** Whether any data quality issues were found */
  hasDataQualityIssue: boolean;
  /** List of specific data quality issues */
  dataQualityIssues: string[];
}

/**
 * Categorized patient lists for assessment submission.
 */
export interface CategorizedPatients {
  /** Patient IDs with total risk score >= 4 */
  highRiskPatients: string[];
  /** Patient IDs with temperature >= 99.6°F */
  feverPatients: string[];
  /** Patient IDs with invalid/missing data */
  dataQualityIssues: string[];
}

/**
 * Payload for assessment submission endpoint.
 */
export interface AssessmentPayload {
  high_risk_patients: string[];
  fever_patients: string[];
  data_quality_issues: string[];
}

/**
 * Extended patient with calculated risk data for display.
 */
export interface PatientWithRisk extends Patient {
  riskScore: PatientRiskScore;
}

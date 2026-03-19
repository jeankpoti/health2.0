/**
 * @fileoverview Unit tests for the risk calculator functions.
 *
 * These tests verify the business logic for:
 * - Blood pressure parsing and risk scoring
 * - Temperature risk scoring
 * - Age risk scoring
 * - Patient categorization
 */

import { describe, it, expect } from 'vitest';
import {
  parseBloodPressure,
  calculateBloodPressureRisk,
  calculateTemperatureRisk,
  calculateAgeRisk,
  calculatePatientRisk,
  categorizePatients,
  hasFever,
} from '@/features/risk-assessment/utils/risk-calculator';
import type { Patient } from '@/features/risk-assessment/types';

// ============================================================================
// BLOOD PRESSURE PARSING TESTS
// ============================================================================

describe('parseBloodPressure', () => {
  it('should parse valid blood pressure strings', () => {
    const result = parseBloodPressure('120/80');
    expect(result).toEqual({ systolic: 120, diastolic: 80, isValid: true });
  });

  it('should handle whitespace in input', () => {
    const result = parseBloodPressure(' 120 / 80 ');
    expect(result).toEqual({ systolic: 120, diastolic: 80, isValid: true });
  });

  it('should reject empty strings', () => {
    const result = parseBloodPressure('');
    expect(result.isValid).toBe(false);
    expect(result).toHaveProperty('reason');
  });

  it('should reject missing systolic value', () => {
    const result = parseBloodPressure('/80');
    expect(result.isValid).toBe(false);
  });

  it('should reject missing diastolic value', () => {
    const result = parseBloodPressure('120/');
    expect(result.isValid).toBe(false);
  });

  it('should reject non-numeric values', () => {
    const result = parseBloodPressure('N/A');
    expect(result.isValid).toBe(false);
  });

  it('should reject INVALID text', () => {
    const result = parseBloodPressure('INVALID');
    expect(result.isValid).toBe(false);
  });

  it('should reject negative values', () => {
    const result = parseBloodPressure('-120/80');
    expect(result.isValid).toBe(false);
  });
});

// ============================================================================
// BLOOD PRESSURE RISK TESTS
// ============================================================================

describe('calculateBloodPressureRisk', () => {
  describe('Normal (score: 1)', () => {
    it('should return score 1 for normal BP (119/79)', () => {
      const result = calculateBloodPressureRisk('119/79');
      expect(result.score).toBe(1);
      expect(result.isValid).toBe(true);
    });

    it('should return score 1 for BP (110/70)', () => {
      const result = calculateBloodPressureRisk('110/70');
      expect(result.score).toBe(1);
    });
  });

  describe('Elevated (score: 2)', () => {
    it('should return score 2 for elevated BP (120/79)', () => {
      const result = calculateBloodPressureRisk('120/79');
      expect(result.score).toBe(2);
      expect(result.isValid).toBe(true);
    });

    it('should return score 2 for BP (129/75)', () => {
      const result = calculateBloodPressureRisk('129/75');
      expect(result.score).toBe(2);
    });
  });

  describe('Stage 1 Hypertension (score: 3)', () => {
    it('should return score 3 for Stage 1 systolic (130/79)', () => {
      const result = calculateBloodPressureRisk('130/79');
      expect(result.score).toBe(3);
    });

    it('should return score 3 for Stage 1 diastolic (119/80)', () => {
      const result = calculateBloodPressureRisk('119/80');
      expect(result.score).toBe(3);
    });

    it('should return score 3 for BP (135/85)', () => {
      const result = calculateBloodPressureRisk('135/85');
      expect(result.score).toBe(3);
    });
  });

  describe('Stage 2 Hypertension (score: 4)', () => {
    it('should return score 4 for Stage 2 systolic (140/79)', () => {
      const result = calculateBloodPressureRisk('140/79');
      expect(result.score).toBe(4);
    });

    it('should return score 4 for Stage 2 diastolic (119/90)', () => {
      const result = calculateBloodPressureRisk('119/90');
      expect(result.score).toBe(4);
    });

    it('should return score 4 for high BP (160/100)', () => {
      const result = calculateBloodPressureRisk('160/100');
      expect(result.score).toBe(4);
    });
  });

  describe('Use higher risk stage when systolic/diastolic differ', () => {
    it('should use higher stage when diastolic is higher risk', () => {
      // Systolic 125 = Elevated (score 2), Diastolic 92 = Stage 2 (score 4)
      const result = calculateBloodPressureRisk('125/92');
      expect(result.score).toBe(4); // Should use the higher score
    });

    it('should use higher stage when systolic is higher risk', () => {
      // Systolic 145 = Stage 2 (score 4), Diastolic 75 = Normal (score 1)
      const result = calculateBloodPressureRisk('145/75');
      expect(result.score).toBe(4);
    });
  });

  describe('Invalid data (score: 0)', () => {
    it('should return score 0 for null', () => {
      const result = calculateBloodPressureRisk(null);
      expect(result.score).toBe(0);
      expect(result.isValid).toBe(false);
    });

    it('should return score 0 for undefined', () => {
      const result = calculateBloodPressureRisk(undefined);
      expect(result.score).toBe(0);
      expect(result.isValid).toBe(false);
    });

    it('should return score 0 for malformed string', () => {
      const result = calculateBloodPressureRisk('150/');
      expect(result.score).toBe(0);
      expect(result.isValid).toBe(false);
    });
  });
});

// ============================================================================
// TEMPERATURE RISK TESTS
// ============================================================================

describe('calculateTemperatureRisk', () => {
  describe('Normal (score: 0)', () => {
    it('should return score 0 for normal temp (98.6)', () => {
      const result = calculateTemperatureRisk(98.6);
      expect(result.score).toBe(0);
      expect(result.isValid).toBe(true);
    });

    it('should return score 0 for temp at boundary (99.5)', () => {
      const result = calculateTemperatureRisk(99.5);
      expect(result.score).toBe(0);
    });
  });

  describe('Low Fever (score: 1)', () => {
    it('should return score 1 for low fever (99.6)', () => {
      const result = calculateTemperatureRisk(99.6);
      expect(result.score).toBe(1);
      expect(result.isValid).toBe(true);
    });

    it('should return score 1 for temp at boundary (100.9)', () => {
      const result = calculateTemperatureRisk(100.9);
      expect(result.score).toBe(1);
    });
  });

  describe('High Fever (score: 2)', () => {
    it('should return score 2 for high fever (101.0)', () => {
      const result = calculateTemperatureRisk(101.0);
      expect(result.score).toBe(2);
      expect(result.isValid).toBe(true);
    });

    it('should return score 2 for very high fever (103.5)', () => {
      const result = calculateTemperatureRisk(103.5);
      expect(result.score).toBe(2);
    });
  });

  describe('String conversion', () => {
    it('should handle numeric strings', () => {
      const result = calculateTemperatureRisk('99.8');
      expect(result.score).toBe(1);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Invalid data (score: 0)', () => {
    it('should return score 0 for null', () => {
      const result = calculateTemperatureRisk(null);
      expect(result.score).toBe(0);
      expect(result.isValid).toBe(false);
    });

    it('should return score 0 for undefined', () => {
      const result = calculateTemperatureRisk(undefined);
      expect(result.score).toBe(0);
      expect(result.isValid).toBe(false);
    });

    it('should return score 0 for non-numeric string', () => {
      const result = calculateTemperatureRisk('TEMP_ERROR');
      expect(result.score).toBe(0);
      expect(result.isValid).toBe(false);
    });
  });
});

// ============================================================================
// AGE RISK TESTS
// ============================================================================

describe('calculateAgeRisk', () => {
  describe('Under 40 (score: 1)', () => {
    it('should return score 1 for age 25', () => {
      const result = calculateAgeRisk(25);
      expect(result.score).toBe(1);
      expect(result.isValid).toBe(true);
    });

    it('should return score 1 for age 39', () => {
      const result = calculateAgeRisk(39);
      expect(result.score).toBe(1);
    });
  });

  describe('40-65 inclusive (score: 1)', () => {
    it('should return score 1 for age 40', () => {
      const result = calculateAgeRisk(40);
      expect(result.score).toBe(1);
      expect(result.isValid).toBe(true);
    });

    it('should return score 1 for age 65', () => {
      const result = calculateAgeRisk(65);
      expect(result.score).toBe(1);
    });

    it('should return score 1 for age 50', () => {
      const result = calculateAgeRisk(50);
      expect(result.score).toBe(1);
    });
  });

  describe('Over 65 (score: 2)', () => {
    it('should return score 2 for age 66', () => {
      const result = calculateAgeRisk(66);
      expect(result.score).toBe(2);
      expect(result.isValid).toBe(true);
    });

    it('should return score 2 for age 80', () => {
      const result = calculateAgeRisk(80);
      expect(result.score).toBe(2);
    });
  });

  describe('String conversion', () => {
    it('should handle numeric strings', () => {
      const result = calculateAgeRisk('45');
      expect(result.score).toBe(1);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Invalid data (score: 0)', () => {
    it('should return score 0 for null', () => {
      const result = calculateAgeRisk(null);
      expect(result.score).toBe(0);
      expect(result.isValid).toBe(false);
    });

    it('should return score 0 for undefined', () => {
      const result = calculateAgeRisk(undefined);
      expect(result.score).toBe(0);
      expect(result.isValid).toBe(false);
    });

    it('should return score 0 for non-numeric string', () => {
      const result = calculateAgeRisk('fifty-three');
      expect(result.score).toBe(0);
      expect(result.isValid).toBe(false);
    });

    it('should return score 0 for "unknown"', () => {
      const result = calculateAgeRisk('unknown');
      expect(result.score).toBe(0);
      expect(result.isValid).toBe(false);
    });
  });
});

// ============================================================================
// FEVER CHECK TESTS
// ============================================================================

describe('hasFever', () => {
  it('should return true for temp >= 99.6', () => {
    expect(hasFever(99.6)).toBe(true);
    expect(hasFever(100.5)).toBe(true);
    expect(hasFever(102.0)).toBe(true);
  });

  it('should return false for temp < 99.6', () => {
    expect(hasFever(99.5)).toBe(false);
    expect(hasFever(98.6)).toBe(false);
  });

  it('should return false for null/undefined', () => {
    expect(hasFever(null)).toBe(false);
    expect(hasFever(undefined)).toBe(false);
  });

  it('should handle string temperatures', () => {
    expect(hasFever('100.5')).toBe(true);
    expect(hasFever('98.6')).toBe(false);
  });

  it('should return false for invalid strings', () => {
    expect(hasFever('invalid')).toBe(false);
  });
});

// ============================================================================
// PATIENT RISK CALCULATION TESTS
// ============================================================================

describe('calculatePatientRisk', () => {
  const createPatient = (overrides: Partial<Patient> = {}): Patient => ({
    patient_id: 'TEST001',
    name: 'Test Patient',
    age: 45,
    gender: 'M',
    blood_pressure: '120/80',
    temperature: 98.6,
    visit_date: '2024-01-15',
    diagnosis: 'Test',
    medications: 'None',
    ...overrides,
  });

  it('should calculate total risk correctly', () => {
    // BP: 120/80 = score 3 (Diastolic 80 is Stage 1, which is higher than Elevated from systolic 120)
    // Temp: 98.6 = score 0 (Normal)
    // Age: 45 = score 1 (40-65)
    // Total: 4
    const patient = createPatient();
    const result = calculatePatientRisk(patient);
    expect(result.totalScore).toBe(4);
    expect(result.hasDataQualityIssue).toBe(false);
  });

  it('should identify high-risk patient (score >= 4)', () => {
    // BP: 140/90 = score 4 (Stage 2)
    // Temp: 99.8 = score 1 (Low Fever)
    // Age: 70 = score 2 (Over 65)
    // Total: 7
    const patient = createPatient({
      blood_pressure: '140/90',
      temperature: 99.8,
      age: 70,
    });
    const result = calculatePatientRisk(patient);
    expect(result.totalScore).toBe(7);
    expect(result.totalScore).toBeGreaterThanOrEqual(4);
  });

  it('should detect data quality issues', () => {
    const patient = createPatient({
      blood_pressure: 'INVALID',
      temperature: null,
      age: 'unknown',
    });
    const result = calculatePatientRisk(patient);
    expect(result.hasDataQualityIssue).toBe(true);
    expect(result.dataQualityIssues).toHaveLength(3);
  });
});

// ============================================================================
// PATIENT CATEGORIZATION TESTS
// ============================================================================

describe('categorizePatients', () => {
  const createPatient = (
    id: string,
    bp: string | null,
    temp: number | null,
    age: number | null
  ): Patient => ({
    patient_id: id,
    name: 'Test',
    age,
    gender: 'M',
    blood_pressure: bp,
    temperature: temp,
    visit_date: '2024-01-15',
    diagnosis: 'Test',
    medications: 'None',
  });

  it('should categorize high-risk patients correctly', () => {
    const patients = [
      createPatient('P001', '140/90', 99.0, 70), // Score: 4+0+2=6 (high risk)
      createPatient('P002', '110/70', 98.6, 35), // Score: 1+0+1=2 (not high risk)
    ];

    const result = categorizePatients(patients);
    expect(result.highRiskPatients).toContain('P001');
    expect(result.highRiskPatients).not.toContain('P002');
  });

  it('should categorize fever patients correctly', () => {
    const patients = [
      createPatient('P001', '120/80', 100.5, 45), // Has fever
      createPatient('P002', '120/80', 98.6, 45),  // No fever
    ];

    const result = categorizePatients(patients);
    expect(result.feverPatients).toContain('P001');
    expect(result.feverPatients).not.toContain('P002');
  });

  it('should categorize data quality issues correctly', () => {
    const patients = [
      createPatient('P001', 'INVALID', 98.6, 45), // Invalid BP
      createPatient('P002', '120/80', null, 45),  // Missing temp
      createPatient('P003', '120/80', 98.6, 45),  // Valid
    ];

    const result = categorizePatients(patients);
    expect(result.dataQualityIssues).toContain('P001');
    expect(result.dataQualityIssues).toContain('P002');
    expect(result.dataQualityIssues).not.toContain('P003');
  });

  it('should handle empty patient array', () => {
    const result = categorizePatients([]);
    expect(result.highRiskPatients).toHaveLength(0);
    expect(result.feverPatients).toHaveLength(0);
    expect(result.dataQualityIssues).toHaveLength(0);
  });
});

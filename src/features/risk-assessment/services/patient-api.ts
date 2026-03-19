/**
 * @fileoverview API service for patient data operations.
 *
 * This service handles all communication with the healthcare assessment API,
 * including pagination handling and data transformation.
 */

import { fetchWithRetry } from '@/lib/api-client';
import { API_PAGE_LIMIT } from '../constants/thresholds';
import type { Patient, AssessmentPayload } from '../types';
import type { PaginatedResponse, SubmissionResponse } from '@/types/api';

// ============================================================================
// TYPES
// ============================================================================

type PatientResponse = PaginatedResponse<Patient>;

interface FetchProgress {
  currentPage: number;
  totalPages: number;
  patientsLoaded: number;
  totalPatients: number;
}

type ProgressCallback = (progress: FetchProgress) => void;

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Fetches a single page of patients from the API.
 *
 * @param page - Page number (1-indexed)
 * @param limit - Number of patients per page
 * @returns Paginated patient response
 */
export async function fetchPatientPage(
  page: number = 1,
  limit: number = API_PAGE_LIMIT
): Promise<PatientResponse> {
  const response = await fetchWithRetry<PatientResponse>(
    `/api/patients?page=${page}&limit=${limit}`
  );

  return response;
}

/**
 * Fetches ALL patients by iterating through all pages.
 *
 * Handles pagination automatically and provides progress updates
 * through an optional callback.
 *
 * @param onProgress - Optional callback for progress updates
 * @returns Array of all patients
 *
 * @example
 * ```typescript
 * // Simple usage
 * const patients = await fetchAllPatients();
 *
 * // With progress tracking
 * const patients = await fetchAllPatients((progress) => {
 *   console.log(`Loaded ${progress.patientsLoaded}/${progress.totalPatients}`);
 * });
 * ```
 */
export async function fetchAllPatients(
  onProgress?: ProgressCallback
): Promise<Patient[]> {
  const allPatients: Patient[] = [];
  let currentPage = 1;
  let hasMore = true;

  // Fetch first page to get total count
  const firstPage = await fetchPatientPage(1, API_PAGE_LIMIT);
  allPatients.push(...normalizePatients(firstPage.data));

  const totalPages = firstPage.pagination.totalPages;
  const totalPatients = firstPage.pagination.total;

  // Report initial progress
  onProgress?.({
    currentPage: 1,
    totalPages,
    patientsLoaded: allPatients.length,
    totalPatients,
  });

  hasMore = firstPage.pagination.hasNext;
  currentPage = 2;

  // Fetch remaining pages
  while (hasMore && currentPage <= totalPages) {
    const page = await fetchPatientPage(currentPage, API_PAGE_LIMIT);
    allPatients.push(...normalizePatients(page.data));

    onProgress?.({
      currentPage,
      totalPages,
      patientsLoaded: allPatients.length,
      totalPatients,
    });

    hasMore = page.pagination.hasNext;
    currentPage++;
  }

  return allPatients;
}

/**
 * Normalizes patient data to handle API inconsistencies.
 *
 * The API may return data in different formats or with missing fields.
 * This function ensures consistent patient objects.
 *
 * @param patients - Raw patient data from API
 * @returns Normalized patient array
 */
function normalizePatients(patients: Patient[]): Patient[] {
  return patients.map((patient) => ({
    patient_id: patient.patient_id ?? '',
    name: patient.name ?? 'Unknown',
    age: patient.age,
    gender: patient.gender ?? 'Unknown',
    blood_pressure: patient.blood_pressure,
    temperature: patient.temperature,
    visit_date: patient.visit_date ?? '',
    diagnosis: patient.diagnosis ?? '',
    medications: patient.medications ?? '',
  }));
}

/**
 * Submits assessment results to the API.
 *
 * @param payload - Categorized patient lists
 * @returns Submission response with score and feedback
 *
 * @example
 * ```typescript
 * const result = await submitAssessment({
 *   high_risk_patients: ['DEMO002', 'DEMO015'],
 *   fever_patients: ['DEMO005'],
 *   data_quality_issues: ['DEMO004']
 * });
 *
 * console.log(`Score: ${result.results.score}%`);
 * ```
 */
export async function submitAssessment(
  payload: AssessmentPayload
): Promise<SubmissionResponse> {
  const response = await fetchWithRetry<SubmissionResponse>(
    '/api/submit-assessment',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  return response;
}

/**
 * @fileoverview Zustand store for patient data and risk assessment state.
 *
 * This store manages:
 * - Patient data fetching and caching
 * - Risk score calculations
 * - Assessment submission state
 * - Loading and error states
 *
 * @example
 * ```tsx
 * // In a component
 * const patients = usePatientStore((state) => state.patients);
 * const fetchPatients = usePatientStore((state) => state.fetchPatients);
 *
 * useEffect(() => {
 *   fetchPatients();
 * }, [fetchPatients]);
 * ```
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { fetchAllPatients, submitAssessment } from '../services/patient-api';
import { calculatePatientRisk, categorizePatients } from '../utils/risk-calculator';
import type { Patient, PatientWithRisk, CategorizedPatients, AssessmentPayload } from '../types';
import type { SubmissionResponse } from '@/types/api';

// ============================================================================
// TYPES
// ============================================================================

interface FetchProgress {
  current: number;
  total: number;
}

interface PatientState {
  // Patient Data
  patients: PatientWithRisk[];
  categories: CategorizedPatients | null;
  isLoading: boolean;
  error: string | null;
  fetchProgress: FetchProgress | null;
  lastFetchedAt: Date | null;

  // Submission State
  submission: SubmissionResponse | null;
  isSubmitting: boolean;
  submissionError: string | null;
}

interface PatientActions {
  // Actions
  fetchPatients: () => Promise<void>;
  submitAssessment: () => Promise<void>;
  reset: () => void;
  clearSubmission: () => void;
}

type PatientStore = PatientState & PatientActions;

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: PatientState = {
  patients: [],
  categories: null,
  isLoading: false,
  error: null,
  fetchProgress: null,
  lastFetchedAt: null,
  submission: null,
  isSubmitting: false,
  submissionError: null,
};

// ============================================================================
// STORE
// ============================================================================

/**
 * Zustand store for patient risk assessment.
 *
 * Uses the devtools middleware for debugging in development.
 */
export const usePatientStore = create<PatientStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      /**
       * Fetches all patients from the API and calculates risk scores.
       *
       * Handles pagination automatically and updates progress state.
       * Results are cached in the store.
       */
      fetchPatients: async () => {
        // Prevent concurrent fetches
        if (get().isLoading) {
          return;
        }

        set({
          isLoading: true,
          error: null,
          fetchProgress: { current: 0, total: 0 },
        });

        try {
          const rawPatients = await fetchAllPatients((progress) => {
            set({
              fetchProgress: {
                current: progress.patientsLoaded,
                total: progress.totalPatients,
              },
            });
          });

          // Calculate risk scores for all patients
          const patientsWithRisk: PatientWithRisk[] = rawPatients.map((patient) => ({
            ...patient,
            riskScore: calculatePatientRisk(patient),
          }));

          // Categorize patients for submission
          const categories = categorizePatients(rawPatients);

          set({
            patients: patientsWithRisk,
            categories,
            isLoading: false,
            fetchProgress: null,
            lastFetchedAt: new Date(),
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to fetch patients';

          set({
            error: errorMessage,
            isLoading: false,
            fetchProgress: null,
          });
        }
      },

      /**
       * Submits the assessment results to the API.
       *
       * Uses the categorized patient lists from the current state.
       */
      submitAssessment: async () => {
        const { categories, isSubmitting } = get();

        // Prevent concurrent submissions
        if (isSubmitting) {
          return;
        }

        // Ensure we have data to submit
        if (!categories) {
          set({ submissionError: 'No patient data loaded. Please fetch patients first.' });
          return;
        }

        set({
          isSubmitting: true,
          submissionError: null,
        });

        try {
          const payload: AssessmentPayload = {
            high_risk_patients: categories.highRiskPatients,
            fever_patients: categories.feverPatients,
            data_quality_issues: categories.dataQualityIssues,
          };

          const response = await submitAssessment(payload);

          set({
            submission: response,
            isSubmitting: false,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to submit assessment';

          set({
            submissionError: errorMessage,
            isSubmitting: false,
          });
        }
      },

      /**
       * Resets the entire store to initial state.
       */
      reset: () => {
        set(initialState);
      },

      /**
       * Clears only the submission state (for retrying).
       */
      clearSubmission: () => {
        set({
          submission: null,
          submissionError: null,
        });
      },
    }),
    {
      name: 'patient-store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// ============================================================================
// SELECTORS
// ============================================================================

/**
 * Selector for high-risk patient IDs.
 */
export const selectHighRiskPatients = (state: PatientStore): string[] =>
  state.categories?.highRiskPatients ?? [];

/**
 * Selector for fever patient IDs.
 */
export const selectFeverPatients = (state: PatientStore): string[] =>
  state.categories?.feverPatients ?? [];

/**
 * Selector for data quality issue patient IDs.
 */
export const selectDataQualityIssues = (state: PatientStore): string[] =>
  state.categories?.dataQualityIssues ?? [];

/**
 * Selector for summary statistics.
 */
export const selectStats = (state: PatientStore) => ({
  totalPatients: state.patients.length,
  highRiskCount: state.categories?.highRiskPatients.length ?? 0,
  feverCount: state.categories?.feverPatients.length ?? 0,
  dataQualityCount: state.categories?.dataQualityIssues.length ?? 0,
  isLoading: state.isLoading,
});

/**
 * Selector for loading progress as percentage.
 */
export const selectLoadingProgress = (state: PatientStore): number => {
  if (!state.fetchProgress || state.fetchProgress.total === 0) {
    return 0;
  }
  return Math.round((state.fetchProgress.current / state.fetchProgress.total) * 100);
};

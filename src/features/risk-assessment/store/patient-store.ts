/**
 * @fileoverview Zustand store for patient data and risk assessment state.
 *
 * This store manages:
 * - Patient data fetching with pagination
 * - Risk score calculations
 * - Assessment submission state
 * - Loading and error states
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { fetchPatientPage, fetchAllPatients, submitAssessment } from '../services/patient-api';
import { calculatePatientRisk, categorizePatients } from '../utils/risk-calculator';
import { API_PAGE_LIMIT } from '../constants/thresholds';
import type { Patient, PatientWithRisk, CategorizedPatients, AssessmentPayload } from '../types';
import type { SubmissionResponse } from '@/types/api';

// ============================================================================
// TYPES
// ============================================================================

interface PatientState {
  // Current page patients (for display)
  patients: PatientWithRisk[];

  // All loaded patients (for submission)
  allPatients: PatientWithRisk[];
  allPatientsLoaded: boolean;

  // Pagination
  currentPage: number;
  totalPages: number;
  totalPatients: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;

  // Categories (from allPatients when loaded, otherwise current page)
  categories: CategorizedPatients | null;

  // Loading states
  isLoading: boolean;
  isLoadingAll: boolean;
  error: string | null;

  // Submission State
  submission: SubmissionResponse | null;
  isSubmitting: boolean;
  submissionError: string | null;
}

interface PatientActions {
  fetchPage: (page: number) => Promise<void>;
  nextPage: () => Promise<void>;
  prevPage: () => Promise<void>;
  loadAllForSubmission: () => Promise<void>;
  submitAssessment: () => Promise<void>;
  reset: () => void;
}

type PatientStore = PatientState & PatientActions;

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: PatientState = {
  patients: [],
  allPatients: [],
  allPatientsLoaded: false,
  currentPage: 1,
  totalPages: 0,
  totalPatients: 0,
  pageSize: API_PAGE_LIMIT,
  hasNext: false,
  hasPrevious: false,
  categories: null,
  isLoading: false,
  isLoadingAll: false,
  error: null,
  submission: null,
  isSubmitting: false,
  submissionError: null,
};

// ============================================================================
// STORE
// ============================================================================

export const usePatientStore = create<PatientStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      /**
       * Fetches a specific page of patients.
       */
      fetchPage: async (page: number) => {
        if (get().isLoading) return;

        set({ isLoading: true, error: null });

        try {
          const response = await fetchPatientPage(page, API_PAGE_LIMIT);

          const patientsWithRisk: PatientWithRisk[] = response.data.map((patient) => ({
            ...patient,
            riskScore: calculatePatientRisk(patient),
          }));

          // Calculate categories for current page
          const categories = categorizePatients(response.data);

          set({
            patients: patientsWithRisk,
            currentPage: response.pagination.page,
            totalPages: response.pagination.totalPages,
            totalPatients: response.pagination.total,
            hasNext: response.pagination.hasNext,
            hasPrevious: response.pagination.hasPrevious,
            categories,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch patients',
            isLoading: false,
          });
        }
      },

      /**
       * Navigate to next page.
       */
      nextPage: async () => {
        const { currentPage, hasNext } = get();
        if (hasNext) {
          await get().fetchPage(currentPage + 1);
        }
      },

      /**
       * Navigate to previous page.
       */
      prevPage: async () => {
        const { currentPage, hasPrevious } = get();
        if (hasPrevious) {
          await get().fetchPage(currentPage - 1);
        }
      },

      /**
       * Load all patients for submission.
       */
      loadAllForSubmission: async () => {
        if (get().isLoadingAll || get().allPatientsLoaded) return;

        set({ isLoadingAll: true, error: null });

        try {
          const rawPatients = await fetchAllPatients();

          const allPatientsWithRisk: PatientWithRisk[] = rawPatients.map((patient) => ({
            ...patient,
            riskScore: calculatePatientRisk(patient),
          }));

          const categories = categorizePatients(rawPatients);

          set({
            allPatients: allPatientsWithRisk,
            allPatientsLoaded: true,
            categories,
            isLoadingAll: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to load all patients',
            isLoadingAll: false,
          });
        }
      },

      /**
       * Submits the assessment results to the API.
       */
      submitAssessment: async () => {
        const { categories, isSubmitting, allPatientsLoaded } = get();

        if (isSubmitting) return;

        if (!allPatientsLoaded) {
          set({ submissionError: 'Please load all patients first before submitting.' });
          return;
        }

        if (!categories) {
          set({ submissionError: 'No patient data available.' });
          return;
        }

        set({ isSubmitting: true, submissionError: null });

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
          set({
            submissionError: error instanceof Error ? error.message : 'Failed to submit',
            isSubmitting: false,
          });
        }
      },

      /**
       * Resets the store to initial state.
       */
      reset: () => set(initialState),
    }),
    { name: 'patient-store', enabled: process.env.NODE_ENV === 'development' }
  )
);

// ============================================================================
// HOOKS WITH useShallow (prevents infinite re-renders)
// ============================================================================

const EMPTY_ARRAY: string[] = [];

export const useHighRiskPatients = () => {
  return usePatientStore(
    useShallow((state) => state.categories?.highRiskPatients ?? EMPTY_ARRAY)
  );
};

export const useFeverPatients = () => {
  return usePatientStore(
    useShallow((state) => state.categories?.feverPatients ?? EMPTY_ARRAY)
  );
};

export const useDataQualityIssues = () => {
  return usePatientStore(
    useShallow((state) => state.categories?.dataQualityIssues ?? EMPTY_ARRAY)
  );
};

export const usePatientStats = () => {
  return usePatientStore(
    useShallow((state) => ({
      totalPatients: state.totalPatients,
      highRiskCount: state.categories?.highRiskPatients.length ?? 0,
      feverCount: state.categories?.feverPatients.length ?? 0,
      dataQualityCount: state.categories?.dataQualityIssues.length ?? 0,
      isLoading: state.isLoading,
      currentPage: state.currentPage,
      totalPages: state.totalPages,
    }))
  );
};

export const usePagination = () => {
  return usePatientStore(
    useShallow((state) => ({
      currentPage: state.currentPage,
      totalPages: state.totalPages,
      hasNext: state.hasNext,
      hasPrevious: state.hasPrevious,
      isLoading: state.isLoading,
    }))
  );
};

export const selectLoadingProgress = (state: PatientStore): number => {
  if (state.totalPages === 0) return 0;
  return Math.round((state.currentPage / state.totalPages) * 100);
};

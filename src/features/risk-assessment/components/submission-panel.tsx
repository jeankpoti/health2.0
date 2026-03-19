/**
 * @fileoverview Assessment submission panel with results display.
 *
 * Features:
 * - Fetch patients button
 * - Submit assessment button
 * - Loading progress indicator
 * - Detailed results display with feedback
 */

'use client';

import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  usePatientStore,
  selectLoadingProgress,
  usePatientStats,
} from '../store/patient-store';

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

/**
 * Progress bar component.
 */
function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="w-full bg-secondary rounded-full h-2.5">
      <div
        className="bg-primary h-2.5 rounded-full transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

/**
 * Score breakdown display.
 */
function ScoreBreakdown({
  breakdown,
}: {
  breakdown: {
    high_risk: { score: number; max: number; correct: number; submitted: number; matches: number };
    fever: { score: number; max: number; correct: number; submitted: number; matches: number };
    data_quality: { score: number; max: number; correct: number; submitted: number; matches: number };
  };
}) {
  const categories = [
    { key: 'high_risk', label: 'High Risk', data: breakdown.high_risk },
    { key: 'fever', label: 'Fever', data: breakdown.fever },
    { key: 'data_quality', label: 'Data Quality', data: breakdown.data_quality },
  ] as const;

  return (
    <div className="space-y-3">
      {categories.map(({ key, label, data }) => (
        <div key={key} className="flex items-center justify-between">
          <span className="text-sm font-medium">{label}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {data.matches}/{data.correct} correct
            </span>
            <Badge variant={data.score === data.max ? 'default' : 'secondary'}>
              {data.score}/{data.max}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Feedback list display.
 */
function FeedbackList({
  feedback,
}: {
  feedback: { strengths: string[]; issues: string[] };
}) {
  return (
    <div className="space-y-4">
      {feedback.strengths.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-green-700 mb-2">Strengths</h4>
          <ul className="space-y-1">
            {feedback.strengths.map((strength, i) => (
              <li key={i} className="text-sm text-green-600">
                {strength}
              </li>
            ))}
          </ul>
        </div>
      )}
      {feedback.issues.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-amber-700 mb-2">Areas for Improvement</h4>
          <ul className="space-y-1">
            {feedback.issues.map((issue, i) => (
              <li key={i} className="text-sm text-amber-600">
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Submission panel component.
 *
 * Provides controls for fetching patients and submitting assessment,
 * along with detailed results display.
 *
 * @example
 * ```tsx
 * <SubmissionPanel />
 * ```
 */
export function SubmissionPanel() {
  const fetchPatients = usePatientStore((state) => state.fetchPatients);
  const submitAssessment = usePatientStore((state) => state.submitAssessment);
  const isLoading = usePatientStore((state) => state.isLoading);
  const isSubmitting = usePatientStore((state) => state.isSubmitting);
  const error = usePatientStore((state) => state.error);
  const submissionError = usePatientStore((state) => state.submissionError);
  const submission = usePatientStore((state) => state.submission);
  const loadingProgress = usePatientStore(selectLoadingProgress);
  const stats = usePatientStats();

  // Auto-fetch patients on mount (only once)
  const hasFetchedRef = useRef(false);
  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchPatients();
    }
  }, [fetchPatients]);

  const hasPatients = stats.totalPatients > 0;

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button
              onClick={fetchPatients}
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? 'Loading...' : 'Refresh Patients'}
            </Button>
            <Button
              onClick={submitAssessment}
              disabled={isSubmitting || !hasPatients}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
            </Button>
          </div>

          {/* Loading Progress */}
          {isLoading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Loading patients...</span>
                <span>{loadingProgress}%</span>
              </div>
              <ProgressBar progress={loadingProgress} />
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error Loading Patients</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {submissionError && (
            <Alert variant="destructive">
              <AlertTitle>Submission Error</AlertTitle>
              <AlertDescription>{submissionError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Submission Results */}
      {submission && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Assessment Results</CardTitle>
              <Badge
                variant={submission.results.status === 'PASS' ? 'default' : 'destructive'}
                className="text-lg px-3 py-1"
              >
                {submission.results.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overall Score */}
            <div className="text-center py-4 bg-secondary/50 rounded-lg">
              <div className="text-5xl font-bold">{submission.results.percentage}%</div>
              <div className="text-sm text-muted-foreground mt-1">
                Score: {submission.results.score.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Attempt {submission.results.attempt_number} of 3
                {submission.results.remaining_attempts > 0 && (
                  <span> ({submission.results.remaining_attempts} remaining)</span>
                )}
              </div>
            </div>

            {/* Score Breakdown */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Score Breakdown</h3>
              <ScoreBreakdown breakdown={submission.results.breakdown} />
            </div>

            {/* Feedback */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Feedback</h3>
              <FeedbackList feedback={submission.results.feedback} />
            </div>

            {/* Personal Best Indicator */}
            {submission.results.is_personal_best && (
              <Alert>
                <AlertTitle>🎉 Personal Best!</AlertTitle>
                <AlertDescription>
                  This is your highest score so far.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

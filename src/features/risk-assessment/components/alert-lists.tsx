/**
 * @fileoverview Categorized patient alert lists.
 *
 * Displays expandable lists of patients grouped by:
 * - High risk (score >= 4)
 * - Fever (temp >= 99.6°F)
 * - Data quality issues
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  usePatientStore,
  useHighRiskPatients,
  useFeverPatients,
  useDataQualityIssues,
} from '../store/patient-store';

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

interface PatientListProps {
  title: string;
  description: string;
  patients: string[];
  variant: 'danger' | 'warning' | 'default';
  isLoading: boolean;
}

/**
 * Individual patient list card.
 */
function PatientListCard({
  title,
  description,
  patients,
  variant,
  isLoading,
}: PatientListProps) {
  const badgeVariant = {
    danger: 'destructive' as const,
    warning: 'secondary' as const,
    default: 'outline' as const,
  };

  const borderColor = {
    danger: 'border-l-red-500',
    warning: 'border-l-amber-500',
    default: 'border-l-slate-500',
  };

  if (isLoading) {
    return (
      <Card className={`border-l-4 ${borderColor[variant]}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-8" />
          </div>
          <Skeleton className="h-3 w-48" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-l-4 ${borderColor[variant]}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <Badge variant={badgeVariant[variant]}>{patients.length}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        {patients.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            No patients in this category
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {patients.map((patientId) => (
              <Badge key={patientId} variant="outline" className="font-mono">
                {patientId}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Alert lists component.
 *
 * Displays three categorized lists of patients for assessment submission.
 *
 * @example
 * ```tsx
 * <AlertLists />
 * ```
 */
export function AlertLists() {
  const highRiskPatients = useHighRiskPatients();
  const feverPatients = useFeverPatients();
  const dataQualityIssues = useDataQualityIssues();
  const isLoading = usePatientStore((state) => state.isLoading);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <PatientListCard
        title="High Risk Patients"
        description="Total risk score ≥ 4"
        patients={highRiskPatients}
        variant="danger"
        isLoading={isLoading}
      />
      <PatientListCard
        title="Fever Patients"
        description="Temperature ≥ 99.6°F"
        patients={feverPatients}
        variant="warning"
        isLoading={isLoading}
      />
      <PatientListCard
        title="Data Quality Issues"
        description="Missing or invalid data"
        patients={dataQualityIssues}
        variant="default"
        isLoading={isLoading}
      />
    </div>
  );
}

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
  index?: number;
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
  index = 0,
}: PatientListProps) {
  const badgeVariant = {
    danger: 'destructive' as const,
    warning: 'secondary' as const,
    default: 'outline' as const,
  };

  const borderColor = {
    danger: 'border-l-red-500',
    warning: 'border-l-amber-500',
    default: 'border-l-slate-500 dark:border-l-slate-400',
  };

  const baseClasses = `
    border-l-4 ${borderColor[variant]}
    transition-all duration-300 ease-out
    hover:shadow-lg hover:-translate-y-1
    animate-fade-in-up
  `;

  if (isLoading) {
    return (
      <Card
        className={baseClasses}
        style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
      >
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
    <Card
      className={baseClasses}
      style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <Badge
            variant={badgeVariant[variant]}
            className={variant === 'danger' && patients.length > 0 ? 'animate-pulse' : ''}
          >
            {patients.length}
          </Badge>
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
              <Badge
                key={patientId}
                variant="outline"
                className="font-mono transition-transform hover:scale-105"
              >
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
        index={0}
      />
      <PatientListCard
        title="Fever Patients"
        description="Temperature ≥ 99.6°F"
        patients={feverPatients}
        variant="warning"
        isLoading={isLoading}
        index={1}
      />
      <PatientListCard
        title="Data Quality Issues"
        description="Missing or invalid data"
        patients={dataQualityIssues}
        variant="default"
        isLoading={isLoading}
        index={2}
      />
    </div>
  );
}

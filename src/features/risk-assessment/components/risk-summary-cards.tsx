/**
 * @fileoverview Summary statistics cards for the risk assessment dashboard.
 *
 * Displays key metrics:
 * - Total patients loaded
 * - High-risk patient count
 * - Fever patient count
 * - Data quality issues count
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePatientStore, selectStats } from '../store/patient-store';

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

interface StatCardProps {
  title: string;
  value: number;
  description: string;
  variant?: 'default' | 'warning' | 'danger' | 'info';
  isLoading?: boolean;
}

/**
 * Individual statistic card.
 */
function StatCard({ title, value, description, variant = 'default', isLoading }: StatCardProps) {
  const variantStyles = {
    default: 'border-l-4 border-l-slate-500',
    warning: 'border-l-4 border-l-amber-500',
    danger: 'border-l-4 border-l-red-500',
    info: 'border-l-4 border-l-blue-500',
  };

  if (isLoading) {
    return (
      <Card className={variantStyles[variant]}>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16 mb-1" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={variantStyles[variant]}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Risk summary cards component.
 *
 * Displays a grid of statistic cards showing patient risk metrics.
 *
 * @example
 * ```tsx
 * <RiskSummaryCards />
 * ```
 */
export function RiskSummaryCards() {
  const stats = usePatientStore(selectStats);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Patients"
        value={stats.totalPatients}
        description="Patients loaded from API"
        variant="info"
        isLoading={stats.isLoading}
      />
      <StatCard
        title="High Risk"
        value={stats.highRiskCount}
        description="Risk score ≥ 4"
        variant="danger"
        isLoading={stats.isLoading}
      />
      <StatCard
        title="Fever Patients"
        value={stats.feverCount}
        description="Temperature ≥ 99.6°F"
        variant="warning"
        isLoading={stats.isLoading}
      />
      <StatCard
        title="Data Quality Issues"
        value={stats.dataQualityCount}
        description="Missing or invalid data"
        variant="default"
        isLoading={stats.isLoading}
      />
    </div>
  );
}

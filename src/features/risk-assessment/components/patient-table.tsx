/**
 * @fileoverview Patient data table with risk score display.
 *
 * Features:
 * - Sortable columns
 * - Risk score badges
 * - Data quality issue indicators
 * - Responsive design
 */

'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usePatientStore } from '../store/patient-store';
import { HIGH_RISK_THRESHOLD, FEVER_THRESHOLD } from '../constants/thresholds';
import type { PatientWithRisk } from '../types';

// ============================================================================
// TYPES
// ============================================================================

type SortField = 'patient_id' | 'name' | 'age' | 'totalScore' | 'temperature';
type SortDirection = 'asc' | 'desc';

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

/**
 * Badge component for risk score display.
 */
function RiskBadge({ score }: { score: number }) {
  if (score >= HIGH_RISK_THRESHOLD) {
    return <Badge variant="destructive">High Risk ({score})</Badge>;
  }
  if (score >= 3) {
    return <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100">Moderate ({score})</Badge>;
  }
  return <Badge variant="outline">Low ({score})</Badge>;
}

/**
 * Badge for temperature with fever indication.
 */
function TemperatureBadge({ temp }: { temp: number | string | null | undefined }) {
  if (temp === null || temp === undefined) {
    return <span className="text-muted-foreground">N/A</span>;
  }

  const tempValue = typeof temp === 'string' ? parseFloat(temp) : temp;

  if (isNaN(tempValue)) {
    return <span className="text-muted-foreground">Invalid</span>;
  }

  if (tempValue >= FEVER_THRESHOLD) {
    return (
      <span className="text-red-600 font-medium">
        {tempValue.toFixed(1)}°F 🌡️
      </span>
    );
  }

  return <span>{tempValue.toFixed(1)}°F</span>;
}

/**
 * Data quality indicator.
 */
function DataQualityIndicator({ issues }: { issues: string[] }) {
  if (issues.length === 0) {
    return <span className="text-green-600">✓</span>;
  }

  return (
    <span className="text-amber-600 cursor-help" title={issues.join('\n')}>
      ⚠️ {issues.length}
    </span>
  );
}

/**
 * Sortable column header.
 */
function SortableHeader({
  label,
  field,
  currentField,
  direction,
  onSort,
}: {
  label: string;
  field: SortField;
  currentField: SortField;
  direction: SortDirection;
  onSort: (field: SortField) => void;
}) {
  const isActive = currentField === field;

  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {label}
      {isActive && (
        <span className="text-xs">{direction === 'asc' ? '↑' : '↓'}</span>
      )}
    </button>
  );
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function TableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Patient ID</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Age</TableHead>
          <TableHead>Blood Pressure</TableHead>
          <TableHead>Temperature</TableHead>
          <TableHead>Risk Score</TableHead>
          <TableHead>Data Quality</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 10 }).map((_, i) => (
          <TableRow key={i}>
            {Array.from({ length: 7 }).map((_, j) => (
              <TableCell key={j}>
                <Skeleton className="h-4 w-full" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Patient data table component.
 *
 * Displays all patients with their risk scores and data quality indicators.
 * Supports sorting by various columns.
 *
 * @example
 * ```tsx
 * <PatientTable />
 * ```
 */
export function PatientTable() {
  const patients = usePatientStore((state) => state.patients);
  const isLoading = usePatientStore((state) => state.isLoading);
  const error = usePatientStore((state) => state.error);

  const [sortField, setSortField] = useState<SortField>('patient_id');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Sort patients
  const sortedPatients = useMemo(() => {
    return [...patients].sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortField) {
        case 'patient_id':
          aValue = a.patient_id;
          bValue = b.patient_id;
          break;
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'age':
          aValue = typeof a.age === 'number' ? a.age : 0;
          bValue = typeof b.age === 'number' ? b.age : 0;
          break;
        case 'totalScore':
          aValue = a.riskScore.totalScore;
          bValue = b.riskScore.totalScore;
          break;
        case 'temperature':
          aValue = typeof a.temperature === 'number' ? a.temperature : 0;
          bValue = typeof b.temperature === 'number' ? b.temperature : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [patients, sortField, sortDirection]);

  // Handle sort toggle
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Loading state
  if (isLoading) {
    return <TableSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <p>Error loading patients: {error}</p>
      </div>
    );
  }

  // Empty state
  if (patients.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No patients loaded. Click &quot;Fetch Patients&quot; to load data.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <SortableHeader
                label="Patient ID"
                field="patient_id"
                currentField={sortField}
                direction={sortDirection}
                onSort={handleSort}
              />
            </TableHead>
            <TableHead>
              <SortableHeader
                label="Name"
                field="name"
                currentField={sortField}
                direction={sortDirection}
                onSort={handleSort}
              />
            </TableHead>
            <TableHead>
              <SortableHeader
                label="Age"
                field="age"
                currentField={sortField}
                direction={sortDirection}
                onSort={handleSort}
              />
            </TableHead>
            <TableHead>Blood Pressure</TableHead>
            <TableHead>
              <SortableHeader
                label="Temperature"
                field="temperature"
                currentField={sortField}
                direction={sortDirection}
                onSort={handleSort}
              />
            </TableHead>
            <TableHead>
              <SortableHeader
                label="Risk Score"
                field="totalScore"
                currentField={sortField}
                direction={sortDirection}
                onSort={handleSort}
              />
            </TableHead>
            <TableHead>Data Quality</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedPatients.map((patient) => (
            <TableRow key={patient.patient_id}>
              <TableCell className="font-mono">{patient.patient_id}</TableCell>
              <TableCell>{patient.name}</TableCell>
              <TableCell>
                {patient.age !== null && patient.age !== undefined
                  ? patient.age
                  : 'N/A'}
              </TableCell>
              <TableCell>{patient.blood_pressure ?? 'N/A'}</TableCell>
              <TableCell>
                <TemperatureBadge temp={patient.temperature} />
              </TableCell>
              <TableCell>
                <RiskBadge score={patient.riskScore.totalScore} />
              </TableCell>
              <TableCell>
                <DataQualityIndicator issues={patient.riskScore.dataQualityIssues} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

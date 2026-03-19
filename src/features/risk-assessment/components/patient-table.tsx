/**
 * @fileoverview Patient data table with pagination and risk score display.
 */

'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
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
import { Button } from '@/components/ui/button';
import { usePatientStore, usePagination } from '../store/patient-store';
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

function RiskBadge({ score }: { score: number }) {
  if (score >= HIGH_RISK_THRESHOLD) {
    return <Badge variant="destructive">High Risk ({score})</Badge>;
  }
  if (score >= 3) {
    return <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100">Moderate ({score})</Badge>;
  }
  return <Badge variant="outline">Low ({score})</Badge>;
}

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
        {tempValue.toFixed(1)}°F
      </span>
    );
  }

  return <span>{tempValue.toFixed(1)}°F</span>;
}

function DataQualityIndicator({ issues }: { issues: string[] }) {
  if (issues.length === 0) {
    return <span className="text-green-600">Valid</span>;
  }

  return (
    <span className="text-amber-600 cursor-help" title={issues.join('\n')}>
      {issues.length} issue(s)
    </span>
  );
}

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
// PAGINATION CONTROLS
// ============================================================================

function PaginationControls() {
  const pagination = usePagination();
  const nextPage = usePatientStore((state) => state.nextPage);
  const prevPage = usePatientStore((state) => state.prevPage);

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="text-sm text-muted-foreground tabular-nums">
        Page {pagination.currentPage} of {pagination.totalPages}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={prevPage}
          disabled={!pagination.hasPrevious || pagination.isLoading}
          className="transition-all duration-200 active:scale-95"
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={nextPage}
          disabled={!pagination.hasNext || pagination.isLoading}
          className="transition-all duration-200 active:scale-95"
        >
          Next
        </Button>
      </div>
    </div>
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
        {Array.from({ length: 5 }).map((_, i) => (
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

export function PatientTable() {
  const patients = usePatientStore((state) => state.patients);
  const isLoading = usePatientStore((state) => state.isLoading);
  const error = usePatientStore((state) => state.error);
  const totalPages = usePatientStore((state) => state.totalPages);
  const fetchPage = usePatientStore((state) => state.fetchPage);

  const [sortField, setSortField] = useState<SortField>('patient_id');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Fetch first page on mount
  const hasFetchedRef = useRef(false);
  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchPage(1);
    }
  }, [fetchPage]);

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

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  if (isLoading && patients.length === 0) {
    return <TableSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No patients loaded.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="rounded-md border transition-shadow duration-300 hover:shadow-md">
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
              <TableRow
                key={patient.patient_id}
                className="transition-colors duration-200 hover:bg-muted/50"
              >
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

      {/* Pagination Controls */}
      {totalPages > 1 && <PaginationControls />}
    </div>
  );
}

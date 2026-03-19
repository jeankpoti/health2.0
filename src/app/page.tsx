'use client';

/**
 * @fileoverview Main dashboard page for the Healthcare API Assessment.
 *
 * This page displays:
 * - Risk summary statistics
 * - Categorized patient alert lists
 * - Detailed patient table
 * - Assessment submission controls
 */

import {
  RiskSummaryCards,
  AlertLists,
  PatientTable,
  SubmissionPanel,
} from '@/features/risk-assessment';
import { ThemeToggle } from '@/components/theme-toggle';

/**
 * Healthcare Assessment Dashboard
 *
 * The main page composing all risk assessment components.
 */
export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50 transition-colors duration-300">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="animate-fade-in">
            <h1 className="text-3xl font-bold tracking-tight">
              Healthcare Risk Assessment
            </h1>
            <p className="text-muted-foreground mt-1">
              DemoMed Healthcare API Integration Dashboard
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Summary Statistics */}
        <section className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <h2 className="text-xl font-semibold mb-4">Overview</h2>
          <RiskSummaryCards />
        </section>

        {/* Alert Lists */}
        <section className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <h2 className="text-xl font-semibold mb-4">Patient Categories</h2>
          <AlertLists />
        </section>

        {/* Two Column Layout for Table and Submission */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Patient Table (2 columns) */}
          <section
            className="lg:col-span-2 animate-fade-in-up"
            style={{ animationDelay: '300ms' }}
          >
            <h2 className="text-xl font-semibold mb-4">Patient Details</h2>
            <PatientTable />
          </section>

          {/* Submission Panel (1 column) */}
          <section
            className="animate-fade-in-up"
            style={{ animationDelay: '400ms' }}
          >
            <h2 className="text-xl font-semibold mb-4">Submit Assessment</h2>
            <SubmissionPanel />
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card mt-8 transition-colors duration-300">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          Healthcare API Assessment - Built with Next.js, Zustand, and shadcn/ui
        </div>
      </footer>
    </div>
  );
}

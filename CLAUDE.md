# Healthcare API Assessment

## Project Overview
A Next.js application demonstrating API integration and risk scoring for a healthcare assessment. Built with clean architecture principles and professional code standards.

## Architecture

```
src/
├── app/                          # Next.js App Router
│   ├── api/patients/route.ts     # Server-side API proxy (hides API key)
│   ├── layout.tsx                # Root layout with providers
│   └── page.tsx                  # Main dashboard page
│
├── components/                   # Shared UI components (shadcn/ui)
│   ├── ui/                       # Base components (button, card, table, etc.)
│   └── layout/                   # Layout components (header)
│
├── features/                     # Feature-based modules
│   └── risk-assessment/          # Main feature for this assessment
│       ├── components/           # Feature-specific UI
│       │   ├── patient-table.tsx
│       │   ├── risk-summary-cards.tsx
│       │   ├── submission-panel.tsx
│       │   └── alert-lists.tsx
│       ├── hooks/                # React Query hooks
│       │   ├── use-patients.ts
│       │   └── use-submit-assessment.ts
│       ├── services/             # API integration
│       │   └── patient-api.ts
│       ├── utils/                # Pure business logic
│       │   └── risk-calculator.ts
│       ├── constants/            # Named thresholds
│       │   └── thresholds.ts
│       └── types/                # Feature-specific types
│           └── index.ts
│
├── lib/                          # Third-party configurations
│   ├── api-client.ts             # Fetch with retry/backoff
│   ├── react-query.tsx           # QueryClient provider
│   └── utils.ts                  # cn() helper for Tailwind
│
├── types/                        # Shared TypeScript types
│   └── api.ts                    # API response types
│
├── utils/                        # Shared utilities
│   └── format.ts                 # Date/number formatters
│
└── hooks/                        # Global custom hooks
```

## Key Design Decisions

### 1. Feature-Based Architecture
- All risk-assessment code is co-located in `features/risk-assessment/`
- Clean separation between UI, business logic, and data fetching
- Barrel exports for clean imports

### 2. Pure Business Logic
- `risk-calculator.ts` contains zero dependencies
- All risk scoring functions are pure (input → output)
- Easily testable without mocking

### 3. Resilient API Client
- Exponential backoff with jitter for retry logic
- Handles 429 (rate limit) and 5xx (server errors)
- Custom error classes for type-safe error handling

### 4. Named Constants
- All magic numbers are named in `constants/thresholds.ts`
- Self-documenting code
- Single source of truth for business rules

## Risk Scoring Rules

### Blood Pressure (1-4 points)
- Normal (Systolic <120 AND Diastolic <80): 1 point
- Elevated (Systolic 120-129 AND Diastolic <80): 2 points
- Stage 1 (Systolic 130-139 OR Diastolic 80-89): 3 points
- Stage 2 (Systolic ≥140 OR Diastolic ≥90): 4 points
- **Note**: Use HIGHER risk stage when systolic/diastolic differ

### Temperature (0-2 points)
- Normal (≤99.5°F): 0 points
- Low Fever (99.6-100.9°F): 1 point
- High Fever (≥101.0°F): 2 points

### Age (1-2 points)
- Under 40: 1 point
- 40-65 (inclusive): 1 point
- Over 65: 2 points

### Classification
- **High Risk**: Total score ≥ 4
- **Fever**: Temperature ≥ 99.6°F
- **Data Quality Issue**: Invalid/missing BP, age, or temperature

## Commands

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run test      # Run unit tests
npm run lint      # Run ESLint
```

## Environment Variables

```env
ASSESSMENT_API_KEY=your-api-key-here
```

## Tech Stack
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn/ui
- TanStack React Query
- Vitest (testing)

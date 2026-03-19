# Healthcare Risk Assessment - Technical Documentation

## Project Overview

A modern Next.js application for the DemoMed Healthcare API assessment. Features patient risk scoring, data quality analysis, and real-time categorization with a polished, animated UI supporting dark mode.

**Key Achievements:**
- 100% score on Fever patients (9/9 correct)
- 100% score on Data Quality issues (8/8 correct)
- 100% score on High Risk patients (20/20 correct)
- Clean architecture with 57 passing unit tests

---

## Architecture

```
src/
├── app/                              # Next.js App Router
│   ├── api/
│   │   ├── patients/route.ts         # Paginated patient API proxy
│   │   └── submit-assessment/route.ts # Assessment submission proxy
│   ├── globals.css                   # Tailwind + custom animations
│   ├── layout.tsx                    # Root layout with ThemeProvider
│   └── page.tsx                      # Main dashboard page
│
├── components/                       # Shared components
│   ├── ui/                           # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── table.tsx
│   │   ├── badge.tsx
│   │   ├── alert.tsx
│   │   ├── skeleton.tsx
│   │   └── tabs.tsx
│   ├── theme-provider.tsx            # Custom dark mode provider
│   └── theme-toggle.tsx              # Animated sun/moon toggle
│
├── features/                         # Feature-based modules
│   └── risk-assessment/
│       ├── components/
│       │   ├── patient-table.tsx     # Sortable table with pagination
│       │   ├── risk-summary-cards.tsx # Animated stat cards
│       │   ├── submission-panel.tsx  # Load all + submit controls
│       │   └── alert-lists.tsx       # Categorized patient lists
│       ├── store/
│       │   └── patient-store.ts      # Zustand state management
│       ├── services/
│       │   └── patient-api.ts        # API integration layer
│       ├── utils/
│       │   └── risk-calculator.ts    # Pure risk scoring functions
│       ├── constants/
│       │   └── thresholds.ts         # Named constants & thresholds
│       ├── types/
│       │   └── index.ts              # TypeScript interfaces
│       └── index.ts                  # Barrel exports
│
├── lib/
│   ├── api-client.ts                 # Fetch with retry/backoff
│   └── utils.ts                      # cn() helper for Tailwind
│
└── types/
    └── api.ts                        # Shared API response types
```

---

## Tech Stack

| Category | Technology | Version |
|----------|------------|---------|
| Framework | Next.js (App Router) | 16.x |
| UI Library | React | 19.x |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| Components | shadcn/ui (base-nova) | Latest |
| State Management | Zustand | 5.x |
| Animations | tw-animate-css + Custom | 1.4.x |
| Testing | Vitest | 4.x |
| Icons | Lucide React | Latest |

---

## Key Design Decisions

### 1. Feature-Based Architecture
- All risk-assessment code co-located in `features/risk-assessment/`
- Clean separation: UI → Store → Services → Utils
- Barrel exports for clean imports: `import { PatientTable } from '@/features/risk-assessment'`

### 2. Zustand State Management
- Lightweight alternative to React Query
- Single unified store with pagination support
- `useShallow` hook prevents infinite re-renders
- DevTools integration for debugging

### 3. Pure Business Logic
- `risk-calculator.ts` has zero external dependencies
- All functions are pure (input → output)
- 57 unit tests with 100% coverage on scoring logic
- Easily testable without mocking

### 4. Server-Side API Proxy
- API routes hide sensitive credentials
- Rate limiting handled with exponential backoff
- Jitter added to prevent thundering herd

### 5. Custom Theme Provider
- No script tag injection (avoids React warnings)
- Persists to localStorage
- Responds to system preference changes
- Smooth transitions with CSS

### 6. Modern Animations
- Staggered entrance animations
- Hover micro-interactions
- Respects `prefers-reduced-motion`
- GPU-accelerated transforms

---

## Risk Scoring Algorithm

### Blood Pressure (1-4 points)
| Category | Systolic | Diastolic | Score |
|----------|----------|-----------|-------|
| Normal | <120 | AND <80 | 1 |
| Elevated | 120-129 | AND <80 | 2 |
| Stage 1 | 130-139 | OR 80-89 | 3 |
| Stage 2 | ≥140 | OR ≥90 | 4 |

**Rule**: When systolic/diastolic fall into different categories, use the HIGHER risk stage.

### Temperature (0-2 points)
| Category | Range | Score |
|----------|-------|-------|
| Normal | ≤99.5°F | 0 |
| Low Fever | 99.6-100.9°F | 1 |
| High Fever | ≥101.0°F | 2 |

### Age (1-2 points)
| Category | Range | Score |
|----------|-------|-------|
| Under 40 | <40 | 1 |
| Middle | 40-65 | 1 |
| Over 65 | >65 | 2 |

### Patient Classification
- **High Risk**: Total score ≥ 4 AND no data quality issues
- **Fever**: Temperature ≥ 99.6°F
- **Data Quality Issue**: Missing/invalid BP, age, or temperature

---

## API Integration

### Pagination
- 5 patients per page
- True server-side pagination via `?page=X&limit=5`
- "Load All Patients" required before submission
- Categories calculated from complete dataset

### Retry Logic
```typescript
const RETRYABLE_STATUS_CODES = [429, 500, 502, 503, 504];
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 1000;
// Exponential backoff with jitter
```

### Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/patients?page=1&limit=5` | GET | Fetch paginated patients |
| `/api/submit-assessment` | POST | Submit categorized results |

---

## State Management (Zustand)

```typescript
interface PatientStore {
  // Current page data
  patients: PatientWithRisk[];
  currentPage: number;
  totalPages: number;

  // All patients for submission
  allPatients: PatientWithRisk[];
  allPatientsLoaded: boolean;

  // Categorization
  categories: CategorizedPatients | null;

  // Actions
  fetchPage: (page: number) => Promise<void>;
  loadAllForSubmission: () => Promise<void>;
  submitAssessment: () => Promise<void>;
}
```

### Hooks
- `usePatientStore` - Main store access
- `usePatientStats` - Dashboard statistics
- `usePagination` - Pagination controls
- `useHighRiskPatients` - High risk patient IDs
- `useFeverPatients` - Fever patient IDs
- `useDataQualityIssues` - Data quality issue IDs

---

## Commands

```bash
# Development
npm run dev         # Start dev server (localhost:3000)

# Build & Production
npm run build       # Production build
npm run start       # Start production server

# Testing
npm run test        # Run Vitest tests
npm run test:watch  # Watch mode

# Code Quality
npm run lint        # ESLint check
npm run type-check  # TypeScript check
```

---

## Environment Variables

```env
# Required
ASSESSMENT_API_KEY=your-api-key-here
```

---

## Testing

### Unit Tests (57 tests)
- Blood pressure parsing and scoring
- Temperature risk calculation
- Age risk calculation
- Patient categorization
- Edge cases and invalid data

```bash
npm run test
```

### Manual Testing Checklist
- [ ] Pagination works (Previous/Next)
- [ ] Dark mode toggles correctly
- [ ] Animations play on page load
- [ ] "Load All Patients" enables submission
- [ ] Results display after submission
- [ ] Error states show properly

---

## Performance Considerations

1. **Selective Re-renders**: `useShallow` prevents unnecessary updates
2. **GPU Animations**: Uses `transform` and `opacity` only
3. **Lazy Loading**: Patients loaded on-demand per page
4. **Reduced Motion**: Respects user accessibility preferences
5. **Server Components**: Layout remains server-rendered

---

## File Naming Conventions

- Components: `kebab-case.tsx` (e.g., `patient-table.tsx`)
- Types: `PascalCase` (e.g., `PatientWithRisk`)
- Constants: `SCREAMING_SNAKE_CASE` (e.g., `HIGH_RISK_THRESHOLD`)
- Functions: `camelCase` (e.g., `calculatePatientRisk`)

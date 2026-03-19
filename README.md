# Healthcare Risk Assessment Dashboard

A modern, production-ready Next.js application for patient risk scoring and healthcare data analysis. Built for the DemoMed Healthcare API assessment.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss)

---

## Features

- **Patient Risk Scoring** - Automated calculation based on blood pressure, temperature, and age
- **Real-time Categorization** - Instantly identifies high-risk patients, fever cases, and data quality issues
- **Paginated Data Display** - Efficient handling of large patient datasets (5 per page)
- **Dark Mode** - System-aware theme with smooth transitions
- **Modern Animations** - Staggered entrance effects and micro-interactions
- **Accessible** - Respects `prefers-reduced-motion` and includes proper ARIA labels
- **57 Unit Tests** - Comprehensive test coverage for scoring logic

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd health2.0

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local and add your API key
```

### Environment Variables

Create a `.env.local` file:

```env
ASSESSMENT_API_KEY=your-api-key-here
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm run start
```

---

## Usage

### 1. View Patient Data
The dashboard automatically loads the first page of patients on startup. Use the **Previous/Next** buttons to navigate through pages.

### 2. Understand Risk Scores
Each patient displays:
- **Risk Score Badge** - Color-coded (Low/Moderate/High Risk)
- **Temperature** - Highlighted red if fever detected
- **Data Quality** - Shows validation issues if any

### 3. Submit Assessment
1. Click **"Load All Patients"** to fetch the complete dataset
2. Review the categorized lists (High Risk, Fever, Data Quality Issues)
3. Click **"Submit Assessment"** to send results to the API
4. View your score and feedback

### 4. Toggle Dark Mode
Click the sun/moon icon in the header to switch themes.

---

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # Server-side API proxies
│   ├── globals.css         # Global styles + animations
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Dashboard page
│
├── components/             # Shared UI components
│   ├── ui/                 # shadcn/ui components
│   ├── theme-provider.tsx  # Dark mode context
│   └── theme-toggle.tsx    # Theme switch button
│
├── features/               # Feature modules
│   └── risk-assessment/
│       ├── components/     # Feature UI
│       ├── store/          # Zustand state
│       ├── services/       # API layer
│       ├── utils/          # Business logic
│       ├── constants/      # Thresholds
│       └── types/          # TypeScript types
│
├── lib/                    # Utilities
└── types/                  # Shared types
```

---

## Risk Scoring Algorithm

### Blood Pressure (1-4 points)

| Category | Systolic | Diastolic | Score |
|----------|----------|-----------|-------|
| Normal | <120 | AND <80 | 1 |
| Elevated | 120-129 | AND <80 | 2 |
| Stage 1 Hypertension | 130-139 | OR 80-89 | 3 |
| Stage 2 Hypertension | ≥140 | OR ≥90 | 4 |

### Temperature (0-2 points)

| Category | Range | Score |
|----------|-------|-------|
| Normal | ≤99.5°F | 0 |
| Low Fever | 99.6-100.9°F | 1 |
| High Fever | ≥101.0°F | 2 |

### Age (1-2 points)

| Category | Range | Score |
|----------|-------|-------|
| Under 40 | <40 years | 1 |
| 40-65 | 40-65 years | 1 |
| Over 65 | >65 years | 2 |

### Classification Rules

- **High Risk**: Total score ≥ 4 (only with complete valid data)
- **Fever Patient**: Temperature ≥ 99.6°F
- **Data Quality Issue**: Missing or invalid BP, age, or temperature

---

## Testing

```bash
# Run all tests
npm run test

# Watch mode
npm run test -- --watch

# Coverage report
npm run test -- --coverage
```

### Test Coverage

- Blood pressure parsing (valid/invalid formats)
- Temperature risk calculation
- Age-based scoring
- Composite patient risk scoring
- Patient categorization logic
- Edge cases and boundary conditions

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 16** | React framework with App Router |
| **React 19** | UI library |
| **TypeScript** | Type safety |
| **Tailwind CSS 4** | Utility-first styling |
| **shadcn/ui** | Component library (base-nova preset) |
| **Zustand** | Lightweight state management |
| **Vitest** | Fast unit testing |
| **Lucide React** | Modern icon set |

---

## API Integration

### Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/patients` | GET | Fetch paginated patients |
| `POST /api/submit-assessment` | POST | Submit categorized results |

### Retry Logic

- Handles rate limiting (429) and server errors (5xx)
- Exponential backoff with jitter
- Maximum 3 retry attempts

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run test` | Run unit tests |
| `npm run lint` | Check code quality |

---

## Design Decisions

### Why Zustand over React Query?

- Simpler mental model for this use case
- No provider wrapper needed
- Built-in DevTools support
- Smaller bundle size

### Why Custom Theme Provider?

- Avoids `next-themes` script injection warnings
- Full control over implementation
- Cleaner React component tree

### Why Feature-Based Architecture?

- Scalable organization pattern
- Clear boundaries between features
- Easy to test in isolation
- Simple imports via barrel exports

---

## Accessibility

- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support
- Respects `prefers-reduced-motion`
- Sufficient color contrast in both themes

---

## Performance

- **Server-side API proxies** - Credentials never exposed to client
- **Pagination** - Only loads data as needed
- **Selective re-renders** - Zustand's `useShallow` prevents unnecessary updates
- **GPU animations** - Uses `transform` and `opacity` only
- **Code splitting** - Next.js automatic optimization

---

## License

This project was created for the Ksense Technology Group assessment.

---

## Author

Built with modern web technologies and best practices.

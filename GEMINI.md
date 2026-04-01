# Abandoned Category Detector - Project Instructions

## Project Overview

Abandoned Category Detector is a specialized intelligence suite for wholesale sales representatives to monitor account health and re-engage buyers. It identifies patterns of complete account abandonment and selective Abandoned Category, while highlighting "blind spots" where high-potential buyers are being neglected.

### Key Technologies

- **Backend**: ElysiaJS (powered by Bun), Prisma ORM, OpenAI API (for automated outreach drafting).
- **Frontend**: React 19 (Vite), TypeScript, Tailwind CSS, Shadcn UI, Recharts (for growth radar), Lucide React (icons).
- **Database**: Configured via Prisma (typically SQLite for development).

### Architecture

The project is split into two main directories:

- `/backend`: A Bun-based API server handling business logic, churn calculations, and AI integrations.
- `/frontend`: A React SPA providing interactive dashboards for sales reps.

## Dashboards & Features

1. **Account Churn**: Identifies buyers who have stopped ordering entirely. Reps can generate AI outreach messages based on reorder cycles.
2. **Abandoned Category**: Tracks buyers who are still active but have silently abandoned specific product categories (e.g., stopped buying "Linens" while still buying "Glassware").
3. **Blind Spot Detector**: A growth radar that compares a buyer's "Purchase Power" (potential) against "Rep Attention" (logged contacts). Accounts in the "Untapped Potential" quadrant are flagged for immediate action.
4. **Relationship Logging**: A logging system to record calls, emails, and visits, which feeds into the attention scores.

## Building and Running

### Prerequisites

- [Bun](https://bun.sh/) installed.
- OpenAI API Key (configured in `.env` for the backend).

### Backend Setup

```bash
cd backend
bun install
# Configure .env with DATABASE_URL and OPENAI_API_KEY
bun prisma generate
bun prisma db push # or migrate
bun run seed.ts    # to populate demo data
bun run index.ts   # starts server on port 3040
```

### Frontend Setup

```bash
cd frontend
bun install
bun run dev        # starts Vite dev server
```

## Development Conventions

### Routing & State

- **URL-Driven Dashboard**: The dashboard state is synced with the URL: `/:repId/:tab` (e.g., `/1/category`). This allows for direct linking and representative-specific contexts.
- **Representative Context**: All data-fetching components must use the `repId` from `useParams` to ensure data isolation between team members.

### UI/UX Standards

- **Visual Feedback**: Use Lucide icons and Shadcn UI components. Maintain the high-contrast, modern "intelligence suite" aesthetic.
- **Drafting Flow**: AI-generated outreach should always be editable by the rep before sending via the Gmail integration helper.
- **Safety**: Ensure all API calls are resilient to missing `repId` or buyer data.

### Testing & Validation

- **Database Integrity**: Always verify changes against the Prisma schema (`backend/prisma/schema.prisma`).
- **Mock Data**: Use the provided seed script to validate churn logic and radar visualizations.

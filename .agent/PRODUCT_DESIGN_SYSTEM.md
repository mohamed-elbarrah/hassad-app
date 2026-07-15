# Hassad Product Design System

This document defines the product UI operating system for Hassad. It is not a mood board. It is the rulebook for building consistent dashboards across Sales, CRM, PM, Team, Marketing, Finance, Admin, and Client Portal.

## Product Direction

Hassad should feel like a serious operations product: calm, clear, dense when needed, and fast to scan.

- **Reference quality:** Jira for workflow clarity, Notion for clean hierarchy, Twenty CRM for modern record management, HubSpot/Pipedrive for sales pipeline flows.
- **Visual character:** neutral workspace, rounded surfaces, low-noise borders, controlled status color, strong Arabic-first typography.
- **UX goal:** every page should answer what matters, what changed, and what the user should do next.

## Core Principles

- **One page type, one layout:** do not invent layout per feature.
- **Actions are obvious:** each page has one primary action, secondary actions stay visually quiet.
- **Status is semantic:** colors mean state, not decoration.
- **Data before decoration:** tables, lists, timelines, and kanban boards are first-class UI.
- **Progressive disclosure:** list pages show enough to decide; detail pages show the full story.
- **Role-based focus:** each role sees tasks and outcomes, not backend modules.
- **Reusable wrappers only:** app code imports from `@/components/design-system/*`; raw `@/components/ui/*` is allowed only inside wrappers.

## Information Architecture

Design navigation around jobs-to-be-done.

### Admin

- Overview
- Users and roles
- CRM control
- Projects and tasks
- Finance control
- Reports
- Settings and security

### Sales / CRM

- Pipeline
- Leads
- Clients
- Proposals
- Contracts
- Handoff to PM
- Sales reports

### PM

- Overview
- Projects
- Requests
- Tasks
- Disputes
- Team capacity
- Client updates

### Team

- My tasks
- In review
- Due soon
- Files and comments
- Workload

### Marketing

- Campaigns
- Content/tasks
- Performance
- Client strategies
- Reports

### Finance

- Overview
- Invoices
- Payments
- Contracts
- Ledger
- Payroll
- Risk/overdue

### Client Portal

- Overview
- Projects
- Requests
- Deliverables
- Proposals/contracts
- Invoices/payments
- Support/chat

## Page Templates

Use these templates before creating new page structure.

### Dashboard Overview

Purpose: summarize a role's current workload and attention areas.

- `PageIntro`
- KPI cards
- Action queue
- Recent activity
- Compact tables or charts

### Record List Page

Purpose: find, filter, compare, and open records.

- `PageIntro`
- metric row
- search/filter/action toolbar
- `DataTable`
- pagination
- empty/error/loading states

### Record Detail Page

Purpose: understand one entity and take action.

- title/status header
- key facts summary
- tabs for details, activity, files, finance, tasks
- timeline/history
- side panel for ownership, dates, and next action

### Kanban Pipeline Page

Purpose: move work through a state machine.

- stage columns
- compact cards
- clear WIP counts
- server-validated transitions
- rejected transition feedback

### Form Wizard Page

Purpose: create complex business records with confidence.

- step progress
- one decision group per section
- saved state
- review screen
- clear submit result

### Report Page

Purpose: explain business health.

- period controls
- KPI cards
- trend chart
- breakdown table
- export action

### Settings Page

Purpose: configure system behavior safely.

- grouped sections
- danger zone separated
- audit trail for important changes
- explicit confirmation for destructive actions

## Component Roles

### Layout

- `PageIntro`: page identity, short description, primary action.
- `SurfaceCard`: major section shell.
- `DashboardCard`: dashboard content block with title/action.
- `InfoPanel`: explanatory or supporting block.

### Actions

- `ActionButton`: all buttons and links that look like buttons.
- Variants:
  - `primary`: main page action.
  - `outline`: neutral secondary action.
  - `ghost`: low-emphasis action.
  - `action-blue`: informative/create action.
  - `action-purple`: review/AI/special workflow action.
  - `pm`: PM-specific quiet action.
  - `submit`: form submission.

### Data

- `DataTable`: dense operational data with loading, empty, and error states.
- `MetricCard` / `StatCard`: top-level numbers.
- `Pill`: small metadata.
- `StatusBadge`: normalized business status.
- `ProgressBar`: completion, risk, SLA, utilization.

### Feedback

- `StatusBanner`: page-level or section-level status message.
- `EmptyState`: no records or completed queues.
- `Skeleton`: loading placeholders.

### Forms

- `Input`: search and text.
- `Select`: dropdown choices.
- `Checkbox`, `Switch`: boolean settings.
- Form wrappers: use `FormInputControl`, `FormSelectControl`, `FormTextareaControl` when using react-hook-form.

## Visual Rules

- Background: `bg-portal-bg`.
- Primary surface: `bg-natural-0`, `border-portal-card-border`, rounded `30px`.
- Section rhythm: page gap `gap-5`, card padding `p-5` or `p-6`.
- Text hierarchy:
  - Page title: 28-32px, semibold.
  - Section title: 20-24px, medium/semibold.
  - Body: 14-16px.
  - Metadata: 12-14px muted.
- Icons: use icons for scanning, not decoration. One icon per title block is enough.
- Borders: prefer one soft border over stacked dividers.
- Shadows: avoid heavy shadows in dashboards.
- Radius: keep large cards at `rounded-[30px]`, controls at `rounded-xl`.

## Status Color Semantics

- Green: active, complete, paid, approved.
- Amber/orange: pending, due soon, warning, needs revision.
- Red: rejected, overdue, failed, cancelled.
- Blue: sent, scheduled, informational.
- Purple: review, AI, special workflow.
- Gray/navy: draft, neutral, inactive.

Never use these colors randomly. If color does not describe state, use neutral.

## Page Quality Checklist

Before shipping a redesigned page:

- The user can identify the page purpose in 3 seconds.
- The primary action is visible above the fold.
- Filters and search are next to the data they control.
- Empty, loading, and error states exist.
- Status labels use shared status components.
- There is no raw `@/components/ui/*` import in page/feature code.
- Dense data uses tables; summaries use cards.
- Detail pages include activity/history where business state changes matter.
- Mobile layout stacks without horizontal overflow except intentional tables.

## Implementation Order

1. Build and maintain the design-system showcase page.
2. Standardize page templates.
3. Redesign one full vertical flow: Sales lead -> proposal -> contract -> PM handoff.
4. Apply the resulting templates to PM, Finance, Marketing, Team, Admin.
5. Tighten lint enforcement for design-system imports.


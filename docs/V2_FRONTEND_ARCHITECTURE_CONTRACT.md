# Hassad V2 Frontend Architecture Contract

Status: Required before V2 route, feature, data, auth, or app-shell implementation  
Depends on: `docs/V2_TEMPLATE_EXECUTION_RULES.md`  
Product source: `docs/FRONTEND_V2_PRODUCT_SURFACE_CATALOG.md`  
Design source: `docs/V2_DESIGN_SYSTEM_CONTRACT.md`  
Reference filter: `docs/V2_TAILADMIN_REFERENCE_AUDIT.md`

## 1. When To Read This

Read this document before creating or changing:

- `apps/web-v2/src/app/**`;
- route groups;
- layouts;
- loading/error/not-found/unauthorized files;
- app shell components;
- feature directories;
- API transport;
- auth/session code;
- permission gates;
- fixtures;
- tests;
- environment contracts.

Read order:

1. `docs/V2_TEMPLATE_EXECUTION_RULES.md`
2. `docs/FRONTEND_V2_PRODUCT_SURFACE_CATALOG.md`
3. `docs/V2_TAILADMIN_REFERENCE_AUDIT.md` if TailAdmin is involved
4. `docs/V2_DESIGN_SYSTEM_CONTRACT.md`
5. `docs/V2_FRONTEND_ARCHITECTURE_CONTRACT.md`
6. `.agents/skills/shadcn/SKILL.md`
7. shadcn component docs for primitives being used
8. Next.js bundled docs for route, layout, rendering, and data decisions
9. `packages/shared/src` and API contracts for business data

This document decides where code lives and how data, auth, routing, state, and tests are allowed to work.

## 2. Tooling Evidence

Current verified baseline:

- Target package: `apps/web-v2`
- Next.js: `16.3.0`
- Next docs path: `apps/web-v2/node_modules/next/dist/docs`
- React: `19.2.8`
- Tailwind: v4
- shadcn style: `base-nova`
- shadcn base: `base`
- shadcn icon library: `lucide`
- shadcn primitive path: `apps/web-v2/src/components/ui`

Docs read for this contract:

- `01-app/01-getting-started/02-project-structure.md`
- `01-app/01-getting-started/03-layouts-and-pages.md`
- `01-app/01-getting-started/04-linking-and-navigating.md`
- `01-app/01-getting-started/05-server-and-client-components.md`
- `01-app/03-api-reference/03-file-conventions/route-groups.md`
- `01-app/03-api-reference/03-file-conventions/error.md`
- `01-app/03-api-reference/03-file-conventions/unauthorized.md`

MCP evidence:

- Next DevTools reports bundled docs available for `apps/web-v2`.
- shadcn registry search returns `@shadcn/sidebar`, data-table examples, and form items.

## 3. Architecture Goal

V2 must be a clean-room operational SaaS frontend.

The architecture must optimize for:

- predictable route ownership;
- explicit product boundaries;
- strict TypeScript;
- small shared pattern APIs;
- server-first rendering;
- small client islands;
- typed API transport;
- permission-aware navigation and commands;
- state coverage from the first slice;
- tests as part of the foundation.

It must not optimize for quick page demos.

## 4. Package Boundary

`apps/web-v2` is the only V2 frontend package.

Allowed dependencies:

- `packages/shared/src` for business enums, schemas, and types;
- API contracts from `apps/api`;
- shadcn primitives from `apps/web-v2/src/components/ui`;
- approved local V2 patterns.

Forbidden dependencies:

- `apps/web`;
- legacy frontend components;
- legacy frontend providers;
- legacy Redux/RTK Query assumptions;
- legacy route hierarchy;
- TailAdmin code or custom primitives;
- old failed V2 template feature code unless explicitly re-approved.

## 5. Source Ownership

Expected source structure:

```text
apps/web-v2/src/
  app/
  components/
    ui/
    app/
    patterns/
  features/
    auth/
    admin/
    employees/
    notifications/
  hooks/
  lib/
    api/
    auth/
    permissions/
    fixtures/
  test/
```

Ownership rules:

- `components/ui`: shadcn primitives only.
- `components/app`: app shell and global app surfaces.
- `components/patterns`: reusable product patterns composed from shadcn.
- `features/<domain>`: domain-specific components, feature data mappers, and feature fixtures.
- `lib/api`: transport, envelope unwrapping, errors, and request helpers.
- `lib/auth`: session helpers and auth state boundaries.
- `lib/permissions`: permission checks and navigation filtering.
- `lib/fixtures`: shared realistic dummy data until API integration.
- `app`: route composition only.

Routes must not become component libraries. Shared patterns must not become feature dumps.

## 6. Route Architecture

Use Next App Router route groups to separate concerns without leaking group names into URLs.

Initial route groups:

```text
src/app/
  layout.tsx
  globals.css
  (public)/
    page.tsx
  (auth)/
    login/page.tsx
    signup/page.tsx
    forgot-password/page.tsx
    reset-password/page.tsx
  (app)/
    layout.tsx
    admin/
    sales/
    pm/
    team/
    finance/
  (portal)/
    layout.tsx
    portal/
```

Rules:

- root `layout.tsx` owns global HTML/body, fonts, global providers, and global CSS import;
- authenticated `(app)/layout.tsx` owns staff shell;
- `(portal)/layout.tsx` owns client portal shell;
- `(auth)` routes do not render authenticated workspace shell;
- use dynamic segments for entity details, for example `admin/employees/[employeeId]`;
- use dedicated routes for multi-step workflows;
- use dialogs/sheets for short edits and contextual inspection only;
- do not create template-gallery routes in production V2.

## 7. Route File Conventions

Use Next file conventions intentionally:

- `page.tsx`: route UI composition.
- `layout.tsx`: shared shell for a route segment.
- `loading.tsx`: route-level skeletons and streaming fallbacks.
- `error.tsx`: route-segment error fallback; must be a Client Component.
- `not-found.tsx`: missing route or missing record fallback.
- `unauthorized.tsx`: unauthenticated fallback when used by auth flow.
- `forbidden.tsx`: permission-denied fallback if adopted by Next version and product flow.

Rules:

- every dynamic detail route must have a loading state before product rollout;
- every route group with business data must have an error boundary;
- error components must not leak sensitive server errors;
- not-found and forbidden states must use shared app/pattern components;
- loading skeletons must match final layout shape.

## 8. Server And Client Component Boundary

Default to Server Components.

Use Client Components only for:

- event handlers;
- local interactive state;
- browser APIs;
- command palette;
- dropdown/menu open state if required;
- dialogs/sheets;
- client-side form pending state;
- drag-and-drop;
- charts;
- real-time chat/notifications;
- optimistic UI where approved.

Rules:

- do not mark route layouts as `"use client"` unless unavoidable;
- isolate client behavior in small components;
- do not pull large server-rendered page trees into the client bundle;
- pass serializable data from Server Components into Client Components;
- secrets and API tokens never cross into client bundles.

## 9. Data Transport

The API response envelope is:

```json
{ "success": true, "data": "<payload>", "error": null }
```

V2 must unwrap this exactly once in transport code.

Feature code receives the inner `data`, never the raw envelope.

Transport responsibilities:

- base URL from V2 environment config;
- credentials included for HttpOnly cookie auth;
- JSON parsing;
- envelope validation;
- typed success payload;
- typed error object;
- automatic single refresh attempt after 401;
- clearing authenticated client state after second 401;
- normalized handling for 403, 404, validation, and network errors.

Forbidden:

- double-unwrapping;
- feature-level ad hoc `fetch`;
- swallowing errors;
- hardcoding API URLs in feature components;
- inventing business scores in browser code.

## 10. Auth And Session Boundary

Backend auth behavior:

- JWT access token and refresh token are stored in HttpOnly cookies;
- API uses credentials;
- access token can expire and refresh once;
- second 401 means the user must return to login.

V2 behavior:

- authenticated shell must not render sensitive data before session resolution;
- one automatic refresh attempt after 401;
- after second 401, clear authenticated client state and route to login;
- 403 shows permission-specific forbidden state, not login;
- sign out clears session through API and local client state;
- account menu reflects current user/workspace.

Do not store JWTs in localStorage.

## 11. Permission Architecture

Permissions decide capabilities. Role only selects default workspace and default navigation context.

Required:

- permission-aware navigation filtering;
- permission-aware row and page commands;
- shared permission check helpers;
- forbidden state for denied route access;
- disabled or hidden actions based on product rules;
- no role-string-only authorization logic.

Permission data must eventually come from backend session/current-user API. Until then, fixtures must model permissions explicitly.

## 12. State Management

Start conservative.

Allowed initial state:

- Server Component data for route-level reads;
- URL search params for filters, sorting, pagination, selected view, and reporting range;
- local component state for local UI controls;
- small client context only for global shell UI if shadcn primitive state is insufficient.

Do not introduce Redux, Zustand, RTK Query, or a large global store by default.

Add server-data tooling only after a concrete requirement appears, such as cross-route cache invalidation, optimistic mutations, or real-time data reconciliation.

## 13. URL State

Use URL state for any user state that should be bookmarkable or shareable:

- search;
- filters;
- sorting;
- pagination;
- view mode;
- date/reporting range;
- selected tab when it changes the information view.

Rules:

- parse URL params through typed helpers;
- invalid values fall back safely;
- URLs must not expose secrets or sensitive file tokens;
- list pages must restore state on refresh.

## 14. Feature Boundary

Each feature owns:

- route-specific composition under `app`;
- domain components under `features/<domain>`;
- feature fixtures while API integration is pending;
- domain mappers from API DTOs to UI view models;
- feature tests.

Shared components are promoted only when:

- at least two features need the same pattern; or
- one critical workflow needs a stable reusable pattern.

Avoid premature abstraction.

## 15. Pattern Boundary

Shared product patterns must be composed from shadcn primitives.

Expected first patterns:

- app shell;
- workspace sidebar;
- topbar;
- page scaffold;
- state boundary;
- metric tile;
- queue/list;
- entity detail layout;
- edit dialog;
- inspect sheet;
- confirm action;
- permission gate.

Pattern APIs must stay small. If a pattern requires many feature-specific props, it belongs in the feature.

## 16. Fixture Strategy

Use realistic dummy data before API integration.

Rules:

- fixtures live outside components;
- fixtures model permissions, roles, statuses, long text, empty states, and error states;
- fixtures use shared enums where available;
- fixtures must be easy to replace with API data;
- no TailAdmin ecommerce sample data;
- no demo-only records embedded in TSX.

## 17. Environment Contract

V2 must define its own environment contract.

Expected initial variables:

```text
NEXT_PUBLIC_API_URL=http://localhost:3001/v1
```

Rules:

- V2 does not reuse legacy `apps/web/.env.local` as authority;
- public variables must be safe for browser exposure;
- server-only secrets must not be prefixed with `NEXT_PUBLIC_`;
- missing required env should fail clearly during development.

## 18. Testing Architecture

V2 foundation must establish tests before broad screen work.

Required:

- TypeScript strict checks;
- ESLint;
- component tests for shared patterns;
- integration tests for API transport envelope and auth retry;
- accessibility tests for shell, dialogs, menus, and forms;
- Playwright critical-flow tests for the first vertical slice.

First slice tests:

- login form validation;
- authenticated shell renders correct workspace nav;
- employees list supports loading, empty, no-results, and forbidden states;
- employee detail handles not found and forbidden states;
- edit dialog prevents duplicate submit and preserves failed input.

## 19. Build And Runtime Verification

Before handoff:

- run package lint;
- run typecheck when script exists;
- run targeted tests when available;
- use Next DevTools runtime diagnostics when a dev server is running;
- capture screenshots for approved slice states.

Do not start a dev server unless needed. If one is started, clean it up before the task ends.

## 20. First Slice Architecture

Approved first implementation scope:

```text
(auth)/login
(app)/admin
(app)/admin/employees
(app)/admin/employees/[employeeId]
```

Required feature ownership:

```text
features/auth/
features/admin/
features/employees/
components/app/
components/patterns/
lib/api/
lib/auth/
lib/permissions/
lib/fixtures/
```

Do not add Sales, PM, Team, Finance, Marketing, or Portal screens before the first slice passes screenshot and behavior approval.

## 21. Stop Conditions

Stop and report when:

- a route requires a product decision not approved in the catalog;
- backend endpoint behavior is missing or unclear;
- auth/current-user contract is missing;
- permission model cannot be represented cleanly;
- shadcn docs are unavailable for required primitives;
- Next version-matched docs are unavailable for route/layout decisions;
- implementation requires copying from legacy frontend or TailAdmin;
- shared UI starts accumulating raw visual styling.

## 22. Relationship To Other Docs

- `V2_TEMPLATE_EXECUTION_RULES.md` controls sequence and gates.
- `FRONTEND_V2_PRODUCT_SURFACE_CATALOG.md` controls product scope.
- `V2_TAILADMIN_REFERENCE_AUDIT.md` controls reference-template usage.
- `V2_DESIGN_SYSTEM_CONTRACT.md` controls visual and component composition rules.
- This document controls code ownership, routing, data, auth, permission, state, and verification architecture.
- shadcn docs control primitive APIs.
- Next.js bundled docs control App Router APIs.


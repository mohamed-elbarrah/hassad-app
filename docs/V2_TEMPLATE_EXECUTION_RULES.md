# Hassad V2 Template Execution Rules

Status: Mandatory gate before new V2 UI work  
Scope: `apps/web-v2` starter template and product UI foundation  
Reference template: `apps/free-nextjs-admin-dashboard-main`  
Product source of truth: `docs/FRONTEND_V2_PRODUCT_SURFACE_CATALOG.md`

## 1. Purpose

This document exists to control execution, not to describe a nice plan.

The V2 template must prevent the common failure pattern:

- building screens before the product system is clear;
- copying a popular admin template without understanding its tradeoffs;
- spreading colors, spacing, card styles, and layout decisions through TSX;
- creating one-off components that cannot support the next workspace;
- accepting screenshots that look acceptable but do not support real workflows.

No V2 screen work starts until this document is followed.

## 2. Document Routing

This is the entry document for all V2 template and UI work.

Read documents in this order:

1. `docs/V2_TEMPLATE_EXECUTION_RULES.md`: execution sequence, stop conditions, and acceptance gates.
2. `docs/FRONTEND_V2_PRODUCT_SURFACE_CATALOG.md`: product workspaces, screens, workflows, commands, and required states.
3. `docs/V2_TAILADMIN_REFERENCE_AUDIT.md`: what may and may not be taken from TailAdmin.
4. `docs/V2_DESIGN_SYSTEM_CONTRACT.md`: token, density, layout, component, and state rules.
5. `docs/V2_FRONTEND_ARCHITECTURE_CONTRACT.md`: routes, feature boundaries, data transport, auth/session, state, tests, and implementation boundaries.
6. `.agents/skills/shadcn/SKILL.md`: shadcn composition rules and required tooling workflow.
7. `packages/shared/src`: enums, schemas, and business terms used by UI states and fixtures.
8. API controllers, DTOs, and Prisma schema when a screen depends on backend behavior.

Use this relationship:

- Product catalog decides what must exist.
- Reference audit decides what inspiration is allowed.
- Design-system contract decides how the UI is allowed to look and compose.
- Architecture contract decides where code lives and how data/auth/navigation flow.
- shadcn and Next docs decide exact implementation APIs.
- Shared and API contracts decide business data and state behavior.

If a future agent starts from any other V2 doc, that doc must point back here.

## 3. Non-Negotiable Order

Work must happen in this order:

1. Reference audit.
2. Product scope approval.
3. Design-system contract.
4. Architecture contract.
5. `apps/web-v2` scaffold verification.
6. shadcn primitive installation and audit.
7. Hassad shared pattern layer.
8. One vertical slice.
9. Screenshot and behavior approval.
10. Workspace expansion.

Skipping a step is a failed execution, even if the UI looks good.

## 4. Reference Template Rules

TailAdmin is a benchmark and pattern reference. It is not a source tree for V2.

Allowed uses:

- compare shell density;
- study sidebar/header/content rhythm;
- inspect dashboard grid proportions;
- inventory common admin surfaces;
- compare responsive behavior;
- compare empty/loading/error coverage if present.

Forbidden uses:

- copying files;
- copying component APIs;
- copying custom form/table/dropdown/modal systems;
- copying hardcoded colors or class recipes;
- copying route structure as product architecture;
- treating ecommerce demo content as a Hassad requirement.

Any implementation inspired by TailAdmin must be rewritten using Hassad product contracts, shadcn primitives, and V2 tokens.

## 5. Product Gate

Before template or screen implementation, the following must be approved:

- workspace hierarchy;
- navigation groups;
- screen additions and removals;
- first vertical slice;
- role and permission behavior;
- Team/Marketing capability model;
- dark mode launch decision;
- deferred decisions that affect the first slice;
- required API gaps.

The approved product catalog is the authority. The legacy frontend is not.

## 6. Design-System Gate

Before screens, define the V2 design-system contract.

Required decisions:

- semantic color tokens;
- typography scale;
- spacing scale;
- radius scale;
- border and elevation rules;
- chart palette;
- status and priority language;
- dashboard density rules;
- table density rules;
- form structure rules;
- detail-page structure rules;
- confirmation and destructive-action rules;
- responsive behavior;
- English/LTR baseline with future localization support.

Rules:

- shared UI must use semantic tokens;
- no raw colors in shared TSX;
- no hardcoded visual values in shared UI unless tokenized first;
- no one-off card styles;
- no duplicate status badge implementations;
- no hidden per-page layout systems.

## 7. shadcn Gate

V2 UI must use shadcn primitives as the primitive source.

Before using a component:

1. Run project context through the shadcn tools or CLI.
2. Read the component docs.
3. Confirm the component exists in `apps/web-v2/src/components/ui`.
4. Compose from the primitive instead of creating a custom primitive.
5. Run the shadcn audit checklist after shared UI changes.

Required primitive families:

- button and command actions;
- field/form/input/select/checkbox/radio/switch/textarea;
- dialog/alert-dialog/sheet/drawer/popover/dropdown;
- sidebar/breadcrumb/tabs/pagination;
- card/badge/avatar/table/chart;
- skeleton/empty/alert/progress/tooltip;
- conversation primitives when messaging is built.

Custom shared components are allowed only above primitives, never instead of primitives.

## 8. Next.js Gate

Before Next.js implementation decisions:

- call the Next DevTools docs tool for the target project path and topic;
- use version-matched docs when available;
- call `nextjs_index` before runtime diagnosis or implementation verification;
- do not start a dev server just to satisfy the gate;
- if a dev server is started, clean it up before the task ends.

If version-matched docs are unavailable because dependencies are incomplete, report that fact instead of guessing silently.

## 9. Clean-Room Boundary

V2 must not import, copy, adapt, or extend from `apps/web`.

Allowed sources:

- `docs/FRONTEND_V2_PRODUCT_SURFACE_CATALOG.md`;
- `packages/shared/src`;
- API DTOs/controllers/modules;
- Prisma schema where business entities are needed;
- official Next.js documentation;
- official shadcn docs and registry items;
- TailAdmin only as visual/reference audit material.

Forbidden V2 dependencies:

- legacy frontend components;
- legacy frontend providers;
- legacy frontend CSS;
- legacy frontend route composition;
- legacy frontend copy and page hierarchy;
- old failed V2 template features unless explicitly re-approved.

## 10. Folder Ownership

`apps/web-v2` owns its own frontend system.

Expected structure:

- `src/app`: routes and route-level composition only;
- `src/components/ui`: shadcn primitives only;
- `src/components/app`: Hassad app shell and shared app patterns;
- `src/components/patterns`: reusable product patterns composed from shadcn;
- `src/features/<domain>`: feature-specific UI and data access;
- `src/lib`: low-level utilities and API transport;
- `src/hooks`: generic hooks only when they are not feature-owned;
- `src/test` or test colocations: tests for shared patterns and flows.

Rules:

- routes should not own reusable styling systems;
- feature components should not become global components accidentally;
- shared app patterns must have small APIs;
- fixtures must be separated from components;
- no demo-only feature tree remains in the production foundation.

## 11. Starter Template Scope

The starter template must first prove these reusable foundations:

- authenticated app shell;
- workspace-aware sidebar;
- topbar;
- account menu;
- notification dropdown;
- command/search entry;
- page scaffold;
- operational overview;
- dense queue/list;
- detail route;
- short edit dialog;
- side-sheet inspection;
- destructive confirmation;
- multi-step business flow;
- loading/empty/error/forbidden states.

Do not build all workspaces first. Build one vertical slice first.

## 12. First Vertical Slice

The first implementation slice is:

1. Login.
2. Authenticated shell.
3. Admin overview.
4. Employees list.
5. Employee detail.
6. Employee edit dialog.
7. Permission/forbidden states.

This slice must prove:

- route layout;
- auth state handling;
- permission-aware navigation;
- API envelope handling;
- loading and error states;
- reusable table/list pattern;
- reusable detail pattern;
- reusable form pattern;
- screenshot quality.

No second workspace starts before this slice is accepted.

## 13. UI Quality Rules

Every screen must answer real work questions:

- What needs attention?
- What is blocked?
- What is due soon?
- What changed recently?
- What can this user do now?
- What is unsafe or irreversible?

Avoid:

- decorative dashboards;
- filler export/save-view actions;
- fake metrics without product meaning;
- charts that do not support a decision;
- card grids that hide workflow priority;
- standalone state galleries;
- generic “admin template” copy.

## 14. State Coverage

Every applicable screen must handle:

- initial loading;
- background refresh;
- empty dataset;
- no filter results;
- partial failure;
- full error;
- unauthorized;
- forbidden;
- not found;
- inactive or archived record;
- stale data;
- offline/reconnecting where relevant;
- mutation pending/success/failure;
- preserved input after failed submission;
- unsaved changes;
- duplicate-submission prevention;
- destructive confirmation;
- pagination boundaries;
- permission-dependent commands;
- long English data.

States must be embedded in real surfaces, not isolated in a decorative showcase.

## 15. Data Rules

Use realistic dummy data only until API integration begins.

Rules:

- fixtures live outside UI components;
- status values come from `packages/shared/src` where available;
- business scores are never invented in the browser;
- API response envelopes are unwrapped once in transport code;
- feature code receives inner `data`;
- filters/search/sort/page state must be URL-addressable when bookmarkable;
- invalid state transitions are server-side behavior, not frontend-only logic.

## 16. Component Acceptance Rules

A shared pattern is accepted only when:

- it is composed from shadcn primitives;
- it has a small and clear API;
- it supports loading, empty, and error states where applicable;
- it supports permission-dependent commands;
- it avoids raw visual styling in TSX;
- it works with long labels and dense data;
- it has at least one realistic usage example;
- it can serve at least two screens or one critical workflow.

If a component serves only one feature, keep it inside that feature.

## 17. Screenshot Gate

Screenshots are required before expanding the template.

Check:

- desktop;
- tablet or narrow desktop;
- mobile;
- long text;
- empty state;
- error or forbidden state;
- open menu/dialog/sheet where relevant.

If screenshots reveal weak hierarchy, overlapping text, awkward density, or generic admin-demo feel, stop and fix the foundation before adding more pages.

## 18. Test Gate

The starter foundation must include:

- strict TypeScript;
- lint;
- component tests for shared patterns;
- integration tests for API transport behavior;
- accessibility checks for shell, dialogs, forms, and menus;
- Playwright tests for the first vertical slice.

Passing build alone is not enough.

## 19. Cleanup Rules

Failed or obsolete template work must be removed before rebuilding.

Keep:

- `apps/web-v2/src/components/ui`;
- shadcn-required support files such as `src/lib/utils.ts` and `src/hooks/use-mobile.ts`;
- app-level config;
- V2 global token source;
- approved product documentation.

Remove:

- demo routes;
- template-gallery routes;
- failed custom app patterns;
- generic fixture/data trees tied to failed demos;
- obsolete draft docs replaced by this execution contract.

Do not delete product source-of-truth docs unless they are explicitly superseded.

## 20. Stop Conditions

Stop implementation and report the blocker when:

- required MCP tools are unavailable;
- V2 shadcn project context is missing after scaffold;
- Next.js version-matched docs are unavailable for a decision that depends on changed APIs;
- the user has not approved a product decision that affects the first slice;
- a screen requires backend behavior that does not exist;
- the implementation starts drifting into one-off visual code.

## 21. Immediate Next Step

After this cleanup, the next allowed work is:

1. write the TailAdmin reference audit;
2. write the V2 design-system contract;
3. approve the first vertical slice;
4. only then implement the shell and first slice.

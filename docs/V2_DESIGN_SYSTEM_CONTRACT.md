# Hassad V2 Design System Contract

Status: Required before V2 screen implementation  
Depends on: `docs/V2_TEMPLATE_EXECUTION_RULES.md`  
Product source: `docs/FRONTEND_V2_PRODUCT_SURFACE_CATALOG.md`  
Reference filter: `docs/V2_TAILADMIN_REFERENCE_AUDIT.md`

## 1. When To Read This

Read this document before creating or changing:

- `apps/web-v2/src/app/globals.css`;
- app shell components;
- shared UI patterns;
- feature screens;
- page layouts;
- tables, forms, dialogs, sheets, or dashboards;
- status, priority, chart, or notification visuals.

Read order:

1. `docs/V2_TEMPLATE_EXECUTION_RULES.md`
2. `docs/FRONTEND_V2_PRODUCT_SURFACE_CATALOG.md`
3. `docs/V2_TAILADMIN_REFERENCE_AUDIT.md` if TailAdmin is involved
4. `docs/V2_DESIGN_SYSTEM_CONTRACT.md`
5. `docs/V2_FRONTEND_ARCHITECTURE_CONTRACT.md`
6. `.agents/skills/shadcn/SKILL.md`
7. shadcn component docs for the primitives being used
8. Next.js bundled docs for route/layout/API decisions

This contract decides how V2 UI is allowed to look and compose.

## 2. Design Goal

Hassad V2 is an operational SaaS interface, not a marketing site and not a generic admin demo.

The interface should feel:

- calm;
- dense but readable;
- workflow-oriented;
- permission-aware;
- consistent across workspaces;
- built for repeated daily use.

The UI should prioritize:

- queues;
- exceptions;
- approvals;
- due work;
- state changes;
- communication;
- financial clarity;
- delivery risk.

## 3. Token Ownership

The single token source is:

- `apps/web-v2/src/app/globals.css`

Rules:

- all shared styling decisions must resolve to semantic tokens;
- shared TSX must not contain raw colors;
- shared TSX must not contain one-off radii, shadows, or typography decisions;
- tokens must be named by role, not by one screen;
- TailAdmin color scales must not be copied;
- legacy `apps/web/app/globals.css` must not be read or copied.

Allowed token categories:

- base surface;
- text;
- border;
- focus;
- sidebar;
- muted/accent;
- destructive;
- success;
- warning;
- info;
- chart series;
- status surfaces;
- priority surfaces.

## 4. Color Rules

Use shadcn semantic tokens first:

- `background`;
- `foreground`;
- `card`;
- `card-foreground`;
- `popover`;
- `popover-foreground`;
- `primary`;
- `primary-foreground`;
- `secondary`;
- `secondary-foreground`;
- `muted`;
- `muted-foreground`;
- `accent`;
- `accent-foreground`;
- `destructive`;
- `destructive-foreground`;
- `border`;
- `input`;
- `ring`;
- `sidebar`;
- `sidebar-foreground`;
- `sidebar-accent`;
- `sidebar-border`.

Add product semantic tokens only when shadcn tokens are insufficient.

Required product token meanings:

- success;
- warning;
- info;
- neutral;
- pending;
- active;
- blocked;
- completed;
- cancelled;
- urgent.

Forbidden:

- raw Tailwind color classes in shared UI;
- TailAdmin names such as `brand-500` or `success-500`;
- per-status custom spans;
- manual dark-mode color overrides in TSX;
- large decorative gradients.

## 5. Typography Rules

V2 uses a compact product typography scale.

Use large display text only for public/auth pages if needed. Internal dashboards and tools should use smaller headings.

Required hierarchy:

- page title;
- section title;
- card title;
- row primary text;
- row secondary text;
- caption/help text;
- badge/status text.

Rules:

- no viewport-scaled font sizes;
- no negative letter spacing;
- long labels must wrap or truncate intentionally;
- cards and panels must not use hero-scale type;
- reusable UI should not embed business copy.

## 6. Spacing, Radius, And Elevation

Spacing must be consistent and quiet.

Rules:

- use `gap-*`, not `space-x-*` or `space-y-*`;
- use `size-*` for equal width and height;
- cards use restrained radius, normally no more than the shadcn default;
- do not nest cards inside cards;
- do not style page sections as floating cards;
- use elevation sparingly;
- no decorative orbs, blobs, bokeh, or generic gradient backgrounds.

Page sections should be full-width bands or unframed constrained layouts. Cards are for repeated items, tools, modals, and genuinely framed records.

## 7. Layout Contract

The V2 app must establish these layout families:

- public/auth layout;
- authenticated workspace shell;
- overview layout;
- queue/list layout;
- detail layout;
- form-flow layout;
- portal layout.

Rules:

- routes compose layouts; they do not invent layout systems;
- shell owns sidebar/topbar behavior;
- page scaffold owns title, breadcrumb, primary actions, and page states;
- detail pages own deep-linked complex records;
- dialogs are for short edits;
- sheets preserve list context for inspection;
- multi-step workflows use dedicated routes.

## 8. Shell Contract

Shell must support:

- workspace-aware sidebar;
- permission-aware nav items;
- collapsed desktop sidebar where approved;
- mobile sheet/drawer behavior;
- topbar with command/search;
- notification dropdown;
- account menu;
- breadcrumb where the route is deep;
- content region with stable width rules.

Implement shell from shadcn primitives:

- `Sidebar`;
- `Breadcrumb`;
- `Command`;
- `DropdownMenu`;
- `Avatar`;
- `Sheet`;
- `Tooltip`;
- `Button`.

Do not write a custom primitive sidebar system.

## 9. Component Layers

Allowed layers:

- `components/ui`: shadcn primitives only.
- `components/app`: app shell and global surfaces.
- `components/patterns`: reusable product patterns.
- `features/<domain>`: domain-specific components and screens.

Rules:

- shared patterns compose shadcn primitives;
- shared patterns have small APIs;
- feature-specific behavior stays in features;
- no shared pattern may encode one workspace as global truth;
- fixtures stay outside components.

## 10. Status And Priority Contract

Status and priority visuals must map to shared/backend values.

Initial sources:

- `TaskStatus`;
- `TaskPriority`;
- `ProjectStatus`;
- `ProjectPeriodStatus`;
- `MarketingStrategyStatus`;
- `InvoiceStatus`;
- `PaymentStatus`;
- `TicketStatus`;
- `UserRole`.

Rules:

- never create a one-off status badge per page;
- statuses use a shared mapping layer;
- status color means must remain stable across workspaces;
- labels are English-first in V2, with localization kept possible;
- Arabic labels from shared enums are not the initial layout driver.

Meaning groups:

- neutral: draft, todo, pending;
- active: active, in progress, sent;
- attention: in review, due, awaiting review;
- warning: late, suspended, revision requested, needs revision;
- success: paid, done, approved, completed;
- destructive: cancelled, rejected, failed, refunded where applicable;
- urgent: urgent priority and high-risk exceptions.

## 11. Data Surface Contract

Queues and tables must support:

- search;
- filters;
- sorting;
- pagination;
- empty state;
- no-results state;
- loading state;
- partial/full error state;
- forbidden state;
- row click or explicit open action;
- row-level actions;
- permission-dependent commands;
- long text;
- dense but readable rows.

Use shadcn `Table`, `Badge`, `Avatar`, `DropdownMenu`, `Button`, `Skeleton`, `Empty`, and `Pagination`.

Do not embed data arrays inside reusable table components.

## 12. Form Contract

Forms must use shadcn form primitives.

Required:

- `FieldGroup`;
- `Field`;
- `FieldLabel`;
- `FieldDescription`;
- `Input`;
- `InputGroup` where there are addons or inline buttons;
- `Select`;
- `Checkbox`;
- `RadioGroup`;
- `Switch`;
- `Textarea`.

Rules:

- short edits use `Dialog`;
- contextual inspection/editing uses `Sheet`;
- destructive or sensitive operations use `AlertDialog`;
- multi-step workflows use dedicated routes;
- dirty forms require unsaved-change handling;
- failed submissions preserve user input;
- duplicate submissions must be prevented.

## 13. Overview Contract

Overviews are decision surfaces.

Each overview must include only useful combinations of:

- attention queue;
- exceptions/risk;
- due soon;
- next actions;
- recent activity;
- compact KPI strip;
- trend chart if decision-relevant.

Do not build decorative dashboards. Charts must answer a business question.

## 14. Detail Contract

Complex records use dedicated detail routes.

Detail pages may include:

- identity summary;
- status and allowed actions;
- linked records;
- activity/history;
- comments/messages;
- files/attachments;
- financial or delivery context;
- timeline;
- tabs only when they reduce complexity.

Do not duplicate task, project, client, or finance detail patterns per workspace unless permissions require different commands.

## 15. State Contract

Every applicable surface must include:

- loading;
- empty;
- no filter results;
- partial error;
- full error;
- forbidden;
- not found;
- stale data;
- mutation pending;
- mutation success;
- mutation failure;
- unsaved changes;
- destructive confirmation;
- long-running operation progress.

States must be designed inside the real surface they affect.

## 16. Chart Contract

Charts are allowed only when they support decisions.

Rules:

- use shadcn Chart/Recharts patterns;
- chart colors use semantic chart tokens;
- charts need accessible labels or summaries;
- metric definitions come from backend/read-model contracts;
- browser code must not invent business scores;
- no decorative chart cards in the starter slice.

## 17. Screenshot Acceptance

Before expanding beyond the first vertical slice, capture and review:

- desktop shell;
- mobile shell;
- overview;
- list/queue;
- detail route;
- dialog;
- sheet;
- empty state;
- error or forbidden state;
- long text case.

Reject the slice if:

- hierarchy is unclear;
- text overlaps;
- controls resize awkwardly;
- density feels like a generic demo;
- actions do not map to product workflows;
- one-off styling appears in shared UI.

## 18. First Slice Design Scope

First slice:

1. Login.
2. Authenticated shell.
3. Admin overview.
4. Employees list.
5. Employee detail.
6. Employee edit dialog.
7. Permission/forbidden states.

The first slice must prove the design system. It is not a place to build every workspace.

## 19. Tooling Evidence

Before implementation, record:

- Next docs path used;
- shadcn project info;
- shadcn docs/components used;
- shadcn audit checklist result;
- lint/typecheck/test commands;
- screenshot review result.

Current verified baseline:

- Next project: `apps/web-v2`
- Next version: `16.3.0`
- Next docs path: `apps/web-v2/node_modules/next/dist/docs`
- shadcn style: `base-nova`
- shadcn base: `base`
- shadcn icons: `lucide`
- Tailwind: v4
- UI primitive path: `apps/web-v2/src/components/ui`

## 20. Relationship To Other Docs

- `V2_TEMPLATE_EXECUTION_RULES.md` controls sequence and stop conditions.
- `FRONTEND_V2_PRODUCT_SURFACE_CATALOG.md` controls product scope.
- `V2_TAILADMIN_REFERENCE_AUDIT.md` controls reference-template usage.
- `V2_FRONTEND_ARCHITECTURE_CONTRACT.md` controls code ownership, routing, data, auth, and state boundaries.
- This document controls UI design and composition.
- shadcn docs control primitive APIs.
- Next.js docs control App Router APIs.

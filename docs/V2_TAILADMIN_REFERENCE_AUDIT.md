# Hassad V2 TailAdmin Reference Audit

Status: Reference rules for V2 template work  
Depends on: `docs/V2_TEMPLATE_EXECUTION_RULES.md`  
Product source: `docs/FRONTEND_V2_PRODUCT_SURFACE_CATALOG.md`  
Reference source: `apps/free-nextjs-admin-dashboard-main`

## 1. When To Read This

Read this document before using TailAdmin as inspiration for V2 shell, dashboard, forms, charts, tables, auth, or template structure.

Do not read TailAdmin code in isolation. Read in this order:

1. `docs/V2_TEMPLATE_EXECUTION_RULES.md`
2. `docs/FRONTEND_V2_PRODUCT_SURFACE_CATALOG.md`
3. `docs/V2_TAILADMIN_REFERENCE_AUDIT.md`
4. `docs/V2_DESIGN_SYSTEM_CONTRACT.md`
5. `docs/V2_FRONTEND_ARCHITECTURE_CONTRACT.md`
6. shadcn component docs for the primitives being used

This audit decides what TailAdmin can influence. It does not authorize copying TailAdmin code.

## 2. Audit Summary

TailAdmin is useful as a mature admin-dashboard benchmark. It is not suitable as Hassad V2 architecture.

Strong reference value:

- shell rhythm;
- sidebar and header placement;
- admin page density;
- dashboard grid proportions;
- route groups for app and full-width pages;
- coverage of common admin surfaces;
- examples of charts, tables, auth, notification dropdowns, and profile screens.

High risk:

- custom primitives instead of shadcn;
- hardcoded style utilities;
- raw color scales in TSX and CSS;
- demo data embedded in UI components;
- generic ecommerce concepts;
- fixed sidebar widths and inline measurements;
- custom SVG icon system;
- generic pages that do not map to Hassad workflows.

Decision: TailAdmin may shape the benchmark, not the implementation.

## 3. Approved Inspiration

These TailAdmin patterns are allowed as inspiration after rewriting them through Hassad contracts and shadcn primitives.

| Area | What can influence V2 | Required V2 rewrite |
| --- | --- | --- |
| App shell | persistent sidebar, sticky header, content frame | shadcn `Sidebar`, semantic tokens, workspace-aware nav |
| Route grouping | app routes separated from full-width auth/error routes | Next App Router groups based on Hassad product areas |
| Dashboard density | grid with KPI, chart, table, and supporting panels | operational overview: attention, risk, next action, recent activity |
| Header utilities | search/command, notifications, account menu | command palette, notification dropdown, account menu from shadcn primitives |
| Tables | compact entity rows with status and avatar support | queue/list pattern with URL filters, permission actions, states |
| Auth pages | focused full-width sign-in/sign-up forms | Hassad auth flow with API contract, accessible fields, error handling |
| Chart isolation | client-side chart components where needed | shadcn Chart/Recharts boundary with business-owned definitions |
| Dark mode idea | dark mode can be supported by tokens | launch only if approved in product decisions |

## 4. Forbidden Copying

Never copy these from TailAdmin into V2:

- `src/components/ui/*` custom primitives;
- `src/components/form/*`;
- `src/layout/*`;
- `src/context/*`;
- `src/icons/*`;
- `menu-item` utility APIs;
- raw color names such as `brand-500`, `gray-800`, `success-500`;
- raw size formulas such as `w-[290px]`, `lg:ml-[90px]`, or dynamic inline heights;
- `space-y-*` patterns;
- demo ecommerce data;
- user/profile/order sample records;
- generic route names like `basic-tables`, `form-elements`, `ecommerce`;
- embedded SVG icon markup where lucide/shadcn primitives exist.

If a pattern seems useful, rebuild it from V2 primitives and name it for Hassad product behavior, not for TailAdmin's component names.

## 5. Specific Findings

### 5.1 Shell

TailAdmin shell shows a useful admin rhythm:

- left sidebar;
- top header;
- content area with constrained max width;
- mobile overlay behavior;
- collapsed desktop sidebar.

Problems to avoid:

- sidebar state is custom context without a product navigation model;
- fixed widths are embedded in layout code;
- active state styling depends on custom CSS utilities;
- submenu height uses inline measurements;
- nav is route-demo driven, not permission/workspace driven.

V2 decision:

- shell must be composed from shadcn `Sidebar`, `Breadcrumb`, `Command`, `DropdownMenu`, `Sheet`, `Tooltip`, and `Avatar`;
- navigation data comes from product workspace definitions and permissions;
- shell tokens live in `apps/web-v2/src/app/globals.css`;
- collapsed and mobile behavior must be tested with screenshots before page expansion.

### 5.2 Navigation

TailAdmin groups navigation into main and secondary sections. This is useful because Hassad has multiple dense workspaces.

V2 navigation must be:

- workspace-aware;
- permission-aware;
- URL-aware;
- capable of attention counts;
- capable of global utilities without duplicating workspace items.

Do not copy TailAdmin groups. Use the product catalog:

- Admin: Overview, People and Access, Clients, Commercial, Delivery, Finance Supervision, Reports, System.
- Sales: Overview, Pipeline, Requests, Clients, Proposals, Contracts.
- PM: Overview, Projects, Tasks, Revisions, Disputes.
- Team: My Work, My Tasks, Messages.
- Marketing additions: Campaigns, Marketing Strategies.
- Finance: Overview, Invoices, Payments, Clients, Contracts, Ledger, Payroll.
- Client Portal: Home, Profile, Projects, Campaigns, Deliverables, Requests, Proposals and Contracts, Finance, Disputes.

### 5.3 Dashboard

TailAdmin's dashboard grid is visually useful, but the content is ecommerce-demo oriented.

V2 overviews must not be decorative dashboards. They must answer:

- what needs attention now;
- what is late, blocked, stale, or risky;
- what is due next;
- which records need approval;
- what changed recently;
- where the user should go next.

Charts are secondary unless they directly support one of those decisions.

### 5.4 Tables And Queues

TailAdmin's table demonstrates density, row avatars, status badges, and horizontal overflow.

V2 queue pattern must add:

- URL-addressable filters/search/sort/page;
- loading, empty, error, forbidden, and no-results states;
- row-level actions governed by permissions;
- status/priority from shared enums;
- stable column definitions;
- side-sheet inspection when the list should remain open;
- detail route navigation for complex records.

Do not embed row data inside table components.

### 5.5 Forms

TailAdmin forms show useful coverage of inputs, but implementation is custom and does not follow V2 shadcn rules.

V2 forms must use:

- `FieldGroup`;
- `Field`;
- `FieldLabel`;
- `FieldDescription`;
- `Input`;
- `InputGroup`;
- `Select`;
- `Checkbox`;
- `RadioGroup`;
- `Switch`;
- `Textarea`;
- `AlertDialog` or `Dialog` for confirmations.

Short edits use dialogs. Multi-step workflows use dedicated routes.

### 5.6 Notifications And Account Menu

TailAdmin validates the need for topbar utilities.

V2 notification dropdown must follow the product catalog:

- unread count;
- latest notifications ordered by time;
- loading, empty, error, reconnecting, newly-arrived states;
- mark one as read;
- mark all as read;
- open related entity;
- open full Notifications screen.

Do not use static notification arrays.

### 5.7 Styling

TailAdmin centralizes many tokens in CSS, which is a useful direction. The problem is that it also exposes large raw color scales and custom utilities that encourage one-off styling.

V2 decision:

- keep tokens semantic;
- keep theme source in `apps/web-v2/src/app/globals.css`;
- do not create TailAdmin-style utility APIs for product components;
- do not allow shared TSX to choose raw color shades.

## 6. TailAdmin Benchmark Checklist

When building a V2 surface inspired by TailAdmin, check:

- Does the surface map to the product catalog?
- Is every copied idea rewritten with shadcn primitives?
- Are all colors semantic?
- Are fixtures outside components?
- Is navigation permission-aware?
- Are states embedded in the real surface?
- Does the UI still work with long English labels?
- Is the screenshot better than TailAdmin for Hassad's actual workflow?
- Did the implementation avoid TailAdmin file, component, and token names?

If any answer is no, stop and fix the foundation before adding more screens.

## 7. Relationship To Other Docs

- `V2_TEMPLATE_EXECUTION_RULES.md` controls whether work may start.
- `FRONTEND_V2_PRODUCT_SURFACE_CATALOG.md` controls what the UI must support.
- `V2_DESIGN_SYSTEM_CONTRACT.md` controls allowed visual and component decisions.
- `V2_FRONTEND_ARCHITECTURE_CONTRACT.md` controls route, feature, data, auth, and state boundaries.
- shadcn docs control primitive APIs.
- Next.js bundled docs control App Router APIs.

This audit is only a filter for reference-template usage.

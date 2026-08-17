# Hassad Frontend V2 Product Surface Catalog

Status: Draft for product and UX approval  
Language baseline: English, left-to-right  
Implementation status: Planning only; this document does not authorize UI implementation

## 1. Purpose

This document defines the product workspaces, screens, information, actions, forms, transient interactions, and required states for Hassad Frontend V2.

It deliberately does **not** reuse the current frontend's components, layout hierarchy, visual composition, page content arrangement, or design-system wrappers. The current frontend contributes only its page and route names. Business requirements are derived from the backend modules, permissions, DTOs, state machines, and Prisma entities.

Reusable UI patterns must be extracted later from this approved screen catalog. They must not be invented before the product surfaces are understood.

## 2. Sources of truth

The catalog was reviewed against:

- Current named routes in `apps/web/app`.
- Roles and departments in `packages/shared/src/enums/roles.ts`, `packages/shared/src/enums/project.ts`, and Prisma seed data.
- Backend controllers, DTOs, permissions, and state transitions in `apps/api/src/modules`.
- Database entities and relationships in `apps/api/prisma/schema.prisma`.
- The official shadcn project context and component documentation for interaction feasibility only.

Current frontend screen implementations were excluded from the product-content and UX decisions.

## 3. Firm product and information-architecture decisions

### 3.1 A dashboard is an overview, not the entire workspace

Each internal persona receives one decision-oriented overview. Lists, detail pages, work queues, configuration, and reports are workspace screens, not additional dashboards.

Overview screens prioritize:

- work requiring attention;
- risk and exceptions;
- progress toward outcomes;
- time-sensitive events;
- the user's next actions.

They must not become collections of decorative or vanity charts.

### 3.2 Designer is not a separate workspace

Designer is a Team member in the `DESIGN` department. The current `/dashboard/designer` concept must not become a V2 dashboard.

The Team work experience covers these departments:

- Design;
- Content;
- Development;
- Marketing;
- Production.

Department controls task assignment, terminology, filters, file purpose, and optional tools. It does not create a separate application shell or duplicate task product.

### 3.3 Marketing extends Team work

Marketing users receive the same core Team experience:

- personal work overview;
- assigned tasks;
- task workflow;
- comments;
- files;
- notifications;
- chat.

Marketing permissions add:

- campaigns;
- campaign KPI management;
- optimization flags;
- marketing strategies;
- strategy submission and resubmission;
- client approval and revision tracking.

This is one delivery-team product with capability-based extensions, not two unrelated frontend systems.

### 3.4 PM remains a separate management workspace

PM is not simply a Team department. PM owns project-level coordination:

- project state;
- project membership;
- periods;
- task creation and assignment;
- review and revision decisions;
- deliverables;
- meetings and calls;
- client-facing summaries and reports;
- disputes and delivery risk.

### 3.5 Permissions determine capability

Role selects a default workspace. Permissions determine visible data and available commands. Department refines the work context. The frontend must not use role strings as the only authorization mechanism.

### 3.6 English and LTR are the V2 baseline

V2 is designed and reviewed first in English and LTR. The implementation must still be localization-ready:

- no embedded business copy in reusable UI;
- locale-aware dates, numbers, and currencies;
- no physical-direction assumptions in reusable layout code;
- Arabic and RTL are a later validation mode, not the initial design constraint.

## 4. Workspace map

| Workspace | Primary users | Purpose |
| --- | --- | --- |
| Admin | Administrators | Organization oversight, exception handling, access, configuration, audit, and system health |
| Sales | Sales staff | Move prospects from lead/request through proposal and contract |
| Project Management | Project managers | Coordinate projects, periods, people, delivery, reviews, meetings, and client issues |
| Team Work | Design, Content, Development, Production, and Marketing staff | Execute assigned work through the task lifecycle |
| Marketing capability extension | Marketing department/users | Add campaign and strategy operations to Team Work |
| Finance | Accountants and finance staff | Operate invoices, payments, receivables, ledger, and payroll |
| Client Portal | Clients | Track delivery, take approvals, pay invoices, communicate, and submit requests |

## 5. Interaction allocation rules

These rules identify where an interaction belongs. They do not define reusable component names.

| Interaction | Required presentation |
| --- | --- |
| Short edit with a small number of fields | Dialog |
| Supporting contextual inspection that should preserve the current list | Side sheet on desktop; drawer on small screens |
| Destructive, irreversible, financial, security, or forced-state operation | Explicit confirmation dialog with impact and reason where applicable |
| Multi-step, document-heavy, line-item, or payment-plan workflow | Dedicated route/screen; never a large modal |
| Lightweight selection, menu, or short contextual information | Popover or menu |
| Complex entity with history, comments, files, or deep linking | Dedicated detail route |

All dialogs, sheets, and drawers require an accessible title. Closing a dirty form requires an unsaved-changes warning.

## 6. Global product surfaces

### 6.1 Notification dropdown

Content:

- unread count;
- latest notifications ordered by time;
- notification type, title, summary, timestamp, read state, and destination;
- loading, empty, error, reconnecting, and newly-arrived states.

Actions:

- open related entity;
- mark one as read;
- mark all as read;
- open the full Notifications screen;
- receive real-time items without refreshing.

The dropdown is a short recent-items surface. Search, older history, filtering, and bulk operations belong on the Notifications screen.

### 6.2 Account menu

Content:

- avatar;
- name and email;
- current workspace/role;
- account link;
- language option when localization ships;
- theme option if dark mode is approved;
- sign out.

### 6.3 Global system states

- session expired and reauthentication;
- unauthorized and forbidden;
- not found;
- offline and reconnecting where real-time behavior exists;
- success and failure feedback;
- secure file preview/download;
- unsaved changes;
- long-running operation progress.

## 7. Public and authentication screens

| Screen | Information | Actions and transient interactions |
| --- | --- | --- |
| Home | Product entry content or authenticated-user routing | Sign in, sign up, route authenticated users to their correct workspace |
| Login | Email, password, authentication errors, optional Google authentication | Submit, show/hide password, forgot password, Google sign-in |
| Sign Up | Name, email, password, confirmation, accepted account type and terms | Validate, create account, show verification/success outcome |
| Forgot Password | Email and security-safe result message | Request reset link, return to login |
| Reset Password | Token state, new password, confirmation | Validate token, update password, return to login |
| Public Proposal | Proposal identity, client/request, service and price breakdown, validity, document, current state | View/download, approve, request revision with mandatory notes |
| Public Contract | Contract identity, parties, values, dates, document/version, payment schedule, signature state | View/download, enter signer identity, confirm signature, handle invalid or expired token |

The current Design System route is not a production screen and must not be migrated. The future template/component laboratory is defined after this catalog is approved.

## 8. Shared staff screens

| Screen | Information | Actions and transient interactions |
| --- | --- | --- |
| Account | Personal identity, avatar, email, phone, role, department, security information | Edit permitted fields, upload avatar, change password, revoke own sessions; missing account APIs must be added before implementation |
| Notifications | Paginated notification history, read state, type, time, related entity | Filter read/unread, mark selected or all read, open destination |
| Messages | Conversation list, direct and project/group conversations, participants, messages, attachments, delivery time | Search/select conversation, start permitted conversation, send message/files, add/remove participants where permitted, load older messages |
| Task Detail | Task, project, period, department, assignee, priority, due date, client visibility, workflow, history, comments, files | Start, submit, approve/reject by permission, change status, edit, assign, archive, comment, manage files |

The task detail is one business capability. It must not be reimplemented per department.

## 9. Admin workspace

### 9.1 Navigation organization

- Overview
- People & Access
- Clients
- Commercial
- Delivery
- Finance Supervision
- Reports
- System

### 9.2 Overview

| Screen | Information | Actions and transient interactions |
| --- | --- | --- |
| Admin Overview | Organization health for a selected period; revenue, clients, projects, tasks, requests, contracts, invoices, funnel, trends, stalled work, disputes, workload, recent activity, system risk, AI insights, and business goals | Change range/comparison, drill into source records, run AI scan, refresh, manage business goals |

All metric definitions are authoritative backend read models. The browser must not invent business scores.

### 9.3 People and access

| Screen | Information | Actions and transient interactions |
| --- | --- | --- |
| Employees | Name, email, role, departments, active/suspended state, last activity, workload summary | Search/filter/sort/page, create employee, bulk action, open detail |
| Employee Detail | Identity, contact, role, departments, state, performance, workload, assignments, recent activity | Edit, change role/department, suspend/reactivate with reason, reset password, revoke sessions, impersonate with mandatory reason |
| Employee Activity | Paginated business and administrative actions for one employee | Filter by date/action/entity, inspect source record |
| Employee Permissions | Role-derived permissions and direct user grants/revocations grouped by domain | Search, grant/revoke, compare with role defaults, review and save |
| Employee Sessions | Current and historical sessions for one employee, including device, browser, IP, created, last used, and expiry | Revoke one or all sessions |
| Roles | Role list, member count, permission count, system/custom state | Create/edit role, assign grouped permissions, inspect affected users |
| Departments | Department list, member count, active work count | Create/edit department, assign users; deletion requires an explicit reassignment policy |
| Sessions | Sessions across the organization | Search/filter, inspect user, revoke session |
| Security | Security-event totals and stream by type, severity, actor, IP, and date | Filter, inspect event, open related employee/session |
| Audit | Immutable action log with actor, action, entity, before/after values, metadata, and time | Filter, inspect structured change, export |

Required sensitive-operation confirmations:

- suspension/reactivation;
- password reset;
- session revocation;
- impersonation;
- permission escalation;
- role change.

### 9.4 Clients

| Screen | Information | Actions and transient interactions |
| --- | --- | --- |
| Clients | Totals, status, company, business identity, manager, portal access, projects, contract value, balance, profile completeness | Search/filter/sort/page, create, assign manager, suspend/reactivate, open detail |
| Client Detail | Company/contact identity, manager, status, linked user, profile/intake summary, portal state, relationship summary, satisfaction, current commercial and delivery records | Edit permitted fields, assign manager, suspend/reactivate, regenerate portal token, enable/disable portal access |
| Client Projects | Client projects with state, PM, progress, dates, current period | Filter and open project |
| Client Contracts | Contracts with value, dates, state, payment plan, signature state | Filter and open contract |
| Client Invoices | Invoices with total, paid, outstanding, due date, and state | Filter and open invoice |
| Client History | Lifecycle history with actor, event, description, metadata, and time | Filter by event/date, open related entity |

### 9.5 Commercial oversight

| Screen | Information | Actions and transient interactions |
| --- | --- | --- |
| Leads | Stage statistics, stale leads, company/contact, source, owner, services, last contact, next action | Search/filter, list/pipeline view, create, assign, record contact, change stage, manage services, convert, deactivate |
| Lead Detail | Complete lead identity, services, assignment, contact history, pipeline history, age, notes, linked client/request where created | Edit, reassign with reason, record contact, change/force stage by permission, convert to client |
| Requests | Request status, company/client, contact, requested services, owner, age, last update | Search/filter, show stale, reassign, force status with reason, update notes, open detail |
| Request Detail | Contact/business data, services and quantities, assignment, status history, contact log, notes, linked proposal/contract/project | Record contact, reassign, force status with reason, update notes, begin proposal flow |
| Proposals | Status counts, request/client, creator, value/services, sent/response dates, validity | Search/filter, inspect, convert approved proposal to contract |
| Proposal Detail | Document, request/client, services/prices, status, response notes, audit information | View/download, convert to contract, open related records |
| Contracts | Status, type, client/request/proposal, total/monthly value, dates, signing, activation, renewal risk | Search/filter, change state with reason, cancel, trigger renewal, open detail |
| Contract Detail | Document versions, parties, terms, values, dates, payment schedule, invoices, signature, history, linked project | Intervene in state, cancel, trigger renewal, convert to project, inspect versions/schedule |

Lead Detail is promoted from an in-page inspection to a dedicated route because contact history, stage history, services, ownership, and conversion make it a bookmarkable workflow.

### 9.6 Delivery oversight

| Screen | Information | Actions and transient interactions |
| --- | --- | --- |
| Projects | Name, client, PM, state, dates, progress, current period, team size, task/deliverable health, archived state | Search/filter, create, assign/reassign PM, archive/unarchive, force state with reason |
| Project Detail | Identity, client, contract, PM, state, dates, overall completion, current period, operational health | Edit allowed data, assign PM, intervene in state, navigate project records |
| Project Periods | Period sequence, dates, state, completion, goals, report, meetings, billing relationship | Generate, open/close, extend, add extra period, open period detail |
| Project Period Detail | Period goals, completion, tasks, deliverables, campaigns/KPIs, files, meetings, invoice state, summary, report, history | Edit goals/summary/completion, schedule/update meeting, upload/download report, open/close/extend period |
| Project Tasks | Tasks by state, department, assignee, priority, due date, period | Filter, create, reassign, force transition with reason, open detail |
| Project Deliverables & Revisions | Deliverables and revision requests by project, task, period, state, and client decision | Filter, inspect, navigate to source; admin intervention commands require explicit API contracts |
| Project Team | PM and members with project role, department, workload, active task count | Add member, change responsibility where supported, remove with confirmation |
| Project Finance | Contract value, payment schedule, scheduled/issued/paid amounts, invoices, payments, overdue state | Inspect and navigate; mutations remain in Finance unless intervention permission applies |
| Project Timeline | Project, period, task, deliverable, meeting, file, and administrative events | Filter by type/date, inspect source |
| Tasks | All organization tasks with project, period, department, assignee, state, priority, due date | Search/filter, reassign with reason, force transition with reason, open detail |
| Disputes | Ticket, client, project, PM, category, priority, state, age, escalation | Search/filter, inspect PM context, open detail |
| Dispute Detail | Complaint, participants, client/project context, messages, attachments, state history, proposed resolution | Approve, reject, change PM, send internal/client-visible message, close with reason |

Each project period owns:

- period identity and boundaries;
- lifecycle state;
- completion;
- goals;
- tasks;
- deliverables and client decisions;
- campaigns and KPI summaries;
- files;
- meetings/calls;
- related invoice and billing state;
- PM summary;
- final report;
- period history.

### 9.7 Finance supervision

| Screen | Information | Actions and transient interactions |
| --- | --- | --- |
| Admin Finance Overview | Organization financial health, gateway health, overdue exposure, failed payments/webhooks, alerts | Refresh, run gateway health check, drill into exception queues |
| Admin Invoices | Invoice, client, total, paid/outstanding, due date, state, method | Search/filter, force state with reason, write off, refund with amount and reason |
| Admin Payments | Payment, invoice/client, amount, method, gateway, state, receipt, reference, time | Search/filter, inspect event history |
| Payment Events | Gateway event, payment, sanitized payload summary, processing state, error, time | Filter and inspect |
| Webhook Logs | Provider/event, received time, processing state, attempts, response/error | Search/filter, inspect sanitized data, retry with reason |
| Payment Gateways | Provider, enabled/environment state, methods, currencies, public availability, health, bank accounts | Configure/test, enable/disable, delete with confirmation, manage bank accounts |

Admin Finance is for supervision and exceptional intervention. Routine invoices, payments, receivables, ledger, and payroll belong to the Finance workspace.

### 9.8 Reports and system

| Screen | Information | Actions and transient interactions |
| --- | --- | --- |
| Reports | Sales, revenue, projects, team, satisfaction, campaigns, leads, clients, and system-health reports | Date range, comparison, report selection, snapshot generation/history, export |
| Health | Overall health, database/memory, services, response time, unresolved errors, history | Refresh, filter errors, inspect safely, resolve error, review history |
| Integrations | Ad-platform connections, gateway summary, sync state, webhook status | Refresh, inspect, retry failure, open configuration |
| AI | Providers, active state, models, priority, rate/token limits, configuration; AI conversations | Create/edit/remove provider, fetch/test models, create/delete conversation, stream assistant message |
| Settings | Company settings and safe defaults | Edit grouped settings, save section, restore/seed defaults with confirmation |
| Services | Service catalog, category, price/availability metadata, active state, deliverable templates | Create/edit/deactivate service, manage deliverable templates |
| Notification Templates | Event type, channels/content, active state, update history, delivery logs | Search, edit template, inspect logs, preview with sample data when API support exists |
| Currencies | Code, label, symbol/SVG, formatting, default and active state | Search, create, edit, set default when supported, deactivate/delete with impact warning |
| New Currency | Code, name, symbol type/value or SVG, formatting, default state | Validate uniqueness, upload SVG, create |
| Currency Detail | Existing configuration and usage implications | Edit, replace SVG, deactivate/delete with impact warning |

Feature flags, backups, automation, environment data, and system-event administration remain explicitly deferred until the product owner decides whether they are production UI or operator-only tooling.

## 10. Sales workspace

### 10.1 Navigation organization

- Overview
- Pipeline
- Requests
- Clients
- Proposals
- Contracts

### 10.2 Screens

| Screen | Information | Actions and transient interactions |
| --- | --- | --- |
| Sales Overview | User-scoped pipeline metrics, stale opportunities, follow-ups, meetings, proposals, contracts, conversion, value, recent activity | Change period, drill into queue, open next action |
| Pipeline | Leads grouped by server-defined stage with company, contact, services/value, owner, age, last/next contact | Search/filter, drag/change stage with server validation, create, assign, log contact, convert |
| Clients | Sales-visible clients with state, contact, manager, latest request, commercial activity | Search/filter, create, create request for client, open detail |
| Client Detail | Company/contact, business profile, activity, requests, proposals, contracts, handover state | Edit permitted information, record activity, create request, hand over |
| Requests | Sales-visible requests with state, age, contact, services, owner | Search/filter, record contact, change valid state, open detail |
| New Request | Prospect/client, company/contact, business type/source, services, quantity, notes, review | Complete dedicated multi-step flow and submit |
| Request Detail | Business/contact, services, state/history, contact log, notes, related proposal | Change state, record contact, begin proposal |
| Proposals | Proposals by state, client/request, amount, dates | Search/filter, start proposal creation, send, open detail |
| New Proposal | Request/client context, service/price breakdown, validity/notes, PDF, final review | Complete dedicated flow, save draft if API support is added, create |
| Proposal Detail | Document, services/prices, client/request, response and notes | Edit draft, replace document when supported, send, open related records |
| Contracts | Contracts by state, client, value, signing, activation, payment-plan completeness | Search/filter, start contract creation, send, open detail |
| New Contract | Request/proposal, title/type, dates, values, down payment, payment schedule, PDF, review | Complete dedicated flow and create |
| Contract Detail | Document/versions, dates/values, payment schedule, signature, activation, invoices | Edit draft, create version, manage schedule, send, sign, activate/cancel, generate invoice |

Commercial lifecycle language must stay consistent:

1. Lead: early prospect or interest.
2. Request: formal service need/opportunity.
3. Proposal: commercial offer.
4. Contract: accepted legal/commercial agreement.
5. Project: delivery created from an activated contract.

## 11. Project Management workspace

### 11.1 Navigation organization

- Overview
- Projects
- Tasks
- Revisions
- Disputes

### 11.2 Screens

| Screen | Information | Actions and transient interactions |
| --- | --- | --- |
| PM Overview | Assigned projects/current periods, delivery risk, overdue/in-review tasks, revisions, upcoming meetings, disputes, workload | Filter by project/period, open urgent or next action |
| Projects | Assigned projects with state, client, current period, progress, overdue work, next milestone | Search/filter, open project, create only if permitted |
| Project Detail | Project identity/health, current period, delivery overview, client/team/contract context | Manage allowed project operations and navigate detailed work |
| Period Detail | Goals, completion, tasks, deliverables, campaigns/KPIs, files, meetings, invoice state, summary, report, history | Manage period operations and client-facing output |
| Tasks | PM-visible tasks with state, assignee, department, priority, due date, period | Search/filter, list/Kanban, create, assign, approve/reject, open detail |
| Task Detail | Task data, history, comments, files, assignee, project/period | Edit, assign, approve, return for revision, comment, manage files |
| Revisions | Project and deliverable revision requests with project, client, type, state, age | Filter, inspect, create/assign follow-up work, record resolution |
| Disputes | Assigned disputes with priority, state, client/project, response age | Filter, acknowledge, open detail |
| Dispute Detail | Complaint, context, thread, attachments, history | Acknowledge, reply, upload files, propose resolution |

Project Detail and Period Detail are separate because a period contains enough goals, tasks, meetings, files, billing, and reporting information to require a stable deep link.

## 12. Team Work and Marketing extension

### 12.1 Base Team navigation

- My Work
- My Tasks
- Messages

Notifications and Account remain global utilities.

### 12.2 Marketing additions

- Campaigns
- Marketing Strategies

These entries appear only when capabilities allow them.

### 12.3 Base Team screens

| Screen | Information | Actions and transient interactions |
| --- | --- | --- |
| My Work Overview | Personal task totals, today's work, overdue, in-review, revision, upcoming deadlines, recent comments, blocked items | Filter by project/state/priority, open task, start next task |
| My Tasks | Assigned tasks with project, period, department, state, priority, due date, last activity | Search/filter/sort, list/Kanban, open task |
| Task Detail | Task, permitted project/client context, description, priority, due date, workflow, comments, files | Start, submit, respond to revision, comment, manage files |

Department-specific behavior remains inside the task contract:

- Design: working files, references, final deliverables.
- Content: drafts, review files, final content.
- Development: implementation references and deliverable files.
- Production: source media, drafts, final output.
- Marketing: campaign and strategy relationships.

No department gets a duplicated task page.

### 12.4 Marketing capability screens

| Screen | Information | Actions and transient interactions |
| --- | --- | --- |
| Campaigns | Campaigns by client, project, task, platform, state, dates, budget, current KPI health, optimization flag | Search/filter, create from eligible task, open detail, archive/unarchive by permission |
| Campaign Detail | Identity/context, platform, dates, budget, current state, optimization flag, current metrics, KPI history, audit | Edit, start/pause/stop/end, add KPI snapshot, change metric range, duplicate, flag optimization, archive |
| Marketing Strategies | Strategy document, project/task/client, version, state, sent date, client action age | Search/filter, open detail, download |
| Marketing Strategy Detail | Strategy PDF, task/project context, version/status, client response and revision history | Upload initial strategy where task permits, send, resubmit revised PDF, download |

Marketing Overview is not a separate dashboard. Marketing users receive My Work Overview with additional campaign/strategy attention sections, such as:

- campaigns needing optimization;
- missing or stale KPI updates;
- strategy revision requests;
- strategies awaiting client decision;
- marketing tasks due soon.

## 13. Finance workspace

### 13.1 Navigation organization

- Overview
- Invoices
- Payments
- Clients
- Contracts
- Ledger
- Payroll
- Payment Issues, if the ticket workflow remains in product scope

### 13.2 Screens

| Screen | Information | Actions and transient interactions |
| --- | --- | --- |
| Finance Overview | Revenue, invoiced/paid/outstanding, aging, cash flow, payment methods, top clients, trend, alerts, required actions | Change range/comparison, drill into records |
| Clients | Client financial totals, contract value, invoiced, paid, outstanding, overdue, last payment | Search/filter, open detail |
| Client Finance Detail | Financial summary, contracts, invoices, payments, aging, payment issues | Create invoice, register payment, open record |
| Contracts | Commercial values and scheduled/issued/paid billing | Search/filter, inspect billing completeness, open detail |
| Contract Finance Detail | Terms, payment schedule, billing summary, invoices, payments | Generate invoice, open invoice/payment |
| Invoices | Number, client, contract, total, paid/outstanding, issue/due date, state, method | Search/filter, start invoice creation, send, remind, record payment, open detail |
| New Invoice | Client, optional contract, dates, method, line items, related project/task, totals, notes, review | Complete dedicated creation flow |
| Invoice Detail | Header, client/contract, line items, totals, dates, state, payments, outstanding | Edit supported data, send, remind, record payment |
| Payments | Invoice/client, amount, method, reference, receipt, state, date | Search/filter, register manual payment, inspect receipt/invoice |
| Ledger | Immutable financial events with action, entity, actor, before/after, date | Search/filter, inspect, export |
| Payroll | Employees, pay type, base compensation, monthly state, totals | Select period, preview, run, pay all, create/edit/deactivate employee |
| Employee Payroll Detail | Compensation configuration and salary history | Edit compensation/bonuses/deductions/notes, pay individual salary |
| Payment Issues | Invoice/client, assignee, state, notes, age | Search/filter, create issue, assign, inspect, resolve |

Invoice creation and payroll runs are dedicated flows. Financial forms must prevent duplicate submission and clearly separate calculated totals from editable values.

## 14. Client Portal

### 14.1 Navigation organization

- Home
- Actions
- Projects
- Campaigns
- Deliverables
- Requests
- Commercial
  - Proposals
  - Contracts
  - Invoices
- Reports
- Support
  - Chat
  - Disputes
- Business Profile

### 14.2 Home and action center

| Screen | Information | Actions and transient interactions |
| --- | --- | --- |
| Portal Home | Active projects/progress, contracts, invoices/outstanding, campaigns, action items, recent activity, assigned team contacts | Open record/action, contact team member |
| Actions | Approvals, revisions, due invoices, contracts/proposals awaiting action, upcoming meetings, unresolved disputes | Filter by type/urgency, act, snooze/unsnooze |
| Notifications | Client notification history | Filter, mark one/all read, open destination |
| Chat | Conversations with account manager, PM, and project groups | Select/start permitted conversation, send message/files, load history |
| Account | Login identity and security | Update supported identity, change password, manage sessions; API completion required |

### 14.3 Business profile and onboarding

| Screen | Information | Actions and transient interactions |
| --- | --- | --- |
| Business Profile | Business identity, product, audience, brand voice, journey, campaigns, performance, budget, visual assets | Edit supported sections and assets |
| Profile Setup | Initial intake with saved draft, current step, completion, and review | Navigate steps, autosave, upload assets, review, submit |

Intake sections:

1. Business identity and industry.
2. Product story, description, value proposition, advantages, benefits.
3. Customer analysis and FAQs.
4. Brand voice, boundaries, slogan, presentation style.
5. Customer journey, order methods, follow-up tools.
6. Campaign goals, offer, season, competitors.
7. Past performance and tracking setup.
8. Budget, previous reports, and visual identity assets.
9. Review and submission.

The backend's `currentStep` range and final review convention must be normalized before implementation.

### 14.4 Projects and periods

| Screen | Information | Actions and transient interactions |
| --- | --- | --- |
| Projects | Project state, PM, dates, progress, current period, pending client action | Search/filter, open detail |
| Project Detail | Identity, PM/team, overall progress, periods, visible work, campaigns, deliverables, next meeting, financial summary | Open period/action, join meeting, navigate related record |
| Period Detail | Period goals/progress, visible tasks, deliverables, campaign KPI summary, files, meetings, invoice state, PM summary/report | Join meeting, download permitted files/report, review related output |
| Reports | Client-facing KPIs, top campaigns, platform distribution, trends, insights, available period reports | Select range/granularity, inspect campaign, download report |

The client sees the same period truth as PM, restricted to client-visible fields and commands.

### 14.5 Campaigns and strategies

| Screen | Information | Actions and transient interactions |
| --- | --- | --- |
| Campaigns | Campaigns by project, platform, state, dates, budget, headline performance | Filter and open detail |
| Campaign Detail | Overview, budget/spend, KPI totals/trends, state history, related project | Change range, open project/report |
| Marketing Strategies | Project/task, version, state, sent date, required client action | Filter, download, open detail |
| Marketing Strategy Detail | Strategy PDF, project/task context, version/state, response history | Download, approve, request revision with mandatory explanation |

### 14.6 Deliverables

| Screen | Information | Actions and transient interactions |
| --- | --- | --- |
| Deliverables | Project, task, period, state, required client action | Search/filter, open detail |
| Deliverable Detail | Title/description, source task/project, secure file, state, revisions, decision history | Approve, reject with reason, request revision with explanation |

### 14.7 Requests and new orders

| Screen | Information | Actions and transient interactions |
| --- | --- | --- |
| Requests | Services, created date, state, progress, linked proposal/contract/project | Search/filter, open detail |
| Request Detail | Submitted services/quantities/notes, state history, commercial and delivery links | Navigate linked records; cancellation/amendment requires a backend rule before UI |
| New Order | Service catalog, selection, quantities, per-service notes, business-profile readiness, general requirements, review | Complete dedicated multi-step flow and submit |

Request creation currently has no attachment contract. Attachments must not appear until the API supports and secures them.

### 14.8 Proposals and contracts

| Screen | Information | Actions and transient interactions |
| --- | --- | --- |
| Proposals | Request, value, state, created/sent dates, action required | Filter, open detail |
| Proposal Detail | Document, services/prices, validity, response state/history | Download, approve, request revision |
| Contracts | Type, value, dates, state, signature, payment-plan progress | Filter, open detail |
| Contract Detail | Document/version, terms, payment schedule, invoices, signature/activation state | Download, sign when permitted, open/pay invoice |

### 14.9 Finance

| Screen | Information | Actions and transient interactions |
| --- | --- | --- |
| Finance Summary | Total invoiced, paid, remaining, next due invoice, recent invoices/payment state | Open invoice, start payment |
| Invoices | Number, project/contract, total, outstanding, due date, state | Filter and open detail |
| Invoice Detail | Line items, totals, dates, state, payments, gateways/bank accounts | Select payment method, pay online, upload receipt where applicable, view result |

Payment flow:

1. Confirm invoice and outstanding amount.
2. Select an available method/gateway.
3. Enter an allowed amount.
4. Complete gateway or bank-transfer instructions.
5. Upload receipt when applicable.
6. Show pending, successful, failed, or cancelled outcome.
7. Prevent duplicate submission.

### 14.10 Disputes

| Screen | Information | Actions and transient interactions |
| --- | --- | --- |
| Disputes | Project, category, priority, state, last activity | Search/filter, create, open detail |
| New Dispute | Related project, category, impact/priority allowed by policy, title, description, attachments, review | Complete form and submit |
| Dispute Detail | Ticket context, PM/project, original description, thread, attachments, history, proposed resolution | Send message/files, confirm or contest proposed resolution according to state |

## 15. Complex workflow definitions

### 15.1 Sales request

1. Prospect or existing client.
2. Company and contact information.
3. Business type and source.
4. Services, quantity, and notes.
5. Internal notes.
6. Review and submit.

### 15.2 Proposal creation

1. Request and client context.
2. Service and price breakdown.
3. Validity and notes.
4. PDF upload.
5. Review and create.
6. Separate send confirmation.

### 15.3 Contract creation

1. Request and optional approved proposal.
2. Contract title and type.
3. Start/end dates.
4. Monthly and total values.
5. Down-payment definition.
6. Payment-plan rows: label, trigger, fixed/percentage amount, recurring state, due offset.
7. PDF upload.
8. Review and create.

### 15.4 Period management

- generate scheduled periods;
- create extra period;
- open, close, suspend, or extend within server rules;
- define goals and completion;
- schedule/reschedule/cancel/complete meeting;
- manage summary and report;
- expose related billing state without duplicating Finance operations.

### 15.5 Invoice creation

1. Client and optional contract.
2. Issue/due dates and payment method.
3. Line items with optional project/task links.
4. Quantity, unit price, totals.
5. Notes.
6. Review and create.

### 15.6 Payroll run

1. Month/year.
2. Preview computed employees and totals.
3. Review missing configuration and already-paid conflicts.
4. Adjust permitted bonus/deduction values.
5. Confirm generation.
6. Pay individually or pay all with separate confirmation.

### 15.7 Campaign KPI update

- budget spent;
- impressions;
- clicks;
- conversions;
- revenue.

CTR, CPC, CPA, conversion rate, ROAS, and remaining budget must use centralized authoritative formulas.

### 15.8 Dispute workflow

- client creates ticket and attachments;
- PM acknowledges;
- client and authorized staff communicate;
- PM proposes resolution;
- client confirms or contests;
- Admin may approve, reject, change PM, intervene, or close according to state;
- every transition enters history.

## 16. Required screen states

Every applicable screen contract must define:

- initial loading;
- background refresh;
- empty dataset;
- no filter results;
- partial data failure;
- full error;
- unauthorized;
- forbidden;
- not found;
- inactive/archived record;
- stale data;
- offline/reconnecting;
- mutation pending/success/failure;
- preserved form input after failure;
- unsaved changes;
- destructive confirmation;
- duplicate-submission prevention;
- pagination boundaries;
- permission-dependent commands;
- long English data;
- later translated and RTL data.

Search, filters, sorting, pagination, selected view, and reporting ranges should be URL-addressable when a user may bookmark or share them.

## 17. Required additions and removals relative to the current route names

### Remove or consolidate

- Remove Designer as a dashboard; route legacy traffic to Team My Work.
- Do not create a separate Marketing dashboard shell.
- Do not duplicate Task Detail for Team departments.
- Do not duplicate routine Finance operations inside Admin.
- Do not migrate the current Design System product route.

### Add because the workflow is otherwise incomplete

- Team My Tasks.
- Campaigns list for Marketing capability.
- Marketing Strategies list and detail for Marketing capability.
- Lead Detail.
- Project Period Detail for PM, Admin, and client-safe portal use.
- New Proposal dedicated flow.
- New Contract dedicated flow.
- New Invoice dedicated flow.
- Portal Request Detail.
- Roles.
- Departments.
- Services and deliverable templates.
- Notification Templates and logs.
- Payment Issues if the existing ticket workflow remains active.

These additions are driven by existing backend workflows or usability requirements for complex and bookmarkable work. They are not copied from the current frontend.

## 18. Explicitly deferred product decisions

The following must be approved or excluded before implementation:

- whether users can have multiple roles/workspaces;
- Sales scoping: assigned-only versus team-wide manager access;
- Marketing role versus permission-only capability assignment;
- whether Admin can mutate deliverables or only inspect/intervene through project state;
- whether Payment Issues is a production workflow;
- whether feature flags, backups, automation, environment, and system-event screens are user-facing;
- account email/password/session-management API scope;
- request cancellation/amendment rules;
- report export formats and retention;
- notification preferences and delivery channels;
- final onboarding step count and draft semantics;
- whether dark mode is a launch requirement.

## 19. Gate before template work

Template and visual work may start only after approval of:

- workspace hierarchy;
- Team/Marketing capability model;
- navigation groups;
- screen additions/removals;
- page-owned information and commands;
- complex workflow steps;
- role/permission/data scope;
- deferred product decisions relevant to the first implementation phase.

After approval, the template stage should use realistic dummy data for all states in this document. Only then should the team extract global visual and interaction patterns.

## 20. Tooling prerequisite for implementation

Before V2 UI implementation begins:

- configure the official shadcn MCP for component registry search, inspection, and documentation;
- configure the official Next.js DevTools MCP for Next.js 16 documentation, route/runtime metadata, errors, logs, and browser verification;
- restart the agent environment and verify both tool servers are exposed;
- use official component documentation before implementing each primitive or interaction.

MCP configuration is an implementation-foundation change and is intentionally not performed by this planning document.

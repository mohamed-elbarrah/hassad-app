# PM Dashboard Plan

## Goal
Build the PM dashboard as a first-class workspace with its own pages and PM-owned API endpoints.

## Strict rules
- UI must use **shadcn** primitives only.
- No hardcoded visual values in shared UI.
- Reuse the same dashboard patterns already used in **admin** and **CRM**.
- Do not invent new layout systems if an existing pattern already fits.
- Detail pages should stay close to the existing admin-style detail workspaces.

## PM pages
- `/pm` — overview
- `/pm/tasks` — task workspace
- `/pm/disputes` — dispute list
- `/pm/chat` — already exists

## Endpoints
### Overview
- `GET /v1/pm/overview`

### Projects
- `GET /v1/pm/projects`
- `GET /v1/pm/projects/:id`

### Tasks
- `GET /v1/pm/tasks`
- `GET /v1/pm/tasks/:id` if detail is needed
- optional actions if required by UI:
  - `PATCH /v1/pm/tasks/:id/status`
  - `POST /v1/pm/tasks/:id/assign`
  - `POST /v1/pm/tasks/:id/comments`

### Disputes
- `GET /v1/pm/disputes`
- `GET /v1/pm/disputes/:id` if detail is needed
- existing PM dispute actions can stay under `/v1/pm/disputes/...`

### Chat
- keep existing `GET/POST /v1/pm/chat/...`

## Page-to-endpoint mapping
| Page | Endpoint(s) |
|---|---|
| `/pm` | `GET /v1/pm/overview` |
| `/pm/tasks` | `GET /v1/pm/tasks` |
| `/pm/tasks/:id` | `GET /v1/pm/tasks/:id` |
| `/pm/disputes` | `GET /v1/pm/disputes` |
| `/pm/disputes/:id` | `GET /v1/pm/disputes/:id` |
| `/pm/chat` | existing PM chat endpoints |

## Data rules
### Projects
PM should see projects they own:
- `projectManagerId = currentUserId`
- or explicit membership if later required

### Tasks
Show tasks from PM-owned projects with:
- status
- assignee
- department/team
- due date
- priority

### Disputes
Show disputes related to the PM with:
- status
- client
- project
- urgency / priority
- created / updated dates

## UI direction
- Overview: dashboard cards + kanban or grouped project view.
- Tasks: workspace table or grouped task board.
- Disputes: table/list workspace.
- Detail pages: follow the same style as admin detail pages, with the same reusable workspace patterns.

## Implementation order
1. Create PM overview endpoint.
2. Create PM projects endpoint.
3. Create PM tasks endpoint.
4. Reuse existing PM disputes endpoint and align its data shape.
5. Replace placeholder pages in `apps/web-v2`.
6. Add page-specific RTK hooks.
7. Add detail pages only if needed.

## Notes
- PM must stay separate from admin and CRM.
- Avoid portal endpoints for PM work.
- Keep the UI consistent, reusable, and data-driven.

-- Backfill the denormalized counter fields on the `clients` table.
--
-- Why this migration exists:
--   The portal profile page (`/portal/profile`) renders a KPI grid that
--   shows "إجمالي المشاريع", "قيمة العقود", "إجمالي المدفوع", etc.
--   These are denormalized counters stored on the `clients` row so the
--   read path doesn't have to join 5 tables per page load.
--
-- The counter formula lives in two places:
--   - This migration (one-shot, ships at deploy time).
--   - `apps/api/src/modules/crm/services/client-counter.service.ts`
--     (runtime, recomputes on every relevant state transition).
--
-- If you change the counter formula in the service, ALSO add a new
-- migration that re-runs the equivalent SQL below. The migration is the
-- source of truth at deploy time; the service is the source of truth at
-- runtime. They MUST stay in lockstep — drift here means stale KPIs on
-- the portal until the next state transition refreshes them.
--
-- Note on naming:
--   The Prisma schema declares these fields with `@map("snake_case")` so
--   the underlying columns are snake_case in PostgreSQL. This migration
--   targets the actual DB column names (snake_case, double-quoted) and
--   NOT the Prisma field names (camelCase) — Prisma's shadow database
--   does NOT apply `@map` directives, so writing camelCase here would
--   fail validation in `migrate dev` AND at runtime against the real DB.

-- ─────────────────────────────────────────────────────────────────────────
-- 1) Project counters (total / active / completed / cancelled)
--    Counted on `is_archived = false` to match the service's filter.
--    `COUNT(*) FILTER (WHERE ...)` returns 0 (not NULL) when there are
--    no matching rows, so `COALESCE` is defensive only.
-- ─────────────────────────────────────────────────────────────────────────
UPDATE "clients" AS c SET
  "total_projects"     = COALESCE(p.total, 0),
  "active_projects"    = COALESCE(p.active, 0),
  "completed_projects" = COALESCE(p.completed, 0),
  "cancelled_projects" = COALESCE(p.cancelled, 0),
  "last_project_at"    = p.last_project_at
FROM (
  SELECT
    client_id,
    COUNT(*)                                                    AS total,
    COUNT(*) FILTER (WHERE status = 'ACTIVE')                   AS active,
    COUNT(*) FILTER (WHERE status = 'COMPLETED')                AS completed,
    COUNT(*) FILTER (WHERE status = 'CANCELLED')                AS cancelled,
    MAX(created_at)                                             AS last_project_at
  FROM "projects"
  WHERE is_archived = false
  GROUP BY client_id
) AS p
WHERE c.id = p.client_id;

-- ─────────────────────────────────────────────────────────────────────────
-- 2) Contract value (sum of SIGNED + ACTIVE contracts' total_value)
-- ─────────────────────────────────────────────────────────────────────────
UPDATE "clients" AS c SET
  "total_contract_value" = COALESCE(ct.total_value, 0)
FROM (
  SELECT client_id, SUM(total_value) AS total_value
  FROM "contracts"
  WHERE status IN ('SIGNED', 'ACTIVE')
  GROUP BY client_id
) AS ct
WHERE c.id = ct.client_id;

-- ─────────────────────────────────────────────────────────────────────────
-- 3) Paid invoices (sum of PAID + PARTIAL invoice amounts)
--    Matches the service's current behavior: `total_invoiced` and
--    `total_paid` are populated from the same aggregate. If we ever
--    decide to fix `total_invoiced` semantics (it should arguably sum
--    ALL invoices, not just paid+partial), update both this migration
--    and the corresponding TypeScript in `aggregateClientCounters()`.
-- ─────────────────────────────────────────────────────────────────────────
UPDATE "clients" AS c SET
  "total_invoiced" = COALESCE(inv.total_amount, 0),
  "total_paid"     = COALESCE(inv.total_amount, 0)
FROM (
  SELECT client_id, SUM(amount) AS total_amount
  FROM "invoices"
  WHERE status IN ('PAID', 'PARTIAL')
  GROUP BY client_id
) AS inv
WHERE c.id = inv.client_id;

-- ─────────────────────────────────────────────────────────────────────────
-- 4) Average satisfaction score (nullable — no ratings means NULL)
--    LEFT JOIN semantics: clients without any ratings keep their existing
--    column value (NULL by default). We touch only the rows that have
--    at least one rating.
-- ─────────────────────────────────────────────────────────────────────────
UPDATE "clients" AS c SET
  "avg_satisfaction_score" = sr.avg_score
FROM (
  SELECT client_id, AVG(score)::double precision AS avg_score
  FROM "satisfaction_ratings"
  GROUP BY client_id
) AS sr
WHERE c.id = sr.client_id;
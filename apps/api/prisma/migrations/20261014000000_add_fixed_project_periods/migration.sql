DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "projects" p
    JOIN "contracts" c ON c."id" = p."contract_id"
    WHERE c."type" = 'FIXED_PROJECT'
      AND c."status" IN ('SIGNED', 'ACTIVE', 'ON_HOLD')
      AND p."status" NOT IN ('COMPLETED', 'CANCELLED')
      AND c."end_date" < c."start_date"
  ) THEN
    RAISE EXCEPTION 'FIXED_PROJECT_CONTRACT_DATE_RANGE_INVALID';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT p."id"
    FROM "projects" p
    JOIN "contracts" c ON c."id" = p."contract_id"
    JOIN "project_periods" pp ON pp."project_id" = p."id"
    WHERE c."type" = 'FIXED_PROJECT'
      AND c."status" IN ('SIGNED', 'ACTIVE', 'ON_HOLD')
      AND p."status" NOT IN ('COMPLETED', 'CANCELLED')
    GROUP BY p."id"
    HAVING COUNT(pp."id") > 1
  ) THEN
    RAISE EXCEPTION 'FIXED_PROJECT_MULTIPLE_PERIODS_REQUIRE_REVIEW';
  END IF;
END $$;

WITH eligible_projects AS MATERIALIZED (
  SELECT
    p."id" AS "project_id",
    c."start_date",
    c."end_date",
    c."created_by",
    CASE
      WHEN c."status" = 'ON_HOLD' OR p."status" = 'ON_HOLD'
        THEN 'SUSPENDED'::"ProjectPeriodStatus"
      WHEN c."status" = 'ACTIVE'
        AND p."status" IN ('ACTIVE', 'AWAITING_REVIEW', 'NEEDS_REVISION')
        AND c."start_date" <= CURRENT_TIMESTAMP
        THEN 'ACTIVE'::"ProjectPeriodStatus"
      ELSE 'UPCOMING'::"ProjectPeriodStatus"
    END AS "period_status"
  FROM "projects" p
  JOIN "contracts" c ON c."id" = p."contract_id"
  WHERE c."type" = 'FIXED_PROJECT'
    AND c."status" IN ('SIGNED', 'ACTIVE', 'ON_HOLD')
    AND p."status" NOT IN ('COMPLETED', 'CANCELLED')
    AND NOT EXISTS (
      SELECT 1
      FROM "project_periods" pp
      WHERE pp."project_id" = p."id"
    )
), inserted_periods AS (
  INSERT INTO "project_periods" (
    "id",
    "project_id",
    "period_number",
    "start_date",
    "end_date",
    "status",
    "suspended_at",
    "created_at",
    "updated_at"
  )
  SELECT
    gen_random_uuid()::text,
    eligible."project_id",
    1,
    eligible."start_date",
    eligible."end_date",
    eligible."period_status",
    CASE
      WHEN eligible."period_status" = 'SUSPENDED'::"ProjectPeriodStatus"
        THEN CURRENT_TIMESTAMP
      ELSE NULL
    END,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  FROM eligible_projects eligible
  RETURNING "id", "project_id", "status"
)
INSERT INTO "project_period_history" (
  "id",
  "period_id",
  "from_status",
  "to_status",
  "changed_by",
  "reason",
  "changed_at"
)
SELECT
  gen_random_uuid()::text,
  inserted."id",
  'UPCOMING'::"ProjectPeriodStatus",
  inserted."status",
  eligible."created_by",
  'FIXED_PROJECT_PERIOD_BACKFILL',
  CURRENT_TIMESTAMP
FROM inserted_periods inserted
JOIN eligible_projects eligible USING ("project_id")
WHERE inserted."status" <> 'UPCOMING'::"ProjectPeriodStatus";

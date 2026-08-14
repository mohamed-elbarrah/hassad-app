-- Migrate the legacy Lead workflow into Request without deleting legacy rows.
-- The migration is deliberately idempotent and preserves Lead/history rows as an archive.

CREATE TEMP TABLE legacy_lead_request_map (
  lead_id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL UNIQUE,
  client_id TEXT NOT NULL
) ON COMMIT DROP;

-- Reuse an existing canonical client where possible; create only missing clients.
INSERT INTO "clients" (
  "id", "lead_id", "company_name", "business_name", "business_type", "status", "created_at", "updated_at"
)
SELECT
  gen_random_uuid()::text,
  l."id",
  l."company_name",
  l."business_name",
  l."business_type",
  'LEAD'::"ClientStatus",
  l."created_at",
  l."updated_at"
FROM (
  SELECT DISTINCT ON ("company_name", "business_name") *
  FROM "leads"
  WHERE "request_id" IS NULL
  ORDER BY "company_name", "business_name", "created_at", "id"
) l
WHERE NOT EXISTS (SELECT 1 FROM "clients" c WHERE c."lead_id" = l."id")
  AND NOT EXISTS (
    SELECT 1 FROM "clients" c
    WHERE c."company_name" = l."company_name"
      AND c."business_name" = l."business_name"
  );

INSERT INTO legacy_lead_request_map (lead_id, request_id, client_id)
SELECT
  l."id",
  COALESCE(l."request_id", gen_random_uuid()::text),
  c."id"
FROM "leads" l
JOIN "clients" c ON c."lead_id" = l."id"
WHERE l."request_id" IS NULL
ON CONFLICT (lead_id) DO NOTHING;

-- Leads that matched an existing client by business identity.
INSERT INTO legacy_lead_request_map (lead_id, request_id, client_id)
SELECT DISTINCT ON (l."id") l."id", gen_random_uuid()::text, c."id"
FROM "leads" l
JOIN "clients" c
  ON c."company_name" = l."company_name"
 AND c."business_name" = l."business_name"
WHERE l."request_id" IS NULL
  AND NOT EXISTS (SELECT 1 FROM legacy_lead_request_map m WHERE m.lead_id = l."id")
ORDER BY l."id", c."created_at", c."id"
ON CONFLICT (lead_id) DO NOTHING;

-- Create the canonical request for every unlinked legacy lead.
INSERT INTO "requests" (
  "id", "client_id", "submitted_by", "assigned_sales_id", "company_name",
  "contact_name", "phone_whatsapp", "email", "business_name", "business_type",
  "source", "notes", "status", "crm_stage", "contact_attempt_count",
  "last_contact_at", "created_at", "updated_at"
)
SELECT
  m.request_id,
  m.client_id,
  l."created_by",
  l."assigned_to",
  l."company_name",
  l."contact_name",
  l."phone_whatsapp",
  l."email",
  l."business_name",
  l."business_type",
  l."source",
  l."notes",
  CASE l."pipeline_stage"
    WHEN 'PROPOSAL_SENT' THEN 'PROPOSAL_SENT'
    WHEN 'FOLLOW_UP' THEN 'NEGOTIATION'
    WHEN 'APPROVED' THEN 'CONTRACT_PREPARATION'
    WHEN 'CONTRACT_SIGNED' THEN 'SIGNED'
    WHEN 'MEETING_SCHEDULED' THEN 'PROPOSAL_IN_PROGRESS'
    WHEN 'MEETING_DONE' THEN 'PROPOSAL_IN_PROGRESS'
    ELSE 'QUALIFYING'
  END::"RequestStatus",
  l."crm_stage",
  l."contact_attempt_count",
  l."last_contact_at",
  l."created_at",
  l."updated_at"
FROM legacy_lead_request_map m
JOIN "leads" l ON l."id" = m.lead_id
ON CONFLICT (id) DO NOTHING;

INSERT INTO "request_status_history" (
  "id", "request_id", "from_status", "to_status", "changed_by", "note", "changed_at"
)
SELECT
  gen_random_uuid()::text,
  m.request_id,
  NULL,
  r."status",
  l."created_by",
  'Migrated from legacy lead workflow',
  l."created_at"
FROM legacy_lead_request_map m
JOIN "leads" l ON l."id" = m.lead_id
JOIN "requests" r ON r."id" = m.request_id
WHERE NOT EXISTS (
  SELECT 1 FROM "request_status_history" h WHERE h."request_id" = m.request_id
);

INSERT INTO "request_services" ("id", "request_id", "service_id", "quantity", "notes", "created_at")
SELECT gen_random_uuid()::text, m.request_id, s."service_id", s."quantity", s."notes", s."created_at"
FROM "lead_services" s
JOIN legacy_lead_request_map m ON m.lead_id = s."lead_id"
ON CONFLICT ("request_id", "service_id") DO NOTHING;

INSERT INTO "request_contact_logs" (
  "id", "request_id", "user_id", "type", "result", "notes", "contacted_at", "created_at"
)
SELECT gen_random_uuid()::text, m.request_id, l."user_id", l."type", l."result", l."notes", l."contacted_at", l."contacted_at"
FROM "lead_contact_log" l
JOIN legacy_lead_request_map m ON m.lead_id = l."lead_id"
WHERE NOT EXISTS (
  SELECT 1 FROM "request_contact_logs" x
  WHERE x."request_id" = m.request_id
    AND x."user_id" = l."user_id"
    AND x."contacted_at" = l."contacted_at"
);

INSERT INTO "request_status_history" (
  "id", "request_id", "from_status", "to_status", "changed_by", "note", "changed_at"
)
SELECT
  gen_random_uuid()::text,
  m.request_id,
  CASE h."from_stage"
    WHEN 'PROPOSAL_SENT' THEN 'PROPOSAL_SENT'
    WHEN 'FOLLOW_UP' THEN 'NEGOTIATION'
    WHEN 'APPROVED' THEN 'CONTRACT_PREPARATION'
    WHEN 'CONTRACT_SIGNED' THEN 'SIGNED'
    WHEN 'MEETING_SCHEDULED' THEN 'PROPOSAL_IN_PROGRESS'
    WHEN 'MEETING_DONE' THEN 'PROPOSAL_IN_PROGRESS'
    ELSE 'QUALIFYING'
  END::"RequestStatus",
  CASE h."to_stage"
    WHEN 'PROPOSAL_SENT' THEN 'PROPOSAL_SENT'
    WHEN 'FOLLOW_UP' THEN 'NEGOTIATION'
    WHEN 'APPROVED' THEN 'CONTRACT_PREPARATION'
    WHEN 'CONTRACT_SIGNED' THEN 'SIGNED'
    WHEN 'MEETING_SCHEDULED' THEN 'PROPOSAL_IN_PROGRESS'
    WHEN 'MEETING_DONE' THEN 'PROPOSAL_IN_PROGRESS'
    ELSE 'QUALIFYING'
  END::"RequestStatus",
  h."changed_by",
  'Migrated from legacy lead pipeline history',
  h."changed_at"
FROM "lead_pipeline_history" h
JOIN legacy_lead_request_map m ON m.lead_id = h."lead_id"
WHERE NOT EXISTS (
  SELECT 1 FROM "request_status_history" x
  WHERE x."request_id" = m.request_id AND x."changed_at" = h."changed_at"
);

-- CRM notes are copied, not moved, so the legacy archive remains complete.
INSERT INTO "crm_notes" (
  "id", "request_id", "author_id", "content", "is_internal", "created_at", "updated_at"
)
SELECT gen_random_uuid()::text, m.request_id, n."author_id", n."content", n."is_internal", n."created_at", n."updated_at"
FROM "crm_notes" n
JOIN legacy_lead_request_map m ON m.lead_id = n."lead_id"
WHERE NOT EXISTS (
  SELECT 1 FROM "crm_notes" x
  WHERE x."request_id" = m.request_id AND x."author_id" = n."author_id" AND x."created_at" = n."created_at"
);

-- Existing proposals have an unambiguous Lead -> Request mapping.
UPDATE "proposals" p
SET "request_id" = m.request_id
FROM legacy_lead_request_map m
WHERE p."lead_id" = m.lead_id
  AND p."request_id" IS NULL;

-- Contracts linked through proposals can be resolved safely.
UPDATE "contracts" c
SET "request_id" = p."request_id"
FROM "proposals" p
WHERE c."proposal_id" = p."id"
  AND c."request_id" IS NULL
  AND p."request_id" IS NOT NULL;

-- Resolve contracts by client only when exactly one request exists.
UPDATE "contracts" c
SET "request_id" = only_request."id"
FROM (
  SELECT "client_id", min("id") AS "id"
  FROM "requests"
  GROUP BY "client_id"
  HAVING count(*) = 1
) only_request
WHERE c."client_id" = only_request."client_id"
  AND c."request_id" IS NULL;

-- Preserve ambiguous/unmatched contracts for explicit manual review.
INSERT INTO "legacy_contract_migration_reviews" (
  "id", "contract_id", "client_id", "reason", "candidate_request_ids", "updated_at"
)
SELECT
  gen_random_uuid()::text,
  c."id",
  c."client_id",
  CASE WHEN count(r."id") > 1 THEN 'Multiple candidate requests' ELSE 'No candidate request' END,
  COALESCE(jsonb_agg(r."id") FILTER (WHERE r."id" IS NOT NULL), '[]'::jsonb),
  CURRENT_TIMESTAMP
FROM "contracts" c
LEFT JOIN "requests" r ON r."client_id" = c."client_id"
WHERE c."request_id" IS NULL
GROUP BY c."id", c."client_id"
ON CONFLICT ("contract_id") DO NOTHING;

-- Record migration counts and mark leads complete. Legacy rows remain read-only archive data.
INSERT INTO "legacy_lead_migrations" (
  "id", "lead_id", "request_id", "client_id", "status", "migrated_at", "counts", "updated_at"
)
SELECT
  gen_random_uuid()::text,
  m.lead_id,
  m.request_id,
  m.client_id,
  'MIGRATED'::"LegacyLeadMigrationStatus",
  CURRENT_TIMESTAMP,
  jsonb_build_object(
    'services', (SELECT count(*) FROM "lead_services" s WHERE s."lead_id" = m.lead_id),
    'contactLogs', (SELECT count(*) FROM "lead_contact_log" l WHERE l."lead_id" = m.lead_id),
    'pipelineHistory', (SELECT count(*) FROM "lead_pipeline_history" h WHERE h."lead_id" = m.lead_id),
    'notes', (SELECT count(*) FROM "crm_notes" n WHERE n."lead_id" = m.lead_id)
  ),
  CURRENT_TIMESTAMP
FROM legacy_lead_request_map m
ON CONFLICT ("lead_id") DO NOTHING;

UPDATE "leads" l
SET "request_id" = m.request_id
FROM legacy_lead_request_map m
WHERE l."id" = m.lead_id AND l."request_id" IS NULL;

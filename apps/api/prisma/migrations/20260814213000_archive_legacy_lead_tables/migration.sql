-- Phase 4: move the legacy Lead data out of the active CRM namespace.
-- Data is retained for audit/export; no active Prisma model references these tables.
ALTER TABLE "leads" RENAME TO "legacy_leads";
ALTER TABLE "lead_services" RENAME TO "legacy_lead_services";
ALTER TABLE "lead_contact_log" RENAME TO "legacy_lead_contact_logs";
ALTER TABLE "lead_pipeline_history" RENAME TO "legacy_lead_pipeline_history";

ALTER TABLE "clients" RENAME COLUMN "lead_id" TO "legacy_lead_id";
ALTER TABLE "proposals" RENAME COLUMN "lead_id" TO "legacy_lead_id";
ALTER TABLE "crm_notes" RENAME COLUMN "lead_id" TO "legacy_lead_id";

-- These historical tables still retain their internal foreign keys, but the
-- active business tables no longer expose Lead relations.

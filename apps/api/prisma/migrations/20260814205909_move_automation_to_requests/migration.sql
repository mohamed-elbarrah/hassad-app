-- Move automation ownership from legacy Leads to canonical Requests.
CREATE TABLE "request_automation_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger_type" TEXT NOT NULL,
    "condition_json" JSONB NOT NULL,
    "action_json" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "request_automation_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "request_automation_logs" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "rule_id" TEXT NOT NULL,
    "executed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "AutomationStatus" NOT NULL,
    "response_data" JSONB,
    CONSTRAINT "request_automation_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "request_automation_logs_request_id_idx" ON "request_automation_logs"("request_id");
CREATE INDEX "request_automation_logs_rule_id_idx" ON "request_automation_logs"("rule_id");

INSERT INTO "request_automation_rules" ("id", "name", "trigger_type", "condition_json", "action_json", "is_active", "created_at")
SELECT "id", "name", "trigger_type", "condition_json", "action_json", "is_active", "created_at"
FROM "lead_automation_rules";

INSERT INTO "request_automation_logs" ("id", "request_id", "rule_id", "executed_at", "status", "response_data")
SELECT l."id", le."request_id", l."rule_id", l."executed_at", l."status", l."response_data"
FROM "lead_automation_logs" l
JOIN "leads" le ON le."id" = l."lead_id"
WHERE le."request_id" IS NOT NULL;

ALTER TABLE "request_automation_logs"
  ADD CONSTRAINT "request_automation_logs_request_id_fkey"
  FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "request_automation_logs"
  ADD CONSTRAINT "request_automation_logs_rule_id_fkey"
  FOREIGN KEY ("rule_id") REFERENCES "request_automation_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Preserve any malformed/unlinked historical executions before removing the legacy table.
CREATE TABLE "legacy_lead_automation_logs" AS
SELECT * FROM "lead_automation_logs"
WHERE "lead_id" NOT IN (SELECT "id" FROM "leads" WHERE "request_id" IS NOT NULL);

DROP TABLE "lead_automation_logs";
DROP TABLE "lead_automation_rules";

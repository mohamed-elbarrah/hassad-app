-- Normalize client lifecycle: kind identifies lead/client, status identifies activity.
CREATE TYPE "ClientKind" AS ENUM ('LEAD', 'CLIENT');

ALTER TABLE "clients" ADD COLUMN "kind" "ClientKind" NOT NULL DEFAULT 'LEAD';

-- Preserve the meaning of every legacy row before replacing the status enum.
UPDATE "clients" c
SET "kind" = CASE
  WHEN EXISTS (
    SELECT 1
    FROM "projects" p
    WHERE p."client_id" = c."id"
      AND p."status" IN ('ACTIVE', 'COMPLETED')
      AND p."is_archived" = false
  ) THEN 'CLIENT'::"ClientKind"
  ELSE 'LEAD'::"ClientKind"
END;

ALTER TYPE "ClientStatus" RENAME TO "ClientStatus_old";
CREATE TYPE "ClientStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

ALTER TABLE "clients"
  ALTER COLUMN "status" TYPE "ClientStatus"
  USING (CASE WHEN "status"::text = 'STOPPED' THEN 'SUSPENDED'::"ClientStatus" ELSE 'ACTIVE'::"ClientStatus" END);

ALTER TABLE "clients" ALTER COLUMN "kind" DROP DEFAULT;
ALTER TABLE "clients" ALTER COLUMN "kind" SET DEFAULT 'LEAD';
DROP TYPE "ClientStatus_old";

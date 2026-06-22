/*
  Warnings:

  - You are about to drop the column `goals` on the `portal_intake_forms` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "portal_intake_forms" DROP COLUMN "goals",
ALTER COLUMN "updated_at" DROP DEFAULT;

-- Add portal.manage_intake permission to CLIENT role for intake form uploads
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r.id, p.id
FROM "roles" r, "permissions" p
WHERE r.name = 'CLIENT' AND p.name = 'portal.manage_intake'
ON CONFLICT DO NOTHING;

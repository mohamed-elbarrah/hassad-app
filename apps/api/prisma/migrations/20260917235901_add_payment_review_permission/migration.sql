-- Allow finance staff to review manual bank-transfer submissions without
-- granting broader admin intervention permissions.
INSERT INTO "permissions" ("id", "name")
VALUES (gen_random_uuid(), 'finance.review_payments')
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r."name" = 'ACCOUNTANT'
  AND p."name" = 'finance.review_payments'
ON CONFLICT ("role_id", "permission_id") DO NOTHING;

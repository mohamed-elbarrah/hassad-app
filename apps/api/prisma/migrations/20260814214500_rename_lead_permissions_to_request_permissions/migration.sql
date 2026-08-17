-- Merge legacy Lead permission rows into the canonical Request permissions.
-- Some databases already contain the Request names, so update-in-place would
-- violate the unique permission name constraint.
WITH pairs AS (
  SELECT old.id AS old_id, current.id AS current_id
  FROM "permissions" old
  JOIN "permissions" current
    ON current.name = REPLACE(old.name, 'admin.leads.', 'admin.requests.')
  WHERE old.name LIKE 'admin.leads.%'
)
INSERT INTO "role_permissions" (role_id, permission_id)
SELECT rp.role_id, pairs.current_id
FROM "role_permissions" rp
JOIN pairs ON pairs.old_id = rp.permission_id
ON CONFLICT DO NOTHING;

WITH pairs AS (
  SELECT old.id AS old_id, current.id AS current_id
  FROM "permissions" old
  JOIN "permissions" current
    ON current.name = REPLACE(old.name, 'admin.leads.', 'admin.requests.')
  WHERE old.name LIKE 'admin.leads.%'
)
INSERT INTO "user_permissions" (user_id, permission_id)
SELECT up.user_id, pairs.current_id
FROM "user_permissions" up
JOIN pairs ON pairs.old_id = up.permission_id
ON CONFLICT DO NOTHING;

DELETE FROM "role_permissions"
WHERE permission_id IN (SELECT id FROM "permissions" WHERE name LIKE 'admin.leads.%');
DELETE FROM "user_permissions"
WHERE permission_id IN (SELECT id FROM "permissions" WHERE name LIKE 'admin.leads.%');
DELETE FROM "permissions" WHERE name LIKE 'admin.leads.%';

UPDATE "permissions"
SET name = REPLACE(name, 'leads.', 'requests.')
WHERE name LIKE 'leads.%';

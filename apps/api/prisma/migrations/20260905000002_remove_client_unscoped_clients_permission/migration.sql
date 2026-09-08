-- CLIENT must not receive the generic clients.read permission.
-- That permission is used by unscoped internal CRM endpoints and can expose
-- other clients. Portal clients use portal-owned, client-scoped endpoints.
DELETE FROM "role_permissions" rp
USING "roles" r, "permissions" p
WHERE rp."role_id" = r."id"
  AND rp."permission_id" = p."id"
  AND r."name" = 'CLIENT'
  AND p."name" = 'clients.read';

DELETE FROM "user_permissions" up
USING "users" u, "roles" r, "permissions" p
WHERE up."user_id" = u."id"
  AND u."role_id" = r."id"
  AND up."permission_id" = p."id"
  AND r."name" = 'CLIENT'
  AND p."name" = 'clients.read';

-- A completed project remains evidence that the client converted, even if the project was archived.
UPDATE "clients" c
SET "kind" = 'CLIENT'::"ClientKind"
WHERE EXISTS (
  SELECT 1
  FROM "projects" p
  WHERE p."client_id" = c."id"
    AND p."status" IN ('ACTIVE', 'COMPLETED')
);

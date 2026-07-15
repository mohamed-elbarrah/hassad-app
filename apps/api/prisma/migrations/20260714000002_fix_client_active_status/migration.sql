-- Fix client status: clients with status ACTIVE but no signed/active contract should be LEAD.
-- Previously, any client creation path set status=ACTIVE. Now only clients
-- who have signed at least one contract get ACTIVE (set in activateContract).

UPDATE clients
SET status = 'LEAD'
WHERE status = 'ACTIVE'
AND id NOT IN (
  SELECT DISTINCT client_id FROM contracts
  WHERE status IN ('SIGNED', 'ACTIVE', 'COMPLETED')
);

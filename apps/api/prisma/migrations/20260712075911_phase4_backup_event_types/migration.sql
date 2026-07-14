-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "system_event_types" ADD VALUE 'BACKUP_STARTED';
ALTER TYPE "system_event_types" ADD VALUE 'BACKUP_COMPLETED';
ALTER TYPE "system_event_types" ADD VALUE 'BACKUP_FAILED';
ALTER TYPE "system_event_types" ADD VALUE 'BACKUP_RESTORE';

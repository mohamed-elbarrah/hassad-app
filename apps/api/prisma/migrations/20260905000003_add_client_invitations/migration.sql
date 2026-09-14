-- Client invitation tokens are stored only as SHA-256 hashes.
ALTER TABLE "users" ADD COLUMN "password_set_at" TIMESTAMP(3);

CREATE TABLE "client_invitations" (
    "id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "request_id" TEXT,

    CONSTRAINT "client_invitations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "client_invitations_token_hash_key" ON "client_invitations"("token_hash");
CREATE INDEX "client_invitations_user_id_revoked_at_consumed_at_idx" ON "client_invitations"("user_id", "revoked_at", "consumed_at");
CREATE INDEX "client_invitations_client_id_revoked_at_consumed_at_idx" ON "client_invitations"("client_id", "revoked_at", "consumed_at");
CREATE INDEX "client_invitations_request_id_idx" ON "client_invitations"("request_id");
CREATE INDEX "client_invitations_expires_at_idx" ON "client_invitations"("expires_at");

ALTER TABLE "client_invitations" ADD CONSTRAINT "client_invitations_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "client_invitations" ADD CONSTRAINT "client_invitations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "client_invitations" ADD CONSTRAINT "client_invitations_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "client_invitations" ADD CONSTRAINT "client_invitations_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

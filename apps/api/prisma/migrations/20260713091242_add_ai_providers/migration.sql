-- CreateTable
CREATE TABLE "ai_providers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT,
    "baseUrl" TEXT,
    "apiKey" TEXT NOT NULL,
    "models" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "requestsPerMinute" INTEGER DEFAULT 60,
    "tokensPerMinute" INTEGER DEFAULT 100000,
    "maxTokens" INTEGER DEFAULT 4096,
    "temperature" DOUBLE PRECISION DEFAULT 0.7,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_providers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_providers_name_key" ON "ai_providers"("name");

-- CreateIndex
CREATE INDEX "ai_providers_priority_idx" ON "ai_providers"("priority");

-- CreateIndex
CREATE INDEX "ai_providers_isActive_idx" ON "ai_providers"("isActive");

-- CreateTable
CREATE TABLE "business_goals" (
    "id" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "target" DOUBLE PRECISION NOT NULL,
    "current" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "period" TEXT NOT NULL DEFAULT 'monthly',
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_goals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "business_goals_metric_period_start_idx" ON "business_goals"("metric", "period_start");

-- CreateIndex
CREATE INDEX "business_goals_is_active_idx" ON "business_goals"("is_active");

-- CreateEnum
CREATE TYPE "AuditLevel" AS ENUM ('INFO', 'WARN', 'ERROR');

-- CreateTable
CREATE TABLE "audit" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "entity_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "user_agent" TEXT,
    "ip" TEXT,
    "level" "AuditLevel" NOT NULL DEFAULT 'INFO',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "audit_pkey" PRIMARY KEY ("id")
);

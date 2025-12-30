-- CreateEnum
CREATE TYPE "ScheduleType" AS ENUM ('CRON', 'EVENT', 'HYBRID');

-- CreateEnum
CREATE TYPE "TaskCategory" AS ENUM ('SYSTEM', 'EMAIL', 'CLEANUP', 'FINANCE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ExecutionStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', 'TIMEOUT');

-- CreateEnum
CREATE TYPE "TriggerSource" AS ENUM ('SCHEDULE', 'MANUAL', 'EVENT', 'RETRY');

-- CreateTable
CREATE TABLE "scheduled_tasks" (
    "id" TEXT NOT NULL,
    "function_id" TEXT NOT NULL,
    "function_name" TEXT NOT NULL,
    "description" TEXT,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "schedule_type" "ScheduleType" NOT NULL DEFAULT 'CRON',
    "cron_schedule" TEXT,
    "event_name" TEXT,
    "retries" INTEGER DEFAULT 0,
    "concurrency_limit" INTEGER DEFAULT 1,
    "timeout" INTEGER,
    "category" "TaskCategory" NOT NULL DEFAULT 'SYSTEM',
    "metadata" JSONB,
    "last_synced_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "code_version" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "scheduled_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_executions" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "status" "ExecutionStatus" NOT NULL DEFAULT 'RUNNING',
    "triggered_by" "TriggerSource" NOT NULL DEFAULT 'SCHEDULE',
    "triggered_by_user" TEXT,
    "inngest_run_id" TEXT,
    "inngest_event_id" TEXT,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ,
    "duration" INTEGER,
    "result" JSONB,
    "error" TEXT,
    "stack_trace" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "steps" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_executions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "scheduled_tasks_function_id_key" ON "scheduled_tasks"("function_id");

-- CreateIndex
CREATE INDEX "scheduled_tasks_function_id_idx" ON "scheduled_tasks"("function_id");

-- CreateIndex
CREATE INDEX "scheduled_tasks_is_enabled_idx" ON "scheduled_tasks"("is_enabled");

-- CreateIndex
CREATE INDEX "scheduled_tasks_category_idx" ON "scheduled_tasks"("category");

-- CreateIndex
CREATE INDEX "scheduled_tasks_schedule_type_idx" ON "scheduled_tasks"("schedule_type");

-- CreateIndex
CREATE UNIQUE INDEX "task_executions_inngest_run_id_key" ON "task_executions"("inngest_run_id");

-- CreateIndex
CREATE INDEX "task_executions_task_id_idx" ON "task_executions"("task_id");

-- CreateIndex
CREATE INDEX "task_executions_task_id_started_at_idx" ON "task_executions"("task_id", "started_at" DESC);

-- CreateIndex
CREATE INDEX "task_executions_status_idx" ON "task_executions"("status");

-- CreateIndex
CREATE INDEX "task_executions_inngest_run_id_idx" ON "task_executions"("inngest_run_id");

-- CreateIndex
CREATE INDEX "task_executions_started_at_idx" ON "task_executions"("started_at");

-- AddForeignKey
ALTER TABLE "task_executions" ADD CONSTRAINT "task_executions_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "scheduled_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

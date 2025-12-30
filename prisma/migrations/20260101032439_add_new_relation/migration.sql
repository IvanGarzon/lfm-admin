-- AddForeignKey
ALTER TABLE "task_executions" ADD CONSTRAINT "task_executions_triggered_by_user_fkey" FOREIGN KEY ("triggered_by_user") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

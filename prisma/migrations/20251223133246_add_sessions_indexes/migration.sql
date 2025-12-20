-- CreateIndex
CREATE INDEX "sessions_user_id_is_active_idx" ON "sessions"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "sessions_user_id_last_active_at_idx" ON "sessions"("user_id", "last_active_at");

-- CreateIndex
CREATE INDEX "sessions_expires_is_active_idx" ON "sessions"("expires", "is_active");

-- CreateIndex
CREATE INDEX "sessions_is_active_last_active_at_idx" ON "sessions"("is_active", "last_active_at");

-- CreateTable
CREATE TABLE "two_factor_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "otp_code" TEXT NOT NULL,
    "challenge_token" TEXT NOT NULL,
    "user_agent" TEXT,
    "requested_ip_address" INET,
    "logged_in_ip_address" INET,
    "number_of_attempts" INTEGER NOT NULL DEFAULT 0,
    "expires" TIMESTAMPTZ NOT NULL,
    "used_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "two_factor_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "two_factor_tokens_user_id_key" ON "two_factor_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "two_factor_tokens_challenge_token_key" ON "two_factor_tokens"("challenge_token");

-- AddForeignKey
ALTER TABLE "two_factor_tokens" ADD CONSTRAINT "two_factor_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

/*
  Warnings:

  - Made the column `payee` on table `transactions` required. This step will fail if there are existing NULL values in that column.

*/

-- First, populate any NULL payee values from vendor name
UPDATE "transactions"
SET "payee" = "vendors"."name"
FROM "vendors"
WHERE "transactions"."vendor_id" = "vendors"."id"
  AND "transactions"."payee" IS NULL;

-- Set a default for any remaining NULL values (shouldn't happen, but just in case)
UPDATE "transactions"
SET "payee" = 'Unknown'
WHERE "payee" IS NULL;

-- Now make the column NOT NULL
ALTER TABLE "transactions" ALTER COLUMN "payee" SET NOT NULL;

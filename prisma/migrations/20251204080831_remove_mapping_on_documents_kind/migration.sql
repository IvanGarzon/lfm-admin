/*
  Warnings:

  - The values [Invoice,Receipt,Quote] on the enum `DocumentKind` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DocumentKind_new" AS ENUM ('INVOICE', 'RECEIPT', 'QUOTE');
ALTER TABLE "documents" ALTER COLUMN "kind" TYPE "DocumentKind_new" USING ("kind"::text::"DocumentKind_new");
ALTER TYPE "DocumentKind" RENAME TO "DocumentKind_old";
ALTER TYPE "DocumentKind_new" RENAME TO "DocumentKind";
DROP TYPE "public"."DocumentKind_old";
COMMIT;

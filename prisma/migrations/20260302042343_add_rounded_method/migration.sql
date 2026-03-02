/*
  Warnings:

  - The `rounding_method` column on the `recipes` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "RoundingMethod" AS ENUM ('NEAREST', 'PSYCHOLOGICAL_99', 'PSYCHOLOGICAL_95');

-- AlterTable
ALTER TABLE "recipes" DROP COLUMN "rounding_method",
ADD COLUMN     "rounding_method" "RoundingMethod" DEFAULT 'NEAREST';

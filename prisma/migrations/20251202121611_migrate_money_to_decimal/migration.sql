/*
  Warnings:

  - You are about to alter the column `unit_price` on the `invoice_items` table. The data in that column could be lost. The data in that column will be cast from `Money` to `Decimal(15,2)`.
  - You are about to alter the column `total` on the `invoice_items` table. The data in that column could be lost. The data in that column will be cast from `Money` to `Decimal(15,2)`.
  - You are about to alter the column `amount` on the `invoices` table. The data in that column could be lost. The data in that column will be cast from `Money` to `Decimal(15,2)`.
  - You are about to alter the column `discount` on the `invoices` table. The data in that column could be lost. The data in that column will be cast from `Money` to `Decimal(15,2)`.
  - You are about to alter the column `price` on the `products` table. The data in that column could be lost. The data in that column will be cast from `Money` to `Decimal(15,2)`.
  - You are about to alter the column `unit_price` on the `quote_items` table. The data in that column could be lost. The data in that column will be cast from `Money` to `Decimal(15,2)`.
  - You are about to alter the column `total` on the `quote_items` table. The data in that column could be lost. The data in that column will be cast from `Money` to `Decimal(15,2)`.
  - You are about to alter the column `amount` on the `quotes` table. The data in that column could be lost. The data in that column will be cast from `Money` to `Decimal(15,2)`.
  - You are about to alter the column `discount` on the `quotes` table. The data in that column could be lost. The data in that column will be cast from `Money` to `Decimal(15,2)`.

*/
-- AlterTable
ALTER TABLE "invoice_items" ALTER COLUMN "unit_price" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "total" SET DATA TYPE DECIMAL(15,2);

-- AlterTable
ALTER TABLE "invoices" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "discount" SET DATA TYPE DECIMAL(15,2);

-- AlterTable
ALTER TABLE "products" ALTER COLUMN "price" SET DATA TYPE DECIMAL(15,2);

-- AlterTable
ALTER TABLE "quote_items" ALTER COLUMN "unit_price" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "total" SET DATA TYPE DECIMAL(15,2);

-- AlterTable
ALTER TABLE "quotes" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "discount" SET DATA TYPE DECIMAL(15,2);

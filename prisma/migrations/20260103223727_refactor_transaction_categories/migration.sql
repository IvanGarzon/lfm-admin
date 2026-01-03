-- CreateTable
CREATE TABLE "transaction_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "transaction_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_category_on_transaction" (
    "transaction_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_category_on_transaction_pkey" PRIMARY KEY ("transaction_id","category_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transaction_categories_name_key" ON "transaction_categories"("name");

-- CreateIndex
CREATE INDEX "transaction_category_on_transaction_transaction_id_idx" ON "transaction_category_on_transaction"("transaction_id");

-- CreateIndex
CREATE INDEX "transaction_category_on_transaction_category_id_idx" ON "transaction_category_on_transaction"("category_id");

-- Seed default categories
INSERT INTO "transaction_categories" ("id", "name", "description", "is_active", "created_at", "updated_at")
VALUES
    (gen_random_uuid()::text, 'SALES', 'Income from sales and services', true, NOW(), NOW()),
    (gen_random_uuid()::text, 'OFFICE_SUPPLIES', 'Office supplies and materials', true, NOW(), NOW()),
    (gen_random_uuid()::text, 'SALARY', 'Employee salaries and wages', true, NOW(), NOW()),
    (gen_random_uuid()::text, 'RENT', 'Rent and lease payments', true, NOW(), NOW()),
    (gen_random_uuid()::text, 'CONTRACTORS', 'Contractor and freelancer payments', true, NOW(), NOW()),
    (gen_random_uuid()::text, 'SOFTWARE', 'Software subscriptions and licenses', true, NOW(), NOW()),
    (gen_random_uuid()::text, 'MARKETING', 'Marketing and advertising expenses', true, NOW(), NOW()),
    (gen_random_uuid()::text, 'UTILITIES', 'Utilities and services', true, NOW(), NOW()),
    (gen_random_uuid()::text, 'TAXES', 'Taxes and government fees', true, NOW(), NOW()),
    (gen_random_uuid()::text, 'OTHER', 'Other miscellaneous transactions', true, NOW(), NOW());

-- Migrate existing category data
INSERT INTO "transaction_category_on_transaction" ("transaction_id", "category_id", "assigned_at")
SELECT
    t.id,
    tc.id,
    t.created_at
FROM transactions t
JOIN transaction_categories tc ON tc.name = t.category
WHERE t.category IS NOT NULL;

-- Drop the old category column
ALTER TABLE "transactions" DROP COLUMN "category";

-- AddForeignKey
ALTER TABLE "transaction_category_on_transaction" ADD CONSTRAINT "transaction_category_on_transaction_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_category_on_transaction" ADD CONSTRAINT "transaction_category_on_transaction_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "transaction_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
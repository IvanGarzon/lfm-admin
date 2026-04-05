-- Stage 2: Add tenant_id to all business entity tables
-- This migration scopes all business data to a specific tenant.
-- Existing rows are backfilled to the Las Flores Melbourne tenant (lfm_tenant_seed_001).

-- -- Step 1: Add tenant_id columns as nullable --------------------------------

ALTER TABLE "customers"             ADD COLUMN "tenant_id" TEXT;
ALTER TABLE "organizations"         ADD COLUMN "tenant_id" TEXT;
ALTER TABLE "vendors"               ADD COLUMN "tenant_id" TEXT;
ALTER TABLE "employees"             ADD COLUMN "tenant_id" TEXT;
ALTER TABLE "products"              ADD COLUMN "tenant_id" TEXT;
ALTER TABLE "invoices"              ADD COLUMN "tenant_id" TEXT;
ALTER TABLE "quotes"                ADD COLUMN "tenant_id" TEXT;
ALTER TABLE "transactions"          ADD COLUMN "tenant_id" TEXT;
ALTER TABLE "recipes"               ADD COLUMN "tenant_id" TEXT;
ALTER TABLE "recipe_groups"         ADD COLUMN "tenant_id" TEXT;
ALTER TABLE "recipe_units"          ADD COLUMN "tenant_id" TEXT;
ALTER TABLE "price_list_items"      ADD COLUMN "tenant_id" TEXT;
ALTER TABLE "transaction_categories" ADD COLUMN "tenant_id" TEXT;

-- -- Step 2: Backfill all existing rows to Las Flores Melbourne ---------------

UPDATE "customers"             SET "tenant_id" = 'lfm_tenant_seed_001' WHERE "tenant_id" IS NULL;
UPDATE "organizations"         SET "tenant_id" = 'lfm_tenant_seed_001' WHERE "tenant_id" IS NULL;
UPDATE "vendors"               SET "tenant_id" = 'lfm_tenant_seed_001' WHERE "tenant_id" IS NULL;
UPDATE "employees"             SET "tenant_id" = 'lfm_tenant_seed_001' WHERE "tenant_id" IS NULL;
UPDATE "products"              SET "tenant_id" = 'lfm_tenant_seed_001' WHERE "tenant_id" IS NULL;
UPDATE "invoices"              SET "tenant_id" = 'lfm_tenant_seed_001' WHERE "tenant_id" IS NULL;
UPDATE "quotes"                SET "tenant_id" = 'lfm_tenant_seed_001' WHERE "tenant_id" IS NULL;
UPDATE "transactions"          SET "tenant_id" = 'lfm_tenant_seed_001' WHERE "tenant_id" IS NULL;
UPDATE "recipes"               SET "tenant_id" = 'lfm_tenant_seed_001' WHERE "tenant_id" IS NULL;
UPDATE "recipe_groups"         SET "tenant_id" = 'lfm_tenant_seed_001' WHERE "tenant_id" IS NULL;
UPDATE "recipe_units"          SET "tenant_id" = 'lfm_tenant_seed_001' WHERE "tenant_id" IS NULL;
UPDATE "price_list_items"      SET "tenant_id" = 'lfm_tenant_seed_001' WHERE "tenant_id" IS NULL;
UPDATE "transaction_categories" SET "tenant_id" = 'lfm_tenant_seed_001' WHERE "tenant_id" IS NULL;

-- -- Step 3: Make tenant_id NOT NULL -----------------------------------------

ALTER TABLE "customers"             ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "organizations"         ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "vendors"               ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "employees"             ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "products"              ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "invoices"              ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "quotes"                ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "transactions"          ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "recipes"               ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "recipe_groups"         ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "recipe_units"          ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "price_list_items"      ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "transaction_categories" ALTER COLUMN "tenant_id" SET NOT NULL;

-- -- Step 4: Add foreign key constraints -------------------------------------

ALTER TABLE "customers"             ADD CONSTRAINT "customers_tenant_id_fkey"              FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "organizations"         ADD CONSTRAINT "organizations_tenant_id_fkey"          FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vendors"               ADD CONSTRAINT "vendors_tenant_id_fkey"                FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "employees"             ADD CONSTRAINT "employees_tenant_id_fkey"              FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "products"              ADD CONSTRAINT "products_tenant_id_fkey"               FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "invoices"              ADD CONSTRAINT "invoices_tenant_id_fkey"               FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "quotes"                ADD CONSTRAINT "quotes_tenant_id_fkey"                 FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transactions"          ADD CONSTRAINT "transactions_tenant_id_fkey"           FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "recipes"               ADD CONSTRAINT "recipes_tenant_id_fkey"                FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "recipe_groups"         ADD CONSTRAINT "recipe_groups_tenant_id_fkey"          FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "recipe_units"          ADD CONSTRAINT "recipe_units_tenant_id_fkey"           FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "price_list_items"      ADD CONSTRAINT "price_list_items_tenant_id_fkey"       FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transaction_categories" ADD CONSTRAINT "transaction_categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- -- Step 5: Drop old global unique constraints, add per-tenant composites ----

-- customers.email was globally unique; now unique per tenant
ALTER TABLE "customers" DROP CONSTRAINT "customers_email_key";
CREATE UNIQUE INDEX "customers_tenant_id_email_key" ON "customers"("tenant_id", "email");

-- vendors.vendor_code was globally unique; now unique per tenant
ALTER TABLE "vendors" DROP CONSTRAINT "vendors_vendor_code_key";
CREATE UNIQUE INDEX "vendors_tenant_id_vendor_code_key" ON "vendors"("tenant_id", "vendor_code");

-- employees.email was globally unique; now unique per tenant
ALTER TABLE "employees" DROP CONSTRAINT "employees_email_key";
CREATE UNIQUE INDEX "employees_tenant_id_email_key" ON "employees"("tenant_id", "email");

-- invoices.invoice_number was globally unique; now unique per tenant
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_invoice_number_key";
CREATE UNIQUE INDEX "invoices_tenant_id_invoice_number_key" ON "invoices"("tenant_id", "invoice_number");

-- quotes.quote_number was globally unique; now unique per tenant
ALTER TABLE "quotes" DROP CONSTRAINT "quotes_quote_number_key";
CREATE UNIQUE INDEX "quotes_tenant_id_quote_number_key" ON "quotes"("tenant_id", "quote_number");

-- transactions.reference_number was globally unique; now unique per tenant
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_reference_number_key";
CREATE UNIQUE INDEX "transactions_tenant_id_reference_number_key" ON "transactions"("tenant_id", "reference_number");

-- recipe_units.name was globally unique; now unique per tenant
ALTER TABLE "recipe_units" DROP CONSTRAINT "recipe_units_name_key";
CREATE UNIQUE INDEX "recipe_units_tenant_id_name_key" ON "recipe_units"("tenant_id", "name");

-- transaction_categories.name was globally unique; now unique per tenant
ALTER TABLE "transaction_categories" DROP CONSTRAINT "transaction_categories_name_key";
CREATE UNIQUE INDEX "transaction_categories_tenant_id_name_key" ON "transaction_categories"("tenant_id", "name");

-- -- Step 6: Add tenant_id indexes for query performance ---------------------

CREATE INDEX "customers_tenant_id_idx"             ON "customers"("tenant_id");
CREATE INDEX "organizations_tenant_id_idx"         ON "organizations"("tenant_id");
CREATE INDEX "vendors_tenant_id_idx"               ON "vendors"("tenant_id");
CREATE INDEX "employees_tenant_id_idx"             ON "employees"("tenant_id");
CREATE INDEX "products_tenant_id_idx"              ON "products"("tenant_id");
CREATE INDEX "invoices_tenant_id_idx"              ON "invoices"("tenant_id");
CREATE INDEX "quotes_tenant_id_idx"                ON "quotes"("tenant_id");
CREATE INDEX "transactions_tenant_id_idx"          ON "transactions"("tenant_id");
CREATE INDEX "recipes_tenant_id_idx"               ON "recipes"("tenant_id");
CREATE INDEX "recipe_groups_tenant_id_idx"         ON "recipe_groups"("tenant_id");
CREATE INDEX "recipe_units_tenant_id_idx"          ON "recipe_units"("tenant_id");
CREATE INDEX "price_list_items_tenant_id_idx"      ON "price_list_items"("tenant_id");
CREATE INDEX "transaction_categories_tenant_id_idx" ON "transaction_categories"("tenant_id");

-- Manual migration: Add selling_price and rename labour_cost
-- Run this SQL manually in your database

BEGIN;

-- 1. Rename labor_cost to labour_cost (preserves data)
ALTER TABLE "recipes" RENAME COLUMN "labor_cost" TO "labour_cost";

-- 2. Add selling_price column
ALTER TABLE "recipes" ADD COLUMN "selling_price" DECIMAL(15,2) NOT NULL DEFAULT 0;

-- 3. Add round_price column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='recipes' AND column_name='round_price') THEN
        ALTER TABLE "recipes" ADD COLUMN "round_price" BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 4. Add rounding_method column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='recipes' AND column_name='rounding_method') THEN
        ALTER TABLE "recipes" ADD COLUMN "rounding_method" TEXT DEFAULT 'NEAREST';
    END IF;
END $$;

COMMIT;

-- After running this SQL, update Prisma with:
-- npx prisma db pull
-- npx prisma generate

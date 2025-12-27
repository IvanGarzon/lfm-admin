-- Add validation check constraints to finance tables
-- Run this with: psql $DATABASE_URL -f scripts/add-validation-constraints.sql
-- Or apply via custom migration

-- ============================================================================
-- QUOTE TABLE CONSTRAINTS
-- ============================================================================

ALTER TABLE "quotes"
ADD CONSTRAINT "quote_amount_non_negative" CHECK (amount >= 0);

ALTER TABLE "quotes"
ADD CONSTRAINT "quote_gst_non_negative" CHECK (gst >= 0);

ALTER TABLE "quotes"
ADD CONSTRAINT "quote_discount_non_negative" CHECK (discount >= 0);

ALTER TABLE "quotes"
ADD CONSTRAINT "quote_gst_percentage_valid" CHECK (gst >= 0 AND gst <= 100);

ALTER TABLE "quotes"
ADD CONSTRAINT "quote_valid_until_after_issued" CHECK (valid_until >= issued_date);

-- ============================================================================
-- QUOTE_ITEM TABLE CONSTRAINTS
-- ============================================================================

ALTER TABLE "quote_items"
ADD CONSTRAINT "quote_item_unit_price_non_negative" CHECK (unit_price >= 0);

ALTER TABLE "quote_items"
ADD CONSTRAINT "quote_item_quantity_positive" CHECK (quantity > 0);

ALTER TABLE "quote_items"
ADD CONSTRAINT "quote_item_total_non_negative" CHECK (total >= 0);

-- ============================================================================
-- INVOICE TABLE CONSTRAINTS
-- ============================================================================

ALTER TABLE "invoices"
ADD CONSTRAINT "invoice_amount_non_negative" CHECK (amount >= 0);

ALTER TABLE "invoices"
ADD CONSTRAINT "invoice_gst_non_negative" CHECK (gst >= 0);

ALTER TABLE "invoices"
ADD CONSTRAINT "invoice_discount_non_negative" CHECK (discount >= 0);

ALTER TABLE "invoices"
ADD CONSTRAINT "invoice_gst_percentage_valid" CHECK (gst >= 0 AND gst <= 100);

ALTER TABLE "invoices"
ADD CONSTRAINT "invoice_due_date_after_issued" CHECK (due_date >= issued_date);

ALTER TABLE "invoices"
ADD CONSTRAINT "invoice_paid_not_exceeds_amount" CHECK (amount_paid <= amount);

-- ============================================================================
-- INVOICE_ITEM TABLE CONSTRAINTS
-- ============================================================================

ALTER TABLE "invoice_items"
ADD CONSTRAINT "invoice_item_unit_price_non_negative" CHECK (unit_price >= 0);

ALTER TABLE "invoice_items"
ADD CONSTRAINT "invoice_item_quantity_positive" CHECK (quantity > 0);

ALTER TABLE "invoice_items"
ADD CONSTRAINT "invoice_item_total_non_negative" CHECK (total >= 0);

-- ============================================================================
-- PAYMENT TABLE CONSTRAINTS
-- ============================================================================

ALTER TABLE "payments"
ADD CONSTRAINT "payment_amount_positive" CHECK (amount > 0);

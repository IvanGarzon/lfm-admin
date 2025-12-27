-- Pre-migration Data Validation Script
-- Run this before adding database constraints to identify any invalid data
-- Date: 2025-12-27

-- ============================================================================
-- QUOTE TABLE VALIDATION
-- ============================================================================

-- Check for negative amounts in Quote table
SELECT
    'Quote: Negative Amount' as issue,
    id,
    quote_number,
    amount,
    gst,
    discount
FROM quotes
WHERE amount < 0 OR gst < 0 OR discount < 0;

-- Check for GST values outside valid percentage range (0-100)
SELECT
    'Quote: Invalid GST Percentage' as issue,
    id,
    quote_number,
    gst
FROM quotes
WHERE gst < 0 OR gst > 100;

-- Check for validUntil date before issuedDate
SELECT
    'Quote: Invalid Date Range' as issue,
    id,
    quote_number,
    issued_date,
    valid_until
FROM quotes
WHERE valid_until < issued_date;

-- Summary of Quote issues
SELECT
    COUNT(*) FILTER (WHERE amount < 0 OR gst < 0 OR discount < 0) as negative_amounts,
    COUNT(*) FILTER (WHERE gst < 0 OR gst > 100) as invalid_gst,
    COUNT(*) FILTER (WHERE valid_until < issued_date) as invalid_dates,
    COUNT(*) as total_quotes
FROM quotes;

-- ============================================================================
-- QUOTE_ITEM TABLE VALIDATION
-- ============================================================================

-- Check for negative or zero quantities
SELECT
    'QuoteItem: Invalid Quantity' as issue,
    qi.id,
    q.quote_number,
    qi.description,
    qi.quantity,
    qi.unit_price,
    qi.total
FROM quote_items qi
JOIN quotes q ON qi.quote_id = q.id
WHERE qi.quantity <= 0;

-- Check for negative prices
SELECT
    'QuoteItem: Negative Price' as issue,
    qi.id,
    q.quote_number,
    qi.description,
    qi.unit_price,
    qi.total
FROM quote_items qi
JOIN quotes q ON qi.quote_id = q.id
WHERE qi.unit_price < 0 OR qi.total < 0;

-- Summary of QuoteItem issues
SELECT
    COUNT(*) FILTER (WHERE quantity <= 0) as invalid_quantities,
    COUNT(*) FILTER (WHERE unit_price < 0 OR total < 0) as negative_prices,
    COUNT(*) as total_items
FROM quote_items;

-- ============================================================================
-- INVOICE TABLE VALIDATION
-- ============================================================================

-- Check for negative amounts in Invoice table
SELECT
    'Invoice: Negative Amount' as issue,
    id,
    invoice_number,
    amount,
    gst,
    discount,
    paid_amount,
    total_amount
FROM invoices
WHERE amount < 0 OR gst < 0 OR discount < 0;

-- Check for GST values outside valid percentage range
SELECT
    'Invoice: Invalid GST Percentage' as issue,
    id,
    invoice_number,
    gst
FROM invoices
WHERE gst < 0 OR gst > 100;

-- Check for dueDate before issuedDate
SELECT
    'Invoice: Invalid Date Range' as issue,
    id,
    invoice_number,
    issued_date,
    due_date
FROM invoices
WHERE due_date < issued_date;

-- Check for amount_paid exceeding amount
SELECT
    'Invoice: Overpaid' as issue,
    id,
    invoice_number,
    amount,
    amount_paid
FROM invoices
WHERE amount_paid > amount;

-- Summary of Invoice issues
SELECT
    COUNT(*) FILTER (WHERE amount < 0 OR gst < 0 OR discount < 0) as negative_amounts,
    COUNT(*) FILTER (WHERE gst < 0 OR gst > 100) as invalid_gst,
    COUNT(*) FILTER (WHERE due_date < issued_date) as invalid_dates,
    COUNT(*) FILTER (WHERE amount_paid > amount) as overpaid,
    COUNT(*) as total_invoices
FROM invoices;

-- ============================================================================
-- INVOICE_ITEM TABLE VALIDATION
-- ============================================================================

-- Check for invalid quantities in InvoiceItem
SELECT
    'InvoiceItem: Invalid Quantity' as issue,
    ii.id,
    i.invoice_number,
    ii.description,
    ii.quantity,
    ii.price,
    ii.total
FROM invoice_items ii
JOIN invoices i ON ii.invoice_id = i.id
WHERE ii.quantity <= 0;

-- Check for negative prices in InvoiceItem
SELECT
    'InvoiceItem: Negative Price' as issue,
    ii.id,
    i.invoice_number,
    ii.description,
    ii.unit_price,
    ii.total
FROM invoice_items ii
JOIN invoices i ON ii.invoice_id = i.id
WHERE ii.unit_price < 0 OR ii.total < 0;

-- Summary of InvoiceItem issues
SELECT
    COUNT(*) FILTER (WHERE quantity <= 0) as invalid_quantities,
    COUNT(*) FILTER (WHERE unit_price < 0 OR total < 0) as negative_prices,
    COUNT(*) as total_items
FROM invoice_items;

-- ============================================================================
-- PAYMENT TABLE VALIDATION
-- ============================================================================

-- Check for non-positive payment amounts
SELECT
    'Payment: Invalid Amount' as issue,
    p.id,
    i.invoice_number,
    p.amount,
    p.date
FROM payments p
JOIN invoices i ON p.invoice_id = i.id
WHERE p.amount <= 0;

-- Summary of Payment issues
SELECT
    COUNT(*) FILTER (WHERE amount <= 0) as invalid_amounts,
    COUNT(*) as total_payments
FROM payments;

-- ============================================================================
-- OVERALL SUMMARY
-- ============================================================================

SELECT
    'VALIDATION SUMMARY' as summary,
    (SELECT COUNT(*) FROM quotes WHERE amount < 0 OR gst < 0 OR discount < 0 OR gst > 100 OR valid_until < issued_date) as quote_issues,
    (SELECT COUNT(*) FROM quote_items WHERE quantity <= 0 OR unit_price < 0 OR total < 0) as quote_item_issues,
    (SELECT COUNT(*) FROM invoices WHERE amount < 0 OR gst < 0 OR discount < 0 OR gst > 100 OR due_date < issued_date OR amount_paid > amount) as invoice_issues,
    (SELECT COUNT(*) FROM invoice_items WHERE quantity <= 0 OR unit_price < 0 OR total < 0) as invoice_item_issues,
    (SELECT COUNT(*) FROM payments WHERE amount <= 0) as payment_issues;

-- If all counts are 0, data is valid and ready for constraint migration

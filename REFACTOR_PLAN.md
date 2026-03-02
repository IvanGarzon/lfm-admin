# TransactionForm Refactoring Plan

## Current Issues

- 508 lines in a single component
- Hard to maintain and test
- Difficult to locate specific fields
- Similar to EmployeeForm before refactoring

## Proposed Component Structure

### 1. TransactionTypeFields Component (Lines 224-310)

**Props:** `control`, `isDisabled`
**Contains:**

- Transaction Type select (INCOME/EXPENSE)
- Currency select (USD, AUD, EUR, GBP)
- Amount input with dollar icon
  **Layout:** 3-column grid

### 2. TransactionCategoryField Component (Lines 312-342)

**Props:** `control`, `isDisabled`, `categories`, `isLoadingCategories`, `onCategoryCreated`
**Contains:**

- CategoryMultiSelect with loading state
- Handles category creation callback

### 3. TransactionPayeeField Component (Lines 344-384)

**Props:** `control`, `isDisabled`, `transactionType`, `vendors`
**Contains:**

- Conditional rendering based on transaction type
- VendorSelect for EXPENSE
- Payee Input for INCOME
  **Logic:** Auto-populates payee when vendor is selected

### 4. TransactionDescriptionField Component (Lines 386-409)

**Props:** `control`, `isDisabled`
**Contains:**

- Textarea for description
- 3 rows, non-resizable

### 5. TransactionDateStatusFields Component (Lines 411-469)

**Props:** `control`, `isDisabled`
**Contains:**

- Date picker with Calendar popover
- Status select (COMPLETED, PENDING, CANCELLED)
  **Layout:** 2-column grid

### 6. TransactionAttachments Component ✅

**Already extracted!**

## Implementation Steps

1. Create separate component files in `src/features/finances/transactions/components/form-fields/`
   - `transaction-type-fields.tsx`
   - `transaction-category-field.tsx`
   - `transaction-payee-field.tsx`
   - `transaction-description-field.tsx`
   - `transaction-date-status-fields.tsx`

2. Extract each section maintaining the same Controller/Field pattern

3. Update main TransactionForm to use the new components

4. Test thoroughly to ensure no regressions

## Benefits

- ✅ Easier to maintain and debug
- ✅ Better code organization
- ✅ Improved testability
- ✅ Clearer separation of concerns
- ✅ Consistent with EmployeeForm pattern
- ✅ Easier to add new fields or modify existing ones

## Estimated Reduction

**From:** 508 lines
**To:** ~200 lines (main form) + 5 small focused components (~50 lines each)

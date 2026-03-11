# Dead Code Analysis Report

**Generated:** 2026-03-11
**Project:** lfm-admin
**Total Files Analyzed:** 548

---

## Executive Summary

This analysis identified potential dead code across your codebase using custom static analysis. The findings are categorized into:

1. **Unused Exports** - 288 items
2. **Unused Imports** - 195 items
3. **Unreachable Code** - 530 instances (likely false positives)
4. **Potentially Unused Files** - 403 files (many false positives due to barrel exports)

---

## 1. Unused Exports (288)

These are functions, components, types, or constants that are exported but never imported anywhere in the codebase.

### High Priority - UI Components

These components appear to be unused and could likely be removed:

**Components:**

- `src/components/Layout/PageContainer.tsx` - PageContainer
- `src/components/Meta/index.tsx` - Meta
- `src/components/mode-toggle.tsx` - ModeToggle
- `src/components/nav-main.tsx` - NavMain
- `src/components/nav-projects.tsx` - NavProjects
- `src/components/nav-user.tsx` - NavUser
- `src/components/sessions/CustomerItem.tsx` - CustomerItem
- `src/components/social-icons.tsx` - AppleIcon, KakaoIcon, NaverIcon, GithubIcon
- `src/components/team-switcher.tsx` - TeamSwitcher

**Data Table Components:**

- `src/components/data-table/data-table-action-bar.tsx` - DataTableActionBar, DataTableActionBarAction, DataTableActionBarSelection
- `src/components/data-table/data-table-advanced-toolbar.tsx` - DataTableAdvancedToolbar
- `src/components/data-table/data-table-filter-menu.tsx` - DataTableFilterMenu
- `src/components/data-table/data-table-sort-list.tsx` - DataTableSortList

**Address Autocomplete:**

- `src/components/ui/address-autocomplete/address-autocomplete.tsx` - AddressAutoComplete
- `src/components/ui/address-autocomplete/autocomplete-validator.ts` - isValidAutocomplete

### Medium Priority - UI Component Parts

These are component sub-parts that might be used but not detected:

**Alert Dialog:**

- AlertDialogPortal, AlertDialogOverlay, AlertDialogTrigger

**Drawer:**

- DrawerClose, DrawerFooter, DrawerTrigger

**Dialog:**

- DialogPortal, DialogOverlay, DialogClose

**Dropdown Menu:**

- DropdownMenuRadioItem, DropdownMenuPortal, DropdownMenuSub, etc.

**Sheet:**

- SheetPortal, SheetOverlay, SheetTrigger, SheetClose, SheetFooter

### Low Priority - Utilities & Types

**Type Exports (may be used in type annotations):**

- `src/components/ui/box.tsx` - BoxProps
- `src/components/ui/input.tsx` - InputProps
- `src/schemas/common.ts` - SortingItem, sortingSchema, etc.

**Utility Functions:**

- `src/lib/utils.ts` - focusInput, hasErrorInput, formatNumber, formatPercentage, nFormatter, etc.
- `src/lib/validation-middleware.ts` - containsSuspiciousPatterns, validateSortParameter, etc.

### Email Templates

**Unused Email Components:**

- `src/emails/invoice-email.tsx` - InvoiceContent
- `src/emails/quote-email.tsx` - QuoteContent
- `src/emails/quote-followup-email.tsx` - QuoteFollowUpContent
- `src/emails/receipt-email.tsx` - ReceiptContent
- `src/emails/reminder-email.tsx` - ReminderContent

### Feature-Specific Exports

**Customer Utils:**

- `src/features/crm/customers/utils/get-customer-address.ts` - getEffectiveAddress, getAddressSource, hasValidAddress

**Invoice Utils:**

- `src/features/finances/invoices/utils/invoice-helpers.ts` - VALID_INVOICE_STATUS_TRANSITIONS, canTransitionInvoiceStatus, etc.

**Quote Utils:**

- `src/features/finances/quotes/utils/quote-helpers.ts` - VALID_QUOTE_STATUS_TRANSITIONS, QuotePermissions, etc.

**Session Utils:**

- `src/features/sessions/utils/session-icons.tsx` - getOSIcon, getBrowserIcon

### Test Factories (Intentionally Unused in Production)

These are test utilities and should be ignored:

- `src/lib/testing/factories/*` - All factory functions
- `src/lib/testing/id-generator.ts` - generateTestId

---

## 2. Unused Imports (195)

These are imports that are declared but never used in their respective files.

### Common Patterns

**Type-only imports in action files:**
Many action files import types that appear unused but may be used for type annotations:

```typescript
// src/actions/crm/customers/mutations.ts
type CreateCustomerInput from '@/schemas/customers'  // Unused
type UpdateCustomerInput from '@/schemas/customers'  // Unused
type DeleteCustomerInput from '@/schemas/customers'  // Unused
```

**React imports:**
Some files import React unnecessarily:

```typescript
// src/app/(protected)/overview/@sales/loading.tsx
React from 'react'  // Unused in modern React
```

**NextAuth types:**

```typescript
// src/auth/config.ts
type NextAuthConfig from 'next-auth'  // Unused
type Account from 'next-auth'  // Unused
type Profile from 'next-auth'  // Unused
```

### Recommendations for Unused Imports

1. **Remove unused React imports** - Modern React doesn't require importing React for JSX
2. **Review type imports** - Many of these might be actually used but not detected
3. **Clean up commented code** - Several files have commented imports

---

## 3. Unreachable Code (530 instances)

⚠️ **Note:** Most of these are FALSE POSITIVES. The analyzer detects code after `return` statements, but many are valid JSX returns.

**Example of false positive:**

```tsx
return (
  <div>  // <-- Analyzer incorrectly flags this as unreachable
    ...
  </div>
)
```

### Action Items

- Manually review files flagged for unreachable code
- Most will be valid JSX patterns
- Look for actual unreachable code after early returns in functions

---

## 4. Potentially Unused Files (403)

⚠️ **Note:** Many of these are FALSE POSITIVES due to barrel exports (index.ts re-exports).

### Files That Are Likely Actually Unused

**Root Level:**

- `src/proxy.ts`
- `src/rate-limiter.ts`
- `src/routes.ts`

**Legacy Components:**

- `src/components/Auth/SignIn.tsx`
- `src/components/Layout/DashboardLayout.tsx`
- `src/components/Layout/MainLayout.tsx`
- `src/components/GoogleSignInButton.tsx`
- `src/components/Loader/index.tsx`

### Files That Are Actually Used (Via Barrel Exports)

Most action files, repositories, and schemas are used via their `index.ts` re-exports:

- All files in `src/actions/**` directories
- All files in `src/repositories/`
- All files in `src/schemas/`
- All files in `src/filters/`

---

## Recommendations

### Immediate Actions (High Confidence)

1. **Remove unused navigation components:**
   - NavMain, NavProjects, NavUser, TeamSwitcher
   - These appear to be from a template and not used

2. **Remove unused social icons:**
   - AppleIcon, KakaoIcon, NaverIcon, GithubIcon
   - Unless you plan to use these for OAuth

3. **Clean up unused imports:**
   - Remove React imports from files that don't need them
   - Remove commented-out imports

4. **Remove root-level unused files:**
   - Review `proxy.ts`, `rate-limiter.ts`, `routes.ts`

### Medium Priority (Review First)

1. **Data table components:**
   - Review if DataTableActionBar, DataTableAdvancedToolbar are needed
   - Some advanced filtering components may be intentionally unused

2. **Email template exports:**
   - InvoiceContent, QuoteContent, etc. might be used dynamically
   - Verify before removing

3. **Address autocomplete:**
   - AddressAutoComplete component appears unused
   - Check if this is legacy code or planned feature

### Low Priority (Keep for Now)

1. **UI component sub-parts:**
   - DialogPortal, SheetOverlay, etc. may be used by the library
   - Don't remove unless certain

2. **Type exports:**
   - BoxProps, InputProps, etc. might be used in type annotations
   - TypeScript doesn't always track these correctly

3. **Utility functions:**
   - Keep unless you're absolutely sure they're unused
   - Some might be called dynamically

4. **Test utilities:**
   - Keep all test factories and mocks
   - These are intentionally not imported in production code

---

## How to Verify Before Deleting

### For Components and Functions

```bash
# Search for usage across the entire codebase
grep -r "ComponentName" src/

# Search for imports
grep -r "import.*ComponentName" src/
```

### For Files

```bash
# Check if file is imported anywhere
grep -r "from.*path/to/file" src/
grep -r "import.*from.*file" src/
```

### Using Your IDE

1. Right-click on the export → "Find All References"
2. Check if there are any references outside the file itself

---

## Scripts Generated

Two analysis scripts were created for this report:

1. **`dead-code-analyzer.mjs`** - Finds unused exports, imports, and unreachable code
2. **`find-unused-files.mjs`** - Finds files that are never imported

Run them anytime to check for dead code:

```bash
node dead-code-analyzer.mjs
node find-unused-files.mjs
```

---

## Next Steps

1. **Review the high-priority items** and remove confirmed dead code
2. **Set up a pre-commit hook** to run the analyzer
3. **Consider using ESLint rules** for unused imports:
   ```json
   {
     "rules": {
       "no-unused-vars": "warn",
       "@typescript-eslint/no-unused-vars": "warn"
     }
   }
   ```
4. **Run the analyzer monthly** to keep the codebase clean

---

## Notes

- This analysis is based on static code analysis and may have false positives
- Always verify before deleting code, especially:
  - Code that might be used via dynamic imports
  - Code that might be called from external systems
  - Type definitions that might be used in annotations
- The "unreachable code" section has many false positives for JSX returns
- Many "unused files" are actually used via barrel exports (index.ts)

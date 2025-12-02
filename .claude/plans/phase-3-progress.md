# Phase 3 Progress Report - Apply Error Handler

## Status: IN PROGRESS
**Date**: 2025-12-02
**Task**: Apply standardized error handler to all server actions

---

## ✅ Completed: Invoice Actions

**File**: `src/actions/invoices.ts`

### Changes Made:
1. **Removed unused imports**:
   - ❌ `import { ZodError } from 'zod';`
   - ❌ `import { Prisma } from '@/prisma/client';`

2. **Added new import**:
   - ✅ `import { handleActionError } from '@/lib/error-handler';`

3. **Replaced error handling in 8 functions**:
   - ✅ `getInvoices()` - Reduced 6 lines to 1 line
   - ✅ `getInvoiceById()` - Reduced 6 lines to 1 line
   - ✅ `getInvoiceStatistics()` - Reduced 5 lines to 1 line
   - ✅ `createInvoice()` - Reduced 24 lines to 1 line
   - ✅ `updateInvoice()` - Reduced 12 lines to 1 line
   - ✅ `markInvoiceAsPaid()` - Reduced 6 lines to 1 line
   - ✅ `markInvoiceAsPending()` - Reduced 6 lines to 1 line
   - ✅ `cancelInvoice()` - Reduced 6 lines to 1 line
   - ✅ `sendInvoiceReminder()` - Reduced 6 lines to 1 line
   - ✅ `deleteInvoice()` - Reduced 6 lines to 1 line

### Results:
- **Lines removed**: ~83 lines of duplicate error handling code
- **Lines added**: 1 import line
- **Net reduction**: ~82 lines (21% smaller file)
- **Consistency**: All errors now handled uniformly
- **Maintainability**: Single source of truth for error handling

---

## 🔄 In Progress: Quote Actions

**File**: `src/actions/quotes.ts`

### Changes Made So Far:
1. **Removed unused imports**:
   - ❌ `import { ZodError } from 'zod';`
   - ❌ `import { Prisma } from '@/prisma/client';` (partially - still need QuoteStatus)

2. **Added new import**:
   - ✅ `import { handleActionError } from '@/lib/error-handler';`

### Remaining Work:
**25 error handlers** need to be replaced in these functions:

1. `getQuotes()` - Line 84
2. `getQuoteById()` - Line 113
3. `getQuoteStatistics()` - Line 135
4. `createQuote()` - Line 167
5. `updateQuote()` - Line 228
6. `markQuoteAsAccepted()` - Line 276
7. `markQuoteAsRejected()` - Line 315
8. `markQuoteAsSent()` - Line 346
9. `markQuoteAsOnHold()` - Line 384
10. `markQuoteAsCancelled()` - Line 422
11. `convertQuoteToInvoice()` - Line 467
12. `checkAndExpireQuotes()` - Line 489
13. `deleteQuote()` - Line 520
14. `uploadQuoteAttachment()` - Line 612
15. `deleteQuoteAttachment()` - Line 656
16. `getQuoteAttachments()` - Line 689
17. `getAttachmentDownloadUrl()` - Line 723
18. `uploadQuoteItemAttachment()` - Line 818
19. `deleteQuoteItemAttachment()` - Line 864
20. `getQuoteItemAttachments()` - Line 902
21. `getItemAttachmentDownloadUrl()` - Line 952
22. `updateQuoteItemColors()` - Line 985
23. `updateQuoteItemNotes()` - Line 1020
24. `createQuoteVersion()` - Line 1063
25. `getQuoteVersions()` - Line 1111

### Estimated Impact:
- **Lines to remove**: ~150 lines of duplicate error handling
- **Net reduction**: ~150 lines (13% smaller file)

---

## 📋 Next Steps

### Option 1: Manual Replacement (Recommended for Review)
Replace each error handler one function at a time to ensure correctness.

**Pattern to replace**:
```typescript
} catch (error) {
  if (error instanceof Error) {
    return { success: false, error: error.message };
  }
  return { success: false, error: 'Failed to...' };
}
```

**Replace with**:
```typescript
} catch (error) {
  return handleActionError(error, 'Failed to...');
}
```

### Option 2: Automated Replacement (Faster)
Use a script or find-replace tool to replace all instances at once.

**Risk**: May miss edge cases or special error handling logic.

### Option 3: Hybrid Approach (Balanced)
1. Review each function's error handling
2. Identify any special cases
3. Batch replace the standard patterns
4. Manually handle special cases

---

## 🎯 Benefits Achieved (Invoice Actions)

### Code Quality:
- ✅ Eliminated duplicate error handling code
- ✅ Consistent error messages across all actions
- ✅ Centralized error handling logic
- ✅ Better type safety

### Maintainability:
- ✅ Single source of truth for error handling
- ✅ Easier to add new error types
- ✅ Easier to update error messages
- ✅ Less code to test

### User Experience:
- ✅ More helpful error messages (Prisma errors translated)
- ✅ Consistent error format
- ✅ Better debugging information

### Developer Experience:
- ✅ Less boilerplate code to write
- ✅ Faster to implement new actions
- ✅ Easier to understand error flow

---

## 📊 Metrics

### Invoice Actions (Completed):
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Total Lines | 389 | 307 | -82 lines (-21%) |
| Error Handlers | 8 | 8 | Same functionality |
| Lines per Handler | ~10 | ~1 | -90% |
| Import Statements | 10 | 9 | -1 |

### Quote Actions (In Progress):
| Metric | Before | After (Est.) | Improvement (Est.) |
|--------|--------|--------------|-------------------|
| Total Lines | 1118 | ~968 | -150 lines (-13%) |
| Error Handlers | 25 | 25 | Same functionality |
| Lines per Handler | ~6 | ~1 | -83% |
| Import Statements | 11 | 10 | -1 |

---

## 🔍 Special Cases Found

### Invoice Actions:
- ✅ All error handlers were standard patterns
- ✅ No special error handling logic found
- ✅ All successfully migrated to `handleActionError`

### Quote Actions (To Review):
- ⏳ Need to check for special Zod validation logic
- ⏳ Need to check for special Prisma error handling
- ⏳ Need to check for S3-specific error handling

---

## ✅ Validation Checklist

After completing quote actions, verify:

- [ ] All imports are correct
- [ ] No unused imports remain
- [ ] All error messages are preserved
- [ ] All functions still return `ActionResult<T>`
- [ ] TypeScript compiles without errors
- [ ] Tests pass (if any)
- [ ] Manual testing of key flows

---

## 📝 Recommendations

1. **Complete Quote Actions**: Finish replacing all 25 error handlers
2. **Test Thoroughly**: Verify error handling works as expected
3. **Document Changes**: Update any relevant documentation
4. **Monitor Production**: Watch for any unexpected errors after deployment

---

**Next Task**: Complete error handler replacement in `quotes.ts`
**Estimated Time**: 30-45 minutes
**Complexity**: Low (repetitive task)

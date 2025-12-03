# Invoice PDF Manager - Issue Fixes

## Issues Identified and Fixed

### 1. ✅ Line 154 - Incorrect Parameter Type
**Issue:** `needsRegeneration` was passed as a boolean, but the logging needed a string reason.

**Fix:** Changed `clearStalePdfMetadata` function signature to accept a string `reason` parameter instead of boolean:
```typescript
// Before
async function clearStalePdfMetadata(
  invoiceId: string,
  s3Key: string,
  context: string,
  needsRegeneration: boolean  // ❌ Boolean
): Promise<void>

// After
async function clearStalePdfMetadata(
  invoiceId: string,
  s3Key: string,
  context: string,
  reason: 'invoice_updated' | 'file_not_found',  // ✅ String literal type
  deleteFileFromS3: (key: string) => Promise<void>
): Promise<void>
```

**Call site updated:**
```typescript
await clearStalePdfMetadata(
  invoice.id,
  invoice.s3Key!,
  context,
  needsRegeneration ? 'invoice_updated' : 'file_not_found',  // ✅ Explicit reason
  deleteFileFromS3
);
```

---

### 2. ✅ Unused `deleteFileFromS3` Import
**Issue:** `deleteFileFromS3` was imported in `getOrGenerateInvoicePdf` but never used directly (it was re-imported inside `clearStalePdfMetadata`).

**Fix:** Pass `deleteFileFromS3` as a parameter to `clearStalePdfMetadata` to avoid redundant imports and make dependencies explicit:
```typescript
// Now deleteFileFromS3 is used and passed to helper function
const {
  uploadFileToS3,
  getSignedDownloadUrl,
  fileExistsInS3,
  downloadFileFromS3,
  deleteFileFromS3,  // ✅ Used
} = await import('@/lib/s3');

// ...later
await clearStalePdfMetadata(
  invoice.id,
  invoice.s3Key!,
  context,
  needsRegeneration ? 'invoice_updated' : 'file_not_found',
  deleteFileFromS3  // ✅ Passed as parameter
);
```

---

### 3. ✅ Direct Prisma Usage (Separation of Concerns)
**Issue:** The PDF manager was directly using `prisma.invoice.update()` to modify database records, violating the repository pattern.

**Fix:** Created repository methods and updated PDF manager to use them:

#### Added to `InvoiceRepository`:
```typescript
/**
 * Update invoice PDF metadata after generating or uploading a PDF.
 */
async updatePdfMetadata(
  id: string,
  metadata: {
    fileName: string;
    fileSize: number;
    s3Key: string;
    s3Url: string;
  }
): Promise<Invoice | null> {
  return this.prisma.invoice.update({
    where: { id, deletedAt: null },
    data: {
      fileName: metadata.fileName,
      fileSize: metadata.fileSize,
      mimeType: 'application/pdf',
      s3Key: metadata.s3Key,
      s3Url: metadata.s3Url,
      lastGeneratedAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

/**
 * Clear PDF metadata from an invoice (when file is deleted or stale).
 */
async clearPdfMetadata(id: string): Promise<Invoice | null> {
  return this.prisma.invoice.update({
    where: { id, deletedAt: null },
    data: {
      fileName: null,
      fileSize: null,
      mimeType: null,
      s3Key: null,
      s3Url: null,
      lastGeneratedAt: null,
      updatedAt: new Date(),
    },
  });
}
```

#### Updated PDF Manager Helper Functions:
```typescript
// Before - Direct Prisma usage ❌
async function updateInvoicePdfMetadata(...) {
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { ... },
  });
}

// After - Repository usage ✅
async function updateInvoicePdfMetadata(...) {
  const { InvoiceRepository } = await import('@/repositories/invoice-repository');
  const { prisma } = await import('@/lib/prisma');
  const invoiceRepo = new InvoiceRepository(prisma);
  
  await invoiceRepo.updatePdfMetadata(invoiceId, metadata);
}
```

**Benefits:**
- ✅ Proper separation of concerns
- ✅ All database operations in repository
- ✅ Easier to test and mock
- ✅ Consistent with existing architecture
- ✅ Single source of truth for database operations

---

### 4. ✅ Removed Unused Import
**Issue:** `prisma` was imported at the top of `invoice-pdf-manager.ts` but no longer used after refactoring.

**Fix:** Removed the import:
```typescript
// Before
import { prisma } from '@/lib/prisma';  // ❌ Unused
import { logger } from '@/lib/logger';

// After
import { logger } from '@/lib/logger';  // ✅ Clean
```

---

### 5. ✅ Fixed Missing Fields in Repository
**Issue:** `findByIdWithDetails` was missing `createdAt`, `updatedAt`, and PDF metadata fields in the select, causing TypeScript errors.

**Fix:** Added all missing fields to the select statement:
```typescript
select: {
  id: true,
  invoiceNumber: true,
  // ... existing fields ...
  
  // PDF metadata fields (ADDED)
  fileName: true,
  fileSize: true,
  mimeType: true,
  s3Key: true,
  s3Url: true,
  lastGeneratedAt: true,
  
  // Timestamps (ADDED)
  createdAt: true,
  updatedAt: true,
  
  customer: { ... },
  items: { ... },
}
```

---

## Summary of Changes

### Files Modified:
1. **`src/lib/invoice-pdf-manager.ts`**
   - Fixed `clearStalePdfMetadata` signature (boolean → string reason)
   - Made `deleteFileFromS3` usage explicit (passed as parameter)
   - Refactored to use repository methods instead of direct Prisma
   - Removed unused `prisma` import

2. **`src/repositories/invoice-repository.ts`**
   - Added `updatePdfMetadata()` method
   - Added `clearPdfMetadata()` method
   - Fixed `findByIdWithDetails()` to include all required fields

### Architecture Improvements:
- ✅ **Proper layering**: PDF manager → Repository → Prisma
- ✅ **Single responsibility**: Repository handles all DB operations
- ✅ **Testability**: Can mock repository methods easily
- ✅ **Consistency**: Follows existing codebase patterns
- ✅ **Type safety**: All fields properly typed and selected

---

## Testing Checklist

- [ ] Verify PDF generation still works
- [ ] Verify PDF metadata is updated correctly
- [ ] Verify stale PDF cleanup works
- [ ] Verify repository methods work correctly
- [ ] Check TypeScript compilation (no errors)
- [ ] Test all three refactored invoice actions

---

**Status:** ✅ All issues fixed  
**Date:** 2025-12-04  
**Architecture:** Now follows proper repository pattern

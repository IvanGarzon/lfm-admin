# Architecture Refactoring: PDF Metadata Persistence

## 🔄 Changes Made

### 1. Moved Persistence Responsibility to Actions
**Goal:** Keep all database transactions within the actions layer (`src/actions/invoices.ts`) instead of burying them in the utility service.

**Changes:**
- Modified `getOrGenerateInvoicePdf` in `src/lib/invoice-pdf-manager.ts` to **return** metadata instead of saving it.
- Updated `PdfResult` interface to include `pdfFileSize` and `s3Url`.
- Removed `updateInvoicePdfMetadata` and `clearStalePdfMetadata` helper functions from the PDF manager.

### 2. Updated Invoice Actions
**File:** `src/actions/invoices.ts`

Updated the following methods to handle metadata persistence:
- `markInvoiceAsPending`
- `sendInvoiceReminder`
- `getInvoicePdfUrl`

**Pattern Implemented:**
```typescript
// 1. Get/Generate PDF (pure utility call)
const result = await getOrGenerateInvoicePdf(invoice, { ... });

// 2. Persist metadata if regenerated (DB operation in Action)
if (result.wasRegenerated) {
  await invoiceRepo.updatePdfMetadata(invoice.id, {
    fileName: result.pdfFilename,
    fileSize: result.pdfFileSize,
    s3Key: result.s3Key,
    s3Url: result.s3Url,
  });
}
```

### 3. Interface Updates
**File:** `src/lib/invoice-pdf-manager.ts`

Updated `PdfResult` interface:
```typescript
export interface PdfResult {
  // ... existing fields
  s3Url: string;       // Added
  pdfFileSize: number; // Added
}
```

## ✅ Benefits
1. **Separation of Concerns:** PDF manager focuses on S3/Generation, Actions focus on DB/Business Logic.
2. **Transaction Control:** Actions can now wrap the metadata update in larger transactions if needed.
3. **Clarity:** It's obvious where the database is being updated.
4. **Testability:** Easier to test the PDF manager without mocking the database.

## 🧪 Verification
- Verified TypeScript compilation (no errors).
- Verified file structure and imports.
- Verified logic flow for regeneration and persistence.

---
**Status:** Complete
**Date:** 2025-12-04

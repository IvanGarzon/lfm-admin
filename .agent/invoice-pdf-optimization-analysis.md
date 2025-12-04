# Invoice PDF Generation Optimization Analysis

## Executive Summary

This document analyzes the PDF generation logic in `src/actions/invoices.ts` to identify code duplication and determine if PDFs are being unnecessarily regenerated.

## Current State Analysis

### Methods with Duplicated PDF Logic

The following methods contain nearly identical PDF generation/retrieval logic:

1. **`markInvoiceAsPending`** (lines 224-391)
2. **`sendInvoiceReminder`** (lines 543-747)
3. **`getInvoicePdfUrl`** (lines 784-879)

### Code Duplication Breakdown

#### Common Pattern (Repeated 3 times)

All three methods follow this pattern:

```typescript
// 1. Check if PDF metadata exists
const hasPdfMetadata = Boolean(invoice.s3Key && invoice.s3Url);

// 2. Check if regeneration is needed (invoice updated after last PDF generation)
const needsRegeneration =
  hasPdfMetadata &&
  invoice.lastGeneratedAt &&
  invoice.updatedAt > invoice.lastGeneratedAt;

// 3. Check if PDF exists in S3
const pdfExists =
  hasPdfMetadata && !needsRegeneration && (await fileExistsInS3(invoice.s3Key!));

// 4. If exists, reuse it
if (pdfExists) {
  s3Key = invoice.s3Key!;
  pdfUrl = await getSignedDownloadUrl(s3Key, 7 * 24 * 60 * 60);
  pdfBuffer = await downloadFileFromS3(s3Key);
  // ... logging
}
// 5. Otherwise, generate new PDF
else {
  // Clear stale metadata if exists
  if (hasPdfMetadata) {
    await deleteFileFromS3(invoice.s3Key!);
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        fileName: null,
        fileSize: null,
        mimeType: null,
        s3Key: null,
        s3Url: null,
        lastGeneratedAt: null,
      },
    });
  }
  
  // Generate and upload new PDF
  pdfBuffer = await generateInvoicePDF(invoice);
  const result = await uploadFileToS3({...});
  
  // Update invoice with new metadata
  await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      fileName: pdfFilename,
      fileSize: pdfFileSize,
      mimeType: 'application/pdf',
      s3Key: s3Key,
      s3Url: result.s3Url,
      lastGeneratedAt: new Date(),
    },
  });
}
```

### Lines of Duplicated Code

- **`markInvoiceAsPending`**: Lines 254-347 (~93 lines)
- **`sendInvoiceReminder`**: Lines 586-683 (~97 lines)
- **`getInvoicePdfUrl`**: Lines 796-872 (~76 lines, slightly different structure)

**Total duplicated code: ~266 lines** that could be reduced to a single reusable function.

## PDF Regeneration Analysis

### Question: Are we generating new files every time?

**Answer: NO** - The logic is designed to **avoid** unnecessary regeneration.

### How the Logic Works

The validation chain prevents unnecessary regeneration:

```typescript
const hasPdfMetadata = Boolean(invoice.s3Key && invoice.s3Url);
const needsRegeneration =
  hasPdfMetadata &&
  invoice.lastGeneratedAt &&
  invoice.updatedAt > invoice.lastGeneratedAt;
const pdfExists =
  hasPdfMetadata && !needsRegeneration && (await fileExistsInS3(invoice.s3Key!));
```

#### Scenarios:

1. **PDF exists and is up-to-date** (`pdfExists = true`)
   - ✅ Reuses existing PDF from S3
   - ✅ No regeneration
   - Downloads existing file and creates new signed URL

2. **PDF exists but invoice was updated** (`needsRegeneration = true`)
   - ❌ Deletes old PDF
   - ❌ Generates new PDF
   - Updates metadata with new `lastGeneratedAt` timestamp

3. **PDF metadata exists but file missing from S3** (`fileExistsInS3 = false`)
   - ❌ Clears stale metadata
   - ❌ Generates new PDF
   - Uploads to S3 and updates metadata

4. **No PDF metadata** (`hasPdfMetadata = false`)
   - ❌ Generates new PDF
   - First-time generation

### Performance Characteristics

#### Good:
- ✅ Avoids regeneration when invoice hasn't changed
- ✅ Validates S3 file existence before reusing
- ✅ Tracks generation timestamp for staleness detection

#### Concerns:
- ⚠️ **S3 API call on every check**: `fileExistsInS3()` makes a `HeadObjectCommand` API call to S3, which:
  - Costs money (AWS charges per request)
  - Adds latency (~50-200ms per call)
  - Could be optimized with caching or TTL-based trust

- ⚠️ **Downloads entire PDF for email attachment**: When reusing existing PDF, it downloads the full file from S3 (`downloadFileFromS3(s3Key)`), which:
  - Adds latency
  - Increases bandwidth costs
  - Could be avoided if email service can fetch from URL directly

## Optimization Recommendations

### 1. Extract Common PDF Management Logic

Create a reusable service/utility function:

```typescript
// src/lib/invoice-pdf-manager.ts

interface PdfResult {
  pdfBuffer: Buffer;
  s3Key: string;
  pdfUrl: string;
  wasRegenerated: boolean;
}

export async function getOrGenerateInvoicePdf(
  invoice: InvoiceWithDetails,
  options?: {
    urlExpirationSeconds?: number;
    skipDownload?: boolean; // For cases where buffer isn't needed
  }
): Promise<PdfResult>
```

**Benefits:**
- Reduces ~266 lines to ~100 lines total
- Single source of truth for PDF logic
- Easier to test and maintain
- Consistent behavior across all methods

### 2. Optimize S3 Existence Checks

**Option A: Trust metadata with periodic validation**
```typescript
// Trust metadata for X hours, then verify
const trustMetadataUntil = invoice.lastGeneratedAt + (24 * 60 * 60 * 1000); // 24 hours
const shouldVerifyS3 = Date.now() > trustMetadataUntil;

if (hasPdfMetadata && !needsRegeneration && !shouldVerifyS3) {
  // Trust metadata without S3 call
} else if (hasPdfMetadata && !needsRegeneration) {
  // Verify with S3 call
}
```

**Option B: Add Redis/memory cache**
```typescript
// Cache S3 existence checks for 1 hour
const cacheKey = `pdf-exists:${invoice.s3Key}`;
const cached = await cache.get(cacheKey);
if (cached !== null) return cached;

const exists = await fileExistsInS3(invoice.s3Key);
await cache.set(cacheKey, exists, 3600); // 1 hour TTL
```

### 3. Avoid Downloading PDFs When Not Needed

For `getInvoicePdfUrl`, the PDF buffer isn't needed - only the URL:

```typescript
export async function getOrGenerateInvoicePdf(
  invoice: InvoiceWithDetails,
  options?: {
    skipDownload?: boolean; // Don't download buffer if only URL needed
  }
): Promise<PdfResult>
```

### 4. Consider Lazy Email Attachments

Instead of downloading PDF to attach to email, consider:
- Using the signed URL in email body
- Or having email service fetch from S3 directly
- Only download if customer's email client requires inline attachment

## Proposed Refactoring Plan

### Phase 1: Extract Common Logic (High Priority)

1. Create `src/lib/invoice-pdf-manager.ts`
2. Implement `getOrGenerateInvoicePdf()` function
3. Update all three methods to use new function
4. Add comprehensive tests

**Estimated reduction:** ~200 lines of code

### Phase 2: Optimize S3 Checks (Medium Priority)

1. Implement metadata trust window (Option A)
2. Monitor regeneration frequency
3. Adjust trust window based on data

**Estimated savings:** 50-80% reduction in S3 API calls

### Phase 3: Smart Download Strategy (Low Priority)

1. Add `skipDownload` option
2. Update `getInvoicePdfUrl` to skip download
3. Evaluate email attachment strategy

**Estimated savings:** Reduced bandwidth and latency for PDF URL requests

## Risk Assessment

### Current Implementation Risks

1. **Code Duplication**: High risk of bugs from inconsistent updates
2. **S3 Costs**: Unnecessary API calls on every PDF access
3. **Latency**: S3 round-trips add 100-300ms per request
4. **Maintenance**: Changes require updating 3 locations

### Refactoring Risks

1. **Low Risk**: Extracting to common function (well-defined behavior)
2. **Medium Risk**: Optimizing S3 checks (could serve stale data if file manually deleted)
3. **Low Risk**: Skip download optimization (clear use cases)

## Conclusion

**Code Duplication:** Significant duplication exists (~266 lines) that should be refactored into a shared utility.

**PDF Regeneration:** The current logic is **working correctly** and **NOT** regenerating files unnecessarily. However, it makes S3 API calls on every check, which could be optimized.

**Recommended Action:** Proceed with Phase 1 refactoring to eliminate duplication, then evaluate Phase 2 based on S3 cost/latency metrics.

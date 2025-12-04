# Invoice PDF Caching Architecture

## Overview

This document describes the PDF caching architecture implemented for invoice PDFs. The system uses a **cache-aside pattern** where PDFs are generated on-demand and stored in S3 for future requests.

## Architecture

### Database Schema

The `Invoice` model includes the following PDF metadata fields:

```prisma
model Invoice {
  // ... other fields ...
  
  // PDF Metadata
  pdfFileName String? @map(name: "pdf_file_name")
  pdfFileSize Int?    @map(name: "pdf_file_size")
  pdfMimeType String? @map(name: "pdf_mime_type")
  pdfS3Key    String? @map(name: "pdf_s3_key")
  pdfS3Url    String? @map(name: "pdf_s3_url")
}
```

### S3 Storage Strategy

PDFs are stored in S3 with **deterministic keys** (no timestamps) to enable reliable cache lookups:

```
invoices/{invoiceId}/pdfs/invoice-{invoiceNumber}.pdf
```

Example: `invoices/clx123abc/pdfs/invoice-INV-2024-001.pdf`

This approach ensures:
- **Predictable paths**: We can check if a PDF exists without querying the database
- **Single source of truth**: Only one PDF per invoice
- **Easy invalidation**: Simple to delete and regenerate

## Flow Diagrams

### PDF Download Flow

```
User clicks "Download PDF"
         ↓
useDownloadInvoicePdf() mutation
         ↓
getInvoicePdfUrl(invoiceId) server action
         ↓
    Check if PDF exists in S3
         ↓
    ┌────────────────┐
    │   PDF exists?  │
    └────────────────┘
         ↓
    Yes ↓         ↓ No
        ↓         ↓
        ↓    Generate PDF
        ↓         ↓
        ↓    Upload to S3
        ↓         ↓
        ↓    Store metadata in DB
        ↓         ↓
        └─────────┘
              ↓
    Generate signed URL (24h expiry)
              ↓
    Return URL to client
              ↓
    Open PDF in new tab
```

### PDF Cache Invalidation Flow

```
User updates invoice
         ↓
updateInvoice() action
         ↓
Update invoice data
         ↓
Check if pdfS3Key exists
         ↓
    ┌────────────────┐
    │ PDF cached?    │
    └────────────────┘
         ↓
    Yes ↓         ↓ No
        ↓         ↓
Delete from S3   Skip
        ↓         ↓
Clear metadata   ↓
        ↓         ↓
        └─────────┘
              ↓
    Invoice updated
              ↓
Next download will regenerate PDF
```

## Key Components

### 1. Server Action: `getInvoicePdfUrl`

**Location**: `src/actions/invoices.ts`

**Purpose**: Handles PDF generation, caching, and retrieval

**Logic**:
1. Fetch invoice details
2. Generate deterministic S3 key
3. Check if PDF exists in S3
4. If exists → return signed URL
5. If not exists:
   - Generate PDF buffer
   - Upload to S3
   - Store metadata in database
   - Return signed URL

**Benefits**:
- Single source of truth for PDF access
- Automatic caching
- Transparent to the client

### 2. Client Hook: `useDownloadInvoicePdf`

**Location**: `src/features/finances/invoices/hooks/use-invoice-queries.ts`

**Purpose**: Client-side mutation for downloading PDFs

**Logic**:
1. Call `getInvoicePdfUrl` server action
2. Open returned URL in new tab
3. Show success/error toast

**Benefits**:
- Simple API for components
- Consistent error handling
- Optimistic UI updates possible

### 3. S3 Utilities

**Location**: `src/lib/s3.ts`

**Key Functions**:
- `generateS3Key(resourceType, resourceId, fileName, subPath, useTimestamp)`: Generate S3 keys with optional timestamps
- `fileExistsInS3(s3Key)`: Check if file exists
- `uploadFileToS3(params)`: Upload with metadata
- `getSignedDownloadUrl(s3Key, expiresIn)`: Generate temporary download URLs
- `deleteFileFromS3(s3Key)`: Delete files

### 4. PDF Generator

**Location**: `src/lib/pdf-generator.ts`

**Key Functions**:
- `generateInvoicePDF(invoice, logoUrl?)`: Generate PDF buffer
- `generateInvoiceFilename(invoiceNumber)`: Generate consistent filenames

**Note**: Uses absolute URLs for images to work in server-side rendering

## Cache Invalidation Strategy

PDFs are invalidated (deleted and regenerated) when:

1. **Invoice is updated** (`updateInvoice` action)
   - Deletes old PDF from S3
   - Clears metadata from database
   - Next download will regenerate

2. **Manual invalidation** (future enhancement)
   - Could add a "Regenerate PDF" button
   - Useful for template changes

## Benefits of This Architecture

### 1. Performance
- **First request**: ~2-3 seconds (generate + upload)
- **Subsequent requests**: ~200ms (S3 signed URL)
- **Bandwidth savings**: PDFs served from S3 CDN

### 2. Consistency
- Single PDF per invoice (no duplicates)
- Deterministic file paths
- Automatic cache invalidation on updates

### 3. Cost Efficiency
- Generate once, serve many times
- S3 storage is cheap (~$0.023/GB/month)
- Reduced server compute time

### 4. Scalability
- S3 handles high traffic
- No server memory issues
- Parallel downloads supported

### 5. Reliability
- PDFs persist across deployments
- No lost files on server restarts
- S3 provides 99.999999999% durability

## Email Integration

When sending invoices via email:

1. **Check for cached PDF** using `getInvoicePdfUrl`
2. **Attach PDF** to email
3. **Include signed URL** in email body (7-day expiry)

This ensures:
- Consistent PDFs in emails and downloads
- No duplicate generation
- Recipients can re-download if needed

## Future Enhancements

### 1. PDF Versioning
Store multiple versions of PDFs:
```
invoices/{invoiceId}/pdfs/v1/invoice-{number}.pdf
invoices/{invoiceId}/pdfs/v2/invoice-{number}.pdf
```

### 2. Batch Generation
Pre-generate PDFs for all pending invoices:
```typescript
async function generateAllPendingInvoicePDFs() {
  const invoices = await getInvoicesByStatus('PENDING');
  await Promise.all(invoices.map(inv => getInvoicePdfUrl(inv.id)));
}
```

### 3. Analytics
Track PDF downloads:
- Download count
- Last downloaded date
- User who downloaded

### 4. Template Versioning
Store template version in metadata:
```typescript
metadata: {
  invoiceNumber: invoice.invoiceNumber,
  status: invoice.status,
  templateVersion: '1.0',
}
```

### 5. Compression
Optimize PDF size before upload:
```typescript
const compressedPdf = await compressPDF(pdfBuffer);
```

## Monitoring

### Metrics to Track
- PDF generation time
- Cache hit rate
- S3 storage usage
- Download errors

### Logging
All PDF operations are logged:
- Generation: `logger.info('PDF generated', { invoiceId, size })`
- Cache hit: `logger.info('PDF cache hit', { invoiceId, s3Key })`
- Upload: `logger.info('PDF uploaded', { invoiceId, s3Key, size })`
- Deletion: `logger.info('PDF deleted', { invoiceId, s3Key })`

## Troubleshooting

### PDF not generating
1. Check server logs for errors
2. Verify S3 credentials
3. Check invoice data completeness

### PDF out of date
1. Update invoice → triggers cache invalidation
2. Or manually delete from S3 and database

### S3 upload fails
1. Check AWS credentials
2. Verify bucket permissions
3. Check network connectivity

### Signed URL expired
- URLs expire after 24 hours
- Call `getInvoicePdfUrl` again to get new URL

## Migration Notes

### Existing Invoices
Existing invoices without PDF metadata will:
1. Generate PDF on first download
2. Store metadata automatically
3. Use cached version thereafter

### Database Migration
Run the migration:
```bash
npx prisma migrate dev --name add_invoice_pdf_fields
```

This adds the PDF metadata fields to the `invoices` table.

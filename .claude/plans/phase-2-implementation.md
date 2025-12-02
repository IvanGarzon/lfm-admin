# Phase 2 Implementation Plan - Core Improvements

## Overview
Add missing features from Quotes to Invoices to achieve feature parity and improve overall system consistency.

## Status: READY TO IMPLEMENT
**Timeline**: 2-3 weeks
**Priority**: HIGH

---

## 1. Database Schema Changes

### 1.1 Add Invoice Status History Table
**Priority**: HIGH | **Complexity**: Medium

Create new model in `prisma/schema.prisma`:

```prisma
model InvoiceStatusHistory {
  id             String        @id @default(cuid())
  invoiceId      String        @map(name: "invoice_id")
  invoice        Invoice       @relation(fields: [invoiceId], references: [id], onDelete: Cascade)

  status         InvoiceStatus
  previousStatus InvoiceStatus?
  changedAt      DateTime      @default(now()) @map(name: "changed_at") @db.Timestamptz()
  changedBy      String?       @map(name: "changed_by")
  notes          String?       @db.Text

  @@index([invoiceId, changedAt])
  @@map(name: "invoice_status_history")
}
```

Update Invoice model to add relation:
```prisma
model Invoice {
  // ... existing fields ...
  statusHistory InvoiceStatusHistory[]
  // ... rest of fields ...
}
```

### 1.2 Add Invoice Attachments Tables
**Priority**: HIGH | **Complexity**: Medium

Create two new models in `prisma/schema.prisma`:

```prisma
model InvoiceAttachment {
  id        String  @id @default(cuid())
  invoiceId String  @map(name: "invoice_id")
  invoice   Invoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)

  fileName String @map(name: "file_name")
  fileSize Int    @map(name: "file_size")
  mimeType String @map(name: "mime_type")
  s3Key    String @unique @map(name: "s3_key")
  s3Url    String @map(name: "s3_url")

  uploadedBy String?  @map(name: "uploaded_by")
  uploadedAt DateTime @default(now()) @map(name: "uploaded_at") @db.Timestamptz()

  @@index([invoiceId])
  @@map(name: "invoice_attachments")
}

model InvoiceItemAttachment {
  id            String      @id @default(cuid())
  invoiceItemId String      @map(name: "invoice_item_id")
  invoiceItem   InvoiceItem @relation(fields: [invoiceItemId], references: [id], onDelete: Cascade)

  fileName String @map(name: "file_name")
  fileSize Int    @map(name: "file_size")
  mimeType String @map(name: "mime_type")
  s3Key    String @map(name: "s3_key")
  s3Url    String @map(name: "s3_url")

  uploadedBy String?  @map(name: "uploaded_by")
  uploadedAt DateTime @default(now()) @map(name: "uploaded_at") @db.Timestamptz()

  @@index([invoiceItemId])
  @@index([s3Key])
  @@map(name: "invoice_item_attachments")
}
```

Update Invoice and InvoiceItem models:
```prisma
model Invoice {
  // ... existing fields ...
  attachments   InvoiceAttachment[]
  statusHistory InvoiceStatusHistory[]
  // ... rest of fields ...
}

model InvoiceItem {
  // ... existing fields ...
  attachments InvoiceItemAttachment[]
  // ... rest of fields ...
}
```

### 1.3 Add Terms Field to Invoice
**Priority**: LOW | **Complexity**: Simple

Add to Invoice model:
```prisma
model Invoice {
  // ... existing fields ...
  notes String? @db.Text
  terms String? @db.Text  // NEW FIELD
  // ... rest of fields ...
}
```

### 1.4 Migration Command
```bash
# After schema changes
pnpm prisma migrate dev --name add_invoice_status_history_and_attachments
pnpm prisma generate
```

---

## 2. Repository Layer Updates

### 2.1 Update Invoice Repository
**File**: `src/repositories/invoice-repository.ts`

Add methods for status history:
```typescript
async createStatusHistory(data: {
  invoiceId: string;
  status: InvoiceStatus;
  previousStatus: InvoiceStatus | null;
  changedBy?: string;
  notes?: string;
}): Promise<InvoiceStatusHistory>

async getStatusHistory(invoiceId: string): Promise<InvoiceStatusHistory[]>
```

Add methods for attachments:
```typescript
async addAttachment(data: {
  invoiceId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  s3Key: string;
  s3Url: string;
  uploadedBy?: string;
}): Promise<InvoiceAttachment>

async deleteAttachment(attachmentId: string): Promise<boolean>

async getAttachments(invoiceId: string): Promise<InvoiceAttachment[]>
```

Update `updateInvoice` to create status history when status changes.

---

## 3. Server Actions Updates

### 3.1 Update Invoice Actions
**File**: `src/actions/invoices.ts`

Modify status-changing actions to create history:
- `markInvoiceAsPaid`
- `cancelInvoice`
- `updateInvoice` (when status changes)

Add new actions:
```typescript
export async function uploadInvoiceAttachment(
  invoiceId: string,
  file: FormData
): Promise<ActionResult<InvoiceAttachment>>

export async function deleteInvoiceAttachment(
  attachmentId: string
): Promise<ActionResult<void>>

export async function getInvoiceStatusHistory(
  invoiceId: string
): Promise<ActionResult<InvoiceStatusHistory[]>>
```

---

## 4. Type Generation

### 4.1 Generate Zod Schemas
After Prisma migration, regenerate types:
```bash
pnpm prisma generate
```

This will auto-generate:
- `InvoiceStatusHistorySchema`
- `InvoiceAttachmentSchema`
- `InvoiceItemAttachmentSchema`

---

## 5. Frontend Components

### 5.1 Status History Component
**File**: `src/features/finances/invoices/components/invoice-status-history.tsx` (NEW)

Create component similar to quote status history:
- Display timeline of status changes
- Show who made the change and when
- Display notes for each change

### 5.2 Attachments Component
**File**: `src/features/finances/invoices/components/invoice-attachments.tsx` (NEW)

Features:
- Upload files to S3
- Display list of attachments
- Download/delete attachments
- Preview images

### 5.3 Update Invoice Form
**File**: `src/features/finances/invoices/components/invoice-form.tsx`

Add:
- Terms field (textarea)
- Attachments section
- Form data loss prevention (beforeunload handler)

### 5.4 Update Invoice Drawer
**File**: `src/features/finances/invoices/components/invoice-drawer.tsx`

Add tabs/sections for:
- Status History
- Attachments

---

## 6. React Query Hooks Updates

### 6.1 Update Invoice Queries
**File**: `src/features/finances/invoices/hooks/use-invoice-queries.ts`

Add hooks:
```typescript
export function useInvoiceStatusHistory(invoiceId: string)
export function useInvoiceAttachments(invoiceId: string)
export function useUploadInvoiceAttachment()
export function useDeleteInvoiceAttachment()
```

---

## 7. Form Data Loss Prevention

### 7.1 Create Unsaved Changes Hook
**File**: `src/hooks/use-unsaved-changes.ts` (NEW)

```typescript
export function useUnsavedChanges(isDirty: boolean) {
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);
}
```

### 7.2 Update Forms
Add to:
- `invoice-form.tsx`
- `quote-form.tsx`

```typescript
const form = useForm({...});
useUnsavedChanges(form.formState.isDirty);
```

---

## 8. Standardize Error Handling

### 8.1 Create Error Handler Utility
**File**: `src/lib/error-handler.ts` (NEW)

```typescript
export function handleActionError(error: unknown): ActionResult<never> {
  if (error instanceof ZodError) {
    return {
      success: false,
      error: 'Validation failed',
      details: error.errors,
    };
  }
  
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return { success: false, error: 'Record already exists' };
    }
    // ... other codes
  }
  
  logger.error('Unexpected error', error);
  return { success: false, error: 'An unexpected error occurred' };
}
```

### 8.2 Update All Server Actions
Replace try-catch error handling with standardized handler.

---

## 9. Testing Strategy

### 9.1 Unit Tests
**Priority**: HIGH

Test files to create:
- `invoice-repository.test.ts` - Status history and attachment methods
- `invoice-actions.test.ts` - New actions
- `use-unsaved-changes.test.ts` - Hook behavior

### 9.2 Integration Tests
**Priority**: MEDIUM

- Test status history creation on status changes
- Test attachment upload/delete flow
- Test form data loss prevention

---

## 10. Implementation Order

### Week 1: Database & Backend
1. ✅ Update Prisma schema
2. ✅ Run migration
3. ✅ Update repository layer
4. ✅ Update server actions
5. ✅ Test backend changes

### Week 2: Frontend Components
6. ✅ Create status history component
7. ✅ Create attachments component
8. ✅ Update invoice form
9. ✅ Update invoice drawer
10. ✅ Add React Query hooks

### Week 3: Polish & Testing
11. ✅ Add form data loss prevention
12. ✅ Standardize error handling
13. ✅ Write unit tests
14. ✅ Write integration tests
15. ✅ Manual QA testing

---

## 11. Files to Create

### New Files:
1. `src/features/finances/invoices/components/invoice-status-history.tsx`
2. `src/features/finances/invoices/components/invoice-attachments.tsx`
3. `src/hooks/use-unsaved-changes.ts`
4. `src/lib/error-handler.ts`
5. `__tests__/repositories/invoice-repository.test.ts`
6. `__tests__/actions/invoice-actions.test.ts`
7. `__tests__/hooks/use-unsaved-changes.test.ts`

### Files to Modify:
1. `prisma/schema.prisma` - Add new models
2. `src/repositories/invoice-repository.ts` - Add methods
3. `src/actions/invoices.ts` - Add actions, update existing
4. `src/features/finances/invoices/components/invoice-form.tsx` - Add fields
5. `src/features/finances/invoices/components/invoice-drawer.tsx` - Add sections
6. `src/features/finances/invoices/hooks/use-invoice-queries.ts` - Add hooks
7. `src/features/finances/quotes/components/quote-form.tsx` - Add unsaved changes hook

---

## 12. Success Metrics

**Feature Parity**:
- ✅ Invoices have status history like quotes
- ✅ Invoices have attachments like quotes
- ✅ Invoices have terms field like quotes

**User Experience**:
- ✅ No data loss on accidental form close
- ✅ Clear status change audit trail
- ✅ Easy attachment management

**Code Quality**:
- ✅ Standardized error handling across all actions
- ✅ 80%+ test coverage for new features
- ✅ Consistent patterns between invoices and quotes

---

## 13. Risk Assessment

**Low Risk**:
- Adding terms field (non-breaking)
- Form data loss prevention (client-side only)

**Medium Risk**:
- Status history (requires migration, affects all status changes)
- Attachments (requires S3 configuration)

**Mitigation**:
- Test migrations on development database first
- Verify S3 permissions before deployment
- Add rollback plan for migrations
- Feature flags for new functionality

---

## 14. Dependencies

**Required**:
- S3 bucket configured and accessible
- Prisma migrations working
- React Query setup complete

**Optional**:
- Email service (for attachment notifications)
- Audit logging (for compliance)

---

## Next Steps

1. Review and approve this plan
2. Create feature branch: `feature/phase-2-invoice-improvements`
3. Start with database schema changes
4. Implement backend layer
5. Build frontend components
6. Add tests
7. QA and deploy

---

**Estimated Effort**: 15-20 hours
**Team Size**: 1 developer
**Blockers**: None identified

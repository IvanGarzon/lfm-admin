# Invoice Feature - Technical Debt & Improvements

## 🔴 High Priority

### 1. Fix Race Condition in Receipt Number Generation

**File**: `src/repositories/invoice-repository.ts:429-453`

**Issue**: Potential collision in concurrent payment recording due to check-then-act pattern.

**Current Code**:

```typescript
async generateReceiptNumber(): Promise<string> {
  let receiptNumber = '';
  let isUnique = false;

  while (!isUnique) {
    const part1 = generateNumberSegment();
    const part2 = generateNumberSegment();
    const part3 = generateNumberSegment();
    receiptNumber = `${part1}-${part2}-${part3}`;

    const existing = await this.prisma.invoice.findUnique({
      where: { receiptNumber }
    });
    isUnique = !existing;
  }
  return receiptNumber;
}
```

**Solution**: Use UUID-based generation or database sequence

```typescript
async generateReceiptNumber(): Promise<string> {
  // Option 1: UUID-based (recommended)
  const uuid = crypto.randomUUID();
  return `RCP-${uuid.substring(0, 8).toUpperCase()}`;

  // Option 2: Database sequence (if available)
  // const result = await this.prisma.$queryRaw`SELECT nextval('receipt_number_seq')`;
  // return `RCP-${String(result[0].nextval).padStart(8, '0')}`;
}
```

**Effort**: 30 minutes

---

### 2. Fix Bulk Operations - Add Validation & Audit Trail

**File**: `src/repositories/invoice-repository.ts:958-968`

**Issue**: `bulkUpdateStatus` bypasses status transition validation and doesn't create audit history.

**Current Code**:

```typescript
async bulkUpdateStatus(ids: string[], status: InvoiceStatus) {
  await this.prisma.invoice.updateMany({
    where: { id: { in: ids } },
    data: { status, updatedAt: new Date() },
  });
}
```

**Solution**: Implement proper validation and history tracking

```typescript
async bulkUpdateStatus(ids: string[], status: InvoiceStatus, changedBy?: string) {
  return this.prisma.$transaction(async (tx) => {
    const results = [];

    for (const id of ids) {
      const invoice = await tx.invoice.findUnique({
        where: { id },
        select: { status: true }
      });

      if (!invoice) continue;

      // Validate transition
      try {
        validateInvoiceStatusTransition(invoice.status, status);
      } catch (error) {
        logger.warn('Skipping invalid status transition', { id, from: invoice.status, to: status });
        continue;
      }

      // Update invoice
      await tx.invoice.update({
        where: { id },
        data: { status, updatedAt: new Date() }
      });

      // Create history entry
      await tx.invoiceStatusHistory.create({
        data: {
          invoiceId: id,
          status,
          previousStatus: invoice.status,
          changedAt: new Date(),
          changedBy,
          notes: 'Bulk status update',
        },
      });

      results.push({ id, success: true });
    }

    return results;
  });
}
```

**Effort**: 1-2 hours

---

### 3. Add Database Indexes

**File**: `prisma/schema.prisma`

**Issue**: Missing indexes for common query patterns.

**Solution**: Add indexes to Invoice model

```prisma
model Invoice {
  // ... existing fields

  @@index([status, deletedAt])
  @@index([invoiceNumber])
  @@index([customerId, status])
  @@index([issuedDate, dueDate])
  @@index([receiptNumber])
}
```

**Migration Command**:

```bash
npx prisma migrate dev --name add_invoice_indexes
```

**Effort**: 15 minutes

---

## 🟡 Medium Priority

### 4. Extract Hardcoded Business Rules to Configuration

**Files**: Multiple files

**Issue**: Magic numbers scattered throughout codebase.

**Locations**:

- `src/features/finances/invoices/utils/invoice-helpers.ts:252` - `daysUntil <= 7`
- `src/repositories/invoice-repository.ts:882` - `newAmountDue <= 0.01`
- `src/repositories/invoice-repository.ts:1008` - `dueDate.setDate(dueDate.getDate() + 30)`

**Solution**: Create configuration file

```typescript
// src/features/finances/invoices/config/invoice-config.ts
export const INVOICE_CONFIG = {
  // Reminder settings
  REMINDER_THRESHOLD_DAYS: 7,
  REMINDER_URGENCY_HIGH_DAYS: 3,

  // Payment settings
  PAYMENT_TOLERANCE: 0.01, // Floating point tolerance for "fully paid"

  // Invoice defaults
  DEFAULT_DUE_DAYS: 30,
  DEFAULT_CURRENCY: 'AUD',

  // Receipt number generation
  RECEIPT_NUMBER_SEGMENTS: 3,
  RECEIPT_NUMBER_SEGMENT_LENGTH: 4,

  // Retry settings
  INVOICE_NUMBER_MAX_RETRIES: 3,
} as const;
```

**Usage Example**:

```typescript
// Before
return daysUntil <= 7;

// After
import { INVOICE_CONFIG } from '../config/invoice-config';
return daysUntil <= INVOICE_CONFIG.REMINDER_THRESHOLD_DAYS;
```

**Effort**: 1 hour

---

### 5. Remove or Implement Commented-Out Date Filtering

**File**: `src/repositories/invoice-repository.ts:66-84`

**Issue**: Dead code suggests incomplete feature.

**Current Code**:

```typescript
// if (dateFrom || dateTo) {
//   whereClause.issuedDate = {};
//   if (dateFrom) {
//     whereClause.issuedDate.gte = dateFrom;
//   }
//   if (dateTo) {
//     whereClause.issuedDate.lte = dateTo;
//   }
// }
```

**Decision Required**:

- [ ] **Option A**: Remove commented code if not needed
- [ ] **Option B**: Implement date filtering feature

**If implementing (Option B)**:

```typescript
// Update InvoiceFilters type
export interface InvoiceFilters {
  search?: string;
  status?: InvoiceStatusType[];
  dateFrom?: Date;
  dateTo?: Date;
  page: number;
  perPage: number;
  sort?: { id: string; desc: boolean }[];
}

// Uncomment and use in searchAndPaginate
if (dateFrom || dateTo) {
  whereClause.issuedDate = {};
  if (dateFrom) {
    whereClause.issuedDate.gte = dateFrom;
  }
  if (dateTo) {
    whereClause.issuedDate.lte = dateTo;
  }
}
```

**Effort**: 30 minutes (remove) or 2 hours (implement with UI)

---

### 6. Add Retry Logic for Database Operations

**File**: `src/repositories/invoice-repository.ts:320-333`

**Issue**: No retry logic for transient failures.

**Current Code**:

```typescript
const [statusGroupData, avgInvoiceData] = await Promise.all([
  this.prisma.invoice.groupBy(...),
  this.prisma.$queryRaw<[{ avg: number }]>(avgQuery),
]);
```

**Solution**: Implement exponential backoff retry

```typescript
// src/lib/retry.ts
export async function withRetry<T>(
  fn: () => Promise<T>,
  options = { maxRetries: 3, baseDelay: 100 }
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on validation errors
      if (isPrismaError(error) && error.code === 'P2002') {
        throw error;
      }

      if (attempt < options.maxRetries) {
        const delay = options.baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

// Usage
const [statusGroupData, avgInvoiceData] = await withRetry(() =>
  Promise.all([
    this.prisma.invoice.groupBy(...),
    this.prisma.$queryRaw<[{ avg: number }]>(avgQuery),
  ])
);
```

**Effort**: 2 hours

---

### 7. Add Idempotency Keys for Payment Recording

**File**: `src/features/finances/invoices/components/record-payment-dialog.tsx:77-79`

**Issue**: Duplicate payments possible from retry/double-click.

**Solution**: Add idempotency key support

**Schema Update**:

```prisma
model Payment {
  id              String   @id @default(cuid())
  idempotencyKey  String?  @unique
  // ... other fields
}
```

**Type Update**:

```typescript
// src/schemas/invoices.ts
export const RecordPaymentSchema = z.object({
  id: z.string(),
  amount: z.number().positive(),
  paidDate: z.date(),
  paymentMethod: z.string(),
  notes: z.string().optional(),
  idempotencyKey: z.string().optional(), // Add this
});
```

**Component Update**:

```typescript
// record-payment-dialog.tsx
import { v4 as uuidv4 } from 'uuid';

const form = useForm<RecordPaymentInput>({
  resolver: zodResolver(RecordPaymentSchema),
  defaultValues: {
    id: invoiceId,
    amount: amountDue,
    paidDate: new Date(),
    paymentMethod: 'Bank Transfer',
    notes: '',
    idempotencyKey: uuidv4(), // Generate on mount
  },
});
```

**Repository Update**:

```typescript
// Check for existing payment with same idempotency key
if (idempotencyKey) {
  const existing = await tx.payment.findUnique({
    where: { idempotencyKey },
  });
  if (existing) {
    logger.info('Duplicate payment request detected', { idempotencyKey });
    return this.findByIdWithDetails(invoiceId);
  }
}
```

**Effort**: 2 hours

---

## 🟢 Low Priority / Nice to Have

### 8. Improve Error Context

**File**: `src/actions/invoices.ts:68`

**Issue**: Generic error messages lack context.

**Current Code**:

```typescript
return handleActionError(error, 'Failed to fetch invoices');
```

**Solution**: Add structured error context

```typescript
return handleActionError(error, 'Failed to fetch invoices', {
  filters: repoParams,
  userId: session.user.id,
  timestamp: new Date().toISOString(),
  context: 'getInvoices',
});
```

**Effort**: 1 hour (update all action error handlers)

---

### 9. Add JSDoc for Complex Business Logic

**Files**: Various

**Issue**: Some complex logic lacks documentation.

**Example Locations**:

- Payment calculation logic in `addPayment`
- Status transition validation
- PDF hash calculation

**Solution**: Add comprehensive JSDoc comments

```typescript
/**
 * Calculates the new invoice status based on payment amount.
 *
 * Status Logic:
 * - If amountDue <= 0.01 (tolerance): PAID
 * - If amountPaid > 0 and amountDue > 0: PARTIALLY_PAID
 * - Otherwise: Keep current status
 *
 * @param totalAmount - Total invoice amount
 * @param amountPaid - Total amount paid so far
 * @param currentStatus - Current invoice status
 * @returns New invoice status
 */
function calculateInvoiceStatus(
  totalAmount: number,
  amountPaid: number,
  currentStatus: InvoiceStatus,
): InvoiceStatus {
  // ...
}
```

**Effort**: 2 hours

---

## 📋 Checklist

- [x] 1. Fix race condition in receipt number generation
- [x] 2. Add validation & audit trail to bulk operations
- [x] 3. Add database indexes
- [ ] 4. Extract hardcoded values to configuration
- [ ] 5. Remove or implement date filtering
- [ ] 6. Add retry logic for database operations
- [ ] 7. Add idempotency keys for payments
- [ ] 8. Improve error context
- [ ] 9. Add JSDoc for complex logic

---

## 📊 Estimated Total Effort

- **High Priority**: ~4 hours
- **Medium Priority**: ~8 hours
- **Low Priority**: ~3 hours
- **Total**: ~15 hours (2 days)

---

## 🎯 Recommended Implementation Order

1. **Day 1 Morning**: Items #3, #4, #5 (Quick wins - indexes, config, cleanup)
2. **Day 1 Afternoon**: Items #1, #2 (Critical fixes - race condition, bulk ops)
3. **Day 2 Morning**: Items #6, #7 (Reliability - retry logic, idempotency)
4. **Day 2 Afternoon**: Items #8, #9 (Polish - error context, documentation)

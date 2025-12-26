# Quotes Feature Alignment Plan
## Aligning Quotes with Invoices Standards & Patterns

**Date:** 2024-12-24
**Author:** Senior Software Engineer Analysis
**Status:** Proposal for Review

---

## Executive Summary

This document provides a comprehensive comparison of the Invoices and Quotes features, identifies key inconsistencies, and proposes a concrete plan to align the Quotes feature with the higher standards and patterns established by the Invoices implementation.

**Key Finding:** The Invoices feature demonstrates superior architecture with recent refactoring that split actions into queries/mutations, added comprehensive analytics, and implemented robust patterns. The Quotes feature, while functional, lags behind in several critical areas.

**Recommendation:** Implement a 5-phase alignment plan (starting with critical security fix) to bring Quotes to feature parity with Invoices standards.

---

## Table of Contents

1. [Feature Comparison Matrix](#feature-comparison-matrix)
2. [Core Functionality & Business Logic](#1-core-functionality--business-logic)
3. [Data Models & Persistence](#2-data-models--persistence)
4. [Validation Rules & Lifecycle Management](#3-validation-rules--lifecycle-management)
5. [UX Patterns & User Workflows](#4-ux-patterns--user-workflows)
6. [API Design & Backend Patterns](#5-api-design--backend-patterns)
7. [Key Inconsistencies Summary](#key-inconsistencies-summary)
8. [Alignment Plan](#alignment-plan)
9. [Phased Implementation](#phased-implementation)
10. [Risks & Trade-offs](#risks--trade-offs)

---

## Feature Comparison Matrix

| Aspect | Invoices | Quotes | Status | Priority |
|--------|----------|--------|--------|----------|
| **🚨 Authorization Checks** | ✅ requirePermission() on all actions | ❌ No permission checks | ❌ **SECURITY VULNERABILITY** | **CRITICAL** |
| **Actions Organization** | Split: queries.ts + mutations.ts | Monolithic: quotes.ts (1004 lines) | ⚠️ Inconsistent | HIGH |
| **Analytics Dashboard** | ✅ Full analytics with charts | ❌ Basic statistics only | ⚠️ Missing | HIGH |
| **Email Integration** | ✅ Inngest + EmailAudit | ❌ No email system | ❌ Critical Gap | CRITICAL |
| **PDF Generation** | ✅ Invoice + Receipt PDFs | ❌ No PDF system | ❌ Critical Gap | CRITICAL |
| **Payment Tracking** | ✅ Full payment history | N/A | ✅ N/A | - |
| **Status Transitions** | 6 states, strict rules | 8 states, strict rules | ✅ Similar | LOW |
| **Repository Pattern** | ✅ 1474 lines, well-structured | ✅ 1563 lines, well-structured | ✅ Consistent | LOW |
| **Bulk Actions** | ✅ Bulk status updates | ❌ No bulk operations | ⚠️ Missing | MEDIUM |
| **Document Management** | ✅ S3 + Document table | ✅ Attachments only | ⚠️ Different | MEDIUM |
| **Versioning** | ❌ No versioning | ✅ Parent-child versions | ✅ Quote-specific | - |
| **Item Features** | Basic items | Items + Colors + Attachments | ✅ Quote-specific | - |
| **Tests** | ✅ mutations.spec.ts | ❌ No test files | ❌ Missing | HIGH |
| **Soft Delete** | ✅ deletedAt field | ✅ deletedAt field | ✅ Consistent | LOW |
| **Optimistic Updates** | ✅ React Query optimistic | ✅ React Query optimistic | ✅ Consistent | LOW |
| **Context Management** | ✅ InvoiceActionContext | ✅ QuoteActionContext | ✅ Consistent | LOW |

**Legend:**
- ✅ Implemented & Consistent
- ⚠️ Partially Implemented or Inconsistent
- ❌ Missing or Critical Gap

---

## 1. Core Functionality & Business Logic

### Invoices: Comprehensive Financial Management

**Capabilities:**
- ✅ Full invoice lifecycle (DRAFT → PENDING → PAID/OVERDUE/CANCELLED)
- ✅ Payment recording with partial payment support
- ✅ **PDF generation** for invoices and receipts
- ✅ **Email system** for pending notifications, reminders, receipts
- ✅ Reminder system with rate limiting (1 per 24h per invoice, 1 per 1h per customer)
- ✅ Bulk operations (status updates)
- ✅ Invoice duplication
- ✅ **Comprehensive analytics** (revenue trends, collection rate, top debtors)
- ✅ Receipt generation and tracking
- ✅ Idempotency protection for payments

**Business Logic Strengths:**
- Payment tolerance (0.01 for floating point)
- Automatic overdue detection via cron jobs
- Rich audit trail via `InvoiceStatusHistory`
- Smart auto-status updates (PARTIALLY_PAID, PAID based on amounts)

### Quotes: Basic Quote Management

**Capabilities:**
- ✅ Quote lifecycle (DRAFT → SENT → ON_HOLD → ACCEPTED → CONVERTED/REJECTED/EXPIRED/CANCELLED)
- ✅ **Quote versioning** (parent-child relationships)
- ✅ **Item-level customization** (colors, notes, attachments)
- ✅ Quote-level attachments (S3 storage)
- ✅ Automatic expiration checking
- ✅ Conversion to invoices
- ❌ **No PDF generation**
- ❌ **No email system**
- ❌ **No analytics dashboard**
- ❌ No bulk operations
- ❌ No duplication feature
- ✅ Status history tracking

**Business Logic Strengths:**
- Sophisticated versioning system (unique to quotes)
- Item-level color palettes for flower arrangements
- Multi-level attachment system (quote + item level)
- Permission-based actions via `getQuotePermissions()`

### Key Differences

| Feature | Invoices | Quotes | Impact |
|---------|----------|--------|--------|
| **Email Notifications** | Inngest background jobs | None | **CRITICAL** - Quotes can't be sent to customers |
| **PDF Generation** | Invoice + Receipt | None | **CRITICAL** - No printable quotes |
| **Analytics** | Revenue trends, charts, metrics | Basic stats | **HIGH** - No business insights |
| **Reminders** | Scheduled with rate limits | None | **MEDIUM** - Can't follow up |
| **Bulk Actions** | Status updates | None | **MEDIUM** - Inefficient for many quotes |
| **Duplication** | Yes | No | **LOW** - Manual recreation needed |

### Recommendation

**Priority 1: Add Email & PDF to Quotes**
- Implement quote PDF generation using similar template pattern as invoices
- Integrate Inngest for sending quotes to customers
- Add "Send Quote" functionality with email templates

**Priority 2: Build Quotes Analytics Dashboard**
- Quote value trends over time
- Conversion rate tracking (quotes → invoices)
- Win/loss analysis
- Average time to acceptance
- Customer quote patterns

**Priority 3: Add Bulk Operations**
- Bulk status updates (mark as sent, cancel multiple)
- Bulk expiration checks
- Bulk quote generation from template

---

## 2. Data Models & Persistence

### Schema Comparison

#### Invoices Models

```prisma
Invoice {
  // Core fields
  id, invoiceNumber, customerId, status
  amount, amountPaid, amountDue  // ← Smart calculated fields
  currency, gst, discount
  issuedDate, dueDate, paidDate

  // Advanced tracking
  remindersSent                  // ← Counter for rate limiting
  receiptNumber                  // ← Unique receipt tracking
  paymentMethod                  // ← Payment metadata
  cancelledDate, cancelReason

  // Relations
  items              InvoiceItem[]
  payments           Payment[]              // ← Separate payment tracking
  statusHistory      InvoiceStatusHistory[]
  emailAudit         EmailAudit[]          // ← Email tracking
  documents          Document[]            // ← PDF storage
}

InvoiceItem {
  description, quantity, unitPrice, total
  productId?                               // ← Product catalog link
}

Payment {
  amount, date, method, reference, notes
  idempotencyKey                           // ← Prevents duplicates
}

Document {
  kind (INVOICE | RECEIPT | QUOTE)
  fileHash                                 // ← Content-based caching
  s3Key, s3Url
  generatedAt, lastAccessedAt
}

EmailAudit {
  emailType, templateName
  recipient, subject, status
  queuedAt, sentAt, failedAt
  errorMessage, retryCount
  inngestEventId, inngestRunId            // ← Background job tracking
}
```

#### Quotes Models

```prisma
Quote {
  // Core fields
  id, quoteNumber, customerId, status
  amount                         // ← No amountPaid/amountDue
  currency, gst, discount
  issuedDate, validUntil         // ← Different date field

  // Versioning (unique to quotes)
  versionNumber
  parentQuoteId                  // ← Self-referential versioning
  versions                       // ← Child versions

  // Relations
  invoiceId                      // ← Linked converted invoice
  items              QuoteItem[]
  documents          Document[]
  attachments        QuoteAttachment[]    // ← Separate from documents
  statusHistory      QuoteStatusHistory[]
  emailAudit         EmailAudit[]        // ← Defined but unused
}

QuoteItem {
  description, quantity, unitPrice, total
  order                          // ← Display ordering
  productId?

  // Quote-specific features
  colors             String[]    // ← Flower arrangement colors
  notes              String?     // ← Item-level notes
  attachments        QuoteItemAttachment[]
}

QuoteAttachment {
  // Direct S3 storage (simpler than Document model)
  fileName, fileSize, mimeType
  s3Key, s3Url
  uploadedBy, uploadedAt
}
```

### Key Differences

| Aspect | Invoices | Quotes | Issue |
|--------|----------|--------|-------|
| **Payment Tracking** | Separate `Payment` model | None | ✅ Correct - Quotes don't need this |
| **Email Audit** | Fully utilized | Defined but unused | ⚠️ Quotes should use EmailAudit |
| **Document Storage** | `Document` model with `kind` enum | Separate `QuoteAttachment` | ⚠️ Inconsistent - should use Document |
| **PDF Caching** | Hash-based with metadata | None | ❌ Quotes should cache PDFs |
| **Item Metadata** | Basic | Colors + Notes + Attachments | ✅ Quote-specific, appropriate |
| **Versioning** | None | Parent-child with version numbers | ✅ Quote-specific, appropriate |
| **Reminders** | `remindersSent` counter | None | ⚠️ Quotes could track follow-ups |
| **Date Fields** | `dueDate`, `paidDate` | `validUntil` | ✅ Different domain logic |

### Database Indexes

**Invoices:**
```prisma
@@index([customerId])
@@index([status])
@@index([issuedDate])
@@index([status, deletedAt])           // ← Composite for common query
@@index([receiptNumber])
@@index([customerId, status])          // ← Customer-specific filtering
@@index([dueDate])                     // ← Overdue calculations
```

**Quotes:**
```prisma
@@index([customerId])
@@index([status])
@@index([issuedDate])
@@index([quoteId])                     // ← On related models
@@index([quoteId, order])              // ← Item ordering
@@index([quoteId, changedAt])          // ← Status history
```

**Assessment:** Both have good indexing strategies. Quotes missing composite indexes for common queries.

### Recommendations

#### 1. Unify Document Storage Pattern

**Problem:** Invoices use `Document` model with `kind` enum, Quotes use separate `QuoteAttachment` and `QuoteItemAttachment` models.

**Solution:** Migrate Quotes to use the shared `Document` model:

```prisma
Document {
  kind: INVOICE | RECEIPT | QUOTE | QUOTE_ITEM  // ← Add QUOTE_ITEM
  quoteId?
  quoteItemId?
}
```

**Benefits:**
- Consistent pattern across features
- Centralized file management
- Easier to implement global file cleanup
- Supports PDF caching with `fileHash`

**Migration:** Create migration to convert `QuoteAttachment` → `Document`

#### 2. Activate EmailAudit for Quotes

**Problem:** `EmailAudit` relation exists but is never populated.

**Solution:** Start using `EmailAudit` when quote email features are implemented:
- Send quote emails
- Follow-up reminders
- Quote acceptance notifications

#### 3. Add Composite Indexes

```prisma
Quote {
  @@index([status, deletedAt])       // ← Filter active quotes by status
  @@index([customerId, status])      // ← Customer quote filtering
  @@index([validUntil])              // ← Expiration checks
  @@index([status, validUntil])      // ← Combined for expiry job
}
```

#### 4. Consider Adding `followUpsSent` Counter

Similar to `remindersSent` on invoices, track quote follow-ups:

```prisma
Quote {
  followUpsSent  Int? @default(0)
}
```

Use for rate limiting quote reminder emails.

---

## 3. Validation Rules & Lifecycle Management

### Status Transition Rules

#### Invoices (6 States)

```typescript
DRAFT        → [PENDING, CANCELLED]
PENDING      → [PARTIALLY_PAID, PAID, OVERDUE, CANCELLED, DRAFT]
PARTIALLY_PAID → [PARTIALLY_PAID, PAID, OVERDUE, CANCELLED]
OVERDUE      → [PAID, PARTIALLY_PAID, CANCELLED, PENDING]
PAID         → [] // Terminal
CANCELLED    → [] // Terminal
```

**Characteristics:**
- Simpler state machine (6 states)
- Payment-driven transitions
- Automatic state changes (OVERDUE via cron)
- Clear terminal states

#### Quotes (8 States)

```typescript
DRAFT        → [SENT, REJECTED, EXPIRED, CANCELLED]
SENT         → [ON_HOLD, ACCEPTED, REJECTED, EXPIRED, CANCELLED]
ON_HOLD      → [ACCEPTED, CANCELLED]
ACCEPTED     → [CONVERTED, CANCELLED]
REJECTED     → [CANCELLED]
EXPIRED      → [CANCELLED]
CANCELLED    → [] // Terminal
CONVERTED    → [] // Terminal
```

**Characteristics:**
- More complex state machine (8 states)
- Customer-response-driven transitions
- ON_HOLD intermediate state (unique)
- Automatic expiration (EXPIRED via maintenance job)
- Terminal: CANCELLED, CONVERTED

### Validation Patterns

| Aspect | Invoices | Quotes | Consistency |
|--------|----------|--------|-------------|
| **Schema Library** | Zod | Zod | ✅ |
| **Transition Validation** | `validateInvoiceStatusTransition()` | `validateQuoteStatusTransition()` | ✅ |
| **Terminal State Check** | `isTerminalInvoiceStatus()` | `isTerminalQuoteStatus()` | ✅ |
| **Permission Guards** | Implicit in actions | `getQuotePermissions()` | ⚠️ Different |
| **Date Validation** | `dueDate >= issuedDate` | `validUntil >= issuedDate` | ✅ |
| **Amount Validation** | Payment ≤ amountDue | N/A | ✅ |
| **Item Validation** | 1-100 items | 1-100 items | ✅ |

### Permission Control Differences

**Invoices:** Implicit permission checks in server actions
```typescript
// Check happens in each action
requirePermission(session.user, 'canManageInvoices')
requirePermission(session.user, 'canRecordPayments')
```

**Quotes:** Explicit permission helper function
```typescript
// Central function returns permission object
const permissions = getQuotePermissions(quote.status)
// Returns: { canEdit, canSend, canAccept, canReject, ... }
```

**Assessment:** Quote pattern is more maintainable and testable. Consider adopting for Invoices.

### Recommendations

#### 1. Adopt Quote Permission Pattern for Invoices

Create `getInvoicePermissions(status)` helper:

```typescript
function getInvoicePermissions(status: InvoiceStatus): InvoicePermissions {
  return {
    canEdit: status === 'DRAFT',
    canSend: status === 'DRAFT',
    canRecordPayment: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'].includes(status),
    canCancel: status !== 'PAID' && status !== 'CANCELLED',
    canDelete: status === 'DRAFT',
    canDuplicate: true,
    canSendReminder: status === 'OVERDUE',
    canSendReceipt: status === 'PAID',
    canMarkAsDraft: status === 'PENDING',
  }
}
```

**Benefits:**
- Single source of truth for permissions
- Easier to test
- UI can query permissions declaratively
- Reduces duplication in components

#### 2. Standardize Validation Error Messages

Create shared error message constants:

```typescript
// src/features/finances/shared/constants/errors.ts
export const VALIDATION_ERRORS = {
  UNAUTHORIZED: 'You do not have permission to perform this action',
  INVALID_TRANSITION: (from, to) => `Cannot transition from ${from} to ${to}`,
  TERMINAL_STATE: (type) => `Cannot modify ${type} in terminal state`,
  INVALID_AMOUNT: 'Amount must be positive and less than total',
  // ...
}
```

#### 3. Unify Status History Approach

Both features track status history well. Consider adding:
- System-generated vs user-initiated flag
- More detailed change metadata (what fields changed)
- Snapshot of key values at each transition

---

## 4. UX Patterns & User Workflows

### Component Architecture

#### Invoices: Mature Component Structure

```
components/
├── Lists & Tables
│   ├── invoice-list.tsx              ← Tab-based (List | Analytics)
│   ├── invoice-table.tsx
│   ├── invoice-columns.tsx
│   └── bulk-actions-bar.tsx          ← Bulk operations
│
├── Forms & Drawers
│   ├── invoice-drawer.tsx
│   ├── invoice-form.tsx
│   ├── invoice-preview.tsx
│   ├── invoice-items-list.tsx
│   └── invoice-item-row.tsx
│
├── Analytics (4 components)
│   ├── invoice-analytics.tsx         ← Tab container
│   ├── stat-card.tsx
│   ├── revenue-trend-chart.tsx       ← Charts (Recharts)
│   ├── status-distribution-chart.tsx
│   └── top-debtors-list.tsx
│
├── Action Dialogs (5 dialogs)
│   ├── record-payment-dialog.tsx
│   ├── cancel-invoice-dialog.tsx
│   ├── send-receipt-dialog.tsx
│   ├── delete-invoice-dialog.tsx
│   └── receipt-preview.tsx
│
└── Utilities
    ├── invoice-status-badge.tsx
    ├── invoice-status-history.tsx
    ├── invoice-actions.tsx
    └── invoice-drawer-skeleton.tsx
```

**Key Features:**
- ✅ **Tab-based layout** (List + Analytics)
- ✅ **Analytics dashboard** with charts
- ✅ **Bulk action bar**
- ✅ **Receipt management** workflows
- ✅ **Payment recording** workflow
- ✅ **Skeleton loaders**

#### Quotes: Similar but Missing Analytics

```
components/
├── Lists & Tables
│   ├── quote-list.tsx                ← No tabs, stats card instead
│   ├── quote-table.tsx
│   ├── quote-columns.tsx
│   └── quote-stats.tsx               ← Basic stats, not analytics
│
├── Forms & Drawers
│   ├── quote-drawer.tsx
│   ├── quote-form.tsx
│   ├── quote-preview.tsx
│   ├── quote-items-list.tsx
│   ├── quote-item-row.tsx
│   └── quote-item-details.tsx
│
├── Action Dialogs (6 dialogs)
│   ├── delete-quote-dialog.tsx
│   ├── reject-quote-dialog.tsx
│   ├── on-hold-dialog.tsx
│   ├── cancel-quote-dialog.tsx
│   ├── convert-to-invoice-dialog.tsx
│   └── delete-item-image-dialog.tsx
│
├── Attachments (3 components)
│   ├── quote-attachments.tsx
│   ├── quote-item-attachments-dialog.tsx
│   └── image-preview-dialog.tsx
│
└── Utilities
    ├── quote-status-badge.tsx
    ├── quote-status-history.tsx
    ├── quote-versions.tsx            ← Unique to quotes
    ├── quote-actions.tsx
    ├── quote-drawer-skeleton.tsx
    └── quote-item-color-palette-dialog.tsx
```

**Key Features:**
- ❌ **No analytics tab** (only basic stats)
- ❌ **No bulk operations**
- ✅ **Attachment workflows** (quote + item level)
- ✅ **Version timeline** (unique to quotes)
- ✅ **Color palette management**
- ✅ **Skeleton loaders**

### Workflow Comparison

| Workflow | Invoices | Quotes | Gap |
|----------|----------|--------|-----|
| **Create & Edit** | ✅ Full form with items | ✅ Full form with items + colors | ✅ Consistent |
| **Send to Customer** | ✅ Email with PDF | ❌ Manual copy-paste | **CRITICAL** |
| **Status Updates** | ✅ Via dialogs | ✅ Via dialogs | ✅ Consistent |
| **Bulk Operations** | ✅ Bulk status change | ❌ None | **MEDIUM** |
| **Analytics** | ✅ Full dashboard | ❌ Basic stats | **HIGH** |
| **Version Management** | N/A | ✅ Create versions | ✅ Quote-specific |
| **Attachment Upload** | N/A | ✅ S3 upload | ✅ Quote-specific |
| **PDF Generation** | ✅ Invoice + Receipt | ❌ None | **CRITICAL** |
| **Payment Recording** | ✅ Detailed workflow | N/A | ✅ Invoice-specific |

### User Journey Analysis

#### Invoice Journey (Mature)
1. Create invoice → Add items → Preview
2. **Send to customer** (Email with PDF) ← Automated
3. Track status (Pending → Overdue)
4. **Send reminders** (Automated emails)
5. Record payment → Auto-status update
6. **Send receipt** (Email with PDF)
7. View analytics (revenue, trends, debtors)

#### Quote Journey (Gaps)
1. Create quote → Add items + colors + attachments → Preview
2. ❌ **Manually send** (copy-paste) ← Manual, error-prone
3. Track status (Sent → On Hold)
4. ❌ **No follow-ups** ← Manual
5. Accept → Convert to invoice
6. ❌ **No analytics insights** ← No data-driven decisions

### Recommendations

#### 1. Add Analytics Tab to Quotes (HIGH PRIORITY)

Create `quote-analytics.tsx` with:

**Key Metrics:**
- Total Quoted Value (all time + filtered period)
- Accepted Quote Value
- Conversion Rate (Accepted / Sent)
- Average Time to Decision
- Win Rate by Customer
- Average Quote Value

**Charts:**
- Quote Value Trend (monthly, last 12 months)
- Status Distribution (pie/donut chart)
- Win/Loss Reasons (bar chart)
- Top Customers by Quoted Value
- Quote Age Distribution
- Conversion Funnel (DRAFT → SENT → ACCEPTED → CONVERTED)

**Implementation:**
```typescript
// src/features/finances/quotes/components/analytics/
├── quote-analytics.tsx          // Main container
├── stat-card.tsx                // Reuse from invoices
├── quote-value-trend-chart.tsx  // Line chart
├── status-distribution-chart.tsx // Pie chart
├── conversion-funnel.tsx        // Funnel visualization
└── top-customers-quoted.tsx     // Table
```

Add tab to `quote-list.tsx`:
```tsx
<Tabs defaultValue="list">
  <TabsList>
    <TabsTrigger value="list">Quotes</TabsTrigger>
    <TabsTrigger value="analytics">Analytics</TabsTrigger>
  </TabsList>
  <TabsContent value="list">
    <QuoteTable ... />
  </TabsContent>
  <TabsContent value="analytics">
    <QuoteAnalytics />
  </TabsContent>
</Tabs>
```

#### 2. Add Bulk Operations (MEDIUM PRIORITY)

Implement `bulk-actions-bar.tsx` for quotes:
- Bulk mark as sent
- Bulk cancel with reason
- Bulk delete (drafts only)
- Bulk export to PDF

Pattern:
```tsx
// Selection state in quote-table.tsx
const [rowSelection, setRowSelection] = useState({})

// Bulk actions bar shows when selection count > 0
{selectedCount > 0 && (
  <BulkActionsBar
    selectedCount={selectedCount}
    onMarkAsSent={() => bulkUpdateStatus('SENT')}
    onCancel={() => openBulkCancelDialog()}
    onDelete={() => openBulkDeleteDialog()}
  />
)}
```

#### 3. Implement Quote Email Workflow (CRITICAL PRIORITY)

Add "Send Quote" functionality:

**Components:**
```typescript
// send-quote-dialog.tsx
- Email recipient (prefilled from customer)
- Subject line (template with quote number)
- Optional message
- PDF attachment preview
- Send button → Queues email via Inngest
```

**Backend:**
```typescript
// mutations.ts
export async function sendQuote(id: string) {
  // 1. Validate quote is ready to send (has items, customer, etc.)
  // 2. Generate PDF if not cached
  // 3. Queue email with Inngest
  // 4. Update status to SENT
  // 5. Create EmailAudit record
  // 6. Create StatusHistory entry
}
```

**Email Template:**
```tsx
// emails/quote-email.tsx
Dear {customerName},

Please find attached quote {quoteNumber} for your review.

Quote Details:
- Total: {amount}
- Valid Until: {validUntil}
- Items: {itemCount}

[Custom message from sender]

[View Quote Button] → Links to quote PDF

Thank you for your business!
```

#### 4. Implement Quote PDF Generation (CRITICAL PRIORITY)

Create quote PDF service:

```typescript
// src/features/finances/quotes/services/quote-pdf.service.ts
export class QuotePdfService {
  async generateQuotePdf(quoteId: string): Promise<string> {
    // 1. Fetch quote with details
    // 2. Check if PDF cached (via fileHash)
    // 3. If cached, return S3 URL
    // 4. If not cached, generate PDF from template
    // 5. Upload to S3
    // 6. Save Document record
    // 7. Return S3 URL
  }

  async getQuotePdfUrl(quoteId: string): Promise<string> {
    // Return cached or generate
  }
}
```

**Template:**
```tsx
// templates/quote-template.tsx
export function QuoteTemplate({ quote }: QuoteTemplateProps) {
  return (
    <Document>
      <Page>
        {/* Company header */}
        {/* Quote number, date, valid until */}
        {/* Customer details */}
        {/* Items table with colors */}
        {/* Subtotal, GST, discount, total */}
        {/* Terms & conditions */}
        {/* Item attachments (thumbnails) */}
      </Page>
    </Document>
  )
}
```

Pattern to match invoices:
- Use `@react-pdf/renderer`
- Store in `Document` table with `kind: QUOTE`
- Cache with content hash
- Pre-signed S3 URLs with expiry

---

## 5. API Design & Backend Patterns

### Current Architecture

#### Invoices: Split Architecture (MODERN)

**Recent Refactoring** (commit `4ad2a0a0a`):
```
src/actions/invoices/
├── index.ts              // Barrel exports (backward compatibility)
├── queries.ts            // 306 lines - Read operations
└── mutations.ts          // 591 lines - Write operations
```

**Benefits:**
- ✅ Clear separation of concerns (CQS pattern)
- ✅ Easier to find specific operations
- ✅ Better code organization
- ✅ Each file ~300-600 lines (maintainable)
- ✅ Easier to test (can mock queries independently)

**Queries:**
```typescript
getInvoices(searchParams)
getInvoiceById(id)
getInvoiceBasicById(id)
getInvoiceItems(id)
getInvoicePayments(id)
getInvoiceStatusHistory(id)
getInvoiceStatistics(dateFilter?)
getMonthlyRevenueTrend(limit)
getTopDebtors(limit)
getInvoicePdfUrl(id)
getReceiptPdfUrl(id)
```

**Mutations:**
```typescript
createInvoice(data)
updateInvoice(data)
markInvoiceAsPending(data)
markInvoiceAsDraft(id)
cancelInvoice(data)
recordPayment(data)
sendInvoiceReceipt(id)
sendInvoiceReminder(id)
bulkUpdateInvoiceStatus(ids, status)
deleteInvoice(id)
duplicateInvoice(id)
```

#### Quotes: Monolithic Architecture (LEGACY)

```
src/actions/
└── quotes.ts             // 1004 lines - ALL operations
```

**Issues:**
- ⚠️ Single file with 1000+ lines
- ⚠️ Queries and mutations mixed
- ⚠️ Harder to navigate
- ⚠️ Inconsistent with Invoice pattern
- ⚠️ Harder to selectively import

**All Actions in One File:**
- Queries: `getQuotes`, `getQuoteById`, `getQuoteStatistics`, `getQuoteVersions`, `getQuoteAttachments`, etc.
- Mutations: `createQuote`, `updateQuote`, `markQuoteAs*`, `convertQuoteToInvoice`, `deleteQuote`, etc.
- Attachment operations: `uploadQuoteAttachment`, `deleteQuoteAttachment`, etc.

### Server Action Pattern Comparison

Both features follow similar patterns within actions:

```typescript
// Standard pattern (used by both)
export async function actionName(data) {
  try {
    // 1. Auth check
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    // 2. Permission check
    requirePermission(session.user, 'canManage*')

    // 3. Input validation
    const validated = Schema.parse(data)

    // 4. Repository operation
    const result = await repo.method(validated)

    // 5. Cache revalidation
    revalidatePath('/path')

    // 6. Success response
    return { success: true, data: result }

  } catch (error) {
    // 7. Error handling
    return handleActionError(error, 'Friendly message')
  }
}
```

**Consistency:** ✅ Both use same pattern

### Repository Layer Comparison

Both have well-structured repositories:

| Metric | InvoiceRepository | QuoteRepository | Assessment |
|--------|------------------|-----------------|------------|
| **Lines of Code** | 1474 | 1563 | ✅ Similar complexity |
| **Base Class** | BaseRepository | BaseRepository | ✅ Consistent |
| **Search & Pagination** | `searchAndPaginate()` | `searchAndPaginate()` | ✅ Consistent |
| **Detail Fetching** | Multiple levels (basic, full) | Full only | ⚠️ Minor difference |
| **Status Changes** | Dedicated methods | Dedicated methods | ✅ Consistent |
| **Transactions** | Yes (create, update, status) | Yes (create, update, status) | ✅ Consistent |
| **Number Generation** | `generateInvoiceNumber()` | `generateQuoteNumber()` | ✅ Consistent |
| **Soft Delete** | `softDelete()` | `softDelete()` | ✅ Consistent |
| **Analytics** | 3 methods (stats, trend, debtors) | 1 method (stats only) | ⚠️ Quotes missing analytics |

**Assessment:** Repository layer is well-aligned. Main gap is analytics queries.

### React Query Hooks Comparison

#### Invoice Hooks (`use-invoice-queries.ts` - 708 lines)

```typescript
// Queries
useInvoices(searchParams)
useInvoice(id)
useInvoiceItems(id)
useInvoicePayments(id)
useInvoiceStatusHistory(id)
useInvoiceStatistics(dateFilter)
useMonthlyRevenueTrend()
useTopDebtors()

// Mutations
useCreateInvoice()
useUpdateInvoice()
useMarkInvoiceAsPending()
useMarkInvoiceAsDraft()
useCancelInvoice()
useRecordPayment()
useSendInvoiceReceipt()
useSendInvoiceReminder()
useBulkUpdateInvoiceStatus()    // ← Bulk operation
useDeleteInvoice()
useDuplicateInvoice()           // ← Duplication
```

#### Quote Hooks (`use-quote-queries.ts` - ~600 lines estimated)

```typescript
// Queries
useQuotes(searchParams)
useQuote(id)
useQuoteStatistics(dateFilter)
useQuoteVersions(quoteId)

// Mutations
useCreateQuote()
useUpdateQuote()
useMarkQuoteAsAccepted()
useMarkQuoteAsRejected()
useMarkQuoteAsSent()
useMarkQuoteAsOnHold()
useMarkQuoteAsCancelled()
useConvertQuoteToInvoice()
useDeleteQuote()
useCreateQuoteVersion()         // ← Versioning (unique)
useUploadQuoteAttachment()
useDeleteQuoteAttachment()
// (No bulk operations)
// (No duplication)
// (No analytics beyond basic stats)
```

**Consistency:** ✅ Similar patterns, ⚠️ Quotes missing some hooks

### Recommendations

#### 1. Refactor Quotes Actions (HIGH PRIORITY)

**Goal:** Match the Invoice pattern

**Structure:**
```
src/actions/quotes/
├── index.ts              // Re-exports for backward compatibility
├── queries.ts            // Read operations (~350 lines)
└── mutations.ts          // Write operations (~650 lines)
```

**Migration Strategy:**

1. Create new directory structure
2. Move query actions to `queries.ts`:
   - `getQuotes`
   - `getQuoteById`
   - `getQuoteStatistics`
   - `getQuoteVersions`
   - `getQuoteAttachments`
   - `getQuoteItemAttachments`
   - `getAttachmentDownloadUrl`
   - `getItemAttachmentDownloadUrl`
   - Future: `getQuotePdfUrl`
   - Future: Analytics queries

3. Move mutation actions to `mutations.ts`:
   - `createQuote`
   - `updateQuote`
   - All `markQuoteAs*` functions
   - `convertQuoteToInvoice`
   - `deleteQuote`
   - `createQuoteVersion`
   - All attachment mutations
   - Future: `sendQuote`
   - Future: Bulk operations

4. Create `index.ts` barrel export:
```typescript
export * from './queries'
export * from './mutations'
```

**Benefits:**
- Consistent with Invoice pattern
- Easier navigation
- Clearer intent (read vs write)
- Better organization for future growth
- Aligns with CQRS principles

**Backward Compatibility:** ✅ Maintained via barrel export

**Effort:** LOW (mostly file moving, no logic changes)

#### 2. Add Missing Hooks

**Quote Analytics Hooks** (when analytics implemented):
```typescript
useQuoteValueTrend(limit = 12)
useQuoteConversionRate(dateFilter)
useTopCustomersByQuotedValue(limit = 5)
```

**Bulk Operation Hooks:**
```typescript
useBulkUpdateQuoteStatus()
useBulkDeleteQuotes()
useBulkSendQuotes()  // When email implemented
```

**Duplication Hook:**
```typescript
useDuplicateQuote()  // Copy quote to new draft
```

#### 3. Add Repository Analytics Methods

Match Invoice repository analytics:

```typescript
// quote-repository.ts additions

async getMonthlyQuoteValueTrend(limit: number = 12) {
  // Return monthly quote totals (accepted + converted)
  // Compare to previous period
  // Group by status
}

async getConversionAnalytics(dateFilter?) {
  // Return conversion funnel data
  // DRAFT → SENT → ACCEPTED → CONVERTED
  // Conversion rates at each stage
}

async getTopCustomersByQuotedValue(limit: number = 5) {
  // Return customers with highest total quoted value
  // Include conversion rate per customer
  // Average time to decision
}

async getAverageTimeToDecision() {
  // Calculate avg time from SENT to ACCEPTED/REJECTED
  // Group by customer, product category, amount range
}
```

---

## Key Inconsistencies Summary

### 🚨 CRITICAL SECURITY VULNERABILITY (Fix Immediately)

**0. ❌ No Authorization Checks on Quote Actions**
   - Quotes only check authentication (logged in), not authorization (has permission)
   - Any logged-in user can create, edit, delete ALL quotes
   - Missing `requirePermission(session.user, 'canManageQuotes')` in all actions
   - **Impact:** Major security breach - unauthorized access to sensitive business data

### Critical Gaps (Must Fix)

1. **❌ No Email System for Quotes**
   - Can't send quotes to customers automatically
   - No follow-up reminders
   - EmailAudit table unused
   - **Impact:** Major workflow inefficiency

2. **❌ No PDF Generation for Quotes**
   - Can't provide professional quote documents
   - Manual document creation required
   - No document archiving
   - **Impact:** Unprofessional presentation

3. **❌ No Analytics Dashboard**
   - No visibility into quote performance
   - Can't track conversion rates
   - Missing business insights
   - **Impact:** Data-blind decision making

### High Priority Inconsistencies

4. **⚠️ Action File Organization**
   - Invoices: Split (queries + mutations)
   - Quotes: Monolithic (1004 lines)
   - **Impact:** Code maintenance, discoverability

5. **⚠️ Bulk Operations Missing**
   - Invoices have bulk status updates
   - Quotes require one-by-one operations
   - **Impact:** Inefficiency at scale

6. **⚠️ No Test Coverage**
   - Invoices have `mutations.spec.ts`
   - Quotes have no tests
   - **Impact:** Regression risk

### Medium Priority Inconsistencies

7. **⚠️ Document Storage Pattern**
   - Invoices: `Document` model with `kind` enum
   - Quotes: Separate `QuoteAttachment` models
   - **Impact:** Inconsistent file management

8. **⚠️ Permission Patterns**
   - Invoices: Inline permission checks
   - Quotes: `getQuotePermissions()` helper
   - **Impact:** Different mental models

### Low Priority (Minor)

9. **ℹ️ Repository Detail Fetching**
   - Invoices: Multiple detail levels (basic, full)
   - Quotes: Full only
   - **Impact:** Minor performance difference

10. **ℹ️ Composite Indexes**
    - Invoices have more composite indexes
    - Quotes could benefit from similar indexes
    - **Impact:** Query performance at scale

---

## Alignment Plan

### What Should Be Reused or Shared

#### 1. **Shared Infrastructure Components** ✅

Create shared directory for common finance components:

```
src/features/finances/shared/
├── components/
│   ├── stat-card.tsx                    // Already reusable
│   ├── status-badge.tsx                 // Extract common pattern
│   ├── status-history.tsx               // Generic version
│   ├── bulk-actions-bar.tsx             // Generic version
│   └── financial-summary-card.tsx
│
├── services/
│   ├── pdf-generation.service.ts        // Shared PDF logic
│   ├── email-queue.service.ts           // Already shared via Inngest
│   └── document-storage.service.ts      // S3 upload/download
│
├── hooks/
│   ├── use-bulk-actions.ts              // Generic bulk operation hook
│   ├── use-status-transition.ts         // Generic status validation
│   └── use-financial-filters.ts         // Shared filter logic
│
├── utils/
│   ├── currency-formatter.ts
│   ├── date-formatter.ts
│   ├── number-generator.ts              // Quote/Invoice numbering
│   └── validation-helpers.ts
│
├── constants/
│   ├── currencies.ts
│   ├── gst-rates.ts
│   └── error-messages.ts
│
└── types/
    ├── common-filters.ts
    ├── action-result.ts
    └── pagination.ts
```

**Implementation:** Create shared directory, move common components, update imports.

#### 2. **Unified Document Model** ✅

Migrate Quotes to use shared `Document` model:

**Current:**
- Invoices: `Document` with `kind: INVOICE | RECEIPT`
- Quotes: Separate `QuoteAttachment` + `QuoteItemAttachment`

**Target:**
```prisma
enum DocumentKind {
  INVOICE
  RECEIPT
  QUOTE
  QUOTE_ITEM  // ← Add this
}

Document {
  kind          DocumentKind
  invoiceId     String?
  quoteId       String?        // ← Add this
  quoteItemId   String?        // ← Add this

  fileName      String
  fileHash      String         // ← For caching
  s3Key         String
  s3Url         String

  generatedAt   DateTime
  lastAccessedAt DateTime
}
```

**Migration Steps:**
1. Add new enum values to `DocumentKind`
2. Add `quoteId` and `quoteItemId` fields to `Document`
3. Create migration to copy `QuoteAttachment` → `Document`
4. Update quote repository to use `Document`
5. Remove `QuoteAttachment` and `QuoteItemAttachment` models

**Benefits:**
- Unified file management
- Centralized cleanup jobs
- Consistent PDF caching
- Single S3 bucket strategy

#### 3. **Shared Email System** ✅

Quotes should use existing Inngest email infrastructure:

**Already Available:**
- `EmailAudit` table (relation exists)
- Inngest client
- `send-email` function
- Email templates pattern

**What to Add:**
- Quote email templates
- Quote-specific email types in `emailType` field
- Send quote action
- Quote follow-up/reminder logic

**Minimal Duplication:** Most infrastructure exists, just add quote templates.

#### 4. **Shared Analytics Components** ✅

Extract reusable analytics components from Invoices:

**Already Reusable:**
- `stat-card.tsx` ✅
- Chart components (with props)

**Create Generic Versions:**
```tsx
// src/features/finances/shared/components/analytics/

<FinancialTrendChart
  data={monthlyData}
  valueKey="total"
  label="Quote Value"
/>

<StatusDistributionChart
  data={statusCounts}
  statuses={quoteStatuses}  // Or invoiceStatuses
/>

<TopEntitiesTable
  entities={customers}
  valueLabel="Total Quoted"
  columns={['name', 'value', 'count']}
/>
```

**Benefit:** Build Quote analytics faster with shared components.

### What Should Be Refactored or Redesigned

#### 1. **Quote Actions: Split into Queries/Mutations** 🔄

**Current:** `quotes.ts` (1004 lines)

**Target:**
```
quotes/
├── index.ts
├── queries.ts    (~350 lines)
└── mutations.ts  (~650 lines)
```

**Effort:** LOW (mostly file organization)
**Risk:** LOW (backward compatible via barrel export)
**Benefit:** Consistency with Invoice pattern

#### 2. **Quote Email System** 🆕

**Design:**

```typescript
// mutations.ts
export async function sendQuote(data: {
  quoteId: string
  recipientEmail?: string  // Override customer email
  message?: string         // Custom message
  attachPdf: boolean
}) {
  // 1. Validate quote is ready
  // 2. Generate PDF
  // 3. Queue email via Inngest
  // 4. Update status to SENT
  // 5. Create EmailAudit
  // 6. Create StatusHistory
}

export async function sendQuoteFollowUp(quoteId: string) {
  // 1. Validate can send follow-up (rate limit)
  // 2. Check quote is SENT or ON_HOLD
  // 3. Generate PDF (cached)
  // 4. Queue follow-up email
  // 5. Increment followUpsSent counter
  // 6. Create EmailAudit
}
```

**Email Types:**
- `quote-pending` - Initial quote send
- `quote-follow-up` - Reminder
- `quote-accepted` - Confirmation to customer
- `quote-converted` - Notification that invoice created

**Templates:**
```tsx
// emails/quote-email.tsx
// emails/quote-follow-up-email.tsx
// emails/quote-accepted-email.tsx
```

**Inngest Functions:**
```typescript
// lib/inngest/functions/send-quote-email.ts
export const sendQuoteEmail = inngest.createFunction(
  { id: 'send-quote-email' },
  { event: 'quote/send.requested' },
  async ({ event, step }) => {
    // Similar pattern to invoice emails
  }
)
```

**Effort:** MEDIUM
**Risk:** LOW (reusing proven patterns)
**Benefit:** Automates critical workflow

#### 3. **Quote PDF Generation** 🆕

**Design:**

```typescript
// src/features/finances/quotes/services/quote-pdf.service.ts

export class QuotePdfService {
  async generateQuotePdf(quoteId: string): Promise<Document> {
    // 1. Fetch quote with full details
    const quote = await quoteRepo.findByIdWithDetails(quoteId)

    // 2. Calculate content hash
    const hash = this.calculateQuoteHash(quote)

    // 3. Check if PDF already exists
    const existing = await this.findDocumentByHash(hash)
    if (existing) {
      // Update lastAccessedAt
      return existing
    }

    // 4. Generate PDF from template
    const pdf = await this.renderQuotePdf(quote)

    // 5. Upload to S3
    const s3Key = `quotes/${quoteId}/${hash}.pdf`
    const s3Url = await uploadToS3(pdf, s3Key)

    // 6. Save Document record
    return await prisma.document.create({
      data: {
        kind: 'QUOTE',
        quoteId,
        fileHash: hash,
        fileName: `Quote-${quote.quoteNumber}.pdf`,
        s3Key,
        s3Url,
        generatedAt: new Date(),
        lastAccessedAt: new Date(),
      }
    })
  }

  private calculateQuoteHash(quote: Quote): string {
    // Hash based on:
    // - Quote number
    // - Customer details
    // - Items (description, qty, price, colors)
    // - Amounts (total, gst, discount)
    // - Dates
    // Excludes: status, timestamps
  }
}
```

**Template:**
```tsx
// templates/quote-template.tsx

export function QuoteTemplate({ quote }: QuoteTemplateProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with logo & company info */}
        <QuoteHeader />

        {/* Quote details box */}
        <View style={styles.detailsBox}>
          <Text>Quote Number: {quote.quoteNumber}</Text>
          <Text>Date: {formatDate(quote.issuedDate)}</Text>
          <Text>Valid Until: {formatDate(quote.validUntil)}</Text>
          <Text>Version: {quote.versionNumber}</Text>
        </View>

        {/* Customer details */}
        <CustomerDetails customer={quote.customer} />

        {/* Items table */}
        <ItemsTable items={quote.items} />

        {/* Color palettes (if any) */}
        {quote.items.some(i => i.colors?.length > 0) && (
          <ColorPalettes items={quote.items} />
        )}

        {/* Financial summary */}
        <FinancialSummary
          subtotal={calculateSubtotal(quote.items)}
          gst={quote.gst}
          discount={quote.discount}
          total={quote.amount}
        />

        {/* Terms & notes */}
        {quote.terms && <Terms terms={quote.terms} />}
        {quote.notes && <Notes notes={quote.notes} />}

        {/* Footer */}
        <QuoteFooter />
      </Page>
    </Document>
  )
}
```

**Effort:** MEDIUM
**Risk:** LOW (proven pattern from invoices)
**Benefit:** Professional quote presentation

#### 4. **Quote Analytics Dashboard** 🆕

**Repository Methods:**

```typescript
// quote-repository.ts

async getQuoteAnalytics(dateFilter?: DateFilter): Promise<QuoteAnalytics> {
  // Use optimized queries (similar to invoice statistics)

  const [statusCounts, financialMetrics] = await Promise.all([
    // Status distribution with counts and sums
    prisma.quote.groupBy({
      by: ['status'],
      where: { deletedAt: null, ...dateFilter },
      _count: true,
      _sum: { amount: true },
    }),

    // Overall financial metrics
    prisma.quote.aggregate({
      where: { deletedAt: null, ...dateFilter },
      _sum: { amount: true },
      _avg: { amount: true },
      _count: true,
    }),
  ])

  // Calculate conversion metrics
  const conversionRate = calculateConversionRate(statusCounts)
  const winRate = calculateWinRate(statusCounts)

  return {
    totalQuotes: financialMetrics._count,
    totalQuotedValue: financialMetrics._sum.amount,
    averageQuoteValue: financialMetrics._avg.amount,
    conversionRate,
    winRate,
    byStatus: statusCounts,
  }
}

async getMonthlyQuoteValueTrend(limit: number = 12) {
  // Monthly quote values (grouped by status)
  // Similar to invoice revenue trend
}

async getConversionFunnel(dateFilter?) {
  // DRAFT → SENT → ACCEPTED → CONVERTED
  // With counts and conversion rates at each stage
}

async getTopCustomersByQuotedValue(limit: number = 5) {
  // Customers with highest total quoted value
  // Include conversion rate per customer
}
```

**Components:**

```tsx
// components/analytics/quote-analytics.tsx

export function QuoteAnalytics() {
  const [dateRange, setDateRange] = useState<DateRange>()

  const { data: analytics } = useQuoteAnalytics(dateRange)
  const { data: trend } = useQuoteValueTrend()
  const { data: topCustomers } = useTopCustomersByQuotedValue()

  return (
    <div className="space-y-6">
      {/* Date range picker */}
      <DateRangePicker value={dateRange} onChange={setDateRange} />

      {/* Key metrics */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="Total Quoted Value"
          value={formatCurrency(analytics.totalQuotedValue)}
          trend={analytics.quotedValueTrend}
        />
        <StatCard
          title="Conversion Rate"
          value={formatPercent(analytics.conversionRate)}
          trend={analytics.conversionRateTrend}
        />
        <StatCard
          title="Win Rate"
          value={formatPercent(analytics.winRate)}
          description="Accepted / (Accepted + Rejected)"
        />
        <StatCard
          title="Avg Quote Value"
          value={formatCurrency(analytics.averageQuoteValue)}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        <QuoteValueTrendChart data={trend} />
        <StatusDistributionChart data={analytics.byStatus} />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <ConversionFunnelChart data={analytics.funnel} />
        <TopCustomersQuotedTable data={topCustomers} />
      </div>
    </div>
  )
}
```

**Effort:** MEDIUM-HIGH
**Risk:** LOW (proven pattern)
**Benefit:** Data-driven quote management

#### 5. **Bulk Operations for Quotes** 🆕

**Implementation:**

```typescript
// mutations.ts

export async function bulkUpdateQuoteStatus(
  quoteIds: string[],
  status: QuoteStatus,
  metadata?: {
    reason?: string  // For cancellations
  }
) {
  // 1. Auth & permission check
  // 2. Validate all transitions are valid
  // 3. Use transaction to update all quotes
  // 4. Create status history for each
  // 5. Revalidate paths
  // 6. Return summary { success, failed, errors }
}

export async function bulkDeleteQuotes(quoteIds: string[]) {
  // 1. Validate all quotes are DRAFT status
  // 2. Soft delete in transaction
  // 3. Return summary
}

export async function bulkSendQuotes(quoteIds: string[]) {
  // 1. Validate all quotes ready to send
  // 2. Generate PDFs for each
  // 3. Queue emails via Inngest (batch)
  // 4. Update statuses
  // 5. Return summary
}
```

**UI Component:**

```tsx
// components/bulk-actions-bar.tsx

export function QuoteBulkActionsBar({
  selectedQuoteIds,
  onComplete,
}) {
  const bulkUpdateStatus = useBulkUpdateQuoteStatus()
  const bulkDelete = useBulkDeleteQuotes()
  const bulkSend = useBulkSendQuotes()

  return (
    <div className="flex items-center gap-2">
      <Badge>{selectedQuoteIds.length} selected</Badge>

      <Button onClick={() => bulkSend.mutate(selectedQuoteIds)}>
        Send All
      </Button>

      <Button onClick={() => bulkUpdateStatus.mutate({
        ids: selectedQuoteIds,
        status: 'CANCELLED'
      })}>
        Cancel All
      </Button>

      <Button variant="destructive" onClick={() => bulkDelete.mutate(selectedQuoteIds)}>
        Delete All
      </Button>
    </div>
  )
}
```

**Effort:** LOW-MEDIUM
**Risk:** LOW
**Benefit:** Efficiency at scale

### What Should Stay Quote-Specific

These features are appropriately different between Invoices and Quotes:

1. **✅ Quote Versioning** - Unique to quotes
   - Parent-child relationships
   - Version numbering
   - Keep as-is

2. **✅ Item Color Palettes** - Unique to quotes (flower business)
   - Color arrays per item
   - Color palette dialog
   - Keep as-is

3. **✅ Item-Level Attachments** - Unique to quotes
   - Upload images per item (mockups, inspirations)
   - Image preview dialogs
   - Keep as-is

4. **✅ Quote Expiry Logic** - Different from invoice due dates
   - `validUntil` vs `dueDate`
   - Automatic expiration job
   - Keep as-is

5. **✅ Conversion to Invoice** - Unique to quotes
   - `convertQuoteToInvoice()` action
   - Links quote to created invoice
   - Keep as-is

6. **✅ ON_HOLD Status** - Unique to quotes
   - Intermediate state for customer review
   - Keep as-is

### Migration & Backward Compatibility

#### Database Migrations

**1. Add Document Support for Quotes**

```sql
-- Migration: add_quote_support_to_documents

-- Add new enum values
ALTER TYPE "DocumentKind" ADD VALUE 'QUOTE';
ALTER TYPE "DocumentKind" ADD VALUE 'QUOTE_ITEM';

-- Add new foreign key columns
ALTER TABLE "Document" ADD COLUMN "quoteId" TEXT;
ALTER TABLE "Document" ADD COLUMN "quoteItemId" TEXT;

-- Add foreign key constraints
ALTER TABLE "Document" ADD CONSTRAINT "Document_quoteId_fkey"
  FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE;

ALTER TABLE "Document" ADD CONSTRAINT "Document_quoteItemId_fkey"
  FOREIGN KEY ("quoteItemId") REFERENCES "QuoteItem"("id") ON DELETE CASCADE;

-- Add indexes
CREATE INDEX "Document_quoteId_idx" ON "Document"("quoteId");
CREATE INDEX "Document_quoteItemId_idx" ON "Document"("quoteItemId");
```

**2. Migrate Existing Quote Attachments**

```sql
-- Migration: migrate_quote_attachments_to_documents

-- Migrate QuoteAttachment → Document
INSERT INTO "Document" (
  id, kind, quoteId, fileName, fileSize, mimeType,
  s3Key, s3Url, generatedAt, lastAccessedAt
)
SELECT
  id,
  'QUOTE'::"DocumentKind",
  "quoteId",
  "fileName",
  "fileSize",
  "mimeType",
  "s3Key",
  "s3Url",
  "uploadedAt",
  "uploadedAt"
FROM "QuoteAttachment";

-- Migrate QuoteItemAttachment → Document
INSERT INTO "Document" (
  id, kind, quoteItemId, fileName, fileSize, mimeType,
  s3Key, s3Url, generatedAt, lastAccessedAt
)
SELECT
  id,
  'QUOTE_ITEM'::"DocumentKind",
  "quoteItemId",
  "fileName",
  "fileSize",
  "mimeType",
  "s3Key",
  "s3Url",
  "uploadedAt",
  "uploadedAt"
FROM "QuoteItemAttachment";
```

**3. Add Follow-ups Counter**

```sql
-- Migration: add_followups_to_quotes

ALTER TABLE "Quote" ADD COLUMN "followUpsSent" INTEGER DEFAULT 0;
```

**4. Add Composite Indexes**

```sql
-- Migration: add_quote_composite_indexes

CREATE INDEX "Quote_status_deletedAt_idx" ON "Quote"("status", "deletedAt");
CREATE INDEX "Quote_customerId_status_idx" ON "Quote"("customerId", "status");
CREATE INDEX "Quote_validUntil_idx" ON "Quote"("validUntil");
CREATE INDEX "Quote_status_validUntil_idx" ON "Quote"("status", "validUntil");
```

#### Code Backward Compatibility

**Action Refactoring (Queries/Mutations Split):**

```typescript
// src/actions/quotes/index.ts
// Maintains backward compatibility for existing imports

export * from './queries'
export * from './mutations'

// Before: import { getQuotes } from '@/actions/quotes'
// After:  import { getQuotes } from '@/actions/quotes' // Still works!
```

**Attachment API Transition:**

During transition period, support both old and new APIs:

```typescript
// OLD: getQuoteAttachments() returns QuoteAttachment[]
// NEW: getQuoteDocuments() returns Document[]

// Add adapter during migration
export async function getQuoteAttachments(quoteId: string) {
  const documents = await getQuoteDocuments(quoteId)
  return documents.map(documentToAttachmentAdapter)
}

// After all consumers updated, deprecate old function
```

**Component Props Backward Compatibility:**

When refactoring components, maintain prop compatibility:

```tsx
// OLD: <QuoteStatusBadge status="DRAFT" />
// NEW: <StatusBadge type="quote" status="DRAFT" />

// Create wrapper during transition
export function QuoteStatusBadge(props) {
  return <StatusBadge type="quote" {...props} />
}
```

### Migration Checklist

- [ ] Database migrations (4 migrations)
  - [ ] Add Document quote support
  - [ ] Migrate attachments to documents
  - [ ] Add followUpsSent counter
  - [ ] Add composite indexes

- [ ] Code migrations
  - [ ] Split quotes.ts → queries.ts + mutations.ts
  - [ ] Update imports across codebase
  - [ ] Migrate attachment code to use Documents
  - [ ] Update tests

- [ ] Feature additions
  - [ ] Implement PDF generation
  - [ ] Implement email system
  - [ ] Build analytics dashboard
  - [ ] Add bulk operations

- [ ] Testing
  - [ ] Unit tests for new functions
  - [ ] Integration tests for email flow
  - [ ] E2E tests for quote workflow
  - [ ] Performance tests for analytics

- [ ] Documentation
  - [ ] Update API documentation
  - [ ] Document migration guide
  - [ ] Update user guide
  - [ ] Add architecture diagrams

---

## Phased Implementation

### Phase 0: CRITICAL SECURITY FIX (IMMEDIATE - 1 Day) 🚨

**Status:** BLOCKER - Must be deployed before any other changes

**Problem Identified:** The Quotes feature has a **critical security vulnerability**. All quote actions only check authentication (user is logged in) but do NOT check authorization (user has permission to manage quotes).

**Current Code:**
```typescript
// quotes.ts - Lines 212-214 (and ~20 other actions)
const session = await auth();
if (!session?.user) {
  return { success: false, error: 'Unauthorized' };
}
// ❌ MISSING: requirePermission(session.user, 'canManageQuotes')
```

**Impact:** ANY logged-in user can create, edit, delete, and manage ALL quotes, regardless of their role permissions.

**Tasks:**

1. **Add Authorization to ALL Quote Mutations** (4 hours)
   - [ ] Import `requirePermission` from `@/lib/permissions`
   - [ ] Add to `createQuote()` - Line ~120
   - [ ] Add to `updateQuote()` - Line ~158
   - [ ] Add to `markQuoteAsAccepted()` - Line ~208
   - [ ] Add to `markQuoteAsRejected()` - Line ~239
   - [ ] Add to `markQuoteAsSent()` - Line ~274
   - [ ] Add to `markQuoteAsOnHold()` - Line ~303
   - [ ] Add to `markQuoteAsCancelled()` - Line ~332
   - [ ] Add to `convertQuoteToInvoice()` - Line ~367
   - [ ] Add to `deleteQuote()` - Line ~420
   - [ ] Add to `createQuoteVersion()` - Line ~455
   - [ ] Add to `uploadQuoteAttachment()` - Line ~515
   - [ ] Add to `deleteQuoteAttachment()` - Line ~575
   - [ ] Add to `uploadQuoteItemAttachment()` - Line ~620
   - [ ] Add to `deleteQuoteItemAttachment()` - Line ~685
   - [ ] Add to `updateQuoteItemNotes()` - Line ~745
   - [ ] Add to `updateQuoteItemColors()` - Line ~785

2. **Add Authorization to Quote Queries (Read Operations)** (2 hours)
   - [ ] Add to `getQuotes()` - Line ~58
   - [ ] Add to `getQuoteById()` - Line ~94
   - [ ] Add to `getQuoteStatistics()` - Line ~825
   - [ ] Add to `getQuoteVersions()` - Line ~870
   - [ ] Add to attachment query functions

**Code Pattern to Apply:**

```typescript
export async function [anyQuoteMutation](data) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  // 🔒 ADD THIS LINE TO EVERY MUTATION:
  requirePermission(session.user, 'canManageQuotes');

  // ... rest of existing logic
}

export async function [anyQuoteQuery](params) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  // 🔒 ADD THIS LINE TO EVERY QUERY:
  requirePermission(session.user, 'canReadQuotes');

  // ... rest of existing logic
}
```

3. **Testing** (2 hours)
   - [ ] Test with user having `canManageQuotes` permission (should work)
   - [ ] Test with user WITHOUT `canManageQuotes` permission (should fail)
   - [ ] Test with user having only `canReadQuotes` (can read, cannot modify)
   - [ ] Verify error messages are user-friendly
   - [ ] Test all quote actions across different roles

4. **Deploy** (Immediate)
   - [ ] Create hotfix branch: `hotfix/quote-permissions`
   - [ ] Code review (security-focused)
   - [ ] Deploy to production immediately
   - [ ] Monitor error logs for permission denials
   - [ ] Communicate to team about permission requirements

**Deliverables:**
- ✅ All quote mutations protected by `canManageQuotes` permission
- ✅ All quote queries protected by `canReadQuotes` permission
- ✅ Role-based access control enforced
- ✅ Security vulnerability closed

**Risk:** NONE - Pure addition, no breaking changes

**Validation Checklist:**
- [ ] User without permissions sees "You do not have permission" error
- [ ] User with permissions can perform actions normally
- [ ] No regressions in existing functionality
- [ ] Permissions system matches Invoice pattern

---

### Phase 1: Foundation & Consistency (Week 1-2)

**Goal:** Align code organization and fix structural inconsistencies

**Tasks:**

1. **Refactor Quote Actions** (2 days)
   - [ ] Create `src/actions/quotes/` directory
   - [ ] Split `quotes.ts` into `queries.ts` and `mutations.ts`
   - [ ] Create barrel export in `index.ts`
   - [ ] Update all imports across codebase
   - [ ] Verify no regressions

2. **Create Shared Finance Components** (2 days)
   - [ ] Create `src/features/finances/shared/` directory
   - [ ] Move `stat-card.tsx` to shared
   - [ ] Extract generic `StatusBadge` component
   - [ ] Extract generic `StatusHistory` component
   - [ ] Create shared utility functions
   - [ ] Update imports

3. **Database Optimizations** (1 day)
   - [ ] Add composite indexes to Quote model
   - [ ] Add `followUpsSent` field to Quote
   - [ ] Run performance tests
   - [ ] Deploy migration

4. **Add Test Infrastructure** (2 days)
   - [ ] Set up test utilities for quotes
   - [ ] Write `queries.spec.ts` with basic tests
   - [ ] Write `mutations.spec.ts` with basic tests
   - [ ] Set up test database seeding

**Deliverables:**
- ✅ Consistent action file structure
- ✅ Shared component library started
- ✅ Improved database performance
- ✅ Test coverage foundation

**Risk:** LOW - Mostly refactoring, minimal logic changes

---

### Phase 2: Critical Features - Email & PDF (Week 3-4)

**Goal:** Add missing critical capabilities to match Invoice feature parity

**Tasks:**

1. **Unified Document Model Migration** (3 days)
   - [ ] Update Prisma schema (add `quoteId`, `quoteItemId` to Document)
   - [ ] Add `QUOTE` and `QUOTE_ITEM` to `DocumentKind` enum
   - [ ] Create migration script
   - [ ] Write data migration to convert attachments
   - [ ] Update `quote-repository.ts` to use Document
   - [ ] Update all attachment-related components
   - [ ] Test migration on staging
   - [ ] Deploy

2. **Quote PDF Generation** (4 days)
   - [ ] Create `quote-pdf.service.ts`
   - [ ] Build `QuoteTemplate` component
   - [ ] Implement hash-based caching
   - [ ] Add S3 upload integration
   - [ ] Create `getQuotePdfUrl()` query
   - [ ] Add "Download PDF" button to UI
   - [ ] Add "Preview PDF" to drawer
   - [ ] Write tests
   - [ ] QA testing

3. **Quote Email System** (5 days)
   - [ ] Create email templates (`quote-email.tsx`, `quote-follow-up-email.tsx`)
   - [ ] Create Inngest function `send-quote-email`
   - [ ] Implement `sendQuote()` mutation
   - [ ] Implement `sendQuoteFollowUp()` mutation
   - [ ] Add rate limiting logic
   - [ ] Create "Send Quote" dialog component
   - [ ] Update quote status to SENT on send
   - [ ] Create EmailAudit records
   - [ ] Test email delivery (test mode & production)
   - [ ] Write tests

4. **Email Follow-up Workflow** (2 days)
   - [ ] Add "Send Follow-up" button (conditional on status)
   - [ ] Implement rate limit validation (1 per 24h)
   - [ ] Create follow-up email template
   - [ ] Add follow-up count to quote cards
   - [ ] Test workflow

**Deliverables:**
- ✅ Professional PDF quotes
- ✅ Automated email sending
- ✅ Follow-up reminder system
- ✅ Unified document storage

**Risk:** MEDIUM - New integrations, but using proven patterns from Invoices

**Validation:**
- [ ] Can send quote email with PDF attachment
- [ ] Can send follow-up reminders
- [ ] EmailAudit records created correctly
- [ ] PDF caching works (no duplicate generation)
- [ ] Documents stored in S3 consistently

---

### Phase 3: Analytics & Insights (Week 5-6)

**Goal:** Add comprehensive analytics dashboard to enable data-driven decisions

**Tasks:**

1. **Repository Analytics Methods** (3 days)
   - [ ] Implement `getQuoteAnalytics(dateFilter)`
   - [ ] Implement `getMonthlyQuoteValueTrend(limit)`
   - [ ] Implement `getConversionFunnel(dateFilter)`
   - [ ] Implement `getTopCustomersByQuotedValue(limit)`
   - [ ] Implement `getAverageTimeToDecision()`
   - [ ] Optimize queries with proper indexes
   - [ ] Write tests

2. **Analytics React Query Hooks** (1 day)
   - [ ] Create `useQuoteAnalytics(dateFilter)`
   - [ ] Create `useQuoteValueTrend(limit)`
   - [ ] Create `useConversionFunnel(dateFilter)`
   - [ ] Create `useTopCustomersByQuotedValue(limit)`
   - [ ] Set up proper cache invalidation

3. **Analytics UI Components** (4 days)
   - [ ] Create `quote-analytics.tsx` container
   - [ ] Create `quote-value-trend-chart.tsx`
   - [ ] Create `conversion-funnel-chart.tsx`
   - [ ] Create `top-customers-quoted-table.tsx`
   - [ ] Extract shared chart components
   - [ ] Add date range picker
   - [ ] Implement responsive layout
   - [ ] Add loading states & error handling

4. **Integrate Analytics Tab** (1 day)
   - [ ] Update `quote-list.tsx` with tabs
   - [ ] Add "Analytics" tab
   - [ ] Add tab state persistence (URL params)
   - [ ] Test tab switching performance

5. **Analytics Server Actions** (1 day)
   - [ ] Create `getQuoteAnalytics()` query
   - [ ] Create other analytics queries
   - [ ] Add to `queries.ts`
   - [ ] Write tests

**Deliverables:**
- ✅ Quote analytics dashboard
- ✅ Revenue trend visualization
- ✅ Conversion funnel analysis
- ✅ Customer insights

**Risk:** LOW - Proven analytics pattern from Invoices

**Validation:**
- [ ] Analytics load quickly (<2s)
- [ ] Charts render correctly
- [ ] Date filtering works
- [ ] Data accuracy verified against database
- [ ] Responsive on mobile

---

### Phase 4: Enhancements & Polish (Week 7-8)

**Goal:** Add nice-to-have features and polish the overall experience

**Tasks:**

1. **Bulk Operations** (3 days)
   - [ ] Implement `bulkUpdateQuoteStatus()` mutation
   - [ ] Implement `bulkDeleteQuotes()` mutation
   - [ ] Implement `bulkSendQuotes()` mutation
   - [ ] Create `BulkActionsBar` component
   - [ ] Add row selection to quote table
   - [ ] Add bulk operation hooks
   - [ ] Handle partial failures gracefully
   - [ ] Write tests

2. **Quote Duplication** (1 day)
   - [ ] Implement `duplicateQuote()` mutation
   - [ ] Add "Duplicate" action button
   - [ ] Create `useDuplicateQuote()` hook
   - [ ] Test duplication (items, attachments, etc.)

3. **Advanced Permission System** (2 days)
   - [ ] Create `getInvoicePermissions()` to match quote pattern
   - [ ] Update invoice components to use permission helper
   - [ ] Add permission-based UI hiding
   - [ ] Write tests

4. **Comprehensive Testing** (3 days)
   - [ ] Expand unit test coverage (target: 80%+)
   - [ ] Write integration tests for email flows
   - [ ] Write E2E tests for quote workflows
   - [ ] Performance testing for analytics
   - [ ] Load testing for bulk operations

5. **Documentation** (2 days)
   - [ ] Update API documentation
   - [ ] Write migration guide
   - [ ] Update user guide with new features
   - [ ] Create architecture diagrams
   - [ ] Document email templates
   - [ ] Document PDF generation

6. **Polish & UX Improvements** (2 days)
   - [ ] Add optimistic updates where missing
   - [ ] Improve loading states
   - [ ] Add success animations
   - [ ] Improve error messages
   - [ ] Accessibility audit
   - [ ] Mobile responsiveness check

**Deliverables:**
- ✅ Bulk operations
- ✅ Quote duplication
- ✅ Unified permission system
- ✅ Comprehensive test coverage
- ✅ Complete documentation

**Risk:** LOW - Incremental improvements

**Validation:**
- [ ] All tests passing
- [ ] No performance regressions
- [ ] Documentation complete
- [ ] Accessibility score 90+
- [ ] Mobile UX smooth

---

### Phase 5: Cleanup & Deprecation (Week 9)

**Goal:** Remove deprecated code and finalize migration

**Tasks:**

1. **Remove Deprecated Models** (1 day)
   - [ ] Verify all code using Document model
   - [ ] Drop `QuoteAttachment` table
   - [ ] Drop `QuoteItemAttachment` table
   - [ ] Update Prisma schema
   - [ ] Deploy migration

2. **Code Cleanup** (2 days)
   - [ ] Remove deprecated functions
   - [ ] Remove backward compatibility adapters
   - [ ] Clean up unused imports
   - [ ] Fix linter warnings
   - [ ] Remove commented code

3. **Final Testing** (2 days)
   - [ ] Full regression test suite
   - [ ] User acceptance testing
   - [ ] Performance benchmarks
   - [ ] Security audit

4. **Launch Preparation** (1 day)
   - [ ] Prepare release notes
   - [ ] Create user announcement
   - [ ] Set up monitoring alerts
   - [ ] Prepare rollback plan
   - [ ] Final stakeholder review

**Deliverables:**
- ✅ Clean codebase
- ✅ Deprecated code removed
- ✅ Production-ready
- ✅ Launch plan

**Risk:** LOW - Final cleanup

---

## Risks & Trade-offs

### Technical Risks

#### Risk 1: Database Migration Failures

**Description:** Migrating attachments to Document model could fail with large datasets

**Probability:** MEDIUM
**Impact:** HIGH

**Mitigation:**
- Test migration on production snapshot
- Implement migration in batches (1000 records at a time)
- Add migration progress tracking
- Maintain rollback script
- Schedule during low-traffic window

**Rollback Plan:**
```sql
-- Rollback: restore QuoteAttachment tables
CREATE TABLE "QuoteAttachment" AS
SELECT * FROM "Document" WHERE kind = 'QUOTE';
-- Restore constraints and indexes
```

#### Risk 2: Email Delivery Issues

**Description:** Inngest email integration could have edge cases (bounces, rate limits, etc.)

**Probability:** MEDIUM
**Impact:** MEDIUM

**Mitigation:**
- Implement test mode for emails (send to override address)
- Add retry logic (already in Inngest)
- Monitor EmailAudit for failed sends
- Set up alerts for high failure rates
- Add manual retry button in UI

**Monitoring:**
```typescript
// Alert when failure rate > 5%
if (failedEmails / totalEmails > 0.05) {
  sendAlert('Email delivery degraded')
}
```

#### Risk 3: PDF Generation Performance

**Description:** Generating PDFs for many quotes could be slow

**Probability:** LOW
**Impact:** MEDIUM

**Mitigation:**
- Implement content-based caching (fileHash)
- Generate PDFs asynchronously (background job)
- Add PDF generation queue
- Pre-generate PDFs on quote update
- Monitor generation time (alert if >5s)

**Optimization:**
```typescript
// Pre-generate PDF on quote status change to SENT
onQuoteStatusChange(quote, 'SENT', async () => {
  await quotePdfService.generateQuotePdf(quote.id) // Background job
})
```

#### Risk 4: Breaking Changes During Refactor

**Description:** Splitting actions file could break existing imports

**Probability:** LOW
**Impact:** HIGH

**Mitigation:**
- Maintain backward compatibility via barrel exports
- Use TypeScript to catch import errors
- Run full test suite before merging
- Deploy during low-traffic window
- Have feature flag for rollback

**Validation:**
```bash
# Find all imports of quote actions
grep -r "from '@/actions/quotes'" src/
# Verify all still work after refactor
```

#### Risk 5: Analytics Query Performance

**Description:** Complex analytics queries could slow down with large datasets

**Probability:** MEDIUM
**Impact:** MEDIUM

**Mitigation:**
- Add composite indexes for common queries
- Use database aggregations (not application-level)
- Cache analytics results (React Query with 60s stale time)
- Implement pagination for large result sets
- Add query timeout (5s)
- Monitor query performance

**Optimization:**
```typescript
// Use database aggregation instead of fetching all records
const stats = await prisma.quote.aggregate({
  _sum: { amount: true },
  _avg: { amount: true },
  _count: true,
  where: dateFilter,
})
```

### Business Risks

#### Risk 6: User Training Required

**Description:** New analytics dashboard and email features require user education

**Probability:** HIGH
**Impact:** LOW

**Mitigation:**
- Create video tutorials
- Add in-app tooltips for new features
- Send announcement email with feature guide
- Offer office hours for questions
- Create FAQ document

**Training Plan:**
- Week 1: Email announcement with video
- Week 2: In-app onboarding tooltips
- Week 3: Office hours session
- Week 4: Feedback collection

#### Risk 7: Feature Parity Expectations

**Description:** Users might expect all Invoice features in Quotes (and vice versa)

**Probability:** MEDIUM
**Impact:** LOW

**Mitigation:**
- Clearly document feature differences
- Explain domain-specific rationale (e.g., no payments on quotes)
- Gather user feedback on desired features
- Prioritize based on value

**Communication:**
- "Quotes and Invoices serve different purposes. Here's what makes each unique..."

### Trade-offs

#### Trade-off 1: Shared Components vs. Feature Flexibility

**Decision:** Create shared components but allow feature-specific overrides

**Pros:**
- ✅ Consistent UX
- ✅ Less code duplication
- ✅ Easier maintenance

**Cons:**
- ⚠️ Shared components can become complex with many conditional props
- ⚠️ Changes affect multiple features

**Approach:**
- Extract truly generic components (StatCard, charts)
- Keep feature-specific components separate (payment recording, versioning)
- Use composition over inheritance

#### Trade-off 2: Document Model Unification vs. Feature-Specific Models

**Decision:** Unify on Document model with `kind` enum

**Pros:**
- ✅ Single file management system
- ✅ Centralized cleanup jobs
- ✅ Consistent S3 strategy

**Cons:**
- ⚠️ More complex queries (filter by kind)
- ⚠️ Migration effort required

**Verdict:** Worth it for long-term maintainability

#### Trade-off 3: Monolithic Actions vs. Split Actions

**Decision:** Split actions into queries and mutations

**Pros:**
- ✅ Better code organization
- ✅ Consistent with CQRS principles
- ✅ Easier to find specific operations

**Cons:**
- ⚠️ More files to manage
- ⚠️ Slightly more complex imports (mitigated by barrel exports)

**Verdict:** Industry best practice, align with modern patterns

#### Trade-off 4: Analytics Complexity vs. Insights Value

**Decision:** Build comprehensive analytics despite implementation cost

**Pros:**
- ✅ Data-driven decision making
- ✅ Business insights
- ✅ Competitive feature

**Cons:**
- ⚠️ Development time
- ⚠️ Query performance considerations
- ⚠️ UI complexity

**Verdict:** High business value justifies investment

#### Trade-off 5: Email Automation vs. Manual Control

**Decision:** Provide automated email with manual override option

**Pros:**
- ✅ Workflow efficiency
- ✅ Consistency
- ✅ Professional delivery

**Cons:**
- ⚠️ Less control for users who want to customize heavily
- ⚠️ Dependency on email service

**Verdict:** Provide automation with escape hatches (custom message, download PDF without sending)

---

## Success Metrics

### Phase 1: Foundation

- [ ] 100% of quote actions split into queries/mutations
- [ ] 0 regressions in existing functionality
- [ ] 3+ shared components extracted
- [ ] Test coverage >60%

### Phase 2: Critical Features

- [ ] 100% of quotes can generate PDFs
- [ ] 100% of quote emails delivered successfully
- [ ] <2s PDF generation time (cached)
- [ ] EmailAudit records 100% accurate
- [ ] 0 customer complaints about email quality

### Phase 3: Analytics

- [ ] Analytics dashboard loads in <2s
- [ ] 100% data accuracy vs. manual counts
- [ ] 5+ key metrics displayed
- [ ] 3+ visualizations implemented
- [ ] Analytics used by >80% of users within 1 month

### Phase 4: Enhancements

- [ ] Bulk operations handle 100+ quotes without issues
- [ ] Test coverage >80%
- [ ] Documentation 100% complete
- [ ] Accessibility score >90
- [ ] 0 critical bugs in production

### Phase 5: Cleanup

- [ ] 0 deprecated code remaining
- [ ] 100% migration completion
- [ ] User satisfaction >4.5/5
- [ ] Feature adoption >70%

---

## Conclusion

The Invoices feature represents a mature, well-architected implementation with recent enhancements that set a high standard. The Quotes feature, while functional, has a **critical security vulnerability** (missing authorization checks) and significant gaps in critical areas (email, PDF, analytics) plus structural inconsistencies (monolithic actions file).

**This alignment plan provides a clear path to:**
1. ✅ Match Invoice code quality and organization
2. ✅ Add missing critical features (email, PDF)
3. ✅ Implement business-value analytics
4. ✅ Maintain feature-specific capabilities (versioning, colors, item attachments)
5. ✅ Establish shared patterns for future finance features

**Estimated Effort:** 9 weeks + 1 day (1 senior engineer full-time)
**Estimated Risk:** LOW-MEDIUM (using proven patterns)
**Business Value:** HIGH (workflow automation, insights, consistency)
**Security Risk:** CRITICAL (Phase 0 must be deployed immediately)

**Recommendation:**
1. **IMMEDIATE:** Deploy Phase 0 (security fix) as hotfix - cannot wait
2. **Then proceed:** Phase 1 (foundation) to establish consistency
3. **Followed by:** Phase 2 (critical features) to close major capability gaps

---

**Next Steps:**
1. **🚨 IMMEDIATE:** Deploy Phase 0 security fix (1 day - hotfix branch)
2. Review and approve full alignment plan
3. Allocate engineering resources for Phases 1-5
4. Set up project tracking (Jira/Linear)
5. Begin Phase 1 implementation after Phase 0 deployed
6. Weekly check-ins to track progress and adjust as needed

**Questions or feedback?** Let's discuss any concerns or adjustments needed before proceeding.

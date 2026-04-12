# Inngest Email System Setup Guide

**Author:** Ivancho Garzon \<Lehenbizico>
**Last Updated:** 2026-04-12
**Status:** Complete

---

## Overview

This document describes the generic email queue system using Inngest. It works for **invoices, quotes, reports**, and any future features.

## Architecture

```
Action/Feature → queueEmail() → Inngest → Background Function → PDF + Email
                      ↓
                 EmailAudit (DB)
```

## Files Created

### 1. Database

- `prisma/schema.prisma` - EmailAudit model with polymorphic relations

### 2. Types

- `src/types/email.ts` - Generic email types and schemas

### 3. Infrastructure

- `src/lib/inngest/client.ts` - Inngest client configuration
- `src/services/email-queue.service.ts` - Email queuing service
- `src/lib/inngest/functions/send-email.ts` - Background email processing function
- `src/lib/inngest/functions/check-expired-quotes.ts` - Quote expiry automation
- `src/lib/inngest/functions/mark-overdue-invoices.ts` - Invoice overdue automation
- `src/lib/inngest/functions/quote-expiry-reminder.ts` - Quote expiry reminders
- `src/lib/inngest/functions/cleanup-sessions.ts` - Session cleanup
- `src/app/api/inngest/route.ts` - Inngest API endpoint

## Environment Variables Needed

Add to `.env`:

```env
# Inngest Configuration
INNGEST_APP_ID="lfm-admin"
INNGEST_EVENT_KEY="your-event-key-here"  # Optional, for production
INNGEST_SIGNING_KEY="your-signing-key-here"  # From Inngest dashboard
```

## How to Use

### For Invoices

```typescript
import { queueInvoiceEmail } from '@/services/email-queue.service';

// In your action:
await queueInvoiceEmail({
  invoiceId: invoice.id,
  customerId: invoice.customerId,
  type: 'pending', // or 'reminder', 'receipt', 'overdue'
  recipient: customer.email,
  subject: `Invoice ${invoice.invoiceNumber}`,
  emailData: {
    invoiceNumber: invoice.invoiceNumber,
    amount: invoice.amount,
    // ... other data
  },
});
```

### For Quotes

```typescript
import { queueQuoteEmail } from '@/services/email-queue.service';

await queueQuoteEmail({
  quoteId: quote.id,
  customerId: quote.customerId,
  type: 'sent',
  recipient: customer.email,
  subject: `Quote ${quote.quoteNumber}`,
  emailData: {
    quoteNumber: quote.quoteNumber,
    // ... other data
  },
});
```

### For Custom Emails

```typescript
import { queueEmail } from '@/services/email-queue.service';

await queueEmail({
  entityType: 'report',
  entityId: report.id,
  emailType: 'report.monthly',
  templateName: 'report',
  recipient: user.email,
  subject: 'Monthly Report',
  emailData: {
    /* report data */
  },
});
```

## Migration Steps

1. Run Prisma migration:

```bash
pnpm prisma:migrate:dev
```

2. Sign up for Inngest (free tier):

- Go to https://app.inngest.com
- Create an account
- Create a new app
- Copy your signing key

3. Add environment variables to `.env`

4. Deploy the Inngest API route (already in Next.js)

5. Update invoice actions to use `queueInvoiceEmail()` instead of `fetch()`

## Benefits

✅ **Guaranteed delivery** - Emails won't be lost
✅ **Auto retries** - Failed emails retry automatically (up to 3x)
✅ **Monitoring** - View all emails in Inngest dashboard
✅ **Audit trail** - Every email tracked in database
✅ **Reusable** - Works for invoices, quotes, reports, etc.
✅ **Fast** - Actions return immediately (~10-50ms)
✅ **Scalable** - Handles high volume automatically

## Dashboard

View email status at:

- **Inngest**: https://app.inngest.com (events, retries, errors)
- **Database**: Query `EmailAudit` table for audit history

## Current Status

All setup steps are complete:

- [x] `EmailAudit` model migrated to the database
- [x] Env variables documented
- [x] Inngest background functions created (`send-email.ts`, `check-expired-quotes.ts`, `mark-overdue-invoices.ts`, `quote-expiry-reminder.ts`, `cleanup-sessions.ts`)
- [x] Inngest API route live at `src/app/api/inngest/route.ts`
- [x] Invoice and quote actions use the email queue
- [x] Email sending tested and operational

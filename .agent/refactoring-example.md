# Refactoring Example: Using invoice-pdf-manager.ts

This document shows how the three duplicated methods would be refactored to use the new centralized PDF management service.

## Before: markInvoiceAsPending (Lines 254-347, ~93 lines of PDF logic)

```typescript
export async function markInvoiceAsPending(
  data: MarkInvoiceAsPendingInput,
): Promise<ActionResult<{ id: string }>> {
  // ... auth and validation ...

  // 93 lines of duplicated PDF logic
  const { generateInvoicePDF, generateInvoiceFilename } = await import('@/lib/pdf-generator');
  const {
    uploadFileToS3,
    getSignedDownloadUrl,
    fileExistsInS3,
    downloadFileFromS3,
  } = await import('@/lib/s3');

  const pdfFilename = generateInvoiceFilename(invoice.invoiceNumber);
  let pdfBuffer: Buffer;
  let s3Key: string;
  let pdfUrl: string;

  const hasPdfMetadata = Boolean(invoice.s3Key && invoice.s3Url);
  const needsRegeneration =
    hasPdfMetadata &&
    invoice.lastGeneratedAt &&
    invoice.updatedAt > invoice.lastGeneratedAt;
  const pdfExists =
    hasPdfMetadata && !needsRegeneration && (await fileExistsInS3(invoice.s3Key!));

  if (pdfExists) {
    // ... 20 lines of reuse logic ...
  } else {
    // ... 60 lines of generation logic ...
  }

  // ... email sending logic ...
}
```

## After: markInvoiceAsPending (Refactored, ~10 lines of PDF logic)

```typescript
export async function markInvoiceAsPending(
  data: MarkInvoiceAsPendingInput,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const validatedInvoice = MarkInvoiceAsPendingSchema.parse(data);
    const invoice = await invoiceRepo.markAsPending(validatedInvoice.id);

    if (!invoice) {
      return { success: false, error: 'Invoice not found' };
    }

    // ✨ NEW: Single function call replaces 93 lines
    const { pdfBuffer, pdfUrl, pdfFilename } = await getOrGenerateInvoicePdf(invoice, {
      context: 'markInvoiceAsPending',
      skipDownload: false, // Need buffer for email attachment
    });

    // Validate and send email
    const validatedInvoiceEmailSchema: SendInvoiceEmailInput = SendInvoiceEmailSchema.parse({
      invoiceId: invoice.id,
      to: invoice.customer.email,
      invoiceData: {
        invoiceNumber: invoice.invoiceNumber,
        customerName: `${invoice.customer.firstName} ${invoice.customer.lastName}`,
        amount: invoice.amount,
        currency: invoice.currency,
        dueDate: invoice.dueDate,
        issuedDate: invoice.issuedDate,
      },
      pdfUrl,
    });

    const { sendEmailNotification } = await import('@/lib/email-service');

    sendEmailNotification({
      to: validatedInvoiceEmailSchema.to,
      subject: `Invoice ${validatedInvoiceEmailSchema.invoiceData.invoiceNumber}`,
      template: 'invoice',
      props: {
        invoiceData: {
          ...validatedInvoiceEmailSchema.invoiceData,
        },
        pdfUrl,
      },
      attachments: [
        {
          filename: pdfFilename,
          content: pdfBuffer!,
        },
      ],
    });

    revalidatePath('/finances/invoices');
    revalidatePath(`/finances/invoices/${invoice.id}`);

    return { success: true, data: { id: invoice.id } };
  } catch (error) {
    return handleActionError(error, 'Failed to mark invoice as pending');
  }
}
```

**Reduction: 93 lines → 10 lines (83 lines saved)**

---

## Before: sendInvoiceReminder (Lines 586-683, ~97 lines of PDF logic)

```typescript
export async function sendInvoiceReminder(id: string): Promise<ActionResult<{ id: string }>> {
  // ... auth and validation ...

  // 97 lines of duplicated PDF logic (nearly identical to markInvoiceAsPending)
  const { generateInvoicePDF, generateInvoiceFilename } = await import('@/lib/pdf-generator');
  const {
    uploadFileToS3,
    getSignedDownloadUrl,
    fileExistsInS3,
    downloadFileFromS3,
  } = await import('@/lib/s3');

  // ... same logic as above ...
}
```

## After: sendInvoiceReminder (Refactored)

```typescript
export async function sendInvoiceReminder(id: string): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const invoice = await invoiceRepo.findByIdWithDetails(id);

    if (!invoice) {
      return { success: false, error: 'Invoice not found' };
    }

    // Calculate days overdue
    const dueDate = new Date(invoice.dueDate);
    const today = new Date();
    const daysOverdue = Math.max(
      0,
      Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
    );

    if (daysOverdue <= 0) {
      return { success: false, error: 'Cannot send reminder for invoice that is not overdue' };
    }

    // ✨ NEW: Single function call replaces 97 lines
    const { pdfBuffer, pdfUrl, pdfFilename } = await getOrGenerateInvoicePdf(invoice, {
      context: 'sendInvoiceReminder',
      skipDownload: false, // Need buffer for email attachment
    });

    // Validate and send reminder email
    const validatedReminderEmailSchema: SendReminderEmailInput = SendReminderEmailSchema.parse({
      invoiceId: invoice.id,
      to: invoice.customer.email,
      reminderData: {
        invoiceNumber: invoice.invoiceNumber,
        customerName: `${invoice.customer.firstName} ${invoice.customer.lastName}`,
        amount: invoice.amount,
        currency: invoice.currency,
        dueDate: invoice.dueDate,
        daysOverdue,
      },
      pdfUrl,
    });

    const { sendEmailNotification } = await import('@/lib/email-service');

    await sendEmailNotification({
      to: validatedReminderEmailSchema.to,
      subject: `Payment Reminder: Invoice ${validatedReminderEmailSchema.reminderData.invoiceNumber} - ${validatedReminderEmailSchema.reminderData.daysOverdue} Days Overdue`,
      template: 'reminder',
      props: {
        reminderData: {
          ...validatedReminderEmailSchema.reminderData,
        },
        pdfUrl: validatedReminderEmailSchema.pdfUrl,
      },
      attachments: [
        {
          filename: pdfFilename,
          content: pdfBuffer!,
        },
      ],
    });

    const updatedInvoice = await invoiceRepo.incrementReminderCount(id);
    if (!updatedInvoice) {
      return { success: false, error: 'Failed to update reminder count' };
    }

    logger.info('Reminder email sent successfully with PDF attachment', {
      context: 'sendInvoiceReminder',
      metadata: {
        invoiceId: id,
        invoiceNumber: invoice.invoiceNumber,
        daysOverdue,
      },
    });

    revalidatePath('/finances/invoices');
    revalidatePath(`/finances/invoices/${id}`);

    return { success: true, data: { id: updatedInvoice.id } };
  } catch (error) {
    logger.error('Failed to send reminder email', error, {
      context: 'sendInvoiceReminder',
      metadata: { invoiceId: id },
    });

    return handleActionError(error, 'Failed to send reminder');
  }
}
```

**Reduction: 97 lines → 10 lines (87 lines saved)**

---

## Before: getInvoicePdfUrl (Lines 796-872, ~76 lines of PDF logic)

```typescript
export async function getInvoicePdfUrl(id: string): Promise<ActionResult<{ url: string }>> {
  // ... auth and validation ...

  // 76 lines of similar PDF logic (slightly different structure)
  const hasPdfMetadata = Boolean(invoice.s3Key && invoice.s3Url);
  const needsRegeneration =
    hasPdfMetadata &&
    invoice.lastGeneratedAt &&
    invoice.updatedAt > invoice.lastGeneratedAt;

  if (hasPdfMetadata && !needsRegeneration) {
    // ... check S3 and return URL ...
  } else {
    // ... generate new PDF ...
  }
}
```

## After: getInvoicePdfUrl (Refactored)

```typescript
export async function getInvoicePdfUrl(id: string): Promise<ActionResult<{ url: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const invoice = await invoiceRepo.findByIdWithDetails(id);
    if (!invoice) {
      return { success: false, error: 'Invoice not found' };
    }

    // ✨ NEW: Single function call replaces 76 lines
    // Note: skipDownload=true since we only need the URL, not the buffer
    const { pdfUrl } = await getOrGenerateInvoicePdf(invoice, {
      context: 'getInvoicePdfUrl',
      skipDownload: true, // ⚡ Performance optimization: don't download buffer
    });

    return { success: true, data: { url: pdfUrl } };
  } catch (error) {
    return handleActionError(error, 'Failed to get invoice PDF URL');
  }
}
```

**Reduction: 76 lines → 8 lines (68 lines saved)**

**Bonus: Performance improvement** - No longer downloads the PDF buffer unnecessarily!

---

## Summary of Improvements

### Code Reduction
- **markInvoiceAsPending**: 93 lines → 10 lines (83 lines saved)
- **sendInvoiceReminder**: 97 lines → 10 lines (87 lines saved)
- **getInvoicePdfUrl**: 76 lines → 8 lines (68 lines saved)

**Total reduction: 266 lines → 28 lines (238 lines saved, 89% reduction)**

### Benefits

1. **✅ DRY Principle**: Single source of truth for PDF logic
2. **✅ Maintainability**: Changes only need to be made in one place
3. **✅ Testability**: Can test PDF logic independently
4. **✅ Consistency**: All methods behave identically
5. **✅ Performance**: `skipDownload` option avoids unnecessary S3 downloads
6. **✅ Logging**: Centralized, consistent logging with context
7. **✅ Error Handling**: Unified error handling strategy

### Migration Checklist

- [ ] Create `src/lib/invoice-pdf-manager.ts`
- [ ] Add unit tests for `getOrGenerateInvoicePdf()`
- [ ] Refactor `markInvoiceAsPending()`
- [ ] Refactor `sendInvoiceReminder()`
- [ ] Refactor `getInvoicePdfUrl()`
- [ ] Test all three methods end-to-end
- [ ] Monitor logs for any issues
- [ ] Remove old duplicated code

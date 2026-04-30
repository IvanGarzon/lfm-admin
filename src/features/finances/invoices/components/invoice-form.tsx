'use client';

import { InvoiceStatusSchema, type InvoiceStatus } from '@/zod/schemas/enums/InvoiceStatus.schema';
import { useCallback, useMemo, useRef } from 'react';
import { useForm, useFieldArray, useWatch, type Resolver, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, AlertCircle } from 'lucide-react';

import { Box } from '@/components/ui/box';
import { Form } from '@/components/ui/form';

import {
  CreateInvoiceSchema,
  UpdateInvoiceSchema,
  type CreateInvoiceInput,
  type UpdateInvoiceInput,
} from '@/schemas/invoices';
import type {
  InvoiceFormInput,
  InvoiceMetadata,
  InvoiceItemDetail,
  InvoiceStatusHistoryItem,
} from '@/features/finances/invoices/types';
import { useActiveCustomers } from '@/features/crm/customers/hooks/use-customer-queries';
import { useActiveProducts } from '@/features/inventory/products/hooks/use-products-queries';
import { InvoiceItemsList } from '@/features/finances/invoices/components/invoice-items-list';
import { InvoiceHeaderFields } from '@/features/finances/invoices/components/form-fields/invoice-header-fields';
import { InvoiceTaxDiscountFields } from '@/features/finances/invoices/components/form-fields/invoice-tax-discount-fields';
import { InvoiceNotesField } from '@/features/finances/invoices/components/form-fields/invoice-notes-field';
import { InvoiceTotalSummary } from '@/features/finances/invoices/components/form-fields/invoice-total-summary';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { useFormReset } from '@/hooks/use-form-reset';

const defaultFormState: CreateInvoiceInput = {
  customerId: '',
  gst: 10,
  discount: 0,
  status: InvoiceStatusSchema.enum.DRAFT,
  issuedDate: new Date(),
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  currency: 'AUD',
  notes: '',
  items: [
    {
      description: '',
      quantity: 1,
      unitPrice: 0,
      productId: null,
    },
  ],
};

const mapInvoiceToFormValues = (
  invoice: InvoiceMetadata,
  items: InvoiceItemDetail[] = [],
): UpdateInvoiceInput => {
  return {
    id: invoice.id,
    customerId: invoice.customer.id,
    gst: Number(invoice.gst),
    discount: Number(invoice.discount),
    status: invoice.status,
    issuedDate: invoice.issuedDate,
    dueDate: invoice.dueDate,
    currency: invoice.currency,
    notes: invoice.notes ?? '',
    items: items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      productId: item.productId,
    })),
  };
};

export function InvoiceForm({
  invoice,
  items,
  onCreate,
  onUpdate,
  isCreating = false,
  isUpdating = false,
  isLoadingItems = false,
  onDirtyStateChange,
}: {
  invoice?: InvoiceMetadata | null;
  items?: InvoiceItemDetail[];
  statusHistory?: InvoiceStatusHistoryItem[];
  onCreate?: (data: CreateInvoiceInput) => void;
  onUpdate?: (data: UpdateInvoiceInput) => void;
  isCreating?: boolean;
  isUpdating?: boolean;
  isLoadingItems?: boolean;
  isLoadingHistory?: boolean;
  onDirtyStateChange?: (isDirty: boolean) => void;
}) {
  const mode = invoice ? 'update' : 'create';

  const { data: customers, isLoading: isLoadingCustomers } = useActiveCustomers();
  const { data: products, isLoading: isLoadingProducts } = useActiveProducts();

  const defaultValues: InvoiceFormInput =
    mode === 'create'
      ? defaultFormState
      : invoice
        ? mapInvoiceToFormValues(invoice, items)
        : defaultFormState;

  const createResolver: Resolver<InvoiceFormInput> = (values, context, options) => {
    const schema = mode === 'create' ? CreateInvoiceSchema : UpdateInvoiceSchema;
    return zodResolver(schema)(values, context, options);
  };

  const form = useForm<InvoiceFormInput>({
    mode: 'onChange',
    resolver: createResolver,
    defaultValues,
  });

  const itemsFieldArray = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const [watchedItems, watchedGst, watchedDiscount] = useWatch({
    control: form.control,
    name: ['items', 'gst', 'discount'],
  });

  const gst = watchedGst ?? 0;
  const discount = watchedDiscount ?? 0;

  // Create a composite key that changes when either invoice or items change
  // This is needed because items load separately/asynchronously from the invoice
  // Without this, useFormReset won't trigger when items load since invoice.id stays the same
  const resetKey = invoice?.id ? `${invoice.id}-${items?.length ?? 0}` : undefined;

  // Reset form when invoice or items change
  useFormReset(
    form,
    resetKey,
    useCallback(() => {
      const values = invoice ? mapInvoiceToFormValues(invoice, items) : defaultFormState;
      // Notify parent that form is clean after reset
      onDirtyStateChange?.(false);
      return values;
    }, [invoice, items, onDirtyStateChange]),
    isUpdating, // Reset form when update completes (true -> false)
  );

  // Warn user before leaving page with unsaved changes
  useUnsavedChanges(form.formState.isDirty);

  // Track and notify parent of dirty state changes
  const previousDirtyRef = useRef(form.formState.isDirty);
  const currentDirty = form.formState.isDirty;

  if (currentDirty !== previousDirtyRef.current) {
    previousDirtyRef.current = currentDirty;
    queueMicrotask(() => {
      onDirtyStateChange?.(currentDirty);
    });
  }

  const isLocked = useMemo(() => {
    if (mode === 'create') {
      return false;
    }

    if (!invoice) {
      return false;
    }

    // Lock if PAID, PARTIALLY_PAID, CANCELLED, PENDING, or OVERDUE
    const lockedStatuses: InvoiceStatus[] = [
      InvoiceStatusSchema.enum.PAID,
      InvoiceStatusSchema.enum.PARTIALLY_PAID,
      InvoiceStatusSchema.enum.CANCELLED,
      InvoiceStatusSchema.enum.PENDING,
      InvoiceStatusSchema.enum.OVERDUE,
    ];

    return lockedStatuses.includes(invoice.status);
  }, [mode, invoice?.status]);

  const onSubmit: SubmitHandler<InvoiceFormInput> = useCallback(
    (data: InvoiceFormInput) => {
      if (isLocked) {
        return;
      }

      if (mode === 'create') {
        onCreate?.(data);
      } else {
        const updateData: UpdateInvoiceInput = {
          ...data,
          id: invoice?.id ?? '',
        };
        onUpdate?.(updateData);
      }
    },
    [isLocked, mode, onCreate, onUpdate, invoice?.id],
  );

  const subtotal = useMemo(() => {
    return watchedItems.reduce(
      (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
      0,
    );
  }, [watchedItems]);

  const tax = useMemo(() => (subtotal * gst) / 100, [subtotal, gst]);
  const total = useMemo(() => subtotal + tax - discount, [subtotal, tax, discount]);

  return (
    <Form {...form}>
      <form
        id="form-rhf-invoice"
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col h-full"
      >
        {isCreating || isUpdating ? (
          <Box className="px-6 py-3 bg-primary/10 border-b flex items-center justify-center gap-2">
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">
              {isCreating ? 'Creating invoice...' : 'Updating invoice...'}
            </span>
          </Box>
        ) : null}

        {isLocked ? (
          <Box className="px-6 py-3 bg-amber-50 border-b flex items-center gap-2 dark:bg-amber-900/20">
            <AlertCircle
              aria-hidden="true"
              className="h-4 w-4 text-amber-600 dark:text-amber-400"
            />
            <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
              This invoice is {invoice?.status.toLowerCase().replace(/_/g, ' ')} and cannot be
              edited.
            </span>
          </Box>
        ) : null}

        <Box className="flex-1 overflow-y-auto px-6 py-6">
          <InvoiceHeaderFields
            control={form.control}
            mode={mode}
            invoice={invoice}
            customers={customers ?? []}
            isLoadingCustomers={isLoadingCustomers}
            isLocked={isLocked}
          />

          {/* Items details */}
          {isLoadingItems ? (
            <Box className="py-12 flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg">
              <Loader2 aria-hidden="true" className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading invoice items...</p>
            </Box>
          ) : (
            <InvoiceItemsList
              form={form}
              fieldArray={itemsFieldArray}
              products={products}
              isLoadingProducts={isLoadingProducts}
              isLocked={isLocked}
            />
          )}

          <InvoiceTaxDiscountFields control={form.control} isLocked={isLocked} />

          <InvoiceNotesField control={form.control} isLocked={isLocked} />
        </Box>

        <InvoiceTotalSummary
          subtotal={subtotal}
          gst={gst}
          gstAmount={tax}
          discount={discount}
          total={total}
        />
      </form>
    </Form>
  );
}

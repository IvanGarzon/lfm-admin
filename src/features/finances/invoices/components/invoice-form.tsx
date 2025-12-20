'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { Controller, useForm, useFieldArray, type Resolver, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon, Percent, DollarSign, Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

import { InvoiceStatus } from '@/prisma/client';
import { cn, formatCurrency } from '@/lib/utils';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Form } from '@/components/ui/form';
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupText,
} from '@/components/ui/input-group';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';

import {
  CreateInvoiceSchema,
  UpdateInvoiceSchema,
  type CreateInvoiceInput,
  type UpdateInvoiceInput,
} from '@/schemas/invoices';
import { CustomerSelect } from '@/components/shared/customer-select';
import type { InvoiceWithDetails, InvoiceFormInput, InvoiceBasic, InvoiceItemDetail, InvoiceStatusHistoryItem } from '@/features/finances/invoices/types';
import { useCustomers } from '@/features/customers/hooks/useCustomersQueries';
import { useProducts } from '@/features/products/hooks/useProductsQueries';
import { InvoiceItemsList } from '@/features/finances/invoices/components/invoice-items-list';
import { InvoiceStatusHistory } from '@/features/finances/invoices/components/invoice-status-history';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';

const defaultFormState: CreateInvoiceInput = {
  customerId: '',
  gst: 10,
  discount: 0,
  status: InvoiceStatus.DRAFT,
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
  invoice: InvoiceBasic,
  items: InvoiceItemDetail[] = []
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
  statusHistory,
  onCreate,
  onUpdate,
  isCreating = false,
  isUpdating = false,
  isLoadingItems = false,
  isLoadingHistory = false,
  onDirtyStateChange,
}: {
  invoice?: InvoiceBasic | null;
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

  const { data: customers, isLoading: isLoadingCustomers } = useCustomers();
  const { data: products, isLoading: isLoadingProducts } = useProducts();

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

  const gst = form.watch('gst') ?? 0;
  const discount = form.watch('discount') ?? 0;

  useEffect(() => {
    if (mode === 'update' && invoice) {
      const formValues = mapInvoiceToFormValues(invoice, items);
      form.reset(formValues);
    }
  }, [invoice, items, mode]);

  useEffect(() => {
    if (onDirtyStateChange) {
      onDirtyStateChange(form.formState.isDirty);
    }
  }, [form.formState.isDirty, onDirtyStateChange]);

  // Warn user before leaving page with unsaved changes
  useUnsavedChanges(form.formState.isDirty);

  const isLocked = useMemo(() => {
    if (mode === 'create') {
      return false;
    }
    
    if (!invoice) {
      return false;
    }
    
    // Lock if PAID, PARTIALLY_PAID, CANCELLED, PENDING, or OVERDUE
    const lockedStatuses: InvoiceStatus[] = [
      InvoiceStatus.PAID, 
      InvoiceStatus.PARTIALLY_PAID, 
      InvoiceStatus.CANCELLED,
      InvoiceStatus.PENDING,
      InvoiceStatus.OVERDUE,
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

  const calculateSubtotal = useCallback(() => {
    const items = form.watch('items');
    return items.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0);
  }, [form]);

  const calculateTax = useCallback(() => {
    return (calculateSubtotal() * gst) / 100;
  }, [calculateSubtotal, gst]);

  const calculateTotal = useCallback(() => {
    return calculateSubtotal() + calculateTax() - discount;
  }, [calculateSubtotal, calculateTax, discount]);

  return (
    <Form {...form}>
      <form
        id="form-rhf-invoice"
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col h-full"
      >
        {isCreating || isUpdating ? (
          <Box className="px-6 py-3 bg-primary/10 border-b flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">
              {isCreating ? 'Creating invoice...' : 'Updating invoice...'}
            </span>
          </Box>
        ) : null}

        {isLocked ? (
          <Box className="px-6 py-3 bg-amber-50 border-b flex items-center gap-2 dark:bg-amber-900/20">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
              This invoice is {invoice?.status.toLowerCase()} and cannot be edited.
            </span>
          </Box>
        ) : null}

        <Box className="flex-1 overflow-y-auto px-6 py-6">
          {/* Customer Selection */}
          <FieldGroup>
            <Controller
              name="customerId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Box>
                  <CustomerSelect
                    customers={customers ?? []}
                    value={field.value}
                    onValueChange={field.onChange}
                    isLoading={isLoadingCustomers}
                    disabled={isLoadingCustomers || isLocked}
                    label="Bill to"
                    showAddCustomerLink={true}
                    isLocked={isLocked}
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Box>
              )}
            />
          </FieldGroup>

          {/* Invoice Number (Read-only when editing) & Currency */}
          <Box className="grid grid-cols-2 gap-4">
            {mode === 'update' && invoice?.invoiceNumber ? (
              <FieldGroup>
                <Field>
                  <FieldContent>
                    <FieldLabel htmlFor="form-rhf-invoice-number">Invoice Number</FieldLabel>
                  </FieldContent>
                  <Input
                    id="form-rhf-invoice-number"
                    value={invoice.invoiceNumber}
                    disabled
                    readOnly
                    className="bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
                  />
                </Field>
              </FieldGroup>
            ) : null}

            <FieldGroup className={mode === 'create' ? 'col-span-2' : ''}>
              <Controller
                name="currency"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel htmlFor="form-rhf-currency">Currency</FieldLabel>
                    </FieldContent>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isLocked}>
                      <SelectTrigger
                        id="form-rhf-select-currency"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
            </FieldGroup>
          </Box>

          {/* Dates */}
          <Box className="grid grid-cols-2 gap-4">
            <FieldGroup>
              <Controller
                name="issuedDate"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel htmlFor="form-rhf-issued-date">Issued Date</FieldLabel>
                    </FieldContent>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !field.value && 'text-muted-foreground',
                          )}
                          type="button"
                          disabled={isLocked}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          autoFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
            </FieldGroup>

            <FieldGroup>
              <Controller
                name="dueDate"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel htmlFor="form-rhf-due-date">Due Date</FieldLabel>
                    </FieldContent>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !field.value && 'text-muted-foreground',
                          )}
                          type="button"
                          disabled={isLocked}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          autoFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
            </FieldGroup>
          </Box>

          {/* Items details */}
          {isLoadingItems ? (
            <Box className="py-12 flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg">
               <Loader2 className="h-6 w-6 animate-spin text-primary" />
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

          {/* GST and Discount */}
          <Box className="grid grid-cols-2 gap-4">
            <FieldGroup>
              <Controller
                name="gst"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel htmlFor="form-rhf-gst">GST</FieldLabel>
                    </FieldContent>
                    <InputGroup>
                      <InputGroupAddon align="inline-start">
                        <InputGroupText>
                          <Percent className="h-4 w-4" />
                        </InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        {...field}
                        id="form-rhf-input-gst"
                        aria-invalid={fieldState.invalid}
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        placeholder="Enter GST percentage"
                        disabled={isLocked}
                      />
                    </InputGroup>
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
            </FieldGroup>

            <FieldGroup>
              <Controller
                name="discount"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel htmlFor="form-rhf-discount">Discount</FieldLabel>
                    </FieldContent>
                    <InputGroup>
                      <InputGroupAddon align="inline-start">
                        <InputGroupText>
                          <DollarSign className="h-4 w-4" />
                        </InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        {...field}
                        id="form-rhf-input-discount"
                        aria-invalid={fieldState.invalid}
                        type="number"
                        step="1"
                        min="0"
                        value={isNaN(field.value ?? 0) ? '' : (field.value ?? 0)}
                        onChange={(e) => {
                          const value = e.target.valueAsNumber;
                          field.onChange(isNaN(value) ? 0 : value);
                        }}
                        placeholder="Enter discount amount"
                        disabled={isLocked}
                      />
                    </InputGroup>
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
            </FieldGroup>
          </Box>

          {/* Notes */}
          <FieldGroup>
            <Controller
              name="notes"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldContent>
                    <FieldLabel htmlFor="form-rhf-notes">Notes</FieldLabel>
                  </FieldContent>
                  <Textarea
                    {...field}
                    id="form-rhf-textarea-notes"
                    aria-invalid={fieldState.invalid}
                    value={field.value ?? ''}
                    placeholder="Add any additional comments or notes for this invoice..."
                    rows={3}
                    className="resize-none"
                    disabled={isLocked}
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
          </FieldGroup>

          {/* Status History - Only show for existing invoices */}
          {isLoadingHistory ? (
            <Box className="py-4 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Loading history...</span>
            </Box>
          ) : (statusHistory && statusHistory.length > 0) ? (
            <FieldGroup>
              <InvoiceStatusHistory history={statusHistory} />
            </FieldGroup>
          ): null}
        </Box>

        {/* Total Summary */}
        <Box className="border-t p-6 space-y-3 bg-gray-50 dark:bg-gray-900">
          <Box className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
            <span>Subtotal:</span>
            <span>{formatCurrency({ number: calculateSubtotal() })}</span>
          </Box>
          <Box className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
            <span>Gst ({gst}%):</span>
            <span>{formatCurrency({ number: calculateTax() })}</span>
          </Box>
          {discount > 0 ? (
            <Box className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
              <span>Discount:</span>
              <span>-{formatCurrency({ number: discount })}</span>
            </Box>
          ) : null}
          <Box className="flex justify-between items-center text-lg font-bold pt-3 border-t border-gray-200 dark:border-gray-700">
            <span>Invoice Total:</span>
            <span>{formatCurrency({ number: calculateTotal() })}</span>
          </Box>
        </Box>
      </form>
    </Form>
  );
}

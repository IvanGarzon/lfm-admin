'use client';

import { useCallback, useEffect } from 'react';
import { Controller, useForm, useFieldArray, type Resolver, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon, Percent, DollarSign, Loader2, AlertCircle } from 'lucide-react';
import { format, addDays, startOfToday } from 'date-fns';
import dynamic from 'next/dynamic';

import { QuoteStatusSchema } from '@/zod/inputTypeSchemas/QuoteStatusSchema';
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
  CreateQuoteSchema,
  UpdateQuoteSchema,
  type CreateQuoteInput,
  type UpdateQuoteInput,
} from '@/schemas/quotes';
import { CustomerSelect } from '@/components/shared/customer-select';
import type { QuoteWithDetails, QuoteFormInput } from '@/features/finances/quotes/types';
import {
  getQuoteStatusLabel,
  getQuotePermissions,
} from '@/features/finances/quotes/utils/quote-helpers';
import { useCustomers } from '@/features/customers/hooks/useCustomersQueries';
import { useProducts } from '@/features/products/hooks/useProductsQueries';
import { QuoteItemsList } from '@/features/finances/quotes/components/quote-items-list';
import { QuoteStatusHistory } from '@/features/finances/quotes/components/quote-status-history';
import { QuoteVersions } from '@/features/finances/quotes/components/quote-versions';
import {
  useDeleteQuoteItemAttachment,
  useGetItemAttachmentDownloadUrl,
} from '@/features/finances/quotes/hooks/use-quote-queries';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';

// Lazy load QuoteItemDetails to avoid loading TipTap on every drawer open
// This component uses RichTextEditor (TipTap) which is a heavy dependency (~1-2MB)
// Only needed for existing quotes in edit mode, not for creating new quotes
const QuoteItemDetails = dynamic(
  () =>
    import('@/features/finances/quotes/components/quote-item-details').then(
      (mod) => mod.QuoteItemDetails,
    ),
  {
    ssr: false,
    loading: () => (
      <Box className="p-4">
        <p className="text-sm text-muted-foreground">Loading item details...</p>
      </Box>
    ),
  },
);

const defaultFormState: CreateQuoteInput = {
  customerId: '',
  status: QuoteStatusSchema.enum.DRAFT,
  issuedDate: startOfToday(),
  validUntil: addDays(startOfToday(), 15), // 15 days from now
  currency: 'AUD',
  gst: 10,
  discount: 0,
  notes: '',
  terms: '',
  items: [
    {
      description: '',
      quantity: 1,
      unitPrice: 0,
      productId: null,
      colors: [],
    },
  ],
};

const mapQuoteToFormValues = (quote: QuoteWithDetails): UpdateQuoteInput => {
  return {
    id: quote.id,
    customerId: quote.customer.id,
    status: quote.status,
    issuedDate: quote.issuedDate,
    validUntil: quote.validUntil,
    currency: quote.currency,
    gst: Number(quote.gst),
    discount: Number(quote.discount),
    notes: quote.notes ?? '',
    terms: quote.terms ?? '',
    items: quote.items.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      productId: item.productId,
      colors: item.colors,
    })),
  };
};

export function QuoteForm({
  quote,
  onCreate,
  onUpdate,
  isCreating = false,
  isUpdating = false,
  onDirtyStateChange,
}: {
  quote?: QuoteWithDetails | null;
  onCreate?: (data: CreateQuoteInput) => void;
  onUpdate?: (data: UpdateQuoteInput) => void;
  isCreating?: boolean;
  isUpdating?: boolean;
  onDirtyStateChange?: (isDirty: boolean) => void;
}) {
  const mode = quote ? 'update' : 'create';

  const { data: customers, isLoading: isLoadingCustomers } = useCustomers();
  const { data: products, isLoading: isLoadingProducts } = useProducts();

  // Item attachment mutations
  const deleteItemMutation = useDeleteQuoteItemAttachment();
  const downloadItemMutation = useGetItemAttachmentDownloadUrl();

  const defaultValues: QuoteFormInput =
    mode === 'create' ? defaultFormState : quote ? mapQuoteToFormValues(quote) : defaultFormState;

  const createResolver: Resolver<QuoteFormInput> = (values, context, options) => {
    const schema = mode === 'create' ? CreateQuoteSchema : UpdateQuoteSchema;
    return zodResolver(schema)(values, context, options);
  };

  const form = useForm<QuoteFormInput>({
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
    if (mode === 'update' && quote) {
      const formValues = mapQuoteToFormValues(quote);
      form.reset(formValues);
    }
  }, [quote, mode]);

  useEffect(() => {
    if (onDirtyStateChange) {
      onDirtyStateChange(form.formState.isDirty);
    }
  }, [form.formState.isDirty, onDirtyStateChange]);

  // Warn user before leaving page with unsaved changes
  useUnsavedChanges(form.formState.isDirty);

  // Use permissions from getQuotePermissions for consistency
  const { canEdit } = getQuotePermissions(quote?.status);
  const isLocked = mode === 'update' && !canEdit;

  const onSubmit: SubmitHandler<QuoteFormInput> = useCallback(
    (data: QuoteFormInput) => {
      if (isLocked) {
        return;
      }

      if (mode === 'create') {
        onCreate?.(data);
      } else {
        const updateData: UpdateQuoteInput = {
          ...data,
          id: quote?.id ?? '',
        };
        onUpdate?.(updateData);
      }
    },
    [isLocked, mode, onCreate, onUpdate, quote?.id],
  );

  // Item attachment handlers
  const handleDownloadItemImage = useCallback(
    (attachmentId: string) => {
      if (!quote?.id) return;
      downloadItemMutation.mutate(attachmentId);
    },
    [downloadItemMutation, quote?.id],
  );

  const handleDeleteItemImage = useCallback(
    (attachmentId: string, quoteItemId: string, onSuccess: () => void) => {
      if (!quote?.id) return;
      deleteItemMutation.mutate(
        { attachmentId, quoteItemId, quoteId: quote.id },
        {
          onSuccess: () => {
            onSuccess();
          },
        },
      );
    },
    [deleteItemMutation, quote?.id],
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
        id="form-rhf-quote"
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col h-full"
      >
        {isCreating || isUpdating ? (
          <Box className="px-6 py-3 bg-primary/10 border-b flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">
              {isCreating ? 'Creating quote...' : 'Updating quote...'}
            </span>
          </Box>
        ) : null}

        {isLocked ? (
          <Box className="px-6 py-3 bg-amber-50 border-b flex items-center gap-2 dark:bg-amber-900/20">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
              This quote is {quote?.status ? getQuoteStatusLabel(quote.status) : 'locked'} and
              cannot be edited.
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
                    label="Quote for"
                    showAddCustomerLink={true}
                    isLocked={isLocked}
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Box>
              )}
            />
          </FieldGroup>

          {/* Quote Number (Read-only when editing) & Currency */}
          <Box className="grid grid-cols-2 gap-4">
            {mode === 'update' && quote?.quoteNumber ? (
              <FieldGroup>
                <Field>
                  <FieldContent>
                    <FieldLabel htmlFor="form-rhf-quote-number">Quote Number</FieldLabel>
                  </FieldContent>
                  <Input
                    id="form-rhf-quote-number"
                    value={quote.quoteNumber}
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
                name="validUntil"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel htmlFor="form-rhf-valid-until">Valid Until</FieldLabel>
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
          <QuoteItemsList
            form={form}
            fieldArray={itemsFieldArray}
            products={products}
            isLoadingProducts={isLoadingProducts}
            isLocked={isLocked}
            quoteId={quote?.id}
          />

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

          {/* Item Details: Colors & Images (only for existing quotes) */}
          {mode === 'update' && quote && quote.items.length > 0 ? (
            <Box className="space-y-4">
              <QuoteItemDetails
                quoteId={quote.id}
                items={quote.items}
                readOnly={isLocked}
                onDownloadImage={handleDownloadItemImage}
                onDeleteImage={handleDeleteItemImage}
                isDeleting={deleteItemMutation.isPending}
              />
            </Box>
          ) : null}

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
                    placeholder="Add any additional comments or notes for this quote..."
                    rows={3}
                    className="resize-none"
                    disabled={isLocked}
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
          </FieldGroup>

          {/* Terms & Conditions */}
          <FieldGroup>
            <Controller
              name="terms"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldContent>
                    <FieldLabel htmlFor="form-rhf-terms">Terms & Conditions</FieldLabel>
                  </FieldContent>
                  <Textarea
                    {...field}
                    id="form-rhf-textarea-terms"
                    aria-invalid={fieldState.invalid}
                    value={field.value ?? ''}
                    placeholder="Add terms and conditions for this quote..."
                    rows={4}
                    className="resize-none"
                    disabled={isLocked}
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
          </FieldGroup>

          {/* Status History - Only show for existing quotes */}
          {quote?.statusHistory && quote.statusHistory.length > 0 ? (
            <FieldGroup>
              <QuoteStatusHistory history={quote.statusHistory} />
            </FieldGroup>
          ) : null}

          {/* Version History - Only show for existing quotes with versions */}
          {quote?.id ? (
            <FieldGroup>
              <QuoteVersions quoteId={quote.id} currentVersionId={quote.id} />
            </FieldGroup>
          ) : null}

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
              <span>Quote Total:</span>
              <span>{formatCurrency({ number: calculateTotal() })}</span>
            </Box>
          </Box>
        </Box>
      </form>
    </Form>
  );
}

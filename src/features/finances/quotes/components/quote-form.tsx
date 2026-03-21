'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useForm, useFieldArray, useWatch, type Resolver, SubmitHandler } from 'react-hook-form';
import { useFormReset } from '@/hooks/use-form-reset';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, AlertCircle } from 'lucide-react';
import { addDays, startOfToday } from 'date-fns';
import dynamic from 'next/dynamic';

import { QuoteStatusSchema } from '@/zod/schemas/enums/QuoteStatus.schema';
import { Box } from '@/components/ui/box';
import { Form } from '@/components/ui/form';

import {
  CreateQuoteSchema,
  UpdateQuoteSchema,
  type CreateQuoteInput,
  type UpdateQuoteInput,
} from '@/schemas/quotes';
import type { QuoteMetadata, QuoteItem, QuoteFormInput } from '@/features/finances/quotes/types';
import {
  getQuoteStatusLabel,
  getQuotePermissions,
} from '@/features/finances/quotes/utils/quote-helpers';
import { useActiveCustomers } from '@/features/crm/customers/hooks/use-customer-queries';
import { useActiveProducts } from '@/features/inventory/products/hooks/use-products-queries';
import { useAllRecipes } from '@/features/finances/recipes/hooks/use-recipe-queries';
import { useAllRecipeGroups } from '@/features/finances/recipe-groups/hooks/use-recipe-group-queries';
import { QuoteItemsList } from '@/features/finances/quotes/components/quote-items-list';
import {
  useDeleteQuoteItemAttachment,
  useGetItemAttachmentDownloadUrl,
} from '@/features/finances/quotes/hooks/use-quote-queries';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { QuoteHeaderFields } from './form-fields/quote-header-fields';
import { QuoteDateFields } from './form-fields/quote-date-fields';
import { QuoteTaxDiscountFields } from './form-fields/quote-tax-discount-fields';
import { QuoteNotesFields } from './form-fields/quote-notes-fields';
import { QuoteTotalSummary } from './form-fields/quote-total-summary';

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
  gst: 0,
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

const mapQuoteToFormValues = (quote: QuoteMetadata, items: QuoteItem[] = []): UpdateQuoteInput => {
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
    items: items.map((item) => ({
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
  items,
  onCreate,
  onUpdate,
  isCreating = false,
  isUpdating = false,
  isLoadingItems = false,
  onDirtyStateChange,
}: {
  quote?: QuoteMetadata | null;
  items?: QuoteItem[] | null;
  onCreate?: (data: CreateQuoteInput) => void;
  onUpdate?: (data: UpdateQuoteInput) => void;
  isCreating?: boolean;
  isUpdating?: boolean;
  isLoadingItems?: boolean;
  onDirtyStateChange?: (isDirty: boolean) => void;
}) {
  const mode = quote ? 'update' : 'create';

  const [shouldFetchRecipes, setShouldFetchRecipes] = useState(false);
  const [shouldFetchProducts, setShouldFetchProducts] = useState(false);

  const { data: customers, isLoading: isLoadingCustomers } = useActiveCustomers();
  const { data: products, isLoading: isLoadingProducts } = useActiveProducts(shouldFetchProducts);
  const { data: recipes, isLoading: isLoadingRecipes } = useAllRecipes(shouldFetchRecipes);
  const { data: recipeGroups, isLoading: isLoadingRecipeGroups } =
    useAllRecipeGroups(shouldFetchRecipes);

  const deleteItemMutation = useDeleteQuoteItemAttachment();
  const downloadItemMutation = useGetItemAttachmentDownloadUrl();

  const defaultValues: QuoteFormInput =
    mode === 'create'
      ? defaultFormState
      : quote
        ? mapQuoteToFormValues(quote, items ?? [])
        : defaultFormState;

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

  const [watchedItems, watchedGst, watchedDiscount] = useWatch({
    control: form.control,
    name: ['items', 'gst', 'discount'],
  });

  const gst = watchedGst ?? 0;
  const discount = watchedDiscount ?? 0;

  useFormReset(
    form,
    quote?.id,
    useCallback(() => {
      const values = quote ? mapQuoteToFormValues(quote, items ?? []) : defaultFormState;
      onDirtyStateChange?.(false);

      return values;
    }, [quote, items, onDirtyStateChange]),
    isUpdating,
  );

  useUnsavedChanges(form.formState.isDirty);

  const { canEdit } = getQuotePermissions(quote?.status);
  const isLocked = mode === 'update' && !canEdit;

  const previousDirtyRef = useRef(form.formState.isDirty);
  const currentDirty = form.formState.isDirty;

  if (currentDirty !== previousDirtyRef.current) {
    previousDirtyRef.current = currentDirty;
    queueMicrotask(() => {
      onDirtyStateChange?.(currentDirty);
    });
  }

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

  const handleDownloadItemImage = useCallback(
    (attachmentId: string) => {
      if (!quote?.id) {
        return;
      }

      downloadItemMutation.mutate(attachmentId);
    },
    [downloadItemMutation, quote?.id],
  );

  const handleDeleteItemImage = useCallback(
    (attachmentId: string, quoteItemId: string, onSuccess: () => void) => {
      if (!quote?.id) {
        return;
      }

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

        <Box className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          <QuoteHeaderFields
            control={form.control}
            customers={customers}
            isLoadingCustomers={isLoadingCustomers}
            isLocked={isLocked}
            mode={mode}
            quoteNumber={quote?.quoteNumber}
          />

          <QuoteDateFields control={form.control} isLocked={isLocked} />

          {isLoadingItems ? (
            <Box className="py-12 flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading invoice items...</p>
            </Box>
          ) : (
            <QuoteItemsList
              form={form}
              fieldArray={itemsFieldArray}
              products={products}
              isLoadingProducts={isLoadingProducts}
              recipes={recipes}
              isLoadingRecipes={isLoadingRecipes}
              recipeGroups={recipeGroups}
              isLoadingRecipeGroups={isLoadingRecipeGroups}
              onRequestRecipes={() => setShouldFetchRecipes(true)}
              onRequestProducts={() => setShouldFetchProducts(true)}
              isLocked={isLocked}
              quoteId={quote?.id}
            />
          )}

          <QuoteTaxDiscountFields control={form.control} isLocked={isLocked} />

          {mode === 'update' && quote && items && items.length > 0 ? (
            <Box className="space-y-4">
              <QuoteItemDetails
                quoteId={quote.id}
                items={items}
                readOnly={isLocked}
                onDownloadImage={handleDownloadItemImage}
                onDeleteImage={handleDeleteItemImage}
                isDeleting={deleteItemMutation.isPending}
              />
            </Box>
          ) : null}

          <QuoteNotesFields control={form.control} isLocked={isLocked} />
        </Box>

        <QuoteTotalSummary
          subtotal={subtotal}
          gst={gst}
          tax={tax}
          discount={discount}
          total={total}
        />
      </form>
    </Form>
  );
}

'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useForm, useWatch, type Resolver, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

import { useActiveVendors } from '@/features/inventory/vendors/hooks/use-vendor-queries';
import { TransactionTypeSchema } from '@/zod/schemas/enums/TransactionType.schema';
import { TransactionStatusSchema } from '@/zod/schemas/enums/TransactionStatus.schema';

import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import {
  CreateTransactionSchema,
  UpdateTransactionSchema,
  type CreateTransactionInput,
  type UpdateTransactionInput,
} from '@/schemas/transactions';

import type {
  TransactionListItem,
  TransactionFormInput,
} from '@/features/finances/transactions/types';
import { type Category } from './category-multi-select';
import { TransactionAttachments } from './transaction-attachments';
import { useFormReset } from '@/hooks/use-form-reset';
import { useTransactionCategories } from '@/features/finances/transactions/hooks/use-transaction-queries';
import { TransactionTypeFields } from './form-fields/transaction-type-fields';
import { TransactionCategoryField } from './form-fields/transaction-category-field';
import { TransactionPayeeField } from './form-fields/transaction-payee-field';
import { TransactionDescriptionField } from './form-fields/transaction-description-field';
import { TransactionDateStatusFields } from './form-fields/transaction-date-status-fields';

const defaultFormState: CreateTransactionInput = {
  type: TransactionTypeSchema.enum.INCOME,
  date: new Date(),
  amount: 0,
  currency: 'AUD',
  categoryIds: [],
  description: '',
  payee: '',
  status: TransactionStatusSchema.enum.PENDING,
  referenceId: null,
  invoiceId: null,
  vendorId: null,
};

const mapTransactionToFormValues = (transaction: TransactionListItem): UpdateTransactionInput => {
  // Extract category IDs from the categories relation
  const categoryIds =
    transaction.categories?.map((cat: { category: { id: string } }) => cat.category.id) || [];

  return {
    id: transaction.id,
    type: transaction.type,
    date: transaction.date,
    amount: Number(transaction.amount),
    currency: transaction.currency,
    categoryIds,
    description: transaction.description,
    payee: transaction.payee,
    status: transaction.status,
    referenceNumber: transaction.referenceNumber ?? null,
    referenceId: transaction.referenceId ?? null,
    invoiceId: transaction.invoiceId ?? null,
    vendorId: transaction.vendorId ?? null,
  };
};

export function TransactionForm({
  transaction,
  onCreate,
  onUpdate,
  isCreating = false,
  isUpdating = false,
  onDirtyStateChange,
  onClose,
}: {
  transaction?: TransactionListItem;
  onCreate?: (data: CreateTransactionInput) => void;
  onUpdate?: (data: UpdateTransactionInput) => void;
  isCreating?: boolean;
  isUpdating?: boolean;
  onDirtyStateChange?: (isDirty: boolean) => void;
  onClose?: () => void;
}) {
  const mode = transaction ? 'edit' : 'create';
  const queryClient = useQueryClient();

  const { data: vendors = [] } = useActiveVendors();
  const { data: categories = [], isLoading: isLoadingCategories } = useTransactionCategories();

  const defaultValues: TransactionFormInput =
    mode === 'create'
      ? defaultFormState
      : transaction
        ? mapTransactionToFormValues(transaction)
        : defaultFormState;

  const createResolver: Resolver<TransactionFormInput> = (values, context, options) => {
    const schema = mode === 'create' ? CreateTransactionSchema : UpdateTransactionSchema;
    return zodResolver(schema)(values, context, options);
  };

  const form = useForm<TransactionFormInput>({
    mode: 'onChange',
    resolver: createResolver,
    defaultValues,
  });

  useFormReset(
    form,
    transaction?.id,
    useCallback(() => {
      const values = transaction ? mapTransactionToFormValues(transaction) : defaultFormState;
      onDirtyStateChange?.(false);
      return values;
    }, [transaction, onDirtyStateChange]),
  );

  const { isDirty } = form.formState;

  const [watchedType, watchedVendorId] = useWatch({
    control: form.control,
    name: ['type', 'vendorId'],
  });

  // Auto-populate payee when vendor is selected
  useEffect(() => {
    if (watchedVendorId && watchedType === TransactionTypeSchema.enum.EXPENSE) {
      const selectedVendor = vendors.find((v) => v.id === watchedVendorId);
      if (selectedVendor) {
        form.setValue('payee', selectedVendor.name, { shouldDirty: true });
      }
    }
  }, [watchedVendorId, vendors, watchedType, form]);

  useUnsavedChanges(form.formState.isDirty);

  const previousDirtyRef = useRef(form.formState.isDirty);
  const currentDirty = form.formState.isDirty;

  if (currentDirty !== previousDirtyRef.current) {
    previousDirtyRef.current = currentDirty;
    queueMicrotask(() => {
      onDirtyStateChange?.(currentDirty);
    });
  }

  const handleCategoryCreated = useCallback(
    (_newCategory: Category) => {
      queryClient.invalidateQueries({ queryKey: ['transactions', 'categories'] });
    },
    [queryClient],
  );

  const onSubmit: SubmitHandler<TransactionFormInput> = useCallback(
    (data: TransactionFormInput) => {
      onDirtyStateChange?.(false);

      if (mode === 'create') {
        onCreate?.(data);
      } else {
        const updateData: UpdateTransactionInput = {
          ...data,
          id: transaction?.id ?? '',
        };

        onUpdate?.(updateData);
      }
    },
    [mode, onCreate, onUpdate, transaction?.id, onDirtyStateChange],
  );

  const isDisabled = isCreating || isUpdating;

  return (
    <Form {...form}>
      <form
        id="form-rhf-transaction"
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col h-full"
      >
        {isDisabled ? (
          <Box className="px-6 py-3 bg-primary/10 border-b flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">
              {isCreating ? 'Creating transaction...' : 'Updating transaction...'}
            </span>
          </Box>
        ) : null}

        {mode === 'edit' && transaction?.referenceNumber ? (
          <Box className="px-6 py-2 bg-muted/30 border-b flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Reference Number
            </span>
            <span className="text-sm font-mono font-bold text-primary">
              {transaction.referenceNumber}
            </span>
          </Box>
        ) : null}

        <Box className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          <TransactionTypeFields control={form.control} isDisabled={isDisabled} />
          <TransactionCategoryField
            control={form.control}
            isDisabled={isDisabled}
            categories={categories}
            isLoadingCategories={isLoadingCategories}
            onCategoryCreated={handleCategoryCreated}
          />
          <TransactionPayeeField
            control={form.control}
            isDisabled={isDisabled}
            transactionType={watchedType}
          />
          <TransactionDescriptionField control={form.control} isDisabled={isDisabled} />
          <TransactionDateStatusFields control={form.control} isDisabled={isDisabled} />
          <TransactionAttachments
            transactionId={transaction?.id}
            attachments={transaction?.attachments || []}
            disabled={isDisabled}
            mode={mode}
          />
        </Box>

        <Box className="border-t p-6 flex gap-3 justify-end bg-gray-50 dark:bg-gray-900">
          {onClose ? (
            <Button type="button" variant="outline" onClick={onClose} disabled={isDisabled}>
              Cancel
            </Button>
          ) : null}
          <Button type="submit" disabled={isDisabled || (transaction && !isDirty)}>
            {isDisabled ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === 'create' ? 'Creating...' : 'Updating...'}
              </>
            ) : mode === 'create' ? (
              'Create Transaction'
            ) : (
              'Update Transaction'
            )}
          </Button>
        </Box>
      </form>
    </Form>
  );
}

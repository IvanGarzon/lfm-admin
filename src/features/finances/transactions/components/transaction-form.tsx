'use client';

import { useCallback, useEffect, useState } from 'react';
import { Controller, useForm, type Resolver, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon, DollarSign, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { TransactionType, TransactionStatus } from '@/prisma/client';

import { cn } from '@/lib/utils';
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
  CreateTransactionSchema,
  UpdateTransactionSchema,
  type CreateTransactionInput,
  type UpdateTransactionInput,
} from '@/schemas/transactions';

import type { Transaction, TransactionFormInput } from '../types';
import { getTransactionCategories } from '@/actions/transactions/queries';
import { CategoryMultiSelect, type Category } from './category-multi-select';

const defaultFormState: CreateTransactionInput = {
  type: TransactionType.INCOME,
  date: new Date(),
  amount: 0,
  currency: 'AUD',
  categoryIds: [],
  description: '',
  payee: '',
  status: TransactionStatus.PENDING,
  referenceId: null,
  invoiceId: null,
};

const mapTransactionToFormValues = (transaction: Transaction): UpdateTransactionInput => {
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
    referenceId: transaction.referenceId ?? null,
    invoiceId: transaction.invoiceId ?? null,
  };
};

export function TransactionForm({
  transaction,
  onCreate,
  onUpdate,
  isCreating = false,
  isUpdating = false,
  onClose,
}: {
  transaction?: Transaction | null;
  onCreate?: (data: CreateTransactionInput) => void;
  onUpdate?: (data: UpdateTransactionInput) => void;
  isCreating?: boolean;
  isUpdating?: boolean;
  onClose?: () => void;
}) {
  const mode = transaction ? 'update' : 'create';
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

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

  const transactionType = form.watch('type');

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoadingCategories(true);
      const result = await getTransactionCategories();
      if (result.success && result.data) {
        setCategories(result.data);
      }
      setIsLoadingCategories(false);
    };

    fetchCategories();
  }, []);

  // Handle new category creation
  const handleCategoryCreated = useCallback((newCategory: Category) => {
    setCategories((prev) => [...prev, newCategory]);
  }, []);

  useEffect(() => {
    if (mode === 'update' && transaction) {
      const formValues = mapTransactionToFormValues(transaction);
      form.reset(formValues);
    }
  }, [transaction, mode, form]);

  const onSubmit: SubmitHandler<TransactionFormInput> = useCallback(
    (data: TransactionFormInput) => {
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
    [mode, onCreate, onUpdate, transaction?.id],
  );

  return (
    <Form {...form}>
      <form
        id="form-rhf-transaction"
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col h-full"
      >
        {isCreating || isUpdating ? (
          <Box className="px-6 py-3 bg-primary/10 border-b flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">
              {isCreating ? 'Creating transaction...' : 'Updating transaction...'}
            </span>
          </Box>
        ) : null}

        <Box className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          <Box className="grid grid-cols-3 gap-4">
            <FieldGroup>
              <Controller
                name="type"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel htmlFor="form-rhf-type">Transaction Type</FieldLabel>
                    </FieldContent>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="form-rhf-select-type" aria-invalid={fieldState.invalid}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INCOME">Income</SelectItem>
                        <SelectItem value="EXPENSE">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
            </FieldGroup>

            <FieldGroup>
              <Controller
                name="currency"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel htmlFor="form-rhf-currency">Currency</FieldLabel>
                    </FieldContent>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger
                        id="form-rhf-select-currency"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
            </FieldGroup>

            <FieldGroup>
              <Controller
                name="amount"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel htmlFor="form-rhf-amount">Amount</FieldLabel>
                    </FieldContent>
                    <InputGroup>
                      <InputGroupAddon align="inline-start">
                        <InputGroupText>
                          <DollarSign className="h-4 w-4" />
                        </InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        {...field}
                        id="form-rhf-input-amount"
                        aria-invalid={fieldState.invalid}
                        type="number"
                        step="0.01"
                        min="0"
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        placeholder="Enter amount"
                      />
                    </InputGroup>
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
            </FieldGroup>
          </Box>

          {/* Categories */}
          <FieldGroup>
            <Controller
              name="categoryIds"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldContent>
                    <FieldLabel>Categories</FieldLabel>
                  </FieldContent>
                  {isLoadingCategories ? (
                    <Box className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="ml-2 text-sm text-muted-foreground">
                        Loading categories...
                      </span>
                    </Box>
                  ) : (
                    <CategoryMultiSelect
                      categories={categories}
                      selectedIds={field.value || []}
                      onChange={field.onChange}
                      onCategoryCreated={handleCategoryCreated}
                      disabled={isCreating || isUpdating}
                    />
                  )}
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
          </FieldGroup>

          {/* Payee */}
          <FieldGroup>
            <Controller
              name="payee"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldContent>
                    <FieldLabel htmlFor="form-rhf-payee">
                      {transactionType === TransactionType.INCOME
                        ? 'From (Customer/Client)'
                        : 'To (Vendor/Supplier)'}
                    </FieldLabel>
                  </FieldContent>
                  <Input
                    {...field}
                    id="form-rhf-input-payee"
                    aria-invalid={fieldState.invalid}
                    placeholder={`Enter ${transactionType === TransactionType.INCOME ? 'customer' : 'vendor'} name`}
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
          </FieldGroup>

          {/* Description */}
          <FieldGroup>
            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldContent>
                    <FieldLabel htmlFor="form-rhf-description">Description</FieldLabel>
                  </FieldContent>
                  <Textarea
                    {...field}
                    id="form-rhf-textarea-description"
                    aria-invalid={fieldState.invalid}
                    value={field.value ?? ''}
                    placeholder="Enter transaction description..."
                    rows={3}
                    className="resize-none"
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
          </FieldGroup>

          <Box className="grid grid-cols-2 gap-4">
            <FieldGroup>
              <Controller
                name="date"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel htmlFor="form-rhf-date">Date</FieldLabel>
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
                name="status"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel htmlFor="form-rhf-status">Status</FieldLabel>
                    </FieldContent>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="form-rhf-select-status" aria-invalid={fieldState.invalid}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
            </FieldGroup>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box className="border-t p-6 flex gap-3 justify-end bg-gray-50 dark:bg-gray-900">
          {onClose ? (
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isCreating || isUpdating}
            >
              Cancel
            </Button>
          ) : null}
          <Button type="submit" disabled={isCreating || isUpdating}>
            {isCreating || isUpdating ? (
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

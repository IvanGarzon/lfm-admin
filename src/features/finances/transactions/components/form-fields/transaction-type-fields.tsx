import { Controller, type Control } from 'react-hook-form';
import { DollarSign } from 'lucide-react';

import { Box } from '@/components/ui/box';
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupText,
} from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TransactionFormInput } from '@/features/finances/transactions/types';

export function TransactionTypeFields({
  control,
  isDisabled,
}: {
  control: Control<TransactionFormInput>;
  isDisabled: boolean;
}) {
  return (
    <Box className="grid grid-cols-3 gap-4">
      <FieldGroup>
        <Controller
          name="type"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldContent>
                <FieldLabel htmlFor="form-rhf-type">Transaction Type</FieldLabel>
              </FieldContent>
              <Select onValueChange={field.onChange} value={field.value} disabled={isDisabled}>
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
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldContent>
                <FieldLabel htmlFor="form-rhf-currency">Currency</FieldLabel>
              </FieldContent>
              <Select onValueChange={field.onChange} value={field.value} disabled={isDisabled}>
                <SelectTrigger id="form-rhf-select-currency" aria-invalid={fieldState.invalid}>
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
          control={control}
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
                  disabled={isDisabled}
                />
              </InputGroup>
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
      </FieldGroup>
    </Box>
  );
}

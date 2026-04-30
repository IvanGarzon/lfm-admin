import { Controller, type Control } from 'react-hook-form';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

import { cn } from '@/lib/utils';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TransactionFormInput } from '@/features/finances/transactions/types';

export function TransactionDateStatusFields({
  control,
  isDisabled,
}: {
  control: Control<TransactionFormInput>;
  isDisabled: boolean;
}) {
  return (
    <Box className="grid grid-cols-2 gap-4">
      <FieldGroup>
        <Controller
          name="date"
          control={control}
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
                    disabled={isDisabled}
                  >
                    <CalendarIcon className="h-4 w-4" aria-hidden="true" />
                    {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
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
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldContent>
                <FieldLabel htmlFor="form-rhf-status">Status</FieldLabel>
              </FieldContent>
              <Select onValueChange={field.onChange} value={field.value} disabled={isDisabled}>
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
  );
}

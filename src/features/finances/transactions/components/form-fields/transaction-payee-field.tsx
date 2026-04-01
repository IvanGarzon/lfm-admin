import { Controller, type Control } from 'react-hook-form';

import { Field, FieldError } from '@/components/ui/field';
import { CustomerSelect } from '@/components/shared/customer-select';
import { VendorSelect } from '@/features/inventory/vendors/components/vendor-select';
import { TransactionTypeSchema } from '@/zod/schemas/enums/TransactionType.schema';
import type { TransactionFormInput } from '@/features/finances/transactions/types';
import type { CustomerSelectItem } from '@/features/crm/customers/types';
import type { VendorSelectItem } from '@/features/inventory/vendors/types';

export function TransactionPayeeField({
  control,
  isDisabled,
  transactionType,
  customers,
  vendors,
  isLoadingCustomers,
  isLoadingVendors,
  onVendorChange,
  onCustomerChange,
}: {
  control: Control<TransactionFormInput>;
  isDisabled: boolean;
  transactionType: string;
  customers: CustomerSelectItem[];
  vendors: VendorSelectItem[];
  isLoadingCustomers: boolean;
  isLoadingVendors: boolean;
  onVendorChange: (vendorId: string) => void;
  onCustomerChange: (customerId: string) => void;
}) {
  if (transactionType === TransactionTypeSchema.enum.EXPENSE) {
    return (
      <Controller
        name="vendorId"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <VendorSelect
              vendors={vendors}
              value={field.value ?? undefined}
              onValueChange={onVendorChange}
              placeholder="Select a vendor (optional)"
              label="Vendor (Optional)"
              isLoading={isLoadingVendors}
              disabled={isDisabled}
            />
            {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
          </Field>
        )}
      />
    );
  }

  return (
    <Controller
      name="customerId"
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <CustomerSelect
            customers={customers}
            value={field.value ?? undefined}
            onValueChange={onCustomerChange}
            placeholder="Select a customer"
            label="From (Customer/Client)"
            isLoading={isLoadingCustomers}
            disabled={isDisabled}
            showAddCustomerLink={false}
          />
          {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
        </Field>
      )}
    />
  );
}

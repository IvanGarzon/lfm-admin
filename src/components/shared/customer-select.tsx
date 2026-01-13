'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { UserAvatar } from '@/components/shared/user-avatar';
import { CreateCustomerDialog } from '@/features/customers/components/create-customer-dialog';

interface Customer {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  organization?: {
    id: string;
    name: string;
  } | null;
}

interface CustomerSelectProps {
  customers?: Partial<Customer>[];
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  isLoading?: boolean;
  label?: string;
  showAddCustomerLink?: boolean;
  isLocked?: boolean;
}

export function CustomerSelect({
  customers = [],
  value,
  onValueChange,
  disabled = false,
  placeholder = 'Select a customer',
  isLoading = false,
  label = 'Bill to',
  showAddCustomerLink = true,
  isLocked = false,
}: CustomerSelectProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === value),
    [customers, value],
  );

  const getCustomerDisplayName = useMemo(() => {
    return (customer: Partial<Customer>) => {
      const fullName = `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim();
      return fullName ?? customer.email ?? '';
    };
  }, []);

  const getCustomerSecondaryText = useMemo(() => {
    return (customer: Partial<Customer>) => {
      if (customer.organization?.name) {
        return `${customer.organization.name} • ${customer.email ?? ''}`;
      }
      return customer.email ?? '';
    };
  }, []);

  const handleCustomerCreated = useCallback(
    (customerId: string) => {
      onValueChange?.(customerId);
    },
    [onValueChange],
  );

  return (
    <>
      <Box className="space-y-2">
        {/* Header with label and add customer link */}
        <Box className="flex items-center justify-between">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
          {showAddCustomerLink && !isLocked ? (
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="text-sm text-primary hover:underline focus:outline-none cursor-pointer"
              tabIndex={-1}
            >
              Add customer
            </button>
          ) : null}
        </Box>

        {/* Customer Select Popover */}
        <Popover open={open} onOpenChange={setOpen} modal={true}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between h-auto py-2 text-left"
              disabled={disabled || isLoading}
            >
              {selectedCustomer ? (
                <Box className="flex items-center gap-3 flex-1 min-w-0 text-left">
                  <UserAvatar
                    className="h-8 w-8 shrink-0"
                    user={{
                      name: getCustomerDisplayName(selectedCustomer),
                      image: null,
                    }}
                  />
                  <Box className="flex flex-col items-start min-w-0 flex-1">
                    <span className="font-medium text-sm truncate w-full text-left">
                      {getCustomerDisplayName(selectedCustomer)}
                    </span>
                    <span className="text-xs text-muted-foreground truncate w-full text-left">
                      {getCustomerSecondaryText(selectedCustomer)}
                    </span>
                  </Box>
                </Box>
              ) : (
                <span className="text-muted-foreground text-left">
                  {isLoading ? 'Loading customers...' : placeholder}
                </span>
              )}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="p-0"
            align="start"
            sideOffset={4}
            style={{ width: 'var(--radix-popover-trigger-width)' }}
          >
            <Command>
              <CommandInput placeholder="Search customers..." />
              <CommandList className="max-h-[300px] overflow-y-auto">
                <CommandEmpty>No customer found.</CommandEmpty>
                <CommandGroup>
                  {customers.map((customer) => (
                    <CommandItem
                      key={customer.id}
                      value={`${customer.firstName} ${customer.lastName} ${customer.email} ${customer.organization?.name ?? ''}`}
                      onSelect={() => {
                        if (customer.id !== undefined) {
                          onValueChange?.(customer.id);
                        }
                        setOpen(false);
                      }}
                      className="flex items-center gap-3 py-3"
                    >
                      <UserAvatar
                        className="h-8 w-8 shrink-0"
                        user={{
                          name: getCustomerDisplayName(customer),
                          image: null,
                        }}
                      />
                      <Box className="flex flex-col items-start min-w-0 flex-1">
                        <span className="font-medium text-sm truncate w-full">
                          {getCustomerDisplayName(customer)}
                        </span>
                        <span className="text-xs text-muted-foreground truncate w-full">
                          {getCustomerSecondaryText(customer)}
                        </span>
                      </Box>
                      <Check
                        className={cn(
                          'ml-auto h-4 w-4 shrink-0',
                          value === customer.id ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </Box>

      {/* Create Customer Dialog */}
      <CreateCustomerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreate={handleCustomerCreated}
      />
    </>
  );
}

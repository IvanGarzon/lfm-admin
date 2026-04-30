'use client';

import { useId, useMemo, useState } from 'react';
import { Check, ChevronDown, Store } from 'lucide-react';

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
import type { VendorSelectItem } from '@/features/inventory/vendors/types';

const EMPTY_VENDORS: VendorSelectItem[] = [];

interface VendorSelectProps {
  vendors?: VendorSelectItem[];
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  isLoading?: boolean;
  label?: string;
}

export function VendorSelect({
  vendors = EMPTY_VENDORS,
  value,
  onValueChange,
  disabled = false,
  placeholder = 'Select a vendor',
  isLoading = false,
  label = 'Vendor',
}: VendorSelectProps) {
  const [open, setOpen] = useState<boolean>(false);
  const listboxId = useId();

  const selectedVendor = useMemo(
    () => vendors.find((vendor) => vendor.id === value),
    [vendors, value],
  );

  return (
    <Box className="space-y-2">
      <Box className="flex items-center justify-between">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      </Box>

      <Popover open={open} onOpenChange={setOpen} modal={true}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            className="w-full justify-between h-auto py-2 text-left"
            disabled={disabled || isLoading}
          >
            {selectedVendor ? (
              <Box className="flex items-center gap-3 flex-1 min-w-0 text-left">
                <Box className="h-8 w-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                  <Store className="h-4 w-4 text-primary" aria-hidden="true" />
                </Box>
                <Box className="flex flex-col items-start min-w-0 flex-1">
                  <span className="font-medium text-sm truncate w-full text-left">
                    {selectedVendor.name}
                  </span>
                  <span className="text-xs text-muted-foreground truncate w-full text-left font-mono">
                    {selectedVendor.vendorCode}
                  </span>
                </Box>
              </Box>
            ) : (
              <span className="text-muted-foreground text-left">
                {isLoading ? 'Loading vendors...' : placeholder}
              </span>
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0"
          align="start"
          sideOffset={4}
          style={{ width: 'var(--radix-popover-trigger-width)' }}
        >
          <Command id={listboxId}>
            <CommandInput placeholder="Search vendors..." />
            <CommandList className="max-h-[300px] overflow-y-auto">
              <CommandEmpty>No vendor found.</CommandEmpty>
              <CommandGroup>
                {vendors.map((vendor) => (
                  <CommandItem
                    key={vendor.id}
                    value={`${vendor.name} ${vendor.vendorCode}`}
                    onSelect={() => {
                      onValueChange?.(vendor.id);
                      setOpen(false);
                    }}
                    className="flex items-center gap-3 py-3"
                  >
                    <Box className="h-8 w-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                      <Store className="h-4 w-4 text-primary" aria-hidden="true" />
                    </Box>
                    <Box className="flex flex-col items-start min-w-0 flex-1">
                      <span className="font-medium text-sm truncate w-full">{vendor.name}</span>
                      <span className="text-xs text-muted-foreground truncate w-full font-mono">
                        {vendor.vendorCode}
                      </span>
                    </Box>
                    <Check
                      className={cn(
                        'ml-auto h-4 w-4 shrink-0',
                        value === vendor.id ? 'opacity-100' : 'opacity-0',
                      )}
                      aria-hidden="true"
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </Box>
  );
}

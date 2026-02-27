'use client';

import React, { useCallback, useId, useMemo, useState } from 'react';
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
import { useActiveVendors } from '@/features/inventory/vendors/hooks/use-vendor-queries';

export interface Vendor {
  id: string;
  vendorCode: string;
  name: string;
}

interface VendorSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  isLoading?: boolean;
  label?: string;
  showAddVendorLink?: boolean;
}

export function VendorSelect({
  value,
  onValueChange,
  disabled = false,
  placeholder = 'Select a vendor',
  isLoading: isLoadingProp = false,
  label = 'Vendor',
  showAddVendorLink = false,
}: VendorSelectProps) {
  const [open, setOpen] = useState<boolean>(false);
  const listboxId = useId();
  const { data: vendors = [], isLoading: isLoadingVendors } = useActiveVendors();

  const isLoading = isLoadingProp || isLoadingVendors;

  const selectedVendor = useMemo(
    () => vendors.find((vendor) => vendor.id === value),
    [vendors, value],
  );

  const getVendorDisplayName = useMemo(() => {
    return (vendor: Vendor) => {
      return vendor.name ?? '';
    };
  }, []);

  const getVendorSecondaryText = useMemo(() => {
    return (vendor: Vendor) => {
      return vendor.vendorCode;
    };
  }, []);

  const handleVendorCreated = useCallback(
    (vendorId: string) => {
      onValueChange?.(vendorId);
    },
    [onValueChange],
  );

  return (
    <Box className="space-y-2">
      {/* Header with label and add vendor link */}
      <Box className="flex items-center justify-between">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
        {showAddVendorLink ? (
          <button
            type="button"
            onClick={() => {
              // TODO: Implement create vendor dialog
              console.log('Add vendor clicked');
            }}
            className="text-sm text-primary hover:underline focus:outline-none cursor-pointer"
            tabIndex={-1}
          >
            Add vendor
          </button>
        ) : null}
      </Box>

      {/* Vendor Select Popover */}
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
                  <Store className="h-4 w-4 text-primary" />
                </Box>
                <Box className="flex flex-col items-start min-w-0 flex-1">
                  <span className="font-medium text-sm truncate w-full text-left">
                    {getVendorDisplayName(selectedVendor)}
                  </span>
                  <span className="text-xs text-muted-foreground truncate w-full text-left font-mono">
                    {getVendorSecondaryText(selectedVendor)}
                  </span>
                </Box>
              </Box>
            ) : (
              <span className="text-muted-foreground text-left">
                {isLoading ? 'Loading vendors...' : placeholder}
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
                      <Store className="h-4 w-4 text-primary" />
                    </Box>
                    <Box className="flex flex-col items-start min-w-0 flex-1">
                      <span className="font-medium text-sm truncate w-full">
                        {getVendorDisplayName(vendor)}
                      </span>
                      <span className="text-xs text-muted-foreground truncate w-full font-mono">
                        {getVendorSecondaryText(vendor)}
                      </span>
                    </Box>
                    <Check
                      className={cn(
                        'ml-auto h-4 w-4 shrink-0',
                        value === vendor.id ? 'opacity-100' : 'opacity-0',
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
  );
}

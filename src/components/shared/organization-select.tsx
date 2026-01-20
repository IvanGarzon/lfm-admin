'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Check, ChevronDown, Building2 } from 'lucide-react';

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
import { CreateOrganizationDialog } from '@/features/organizations/components/create-organization-dialog';

export interface Organization {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postcode?: string | null;
  country?: string | null;
}

interface OrganizationSelectProps {
  organizations?: Partial<Organization>[];
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  isLoading?: boolean;
  label?: string;
  showAddOrganizationLink?: boolean;
}

export function OrganizationSelect({
  organizations = [],
  value,
  onValueChange,
  disabled = false,
  placeholder = 'Select an organization',
  isLoading = false,
  label = 'Organization',
  showAddOrganizationLink = true,
}: OrganizationSelectProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

  const selectedOrganization = useMemo(
    () => organizations.find((org) => org.id === value),
    [organizations, value],
  );

  const getOrganizationDisplayName = useMemo(() => {
    return (org: Partial<Organization>) => {
      return org.name ?? '';
    };
  }, []);

  const getOrganizationSecondaryText = useMemo(() => {
    return (org: Partial<Organization>) => {
      const parts = [org.city, org.state].filter(Boolean);
      return parts.length > 0 ? parts.join(', ') : 'No location specified';
    };
  }, []);

  const handleOrganizationCreated = useCallback(
    (organizationId: string, organizationName: string) => {
      onValueChange?.(organizationId);
    },
    [onValueChange],
  );

  return (
    <>
      <Box className="space-y-2">
        {/* Header with label and add organization link */}
        <Box className="flex items-center justify-between">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
          {showAddOrganizationLink ? (
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="text-sm text-primary hover:underline focus:outline-none cursor-pointer"
              tabIndex={-1}
            >
              Add organization
            </button>
          ) : null}
        </Box>

        {/* Organization Select Popover */}
        <Popover open={open} onOpenChange={setOpen} modal={true}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between h-auto py-2 text-left"
              disabled={disabled || isLoading}
            >
              {selectedOrganization ? (
                <Box className="flex items-center gap-3 flex-1 min-w-0 text-left">
                  <Box className="h-8 w-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-primary" />
                  </Box>
                  <Box className="flex flex-col items-start min-w-0 flex-1">
                    <span className="font-medium text-sm truncate w-full text-left">
                      {getOrganizationDisplayName(selectedOrganization)}
                    </span>
                    <span className="text-xs text-muted-foreground truncate w-full text-left">
                      {getOrganizationSecondaryText(selectedOrganization)}
                    </span>
                  </Box>
                </Box>
              ) : (
                <span className="text-muted-foreground text-left">
                  {isLoading ? 'Loading organizations...' : placeholder}
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
              <CommandInput placeholder="Search organizations..." />
              <CommandList className="max-h-[300px] overflow-y-auto">
                <CommandEmpty>No organization found.</CommandEmpty>
                <CommandGroup>
                  {organizations.map((org) => (
                    <CommandItem
                      key={org.id}
                      value={`${org.name} ${org.city ?? ''} ${org.state ?? ''}`}
                      onSelect={() => {
                        if (org.id !== undefined) {
                          onValueChange?.(org.id);
                        }
                        setOpen(false);
                      }}
                      className="flex items-center gap-3 py-3"
                    >
                      <Box className="h-8 w-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-primary" />
                      </Box>
                      <Box className="flex flex-col items-start min-w-0 flex-1">
                        <span className="font-medium text-sm truncate w-full">
                          {getOrganizationDisplayName(org)}
                        </span>
                        <span className="text-xs text-muted-foreground truncate w-full">
                          {getOrganizationSecondaryText(org)}
                        </span>
                      </Box>
                      <Check
                        className={cn(
                          'ml-auto h-4 w-4 shrink-0',
                          value === org.id ? 'opacity-100' : 'opacity-0',
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

      {/* Create Organization Dialog */}
      <CreateOrganizationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleOrganizationCreated}
      />
    </>
  );
}

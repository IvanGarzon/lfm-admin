'use client';

import type { Table } from '@tanstack/react-table';
import { Settings2 } from 'lucide-react';

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
import { cn } from '@/lib/utils';
import * as React from 'react';
import { CheckIcon, CaretSortIcon } from '@radix-ui/react-icons';

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>;
}

export function DataTableViewOptions<TData>({ table }: DataTableViewOptionsProps<TData>) {
  const listboxId = React.useId();
  const [open, setOpen] = React.useState(false);
  const columns = React.useMemo(
    () =>
      table
        .getAllColumns()
        .filter((column) => typeof column.accessorFn !== 'undefined' && column.getCanHide()),
    [table],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          aria-label="Toggle columns"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          variant="outline"
          className="ml-auto hidden py-0 px-2 lg:flex"
        >
          <Settings2 className="mr-2 h-4 w-4" />
          View
          <CaretSortIcon className="ml-auto opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-44 p-0">
        <Command id={listboxId}>
          <CommandInput placeholder="Search columns..." />
          <CommandList>
            <CommandEmpty>No columns found.</CommandEmpty>
            <CommandGroup>
              {columns.map((column) => (
                <CommandItem
                  key={column.id}
                  onSelect={() => column.toggleVisibility(!column.getIsVisible())}
                >
                  <span className="truncate">{column.columnDef.meta?.label ?? column.id}</span>
                  <CheckIcon
                    className={cn(
                      'ml-auto size-4 shrink-0',
                      column.getIsVisible() ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

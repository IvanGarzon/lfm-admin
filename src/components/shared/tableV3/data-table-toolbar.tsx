'use client';

import { ComponentProps, useMemo, useCallback } from 'react';
import type { Column, Table } from '@tanstack/react-table';
import { useRouter } from 'next/navigation';
import { DataTableDateFilter } from '@/components/shared/tableV3/data-table-date-filter';
import { DataTableFacetedFilter } from '@/components/shared/tableV3/data-table-faceted-filter';
import { DataTableSliderFilter } from '@/components/shared/tableV3/data-table-slider-filter';
import { DataTableViewOptions } from '@/components/shared/tableV3/data-table-view-options';
import { Button } from '@/components/ui/button';
import { Box } from '@/components/ui/box';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface DataTableToolbarProps<TData> extends ComponentProps<'div'> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
  children,
  className,
  ...props
}: DataTableToolbarProps<TData>) {
  const router = useRouter();
  const isFiltered = table.getState().columnFilters.length > 0;

  const columns = useMemo(
    () => table.getAllColumns().filter((column) => column.getCanFilter()),
    [table],
  );

  const onReset = useCallback(() => {
    // Clear filters from table state
    table.resetColumnFilters();

    // Immediately clear URL params without debounce
    const url = new URL(window.location.href);
    const filterableColumnIds = columns.map((col) => col.id).filter(Boolean);

    // Remove all filter params from URL
    filterableColumnIds.forEach((id) => {
      url.searchParams.delete(id);
    });

    // Reset to page 1
    url.searchParams.set('page', '1');

    // Navigate immediately
    router.replace(url.pathname + url.search);
  }, [table, columns, router]);

  return (
    <Box
      role="toolbar"
      aria-orientation="horizontal"
      className={cn('flex flex-wrap items-center w-full justify-between gap-2 p-1', className)}
      {...props}
    >
      <Box className="flex flex-1 flex-wrap items-center gap-2">
        {columns.map((column) => (
          <DataTableToolbarFilter key={column.id} column={column} />
        ))}
        {isFiltered ? (
          <Button
            aria-label="Reset filters"
            variant="outline"
            className="border-dashed py-0 px-2"
            onClick={onReset}
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        ) : null}
      </Box>
      <Box className="flex items-center gap-2">
        {children}
        <DataTableViewOptions table={table} />
      </Box>
    </Box>
  );
}

interface DataTableToolbarFilterProps<TData> {
  column: Column<TData>;
}

function DataTableToolbarFilter<TData>({ column }: DataTableToolbarFilterProps<TData>) {
  {
    const columnMeta = column.columnDef.meta;

    const onFilterRender = useCallback(() => {
      if (!columnMeta?.variant) {
        return null;
      }

      switch (columnMeta.variant) {
        case 'text':
          return (
            <Input
              type="search"
              placeholder={columnMeta.placeholder ?? columnMeta.label}
              value={(column.getFilterValue() as string) ?? ''}
              onChange={(event) => column.setFilterValue(event.target.value)}
              className="w-full md:max-w-sm"
            />
          );

        case 'number':
          return (
            <div className="relative">
              <Input
                type="number"
                inputMode="numeric"
                placeholder={columnMeta.placeholder ?? columnMeta.label}
                value={(column.getFilterValue() as string) ?? ''}
                onChange={(event) => column.setFilterValue(event.target.value)}
                className={cn('h-8 w-[120px]', columnMeta.unit && 'pr-8')}
              />
              {columnMeta.unit ? (
                <span className="absolute top-0 right-0 bottom-0 flex items-center rounded-r-md bg-accent px-2 text-muted-foreground text-sm">
                  {columnMeta.unit}
                </span>
              ) : null}
            </div>
          );

        case 'range':
          return <DataTableSliderFilter column={column} title={columnMeta.label ?? column.id} />;

        case 'date':
        case 'dateRange':
          return (
            <DataTableDateFilter
              column={column}
              title={columnMeta.label ?? column.id}
              multiple={columnMeta.variant === 'dateRange'}
            />
          );

        case 'select':
        case 'multiSelect':
          return (
            <DataTableFacetedFilter
              column={column}
              title={columnMeta.label ?? column.id}
              options={columnMeta.options ?? []}
              multiple={columnMeta.variant === 'multiSelect'}
            />
          );

        default:
          return null;
      }
    }, [column, columnMeta]);

    return onFilterRender();
  }
}

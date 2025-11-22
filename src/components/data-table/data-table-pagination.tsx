import { Table } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Box } from '@/components/ui/box';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface DataTablePaginationProps<TData> extends React.ComponentProps<'div'> {
  table: Table<TData>;
  totalItems: number;
  pageSizeOptions?: number[];
}

export function DataTablePagination<TData>({
  table,
  totalItems,
  pageSizeOptions = [10, 20, 30, 40, 50],
  className,
  ...props
}: DataTablePaginationProps<TData>) {
  const paginationButtons = [
    {
      icon: ChevronsLeft,
      onClick: () => table.setPageIndex(0),
      disabled: !table.getCanPreviousPage(),
      srText: 'First page',
      mobileView: '',
    },
    {
      icon: ChevronLeft,
      onClick: () => table.previousPage(),
      disabled: !table.getCanPreviousPage(),
      srText: 'Previous page',
      mobileView: '',
    },
    {
      icon: ChevronRight,
      onClick: () => table.nextPage(),
      disabled: !table.getCanNextPage(),
      srText: 'Next page',
      mobileView: '',
    },
    {
      icon: ChevronsRight,
      onClick: () => table.setPageIndex(table.getPageCount() - 1),
      disabled: !table.getCanNextPage(),
      srText: 'Last page',
      mobileView: '',
    },
  ];

  return (
    <Box className="flex w-full items-center justify-between">
      <Box className="flex items-center gap-x-6 lg:gap-x-8">
        <Box className="text-sm tabular-nums text-gray-500 sm:block">
          Showing{' '}
          <span className="font-medium text-gray-900 dark:text-gray-50">
            {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              totalItems,
            )}
          </span>{' '}
          of <span className="font-medium text-gray-900 dark:text-gray-50">{totalItems}</span>
        </Box>
      </Box>

      <Box className="hidden sm:flex flex-col items-center gap-4 sm:flex-row sm:gap-6 lg:gap-8">
        <Box className="flex items-center space-x-2">
          <p className="whitespace-nowrap text-sm">Size</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Box>
      </Box>

      <Box className="flex items-center justify-between gap-2 sm:justify-end">
        <Box className="hidden sm:flex w-[150px] items-center justify-center">
          <Box className="text-sm tabular-nums text-gray-500 sm:block">
            {totalItems > 0 ? (
              <>
                Page{' '}
                <span className="font-medium text-gray-900 dark:text-gray-50">
                  {table.getState().pagination.pageIndex + 1}{' '}
                </span>
                of{' '}
                <span className="font-medium text-gray-900 dark:text-gray-50">
                  {table.getPageCount()}
                </span>
              </>
            ) : (
              'No pages'
            )}
          </Box>
        </Box>
        <Box className="flex items-center gap-x-1">
          {paginationButtons.map((button, index) => (
            <Button
              key={index}
              aria-label={button.srText}
              variant="outline"
              className={cn(button.mobileView, 'h-8 w-8 p-1.5')}
              onClick={() => {
                button.onClick();
                table.resetRowSelection();
              }}
              disabled={button.disabled}
            >
              <span className="sr-only">{button.srText}</span>
              <button.icon className="size-4 shrink-0" aria-hidden="true" />
            </Button>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

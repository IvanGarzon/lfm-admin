'use client';

import React from 'react';
import { type Table as TanstackTable, flexRender } from '@tanstack/react-table';
import { motion, AnimatePresence } from 'framer-motion';
import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getCommonPinningStyles } from '@/lib/data-table';
import { cn } from '@/lib/utils';
import { Box } from '@/components/ui/box';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface DataTableProps<TData> extends React.ComponentProps<'div'> {
  table: TanstackTable<TData>;
  totalItems: number;
  children?: React.ReactNode;
  className?: string;
  actionBar?: React.ReactNode;
}

export function DataTable<TData>({
  table,
  totalItems,
  actionBar,
  children,
  className,
  ...props
}: DataTableProps<TData>) {
  return (
    <Box
      className={cn('max-h-[80vh] flex w-full flex-col space-y-4 overflow-hidden', className)}
      {...props}
    >
      {children}
      <ScrollArea className="flex-1 min-h-[100px] max-h-[80vh] rounded-md border overflow-auto">
        <motion.div layout transition={{ duration: 0.3, ease: 'easeInOut' }} className="relative">
          <Box className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-background">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    className="*:whitespace-nowrap sticky top-0 bg-background after:content-[''] after:inset-x-0 after:h-px after:bg-border after:absolute after:bottom-0"
                  >
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        colSpan={header.colSpan}
                        className={cn(
                          'whitespace-nowrap py-1',
                          header.column.columnDef.meta?.className,
                        )}
                        style={{
                          ...getCommonPinningStyles({ column: header.column }),
                        }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                <AnimatePresence initial={false}>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row, rowIndex) => (
                      // <TableRow
                      //   key={row.id}
                      //   data-state={row.getIsSelected() && 'selected'}
                      //   className="group hover:bg-gray-50 hover:dark:bg-gray-900"
                      // >
                      <motion.tr
                        key={row.id}
                        layout
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{
                          duration: 0.25,
                          ease: 'easeOut',
                          delay: rowIndex * 0.03,
                        }}
                        className="group hover:bg-gray-50 hover:dark:bg-gray-900"
                        data-state={row.getIsSelected() && 'selected'}
                        style={{ transform: 'translateZ(0)' }}
                      >
                        {row.getVisibleCells().map((cell, index) => (
                          <TableCell
                            key={cell.id}
                            className={cn(
                              row.getIsSelected() ? 'bg-gray-50 dark:bg-gray-900' : '',
                              'relative whitespace-nowrap py-2 text-gray-700 first:w-10 dark:text-gray-300',
                              cell.column.columnDef.meta?.className,
                            )}
                            style={{
                              ...getCommonPinningStyles({
                                column: cell.column,
                              }),
                            }}
                          >
                            {index === 0 && row.getIsSelected() && (
                              <div className="absolute inset-y-0 left-0 w-0.5 bg-primary dark:bg-primary" />
                            )}
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </motion.tr>
                      // </TableRow>
                    ))
                  ) : (
                    // <TableRow>
                    <motion.tr
                      layout
                      key="no-results"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <TableCell
                        colSpan={table.getAllColumns().length}
                        className="h-24 text-center"
                      >
                        No results.
                      </TableCell>
                    </motion.tr>
                    // </TableRow>
                  )}
                </AnimatePresence>
              </TableBody>
            </Table>
          </Box>
          <ScrollBar orientation="horizontal" />
        </motion.div>
      </ScrollArea>
      <Box className="flex flex-col gap-2.5">
        <DataTablePagination table={table} totalItems={totalItems} />
        {actionBar && table.getFilteredSelectedRowModel().rows.length > 0 && actionBar}
      </Box>
    </Box>
  );
}

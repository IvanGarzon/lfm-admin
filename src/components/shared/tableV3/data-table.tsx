import { motion, AnimatePresence } from 'framer-motion';
import { type Table as TanstackTable, flexRender } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { Box } from '@/components/ui/box';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DataTablePagination } from '@/components/shared/tableV3/data-table-pagination';

interface DataTableProps<TData> extends React.ComponentProps<'div'> {
  table: TanstackTable<TData>;
  totalItems: number;
  children?: React.ReactNode;
  className?: string;
  actionBar?: React.ReactNode;
}

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function DataTable<TData>({
  table,
  totalItems,
  actionBar,
  children,
  className,
  ...props
}: DataTableProps<TData>) {
  return (
    <Box className={cn('flex w-full flex-col space-y-4', className)} {...props}>
      {children}
      <Box className="relative w-full rounded-md border">
        <Box className="max-h-[60vh] overflow-auto w-full">
          <Table containerless>
            <TableHeader className="sticky top-0 z-10 bg-background">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-b bg-background">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={cn(
                        'whitespace-nowrap bg-background',
                        header.column.columnDef.meta?.className,
                      )}
                      // style={{
                      //   ...getCommonPinningStyles({ column: header.column }),
                      // }}
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
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className="group hover:bg-gray-50 hover:dark:bg-gray-900 cursor-pointer"
                  >
                    {row.getVisibleCells().map((cell, index) => (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          row.getIsSelected() ? 'bg-gray-50 dark:bg-gray-900' : '',
                          'relative whitespace-nowrap py-2 text-gray-700 first:w-10 dark:text-gray-300',
                          cell.column.columnDef.meta?.className,
                        )}
                        // style={{
                        //   ...getCommonPinningStyles({
                        //     column: cell.column,
                        //   }),
                        // }}
                      >
                        {index === 0 && row.getIsSelected() && (
                          <div className="absolute inset-y-0 left-0 w-0.5 bg-primary dark:bg-primary" />
                        )}
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={table.getAllColumns().length} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </Box>
      <Box className="flex flex-col gap-2.5">
        <DataTablePagination table={table} totalItems={totalItems} />
        {actionBar && table.getFilteredSelectedRowModel().rows.length > 0 && actionBar}
      </Box>
    </Box>
  );
}

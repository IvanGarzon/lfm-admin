'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { Box } from '@/components/ui/box';
import { DataTableColumnHeader } from '@/components/shared/tableV3/data-table-column-header';
import { Checkbox } from '@/components/ui/checkbox';
import type { RecipeListItem } from '@/features/finances/recipes/types';
import { RecipeActions } from '@/features/finances/recipes/components/recipe-actions';

export const createRecipeColumns = (
  onDelete: (id: string, name: string) => void,
  onEdit: (id: string) => void,
  onView: (id: string) => void,
): ColumnDef<RecipeListItem>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => (
      <Box
        className="font-medium cursor-pointer hover:underline"
        onClick={() => onView(row.original.id)}
      >
        {row.original.name}
      </Box>
    ),
  },
  {
    accessorKey: 'totalMaterialsCost',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Materials" />,
    cell: ({ row }) => formatCurrency({ number: row.original.totalMaterialsCost }),
  },
  {
    accessorKey: 'laborCost',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Labor" />,
    cell: ({ row }) => formatCurrency({ number: row.original.laborCost }),
  },
  {
    accessorKey: 'totalCost',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Total Cost" />,
    cell: ({ row }) => (
      <Box className="font-semibold text-primary">
        {formatCurrency({ number: row.original.totalCost })}
      </Box>
    ),
  },
  {
    accessorKey: 'totalRetailPrice',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Retail Total" />,
    cell: ({ row }) => (
      <Box className="font-semibold text-blue-600">
        {formatCurrency({ number: row.original.totalRetailPrice })}
      </Box>
    ),
  },
  {
    accessorKey: 'updatedAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Updated" />,
    cell: ({ row }) => format(row.original.updatedAt, 'MMM dd, yyyy'),
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <RecipeActions recipe={row.original} onDelete={onDelete} onEdit={onEdit} onView={onView} />
    ),
    enableHiding: false,
    meta: {
      className: 'text-right',
    },
  },
];

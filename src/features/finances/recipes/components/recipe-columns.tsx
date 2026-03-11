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
        onClick={() => onEdit(row.original.id)}
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
    cell: ({ row }) => formatCurrency({ number: row.original.labourCost }),
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
    id: 'sellingPrice',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Selling Price" />,
    cell: ({ row }) => {
      const recipe = row.original;
      let sellingPrice = recipe.totalRetailPrice + recipe.labourCost;

      // Apply rounding if enabled
      if (recipe.roundPrice && sellingPrice > 0) {
        const roundingMethod = recipe.roundingMethod ?? 'NEAREST';
        if (roundingMethod === 'NEAREST') {
          sellingPrice = Math.round(sellingPrice);
        } else if (roundingMethod === 'PSYCHOLOGICAL_99') {
          sellingPrice = Math.ceil(sellingPrice) - 0.01;
        } else if (roundingMethod === 'PSYCHOLOGICAL_95') {
          sellingPrice = Math.ceil(sellingPrice) - 0.05;
        }
      }

      return (
        <Box className="text-teal-600 dark:text-teal-400 font-semibold">
          {formatCurrency({ number: sellingPrice })}
        </Box>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: 'updatedAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Updated" />,
    cell: ({ row }) => format(row.original.updatedAt, 'MMM dd, yyyy'),
  },
  {
    id: 'actions',
    cell: ({ row }) => <RecipeActions recipe={row.original} onDelete={onDelete} onEdit={onEdit} />,
    enableHiding: false,
    meta: {
      className: 'text-right',
    },
  },
];

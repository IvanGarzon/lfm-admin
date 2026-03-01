'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import Link from 'next/link';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  History,
  ImageIcon,
  TrendingUp,
  TrendingDown,
  Minus,
  Flower2,
  Leaf,
  Package,
  Wrench,
  CircleDot,
} from 'lucide-react';

import { formatCurrency } from '@/lib/utils';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTableColumnHeader } from '@/components/shared/tableV3/data-table-column-header';
import { PriceListCategoryBadge } from '@/features/inventory/price-list/components/price-list-category-badge';
import type { PriceListItemListItem } from '@/features/inventory/price-list/types';

// Category options for filtering
const categoryOptions = [
  { label: 'Floral', value: 'FLORAL', icon: Flower2 },
  { label: 'Foliage', value: 'FOLIAGE', icon: Leaf },
  { label: 'Sundry', value: 'SUNDRY', icon: Package },
  { label: 'Supply', value: 'SUPPLY', icon: Wrench },
  { label: 'Other', value: 'OTHER', icon: CircleDot },
];

interface CreatePriceListColumnsOptions {
  onDelete: (id: string, name: string) => void;
  onViewCostHistory: (id: string, name: string) => void;
}

export function createPriceListColumns({
  onDelete,
  onViewCostHistory,
}: CreatePriceListColumnsOptions): ColumnDef<PriceListItemListItem>[] {
  return [
    // Selection column
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
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

    // Name column (searchable)
    {
      id: 'search',
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <Box className="flex items-center gap-2">
            {item.imageUrl ? (
              <Box className="h-5 w-5 text-green-500 flex-shrink-0">
                <ImageIcon className="h-4 w-4" />
              </Box>
            ) : null}
            <Link
              href={`/inventory/price-list/${item.id}`}
              className="font-medium text-primary hover:underline"
            >
              {item.name}
            </Link>
          </Box>
        );
      },
      enableSorting: true,
      enableColumnFilter: true,
      meta: {
        label: 'Name',
        placeholder: 'Search items...',
        variant: 'text',
      },
    },

    // Category column (filterable)
    {
      id: 'category',
      accessorKey: 'category',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
      cell: ({ row }) => <PriceListCategoryBadge category={row.getValue('category')} />,
      filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
      enableColumnFilter: true,
      meta: {
        label: 'Category',
        variant: 'multiSelect',
        options: categoryOptions,
      },
    },

    // Cost per unit column
    {
      id: 'costPerUnit',
      accessorKey: 'costPerUnit',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Cost/Unit" />,
      cell: ({ row }) => {
        const cost = row.original.costPerUnit ?? 0;
        return <Box className="font-medium">{formatCurrency({ number: cost })}</Box>;
      },
      enableSorting: true,
    },

    // Cost change column
    {
      id: 'costChange',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Cost Change" />,
      cell: ({ row }) => {
        const lastCostChange = row.original.lastCostChange;

        if (!lastCostChange) {
          return (
            <Box className="flex items-center gap-1.5 text-muted-foreground">
              <Minus className="h-4 w-4" />
              <span className="text-sm">No change</span>
            </Box>
          );
        }

        const isIncrease = lastCostChange.trend === 'up';
        const percentChange = Math.abs(
          ((lastCostChange.newCost - lastCostChange.previousCost) / lastCostChange.previousCost) *
            100,
        ).toFixed(1);

        return (
          <Box
            className={`flex items-center gap-1.5 ${isIncrease ? 'text-red-600' : 'text-green-600'}`}
          >
            {isIncrease ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <span className="text-sm font-medium">{percentChange}%</span>
          </Box>
        );
      },
      enableSorting: false,
    },

    // Unit type column
    {
      id: 'unitType',
      accessorKey: 'unitType',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Unit Type" />,
      cell: ({ row }) => {
        const unitType = row.original.unitType;
        return (
          <Box className="text-muted-foreground">
            {unitType ? unitType.charAt(0).toUpperCase() + unitType.slice(1) : '—'}
          </Box>
        );
      },
      enableSorting: true,
    },

    // Season column
    {
      id: 'season',
      accessorKey: 'season',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Season" />,
      cell: ({ row }) => {
        const season = row.original.season;
        return (
          <Box className="text-muted-foreground">
            {season ? season.charAt(0).toUpperCase() + season.slice(1) : '—'}
          </Box>
        );
      },
      enableSorting: true,
    },

    // Multiplier column
    {
      id: 'multiplier',
      accessorKey: 'multiplier',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Multiplier" />,
      cell: ({ row }) => {
        const multiplier = row.original.multiplier;
        return <Box className="font-mono text-sm">{multiplier}x</Box>;
      },
      enableSorting: true,
    },

    // Actions column
    {
      id: 'actions',
      cell: ({ row }) => {
        const item = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href={`/inventory/price-list/${item.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/inventory/price-list/${item.id}`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onViewCostHistory(item.id, item.name)}>
                <History className="mr-2 h-4 w-4" />
                Cost History
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(item.id, item.name)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableHiding: false,
    },
  ];
}

'use client';

import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { ImageIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Box } from '@/components/ui/box';
import { DataTableColumnHeader } from '@/components/shared/tableV3/data-table-column-header';
import { PriceListCategoryBadge } from '@/features/inventory/price-list/components/price-list-category-badge';
import type { PriceListItemListItem } from '@/features/inventory/price-list/types';
import { PriceListActions } from '@/features/inventory/price-list/components/price-list-actions';
import { usePriceListHref } from '@/features/inventory/price-list/hooks/use-price-list-href';
import {
  PRICE_LIST_CATEGORY_LABELS,
  PRICE_LIST_CATEGORY_ICONS,
  PRICE_LIST_CATEGORIES,
} from '@/features/inventory/price-list/constants/categories';

const categoryOptions = PRICE_LIST_CATEGORIES.map((value) => ({
  label: PRICE_LIST_CATEGORY_LABELS[value],
  value,
  icon: PRICE_LIST_CATEGORY_ICONS[value],
}));

interface CreatePriceListColumnsOptions {
  onDelete: (id: string, name: string) => void;
  onViewCostHistory: (id: string, name: string) => void;
}

function PriceListLink({ id, name }: { id: string; name: string }) {
  const href = usePriceListHref(id);

  return (
    <Link href={href} className="font-medium hover:text-primary transition-colors hover:underline">
      {name}
    </Link>
  );
}

export function createPriceListColumns({
  onDelete,
  onViewCostHistory,
}: CreatePriceListColumnsOptions): ColumnDef<PriceListItemListItem>[] {
  return [
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
                <ImageIcon aria-hidden="true" className="h-4 w-4" />
              </Box>
            ) : null}
            <PriceListLink id={item.id} name={item.name} />
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
    {
      id: 'costChange',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Cost Change" />,
      cell: ({ row }) => {
        const lastCostChange = row.original.lastCostChange;

        if (!lastCostChange) {
          return (
            <Box className="flex items-center gap-1.5 text-muted-foreground">
              <Minus aria-hidden="true" className="h-4 w-4" />
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
            className={`flex items-center gap-1.5 ${isIncrease ? 'text-destructive' : 'text-green-600'}`}
          >
            {isIncrease ? (
              <TrendingUp aria-hidden="true" className="h-4 w-4" />
            ) : (
              <TrendingDown aria-hidden="true" className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">{percentChange}%</span>
          </Box>
        );
      },
      enableSorting: false,
    },
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
    {
      id: 'retailPrice',
      accessorKey: 'retailPrice',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Retail Price" />,
      cell: ({ row }) => {
        const item = row.original;
        const retailPrice = item.retailPriceOverride ?? item.retailPrice;
        return (
          <Box className="font-semibold text-teal-700 dark:text-teal-400">
            {formatCurrency({ number: retailPrice })}
          </Box>
        );
      },
      enableSorting: true,
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <PriceListActions
          item={row.original}
          onDelete={onDelete}
          onViewCostHistory={onViewCostHistory}
        />
      ),
      enableHiding: false,
      meta: {
        className: 'text-right',
      },
    },
  ];
}

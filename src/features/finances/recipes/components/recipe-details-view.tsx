'use client';

import { Calculator, DollarSign, Inbox } from 'lucide-react';
import { Box } from '@/components/ui/box';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import type { RecipeWithDetails } from '@/features/finances/recipes/types';

interface RecipeDetailsViewProps {
  recipe: RecipeWithDetails;
}

const LABOUR_COST_TYPE_LABELS = {
  FIXED_AMOUNT: 'Fixed Amount',
  PERCENTAGE_OF_RETAIL: '% of Retail Price',
  PERCENTAGE_OF_MATERIAL: '% of Material Cost',
};

export function RecipeDetailsView({ recipe }: RecipeDetailsViewProps) {
  const isPercentageType = recipe.labourCostType !== 'FIXED_AMOUNT';

  return (
    <Box className="space-y-6 pb-20">
      {/* Summary Cards */}
      <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1">
              Total Cost
            </p>
            <p className="text-2xl font-black text-primary">
              {formatCurrency({ number: recipe.totalCost })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1">
              Materials Cost
            </p>
            <p className="text-xl font-bold">
              {formatCurrency({ number: recipe.totalMaterialsCost })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1">
              Labor Cost
            </p>
            <p className="text-xl font-bold">{formatCurrency({ number: recipe.labourCost })}</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1">
              Retail Total
            </p>
            <p className="text-xl font-bold text-blue-600">
              {formatCurrency({ number: recipe.totalRetailPrice })}
            </p>
          </CardContent>
        </Card>
      </Box>

      {/* Description & Metadata */}
      <Box className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Box className="md:col-span-2 space-y-4">
          <Box>
            <h4 className="text-sm font-semibold mb-1 text-muted-foreground uppercase tracking-wider">
              Description
            </h4>
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
              {recipe.description || 'No description provided.'}
            </p>
          </Box>
        </Box>

        <Card className="bg-muted/30 border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Calculator aria-hidden="true" className="size-3" />
              Labour Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Box className="flex items-center justify-between py-1">
              <span className="text-xs text-muted-foreground">Type</span>
              <span className="text-xs font-medium">
                {LABOUR_COST_TYPE_LABELS[recipe.labourCostType]}
              </span>
            </Box>
            <Box className="flex items-center justify-between py-1">
              <span className="text-xs text-muted-foreground">
                {isPercentageType ? 'Percentage' : 'Amount'}
              </span>
              <span className="text-xs font-medium">
                {isPercentageType
                  ? `${recipe.labourAmount}%`
                  : formatCurrency({ number: recipe.labourAmount })}
              </span>
            </Box>
            <Separator className="my-1" />
            <Box className="flex items-center justify-between py-1">
              <span className="text-xs text-muted-foreground">Materials Cost</span>
              <span className="text-xs font-medium">
                {formatCurrency({ number: recipe.totalMaterialsCost })}
              </span>
            </Box>
            <Box className="flex items-center justify-between py-1">
              <span className="text-xs text-muted-foreground">Labor Cost</span>
              <span className="text-xs font-medium">
                {formatCurrency({ number: recipe.labourCost })}
              </span>
            </Box>
            <Separator className="my-1" />
            <Box className="flex items-center justify-between py-1">
              <span className="text-xs font-bold text-foreground">Total Cost</span>
              <span className="text-xs font-bold text-primary">
                {formatCurrency({ number: recipe.totalCost })}
              </span>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Items Table */}
      <Box className="space-y-4">
        <Box className="flex items-center justify-between">
          <h3 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <Inbox aria-hidden="true" className="size-5 text-primary" />
            Items List
          </h3>
          <Badge variant="outline" className="font-mono">
            {recipe.items.length} {recipe.items.length === 1 ? 'Item' : 'Items'}
          </Badge>
        </Box>

        <Box className="rounded-md border border-border/50 bg-card/50 overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[40%]">Name</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right font-bold">Cost Total</TableHead>
                <TableHead className="text-right">Retail Price</TableHead>
                <TableHead className="text-right font-bold">Retail Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recipe.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-right text-xs">{item.quantity}</TableCell>
                  <TableCell className="text-right text-xs">
                    {formatCurrency({ number: item.unitPrice })}
                  </TableCell>
                  <TableCell className="text-right font-bold text-sm">
                    {formatCurrency({ number: item.lineTotal })}
                  </TableCell>
                  <TableCell className="text-right text-xs text-blue-600">
                    {formatCurrency({ number: item.retailPrice })}
                  </TableCell>
                  <TableCell className="text-right font-bold text-sm text-blue-600">
                    {formatCurrency({ number: item.retailLineTotal })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Box>
    </Box>
  );
}

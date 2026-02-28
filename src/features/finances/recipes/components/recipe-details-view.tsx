'use client';

import { Calculator, DollarSign, Percent, TrendingUp, Inbox } from 'lucide-react';
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

export function RecipeDetailsView({ recipe }: RecipeDetailsViewProps) {
  return (
    <Box className="space-y-6 pb-20">
      {/* Summary Cards */}
      <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1">
              Selling Price
            </p>
            <p className="text-2xl font-black text-primary">
              {formatCurrency({ number: recipe.sellingPrice })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1">
              Total Production Cost
            </p>
            <p className="text-xl font-bold">
              {formatCurrency({ number: recipe.totalProductionCost })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1">
              Estimated Profit
            </p>
            <p className="text-xl font-bold text-green-600">
              {formatCurrency({ number: recipe.profitValue })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1">
              Profit Margin
            </p>
            <p className="text-xl font-bold text-green-600">
              {recipe.profitPercentage.toFixed(1)}%
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
              <TrendingUp className="size-3" />
              Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Box className="flex items-center justify-between py-1">
              <span className="text-xs text-muted-foreground">Labor Rate</span>
              <span className="text-xs font-medium">{recipe.laborRate}%</span>
            </Box>
            <Box className="flex items-center justify-between py-1">
              <span className="text-xs text-muted-foreground">Target Margin</span>
              <span className="text-xs font-medium">{recipe.targetMargin}%</span>
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
                {formatCurrency({ number: recipe.laborCost })}
              </span>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Items Table */}
      <Box className="space-y-4">
        <Box className="flex items-center justify-between">
          <h3 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <Inbox className="size-5 text-primary" />
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
                <TableHead className="w-[40%]">Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Unit Qty</TableHead>
                <TableHead className="text-right">Unit Cost</TableHead>
                <TableHead className="text-right">Qty Used</TableHead>
                <TableHead className="text-right font-bold">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recipe.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.description}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {item.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-xs">
                    {item.purchaseUnitQuantity} {item.purchaseUnit}
                  </TableCell>
                  <TableCell className="text-right text-xs">
                    {formatCurrency({ number: item.unitCost })}
                  </TableCell>
                  <TableCell className="text-right text-xs">{item.quantityUsed}</TableCell>
                  <TableCell className="text-right font-bold text-sm">
                    {formatCurrency({ number: item.subtotal })}
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

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { TopTransactionCategory } from '@/features/finances/transactions/types';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp } from 'lucide-react';

interface TopCategoriesTableProps {
  categories?: TopTransactionCategory[];
  isLoading?: boolean;
}

export function TopCategoriesTable({ categories, isLoading }: TopCategoriesTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 mb-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Categories</CardTitle>
        <CardDescription>Categories with the highest transaction amounts.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {categories?.map((category, index) => (
            <div key={category.categoryId} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-sm font-bold text-primary">#{index + 1}</span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">{category.categoryName}</p>
                  <p className="text-xs text-muted-foreground">
                    {category.transactionCount} transactions •{' '}
                    {formatCurrency({ number: category.avgTransactionAmount })} avg
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm font-bold">
                  {formatCurrency({ number: category.totalAmount })}
                </div>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </div>
          ))}
          {categories && categories.length === 0 && (
            <p className="text-sm text-center text-muted-foreground py-4">
              No category data available
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

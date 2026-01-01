'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import type { TopCustomerByQuotedValue } from '@/features/finances/quotes/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface TopCustomersQuotedTableProps {
  customers?: TopCustomerByQuotedValue[];
  isLoading?: boolean;
}

export function TopCustomersQuotedTable({ customers, isLoading }: TopCustomersQuotedTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 mb-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Customers by Quoted Value</CardTitle>
        <CardDescription>
          Customers with the highest total quoted value and their conversion rates.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {customers?.map((customer, index) => (
            <div key={customer.customerId} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                  {index + 1}
                </div>
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/10 text-xs">
                    {customer.customerName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1 flex-1 min-w-0">
                  <p className="text-sm font-medium leading-none truncate">
                    {customer.customerName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {customer.quoteCount} {customer.quoteCount === 1 ? 'quote' : 'quotes'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-bold">
                    {formatCurrency({ number: customer.totalQuotedValue, maxFractionDigits: 0 })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatCurrency({ number: customer.acceptedValue, maxFractionDigits: 0 })}{' '}
                    accepted
                  </div>
                </div>
                <Badge
                  variant={customer.conversionRate >= 50 ? 'default' : 'secondary'}
                  className="ml-2"
                >
                  {customer.conversionRate.toFixed(0)}%
                </Badge>
              </div>
            </div>
          ))}
          {customers && customers.length === 0 && (
            <p className="text-sm text-center text-muted-foreground py-4">
              No quote data available
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

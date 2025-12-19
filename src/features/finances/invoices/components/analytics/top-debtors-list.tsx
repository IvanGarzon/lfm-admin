'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { TopCustomerDebtor } from '@/features/finances/invoices/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

interface TopDebtorsListProps {
  debtors?: TopCustomerDebtor[];
  isLoading?: boolean;
}

export function TopDebtorsList({ debtors, isLoading }: TopDebtorsListProps) {
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
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Debtors</CardTitle>
        <CardDescription>Customers with the highest outstanding balances.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {debtors?.map((debtor) => (
            <div key={debtor.customerId} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-muted text-xs">
                    {debtor.customerName.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">{debtor.customerName}</p>
                  <p className="text-xs text-muted-foreground">{debtor.invoiceCount} unpaid invoices</p>
                </div>
              </div>
              <div className="text-sm font-bold text-red-600">
                {formatCurrency({ number: debtor.amountDue })}
              </div>
            </div>
          ))}
          {debtors && debtors.length === 0 && (
            <p className="text-sm text-center text-muted-foreground py-4">No outstanding balances!</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

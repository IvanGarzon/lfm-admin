'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, FileCheck, ArrowUpCircle, ArrowDownCircle, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

interface ActivityItem {
  id: string;
  type: 'invoice' | 'quote' | 'transaction';
  title: string;
  subtitle: string;
  amount: number;
  date: Date;
  status: string;
}

interface RecentActivityProps {
  items?: ActivityItem[];
  isLoading?: boolean;
}

export function RecentActivity({ items = [], isLoading }: RecentActivityProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3 border-b last:border-0">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'invoice':
        return FileText;
      case 'quote':
        return FileCheck;
      case 'transaction':
        return ArrowUpCircle;
      default:
        return FileText;
    }
  };

  const getIconColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'invoice':
        return 'text-emerald-500 bg-emerald-500/10';
      case 'quote':
        return 'text-blue-500 bg-blue-500/10';
      case 'transaction':
        return 'text-purple-500 bg-purple-500/10';
      default:
        return 'text-gray-500 bg-gray-500/10';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Activity</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/finances/invoices">
            View All
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">No recent activity</div>
        ) : (
          <div className="space-y-0">
            {items.slice(0, 5).map((item) => {
              const Icon = getIcon(item.type);
              const iconColor = getIconColor(item.type);

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-4 py-3 border-b last:border-0 hover:bg-accent/50 px-2 -mx-2 rounded-sm transition-colors"
                >
                  <div className={`rounded-full p-2 ${iconColor}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {formatCurrency({ number: item.amount })}
                    </p>
                    <p className="text-xs text-muted-foreground">{format(item.date, 'MMM d')}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

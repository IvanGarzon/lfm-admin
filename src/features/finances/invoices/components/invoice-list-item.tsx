import Link from 'next/link';
import { useCallback } from 'react';
import { format } from 'date-fns';
import {
  Eye,
  Trash2,
  Mail,
  FileCheck,
  CheckCircle,
  XCircle,
  MoreHorizontalIcon,
} from 'lucide-react';

import { formatCurrency } from '@/lib/utils';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { InvoiceStatusSchema } from '@/zod/inputTypeSchemas/InvoiceStatusSchema';
import type { InvoiceListItem } from '@/features/finances/invoices/types';
import { InvoiceStatusBadge } from '@/features/finances/invoices/components/invoice-status-badge';

export function InvoiceListItemComponent({
  invoice,
  onDelete,
  onSendReminder,
  onMarkAsPending,
  onMarkAsPaid,
  onCancel,
}: {
  invoice: InvoiceListItem;
  onDelete: (id: string) => void;
  onSendReminder: (id: string) => void;
  onMarkAsPending: (id: string) => void;
  onMarkAsPaid: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  const handleDelete = useCallback(
    (id: string) => {
      onDelete(id);
    },
    [onDelete],
  );

  const handleSendReminder = useCallback(
    (id: string) => {
      onSendReminder(id);
    },
    [onSendReminder],
  );

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <Box className="flex items-start justify-between">
          <Box className="space-y-1">
            <CardTitle className="text-base">
              <Link
                href={`/finances/invoices/${invoice.id}`}
                className="hover:text-primary transition-colors"
              >
                {invoice.invoiceNumber}
              </Link>
            </CardTitle>
            <CardDescription>{invoice.customerName}</CardDescription>
          </Box>
          <InvoiceStatusBadge status={invoice.status} />
        </Box>
      </CardHeader>
      <CardContent>
        <Box className="grid grid-cols-2 gap-4 text-sm mb-4">
          <Box>
            <p className="text-muted-foreground text-xs">Amount</p>
            <p className="font-semibold">
              {formatCurrency({
                number: invoice.amount,
              })}
            </p>
          </Box>
          <Box>
            <p className="text-muted-foreground text-xs">Due Date</p>
            <p className="font-medium">{format(invoice.dueDate, 'MMM dd, yyyy')}</p>
          </Box>
          <Box>
            <p className="text-muted-foreground text-xs">Email</p>
            <p className="font-medium truncate">{invoice.customerEmail}</p>
          </Box>
          <Box>
            <p className="text-muted-foreground text-xs">Items</p>
            <p className="font-medium">{invoice.itemCount}</p>
          </Box>
        </Box>

        <Box className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/finances/invoices/${invoice.id}`}>
              <Eye className="h-4 w-4 mr-1" />
              View
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="ml-auto h-8 w-8">
                <MoreHorizontalIcon className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {invoice.status === InvoiceStatusSchema.enum.DRAFT ? (
                <DropdownMenuItem onClick={() => onMarkAsPending(invoice.id)}>
                  <FileCheck className="h-4 w-4" />
                  Mark Pending
                </DropdownMenuItem>
              ) : null}
              {invoice.status === InvoiceStatusSchema.enum.PENDING ||
              invoice.status === InvoiceStatusSchema.enum.OVERDUE ? (
                <>
                  <DropdownMenuItem onClick={() => onMarkAsPaid(invoice.id)}>
                    <CheckCircle className="h-4 w-4" />
                    Mark Paid
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSendReminder(invoice.id)}>
                    <Mail className="h-4 w-4" />
                    Remind
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onCancel(invoice.id)}>
                    <XCircle className="h-4 w-4" />
                    Cancel
                  </DropdownMenuItem>
                </>
              ) : null}
              <DropdownMenuItem
                onClick={() => handleDelete(invoice.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Box>
      </CardContent>
    </Card>
  );
}

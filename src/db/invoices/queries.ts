import { Prisma, PrismaClient } from '@/prisma/client';

import type {
  InvoiceListItem,
  InvoiceWithDetails,
  InvoiceFilters,
  InvoicePagination,
  InvoiceMetadata,
  InvoiceItemDetail,
  InvoicePaymentItem,
  InvoiceStatusHistoryItem
} from '@/features/finances/invoices/types';
import { getPaginationMetadata } from '@/lib/utils';

/**
 * Search and paginate invoices with advanced filtering capabilities.
 * Supports full-text search across invoice number and customer details,
 * status filtering, sorting, and pagination.
 * @param prisma - The Prisma client instance
 * @param params - Filter parameters for the search
 * @param tenantId - The tenant ID to scope all queries
 * @returns A promise that resolves to paginated invoice results with metadata
 */
export async function searchInvoices(
  prisma: PrismaClient,
  params: InvoiceFilters,
  tenantId: string
): Promise<InvoicePagination> {
  const { search, status, page, perPage, sort } = params;

  const whereClause: Prisma.InvoiceWhereInput = {
    tenantId,
    deletedAt: null
  };

  if (search) {
    const searchFilter: Prisma.StringFilter = {
      contains: search,
      mode: Prisma.QueryMode.insensitive
    };

    whereClause.OR = [
      { invoiceNumber: searchFilter },
      {
        customer: {
          OR: [{ firstName: searchFilter }, { lastName: searchFilter }, { email: searchFilter }]
        }
      }
    ];
  }

  if (status && status.length > 0) {
    whereClause.status = {
      in: status
    };
  }

  const skip = page > 0 ? perPage * (page - 1) : 0;

  const orderBy: Prisma.InvoiceOrderByWithRelationInput[] =
    sort && sort.length > 0
      ? sort.map((sortItem) => {
          const order: Prisma.SortOrder = sortItem.desc ? 'desc' : 'asc';
          if (sortItem.id === 'customer') {
            return { customer: { firstName: order } };
          }

          if (sortItem.id === 'search') {
            return { invoiceNumber: order };
          }

          return { [sortItem.id]: order };
        })
      : [{ createdAt: 'desc' }];

  const countOperation = prisma.invoice.count({ where: whereClause });
  const findManyOperation = prisma.invoice.findMany({
    where: whereClause,
    include: {
      customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      },
      _count: {
        select: {
          items: true
        }
      }
    },
    orderBy,
    skip,
    take: perPage
  });

  // Run count and query in parallel without transaction
  // These are read-only operations so transaction isn't necessary
  const [totalItems, invoices] = await Promise.all([countOperation, findManyOperation]);

  const items: InvoiceListItem[] = invoices.map((invoice) => ({
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    customerId: invoice.customerId,
    customerName: `${invoice.customer.firstName} ${invoice.customer.lastName}`,
    customerEmail: invoice.customer.email,
    status: invoice.status,
    amount: Number(invoice.amount),
    amountPaid: Number(invoice.amountPaid),
    amountDue: Number(invoice.amountDue),
    currency: invoice.currency,
    issuedDate: invoice.issuedDate,
    dueDate: invoice.dueDate,
    itemCount: invoice._count.items
  }));

  return {
    items,
    pagination: getPaginationMetadata(totalItems, perPage, page)
  };
}

/**
 * Find an invoice by its ID with complete details including customer and items.
 * @param prisma - The Prisma client instance
 * @param id - The unique identifier of the invoice
 * @param tenantId - The tenant ID to scope the query
 * @returns A promise that resolves to the invoice with all details, or null if not found
 */
export async function findInvoiceByIdWithDetails(
  prisma: PrismaClient,
  id: string,
  tenantId: string
): Promise<InvoiceWithDetails | null> {
  const invoice = await prisma.invoice.findUnique({
    where: { id, tenantId, deletedAt: null },
    select: {
      id: true,
      invoiceNumber: true,
      status: true,
      amount: true,
      gst: true,
      discount: true,
      currency: true,
      issuedDate: true,
      dueDate: true,
      remindersSent: true,
      paidDate: true,
      paymentMethod: true,
      receiptNumber: true,
      cancelledDate: true,
      cancelReason: true,
      notes: true,
      amountPaid: true,
      amountDue: true,
      createdAt: true,
      updatedAt: true,
      payments: {
        select: {
          id: true,
          amount: true,
          date: true,
          method: true,
          reference: true,
          notes: true
        },
        orderBy: { date: 'desc' }
      },
      statusHistory: {
        select: {
          id: true,
          status: true,
          previousStatus: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true
            }
          },
          notes: true
        },
        orderBy: { updatedAt: 'asc' }
      },
      customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          organization: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      items: {
        select: {
          id: true,
          invoiceId: true,
          description: true,
          quantity: true,
          unitPrice: true,
          total: true,
          productId: true
        },
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  if (!invoice) {
    return null;
  }

  return {
    ...invoice,
    amount: Number(invoice.amount),
    gst: Number(invoice.gst),
    discount: Number(invoice.discount),
    amountPaid: Number(invoice.amountPaid),
    amountDue: Number(invoice.amountDue),
    notes: invoice.notes ?? undefined,
    payments: invoice.payments.map((p) => ({
      ...p,
      amount: Number(p.amount)
    })),
    items: invoice.items.map((item) => ({
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      total: Number(item.total)
    }))
  };
}

/**
 * Fetches lightweight invoice metadata without items, payments, or history.
 * Used for headers, actions, and navigation where full details aren't needed.
 * Significantly reduces data transfer compared to findInvoiceByIdWithDetails.
 * @param prisma - The Prisma client instance
 * @param id - The ID of the invoice
 * @param tenantId - The tenant ID to scope the query
 * @returns A promise that resolves to the invoice metadata, or null if not found
 */
export async function findInvoiceMetadataById(
  prisma: PrismaClient,
  id: string,
  tenantId: string
): Promise<InvoiceMetadata | null> {
  const invoice = await prisma.invoice.findUnique({
    where: { id, tenantId, deletedAt: null },
    select: {
      id: true,
      invoiceNumber: true,
      status: true,
      amount: true,
      gst: true,
      discount: true,
      currency: true,
      issuedDate: true,
      dueDate: true,
      remindersSent: true,
      paidDate: true,
      paymentMethod: true,
      receiptNumber: true,
      cancelledDate: true,
      cancelReason: true,
      notes: true,
      amountPaid: true,
      amountDue: true,
      createdAt: true,
      updatedAt: true,
      customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          organization: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      _count: {
        select: {
          payments: true,
          statusHistory: true,
          items: true
        }
      }
    }
  });

  if (!invoice) {
    return null;
  }

  return {
    ...invoice,
    amount: Number(invoice.amount),
    gst: Number(invoice.gst),
    discount: Number(invoice.discount),
    amountPaid: Number(invoice.amountPaid),
    amountDue: Number(invoice.amountDue),
    notes: invoice.notes ?? undefined
  };
}

/**
 * Get all items for a specific invoice.
 * @param prisma - The Prisma client instance
 * @param invoiceId - ID of the invoice
 * @returns A promise that resolves to an array of invoice item details
 */
export async function findInvoiceItems(
  prisma: PrismaClient,
  invoiceId: string
): Promise<InvoiceItemDetail[]> {
  const items = await prisma.invoiceItem.findMany({
    where: { invoiceId },
    select: {
      id: true,
      invoiceId: true,
      description: true,
      quantity: true,
      unitPrice: true,
      total: true,
      productId: true
    },
    orderBy: { createdAt: 'asc' }
  });

  return items.map((item) => ({
    ...item,
    quantity: Number(item.quantity),
    unitPrice: Number(item.unitPrice),
    total: Number(item.total)
  }));
}

/**
 * Get all payments for a specific invoice.
 * @param prisma - The Prisma client instance
 * @param invoiceId - ID of the invoice
 * @returns A promise that resolves to an array of invoice payment items
 */
export async function findInvoicePayments(
  prisma: PrismaClient,
  invoiceId: string
): Promise<InvoicePaymentItem[]> {
  const payments = await prisma.payment.findMany({
    where: { invoiceId },
    select: {
      id: true,
      amount: true,
      date: true,
      method: true,
      reference: true,
      notes: true
    },
    orderBy: { date: 'desc' }
  });

  return payments.map((p) => ({
    ...p,
    amount: Number(p.amount)
  }));
}

/**
 * Get status history for a specific invoice.
 * @param prisma - The Prisma client instance
 * @param invoiceId - ID of the invoice
 * @returns A promise that resolves to an array of status history items
 */
export async function findInvoiceStatusHistory(
  prisma: PrismaClient,
  invoiceId: string
): Promise<InvoiceStatusHistoryItem[]> {
  return prisma.invoiceStatusHistory.findMany({
    where: { invoiceId },
    select: {
      id: true,
      status: true,
      previousStatus: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true
        }
      },
      notes: true
    },
    orderBy: { updatedAt: 'asc' }
  });
}

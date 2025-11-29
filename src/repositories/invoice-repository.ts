import { Invoice, Prisma, PrismaClient } from '@/prisma/client';
import { BaseRepository, type ModelDelegateOperations } from '@/lib/baseRepository';
import { InvoiceStatusSchema } from '@/zod/inputTypeSchemas/InvoiceStatusSchema';

import type {
  InvoiceListItem,
  InvoiceStatistics,
  InvoiceWithDetails,
  InvoiceFilters,
  InvoicePagination,
} from '@/features/finances/invoices/types';
import { getPaginationMetadata } from '@/lib/utils';

import type { CreateInvoiceInput, UpdateInvoiceInput } from '@/schemas/invoices';

/**
 * Invoice Repository
 * Handles all database operations for invoices
 * Extends BaseRepository for common CRUD operations
 */
export class InvoiceRepository extends BaseRepository<Prisma.InvoiceGetPayload<object>> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected get model(): ModelDelegateOperations<Prisma.InvoiceGetPayload<object>> {
    return this.prisma.invoice as unknown as ModelDelegateOperations<
      Prisma.InvoiceGetPayload<object>
    >;
  }

  /**
   * Search and paginate invoices with filters
   * Follows the same pattern as employeeRepository.searchAndPaginate
   */
  async searchAndPaginate(params: InvoiceFilters): Promise<InvoicePagination> {
    const { search, status, page, perPage, sort } = params;

    const whereClause: Prisma.InvoiceWhereInput = {
      deletedAt: null,
    };

    if (status && status.length > 0) {
      whereClause.status = {
        in: status,
      };
    }

    // if (dateFrom || dateTo) {
    //   whereClause.issuedDate = {};
    //   if (dateFrom) {
    //     whereClause.issuedDate.gte = dateFrom;
    //   }
    //   if (dateTo) {
    //     whereClause.issuedDate.lte = dateTo;
    //   }
    // }

    // if (minAmount !== undefined || maxAmount !== undefined) {
    //   whereClause.amount = {};
    //   if (minAmount !== undefined) {
    //     whereClause.amount.gte = minAmount;
    //   }
    //   if (maxAmount !== undefined) {
    //     whereClause.amount.lte = maxAmount;
    //   }
    // }

    if (search) {
      const searchFilter: Prisma.StringFilter = {
        contains: search,
        mode: Prisma.QueryMode.insensitive,
      };

      whereClause.OR = [
        { invoiceNumber: searchFilter },
        {
          customer: {
            OR: [{ firstName: searchFilter }, { lastName: searchFilter }, { email: searchFilter }],
          },
        },
      ];
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
        : [{ invoiceNumber: 'desc' }];

    const countOperation = this.prisma.invoice.count({ where: whereClause });
    const findManyOperation = this.prisma.invoice.findMany({
      where: whereClause,
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
      orderBy,
      skip,
      take: perPage,
    });

    const [totalItems, invoices] = await this.prisma.$transaction([
      countOperation,
      findManyOperation,
    ]);

    const items: InvoiceListItem[] = invoices.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      customerName: `${invoice.customer.firstName} ${invoice.customer.lastName}`,
      customerEmail: invoice.customer.email,
      status: invoice.status,
      amount: Number(invoice.amount),
      currency: invoice.currency,
      issuedDate: invoice.issuedDate,
      dueDate: invoice.dueDate,
      itemCount: invoice._count.items,
    }));

    return {
      items,
      pagination: getPaginationMetadata(totalItems, perPage, page),
    };
  }

  /*
   * Find an invoice by its ID with details.
   */
  async findByIdWithDetails(id: string): Promise<InvoiceWithDetails | null> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id, deletedAt: null },
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
        cancelledDate: true,
        cancelReason: true,
        notes: true,
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
                name: true,
              },
            },
          },
        },
        items: {
          select: {
            id: true,
            invoiceId: true,
            description: true,
            quantity: true,
            unitPrice: true,
            total: true,
            productId: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!invoice) {
      return null;
    }

    return {
      ...invoice,
      amount: Number(invoice.amount),
      gst: Number(invoice.gst),
      discount: Number(invoice.discount),
      notes: invoice.notes ?? undefined,
      items: invoice.items.map((item) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
      })),
    };
  }

  async getStatistics(dateFilter?: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<InvoiceStatistics> {
    const whereClause: Prisma.InvoiceWhereInput = {
      deletedAt: null,
    };

    // Add date filter if provided
    if (dateFilter?.startDate || dateFilter?.endDate) {
      whereClause.issuedDate = {};
      if (dateFilter.startDate) {
        whereClause.issuedDate.gte = dateFilter.startDate;
      }

      if (dateFilter.endDate) {
        whereClause.issuedDate.lte = dateFilter.endDate;
      }
    }

    // Optimized: Run only 2 queries instead of 5
    const [statusGroupData, paidData] = await Promise.all([
      // Query 1: Group by status to get counts AND sums per status in one query
      this.prisma.invoice.groupBy({
        by: ['status'],
        where: whereClause,
        _count: true,
        _sum: {
          amount: true,
        },
      }),

      // Query 2: Get average for PAID invoices using Prisma aggregate (type-safe)
      this.prisma.invoice.aggregate({
        where: {
          ...whereClause,
          status: InvoiceStatusSchema.enum.PAID,
        },
        _avg: {
          amount: true,
        },
      }),
    ]);

    // Extract status-specific revenue sums from grouped data
    let totalRevenue = 0;
    let pendingRevenue = 0;
    let totalCount = 0;

    statusGroupData.forEach((group) => {
      totalCount += group._count;

      if (group.status === InvoiceStatusSchema.enum.PAID) {
        totalRevenue = Number(group._sum.amount ?? 0);
      } else if (
        group.status === InvoiceStatusSchema.enum.PENDING ||
        group.status === InvoiceStatusSchema.enum.OVERDUE
      ) {
        pendingRevenue += Number(group._sum.amount ?? 0);
      }
    });

    const stats: InvoiceStatistics = {
      total: totalCount,
      draft: 0,
      pending: 0,
      paid: 0,
      cancelled: 0,
      overdue: 0,
      totalRevenue,
      pendingRevenue,
      avgInvoiceValue: Number(paidData._avg.amount ?? 0),
    };

    // Map status counts
    statusGroupData.forEach((item) => {
      switch (item.status) {
        case InvoiceStatusSchema.enum.DRAFT:
          stats.draft = item._count;
          break;
        case InvoiceStatusSchema.enum.PENDING:
          stats.pending = item._count;
          break;
        case InvoiceStatusSchema.enum.PAID:
          stats.paid = item._count;
          break;
        case InvoiceStatusSchema.enum.CANCELLED:
          stats.cancelled = item._count;
          break;
        case InvoiceStatusSchema.enum.OVERDUE:
          stats.overdue = item._count;
          break;
      }
    });

    return stats;
  }

  async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;

    const lastInvoice = await this.model.findFirst({
      where: {
        invoiceNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        invoiceNumber: 'desc',
      },
      select: {
        invoiceNumber: true,
      },
    });

    if (!lastInvoice) {
      return `${prefix}0001`;
    }

    const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-')[2], 10);
    const nextNumber = lastNumber + 1;

    return `${prefix}${String(nextNumber).padStart(4, '0')}`;
  }

  async createInvoiceWithItems(
    data: CreateInvoiceInput,
  ): Promise<{ id: string; invoiceNumber: string }> {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        // Generate invoice number
        const invoiceNumber = await this.generateInvoiceNumber();

        // Calculate total amount
        const totalAmount = data.items.reduce(
          (sum, item) => sum + item.quantity * item.unitPrice,
          0,
        );

        return await this.model.create({
          data: {
            invoiceNumber,
            customerId: data.customerId,
            status: data.status,
            amount: totalAmount,
            currency: data.currency,
            gst: data.gst,
            discount: data.discount,
            issuedDate: data.issuedDate,
            dueDate: data.dueDate,
            notes: data.notes ?? null,
            remindersSent: 0,
            items: {
              create: data.items.map((item) => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.quantity * item.unitPrice,
                productId: item.productId,
              })),
            },
          },
          select: {
            id: true,
            invoiceNumber: true,
          },
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002' // Unique constraint violation
        ) {
          attempts++;
          if (attempts === maxAttempts) {
            throw new Error('Failed to generate a unique invoice number. Please try again.');
          }
          continue; // Retry with a new number
        }
        throw error; // Re-throw other errors
      }
    }

    throw new Error('Failed to create invoice');
  }

  async updateInvoiceWithItems(
    id: string,
    data: UpdateInvoiceInput,
  ): Promise<InvoiceWithDetails | null> {
    // Calculate total amount
    const totalAmount = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    
    // Update invoice with items in a transaction
    const updatedInvoice = await this.prisma.$transaction(async (tx) => {
      // Get current quote to check for status changes
      const currentInvoice = await tx.invoice.findUnique({
        where: { id },
        select: { status: true },
      }); 

      if(!currentInvoice) {
        throw new Error('Invoice not found');
      }

      if(currentInvoice.status !== data.status) {
        throw new Error('Invoice status cannot be changed');
      }

      // Separate existing items from new items
      const existingItems = data.items.filter((item) => item.id);
      const newItems = data.items.filter((item) => !item.id);
      const existingItemIds = existingItems.map((item) => item.id!);

      // Delete items that are no longer in the list (preserves attachments for kept items)
      await tx.invoiceItem.deleteMany({
        where: {
          invoiceId: data.id,
          id: { notIn: existingItemIds },
        },
      });

      // Update invoice details
      const invoice = await tx.invoice.update({
        where: { id },
        data: {
          customerId: data.customerId,
          status: data.status,
          amount: totalAmount,
          currency: data.currency,
          gst: data.gst,
          discount: data.discount,
          issuedDate: data.issuedDate,
          dueDate: data.dueDate,
          notes: data.notes ?? null,
          updatedAt: new Date(),
        },
      });

      // Update existing items
      for (let index = 0; index < existingItems.length; index++) {
        const item = existingItems[index];
        await tx.invoiceItem.update({
          where: { id: item.id },
          data: {
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
            productId: item.productId,
            updatedAt: new Date(),
          },
        });
      }

      // Create new items
      if (newItems.length > 0) {
        await tx.invoiceItem.createMany({
          data: newItems.map((item) => {
            return {
              invoiceId: data.id,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.quantity * item.unitPrice,
              productId: item.productId,
            };
          }),
        });
      }

      return invoice;
    });

    if (!updatedInvoice) {
      return null;
    }

    return await this.findByIdWithDetails(updatedInvoice.id);
  }

  /**
   * Mark invoice as paid
   */
  async markAsPaid(
    id: string,
    paidDate: Date,
    paymentMethod: string,
  ): Promise<InvoiceWithDetails | null> {
    const updated = await this.prisma.invoice.update({
      where: { id, deletedAt: null },
      data: {
        status: InvoiceStatusSchema.enum.PAID,
        paidDate,
        paymentMethod,
        updatedAt: new Date(),
      },
    });

    if (!updated) {
      return null;
    }

    return this.findByIdWithDetails(updated.id);
  }

  /**
   * Mark invoice as pending
   */
  async markAsPending(id: string): Promise<InvoiceWithDetails | null> {
    const updated = await this.prisma.invoice.update({
      where: { id, deletedAt: null },
      data: {
        status: InvoiceStatusSchema.enum.PENDING,
        updatedAt: new Date(),
      },
    });

    if (!updated) {
      return null;
    }

    return this.findByIdWithDetails(updated.id);
  }

  /**
   * Cancel invoice
   */
  async cancel(
    id: string,
    cancelledDate: Date,
    cancelReason: string,
  ): Promise<InvoiceWithDetails | null> {
    const updated = await this.prisma.invoice.update({
      where: { id, deletedAt: null },
      data: {
        status: InvoiceStatusSchema.enum.CANCELLED,
        cancelledDate,
        cancelReason,
        updatedAt: new Date(),
      },
    });

    return this.findByIdWithDetails(updated.id);
  }

  /**
   * Send reminder (increment counter)
   */
  async sendReminder(id: string): Promise<InvoiceWithDetails | null> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id, deletedAt: null },
      select: { remindersSent: true },
    });

    if (!invoice) {
      return null;
    }

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: {
        remindersSent: (invoice.remindersSent ?? 0) + 1,
        updatedAt: new Date(),
      },
    });

    return this.findByIdWithDetails(updated.id);
  }

  /**
   * Soft delete invoice
   */
  async softDelete(id: string): Promise<boolean> {
    const result = await this.prisma.invoice.update({
      where: { id, deletedAt: null },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return result !== null;
  }

  /**
   * Check if invoice number exists
   */
  async invoiceNumberExists(invoiceNumber: string, excludeId?: string): Promise<boolean> {
    const where: Prisma.InvoiceWhereInput = {
      invoiceNumber,
      deletedAt: null,
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const count = await this.prisma.invoice.count({ where });
    return count > 0;
  }
}

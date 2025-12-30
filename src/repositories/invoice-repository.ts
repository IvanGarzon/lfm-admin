import { Invoice, InvoiceStatus, Prisma, PrismaClient } from '@/prisma/client';
import { BaseRepository, type ModelDelegateOperations } from '@/lib/baseRepository';
import { validateInvoiceStatusTransition } from '@/features/finances/invoices/utils/invoice-helpers';
import { isPrismaError } from '@/lib/error-handler';
import { INVOICE_CONFIG } from '@/features/finances/invoices/config/invoice-config';
import { withDatabaseRetry } from '@/lib/retry';

import type {
  InvoiceListItem,
  InvoiceStatistics,
  InvoiceWithDetails,
  InvoiceFilters,
  InvoicePagination,
  InvoiceBasic,
  InvoiceItemDetail,
  InvoicePaymentItem,
  InvoiceStatusHistoryItem,
  RevenueTrend,
  TopCustomerDebtor,
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
   * Search and paginate invoices with advanced filtering capabilities.
   * Supports full-text search across invoice number and customer details,
   * status filtering, sorting, and pagination.
   * @param params - Filter parameters for the search
   * @param params.search - Optional search term to filter by invoice number or customer name/email
   * @param params.status - Optional array of invoice statuses to filter by
   * @param params.page - Page number for pagination (1-indexed)
   * @param params.perPage - Number of items per page
   * @param params.sort - Optional array of sort criteria with id and desc properties
   * @returns A promise that resolves to paginated invoice results with metadata
   * @example
   * const result = await repo.searchAndPaginate({
   *   search: "John",
   *   status: ["PENDING", "OVERDUE"],
   *   page: 1,
   *   perPage: 20,
   *   sort: [{ id: "dueDate", desc: true }]
   * });
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
      amountPaid: Number(invoice.amountPaid),
      amountDue: Number(invoice.amountDue),
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

  /**
   * Find an invoice by its ID with complete details including customer and items.
   * @param id - The unique identifier of the invoice
   * @returns A promise that resolves to the invoice with all details, or null if not found
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
            notes: true,
          },
          orderBy: { date: 'desc' },
        },
        statusHistory: {
          select: {
            id: true,
            status: true,
            previousStatus: true,
            changedAt: true,
            changedBy: true,
            notes: true,
          },
          orderBy: { changedAt: 'asc' },
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
      amountPaid: Number(invoice.amountPaid),
      amountDue: Number(invoice.amountDue),
      notes: invoice.notes ?? undefined,
      payments: invoice.payments.map((p) => ({
        ...p,
        amount: Number(p.amount),
      })),
      items: invoice.items.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
      })),
    } as InvoiceWithDetails;
  }

  /**
   * Find basic invoice details without relations, but with relationship counts.
   * @param id - The unique identifier of the invoice
   * @returns A promise that resolves to basic invoice info or null
   */
  async findInvoiceBasicById(id: string): Promise<InvoiceBasic | null> {
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
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            payments: true,
            statusHistory: true,
            items: true,
          },
        },
      },
    });

    if (!invoice) return null;

    return {
      ...invoice,
      amount: Number(invoice.amount),
      gst: Number(invoice.gst),
      discount: Number(invoice.discount),
      amountPaid: Number(invoice.amountPaid),
      amountDue: Number(invoice.amountDue),
    } as InvoiceBasic;
  }

  /**
   * Get all items for a specific invoice.
   * @param invoiceId - ID of the invoice
   */
  async findInvoiceItems(invoiceId: string): Promise<InvoiceItemDetail[]> {
    const items = await this.prisma.invoiceItem.findMany({
      where: { invoiceId },
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
    });

    return items.map((item) => ({
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      total: Number(item.total),
    }));
  }

  /**
   * Get all payments for a specific invoice.
   * @param invoiceId - ID of the invoice
   */
  async findInvoicePayments(invoiceId: string): Promise<InvoicePaymentItem[]> {
    const payments = await this.prisma.payment.findMany({
      where: { invoiceId },
      select: {
        id: true,
        amount: true,
        date: true,
        method: true,
        reference: true,
        notes: true,
      },
      orderBy: { date: 'desc' },
    });

    return payments.map((p) => ({
      ...p,
      amount: Number(p.amount),
    }));
  }

  /**
   * Get status history for a specific invoice.
   * @param invoiceId - ID of the invoice
   */
  async findInvoiceStatusHistory(invoiceId: string): Promise<InvoiceStatusHistoryItem[]> {
    return this.prisma.invoiceStatusHistory.findMany({
      where: { invoiceId },
      select: {
        id: true,
        status: true,
        previousStatus: true,
        changedAt: true,
        changedBy: true,
        notes: true,
      },
      orderBy: { changedAt: 'asc' },
    });
  }

  /**
   * Calculate invoice statistics including counts by status, revenue, and averages.
   * Optimized to run only 2 database queries instead of 5.
   * @param dateFilter - Optional date range filter for the statistics
   * @param dateFilter.startDate - Start date for filtering invoices
   * @param dateFilter.endDate - End date for filtering invoices
   * @returns A promise that resolves to invoice statistics object
   */
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

    // Determine previous period for growth comparison
    let previousWhereClause: Prisma.InvoiceWhereInput | null = null;
    if (dateFilter?.startDate && dateFilter?.endDate) {
      const duration = dateFilter.endDate.getTime() - dateFilter.startDate.getTime();
      previousWhereClause = {
        deletedAt: null,
        issuedDate: {
          gte: new Date(dateFilter.startDate.getTime() - duration),
          lte: new Date(dateFilter.endDate.getTime() - duration),
        },
      };
    } else if (!dateFilter?.startDate && !dateFilter?.endDate) {
      // Default: Compare this month to last month
      const now = new Date();
      const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      previousWhereClause = {
        deletedAt: null,
        issuedDate: {
          gte: firstDayLastMonth,
          lt: firstDayThisMonth,
        },
      };
    }

    // Build raw SQL query for average (money type doesn't support avg in Prisma aggregate)
    let avgQuery = Prisma.sql`
      SELECT AVG(amount::numeric)::float as avg
      FROM invoices
      WHERE deleted_at IS NULL
      AND status::text = ${InvoiceStatus.PAID}
    `;

    if (dateFilter?.startDate) {
      avgQuery = Prisma.sql`${avgQuery} AND issued_date >= ${dateFilter.startDate}`;
    }
    if (dateFilter?.endDate) {
      avgQuery = Prisma.sql`${avgQuery} AND issued_date <= ${dateFilter.endDate}`;
    }

    // Run queries in parallel
    const [statusGroupData, avgInvoiceData, prevData, revenueTrend, topDebtors] =
      await withDatabaseRetry(() =>
        Promise.all([
          this.prisma.invoice.groupBy({
            by: ['status'],
            where: whereClause,
            _count: true,
            _sum: { amount: true },
          }),
          this.prisma.$queryRaw<[{ avg: number }]>(avgQuery),
          previousWhereClause ? this.getBasicStats(previousWhereClause) : Promise.resolve(null),
          this.getMonthlyRevenueTrend(12),
          this.getTopDebtors(5),
        ]),
      );

    // Process current period data
    let totalRevenue = 0;
    let pendingRevenue = 0;
    let totalCount = 0;

    const stats: InvoiceStatistics = {
      total: 0,
      draft: 0,
      pending: 0,
      paid: 0,
      cancelled: 0,
      overdue: 0,
      partiallyPaid: 0,
      totalRevenue: 0,
      pendingRevenue: 0,
      avgInvoiceValue: Number(avgInvoiceData[0]?.avg ?? 0),
      revenueTrend,
      topDebtors,
    };

    statusGroupData.forEach((group) => {
      totalCount += group._count;
      const amount = Number(group._sum.amount ?? 0);

      if (group.status === InvoiceStatus.PAID) {
        totalRevenue = amount;
      } else if (
        group.status === InvoiceStatus.PENDING ||
        group.status === InvoiceStatus.OVERDUE ||
        group.status === InvoiceStatus.PARTIALLY_PAID
      ) {
        pendingRevenue += amount;
      }

      switch (group.status) {
        case InvoiceStatus.DRAFT:
          stats.draft = group._count;
          break;
        case InvoiceStatus.PENDING:
          stats.pending = group._count;
          break;
        case InvoiceStatus.PAID:
          stats.paid = group._count;
          break;
        case InvoiceStatus.CANCELLED:
          stats.cancelled = group._count;
          break;
        case InvoiceStatus.OVERDUE:
          stats.overdue = group._count;
          break;
        case InvoiceStatus.PARTIALLY_PAID:
          stats.partiallyPaid = group._count;
          break;
      }
    });

    stats.total = totalCount;
    stats.totalRevenue = totalRevenue;
    stats.pendingRevenue = pendingRevenue;

    // Calculate growth metrics
    if (prevData) {
      stats.totalRevenueGrowth = this.calculateGrowth(totalRevenue, prevData.totalRevenue);
      stats.pendingRevenueGrowth = this.calculateGrowth(pendingRevenue, prevData.pendingRevenue);
      stats.invoiceCountGrowth = this.calculateGrowth(totalCount, prevData.total);
    }

    return stats;
  }

  /**
   * Helper to get basic stats for growth comparison.
   */
  private async getBasicStats(where: Prisma.InvoiceWhereInput) {
    const data = await this.prisma.invoice.groupBy({
      by: ['status'],
      where,
      _count: true,
      _sum: { amount: true },
    });

    let totalRevenue = 0;
    let pendingRevenue = 0;
    let total = 0;

    data.forEach((group) => {
      total += group._count;
      const amount = Number(group._sum.amount ?? 0);
      if (group.status === InvoiceStatus.PAID) {
        totalRevenue = amount;
      } else if (
        group.status === InvoiceStatus.PENDING ||
        group.status === InvoiceStatus.OVERDUE ||
        group.status === InvoiceStatus.PARTIALLY_PAID
      ) {
        pendingRevenue += amount;
      }
    });

    return { total, totalRevenue, pendingRevenue };
  }

  private calculateGrowth(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Number((((current - previous) / previous) * 100).toFixed(1));
  }

  /**
   * Generate a unique invoice number with format: INV-YYYY-####
   * Automatically increments the sequential number for the current year.
   * @returns A promise that resolves to the generated invoice number
   * @example "INV-2025-0001", "INV-2025-0042"
   */
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

  /**
   * Generates a unique receipt number using UUID.
   * Format: RCP-XXXXXXXX where X is uppercase hex from UUID.
   * This eliminates race conditions from the previous check-then-act pattern.
   * @returns A promise that resolves to the generated receipt number
   * @example "RCP-A1B2C3D4"
   */
  async generateReceiptNumber(): Promise<string> {
    const crypto = await import('crypto');
    const uuid = crypto.randomUUID();
    // Take first 8 characters of UUID (without hyphens) and uppercase
    const shortId = uuid.replace(/-/g, '').substring(0, 8).toUpperCase();
    return `RCP-${shortId}`;
  }

  /**
   * Create a new invoice with associated line items in a single transaction.
   * Automatically generates invoice number and calculates total amount.
   * Retries up to 3 times if invoice number collision occurs.
   * @param data - The invoice data including items to create
   * @returns A promise that resolves to an object with the new invoice ID and number
   * @throws {Error} If unable to generate unique invoice number after 3 attempts
   * @throws {Error} For other database errors
   */
  async createInvoiceWithItems(
    data: CreateInvoiceInput,
    createdBy?: string,
  ): Promise<{ id: string; invoiceNumber: string }> {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        // Generate invoice number
        const invoiceNumber = await this.generateInvoiceNumber();

        // Calculate total amount
        const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
        const gstPercentage = Number(data.gst || 0);
        const gstAmount = (subtotal * gstPercentage) / 100;
        const totalAmount = subtotal + gstAmount - Number(data.discount || 0);

        return await this.prisma.$transaction(async (tx) => {
          const invoice = await tx.invoice.create({
            data: {
              invoiceNumber,
              customerId: data.customerId,
              status: data.status,
              amount: totalAmount,
              amountDue: totalAmount, // Initial amountDue is full amount
              amountPaid: 0,
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

          // Create initial status history entry
          await tx.invoiceStatusHistory.create({
            data: {
              invoiceId: invoice.id,
              status: data.status,
              previousStatus: null,
              changedAt: new Date(),
              changedBy: createdBy,
              notes: 'Invoice created',
            },
          });

          return invoice;
        });
      } catch (error: unknown) {
        // Handle unique constraint violation (invoice number collision)
        if (isPrismaError(error) && error.code === 'P2002') {
          attempts++;
          if (attempts === maxAttempts) {
            throw new Error('Failed to generate a unique invoice number. Please try again.');
          }
          continue; // Retry with a new number
        }

        // Re-throw other errors
        throw error;
      }
    }

    throw new Error('Failed to create invoice');
  }

  /**
   * Update an existing invoice and its line items in a transaction.
   * Handles adding, updating, and deleting items as needed.
   * Status changes are NOT allowed through this method - use specific status methods instead.
   * @param id - The unique identifier of the invoice to update
   * @param data - The updated invoice data including items
   * @returns A promise that resolves to the updated invoice with details, or null if not found
   * @throws {Error} If invoice is not found
   * @throws {Error} If attempting to change invoice status (use cancel, etc. instead)
   */
  async updateInvoiceWithItems(
    id: string,
    data: UpdateInvoiceInput,
  ): Promise<InvoiceWithDetails | null> {
    // Calculate total amount
    const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const gstPercentage = Number(data.gst || 0);
    const gstAmount = (subtotal * gstPercentage) / 100;
    const totalAmount = subtotal + gstAmount - Number(data.discount || 0);

    // Update invoice with items in a transaction
    const updatedInvoice = await this.prisma.$transaction(async (tx) => {
      // 1. Fetch current invoice to check status and locking
      const currentInvoice = await tx.invoice.findUnique({
        where: { id, deletedAt: null },
        select: { status: true, amountPaid: true },
      });

      if (!currentInvoice) {
        throw new Error('Invoice not found');
      }

      // 2. Determine if the invoice content is locked.
      // Invoices in PENDING, OVERDUE, PAID, PARTIALLY_PAID, or CANCELLED are locked.
      const lockedStatuses: InvoiceStatus[] = [
        InvoiceStatus.PENDING,
        InvoiceStatus.OVERDUE,
        InvoiceStatus.PAID,
        InvoiceStatus.PARTIALLY_PAID,
        InvoiceStatus.CANCELLED,
      ];

      const isLocked = lockedStatuses.includes(currentInvoice.status);

      // 3. If locked, we only allow status transitions (like to CANCELLED),
      // not editing of content (items, gst, discount, customer).
      if (isLocked) {
        // Only allow status update if no other relevant fields are changing.
        // We compare against the original invoice data (implicitly handled by omission in the update)
        // but we should explicitly check if the caller tried to change content.

        // Items change is detected if any items are passed (simplified check)
        const hasContentChanges =
          (data.customerId && data.customerId !== undefined) ||
          data.gst !== undefined ||
          data.discount !== undefined ||
          (data.items && data.items.length > 0);

        if (hasContentChanges) {
          throw new Error(
            `This invoice is ${currentInvoice.status.toLowerCase()} and its content cannot be modified. Revert to draft first if possible.`,
          );
        }

        // If they only wanted to change status
        if (data.status && data.status !== currentInvoice.status) {
          validateInvoiceStatusTransition(currentInvoice.status, data.status);

          await tx.invoice.update({
            where: { id },
            data: {
              status: data.status,
              updatedAt: new Date(),
            },
          });

          await tx.invoiceStatusHistory.create({
            data: {
              invoiceId: id,
              status: data.status,
              previousStatus: currentInvoice.status,
              changedAt: new Date(),
              notes: `Status updated via edit: ${data.status}`,
            },
          });
        }

        return { id };
      }

      // 4. Regular update for non-locked (DRAFT) invoices
      const statusChanged = currentInvoice.status !== data.status;
      const previousStatus = currentInvoice.status;

      if (statusChanged) {
        validateInvoiceStatusTransition(previousStatus, data.status);
      }

      // Recalculate amountDue
      const amountPaid = Number(currentInvoice.amountPaid);
      const amountDue = totalAmount - amountPaid;

      // Separate existing items from new items
      const existingItems = data.items.filter((item) => item.id);
      const newItems = data.items.filter((item) => !item.id);
      const existingItemIds = existingItems.map((item) => item.id!);

      // Delete items that are no longer in the list
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
          status: data.status || currentInvoice.status,
          amount: totalAmount,
          currency: data.currency,
          issuedDate: data.issuedDate,
          dueDate: data.dueDate,
          notes: data.notes,
          gst: data.gst,
          discount: data.discount,
          amountDue,
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
   * Mark an invoice as pending (revert from OVERDUE or DRAFT status).
   * Validates status transition before updating.
   * Typically used when extending due dates or correcting status.
   * @param id - The unique identifier of the invoice
   * @param changedBy - Optional user ID who triggered this change
   * @returns A promise that resolves to the updated invoice with details, or null if not found
   * @throws {Error} If the status transition is invalid (e.g., cannot revert from PAID)
   */
  async markAsPending(id: string, changedBy?: string): Promise<InvoiceWithDetails | null> {
    // Get current invoice to validate status transition
    const currentInvoice = await this.prisma.invoice.findUnique({
      where: { id, deletedAt: null },
      select: { status: true },
    });

    if (!currentInvoice) {
      return null;
    }

    // Validate status transition
    validateInvoiceStatusTransition(currentInvoice.status, InvoiceStatus.PENDING);

    const updated = await this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.update({
        where: { id, deletedAt: null },
        data: {
          status: InvoiceStatus.PENDING,
          updatedAt: new Date(),
        },
      });

      await tx.invoiceStatusHistory.create({
        data: {
          invoiceId: id,
          status: InvoiceStatus.PENDING,
          previousStatus: currentInvoice.status,
          changedAt: new Date(),
          changedBy,
          notes: 'Marked as pending',
        },
      });

      return invoice;
    });

    if (!updated) {
      return null;
    }

    return this.findByIdWithDetails(updated.id);
  }

  /**
   * Revert an invoice to draft status.
   * Only possible from PENDING or OVERDUE status.
   * @param id - The unique identifier of the invoice
   * @param changedBy - Optional user ID who triggered this change
   * @returns A promise that resolves to the updated invoice with details, or null if not found
   */
  async markAsDraft(id: string, changedBy?: string): Promise<InvoiceWithDetails | null> {
    const currentInvoice = await this.prisma.invoice.findUnique({
      where: { id, deletedAt: null },
      select: { status: true },
    });

    if (!currentInvoice) {
      return null;
    }

    validateInvoiceStatusTransition(currentInvoice.status, InvoiceStatus.DRAFT);

    const updated = await this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.update({
        where: { id, deletedAt: null },
        data: {
          status: InvoiceStatus.DRAFT,
          updatedAt: new Date(),
        },
      });

      await tx.invoiceStatusHistory.create({
        data: {
          invoiceId: id,
          status: InvoiceStatus.DRAFT,
          previousStatus: currentInvoice.status,
          changedAt: new Date(),
          changedBy,
          notes: 'Reverted to draft',
        },
      });

      return invoice;
    });

    if (!updated) {
      return null;
    }

    return this.findByIdWithDetails(updated.id);
  }

  /**
   * Cancel an invoice with a reason and date.
   * Validates status transition before updating (PAID invoices cannot be cancelled).
   * Cancelled invoices are in a terminal state and cannot be changed.
   * @param id - The unique identifier of the invoice
   * @param cancelledDate - The date the invoice was cancelled
   * @param cancelReason - The reason for cancellation (required for audit purposes)
   * @param changedBy - Optional user ID who triggered this change
   * @returns A promise that resolves to the updated invoice with details, or null if not found
   * @throws {Error} If the status transition is invalid (e.g., trying to cancel PAID invoice)
   */
  async cancel(
    id: string,
    cancelledDate: Date,
    cancelReason: string,
    changedBy?: string,
  ): Promise<InvoiceWithDetails | null> {
    // Get current invoice to validate status transition
    const currentInvoice = await this.prisma.invoice.findUnique({
      where: { id, deletedAt: null },
      select: { status: true },
    });

    if (!currentInvoice) {
      return null;
    }

    // Validate status transition
    validateInvoiceStatusTransition(currentInvoice.status, InvoiceStatus.CANCELLED);

    const updated = await this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.update({
        where: { id, deletedAt: null },
        data: {
          status: InvoiceStatus.CANCELLED,
          cancelledDate,
          cancelReason,
          updatedAt: new Date(),
        },
      });

      await tx.invoiceStatusHistory.create({
        data: {
          invoiceId: id,
          status: InvoiceStatus.CANCELLED,
          previousStatus: currentInvoice.status,
          changedAt: new Date(),
          changedBy,
          notes: `Cancelled: ${cancelReason}`,
        },
      });

      return invoice;
    });

    return this.findByIdWithDetails(updated.id);
  }

  /**
   * Increment the remindersSent counter for an invoice.
   * @param id - The unique identifier of the invoice
   * @returns A promise that resolves to the updated invoice, or null if not found
   */
  async incrementReminderCount(id: string): Promise<Invoice | null> {
    const invoice = await this.findById(id);

    if (!invoice) {
      return null;
    }

    return this.prisma.invoice.update({
      where: { id },
      data: {
        remindersSent: (invoice.remindersSent ?? 0) + 1,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Soft delete an invoice by setting the deletedAt timestamp.
   * Only DRAFT invoices can be deleted. For other statuses, use the cancel method instead.
   * Soft deleted invoices are excluded from normal queries but retained for audit purposes.
   * @param id - The unique identifier of the invoice to soft delete
   * @returns A promise that resolves to true if deletion was successful, false otherwise
   * @throws {Error} If invoice is not found or is not in DRAFT status
   */
  async softDelete(id: string): Promise<boolean> {
    // First check if the invoice exists and is in DRAFT status
    const invoice = await this.prisma.invoice.findUnique({
      where: { id, deletedAt: null },
      select: { status: true },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new Error('Only DRAFT invoices can be deleted. Use cancel for other statuses.');
    }

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
   * Check if an invoice number already exists in the database.
   * Useful for validation and preventing duplicate invoice numbers.
   * @param invoiceNumber - The invoice number to check
   * @param excludeId - Optional invoice ID to exclude from the check (useful for updates)
   * @returns A promise that resolves to true if the invoice number exists, false otherwise
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

  /**
   * Add a payment to an invoice and update its status accordingly.
   * Automatically transitions status from PENDING/OVERDUE to PARTIALLY_PAID or PAID.
   * @param invoiceId - The unique identifier of the invoice
   * @param amount - The payment amount
   * @param method - The payment method used
   * @param date - The date the payment was made
   * @param notes - Optional notes about the payment
   * @param changedBy - Optional user ID who recorded this payment
   * @param idempotencyKey - Optional idempotency key to prevent duplicate payments
   * @returns A promise that resolves to the updated invoice with full details
   * @throws {Error} If the invoice is not found or status transition is invalid
   */
  async addPayment(
    invoiceId: string,
    amount: number,
    method: string,
    date: Date,
    notes?: string,
    changedBy?: string,
    idempotencyKey?: string,
  ): Promise<InvoiceWithDetails> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId, deletedAt: null },
      select: {
        id: true,
        status: true,
        amount: true,
        amountPaid: true,
        receiptNumber: true,
        currency: true, // Added currency to select for notes
      },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const previousStatus = invoice.status;
    const newAmountPaid = Number(invoice.amountPaid) + amount;
    const newAmountDue = Number(invoice.amount) - newAmountPaid;

    // Determine new status
    let newStatus = invoice.status;
    if (newAmountDue <= INVOICE_CONFIG.PAYMENT_TOLERANCE) {
      // Floating point tolerance
      newStatus = InvoiceStatus.PAID;
    } else if (newAmountDue > 0 && newAmountPaid > 0) {
      newStatus = InvoiceStatus.PARTIALLY_PAID;
    }

    const statusChanged = previousStatus !== newStatus;

    // Validate status transition if status is changing
    if (statusChanged) {
      validateInvoiceStatusTransition(previousStatus, newStatus);
    }

    // Generate receipt number if invoice will be fully paid and doesn't have one yet
    let receiptNumber = invoice.receiptNumber;
    if (newStatus === InvoiceStatus.PAID && !receiptNumber) {
      receiptNumber = await this.generateReceiptNumber();
    }

    // Transaction to create payment and update invoice
    await this.prisma.$transaction(async (tx) => {
      // Check for existing payment with same idempotency key
      if (idempotencyKey) {
        const existingPayment = await tx.payment.findUnique({
          where: { idempotencyKey },
        });

        if (existingPayment) {
          // Payment already recorded, just return early from transaction
          return;
        }
      }

      await tx.payment.create({
        data: {
          invoiceId,
          amount,
          method,
          date,
          notes,
          idempotencyKey,
        },
      });

      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          amountPaid: newAmountPaid,
          amountDue: newAmountDue,
          status: newStatus,
          updatedAt: new Date(),
          // If fully paid, set paidDate, paymentMethod, and receiptNumber
          ...(newStatus === InvoiceStatus.PAID
            ? {
                paidDate: date,
                paymentMethod: method,
                receiptNumber,
              }
            : {}),
        },
      });

      // Create status history entry
      await tx.invoiceStatusHistory.create({
        data: {
          invoiceId,
          status: newStatus,
          previousStatus,
          changedAt: new Date(),
          changedBy,
          notes: `Payment of ${amount} ${invoice.currency} received. ${newStatus === InvoiceStatus.PAID ? 'Invoice fully paid.' : 'Invoice partially paid.'}`,
        },
      });
    });

    const updated = await this.findByIdWithDetails(invoiceId);
    if (!updated) {
      throw new Error('Failed to retrieve updated invoice');
    }

    return updated;
  }

  /**
   * Update the status of multiple invoices in bulk with proper validation and audit trail.
   * Validates each status transition and creates history entries for successful updates.
   * Skips invoices with invalid transitions instead of failing the entire operation.
   * @param ids - Array of invoice IDs to update
   * @param status - The new status to set for all invoices
   * @param changedBy - Optional user ID who triggered this change
   * @returns A promise that resolves to results array with success/failure for each invoice
   */
  async bulkUpdateStatus(
    ids: string[],
    status: InvoiceStatus,
    changedBy?: string,
  ): Promise<{ id: string; success: boolean; error?: string }[]> {
    return this.prisma.$transaction(async (tx) => {
      const results: { id: string; success: boolean; error?: string }[] = [];

      for (const id of ids) {
        try {
          // Fetch current invoice status
          const invoice = await tx.invoice.findUnique({
            where: { id, deletedAt: null },
            select: { status: true },
          });

          if (!invoice) {
            results.push({ id, success: false, error: 'Invoice not found' });
            continue;
          }

          // Skip if status is already the target status
          if (invoice.status === status) {
            results.push({ id, success: true });
            continue;
          }

          // Validate status transition
          try {
            validateInvoiceStatusTransition(invoice.status, status);
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Invalid status transition';
            results.push({ id, success: false, error: errorMessage });
            continue;
          }

          // Update invoice status
          await tx.invoice.update({
            where: { id },
            data: {
              status,
              updatedAt: new Date(),
            },
          });

          // Create audit trail entry
          await tx.invoiceStatusHistory.create({
            data: {
              invoiceId: id,
              status,
              previousStatus: invoice.status,
              changedAt: new Date(),
              changedBy,
              notes: 'Bulk status update',
            },
          });

          results.push({ id, success: true });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          results.push({ id, success: false, error: errorMessage });
        }
      }

      return results;
    });
  }

  /**
   * Duplicate an existing invoice creating a new DRAFT invoice.
   * Copies all invoice details and items but resets payment-related fields.
   * The new invoice gets a fresh invoice number and starts in DRAFT status.
   * @param id - The unique identifier of the invoice to duplicate
   * @returns A promise that resolves to an object with the new invoice ID and number
   * @throws {Error} If the source invoice is not found
   */
  async duplicate(id: string): Promise<{ id: string; invoiceNumber: string }> {
    // Get the original invoice with all details
    const original = await this.prisma.invoice.findUnique({
      where: { id, deletedAt: null },
      include: {
        items: {
          select: {
            description: true,
            quantity: true,
            unitPrice: true,
            total: true,
            productId: true,
          },
        },
      },
    });

    if (!original) {
      throw new Error('Invoice not found');
    }

    // Generate new invoice number
    const invoiceNumber = await this.generateInvoiceNumber();

    // Calculate total amount from items
    const totalAmount = Number(original.amount);

    // Set issued date to today and due date based on config
    const issuedDate = new Date();
    const dueDate = new Date(issuedDate);
    dueDate.setDate(dueDate.getDate() + INVOICE_CONFIG.DEFAULT_DUE_DAYS);

    // Create the duplicate invoice with DRAFT status
    const duplicate = await this.prisma.invoice.create({
      data: {
        invoiceNumber,
        customerId: original.customerId,
        status: InvoiceStatus.DRAFT,
        amount: totalAmount,
        amountDue: totalAmount,
        amountPaid: 0,
        currency: original.currency,
        gst: original.gst,
        discount: original.discount,
        issuedDate,
        dueDate,
        notes: original.notes,
        remindersSent: 0,
        // Reset payment-related fields
        paidDate: null,
        paymentMethod: null,
        receiptNumber: null,
        cancelledDate: null,
        cancelReason: null,
        // Copy items
        items: {
          create: original.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
            productId: item.productId,
          })),
        },
      },
      select: {
        id: true,
        invoiceNumber: true,
      },
    });

    return duplicate;
  }
  /**
   * Get monthly revenue trend for the last N months.
   * @param limit - Number of months to retrieve. Defaults to 12.
   */
  async getMonthlyRevenueTrend(limit: number = 12): Promise<RevenueTrend[]> {
    const data = await withDatabaseRetry(() =>
      this.prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT 
          to_char(issued_date, 'Mon') as month,
          extract(month from issued_date) as month_num,
          extract(year from issued_date) as year,
          SUM(amount::numeric)::float as total,
          SUM(CASE WHEN status::text = ${InvoiceStatus.PAID} THEN amount::numeric ELSE 0 END)::float as paid
        FROM invoices
        WHERE deleted_at IS NULL
        GROUP BY year, month_num, month
        ORDER BY year DESC, month_num DESC
        LIMIT ${limit}
      `),
    );

    return data
      .map((item) => ({
        month: `${item.month} ${item.year}`,
        total: item.total,
        paid: item.paid,
      }))
      .reverse();
  }

  /**
   * Get top customers by outstanding balance.
   * @param limit - Number of debtors to retrieve. Defaults to 5.
   */
  async getTopDebtors(limit: number = 5): Promise<TopCustomerDebtor[]> {
    const data = await withDatabaseRetry(() =>
      this.prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT 
          c.id as "customerId",
          concat(c.first_name, ' ', c.last_name) as "customerName",
          SUM(i.amount::numeric - COALESCE((SELECT SUM(amount::numeric) FROM payments p WHERE p.invoice_id = i.id), 0))::float as "amountDue",
          COUNT(i.id)::int as "invoiceCount"
        FROM invoices i
        JOIN customers c ON i.customer_id = c.id
        WHERE i.deleted_at IS NULL 
        AND i.status::text IN (${InvoiceStatus.PENDING}, ${InvoiceStatus.OVERDUE}, ${InvoiceStatus.PARTIALLY_PAID})
        GROUP BY c.id, "customerName"
        ORDER BY "amountDue" DESC
        LIMIT ${limit}
      `),
    );

    return data.map((item) => ({
      customerId: item.customerId,
      customerName: item.customerName,
      amountDue: item.amountDue,
      invoiceCount: item.invoiceCount,
    }));
  }
}

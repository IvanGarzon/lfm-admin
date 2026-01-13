import { Prisma, PrismaClient, QuoteStatus } from '@/prisma/client';
import { BaseRepository, type ModelDelegateOperations } from '@/lib/baseRepository';
import { isPrismaError } from '@/lib/error-handler';

import type {
  QuoteListItem,
  QuoteStatistics,
  QuoteWithDetails,
  QuoteFilters,
  QuotePagination,
  QuoteValueTrend,
  TopCustomerByQuotedValue,
  ConversionFunnelData,
  AverageTimeToDecision,
  StatsDateFilter,
} from '@/features/finances/quotes/types';
import { getPaginationMetadata } from '@/lib/utils';
import { validateQuoteStatusTransition } from '@/features/finances/quotes/utils/quote-helpers';

import { type CreateQuoteInput, type UpdateQuoteInput } from '@/schemas/quotes';

/**
 * Quote Repository
 * Handles all database operations for quotes
 * Extends BaseRepository for common CRUD operations
 */
export class QuoteRepository extends BaseRepository<Prisma.QuoteGetPayload<object>> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected get model(): ModelDelegateOperations<Prisma.QuoteGetPayload<object>> {
    return this.prisma.quote as unknown as ModelDelegateOperations<Prisma.QuoteGetPayload<object>>;
  }

  /**
   * Search and paginate quotes with filters.
   * Only returns the latest versions of quotes (quotes without child versions).
   *
   * @param params - The filter parameters including search text, status filters, pagination, and sorting options
   * @returns A promise that resolves to a paginated list of quotes with customer information and counts
   *
   * @example
   * ```ts
   * const results = await quoteRepo.searchAndPaginate({
   *   search: 'John Doe',
   *   status: ['SENT', 'ACCEPTED'],
   *   page: 1,
   *   perPage: 20,
   *   sort: [{ id: 'issuedDate', desc: true }]
   * });
   * ```
   */
  async searchAndPaginate(params: QuoteFilters): Promise<QuotePagination> {
    const { search, status, page, perPage, sort } = params;

    const whereClause: Prisma.QuoteWhereInput = {
      deletedAt: null,
      isLatestVersion: true,
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
        { quoteNumber: searchFilter },
        {
          customer: {
            OR: [{ firstName: searchFilter }, { lastName: searchFilter }, { email: searchFilter }],
          },
        },
      ];
    }

    const skip = page > 0 ? perPage * (page - 1) : 0;

    const orderBy: Prisma.QuoteOrderByWithRelationInput[] =
      sort && sort.length > 0
        ? sort.map((sortItem) => {
            const order: Prisma.SortOrder = sortItem.desc ? 'desc' : 'asc';
            if (sortItem.id === 'customer') {
              return { customer: { firstName: order } };
            }

            if (sortItem.id === 'search') {
              return { quoteNumber: order };
            }

            return { [sortItem.id]: order };
          })
        : [{ quoteNumber: 'desc' }];

    const countOperation = this.prisma.quote.count({ where: whereClause });
    const findManyOperation = this.prisma.quote.findMany({
      where: whereClause,
      select: {
        id: true,
        quoteNumber: true,
        customerId: true,
        status: true,
        amount: true,
        currency: true,
        issuedDate: true,
        validUntil: true,
        versionNumber: true,
        parentQuoteId: true,
        gst: true,
        discount: true,
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

    // Run count and query in parallel without transaction
    // These are read-only operations so transaction isn't necessary
    const [totalItems, quotes] = await Promise.all([countOperation, findManyOperation]);

    const items: QuoteListItem[] = quotes.map((quote) => ({
      id: quote.id,
      quoteNumber: quote.quoteNumber,
      customerId: quote.customerId,
      customerName: `${quote.customer.firstName} ${quote.customer.lastName}`,
      customerEmail: quote.customer.email,
      status: quote.status,
      amount: Number(quote.amount),
      gst: Number(quote.gst),
      discount: Number(quote.discount),
      currency: quote.currency,
      issuedDate: quote.issuedDate,
      validUntil: quote.validUntil,
      itemCount: quote._count.items,
      versionNumber: quote.versionNumber,
      parentQuoteId: quote.parentQuoteId,
    }));

    return {
      items,
      pagination: getPaginationMetadata(totalItems, perPage, page),
    };
  }

  /**
   * Find a quote by its ID with complete details including customer, items, attachments, and status history.
   * Only returns non-deleted quotes.
   *
   * @param id - The unique identifier of the quote
   * @returns A promise that resolves to the quote with all details, or null if not found
   */
  async findByIdWithDetails(id: string): Promise<QuoteWithDetails | null> {
    const quote = await this.prisma.quote.findUnique({
      where: { id, deletedAt: null },
      select: {
        id: true,
        quoteNumber: true,
        status: true,
        amount: true,
        currency: true,
        gst: true,
        discount: true,
        issuedDate: true,
        validUntil: true,
        invoiceId: true,
        notes: true,
        terms: true,
        versionNumber: true,
        parentQuoteId: true,
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
            quoteId: true,
            description: true,
            quantity: true,
            unitPrice: true,
            total: true,
            productId: true,
            notes: true,
            order: true,
            colors: true,
            createdAt: true,
            attachments: {
              select: {
                id: true,
                quoteItemId: true,
                fileName: true,
                fileSize: true,
                mimeType: true,
                s3Key: true,
                s3Url: true,
                uploadedBy: true,
                uploadedAt: true,
              },
              orderBy: { uploadedAt: 'desc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            statusHistory: true,
          },
        },
      },
    });

    if (!quote) {
      return null;
    }

    // Get versions count
    const versionsCount = await this.countQuoteVersions(id);

    return {
      ...quote,
      amount: Number(quote.amount),
      gst: Number(quote.gst),
      discount: Number(quote.discount),
      notes: quote.notes ?? undefined,
      terms: quote.terms ?? undefined,
      versionsCount,
      items: quote.items.map((item) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
      })),
    };
  }

  /**
   * Find status history for a specific quote
   * @param quoteId - The ID of the quote
   * @returns A promise that resolves to an array of status history items
   */
  async findQuoteStatusHistory(quoteId: string) {
    return this.prisma.quoteStatusHistory.findMany({
      where: { quoteId },
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
            avatarUrl: true,
          },
        },
        notes: true,
      },
      orderBy: { updatedAt: 'asc' },
    });
  }

  /**
   * Get comprehensive statistics about quotes including counts by status, total values, and conversion rates.
   * Only counts the latest versions of quotes (quotes without child versions).
   *
   * @param dateFilter - Optional date range filter for the statistics
   * @param dateFilter.startDate - The start date (inclusive) for filtering quotes
   * @param dateFilter.endDate - The end date (inclusive) for filtering quotes
   * @returns A promise that resolves to statistics object with counts, values, and conversion rate
   */
  async getStatistics(dateFilter?: { startDate?: Date; endDate?: Date }): Promise<QuoteStatistics> {
    const whereClause: Prisma.QuoteWhereInput = {
      deletedAt: null,
      // Only count latest versions
      isLatestVersion: true,
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

    // OPTIMIZED: Use only 2 queries instead of 6
    const [statusGroupsWithSums, aggregateData] = await Promise.all([
      // Query 1: Group by status with counts AND sums in a single query
      this.prisma.quote.groupBy({
        by: ['status'],
        where: whereClause,
        _count: {
          _all: true,
        },
        _sum: {
          amount: true,
        },
      }),

      // Query 2: Get total count and average in a single aggregate query
      this.prisma.quote.aggregate({
        where: whereClause,
        _count: {
          _all: true,
        },
        _avg: {
          amount: true,
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    // Initialize stats with totals from aggregate
    const stats: QuoteStatistics = {
      total: aggregateData._count._all,
      draft: 0,
      sent: 0,
      onHold: 0,
      accepted: 0,
      rejected: 0,
      expired: 0,
      cancelled: 0,
      converted: 0,
      totalQuotedValue: Number(aggregateData._sum.amount ?? 0),
      totalAcceptedValue: 0,
      totalConvertedValue: 0,
      conversionRate: 0,
      avgQuoteValue: Number(aggregateData._avg.amount ?? 0),
    };

    // Map status counts and sums from grouped data
    statusGroupsWithSums.forEach((group) => {
      const count = group._count._all;
      const sum = Number(group._sum.amount ?? 0);

      switch (group.status) {
        case QuoteStatus.DRAFT:
          stats.draft = count;
          break;
        case QuoteStatus.SENT:
          stats.sent = count;
          break;
        case QuoteStatus.ON_HOLD:
          stats.onHold = count;
          break;
        case QuoteStatus.ACCEPTED:
          stats.accepted = count;
          stats.totalAcceptedValue = sum;
          break;
        case QuoteStatus.REJECTED:
          stats.rejected = count;
          break;
        case QuoteStatus.EXPIRED:
          stats.expired = count;
          break;
        case QuoteStatus.CANCELLED:
          stats.cancelled = count;
          break;
        case QuoteStatus.CONVERTED:
          stats.converted = count;
          stats.totalConvertedValue = sum;
          break;
      }
    });

    // Calculate conversion rate after status counts are populated
    // Conversion rate = accepted / (all quotes that were sent to customers)
    const totalSentQuotes =
      stats.sent + stats.accepted + stats.rejected + stats.expired + stats.converted;
    stats.conversionRate = totalSentQuotes > 0 ? (stats.accepted / totalSentQuotes) * 100 : 0;

    return stats;
  }

  /**
   * Create a new quote with its items in a single transaction.
   * Automatically generates a quote number, calculates total amount, and creates initial status history.
   * Implements retry logic to handle race conditions in quote number generation.
   *
   * @param data - The quote data including customer, items, dates, and financial details
   * @param createdBy - Optional ID of the user creating the quote (for audit trail)
   * @returns A promise that resolves to an object containing the new quote's ID and generated quote number
   *
   * @throws {Error} If the transaction fails, validation errors occur, or unique quote number cannot be generated after 3 attempts
   */
  async createQuoteWithItems(
    data: CreateQuoteInput,
    createdBy?: string,
  ): Promise<{ id: string; quoteNumber: string }> {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        // Generate quote number
        const quoteNumber = await this.generateQuoteNumber();

        // Calculate total amount
        const totalAmount = data.items.reduce(
          (sum, item) => sum + item.quantity * item.unitPrice,
          0,
        );

        const createdDate = new Date();

        // Create quote and initial status history in a transaction
        return await this.prisma.$transaction(async (tx) => {
          const quote = await tx.quote.create({
            data: {
              quoteNumber,
              customerId: data.customerId,
              status: data.status,
              amount: totalAmount,
              currency: data.currency,
              gst: data.gst,
              discount: data.discount,
              issuedDate: data.issuedDate,
              validUntil: data.validUntil,
              notes: data.notes ?? null,
              terms: data.terms ?? null,
              items: {
                create: data.items.map((item, index) => ({
                  description: item.description,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  total: item.quantity * item.unitPrice,
                  productId: item.productId,
                  order: index,
                })),
              },
            },
            select: {
              id: true,
              quoteNumber: true,
            },
          });

          // Create initial status history entry
          await tx.quoteStatusHistory.create({
            data: {
              quoteId: quote.id,
              status: data.status,
              previousStatus: null,
              updatedAt: createdDate,
              updatedBy: createdBy,
              notes: 'Quote created',
            },
          });

          return quote;
        });
      } catch (error: unknown) {
        // Type narrow first, then check the code property
        // Handle unique constraint violation (invoice number collision)
        if (isPrismaError(error) && error.code === 'P2002') {
          attempts++;
          if (attempts === maxAttempts) {
            throw new Error('Failed to generate a unique quote number. Please try again.');
          }
          continue; // Retry with a new number
        }

        // Re-throw other errors
        throw error;
      }
    }

    throw new Error('Failed to create quote');
  }

  /**
   * Update an existing quote and its items in a single transaction.
   * Handles adding new items, updating existing items, and removing deleted items.
   * Validates status transitions and creates status history when status changes.
   *
   * @param id - The ID of the quote to update
   * @param data - The updated quote data including items
   * @param updatedBy - Optional ID of the user updating the quote (for audit trail)
   * @returns A promise that resolves to the updated quote with full details, or null if quote not found
   *
   * @throws {Error} If the status transition is invalid or the transaction fails
   */
  async updateQuoteWithItems(
    id: string,
    data: UpdateQuoteInput,
    updatedBy?: string,
  ): Promise<QuoteWithDetails | null> {
    // Calculate total amount
    const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const gstPercentage = Number(data.gst || 0);
    const gstAmount = (subtotal * gstPercentage) / 100;
    const totalAmount = subtotal + gstAmount - Number(data.discount || 0);

    // Update quote with items in a transaction
    const updatedQuote = await this.prisma.$transaction(async (tx) => {
      // Get current quote to check for status changes
      const currentQuote = await tx.quote.findUnique({
        where: { id },
        select: { status: true },
      });

      if (!currentQuote) {
        throw new Error('Quote not found');
      }

      const statusChanged = currentQuote.status !== data.status;
      const previousStatus = currentQuote.status;

      // Validate status transition if status is changing
      if (statusChanged) {
        validateQuoteStatusTransition(previousStatus, data.status);
      }

      // Separate existing items from new items
      const existingItems = data.items.filter((item) => item.id);
      const newItems = data.items.filter((item) => !item.id);
      const existingItemIds = existingItems.map((item) => item.id!);

      // Delete items that are no longer in the list (preserves attachments for kept items)
      await tx.quoteItem.deleteMany({
        where: {
          quoteId: data.id,
          id: { notIn: existingItemIds },
        },
      });

      // Update the quote
      const quote = await tx.quote.update({
        where: { id },
        data: {
          customerId: data.customerId,
          status: data.status,
          amount: totalAmount,
          currency: data.currency,
          gst: data.gst,
          discount: data.discount,
          issuedDate: data.issuedDate,
          validUntil: data.validUntil,
          notes: data.notes ?? null,
          terms: data.terms ?? null,
          updatedAt: new Date(),
        },
      });

      // Create status history entry if status changed
      if (statusChanged) {
        await tx.quoteStatusHistory.create({
          data: {
            quoteId: id,
            status: data.status,
            previousStatus,
            updatedAt: new Date(),
            updatedBy: updatedBy,
            notes: 'Status updated via quote edit',
          },
        });
      }

      // Update existing items
      for (let index = 0; index < existingItems.length; index++) {
        const item = existingItems[index];
        await tx.quoteItem.update({
          where: { id: item.id },
          data: {
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
            productId: item.productId,
            order: data.items.findIndex((i) => i.id === item.id),
            updatedAt: new Date(),
          },
        });
      }

      // Create new items
      if (newItems.length > 0) {
        await tx.quoteItem.createMany({
          data: newItems.map((item) => {
            const index = data.items.findIndex((i) => i === item);
            return {
              quoteId: data.id,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.quantity * item.unitPrice,
              productId: item.productId,
              order: index,
            };
          }),
        });
      }

      return quote;
    });

    if (!updatedQuote) {
      return null;
    }

    return await this.findByIdWithDetails(updatedQuote.id);
  }

  /**
   * Generate a unique quote number based on the current year.
   * Format: QUO-YYYY-NNNN (e.g., QUO-2025-0001)
   *
   * @returns A promise that resolves to the next available quote number for the current year
   */
  async generateQuoteNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `QUO-${year}-`;

    const lastQuote = await this.prisma.quote.findFirst({
      where: {
        quoteNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        quoteNumber: 'desc',
      },
      select: {
        quoteNumber: true,
      },
    });

    if (!lastQuote) {
      return `${prefix}0001`;
    }

    const lastNumber = parseInt(lastQuote.quoteNumber.split('-')[2], 10);
    const nextNumber = lastNumber + 1;

    return `${prefix}${String(nextNumber).padStart(4, '0')}`;
  }

  /**
   * Mark a quote as accepted by the customer.
   * Validates the status transition and creates a status history entry in a transaction.
   *
   * @param id - The ID of the quote to mark as accepted
   * @param updatedBy - Optional ID of the user who marked the quote as accepted (for audit trail)
   * @returns A promise that resolves to the updated quote with full details, or null if quote not found
   *
   * @throws {Error} If the status transition is invalid (e.g., cannot accept a cancelled quote)
   */
  async markAsAccepted(id: string, updatedBy?: string): Promise<QuoteWithDetails | null> {
    // Get current status before update
    const quote = await this.prisma.quote.findUnique({
      where: { id, deletedAt: null },
      select: { status: true },
    });

    if (!quote) {
      return null;
    }

    const previousStatus = quote.status;
    const updatedAt = new Date();

    // Validate status transition
    validateQuoteStatusTransition(previousStatus, QuoteStatus.ACCEPTED);

    // Update quote and create status history in a transaction
    const updated = await this.prisma.$transaction(async (tx) => {
      // Update quote status
      const updatedQuote = await tx.quote.update({
        where: { id, deletedAt: null },
        data: {
          status: QuoteStatus.ACCEPTED,
          updatedAt: updatedAt,
        },
      });

      // Create status history entry
      await tx.quoteStatusHistory.create({
        data: {
          quoteId: id,
          status: QuoteStatus.ACCEPTED,
          previousStatus,
          updatedAt,
          updatedBy,
          notes: 'Quote accepted by customer',
        },
      });

      return updatedQuote;
    });

    if (!updated) {
      return null;
    }

    return this.findByIdWithDetails(updated.id);
  }

  /**
   * Mark a quote as on hold.
   * Validates the status transition and creates a status history entry with the optional reason.
   *
   * @param id - The ID of the quote to mark as on hold
   * @param reason - Optional reason for putting the quote on hold
   * @param updatedBy - Optional ID of the user who put the quote on hold (for audit trail)
   * @returns A promise that resolves to the updated quote with full details, or null if quote not found
   *
   * @throws {Error} If the status transition is invalid
   */
  async markAsOnHold(
    id: string,
    reason?: string,
    updatedBy?: string,
  ): Promise<QuoteWithDetails | null> {
    // Get current status before update
    const quote = await this.prisma.quote.findUnique({
      where: { id, deletedAt: null },
      select: { status: true },
    });

    if (!quote) {
      return null;
    }

    const previousStatus = quote.status;
    const updatedAt = new Date();

    // Validate status transition
    validateQuoteStatusTransition(previousStatus, QuoteStatus.ON_HOLD);

    // Update quote and create status history in a transaction
    const updated = await this.prisma.$transaction(async (tx) => {
      // Update quote status
      const updatedQuote = await tx.quote.update({
        where: { id, deletedAt: null },
        data: {
          status: QuoteStatus.ON_HOLD,
          updatedAt: updatedAt,
        },
      });

      // Create status history entry
      await tx.quoteStatusHistory.create({
        data: {
          quoteId: id,
          status: QuoteStatus.ON_HOLD,
          previousStatus,
          updatedAt,
          updatedBy,
          notes: reason || 'Quote put on hold by customer',
        },
      });

      return updatedQuote;
    });

    if (!updated) {
      return null;
    }

    return this.findByIdWithDetails(updated.id);
  }

  /**
   * Mark a quote as cancelled.
   * Validates the status transition and creates a status history entry with the optional reason.
   *
   * @param id - The ID of the quote to cancel
   * @param reason - Optional reason for cancelling the quote
   * @param updatedBy - Optional ID of the user who cancelled the quote (for audit trail)
   * @returns A promise that resolves to the updated quote with full details, or null if quote not found
   *
   * @throws {Error} If the status transition is invalid
   */
  async markAsCancelled(
    id: string,
    reason?: string,
    updatedBy?: string,
  ): Promise<QuoteWithDetails | null> {
    // Get current status before update
    const quote = await this.prisma.quote.findUnique({
      where: { id, deletedAt: null },
      select: { status: true },
    });

    if (!quote) {
      return null;
    }

    const previousStatus = quote.status;
    const updatedAt = new Date();

    // Validate status transition
    validateQuoteStatusTransition(previousStatus, QuoteStatus.CANCELLED);

    // Update quote and create status history in a transaction
    const updated = await this.prisma.$transaction(async (tx) => {
      // Update quote status
      const updatedQuote = await tx.quote.update({
        where: { id, deletedAt: null },
        data: {
          status: QuoteStatus.CANCELLED,
          updatedAt: updatedAt,
        },
      });

      // Create status history entry
      await tx.quoteStatusHistory.create({
        data: {
          quoteId: id,
          status: QuoteStatus.CANCELLED,
          previousStatus,
          updatedAt,
          updatedBy,
          notes: reason || 'Quote cancelled',
        },
      });

      return updatedQuote;
    });

    if (!updated) {
      return null;
    }

    return this.findByIdWithDetails(updated.id);
  }

  /**
   * Mark a quote as rejected by the customer.
   * Validates the status transition and creates a status history entry with the rejection reason.
   *
   * @param id - The ID of the quote to mark as rejected
   * @param rejectReason - The reason why the quote was rejected (required)
   * @param updatedBy - Optional ID of the user who marked the quote as rejected (for audit trail)
   * @returns A promise that resolves to the updated quote with full details, or null if quote not found
   *
   * @throws {Error} If the status transition is invalid
   */
  async markAsRejected(
    id: string,
    rejectReason: string,
    updatedBy?: string,
  ): Promise<QuoteWithDetails | null> {
    // Get current status before update
    const quote = await this.prisma.quote.findUnique({
      where: { id, deletedAt: null },
      select: { status: true },
    });

    if (!quote) {
      return null;
    }

    const previousStatus = quote.status;
    const updatedAt = new Date();

    // Validate status transition
    validateQuoteStatusTransition(previousStatus, QuoteStatus.REJECTED);

    // Update quote and create status history in a transaction
    const updated = await this.prisma.$transaction(async (tx) => {
      // Update quote status
      const updatedQuote = await tx.quote.update({
        where: { id, deletedAt: null },
        data: {
          status: QuoteStatus.REJECTED,
          updatedAt: updatedAt,
        },
      });

      // Create status history entry
      await tx.quoteStatusHistory.create({
        data: {
          quoteId: id,
          status: QuoteStatus.REJECTED,
          previousStatus,
          updatedAt,
          updatedBy,
          notes: `Quote rejected by customer${rejectReason ? `: ${rejectReason}` : ''}`,
        },
      });

      return updatedQuote;
    });

    return this.findByIdWithDetails(updated.id);
  }

  /**
   * Mark a quote as sent to the customer.
   * Validates the status transition and creates a status history entry.
   *
   * @param id - The ID of the quote to mark as sent
   * @param updatedBy - Optional ID of the user who sent the quote (for audit trail)
   * @returns A promise that resolves to the updated quote with full details, or null if quote not found
   *
   * @throws {Error} If the status transition is invalid (e.g., cannot send a cancelled quote)
   */
  async markAsSent(id: string, updatedBy?: string): Promise<QuoteWithDetails | null> {
    // Get current status before update
    const quote = await this.prisma.quote.findUnique({
      where: { id, deletedAt: null },
      select: { status: true },
    });

    if (!quote) {
      return null;
    }

    const previousStatus = quote.status;
    const sentDate = new Date();

    // Validate status transition
    validateQuoteStatusTransition(previousStatus, QuoteStatus.SENT);

    // Update quote and create status history in a transaction
    const updated = await this.prisma.$transaction(async (tx) => {
      // Update quote status
      const updatedQuote = await tx.quote.update({
        where: { id, deletedAt: null },
        data: {
          status: QuoteStatus.SENT,
          updatedAt: sentDate,
        },
      });

      // Create status history entry
      await tx.quoteStatusHistory.create({
        data: {
          quoteId: id,
          status: QuoteStatus.SENT,
          previousStatus,
          updatedAt: sentDate,
          updatedBy,
          notes: 'Quote sent to customer',
        },
      });

      return updatedQuote;
    });

    if (!updated) {
      return null;
    }

    return this.findByIdWithDetails(updated.id);
  }

  /**
   * Convert a quote to an invoice in a single transaction.
   * Creates a new invoice with PENDING status, updates the quote status to CONVERTED,
   * and creates a status history entry. All quote items are copied to the invoice.
   *
   * @param quoteId - The ID of the quote to convert
   * @param invoiceData - The invoice-specific data
   * @param invoiceData.invoiceNumber - The pre-generated invoice number to use
   * @param invoiceData.gst - The GST/tax amount for the invoice
   * @param invoiceData.discount - The discount amount for the invoice
   * @param invoiceData.dueDate - The payment due date for the invoice
   * @param updatedBy - Optional ID of the user who performed the conversion (for audit trail)
   * @returns A promise that resolves to an object containing the new invoice's ID and number
   *
   * @throws {Error} If the quote is not found or the status transition is invalid
   */
  async convertToInvoice(
    quoteId: string,
    invoiceData: {
      invoiceNumber: string;
      gst: number;
      discount: number;
      dueDate: Date;
    },
    updatedBy?: string,
  ): Promise<{ invoiceId: string; invoiceNumber: string }> {
    return this.prisma.$transaction(async (tx) => {
      // Get quote with details
      const quote = await tx.quote.findUnique({
        where: { id: quoteId, deletedAt: null },
        include: {
          items: true,
          customer: true,
        },
      });

      if (!quote) {
        throw new Error('Quote not found');
      }

      const previousStatus = quote.status;
      const convertedDate = new Date();

      // Validate status transition (ACCEPTED -> CONVERTED)
      validateQuoteStatusTransition(previousStatus, QuoteStatus.CONVERTED);

      // Create invoice from quote with PENDING status
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber: invoiceData.invoiceNumber,
          customerId: quote.customerId,
          status: 'PENDING',
          amount: quote.amount,
          currency: quote.currency,
          gst: invoiceData.gst,
          discount: invoiceData.discount,
          issuedDate: new Date(),
          dueDate: invoiceData.dueDate,
          notes: quote.notes,
          items: {
            create: quote.items.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.total,
              productId: item.productId,
            })),
          },
        },
      });

      // Update quote status
      await tx.quote.update({
        where: { id: quoteId },
        data: {
          status: QuoteStatus.CONVERTED,
          invoiceId: invoice.id,
        },
      });

      // Create status history entry
      await tx.quoteStatusHistory.create({
        data: {
          quoteId: quoteId,
          status: QuoteStatus.CONVERTED,
          previousStatus,
          updatedAt: convertedDate,
          updatedBy: updatedBy,
          notes: `Quote converted to invoice ${invoice.invoiceNumber}`,
        },
      });

      return { invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber };
    });
  }

  /**
   * Check for quotes that have passed their validity date and automatically expire them.
   * Only checks quotes with DRAFT or SENT status. Each quote is updated in its own transaction
   * with a status history entry.
   *
   * @returns A promise that resolves to the number of quotes that were expired
   */
  async checkAndExpireQuotes(): Promise<number> {
    const today = new Date();

    // Find quotes that need to be expired
    const quotesToExpire = await this.prisma.quote.findMany({
      where: {
        status: {
          in: [QuoteStatus.DRAFT, QuoteStatus.SENT],
        },
        validUntil: { lt: today },
        deletedAt: null,
      },
      select: {
        id: true,
        status: true,
        validUntil: true,
      },
    });

    // Update each quote and create status history
    let expiredCount = 0;
    for (const quote of quotesToExpire) {
      await this.prisma.$transaction(async (tx) => {
        // Update quote status
        await tx.quote.update({
          where: { id: quote.id },
          data: {
            status: QuoteStatus.EXPIRED,
            updatedAt: new Date(),
          },
        });

        // Create status history entry
        await tx.quoteStatusHistory.create({
          data: {
            quoteId: quote.id,
            status: QuoteStatus.EXPIRED,
            previousStatus: quote.status,
            updatedAt: quote.validUntil,
            updatedBy: null, // System-initiated
            notes: 'Quote expired automatically',
          },
        });

        expiredCount++;
      });
    }

    return expiredCount;
  }

  /**
   * Soft delete a quote by setting its deletedAt timestamp.
   * The quote is not permanently removed from the database and can potentially be restored.
   *
   * @param id - The ID of the quote to soft delete
   * @returns A promise that resolves to true if the quote was deleted, false otherwise
   */
  async softDelete(id: string): Promise<boolean> {
    const result = await this.prisma.quote.update({
      where: { id, deletedAt: null },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return result !== null;
  }

  /**
   * Get the count of all versions in a quote's version chain.
   *
   * @param quoteId - The ID of any quote in the version chain (can be root or child version)
   * @returns A promise that resolves to the total number of versions in the chain
   */
  async countQuoteVersions(quoteId: string): Promise<number> {
    // First, get the quote to determine if it has a parent or is the root
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId, deletedAt: null },
      select: { id: true, parentQuoteId: true },
    });

    if (!quote) {
      return 0;
    }

    // Determine the root quote ID (either the parent or the quote itself)
    const rootQuoteId = quote.parentQuoteId || quoteId;

    // Count all versions (root + all children)
    const count = await this.prisma.quote.count({
      where: {
        OR: [{ id: rootQuoteId }, { parentQuoteId: rootQuoteId }],
        deletedAt: null,
      },
    });

    return count;
  }

  /**
   * Get all versions of a quote in the version chain.
   * Returns the root quote and all its child versions, ordered by version number.
   *
   * @param quoteId - The ID of any quote in the version chain (can be root or child version)
   * @returns A promise that resolves to an array of quote versions with basic information
   */
  async getQuoteVersions(quoteId: string) {
    // First, get the quote to determine if it has a parent or is the root
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId, deletedAt: null },
      select: { id: true, parentQuoteId: true },
    });

    if (!quote) {
      return [];
    }

    // Determine the root quote ID (either the parent or the quote itself)
    const rootQuoteId = quote.parentQuoteId || quoteId;

    // Fetch all versions (root + all children)
    const versions = await this.prisma.quote.findMany({
      where: {
        OR: [{ id: rootQuoteId }, { parentQuoteId: rootQuoteId }],
        deletedAt: null,
      },
      select: {
        id: true,
        quoteNumber: true,
        versionNumber: true,
        status: true,
        amount: true,
        issuedDate: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { versionNumber: 'asc' },
    });

    return versions;
  }

  /**
   * Check if a quote number already exists in the database.
   * Useful for validation before creating or updating quotes.
   *
   * @param quoteNumber - The quote number to check
   * @param excludeId - Optional quote ID to exclude from the check (useful when updating)
   * @returns A promise that resolves to true if the quote number exists, false otherwise
   */
  async quoteNumberExists(quoteNumber: string, excludeId?: string): Promise<boolean> {
    const where: Prisma.QuoteWhereInput = {
      quoteNumber,
      deletedAt: null,
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const count = await this.prisma.quote.count({ where });
    return count > 0;
  }

  /**
   * Get all file attachments associated with a specific quote item.
   * Results are ordered by upload date (newest first).
   *
   * @param itemId - The ID of the quote item
   * @returns A promise that resolves to an array of quote item attachments
   */
  async getQuoteItemAttachments(itemId: string) {
    return this.prisma.quoteItemAttachment.findMany({
      where: { quoteItemId: itemId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  /**
   * Create a new attachment record for a quote item.
   * The file should already be uploaded to S3 before calling this method.
   * Typically used for product images or design mockups.
   *
   * @param data - The attachment data including S3 information and file metadata
   * @returns A promise that resolves to the created item attachment record
   */
  async createItemAttachment(data: {
    quoteItemId: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    s3Key: string;
    s3Url: string;
    uploadedBy?: string;
  }) {
    return this.prisma.quoteItemAttachment.create({
      data: {
        quoteItemId: data.quoteItemId,
        fileName: data.fileName,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        s3Key: data.s3Key,
        s3Url: data.s3Url,
        uploadedBy: data.uploadedBy ?? null,
        uploadedAt: new Date(),
      },
    });
  }

  /**
   * Update the notes field for a specific quote item.
   * Useful for adding special instructions or requirements for individual line items.
   *
   * @param quoteItemId - The ID of the quote item to update
   * @param notes - The notes text to set (can be empty string to clear notes)
   * @returns A promise that resolves to the updated quote item
   */
  async updateQuoteItemNotes(quoteItemId: string, notes: string) {
    return this.prisma.quoteItem.update({
      where: { id: quoteItemId },
      data: { notes },
    });
  }

  /**
   * Update the color palette for a specific quote item.
   * Useful for storing product color options or design color schemes.
   *
   * @param quoteItemId - The ID of the quote item to update
   * @param colors - An array of color values (typically hex codes)
   * @returns A promise that resolves to the updated quote item
   */
  async updateQuoteItemColors(quoteItemId: string, colors: string[]) {
    return this.prisma.quoteItem.update({
      where: { id: quoteItemId },
      data: { colors },
    });
  }

  /**
   * Get a single quote item attachment by its ID.
   *
   * @param attachmentId - The ID of the item attachment
   * @returns A promise that resolves to the attachment record, or null if not found
   */
  async getItemAttachmentById(attachmentId: string) {
    return this.prisma.quoteItemAttachment.findUnique({
      where: { id: attachmentId },
    });
  }

  /**
   * Delete a quote item attachment record from the database.
   * Note: This does not delete the file from S3 - that should be handled separately.
   *
   * @param attachmentId - The ID of the item attachment to delete
   * @returns A promise that resolves to true if deletion was successful, false otherwise
   */
  async deleteItemAttachment(attachmentId: string): Promise<boolean> {
    try {
      await this.prisma.quoteItemAttachment.delete({
        where: { id: attachmentId },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Count the total number of attachments for a specific quote item.
   *
   * @param itemId - The ID of the quote item
   * @returns A promise that resolves to the count of item attachments
   */
  async countQuoteItemAttachments(itemId: string): Promise<number> {
    return this.prisma.quoteItemAttachment.count({
      where: { quoteItemId: itemId },
    });
  }

  /**
   * Create a new version of an existing quote in a transaction.
   * Copies all quote data, items, and item attachments to a new quote with incremented version number.
   * The new version starts in DRAFT status, and the parent quote is automatically cancelled.
   * All versions in a chain are linked to the same root parent quote.
   *
   * @param parentQuoteId - The ID of the quote to create a version from
   * @param createdBy - Optional ID of the user creating the version (for audit trail)
   * @returns A promise that resolves to an object containing the new version's ID, quote number, and version number
   *
   * @throws {Error} If the parent quote is not found
   *
   * @example
   * ```ts
   * // Create a new version of quote QUO-2025-0001
   * const newVersion = await quoteRepo.createVersion('quote-id-123', 'user-id-456');
   * // Returns: { id: 'new-id', quoteNumber: 'QUO-2025-0002', versionNumber: 2 }
   * ```
   */
  async createVersion(
    parentQuoteId: string,
    createdBy?: string,
  ): Promise<{ id: string; quoteNumber: string; versionNumber: number }> {
    return this.prisma.$transaction(async (tx) => {
      // Get the parent quote with all details including item attachments
      const parentQuote = await tx.quote.findUnique({
        where: { id: parentQuoteId, deletedAt: null },
        include: {
          items: {
            include: {
              attachments: true,
            },
            orderBy: { order: 'asc' },
          },
        },
      });

      if (!parentQuote) {
        throw new Error('Parent quote not found');
      }

      // Calculate the next version number
      // Get the highest version number in the version chain
      const highestVersionQuote = await tx.quote.findFirst({
        where: {
          OR: [
            { id: parentQuoteId },
            { parentQuoteId: parentQuoteId },
            {
              parentQuoteId: parentQuote.parentQuoteId ? parentQuote.parentQuoteId : undefined,
            },
          ],
          deletedAt: null,
        },
        orderBy: { versionNumber: 'desc' },
        select: { versionNumber: true },
      });

      const nextVersionNumber = (highestVersionQuote?.versionNumber || 1) + 1;

      // Generate a new quote number for the version
      const newQuoteNumber = await this.generateQuoteNumber();

      const createdDate = new Date();

      // Calculate new validUntil date (30 days from now) to ensure it's after issuedDate
      const validUntil = new Date(createdDate);
      validUntil.setDate(validUntil.getDate() + 30);

      // Create the new version
      const newVersion = await tx.quote.create({
        data: {
          quoteNumber: newQuoteNumber,
          customerId: parentQuote.customerId,
          status: QuoteStatus.DRAFT, // New versions start as DRAFT
          amount: parentQuote.amount,
          currency: parentQuote.currency,
          gst: parentQuote.gst,
          discount: parentQuote.discount,
          issuedDate: createdDate,
          validUntil: validUntil,
          notes: parentQuote.notes,
          terms: parentQuote.terms,
          versionNumber: nextVersionNumber,
          parentQuoteId: parentQuote.parentQuoteId || parentQuoteId, // Link to root parent
          items: {
            create: parentQuote.items.map((item, index) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.total,
              productId: item.productId,
              notes: item.notes,
              colors: item.colors,
              order: index,
              attachments: {
                create: item.attachments.map((attachment) => ({
                  fileName: attachment.fileName,
                  fileSize: attachment.fileSize,
                  mimeType: attachment.mimeType,
                  s3Key: attachment.s3Key,
                  s3Url: attachment.s3Url,
                  uploadedBy: createdBy,
                  uploadedAt: createdDate,
                })),
              },
            })),
          },
        },
        select: {
          id: true,
          quoteNumber: true,
          versionNumber: true,
        },
      });

      // Create initial status history entry for the new version
      await tx.quoteStatusHistory.create({
        data: {
          quoteId: newVersion.id,
          status: QuoteStatus.DRAFT,
          previousStatus: null,
          updatedAt: createdDate,
          updatedBy: createdBy,
          notes: `New version created from ${parentQuote.quoteNumber}`,
        },
      });

      // Mark parent quote as CANCELLED and no longer the latest version
      const previousParentStatus = parentQuote.status;
      await tx.quote.update({
        where: { id: parentQuoteId },
        data: {
          status: QuoteStatus.CANCELLED,
          isLatestVersion: false,
          updatedAt: createdDate,
        },
      });

      // Create status history entry for parent quote cancellation
      await tx.quoteStatusHistory.create({
        data: {
          quoteId: parentQuoteId,
          status: QuoteStatus.CANCELLED,
          previousStatus: previousParentStatus,
          updatedAt: createdDate,
          updatedBy: createdBy,
          notes: `Quote cancelled due to new version ${newQuoteNumber} being created`,
        },
      });

      return newVersion;
    });
  }

  // ============================================================================
  // ANALYTICS METHODS
  // ============================================================================

  /**
   * Get monthly quote value trend over the last N months.
   * Returns total quoted value, accepted value, and converted value for each month.
   *
   * @param limit - Number of months to retrieve. Defaults to 12.
   * @returns A promise that resolves to an array of monthly quote value trends
   */
  async getMonthlyQuoteValueTrend(limit: number = 12): Promise<QuoteValueTrend[]> {
    const data = await this.prisma.$queryRaw<
      {
        month: string;
        month_num: number;
        year: number;
        total: number;
        accepted: number;
        converted: number;
      }[]
    >(Prisma.sql`
      SELECT
        to_char(issued_date, 'Mon') as month,
        extract(month from issued_date) as month_num,
        extract(year from issued_date) as year,
        SUM(amount::numeric)::float as total,
        SUM(CASE WHEN status::text = ${QuoteStatus.ACCEPTED} THEN amount::numeric ELSE 0 END)::float as accepted,
        SUM(CASE WHEN status::text = ${QuoteStatus.CONVERTED} THEN amount::numeric ELSE 0 END)::float as converted
      FROM quotes
      WHERE deleted_at IS NULL
        AND is_latest_version = true
      GROUP BY year, month_num, month
      ORDER BY year DESC, month_num DESC
      LIMIT ${limit}
    `);

    return data
      .map((item) => ({
        month: `${item.month} ${item.year}`,
        total: item.total,
        accepted: item.accepted,
        converted: item.converted,
      }))
      .reverse();
  }

  /**
   * Get conversion funnel data showing the flow from sent quotes to converted.
   * Returns counts and values for each stage of the quote lifecycle.
   *
   * @param dateFilter - Optional date range filter
   * @returns A promise that resolves to conversion funnel data
   */
  async getConversionFunnel(dateFilter?: StatsDateFilter): Promise<ConversionFunnelData> {
    const whereClause: Prisma.QuoteWhereInput = {
      deletedAt: null,
      // Only count latest versions
      isLatestVersion: true,
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

    const funnelData = await this.prisma.quote.groupBy({
      by: ['status'],
      where: whereClause,
      _count: {
        _all: true,
      },
      _sum: {
        amount: true,
      },
    });

    const funnel: ConversionFunnelData = {
      sent: 0,
      onHold: 0,
      accepted: 0,
      rejected: 0,
      expired: 0,
      converted: 0,
      sentValue: 0,
      acceptedValue: 0,
      convertedValue: 0,
    };

    funnelData.forEach((item) => {
      const count = item._count._all;
      const value = Number(item._sum.amount ?? 0);

      switch (item.status) {
        case QuoteStatus.SENT:
          funnel.sent = count;
          funnel.sentValue = value;
          break;
        case QuoteStatus.ON_HOLD:
          funnel.onHold = count;
          break;
        case QuoteStatus.ACCEPTED:
          funnel.accepted = count;
          funnel.acceptedValue = value;
          break;
        case QuoteStatus.REJECTED:
          funnel.rejected = count;
          break;
        case QuoteStatus.EXPIRED:
          funnel.expired = count;
          break;
        case QuoteStatus.CONVERTED:
          funnel.converted = count;
          funnel.convertedValue = value;
          break;
      }
    });

    return funnel;
  }

  /**
   * Get top customers by total quoted value.
   * Returns customers with highest total quote value, including conversion metrics.
   *
   * @param limit - Number of customers to retrieve. Defaults to 5.
   * @returns A promise that resolves to an array of top customers with quote metrics
   */
  async getTopCustomersByQuotedValue(limit: number = 5): Promise<TopCustomerByQuotedValue[]> {
    const data = await this.prisma.$queryRaw<
      {
        customerId: string;
        customerName: string;
        totalQuotedValue: number;
        acceptedValue: number;
        quoteCount: number;
      }[]
    >(Prisma.sql`
      SELECT
        c.id as "customerId",
        concat(c.first_name, ' ', c.last_name) as "customerName",
        SUM(q.amount::numeric)::float as "totalQuotedValue",
        SUM(CASE WHEN q.status::text IN (${QuoteStatus.ACCEPTED}, ${QuoteStatus.CONVERTED}) THEN q.amount::numeric ELSE 0 END)::float as "acceptedValue",
        COUNT(q.id)::int as "quoteCount"
      FROM quotes q
      JOIN customers c ON q.customer_id = c.id
      WHERE q.deleted_at IS NULL
        AND q.is_latest_version = true
      GROUP BY c.id, "customerName"
      ORDER BY "totalQuotedValue" DESC
      LIMIT ${limit}
    `);

    return data.map((item) => ({
      customerId: item.customerId,
      customerName: item.customerName,
      totalQuotedValue: item.totalQuotedValue,
      acceptedValue: item.acceptedValue,
      quoteCount: item.quoteCount,
      conversionRate:
        item.totalQuotedValue > 0 ? (item.acceptedValue / item.totalQuotedValue) * 100 : 0,
    }));
  }

  /**
   * Get average time to decision for quotes.
   * Calculates average days from SENT to ACCEPTED or REJECTED.
   *
   * @returns A promise that resolves to average time to decision metrics
   */
  async getAverageTimeToDecision(): Promise<AverageTimeToDecision> {
    // Get quotes that were accepted or rejected, with their status history
    const quotes = await this.prisma.quote.findMany({
      where: {
        deletedAt: null,
        status: {
          in: [QuoteStatus.ACCEPTED, QuoteStatus.REJECTED],
        },
      },
      select: {
        id: true,
        status: true,
        statusHistory: {
          select: {
            status: true,
            updatedAt: true,
          },
          orderBy: {
            updatedAt: 'asc',
          },
        },
      },
    });

    let totalDaysToAccept = 0;
    let acceptCount = 0;
    let totalDaysToReject = 0;
    let rejectCount = 0;

    quotes.forEach((quote) => {
      // Find when it was marked as SENT
      const sentHistory = quote.statusHistory.find((h) => h.status === QuoteStatus.SENT);

      // Find when it was marked as ACCEPTED or REJECTED
      const decisionHistory = quote.statusHistory.find(
        (h) => h.status === QuoteStatus.ACCEPTED || h.status === QuoteStatus.REJECTED,
      );

      if (sentHistory && decisionHistory) {
        const days = Math.ceil(
          (decisionHistory.updatedAt.getTime() - sentHistory.updatedAt.getTime()) /
            (1000 * 60 * 60 * 24),
        );

        if (quote.status === QuoteStatus.ACCEPTED) {
          totalDaysToAccept += days;
          acceptCount++;
        } else {
          totalDaysToReject += days;
          rejectCount++;
        }
      }
    });

    const avgDaysToAccept = acceptCount > 0 ? totalDaysToAccept / acceptCount : 0;
    const avgDaysToReject = rejectCount > 0 ? totalDaysToReject / rejectCount : 0;
    const totalDecisions = acceptCount + rejectCount;
    const avgDaysToDecision =
      totalDecisions > 0 ? (totalDaysToAccept + totalDaysToReject) / totalDecisions : 0;

    return {
      avgDaysToAccept: Math.round(avgDaysToAccept * 10) / 10, // Round to 1 decimal place
      avgDaysToReject: Math.round(avgDaysToReject * 10) / 10,
      avgDaysToDecision: Math.round(avgDaysToDecision * 10) / 10,
    };
  }

  /**
   * Duplicate an existing quote to create an independent copy.
   * Creates a new quote with DRAFT status, copying items (with colors and notes) and attachments.
   * Unlike versioning, the duplicate is completely independent with no parent-child relationship.
   * Useful for reusing quote structures as templates or creating similar quotes for different customers.
   *
   * @param id - The ID of the quote to duplicate
   * @returns A promise that resolves to an object containing the duplicate quote's ID and number
   * @throws {Error} If the quote is not found or duplication fails
   */
  async duplicate(id: string): Promise<{ id: string; quoteNumber: string }> {
    // Get the original quote with all details
    const original = await this.prisma.quote.findUnique({
      where: { id, deletedAt: null },
      include: {
        items: {
          select: {
            description: true,
            quantity: true,
            unitPrice: true,
            total: true,
            productId: true,
            notes: true,
            colors: true,
            order: true,
            attachments: {
              select: {
                fileName: true,
                fileSize: true,
                mimeType: true,
                s3Key: true,
                s3Url: true,
                uploadedBy: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!original) {
      throw new Error('Quote not found');
    }

    // Generate new quote number with retry logic for unique constraint
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const quoteNumber = await this.generateQuoteNumber();

        // Calculate total amount from items
        const totalAmount = Number(original.amount);

        // Set issued date to today and valid until to 30 days from now
        const issuedDate = new Date();
        const validUntil = new Date(issuedDate);
        validUntil.setDate(validUntil.getDate() + 30); // 30 days validity

        // Create the duplicate quote with DRAFT status in a transaction
        const duplicate = await this.prisma.$transaction(async (tx) => {
          const newQuote = await tx.quote.create({
            data: {
              quoteNumber,
              customerId: original.customerId,
              status: QuoteStatus.DRAFT, // Always start as DRAFT
              amount: totalAmount,
              currency: original.currency,
              gst: original.gst,
              discount: original.discount,
              issuedDate,
              validUntil,
              notes: original.notes,
              terms: original.terms,
              // Version fields NOT copied - this is an independent quote
              versionNumber: 1,
              parentQuoteId: null,
              // Copy items with colors, notes, and attachments
              items: {
                create: original.items.map((item) => ({
                  description: item.description,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  total: item.total,
                  productId: item.productId,
                  notes: item.notes,
                  colors: item.colors,
                  order: item.order,
                  // Copy attachment references (S3 files not duplicated, just referenced)
                  attachments: {
                    create: item.attachments.map((attachment) => ({
                      fileName: attachment.fileName,
                      fileSize: attachment.fileSize,
                      mimeType: attachment.mimeType,
                      s3Key: attachment.s3Key,
                      s3Url: attachment.s3Url,
                      uploadedBy: attachment.uploadedBy,
                      uploadedAt: new Date(),
                    })),
                  },
                })),
              },
            },
            select: {
              id: true,
              quoteNumber: true,
            },
          });

          // Create initial status history entry
          await tx.quoteStatusHistory.create({
            data: {
              quoteId: newQuote.id,
              status: QuoteStatus.DRAFT,
              previousStatus: null,
              updatedAt: new Date(),
              notes: `Duplicated from quote ${original.quoteNumber}`,
            },
          });

          return newQuote;
        });

        return duplicate;
      } catch (error: unknown) {
        // Handle unique constraint violation (quote number collision)
        if (isPrismaError(error) && error.code === 'P2002') {
          attempts++;
          if (attempts === maxAttempts) {
            throw new Error('Failed to generate a unique quote number. Please try again.');
          }
          continue; // Retry with a new number
        }

        // Re-throw other errors
        throw error;
      }
    }

    throw new Error('Failed to duplicate quote');
  }
  /**
   * Update the status of multiple quotes in bulk with proper validation and audit trail.
   * Validates each status transition and creates history entries for successful updates.
   * Skips quotes with invalid transitions instead of failing the entire operation.
   * @param ids - Array of quote IDs to update
   * @param status - The new status to set for all quotes
   * @param updatedBy - Optional user ID who triggered this change
   * @returns A promise that resolves to results array with success/failure for each quote
   */
  async bulkUpdateStatus(
    ids: string[],
    status: QuoteStatus,
    updatedBy?: string,
  ): Promise<{ id: string; success: boolean; error?: string }[]> {
    return this.prisma.$transaction(async (tx) => {
      const results: { id: string; success: boolean; error?: string }[] = [];

      for (const id of ids) {
        try {
          // Fetch current quote status
          const quote = await tx.quote.findUnique({
            where: { id, deletedAt: null },
            select: { status: true },
          });

          if (!quote) {
            results.push({ id, success: false, error: 'Quote not found' });
            continue;
          }

          // Skip if status is already the target status
          if (quote.status === status) {
            results.push({ id, success: true });
            continue;
          }

          // Validate status transition
          try {
            validateQuoteStatusTransition(quote.status, status);
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Invalid status transition';
            results.push({ id, success: false, error: errorMessage });
            continue;
          }

          // Update quote status
          await tx.quote.update({
            where: { id },
            data: {
              status,
              updatedAt: new Date(),
            },
          });

          // Create audit trail entry
          await tx.quoteStatusHistory.create({
            data: {
              quoteId: id,
              status,
              previousStatus: quote.status,
              updatedAt: new Date(),
              updatedBy,
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
   * Soft delete multiple quotes in bulk.
   * Only deletes quotes that are in DRAFT status.
   * Skips quotes that cannot be deleted instead of failing the entire operation.
   * @param ids - Array of quote IDs to delete
   * @returns A promise that resolves to results array with success/failure for each quote
   */
  async bulkSoftDelete(ids: string[]): Promise<{ id: string; success: boolean; error?: string }[]> {
    return this.prisma.$transaction(async (tx) => {
      const results: { id: string; success: boolean; error?: string }[] = [];

      for (const id of ids) {
        try {
          const quote = await tx.quote.findUnique({
            where: { id, deletedAt: null },
            select: { status: true },
          });

          if (!quote) {
            results.push({ id, success: false, error: 'Quote not found' });
            continue;
          }

          if (quote.status !== QuoteStatus.DRAFT) {
            results.push({
              id,
              success: false,
              error: 'Only DRAFT quotes can be deleted',
            });
            continue;
          }

          await tx.quote.update({
            where: { id },
            data: {
              deletedAt: new Date(),
              updatedAt: new Date(),
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
}

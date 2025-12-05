import { Prisma, PrismaClient } from '@/prisma/client';
import { BaseRepository, type ModelDelegateOperations } from '@/lib/baseRepository';
import { QuoteStatusSchema } from '@/zod/inputTypeSchemas/QuoteStatusSchema';
import { isPrismaError } from '@/lib/error-handler';

import type {
  QuoteListItem,
  QuoteStatistics,
  QuoteWithDetails,
  QuoteFilters,
  QuotePagination,
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
      // Only show latest versions (quotes that don't have any child versions)
      versions: {
        none: {
          deletedAt: null,
        },
      },
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
            attachments: true,
          },
        },
      },
      orderBy,
      skip,
      take: perPage,
    });

    const [totalItems, quotes] = await this.prisma.$transaction([
      countOperation,
      findManyOperation,
    ]);

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
      attachmentCount: quote._count.attachments,
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
        attachments: {
          select: {
            id: true,
            quoteId: true,
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
      },
    });

    if (!quote) {
      return null;
    }

    return {
      ...quote,
      amount: Number(quote.amount),
      gst: Number(quote.gst),
      discount: Number(quote.discount),
      notes: quote.notes ?? undefined,
      terms: quote.terms ?? undefined,
      items: quote.items.map((item) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
      })),
    };
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
      // Only count latest versions (quotes that don't have any child versions)
      versions: {
        none: {
          deletedAt: null,
        },
      },
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
        case QuoteStatusSchema.enum.DRAFT:
          stats.draft = count;
          break;
        case QuoteStatusSchema.enum.SENT:
          stats.sent = count;
          break;
        case QuoteStatusSchema.enum.ON_HOLD:
          stats.onHold = count;
          break;
        case QuoteStatusSchema.enum.ACCEPTED:
          stats.accepted = count;
          stats.totalAcceptedValue = sum;
          break;
        case QuoteStatusSchema.enum.REJECTED:
          stats.rejected = count;
          break;
        case QuoteStatusSchema.enum.EXPIRED:
          stats.expired = count;
          break;
        case QuoteStatusSchema.enum.CANCELLED:
          stats.cancelled = count;
          break;
        case QuoteStatusSchema.enum.CONVERTED:
          stats.converted = count;
          stats.totalConvertedValue = sum;
          break;
      }
    });

    // Calculate conversion rate after status counts are populated
    // Conversion rate = accepted / (all quotes that were sent to customers)
    const totalSentQuotes = stats.sent + stats.accepted + stats.rejected + stats.expired + stats.converted;
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
        const totalAmount = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

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
              changedAt: createdDate,
              changedBy: createdBy,
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
    const totalAmount = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

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
            changedAt: new Date(),
            changedBy: updatedBy,
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
   * @param changedBy - Optional ID of the user who marked the quote as accepted (for audit trail)
   * @returns A promise that resolves to the updated quote with full details, or null if quote not found
   *
   * @throws {Error} If the status transition is invalid (e.g., cannot accept a cancelled quote)
   */
  async markAsAccepted(id: string, changedBy?: string): Promise<QuoteWithDetails | null> {
    // Get current status before update
    const quote = await this.prisma.quote.findUnique({
      where: { id, deletedAt: null },
      select: { status: true },
    });

    if (!quote) {
      return null;
    }

    const previousStatus = quote.status;
    const changedAt = new Date();

    // Validate status transition
    validateQuoteStatusTransition(previousStatus, QuoteStatusSchema.enum.ACCEPTED);

    // Update quote and create status history in a transaction
    const updated = await this.prisma.$transaction(async (tx) => {
      // Update quote status
      const updatedQuote = await tx.quote.update({
        where: { id, deletedAt: null },
        data: {
          status: QuoteStatusSchema.enum.ACCEPTED,
          updatedAt: changedAt,
        },
      });

      // Create status history entry
      await tx.quoteStatusHistory.create({
        data: {
          quoteId: id,
          status: QuoteStatusSchema.enum.ACCEPTED,
          previousStatus,
          changedAt,
          changedBy,
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
   * @param changedBy - Optional ID of the user who put the quote on hold (for audit trail)
   * @returns A promise that resolves to the updated quote with full details, or null if quote not found
   *
   * @throws {Error} If the status transition is invalid
   */
  async markAsOnHold(id: string, reason?: string, changedBy?: string): Promise<QuoteWithDetails | null> {
    // Get current status before update
    const quote = await this.prisma.quote.findUnique({
      where: { id, deletedAt: null },
      select: { status: true },
    });

    if (!quote) {
      return null;
    }

    const previousStatus = quote.status;
    const changedAt = new Date();

    // Validate status transition
    validateQuoteStatusTransition(previousStatus, QuoteStatusSchema.enum.ON_HOLD);

    // Update quote and create status history in a transaction
    const updated = await this.prisma.$transaction(async (tx) => {
      // Update quote status
      const updatedQuote = await tx.quote.update({
        where: { id, deletedAt: null },
        data: {
          status: QuoteStatusSchema.enum.ON_HOLD,
          updatedAt: changedAt,
        },
      });

      // Create status history entry
      await tx.quoteStatusHistory.create({
        data: {
          quoteId: id,
          status: QuoteStatusSchema.enum.ON_HOLD,
          previousStatus,
          changedAt,
          changedBy,
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
   * @param changedBy - Optional ID of the user who cancelled the quote (for audit trail)
   * @returns A promise that resolves to the updated quote with full details, or null if quote not found
   *
   * @throws {Error} If the status transition is invalid
   */
  async markAsCancelled(id: string, reason?: string, changedBy?: string): Promise<QuoteWithDetails | null> {
    // Get current status before update
    const quote = await this.prisma.quote.findUnique({
      where: { id, deletedAt: null },
      select: { status: true },
    });

    if (!quote) {
      return null;
    }

    const previousStatus = quote.status;
    const changedAt = new Date();

    // Validate status transition
    validateQuoteStatusTransition(previousStatus, QuoteStatusSchema.enum.CANCELLED);

    // Update quote and create status history in a transaction
    const updated = await this.prisma.$transaction(async (tx) => {
      // Update quote status
      const updatedQuote = await tx.quote.update({
        where: { id, deletedAt: null },
        data: {
          status: QuoteStatusSchema.enum.CANCELLED,
          updatedAt: changedAt,
        },
      });

      // Create status history entry
      await tx.quoteStatusHistory.create({
        data: {
          quoteId: id,
          status: QuoteStatusSchema.enum.CANCELLED,
          previousStatus,
          changedAt,
          changedBy,
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
   * @param changedBy - Optional ID of the user who marked the quote as rejected (for audit trail)
   * @returns A promise that resolves to the updated quote with full details, or null if quote not found
   *
   * @throws {Error} If the status transition is invalid
   */
  async markAsRejected(
    id: string,
    rejectReason: string,
    changedBy?: string,
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
    const changedAt = new Date();

    // Validate status transition
    validateQuoteStatusTransition(previousStatus, QuoteStatusSchema.enum.REJECTED);

    // Update quote and create status history in a transaction
    const updated = await this.prisma.$transaction(async (tx) => {
      // Update quote status
      const updatedQuote = await tx.quote.update({
        where: { id, deletedAt: null },
        data: {
          status: QuoteStatusSchema.enum.REJECTED,
          updatedAt: changedAt,
        },
      });

      // Create status history entry
      await tx.quoteStatusHistory.create({
        data: {
          quoteId: id,
          status: QuoteStatusSchema.enum.REJECTED,
          previousStatus,
          changedAt,
          changedBy,
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
   * @param changedBy - Optional ID of the user who sent the quote (for audit trail)
   * @returns A promise that resolves to the updated quote with full details, or null if quote not found
   *
   * @throws {Error} If the status transition is invalid (e.g., cannot send a cancelled quote)
   */
  async markAsSent(id: string, changedBy?: string): Promise<QuoteWithDetails | null> {
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
    validateQuoteStatusTransition(previousStatus, QuoteStatusSchema.enum.SENT);

    // Update quote and create status history in a transaction
    const updated = await this.prisma.$transaction(async (tx) => {
      // Update quote status
      const updatedQuote = await tx.quote.update({
        where: { id, deletedAt: null },
        data: {
          status: QuoteStatusSchema.enum.SENT,
          updatedAt: sentDate,
        },
      });

      // Create status history entry
      await tx.quoteStatusHistory.create({
        data: {
          quoteId: id,
          status: QuoteStatusSchema.enum.SENT,
          previousStatus,
          changedAt: sentDate,
          changedBy,
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
   * @param changedBy - Optional ID of the user who performed the conversion (for audit trail)
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
    changedBy?: string,
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
      validateQuoteStatusTransition(previousStatus, QuoteStatusSchema.enum.CONVERTED);

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
          status: QuoteStatusSchema.enum.CONVERTED,
          invoiceId: invoice.id,
        },
      });

      // Create status history entry
      await tx.quoteStatusHistory.create({
        data: {
          quoteId: quoteId,
          status: QuoteStatusSchema.enum.CONVERTED,
          previousStatus,
          changedAt: convertedDate,
          changedBy: changedBy,
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
          in: [QuoteStatusSchema.enum.DRAFT, QuoteStatusSchema.enum.SENT],
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
            status: QuoteStatusSchema.enum.EXPIRED,
            updatedAt: new Date(),
          },
        });

        // Create status history entry
        await tx.quoteStatusHistory.create({
          data: {
            quoteId: quote.id,
            status: QuoteStatusSchema.enum.EXPIRED,
            previousStatus: quote.status,
            changedAt: quote.validUntil,
            changedBy: null, // System-initiated
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
   * Get all file attachments associated with a specific quote.
   * Results are ordered by upload date (newest first).
   *
   * @param quoteId - The ID of the quote
   * @returns A promise that resolves to an array of quote attachments
   */
  async getQuoteAttachments(quoteId: string) {
    return this.prisma.quoteAttachment.findMany({
      where: { quoteId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  /**
   * Create a new attachment record for a quote.
   * The file should already be uploaded to S3 before calling this method.
   *
   * @param data - The attachment data including S3 information and file metadata
   * @returns A promise that resolves to the created attachment record
   */
  async createAttachment(data: {
    quoteId: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    s3Key: string;
    s3Url: string;
    uploadedBy?: string;
  }) {
    return this.prisma.quoteAttachment.create({
      data: {
        quoteId: data.quoteId,
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
   * Get a single quote attachment by its ID.
   *
   * @param attachmentId - The ID of the attachment
   * @returns A promise that resolves to the attachment record, or null if not found
   */
  async getAttachmentById(attachmentId: string) {
    return this.prisma.quoteAttachment.findUnique({
      where: { id: attachmentId },
    });
  }

  /**
   * Delete a quote attachment record from the database.
   * Note: This does not delete the file from S3 - that should be handled separately.
   *
   * @param attachmentId - The ID of the attachment to delete
   * @returns A promise that resolves to true if deletion was successful, false otherwise
   */
  async deleteAttachment(attachmentId: string): Promise<boolean> {
    try {
      await this.prisma.quoteAttachment.delete({
        where: { id: attachmentId },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Count the total number of attachments for a specific quote.
   *
   * @param quoteId - The ID of the quote
   * @returns A promise that resolves to the count of attachments
   */
  async countQuoteAttachments(quoteId: string): Promise<number> {
    return this.prisma.quoteAttachment.count({
      where: { quoteId },
    });
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
              parentQuoteId: parentQuote.parentQuoteId
                ? parentQuote.parentQuoteId
                : undefined,
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

      // Create the new version
      const newVersion = await tx.quote.create({
        data: {
          quoteNumber: newQuoteNumber,
          customerId: parentQuote.customerId,
          status: QuoteStatusSchema.enum.DRAFT, // New versions start as DRAFT
          amount: parentQuote.amount,
          currency: parentQuote.currency,
          gst: parentQuote.gst,
          discount: parentQuote.discount,
          issuedDate: createdDate,
          validUntil: parentQuote.validUntil,
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
          status: QuoteStatusSchema.enum.DRAFT,
          previousStatus: null,
          changedAt: createdDate,
          changedBy: createdBy,
          notes: `New version created from ${parentQuote.quoteNumber}`,
        },
      });

      // Mark parent quote as CANCELLED since it's been superseded by a new version
      const previousParentStatus = parentQuote.status;
      await tx.quote.update({
        where: { id: parentQuoteId },
        data: {
          status: QuoteStatusSchema.enum.CANCELLED,
          updatedAt: createdDate,
        },
      });

      // Create status history entry for parent quote cancellation
      await tx.quoteStatusHistory.create({
        data: {
          quoteId: parentQuoteId,
          status: QuoteStatusSchema.enum.CANCELLED,
          previousStatus: previousParentStatus,
          changedAt: createdDate,
          changedBy: createdBy,
          notes: `Quote cancelled due to new version ${newQuoteNumber} being created`,
        },
      });

      return newVersion;
    });
  }
}

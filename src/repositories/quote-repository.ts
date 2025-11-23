import { Prisma, PrismaClient } from '@/prisma/client';
import { BaseRepository, type ModelDelegateOperations } from '@/lib/baseRepository';
import { QuoteStatusSchema } from '@/zod/inputTypeSchemas/QuoteStatusSchema';

import type {
  QuoteListItem,
  QuoteStatistics,
  QuoteWithDetails,
  QuoteFilters,
  QuotePagination,
} from '@/features/finances/quotes/types';
import { getPaginationMetadata } from '@/lib/utils';

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
   * Search and paginate quotes with filters
   */
  async searchAndPaginate(params: QuoteFilters): Promise<QuotePagination> {
    const { search, status, page, perPage, sort } = params;

    const whereClause: Prisma.QuoteWhereInput = {
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
      currency: quote.currency,
      issuedDate: quote.issuedDate,
      validUntil: quote.validUntil,
      itemCount: quote._count.items,
      attachmentCount: quote._count.attachments,
    }));

    return {
      items,
      pagination: getPaginationMetadata(totalItems, perPage, page),
    };
  }

  /**
   * Find a quote by its ID with details
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
        acceptedDate: true,
        rejectedDate: true,
        rejectReason: true,
        convertedDate: true,
        invoiceId: true,
        notes: true,
        terms: true,
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
   * Get quote statistics
   */
  async getStatistics(dateFilter?: { startDate?: Date; endDate?: Date }): Promise<QuoteStatistics> {
    const whereClause: Prisma.QuoteWhereInput = {
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

    // Build the SQL query for average calculation
    let avgQuery = Prisma.sql`
      SELECT AVG(amount::numeric)::float as avg
      FROM quotes
      WHERE deleted_at IS NULL
    `;

    if (dateFilter?.startDate) {
      avgQuery = Prisma.sql`${avgQuery} AND issued_date >= ${dateFilter.startDate}`;
    }

    if (dateFilter?.endDate) {
      avgQuery = Prisma.sql`${avgQuery} AND issued_date <= ${dateFilter.endDate}`;
    }

    const [statusCounts, totalData, avgQuoteValue] = await Promise.all([
      this.prisma.quote.groupBy({
        by: ['status'],
        where: whereClause,
        _count: true,
      }),

      this.prisma.quote.aggregate({
        where: whereClause,
        _count: true,
      }),

      // Use raw SQL to calculate average of money type with date filter
      this.prisma.$queryRaw<[{ avg: number }]>(avgQuery),
    ]);

    // Get total quoted value (all quotes)
    const totalQuotedData = await this.prisma.quote.aggregate({
      where: whereClause,
      _sum: {
        amount: true,
      },
    });

    // Get total accepted value
    const acceptedData = await this.prisma.quote.aggregate({
      where: {
        ...whereClause,
        status: QuoteStatusSchema.enum.ACCEPTED,
      },
      _sum: {
        amount: true,
      },
    });

    // Get total converted value
    const convertedData = await this.prisma.quote.aggregate({
      where: {
        ...whereClause,
        status: QuoteStatusSchema.enum.CONVERTED,
      },
      _sum: {
        amount: true,
      },
    });

    // Calculate sent quotes count for conversion rate
    const sentCount =
      statusCounts.find((item) => item.status === QuoteStatusSchema.enum.SENT)?._count || 0;
    const acceptedCount =
      statusCounts.find((item) => item.status === QuoteStatusSchema.enum.ACCEPTED)?._count || 0;

    const stats: QuoteStatistics = {
      total: totalData._count,
      draft: 0,
      sent: 0,
      accepted: 0,
      rejected: 0,
      expired: 0,
      converted: 0,
      totalQuotedValue: Number(totalQuotedData._sum.amount ?? 0),
      totalAcceptedValue: Number(acceptedData._sum.amount ?? 0),
      totalConvertedValue: Number(convertedData._sum.amount ?? 0),
      conversionRate: sentCount > 0 ? (acceptedCount / sentCount) * 100 : 0,
      avgQuoteValue: avgQuoteValue[0]?.avg ?? 0,
    };

    // Map status counts
    statusCounts.forEach((item) => {
      switch (item.status) {
        case QuoteStatusSchema.enum.DRAFT:
          stats.draft = item._count;
          break;
        case QuoteStatusSchema.enum.SENT:
          stats.sent = item._count;
          break;
        case QuoteStatusSchema.enum.ACCEPTED:
          stats.accepted = item._count;
          break;
        case QuoteStatusSchema.enum.REJECTED:
          stats.rejected = item._count;
          break;
        case QuoteStatusSchema.enum.EXPIRED:
          stats.expired = item._count;
          break;
        case QuoteStatusSchema.enum.CONVERTED:
          stats.converted = item._count;
          break;
      }
    });

    return stats;
  }

  async createQuoteWithItems(data: CreateQuoteInput): Promise<{ id: string; quoteNumber: string }> {
    // Generate invoice number
    const quoteNumber = await this.generateQuoteNumber();

    // Calculate total amount
    const totalAmount = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    return this.prisma.quote.create({
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
  }

  async updateQuoteWithItems(id: string, data: UpdateQuoteInput): Promise<QuoteWithDetails | null> {
    // Calculate total amount
    const totalAmount = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    // Update quote with items in a transaction
    const updatedQuote = await this.prisma.$transaction(async (tx) => {
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
   * Generate quote number
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
   * Mark quote as accepted
   */
  async markAsAccepted(id: string, acceptedDate: Date): Promise<QuoteWithDetails | null> {
    const updated = await this.prisma.quote.update({
      where: { id, deletedAt: null },
      data: {
        status: QuoteStatusSchema.enum.ACCEPTED,
        acceptedDate,
        updatedAt: new Date(),
      },
    });

    if (!updated) {
      return null;
    }

    return this.findByIdWithDetails(updated.id);
  }

  /**
   * Mark quote as rejected
   */
  async markAsRejected(
    id: string,
    rejectedDate: Date,
    rejectReason: string,
  ): Promise<QuoteWithDetails | null> {
    const updated = await this.prisma.quote.update({
      where: { id, deletedAt: null },
      data: {
        status: QuoteStatusSchema.enum.REJECTED,
        rejectedDate,
        rejectReason,
        updatedAt: new Date(),
      },
    });

    return this.findByIdWithDetails(updated.id);
  }

  /**
   * Mark quote as sent
   */
  async markAsSent(id: string): Promise<QuoteWithDetails | null> {
    const updated = await this.prisma.quote.update({
      where: { id, deletedAt: null },
      data: {
        status: QuoteStatusSchema.enum.SENT,
        updatedAt: new Date(),
      },
    });

    if (!updated) {
      return null;
    }

    return this.findByIdWithDetails(updated.id);
  }

  /**
   * Check and expire old quotes
   */
  async checkAndExpireQuotes(): Promise<number> {
    const today = new Date();

    const result = await this.prisma.quote.updateMany({
      where: {
        status: {
          in: [QuoteStatusSchema.enum.DRAFT, QuoteStatusSchema.enum.SENT],
        },
        validUntil: { lt: today },
        deletedAt: null,
      },
      data: {
        status: QuoteStatusSchema.enum.EXPIRED,
        updatedAt: new Date(),
      },
    });

    return result.count;
  }

  /**
   * Soft delete quote
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
   * Check if quote number exists
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
   * Get all attachments for a quote
   */
  async getQuoteAttachments(quoteId: string) {
    return this.prisma.quoteAttachment.findMany({
      where: { quoteId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  /**
   * Create a new attachment record
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
   * Get a single attachment by ID
   */
  async getAttachmentById(attachmentId: string) {
    return this.prisma.quoteAttachment.findUnique({
      where: { id: attachmentId },
    });
  }

  /**
   * Delete an attachment record
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
   * Count attachments for a quote
   */
  async countQuoteAttachments(quoteId: string): Promise<number> {
    return this.prisma.quoteAttachment.count({
      where: { quoteId },
    });
  }

  /**
   * Get all attachments for a quote item
   */
  async getQuoteItemAttachments(itemId: string) {
    return this.prisma.quoteItemAttachment.findMany({
      where: { quoteItemId: itemId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  /**
   * Create a new item attachment record
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
   * Update quote item notes
   */
  async updateQuoteItemNotes(quoteItemId: string, notes: string) {
    return this.prisma.quoteItem.update({
      where: { id: quoteItemId },
      data: { notes },
    });
  }

  /**
   * Update quote item colors
   */
  async updateQuoteItemColors(quoteItemId: string, colors: string[]) {
    return this.prisma.quoteItem.update({
      where: { id: quoteItemId },
      data: { colors },
    });
  }

  /**
   * Get a single item attachment by ID
   */
  async getItemAttachmentById(attachmentId: string) {
    return this.prisma.quoteItemAttachment.findUnique({
      where: { id: attachmentId },
    });
  }

  /**
   * Delete an item attachment record
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
   * Count attachments for a quote item
   */
  async countQuoteItemAttachments(itemId: string): Promise<number> {
    return this.prisma.quoteItemAttachment.count({
      where: { quoteItemId: itemId },
    });
  }
}

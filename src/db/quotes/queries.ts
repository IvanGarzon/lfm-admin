import { Prisma, PrismaClient } from '@/prisma/client';

import type {
  QuoteListItem,
  QuoteWithDetails,
  QuoteMetadata,
  QuoteItem,
  QuoteFilters,
  QuotePagination
} from '@/features/finances/quotes/types';
import { getPaginationMetadata } from '@/lib/utils';

// -- Private helpers ------------------------------------------------------------

/**
 * Get the count of all versions in a quote's version chain.
 * @param prisma - The Prisma client instance
 * @param quoteId - The ID of any quote in the version chain (can be root or child version)
 * @returns A promise that resolves to the total number of versions in the chain
 */
async function countQuoteVersions(prisma: PrismaClient, quoteId: string): Promise<number> {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId, deletedAt: null },
    select: { id: true, parentQuoteId: true }
  });

  if (!quote) {
    return 0;
  }

  const rootQuoteId = quote.parentQuoteId || quoteId;

  const count = await prisma.quote.count({
    where: {
      OR: [{ id: rootQuoteId }, { parentQuoteId: rootQuoteId }],
      deletedAt: null
    }
  });

  return count;
}

// -- Public functions -----------------------------------------------------------

/**
 * Search and paginate quotes with filters.
 * Only returns the latest versions of quotes (quotes without child versions).
 * @param prisma - The Prisma client instance
 * @param params - The filter parameters including search text, status filters, pagination, and sorting options
 * @param tenantId - The tenant ID to scope all queries
 * @returns A promise that resolves to a paginated list of quotes with customer information and counts
 */
export async function searchQuotes(
  prisma: PrismaClient,
  params: QuoteFilters,
  tenantId: string
): Promise<QuotePagination> {
  const { search, status, isFavourite, page, perPage, sort } = params;

  const whereClause: Prisma.QuoteWhereInput = {
    tenantId,
    deletedAt: null,
    isLatestVersion: true
  };

  if (status && status.length > 0) {
    whereClause.status = {
      in: status
    };
  }

  if (search) {
    const searchFilter: Prisma.StringFilter = {
      contains: search,
      mode: Prisma.QueryMode.insensitive
    };

    whereClause.OR = [
      { quoteNumber: searchFilter },
      {
        customer: {
          OR: [{ firstName: searchFilter }, { lastName: searchFilter }, { email: searchFilter }]
        }
      }
    ];
  }

  if (isFavourite === true) {
    whereClause.isFavourite = true;
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

  const countOperation = prisma.quote.count({ where: whereClause });
  const findManyOperation = prisma.quote.findMany({
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
      isFavourite: true,
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
    isFavourite: quote.isFavourite
  }));

  return {
    items,
    pagination: getPaginationMetadata(totalItems, perPage, page)
  };
}

/**
 * Find a quote by its ID with complete details including customer, items, attachments, and status history.
 * Only returns non-deleted quotes.
 * @param prisma - The Prisma client instance
 * @param id - The unique identifier of the quote
 * @param tenantId - The tenant ID to scope the query
 * @returns A promise that resolves to the quote with all details, or null if not found
 */
export async function findQuoteById(
  prisma: PrismaClient,
  id: string,
  tenantId: string
): Promise<QuoteWithDetails | null> {
  const quote = await prisma.quote.findUnique({
    where: { id, tenantId, deletedAt: null },
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
      isFavourite: true,
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
              uploadedAt: true
            },
            orderBy: { uploadedAt: 'desc' }
          }
        },
        orderBy: { order: 'asc' }
      },
      _count: {
        select: {
          statusHistory: true
        }
      }
    }
  });

  if (!quote) {
    return null;
  }

  const versionsCount = await countQuoteVersions(prisma, id);

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
      total: Number(item.total)
    }))
  };
}

/**
 * Fetches lightweight quote metadata without items.
 * Used for headers, actions, and navigation where item details aren't needed.
 * @param prisma - The Prisma client instance
 * @param id - The ID of the quote
 * @param tenantId - The tenant ID to scope the query
 * @returns A promise that resolves to the quote metadata, or null if not found
 */
export async function findQuoteMetadata(
  prisma: PrismaClient,
  id: string,
  tenantId: string
): Promise<QuoteMetadata | null> {
  const quote = await prisma.quote.findUnique({
    where: { id, tenantId, deletedAt: null },
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
      isFavourite: true,
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
          statusHistory: true
        }
      }
    }
  });

  if (!quote) {
    return null;
  }

  const versionsCount = await countQuoteVersions(prisma, id);

  return {
    ...quote,
    amount: Number(quote.amount),
    gst: Number(quote.gst),
    discount: Number(quote.discount),
    notes: quote.notes ?? undefined,
    terms: quote.terms ?? undefined,
    versionsCount
  };
}

/**
 * Fetches quote items with attachments for a specific quote.
 * @param prisma - The Prisma client instance
 * @param quoteId - The ID of the quote
 * @returns A promise that resolves to an array of quote items
 */
export async function findQuoteItems(prisma: PrismaClient, quoteId: string): Promise<QuoteItem[]> {
  const items = await prisma.quoteItem.findMany({
    where: {
      quoteId,
      quote: {
        deletedAt: null
      }
    },
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
          uploadedAt: true
        },
        orderBy: { uploadedAt: 'desc' }
      }
    },
    orderBy: { order: 'asc' }
  });

  return items.map((item) => ({
    ...item,
    unitPrice: Number(item.unitPrice),
    total: Number(item.total)
  }));
}

/**
 * Find status history for a specific quote.
 * Includes detailed user information and timestamps.
 * @param prisma - The Prisma client instance
 * @param quoteId - The ID of the quote
 * @returns A promise that resolves to an array of status history items
 */
export async function findQuoteStatusHistory(prisma: PrismaClient, quoteId: string) {
  return prisma.quoteStatusHistory.findMany({
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
          avatarUrl: true
        }
      },
      notes: true
    },
    orderBy: { updatedAt: 'asc' }
  });
}

/**
 * Get all versions of a quote in the version chain.
 * Returns the root quote and all its child versions, ordered by version number.
 * @param prisma - The Prisma client instance
 * @param quoteId - The ID of any quote in the version chain (can be root or child version)
 * @returns A promise that resolves to an array of quote versions with basic information
 */
export async function getQuoteVersions(prisma: PrismaClient, quoteId: string) {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId, deletedAt: null },
    select: { id: true, parentQuoteId: true }
  });

  if (!quote) {
    return [];
  }

  const rootQuoteId = quote.parentQuoteId || quoteId;

  const versions = await prisma.quote.findMany({
    where: {
      OR: [{ id: rootQuoteId }, { parentQuoteId: rootQuoteId }],
      deletedAt: null
    },
    select: {
      id: true,
      quoteNumber: true,
      versionNumber: true,
      status: true,
      amount: true,
      issuedDate: true,
      createdAt: true,
      updatedAt: true
    },
    orderBy: { versionNumber: 'asc' }
  });

  return versions;
}

/**
 * Check if a quote number already exists in the database.
 * @param prisma - The Prisma client instance
 * @param quoteNumber - The quote number to check
 * @param excludeId - Optional quote ID to exclude from the check (useful when updating)
 * @returns A promise that resolves to true if the quote number exists, false otherwise
 */
export async function quoteNumberExists(
  prisma: PrismaClient,
  quoteNumber: string,
  excludeId?: string
): Promise<boolean> {
  const where: Prisma.QuoteWhereInput = {
    quoteNumber,
    deletedAt: null
  };

  if (excludeId) {
    where.id = { not: excludeId };
  }

  const count = await prisma.quote.count({ where });
  return count > 0;
}

/**
 * Get all file attachments associated with a specific quote item.
 * @param prisma - The Prisma client instance
 * @param itemId - The ID of the quote item
 * @returns A promise that resolves to an array of quote item attachments
 */
export async function findQuoteItemAttachments(prisma: PrismaClient, itemId: string) {
  return prisma.quoteItemAttachment.findMany({
    where: { quoteItemId: itemId },
    orderBy: { uploadedAt: 'desc' }
  });
}

/**
 * Get a single quote item attachment by its ID.
 * @param prisma - The Prisma client instance
 * @param attachmentId - The ID of the item attachment
 * @returns A promise that resolves to the attachment record, or null if not found
 */
export async function findQuoteItemAttachmentById(prisma: PrismaClient, attachmentId: string) {
  return prisma.quoteItemAttachment.findUnique({
    where: { id: attachmentId }
  });
}

/**
 * Count the total number of attachments for a specific quote item.
 * @param prisma - The Prisma client instance
 * @param itemId - The ID of the quote item
 * @returns A promise that resolves to the count of item attachments
 */
export async function countQuoteItemAttachments(
  prisma: PrismaClient,
  itemId: string
): Promise<number> {
  return prisma.quoteItemAttachment.count({
    where: { quoteItemId: itemId }
  });
}

/**
 * Count attachments sharing the same S3 key, excluding a specific attachment.
 * Used to determine whether a file can be safely deleted from S3.
 * @param prisma - The Prisma client instance
 * @param s3Key - The S3 key to check for shared usage
 * @param excludeId - The attachment ID to exclude from the count
 * @returns A promise that resolves to the number of other attachments referencing the same key
 */
export async function countQuoteItemAttachmentsByS3Key(
  prisma: PrismaClient,
  s3Key: string,
  excludeId: string
): Promise<number> {
  return prisma.quoteItemAttachment.count({
    where: { s3Key, id: { not: excludeId } }
  });
}

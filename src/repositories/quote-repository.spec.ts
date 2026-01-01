import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuoteRepository } from './quote-repository';

// Mock QuoteStatus enum manually since we rely on module-level imports that use it
const QuoteStatus = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  ON_HOLD: 'ON_HOLD',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
  CONVERTED: 'CONVERTED',
} as const;

// Mock Prisma Client BEFORE importing it elsewhere
vi.mock('@/prisma/client', () => {
  return {
    PrismaClient: vi.fn(),
    QuoteStatus: {
      DRAFT: 'DRAFT',
      SENT: 'SENT',
      ON_HOLD: 'ON_HOLD',
      ACCEPTED: 'ACCEPTED',
      REJECTED: 'REJECTED',
      EXPIRED: 'EXPIRED',
      CANCELLED: 'CANCELLED',
      CONVERTED: 'CONVERTED',
    },
    Prisma: {
      PrismaClientKnownRequestError: class extends Error {},
    },
  };
});

const mockPrisma = {
  quote: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn(),
    aggregate: vi.fn(),
  },
  quoteStatusHistory: {
    create: vi.fn(),
  },
  $transaction: vi.fn((input) => {
    if (Array.isArray(input)) return Promise.all(input);
    return input(mockPrisma);
  }),
  $queryRaw: vi.fn(),
};

describe('QuoteRepository', () => {
  let repository: QuoteRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-ignore - manual mock of PrismaClient
    repository = new QuoteRepository(mockPrisma);
  });

  describe('findByIdWithDetails', () => {
    it('returns a quote with details when it exists', async () => {
      const mockQuote = {
        id: 'quote_123',
        quoteNumber: 'Q-001',
        customer: { firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' },
        items: [],
        status: QuoteStatus.DRAFT,
        amount: '1000',
        currency: 'USD',
        gst: '100',
        discount: '0',
        validUntil: new Date(),
        issuedDate: new Date(),
        versionNumber: 1,
      };
      mockPrisma.quote.findUnique.mockResolvedValue(mockQuote);

      const result = await repository.findByIdWithDetails('quote_123');

      expect(result?.quoteNumber).toBe('Q-001');
      expect(mockPrisma.quote.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'quote_123', deletedAt: null },
        }),
      );
    });

    it('returns null when quote does not exist', async () => {
      mockPrisma.quote.findUnique.mockResolvedValue(null);
      const result = await repository.findByIdWithDetails('non_existent');
      expect(result).toBeNull();
    });
  });

  describe('duplicate', () => {
    it('creates a new quote as a copy', async () => {
      // Mock existing quote
      const mockQuote = {
        id: 'quote_original',
        quoteNumber: 'Q-001',
        customer: { id: 'cust_1' },
        // simplified for mock
        items: [],
        amount: '100',
        currency: 'USD',
        gst: '10',
        discount: '0',
        customerId: 'cust_1',
      };
      // Mock validation queries
      mockPrisma.quote.findUnique.mockResolvedValue(mockQuote);

      // Mock duplication transaction result
      const mockNewQuote = {
        id: 'quote_new',
        quoteNumber: 'Q-002',
        status: QuoteStatus.DRAFT,
      };

      // We need to mock the $transaction callback behavior
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        // Mock create for the new quote
        mockPrisma.quote.create.mockResolvedValue(mockNewQuote);
        mockPrisma.quoteStatusHistory.create.mockResolvedValue({});

        return callback(mockPrisma);
      });

      // Mock generation of new quote number via counting
      mockPrisma.quote.count.mockResolvedValue(100);

      const result = await repository.duplicate('quote_original');

      expect(result.quoteNumber).toBe('Q-002'); // Matches mockNewQuote
      expect(mockPrisma.quote.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: QuoteStatus.DRAFT,
            customerId: 'cust_1',
          }),
        }),
      );
    });
  });

  describe('markAsAccepted', () => {
    it('updates status to ACCEPTED and records history', async () => {
      const mockQuote = {
        id: 'q1',
        status: QuoteStatus.SENT, // Must be SENT to be ACCEPTED
        items: [],
        customer: { firstName: 'Test', lastName: 'User' },
        amount: '100', // Required for findByIdWithDetails mapping
        gst: '0',
        discount: '0',
      };

      // Mock findUnique to return the quote for validation
      mockPrisma.quote.findUnique.mockResolvedValue(mockQuote);

      // Mock transaction behavior
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        // Mock update inside transaction
        mockPrisma.quote.update.mockResolvedValue({
          ...mockQuote,
          status: QuoteStatus.ACCEPTED,
        });
        // Mock history creation
        mockPrisma.quoteStatusHistory.create.mockResolvedValue({});

        return callback(mockPrisma);
      });

      await repository.markAsAccepted('q1', 'user1');

      expect(mockPrisma.quote.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'q1', deletedAt: null },
          data: expect.objectContaining({
            status: QuoteStatus.ACCEPTED,
          }),
        }),
      );

      expect(mockPrisma.quoteStatusHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            quoteId: 'q1',
            status: QuoteStatus.ACCEPTED,
            previousStatus: QuoteStatus.SENT,
            changedBy: 'user1',
          }),
        }),
      );
    });
  });
});

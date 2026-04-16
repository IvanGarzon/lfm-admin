import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getPriceListItems,
  getPriceListItemById,
  getPriceListCostHistory,
  getActivePriceListItems,
} from '../queries';
import {
  testIds,
  mockSessions,
  createPriceListItemListItem,
  createPriceListItemWithDetails,
} from '@/lib/testing';

const { mockPriceListRepo, mockAuth } = vi.hoisted(() => ({
  mockPriceListRepo: {
    searchPriceListItems: vi.fn(),
    findPriceListItemById: vi.fn(),
    getPriceListCostHistory: vi.fn(),
    findActivePriceListItems: vi.fn(),
  },
  mockAuth: vi.fn(),
}));

vi.mock('@/repositories/price-list-repository', () => ({
  PriceListRepository: vi.fn().mockImplementation(function () {
    return mockPriceListRepo;
  }),
}));

vi.mock('@/auth', () => ({
  auth: mockAuth,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {},
}));

const unauthorizedError = 'You must be signed in to perform this action';

describe('Price List Queries', () => {
  const mockSession = mockSessions.manager();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession);
  });

  // -- getPriceListItems -----------------------------------------------------

  describe('getPriceListItems', () => {
    it('returns paginated items when authorised', async () => {
      const mockResult = {
        items: [createPriceListItemListItem()],
        pagination: { total: 1, page: 1, perPage: 20, totalPages: 1 },
      };
      mockPriceListRepo.searchPriceListItems.mockResolvedValue(mockResult);

      const result = await getPriceListItems({ page: '1', perPage: '20' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockResult);
      }
    });

    it('returns unauthorised when no session', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await getPriceListItems({});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(unauthorizedError);
      }
    });
  });

  // -- getPriceListItemById --------------------------------------------------

  describe('getPriceListItemById', () => {
    it('returns item with details when found', async () => {
      const mockItem = createPriceListItemWithDetails();
      mockPriceListRepo.findPriceListItemById.mockResolvedValue(mockItem);

      const result = await getPriceListItemById(mockItem.id);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockItem);
      }
    });

    it('returns not-found error when item does not exist', async () => {
      mockPriceListRepo.findPriceListItemById.mockResolvedValue(null);

      const result = await getPriceListItemById(testIds.nonExistent());

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Price list item not found');
      }
    });
  });

  // -- getPriceListCostHistory -----------------------------------------------

  describe('getPriceListCostHistory', () => {
    it('returns cost history entries', async () => {
      const mockHistory = [
        {
          id: testIds.priceListItem(),
          previousCost: 1.0,
          newCost: 1.5,
          changedAt: new Date('2024-01-01'),
        },
      ];
      mockPriceListRepo.getPriceListCostHistory.mockResolvedValue(mockHistory);

      const result = await getPriceListCostHistory(testIds.priceListItem());

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockHistory);
      }
    });

    it('returns unauthorised when no session', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await getPriceListCostHistory(testIds.priceListItem());

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(unauthorizedError);
      }
    });
  });

  // -- getActivePriceListItems -----------------------------------------------

  describe('getActivePriceListItems', () => {
    it('returns active items', async () => {
      const mockResult = [createPriceListItemListItem()];
      mockPriceListRepo.findActivePriceListItems.mockResolvedValue(mockResult);

      const result = await getActivePriceListItems();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockResult);
      }
    });
  });
});

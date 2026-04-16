import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPriceListItem, updatePriceListItem, deletePriceListItem } from '../mutations';
import {
  testIds,
  mockSessions,
  createPriceListItemInput,
  createUpdatePriceListItemInput,
} from '@/lib/testing';

const { mockPriceListRepo, mockAuth } = vi.hoisted(() => ({
  mockPriceListRepo: {
    createPriceListItem: vi.fn(),
    updatePriceListItem: vi.fn(),
    deletePriceListItem: vi.fn(),
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

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

const unauthorizedError = 'You must be signed in to perform this action';

describe('Price List Mutations', () => {
  const mockSession = mockSessions.manager();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession);
  });

  // -- createPriceListItem ---------------------------------------------------

  describe('createPriceListItem', () => {
    it('creates a price list item when authorised', async () => {
      const input = createPriceListItemInput();
      const mockId = testIds.priceListItem();
      mockPriceListRepo.createPriceListItem.mockResolvedValue({ id: mockId });

      const result = await createPriceListItem(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(mockId);
      }
      expect(mockPriceListRepo.createPriceListItem).toHaveBeenCalledWith(
        expect.objectContaining({ name: input.name }),
        mockSession.user.tenantId,
      );
    });

    it('returns unauthorised when no session', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await createPriceListItem(createPriceListItemInput());

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(unauthorizedError);
      }
    });

    it('returns error when repo throws', async () => {
      mockPriceListRepo.createPriceListItem.mockRejectedValue(new Error('DB error'));

      const result = await createPriceListItem(createPriceListItemInput());

      expect(result.success).toBe(false);
    });
  });

  // -- updatePriceListItem ---------------------------------------------------

  describe('updatePriceListItem', () => {
    it('updates a price list item when authorised', async () => {
      const input = createUpdatePriceListItemInput();
      mockPriceListRepo.updatePriceListItem.mockResolvedValue({ id: input.id });

      const result = await updatePriceListItem(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(input.id);
      }
      expect(mockPriceListRepo.updatePriceListItem).toHaveBeenCalledWith(
        input.id,
        mockSession.user.tenantId,
        expect.objectContaining({ name: input.name }),
      );
    });

    it('returns not found when repository returns null', async () => {
      const input = createUpdatePriceListItemInput();
      mockPriceListRepo.updatePriceListItem.mockResolvedValue(null);

      const result = await updatePriceListItem(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Price list item not found');
      }
    });
  });

  // -- deletePriceListItem ---------------------------------------------------

  describe('deletePriceListItem', () => {
    it('deletes a price list item when authorised', async () => {
      const id = testIds.priceListItem();
      mockPriceListRepo.deletePriceListItem.mockResolvedValue(true);

      const result = await deletePriceListItem({ id });

      expect(result.success).toBe(true);
      expect(mockPriceListRepo.deletePriceListItem).toHaveBeenCalledWith(
        id,
        mockSession.user.tenantId,
      );
    });

    it('returns not found when repository returns false', async () => {
      const id = testIds.priceListItem();
      mockPriceListRepo.deletePriceListItem.mockResolvedValue(false);

      const result = await deletePriceListItem({ id });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Price list item not found');
      }
    });
  });
});

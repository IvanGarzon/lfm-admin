import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecipeRepository } from './recipe-repository';
import { testIds, createRecipeDetails, createRecipeResponse } from '@/lib/testing';
import { RecipeItemType } from '@/prisma/client';

const mockPrisma = {
  recipe: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  recipeItem: {
    deleteMany: vi.fn(),
    createMany: vi.fn(),
  },
  $transaction: vi.fn((input) => {
    if (Array.isArray(input)) return Promise.all(input);
    return input(mockPrisma);
  }),
};

describe('RecipeRepository', () => {
  let repository: RecipeRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-ignore - manual mock of PrismaClient
    repository = new RecipeRepository(mockPrisma);
  });

  describe('findByIdWithDetails', () => {
    it('returns a recipe with details when it exists', async () => {
      const recipeId = testIds.recipe();
      const mockRecipe = {
        id: recipeId,
        name: 'Test Recipe',
        description: 'Test Desc',
        laborRate: 25,
        targetMargin: 30,
        totalMaterialsCost: 100,
        laborCost: 25,
        totalProductionCost: 125,
        sellingPrice: 178.57,
        profitValue: 53.57,
        profitPercentage: 30,
        notes: 'Notes',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        items: [
          {
            id: testIds.recipeItem(),
            recipeId: recipeId,
            description: 'Item 1',
            type: RecipeItemType.FLORAL,
            purchaseUnit: 'Package',
            purchaseUnitQuantity: 24,
            purchaseCost: 48,
            unitCost: 2,
            quantityUsed: 10,
            subtotal: 20,
            order: 0,
          },
        ],
      };
      mockPrisma.recipe.findUnique.mockResolvedValue(mockRecipe);

      const result = await repository.findByIdWithDetails(recipeId);

      expect(result?.name).toBe('Test Recipe');
      expect(result?.items).toHaveLength(1);
      expect(result?.items[0].description).toBe('Item 1');
      expect(mockPrisma.recipe.findUnique).toHaveBeenCalled();
    });

    it('returns null when recipe does not exist', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValue(null);
      const result = await repository.findByIdWithDetails('non_existent');
      expect(result).toBeNull();
    });
  });

  describe('searchAndPaginate', () => {
    it('calls findMany with correct filters', async () => {
      mockPrisma.recipe.findMany.mockResolvedValue([]);
      mockPrisma.recipe.count.mockResolvedValue(0);

      const filters = {
        search: 'Test',
        page: 1,
        perPage: 10,
      };

      await repository.searchAndPaginate(filters);

      expect(mockPrisma.recipe.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: { contains: 'Test', mode: 'insensitive' } }),
            ]),
          }),
          take: 10,
          skip: 0,
        }),
      );
    });
  });

  describe('createWithItems', () => {
    it('creates a recipe and its items in a transaction', async () => {
      const recipeId = testIds.recipe();
      mockPrisma.recipe.create.mockResolvedValue({ id: recipeId, name: 'New Recipe' });

      const input = {
        name: 'New Recipe',
        description: 'Desc',
        laborRate: 20,
        targetMargin: 25,
        totalMaterialsCost: 200,
        laborCost: 40,
        totalProductionCost: 240,
        sellingPrice: 320,
        profitValue: 80,
        profitPercentage: 25,
        notes: 'Notes',
        items: [
          {
            description: 'Flower',
            type: RecipeItemType.FLORAL,
            purchaseUnit: 'Stem',
            purchaseUnitQuantity: 1,
            purchaseCost: 2,
            unitCost: 2,
            quantityUsed: 10,
            subtotal: 20,
            order: 0,
          },
        ],
      };

      const result = await repository.createWithItems(input);

      expect(result.id).toBe(recipeId);
      expect(mockPrisma.recipe.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'New Recipe',
            items: expect.objectContaining({
              create: expect.arrayContaining([expect.objectContaining({ description: 'Flower' })]),
            }),
          }),
        }),
      );
    });
  });

  describe('softDelete', () => {
    it('sets deletedAt field', async () => {
      const recipeId = testIds.recipe();
      mockPrisma.recipe.update.mockResolvedValue({ id: recipeId });

      const result = await repository.softDelete(recipeId);

      expect(result).toBe(true);
      expect(mockPrisma.recipe.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: recipeId },
          data: expect.objectContaining({
            deletedAt: expect.any(Date),
          }),
        }),
      );
    });
  });
});

/**
 * RecipeRepository Integration Tests
 *
 * Tests the repository against a real Postgres database spun up via
 * Testcontainers. No mocks — every assertion hits an actual DB query.
 *
 * Run with: pnpm test:integration
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { RecipeRepository } from '../recipe-repository';
import {
  setupTestDatabaseLifecycle,
  getTestPrisma,
  createTestTenant,
} from '@/lib/testing/integration/database';
import type { CreateRecipeInput } from '@/schemas/recipes';

setupTestDatabaseLifecycle();

// -- Shared fixture ----------------------------------------------------------

const baseItem = {
  name: 'Test Flower',
  quantity: 10,
  unitPrice: 2,
  lineTotal: 20,
  retailPrice: 3,
  retailLineTotal: 30,
  order: 0,
};

const recipeInput: CreateRecipeInput = {
  name: 'Wedding Bouquet',
  description: 'Classic white bouquet',
  labourCostType: 'FIXED_AMOUNT',
  labourAmount: 30,
  roundPrice: false,
  totalMaterialsCost: 25,
  labourCost: 30,
  totalCost: 55,
  totalRetailPrice: 40,
  sellingPrice: 85,
  notes: 'Handle with care',
  items: [baseItem],
};

// -- Tests -------------------------------------------------------------------

describe('RecipeRepository (integration)', () => {
  let repository: RecipeRepository;
  let tenantId: string;

  beforeAll(() => {
    repository = new RecipeRepository(getTestPrisma());
  });

  beforeEach(async () => {
    ({ id: tenantId } = await createTestTenant({ name: 'Recipe Test Tenant' }));
  });

  // -- createRecipeWithItems -------------------------------------------------

  describe('createRecipeWithItems', () => {
    it('creates a recipe and returns it as a list item', async () => {
      const result = await repository.createRecipeWithItems(recipeInput, tenantId);

      expect(result.id).toBeDefined();
      expect(result.name).toBe('Wedding Bouquet');
      expect(result.labourCostType).toBe('FIXED_AMOUNT');
      expect(result.labourCost).toBe(30);
      expect(result.sellingPrice).toBe(85);
    });

    it('does not return recipes from other tenants', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Other Tenant' });
      await repository.createRecipeWithItems(recipeInput, tenantId);
      await repository.createRecipeWithItems(recipeInput, otherTenantId);

      const results = await repository.searchRecipes({ page: 1, perPage: 10 }, tenantId);

      expect(results.pagination.totalItems).toBe(1);
    });
  });

  // -- findRecipeById --------------------------------------------------------

  describe('findRecipeById', () => {
    it('returns the recipe with items', async () => {
      const created = await repository.createRecipeWithItems(recipeInput, tenantId);
      const result = await repository.findRecipeById(created.id, tenantId);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.name).toBe('Wedding Bouquet');
      expect(result?.items).toHaveLength(1);
      expect(result?.items[0].name).toBe('Test Flower');
      expect(result?.items[0].quantity).toBe(10);
    });

    it('returns null for a non-existent ID', async () => {
      const result = await repository.findRecipeById('cltest000000000000none0001', tenantId);
      expect(result).toBeNull();
    });

    it('returns null when ID belongs to a different tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Isolation Tenant' });
      const created = await repository.createRecipeWithItems(recipeInput, otherTenantId);

      const result = await repository.findRecipeById(created.id, tenantId);
      expect(result).toBeNull();
    });
  });

  // -- searchRecipes ---------------------------------------------------------

  describe('searchRecipes', () => {
    it('returns paginated results matching search term', async () => {
      await repository.createRecipeWithItems({ ...recipeInput, name: 'Rose Arch' }, tenantId);
      await repository.createRecipeWithItems({ ...recipeInput, name: 'Lily Table' }, tenantId);

      const result = await repository.searchRecipes(
        { search: 'Rose', page: 1, perPage: 10 },
        tenantId,
      );

      expect(result.items.some((recipe) => recipe.name === 'Rose Arch')).toBe(true);
      expect(result.items.every((recipe) => recipe.name !== 'Lily Table')).toBe(true);
    });

    it('returns correct pagination metadata', async () => {
      for (let i = 0; i < 3; i++) {
        await repository.createRecipeWithItems(
          { ...recipeInput, name: `Paginated Recipe ${i}` },
          tenantId,
        );
      }

      const result = await repository.searchRecipes({ page: 1, perPage: 2 }, tenantId);

      expect(result.items.length).toBeLessThanOrEqual(2);
      expect(result.pagination.totalItems).toBeGreaterThanOrEqual(3);
    });
  });

  // -- updateRecipeWithItems -------------------------------------------------

  describe('updateRecipeWithItems', () => {
    it('updates fields and replaces items', async () => {
      const created = await repository.createRecipeWithItems(recipeInput, tenantId);

      const updated = await repository.updateRecipeWithItems(created.id, tenantId, {
        ...recipeInput,
        id: created.id,
        name: 'Updated Bouquet',
        items: [{ ...baseItem, name: 'Pink Peony', quantity: 5 }],
      });

      expect(updated?.name).toBe('Updated Bouquet');

      const withDetails = await repository.findRecipeById(created.id, tenantId);
      expect(withDetails?.items).toHaveLength(1);
      expect(withDetails?.items[0].name).toBe('Pink Peony');
      expect(withDetails?.items[0].quantity).toBe(5);
    });

    it('does not update a recipe belonging to another tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Update Isolation Tenant' });
      const created = await repository.createRecipeWithItems(recipeInput, otherTenantId);

      await expect(
        repository.updateRecipeWithItems(created.id, tenantId, {
          ...recipeInput,
          id: created.id,
          name: 'Should Not Update',
        }),
      ).rejects.toThrow();
    });
  });

  // -- softDeleteRecipe ------------------------------------------------------

  describe('softDeleteRecipe', () => {
    it('sets deletedAt and excludes from search results', async () => {
      const created = await repository.createRecipeWithItems(
        { ...recipeInput, name: 'To Be Deleted' },
        tenantId,
      );

      const deleted = await repository.softDeleteRecipe(created.id, tenantId);
      expect(deleted).toBe(true);

      const found = await repository.findRecipeById(created.id, tenantId);
      expect(found).toBeNull();

      const search = await repository.searchRecipes({ page: 1, perPage: 100 }, tenantId);
      expect(search.items.some((r) => r.id === created.id)).toBe(false);
    });

    it('does not soft-delete a recipe from another tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Delete Isolation Tenant' });
      const created = await repository.createRecipeWithItems(recipeInput, otherTenantId);

      const result = await repository.softDeleteRecipe(created.id, tenantId);
      expect(result).toBe(false);

      const stillExists = await repository.findRecipeById(created.id, otherTenantId);
      expect(stillExists).not.toBeNull();
    });
  });
});

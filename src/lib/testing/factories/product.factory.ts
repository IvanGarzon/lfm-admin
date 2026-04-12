/**
 * Product Factory
 *
 * Creates mock product objects and related data for testing.
 */

import { testIds } from '../id-generator';
import type { CreateProductInput } from '@/schemas/products';
import type {
  ProductListItem,
  ProductWithDetails,
  ProductStatistics,
} from '@/features/inventory/products/types';

/**
 * Creates valid product input data for create mutations.
 */
export function createProductInput(
  overrides: Partial<CreateProductInput> = {},
): CreateProductInput {
  return {
    name: 'Rose Bouquet',
    status: 'ACTIVE',
    price: 49.99,
    stock: 100,
    description: null,
    imageUrl: null,
    availableAt: null,
    ...overrides,
  };
}

/**
 * Creates a mock product list item as returned by searchProducts.
 */
export function createProductListItem(overrides: Partial<ProductListItem> = {}): ProductListItem {
  return {
    id: testIds.product(),
    name: 'Rose Bouquet',
    description: null,
    imageUrl: null,
    status: 'ACTIVE',
    price: 49.99,
    stock: 100,
    availableAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

/**
 * Creates a mock product with full details as returned by findProductById.
 */
export function createProductWithDetails(
  overrides: Partial<ProductWithDetails> = {},
): ProductWithDetails {
  return {
    id: testIds.product(),
    name: 'Rose Bouquet',
    description: null,
    imageUrl: null,
    status: 'ACTIVE',
    price: 49.99,
    stock: 100,
    availableAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    _count: { invoiceItems: 0, quoteItems: 0 },
    ...overrides,
  };
}

/**
 * Creates mock product statistics.
 */
export function createProductStatistics(
  overrides: Partial<ProductStatistics> = {},
): ProductStatistics {
  return {
    totalProducts: 50,
    activeProducts: 40,
    inactiveProducts: 8,
    outOfStockProducts: 2,
    totalValue: 5000,
    averagePrice: 100,
    lowStockProducts: 5,
    growth: { totalProducts: 0 },
    ...overrides,
  };
}

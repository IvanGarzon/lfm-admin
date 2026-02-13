import { Prisma, PrismaClient, ProductStatus } from '@/prisma/client';
import { BaseRepository, type ModelDelegateOperations } from '@/lib/baseRepository';
import { getPaginationMetadata } from '@/lib/utils';

import type { CreateProductInput, UpdateProductInput } from '@/schemas/products';

/**
 * Product type definitions
 */
export type ProductListItem = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  status: ProductStatus;
  price: number;
  stock: number;
  availableAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ProductWithDetails = ProductListItem & {
  _count: {
    invoiceItems: number;
    quoteItems: number;
  };
};

export interface ProductFilters {
  search?: string;
  status?: ProductStatus[];
  page: number;
  perPage: number;
  sort?: { id: string; desc: boolean }[];
}

export type ProductPagination = {
  items: ProductListItem[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextPage: number | null;
    previousPage: number | null;
  };
};

export interface ProductStatistics {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  outOfStockProducts: number;
  totalValue: number;
  averagePrice: number;
  lowStockProducts: number;
  growth: {
    totalProducts: number;
  };
}

/**
 * Product Repository
 * Handles all database operations for products
 * Extends BaseRepository for common CRUD operations
 */
export class ProductRepository extends BaseRepository<Prisma.ProductGetPayload<object>> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected get model(): ModelDelegateOperations<Prisma.ProductGetPayload<object>> {
    return this.prisma.product as unknown as ModelDelegateOperations<
      Prisma.ProductGetPayload<object>
    >;
  }

  /**
   * Search and paginate products with advanced filtering capabilities.
   * Supports full-text search across product name and description,
   * status filtering, sorting, and pagination.
   * @param params - Filter parameters for the search
   * @returns A promise that resolves to paginated products
   */
  async searchAndPaginate(params: ProductFilters): Promise<ProductPagination> {
    const { search, status, page = 1, perPage = 20, sort } = params;

    // Build where clause
    const whereClause: Prisma.ProductWhereInput = {};

    // Search filter
    if (search && search.trim()) {
      whereClause.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    // Status filter
    if (status && status.length > 0) {
      whereClause.status = { in: status };
    }

    // Build orderBy
    let orderBy: Prisma.ProductOrderByWithRelationInput[] = [{ createdAt: 'desc' }];

    if (sort && sort.length > 0) {
      orderBy = sort.map((s) => ({
        [s.id]: s.desc ? 'desc' : 'asc',
      }));
    }

    // Execute queries
    const [items, totalItems] = await Promise.all([
      this.prisma.product.findMany({
        where: whereClause,
        orderBy,
        skip: (page - 1) * perPage,
        take: perPage,
        select: {
          id: true,
          name: true,
          description: true,
          imageUrl: true,
          status: true,
          price: true,
          stock: true,
          availableAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.product.count({ where: whereClause }),
    ]);

    // Convert Decimal to number and ensure type matches ProductListItem
    const formattedItems: ProductListItem[] = items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      imageUrl: item.imageUrl,
      status: item.status,
      price: Number(item.price),
      stock: item.stock,
      availableAt: item.availableAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    const pagination = getPaginationMetadata(totalItems, page, perPage);

    return {
      items: formattedItems,
      pagination,
    };
  }

  /**
   * Find a product by its ID with complete details.
   * @param id - The unique identifier of the product
   * @returns A promise that resolves to the product with all details, or null if not found
   */
  async findByIdWithDetails(id: string): Promise<ProductWithDetails | null> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            invoiceItems: true,
            quoteItems: true,
          },
        },
      },
    });

    if (!product) {
      return null;
    }

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      imageUrl: product.imageUrl,
      status: product.status,
      price: Number(product.price),
      stock: product.stock,
      availableAt: product.availableAt,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      _count: product._count,
    };
  }

  /**
   * Get statistics for products.
   * @returns A promise that resolves to product statistics object
   */
  async getStatistics(): Promise<ProductStatistics> {
    const LOW_STOCK_THRESHOLD = 10;

    const [
      totalProducts,
      activeProducts,
      inactiveProducts,
      outOfStockProducts,
      lowStockProducts,
      aggregates,
    ] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.product.count({ where: { status: ProductStatus.ACTIVE } }),
      this.prisma.product.count({ where: { status: ProductStatus.INACTIVE } }),
      this.prisma.product.count({ where: { status: ProductStatus.OUT_OF_STOCK } }),
      this.prisma.product.count({
        where: {
          stock: { lte: LOW_STOCK_THRESHOLD },
          status: ProductStatus.ACTIVE,
        },
      }),
      this.prisma.product.aggregate({
        _sum: { price: true },
        _avg: { price: true },
      }),
    ]);

    // Calculate total inventory value (price * stock for all products)
    const products = await this.prisma.product.findMany({
      select: { price: true, stock: true },
    });
    const totalValue = products.reduce((sum, p) => sum + Number(p.price) * p.stock, 0);

    return {
      totalProducts,
      activeProducts,
      inactiveProducts,
      outOfStockProducts,
      totalValue,
      averagePrice: Number(aggregates._avg.price) || 0,
      lowStockProducts,
      growth: {
        totalProducts: 0, // Can be expanded with date-based comparison
      },
    };
  }

  /**
   * Create a new product.
   * @param data - The product data
   * @returns A promise that resolves to the created product ID
   */
  async createProduct(data: CreateProductInput): Promise<{ id: string }> {
    const product = await this.prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        status: data.status,
        price: data.price,
        stock: data.stock,
        imageUrl: data.imageUrl,
        availableAt: data.availableAt,
      },
      select: { id: true },
    });

    return { id: product.id };
  }

  /**
   * Update an existing product.
   * @param id - The product ID to update
   * @param data - The updated product data
   * @returns A promise that resolves to the updated product, or null if not found
   */
  async updateProduct(id: string, data: UpdateProductInput): Promise<ProductWithDetails | null> {
    const existing = await this.prisma.product.findUnique({ where: { id } });

    if (!existing) {
      return null;
    }

    await this.prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        status: data.status,
        price: data.price,
        stock: data.stock,
        imageUrl: data.imageUrl,
        availableAt: data.availableAt,
      },
    });

    return this.findByIdWithDetails(id);
  }

  /**
   * Delete a product (hard delete).
   * Note: Products are hard deleted as they don't have a deletedAt field.
   * @param id - The product ID to delete
   * @returns A promise that resolves to true if deleted, false if not found
   */
  async deleteProduct(id: string): Promise<boolean> {
    const existing = await this.prisma.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            invoiceItems: true,
            quoteItems: true,
          },
        },
      },
    });

    if (!existing) {
      return false;
    }

    // Check if product is used in any invoices or quotes
    if (existing._count.invoiceItems > 0 || existing._count.quoteItems > 0) {
      throw new Error(
        'Cannot delete product that is used in invoices or quotes. Consider marking it as inactive instead.',
      );
    }

    await this.prisma.product.delete({ where: { id } });
    return true;
  }

  /**
   * Update product status.
   * @param id - The product ID
   * @param status - The new status
   * @returns A promise that resolves to the updated product
   */
  async updateStatus(id: string, status: ProductStatus): Promise<ProductWithDetails | null> {
    const existing = await this.prisma.product.findUnique({ where: { id } });

    if (!existing) {
      return null;
    }

    await this.prisma.product.update({
      where: { id },
      data: { status },
    });

    return this.findByIdWithDetails(id);
  }

  /**
   * Update status for multiple products.
   * @param ids - Array of product IDs
   * @param status - The new status
   */
  async bulkUpdateStatus(ids: string[], status: ProductStatus): Promise<number> {
    const result = await this.prisma.product.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });
    return result.count;
  }

  /**
   * Delete multiple products.
   * Only deletes products that are not used in invoices or quotes.
   * @param ids - Array of product IDs
   */
  async bulkDelete(ids: string[]): Promise<number> {
    // We need to check usage for each product.
    // To be safe and performant, we only delete those with 0 relations.
    const productsWithRelations = await this.prisma.product.findMany({
      where: {
        id: { in: ids },
        OR: [{ invoiceItems: { some: {} } }, { quoteItems: { some: {} } }],
      },
      select: { id: true },
    });

    const usedIds = new Set(productsWithRelations.map((p) => p.id));
    const safeIds = ids.filter((id) => !usedIds.has(id));

    if (safeIds.length === 0) {
      if (ids.length > 0) {
        throw new Error(
          'Selection cannot be deleted as all products are used in invoices or quotes.',
        );
      }
      return 0;
    }

    const result = await this.prisma.product.deleteMany({
      where: { id: { in: safeIds } },
    });

    return result.count;
  }

  /**
   * Get active products for selection dropdowns.
   * @returns A promise that resolves to array of active products
   */
  async getActiveProducts(): Promise<Array<{ id: string; name: string; price: number }>> {
    const products = await this.prisma.product.findMany({
      where: { status: ProductStatus.ACTIVE },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        price: true,
      },
    });

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
    }));
  }

  /**
   * Update stock for a product.
   * @param id - The product ID
   * @param quantity - The quantity to add (positive) or subtract (negative)
   * @returns A promise that resolves to the updated product
   */
  async updateStock(id: string, quantity: number): Promise<ProductWithDetails | null> {
    const existing = await this.prisma.product.findUnique({ where: { id } });

    if (!existing) {
      return null;
    }

    const newStock = existing.stock + quantity;

    if (newStock < 0) {
      throw new Error('Insufficient stock');
    }

    // Auto-update status based on stock
    let newStatus = existing.status;
    if (newStock === 0 && existing.status === ProductStatus.ACTIVE) {
      newStatus = ProductStatus.OUT_OF_STOCK;
    } else if (newStock > 0 && existing.status === ProductStatus.OUT_OF_STOCK) {
      newStatus = ProductStatus.ACTIVE;
    }

    await this.prisma.product.update({
      where: { id },
      data: {
        stock: newStock,
        status: newStatus,
      },
    });

    return this.findByIdWithDetails(id);
  }
}

// Singleton instance
import { prisma } from '@/lib/prisma';
export const productRepo = new ProductRepository(prisma);

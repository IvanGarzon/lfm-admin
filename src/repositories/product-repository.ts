import { Prisma, PrismaClient, ProductStatus } from '@/prisma/client';
import { BaseRepository, type ModelDelegateOperations } from '@/lib/baseRepository';
import { getPaginationMetadata } from '@/lib/utils';
import type { CreateProductInput, UpdateProductInput } from '@/schemas/products';
import type {
  ProductListItem,
  ProductWithDetails,
  ProductFilters,
  ProductPagination,
  ProductStatistics,
} from '@/features/inventory/products/types';

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
   * @param params - Filter parameters including search, status, page, perPage, and sort
   * @param tenantId - The tenant to scope the query to
   * @returns A promise that resolves to paginated products with metadata
   */
  async searchProducts(params: ProductFilters, tenantId: string): Promise<ProductPagination> {
    const { search, status, page = 1, perPage = 20, sort } = params;

    const whereClause: Prisma.ProductWhereInput = { tenantId };

    if (search && search.trim()) {
      whereClause.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    if (status && status.length > 0) {
      whereClause.status = { in: status };
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput[] = [{ createdAt: 'desc' }];

    if (sort && sort.length > 0) {
      orderBy = sort.map((s) => ({
        [s.id]: s.desc ? 'desc' : 'asc',
      }));
    }

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

    const pagination = getPaginationMetadata(totalItems, perPage, page);

    return { items: formattedItems, pagination };
  }

  /**
   * Find a product by its ID with complete details including relation counts.
   * Scoped to the tenant to prevent cross-tenant data access.
   * @param id - The unique identifier of the product
   * @param tenantId - The tenant to scope the query to
   * @returns A promise that resolves to the product with all details, or null if not found
   */
  async findProductById(id: string, tenantId: string): Promise<ProductWithDetails | null> {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId },
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

    return this.mapToProductWithDetails(product);
  }

  /**
   * Calculate product statistics including inventory value and stock alerts.
   * @param tenantId - The tenant to scope the query to
   * @returns A promise that resolves to product statistics object
   */
  async getProductStatistics(tenantId: string): Promise<ProductStatistics> {
    const LOW_STOCK_THRESHOLD = 10;

    const [
      totalProducts,
      activeProducts,
      inactiveProducts,
      outOfStockProducts,
      lowStockProducts,
      aggregates,
      products,
    ] = await Promise.all([
      this.prisma.product.count({ where: { tenantId } }),
      this.prisma.product.count({ where: { tenantId, status: ProductStatus.ACTIVE } }),
      this.prisma.product.count({ where: { tenantId, status: ProductStatus.INACTIVE } }),
      this.prisma.product.count({ where: { tenantId, status: ProductStatus.OUT_OF_STOCK } }),
      this.prisma.product.count({
        where: { tenantId, stock: { lte: LOW_STOCK_THRESHOLD }, status: ProductStatus.ACTIVE },
      }),
      this.prisma.product.aggregate({
        where: { tenantId },
        _sum: { price: true },
        _avg: { price: true },
      }),
      this.prisma.product.findMany({
        where: { tenantId },
        select: { price: true, stock: true },
      }),
    ]);

    const totalValue = products.reduce((sum, p) => sum + Number(p.price) * p.stock, 0);

    return {
      totalProducts,
      activeProducts,
      inactiveProducts,
      outOfStockProducts,
      totalValue,
      averagePrice: Number(aggregates._avg.price) || 0,
      lowStockProducts,
      growth: { totalProducts: 0 },
    };
  }

  /**
   * Create a new product record.
   * @param data - The product creation input data
   * @param tenantId - The tenant this product belongs to
   * @returns A promise that resolves to an object containing the new product ID
   */
  async createProduct(data: CreateProductInput, tenantId: string): Promise<{ id: string }> {
    const product = await this.prisma.product.create({
      data: {
        tenantId,
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
   * Update an existing product record.
   * Verifies tenant ownership before applying the update.
   * @param id - The ID of the product to update
   * @param tenantId - The tenant to scope the operation to
   * @param data - The update data
   * @returns A promise that resolves to the updated product with details, or null if not found
   */
  async updateProduct(
    id: string,
    tenantId: string,
    data: UpdateProductInput,
  ): Promise<ProductWithDetails | null> {
    const existing = await this.prisma.product.findFirst({ where: { id, tenantId } });

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

    return this.findProductById(id, tenantId);
  }

  /**
   * Permanently deletes a product record.
   * Only allows deletion if the product is not referenced in any invoices or quotes.
   * Verifies tenant ownership before deleting.
   * @param id - The ID of the product to delete
   * @param tenantId - The tenant to scope the operation to
   * @returns A promise that resolves to true if deleted, false if not found
   * @throws {Error} If product is in use and cannot be deleted
   */
  async deleteProduct(id: string, tenantId: string): Promise<boolean> {
    const existing = await this.prisma.product.findFirst({
      where: { id, tenantId },
      include: {
        _count: { select: { invoiceItems: true, quoteItems: true } },
      },
    });

    if (!existing) {
      return false;
    }

    if (existing._count.invoiceItems > 0 || existing._count.quoteItems > 0) {
      throw new Error(
        'Cannot delete product that is used in invoices or quotes. Consider marking it as inactive instead.',
      );
    }

    await this.prisma.product.delete({ where: { id } });
    return true;
  }

  /**
   * Updates the status of a specific product.
   * Verifies tenant ownership before applying the update.
   * @param id - The product ID
   * @param tenantId - The tenant to scope the operation to
   * @param status - The new status to apply
   * @returns A promise that resolves to the updated product with details, or null if not found
   */
  async updateProductStatus(
    id: string,
    tenantId: string,
    status: ProductStatus,
  ): Promise<ProductWithDetails | null> {
    const existing = await this.prisma.product.findFirst({ where: { id, tenantId } });

    if (!existing) {
      return null;
    }

    await this.prisma.product.update({ where: { id }, data: { status } });

    return this.findProductById(id, tenantId);
  }

  /**
   * Updates the status for a batch of products.
   * Scoped to the tenant to prevent cross-tenant mutations.
   * @param ids - Array of product IDs to update
   * @param tenantId - The tenant to scope the operation to
   * @param status - The new status to apply to all selected products
   * @returns A promise that resolves to the number of updated records
   */
  async bulkUpdateProductStatus(
    ids: string[],
    tenantId: string,
    status: ProductStatus,
  ): Promise<number> {
    const result = await this.prisma.product.updateMany({
      where: { id: { in: ids }, tenantId },
      data: { status },
    });
    return result.count;
  }

  /**
   * Deletes multiple products in a single operation.
   * Automatically filters out products that are in use.
   * Scoped to the tenant to prevent cross-tenant deletions.
   * @param ids - Array of product IDs to delete
   * @param tenantId - The tenant to scope the operation to
   * @returns A promise that resolves to the number of deleted records
   * @throws {Error} If no products can be deleted among the selection
   */
  async bulkDeleteProducts(ids: string[], tenantId: string): Promise<number> {
    const productsWithRelations = await this.prisma.product.findMany({
      where: {
        id: { in: ids },
        tenantId,
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
      where: { id: { in: safeIds }, tenantId },
    });

    return result.count;
  }

  /**
   * Retrieves active products with essential fields for selection components.
   * @param tenantId - The tenant to scope the query to
   * @returns A promise that resolves to an array of active products for selection
   */
  async getActiveProducts(
    tenantId: string,
  ): Promise<Array<{ id: string; name: string; price: number }>> {
    const products = await this.prisma.product.findMany({
      where: { tenantId, status: ProductStatus.ACTIVE },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, price: true },
    });

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
    }));
  }

  /**
   * Updates the stock level for a product.
   * Automatically adjusts product status (marks OUT_OF_STOCK if stock reaches zero).
   * Verifies tenant ownership before applying the update.
   * @param id - The product ID
   * @param tenantId - The tenant to scope the operation to
   * @param quantity - The amount to add (positive) or subtract (negative)
   * @returns A promise that resolves to the updated product with details, or null if not found
   * @throws {Error} If the adjustment results in negative stock
   */
  async updateProductStock(
    id: string,
    tenantId: string,
    quantity: number,
  ): Promise<ProductWithDetails | null> {
    const existing = await this.prisma.product.findFirst({ where: { id, tenantId } });

    if (!existing) {
      return null;
    }

    const newStock = existing.stock + quantity;

    if (newStock < 0) {
      throw new Error('Insufficient stock');
    }

    let newStatus = existing.status;
    if (newStock === 0 && existing.status === ProductStatus.ACTIVE) {
      newStatus = ProductStatus.OUT_OF_STOCK;
    } else if (newStock > 0 && existing.status === ProductStatus.OUT_OF_STOCK) {
      newStatus = ProductStatus.ACTIVE;
    }

    await this.prisma.product.update({
      where: { id },
      data: { stock: newStock, status: newStatus },
    });

    return this.findProductById(id, tenantId);
  }

  // -- Private helpers -------------------------------------------------------

  /**
   * Maps a raw Prisma product record (with _count) to a ProductWithDetails type.
   * Converts Decimal price to number at the repository boundary.
   * @param product - The raw Prisma product record
   * @returns The mapped ProductWithDetails object
   */
  private mapToProductWithDetails(
    product: Prisma.ProductGetPayload<{
      include: { _count: { select: { invoiceItems: true; quoteItems: true } } };
    }>,
  ): ProductWithDetails {
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
}

// -- Singleton instance -------------------------------------------------------

import { prisma } from '@/lib/prisma';
export const productRepo = new ProductRepository(prisma);

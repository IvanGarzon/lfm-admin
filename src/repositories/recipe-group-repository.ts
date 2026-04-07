import { Prisma, PrismaClient, type RecipeGroup } from '@/prisma/client';
import { BaseRepository, type ModelDelegateOperations } from '@/lib/baseRepository';
import { getPaginationMetadata } from '@/lib/utils';
import type {
  RecipeGroupListItem,
  RecipeGroupPagination,
  RecipeGroupWithItems,
  RecipeGroupSearchParams,
  RecipeGroupCreateData,
  RecipeGroupUpdateData,
} from '@/features/finances/recipe-groups/types';

// -- Repository ------------------------------------------------------------

export class RecipeGroupRepository extends BaseRepository<Prisma.RecipeGroupGetPayload<object>> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected get model(): ModelDelegateOperations<Prisma.RecipeGroupGetPayload<object>> {
    return this.prisma.recipeGroup as unknown as ModelDelegateOperations<
      Prisma.RecipeGroupGetPayload<object>
    >;
  }

  /**
   * Maps a Prisma recipe group row (with item/recipe includes) to a RecipeGroupListItem.
   * Computes totalSellingPrice from item selling prices.
   */
  private toListItem(
    row: Prisma.RecipeGroupGetPayload<{
      include: {
        _count: { select: { items: true } };
        items: { include: { recipe: { select: { sellingPrice: true } } } };
      };
    }>,
  ): RecipeGroupListItem {
    const totalSellingPrice = row.items.reduce(
      (sum, item) => sum + Number(item.recipe.sellingPrice) * item.quantity,
      0,
    );

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      totalCost: Number(row.totalCost),
      totalSellingPrice,
      itemCount: row._count.items,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  /**
   * Returns a paginated, filtered list of recipe groups for a tenant.
   * Supports full-text search on name and description, and column-based sorting.
   */
  async searchRecipeGroups(
    params: RecipeGroupSearchParams,
    tenantId: string,
  ): Promise<RecipeGroupPagination> {
    const page = Math.max(1, Number(params.page) || 1);
    const perPage = Math.min(100, Math.max(1, Number(params.perPage) || 10));

    const where: Prisma.RecipeGroupWhereInput = { tenantId, deletedAt: null };

    if (params.search?.trim()) {
      where.OR = [
        { name: { contains: params.search.trim(), mode: 'insensitive' } },
        { description: { contains: params.search.trim(), mode: 'insensitive' } },
      ];
    }

    let orderBy: Prisma.RecipeGroupOrderByWithRelationInput[] = [{ updatedAt: 'desc' }];

    if (params.sort) {
      try {
        const sortArray = JSON.parse(params.sort);
        if (Array.isArray(sortArray) && sortArray.length > 0) {
          orderBy = sortArray.map((s: { id: string; desc: boolean }) => ({
            [s.id]: s.desc ? 'desc' : 'asc',
          }));
        }
      } catch {
        // Keep default sort on parse error
      }
    }

    const skip = page > 0 ? perPage * (page - 1) : 0;

    const [rows, total] = await Promise.all([
      this.prisma.recipeGroup.findMany({
        where,
        orderBy,
        skip,
        take: perPage,
        include: {
          _count: { select: { items: true } },
          items: { include: { recipe: { select: { sellingPrice: true } } } },
        },
      }),
      this.prisma.recipeGroup.count({ where }),
    ]);

    return {
      items: rows.map((row) => this.toListItem(row)),
      pagination: getPaginationMetadata(total, perPage, page),
    };
  }

  /**
   * Returns all recipe groups for a tenant, ordered by name.
   * Intended for dropdown/select use cases where pagination is not needed.
   */
  async findAllRecipeGroups(tenantId: string): Promise<RecipeGroupListItem[]> {
    const rows = await this.prisma.recipeGroup.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { items: true } },
        items: { include: { recipe: { select: { sellingPrice: true } } } },
      },
    });

    return rows.map((row) => this.toListItem(row));
  }

  /**
   * Returns a single recipe group with full item details, scoped to the given tenant.
   * Returns null if not found or soft-deleted.
   */
  async findRecipeGroupById(id: string, tenantId: string): Promise<RecipeGroupWithItems | null> {
    const row = await this.prisma.recipeGroup.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        items: {
          include: {
            recipe: {
              select: {
                id: true,
                name: true,
                totalRetailPrice: true,
                totalCost: true,
                sellingPrice: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!row) {
      return null;
    }

    const items = row.items.map((item) => ({
      id: item.id,
      recipeGroupId: item.recipeGroupId,
      recipeId: item.recipeId,
      quantity: item.quantity,
      subtotal: Number(item.subtotal),
      order: item.order,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      recipe: {
        id: item.recipe.id,
        name: item.recipe.name,
        totalRetailPrice: Number(item.recipe.totalRetailPrice),
        totalCost: Number(item.recipe.totalCost),
        sellingPrice: Number(item.recipe.sellingPrice),
      },
    }));

    const totalSellingPrice = items.reduce(
      (sum, item) => sum + item.recipe.sellingPrice * item.quantity,
      0,
    );

    return {
      id: row.id,
      tenantId: row.tenantId,
      name: row.name,
      description: row.description,
      totalCost: Number(row.totalCost),
      totalSellingPrice,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
      items,
    };
  }

  /**
   * Creates a new recipe group with its items for a tenant.
   * Fetches current recipe prices to compute item subtotals, totalCost, and totalSellingPrice.
   */
  async createRecipeGroup(
    data: RecipeGroupCreateData,
    tenantId: string,
  ): Promise<RecipeGroup & { totalSellingPrice: number }> {
    const recipeIds = data.items.map((item) => item.recipeId);
    const recipes = await this.prisma.recipe.findMany({
      where: { id: { in: recipeIds } },
      select: { id: true, totalRetailPrice: true, sellingPrice: true },
    });

    const retailMap = new Map(recipes.map((r) => [r.id, Number(r.totalRetailPrice)]));
    const sellingMap = new Map(recipes.map((r) => [r.id, Number(r.sellingPrice)]));

    const itemsWithSubtotals = data.items.map((item) => ({
      recipeId: item.recipeId,
      quantity: item.quantity,
      subtotal: (retailMap.get(item.recipeId) ?? 0) * item.quantity,
      order: item.order,
    }));

    const totalCost = itemsWithSubtotals.reduce((sum, item) => sum + item.subtotal, 0);
    const totalSellingPrice = data.items.reduce(
      (sum, item) => sum + (sellingMap.get(item.recipeId) ?? 0) * item.quantity,
      0,
    );

    const recipeGroup = await this.prisma.recipeGroup.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        totalCost,
        items: { create: itemsWithSubtotals },
      },
    });

    return { ...recipeGroup, totalSellingPrice };
  }

  /**
   * Updates an existing recipe group's fields and/or items.
   * When items are provided, existing items are replaced and prices recalculated.
   * When only name/description change, totalSellingPrice is derived from existing items.
   */
  async updateRecipeGroup(
    id: string,
    data: RecipeGroupUpdateData,
  ): Promise<RecipeGroup & { totalSellingPrice: number }> {
    if (data.items) {
      const recipeIds = data.items.map((item) => item.recipeId);
      const recipes = await this.prisma.recipe.findMany({
        where: { id: { in: recipeIds } },
        select: { id: true, totalRetailPrice: true, sellingPrice: true },
      });

      const retailMap = new Map(recipes.map((r) => [r.id, Number(r.totalRetailPrice)]));
      const sellingMap = new Map(recipes.map((r) => [r.id, Number(r.sellingPrice)]));

      const itemsWithSubtotals = data.items.map((item) => ({
        recipeId: item.recipeId,
        quantity: item.quantity,
        subtotal: (retailMap.get(item.recipeId) ?? 0) * item.quantity,
        order: item.order,
      }));

      const totalCost = itemsWithSubtotals.reduce((sum, item) => sum + item.subtotal, 0);
      const totalSellingPrice = data.items.reduce(
        (sum, item) => sum + (sellingMap.get(item.recipeId) ?? 0) * item.quantity,
        0,
      );

      const recipeGroup = await this.prisma.recipeGroup.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          totalCost,
          items: { deleteMany: {}, create: itemsWithSubtotals },
        },
      });

      return { ...recipeGroup, totalSellingPrice };
    }

    // Items unchanged — derive totalSellingPrice from existing item records
    const existingItems = await this.prisma.recipeGroupItem.findMany({
      where: { recipeGroupId: id },
      select: { quantity: true, recipe: { select: { sellingPrice: true } } },
    });

    const totalSellingPrice = existingItems.reduce(
      (sum, item) => sum + Number(item.recipe.sellingPrice) * item.quantity,
      0,
    );

    const recipeGroup = await this.prisma.recipeGroup.update({
      where: { id },
      data: { name: data.name, description: data.description },
    });

    return { ...recipeGroup, totalSellingPrice };
  }

  /**
   * Soft-deletes a recipe group by setting its deletedAt timestamp.
   */
  async softDeleteRecipeGroup(id: string): Promise<RecipeGroup> {
    return this.prisma.recipeGroup.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

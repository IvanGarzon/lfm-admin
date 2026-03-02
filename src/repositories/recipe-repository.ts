import { Recipe, Prisma, PrismaClient } from '@/prisma/client';
import { BaseRepository, type ModelDelegateOperations } from '@/lib/baseRepository';
import { getPaginationMetadata } from '@/lib/utils';
import type {
  RecipeListItem,
  RecipeWithDetails,
  RecipeFilters,
  RecipePagination,
} from '@/features/finances/recipes/types';
import type { CreateRecipeInput, UpdateRecipeInput } from '@/schemas/recipes';

export class RecipeRepository extends BaseRepository<Prisma.RecipeGetPayload<object>> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected get model(): ModelDelegateOperations<Prisma.RecipeGetPayload<object>> {
    return this.prisma.recipe as unknown as ModelDelegateOperations<
      Prisma.RecipeGetPayload<object>
    >;
  }

  async searchAndPaginate(params: RecipeFilters): Promise<RecipePagination> {
    const { search, page, perPage, sort } = params;

    const whereClause: Prisma.RecipeWhereInput = {
      deletedAt: null,
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { description: { contains: search, mode: Prisma.QueryMode.insensitive } },
      ];
    }

    const skip = page > 0 ? perPage * (page - 1) : 0;

    const orderBy: Prisma.RecipeOrderByWithRelationInput[] =
      sort && sort.length > 0
        ? sort.map((s) => ({ [s.id]: s.desc ? 'desc' : 'asc' }))
        : [{ createdAt: 'desc' }];

    const [totalItems, recipes] = await Promise.all([
      this.prisma.recipe.count({ where: whereClause }),
      this.prisma.recipe.findMany({
        where: whereClause,
        orderBy,
        skip,
        take: perPage,
      }),
    ]);

    const items: RecipeListItem[] = recipes.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      labourCostType: r.labourCostType,
      labourAmount: Number(r.labourAmount),
      totalMaterialsCost: Number(r.totalMaterialsCost),
      laborCost: Number(r.laborCost),
      totalCost: Number(r.totalCost),
      totalRetailPrice: Number(r.totalRetailPrice),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    return {
      items,
      pagination: getPaginationMetadata(totalItems, perPage, page),
    };
  }

  async findByIdWithDetails(id: string): Promise<RecipeWithDetails | null> {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id, deletedAt: null },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!recipe) return null;

    return {
      ...recipe,
      labourCostType: recipe.labourCostType,
      labourAmount: Number(recipe.labourAmount),
      totalMaterialsCost: Number(recipe.totalMaterialsCost),
      laborCost: Number(recipe.laborCost),
      totalCost: Number(recipe.totalCost),
      totalRetailPrice: Number(recipe.totalRetailPrice),
      items: recipe.items.map((i) => ({
        id: i.id,
        recipeId: i.recipeId,
        priceListItemId: i.priceListItemId,
        name: i.name,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
        lineTotal: Number(i.lineTotal),
        retailPrice: Number(i.retailPrice),
        retailLineTotal: Number(i.retailLineTotal),
        order: i.order,
      })),
    };
  }

  async createWithItems(data: CreateRecipeInput): Promise<Recipe> {
    return this.prisma.$transaction(async (tx) => {
      const recipe = await tx.recipe.create({
        data: {
          name: data.name,
          description: data.description,
          labourCostType: data.labourCostType,
          labourAmount: data.labourAmount,
          totalMaterialsCost: data.totalMaterialsCost,
          laborCost: data.laborCost,
          totalCost: data.totalCost,
          totalRetailPrice: data.totalRetailPrice,
          notes: data.notes,
          items: {
            create: data.items.map((item, index) => ({
              priceListItemId: item.priceListItemId,
              name: item.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              lineTotal: item.lineTotal,
              retailPrice: item.retailPrice,
              retailLineTotal: item.retailLineTotal,
              order: item.order ?? index,
            })),
          },
        },
      });
      return recipe;
    });
  }

  async updateWithItems(id: string, data: UpdateRecipeInput): Promise<Recipe> {
    return this.prisma.$transaction(async (tx) => {
      // Delete existing items
      await tx.recipeItem.deleteMany({
        where: { recipeId: id },
      });

      // Update recipe and recreate items
      const recipe = await tx.recipe.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          labourCostType: data.labourCostType,
          labourAmount: data.labourAmount,
          totalMaterialsCost: data.totalMaterialsCost,
          laborCost: data.laborCost,
          totalCost: data.totalCost,
          totalRetailPrice: data.totalRetailPrice,
          notes: data.notes,
          items: {
            create: data.items.map((item, index) => ({
              priceListItemId: item.priceListItemId,
              name: item.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              lineTotal: item.lineTotal,
              retailPrice: item.retailPrice,
              retailLineTotal: item.retailLineTotal,
              order: item.order ?? index,
            })),
          },
        },
      });
      return recipe;
    });
  }

  async softDelete(id: string): Promise<boolean> {
    try {
      await this.prisma.recipe.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      return true;
    } catch {
      return false;
    }
  }
}

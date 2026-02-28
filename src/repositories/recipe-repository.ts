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
      totalMaterialsCost: Number(r.totalMaterialsCost),
      laborCost: Number(r.laborCost),
      totalProductionCost: Number(r.totalProductionCost),
      sellingPrice: Number(r.sellingPrice),
      profitValue: Number(r.profitValue),
      profitPercentage: Number(r.profitPercentage),
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
      laborRate: Number(recipe.laborRate),
      targetMargin: Number(recipe.targetMargin),
      totalMaterialsCost: Number(recipe.totalMaterialsCost),
      laborCost: Number(recipe.laborCost),
      totalProductionCost: Number(recipe.totalProductionCost),
      sellingPrice: Number(recipe.sellingPrice),
      profitValue: Number(recipe.profitValue),
      profitPercentage: Number(recipe.profitPercentage),
      items: recipe.items.map((i) => ({
        ...i,
        purchaseUnitQuantity: Number(i.purchaseUnitQuantity),
        purchaseCost: Number(i.purchaseCost),
        unitCost: Number(i.unitCost),
        quantityUsed: Number(i.quantityUsed),
        subtotal: Number(i.subtotal),
      })),
    };
  }

  async createWithItems(data: CreateRecipeInput): Promise<Recipe> {
    return this.prisma.$transaction(async (tx) => {
      const recipe = await tx.recipe.create({
        data: {
          name: data.name,
          description: data.description,
          laborRate: data.laborRate,
          targetMargin: data.targetMargin,
          totalMaterialsCost: data.totalMaterialsCost,
          laborCost: data.laborCost,
          totalProductionCost: data.totalProductionCost,
          sellingPrice: data.sellingPrice,
          profitValue: data.profitValue,
          profitPercentage: data.profitPercentage,
          notes: data.notes,
          items: {
            create: data.items.map((item, index) => ({
              description: item.description,
              type: item.type,
              purchaseUnit: item.purchaseUnit,
              purchaseUnitQuantity: item.purchaseUnitQuantity,
              purchaseCost: item.purchaseCost,
              unitCost: item.unitCost,
              quantityUsed: item.quantityUsed,
              subtotal: item.subtotal,
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
          laborRate: data.laborRate,
          targetMargin: data.targetMargin,
          totalMaterialsCost: data.totalMaterialsCost,
          laborCost: data.laborCost,
          totalProductionCost: data.totalProductionCost,
          sellingPrice: data.sellingPrice,
          profitValue: data.profitValue,
          profitPercentage: data.profitPercentage,
          notes: data.notes,
          items: {
            create: data.items.map((item, index) => ({
              description: item.description,
              type: item.type,
              purchaseUnit: item.purchaseUnit,
              purchaseUnitQuantity: item.purchaseUnitQuantity,
              purchaseCost: item.purchaseCost,
              unitCost: item.unitCost,
              quantityUsed: item.quantityUsed,
              subtotal: item.subtotal,
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

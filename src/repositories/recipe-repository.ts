import { Prisma, PrismaClient, LabourCostType, RoundingMethod } from '@/prisma/client';
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

  /**
   * Map a raw Prisma recipe row to the RecipeListItem plain type.
   * Converts all Decimal fields to number.
   * @param recipe - The raw Prisma recipe record.
   * @returns A plain RecipeListItem with all numeric fields as number.
   */
  private toListItem(recipe: {
    id: string;
    name: string;
    description?: string | null;
    labourCostType: LabourCostType;
    labourAmount: Prisma.Decimal;
    roundPrice: boolean | null;
    roundingMethod: RoundingMethod | null;
    totalMaterialsCost: Prisma.Decimal;
    labourCost: Prisma.Decimal;
    totalCost: Prisma.Decimal;
    totalRetailPrice: Prisma.Decimal;
    sellingPrice: Prisma.Decimal;
    createdAt: Date;
    updatedAt: Date;
  }): RecipeListItem {
    const labourCost = Number(recipe.labourCost);
    const totalRetailPrice = Number(recipe.totalRetailPrice);
    let sellingPrice = Number(recipe.sellingPrice);

    // Calculate selling price if it's 0 (for existing recipes created before this field was added)
    if (sellingPrice === 0) {
      sellingPrice = totalRetailPrice + labourCost;

      if (recipe.roundPrice && sellingPrice > 0) {
        const roundingMethod = recipe.roundingMethod ?? 'NEAREST';
        if (roundingMethod === 'NEAREST') {
          sellingPrice = Math.round(sellingPrice);
        } else if (roundingMethod === 'PSYCHOLOGICAL_99') {
          sellingPrice = Math.ceil(sellingPrice) - 0.01;
        } else if (roundingMethod === 'PSYCHOLOGICAL_95') {
          sellingPrice = Math.ceil(sellingPrice) - 0.05;
        }
      }
    }

    return {
      id: recipe.id,
      name: recipe.name,
      description: recipe.description,
      labourCostType: recipe.labourCostType,
      labourAmount: Number(recipe.labourAmount),
      roundPrice: recipe.roundPrice ?? undefined,
      roundingMethod: recipe.roundingMethod ?? undefined,
      totalMaterialsCost: Number(recipe.totalMaterialsCost),
      labourCost,
      totalCost: Number(recipe.totalCost),
      totalRetailPrice,
      sellingPrice,
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
    };
  }

  /**
   * Search and paginate recipes with optional text search and sorting.
   * @param params - Filter parameters including search term, pagination, and sort options.
   * @param tenantId - The tenant scope for the query.
   * @returns Paginated recipe list items with pagination metadata.
   */
  async searchRecipes(params: RecipeFilters, tenantId: string): Promise<RecipePagination> {
    const { search, page, perPage, sort } = params;

    const whereClause: Prisma.RecipeWhereInput = {
      tenantId,
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

    const items: RecipeListItem[] = recipes.map((r) => this.toListItem(r));

    return {
      items,
      pagination: getPaginationMetadata(totalItems, perPage, page),
    };
  }

  /**
   * Find a recipe by ID with all associated items.
   * @param id - The recipe ID.
   * @param tenantId - The tenant scope for the query.
   * @returns The recipe with full item details, or null if not found.
   */
  async findRecipeById(id: string, tenantId: string): Promise<RecipeWithDetails | null> {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id, tenantId, deletedAt: null },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!recipe) {
      return null;
    }

    const labourCost = Number(recipe.labourCost);
    const totalRetailPrice = Number(recipe.totalRetailPrice);
    const sellingPrice = Number(recipe.sellingPrice);

    return {
      id: recipe.id,
      name: recipe.name,
      description: recipe.description,
      labourCostType: recipe.labourCostType,
      labourAmount: Number(recipe.labourAmount),
      roundPrice: recipe.roundPrice ?? undefined,
      roundingMethod: recipe.roundingMethod ?? undefined,
      totalMaterialsCost: Number(recipe.totalMaterialsCost),
      labourCost,
      totalCost: Number(recipe.totalCost),
      totalRetailPrice,
      sellingPrice,
      notes: recipe.notes,
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
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

  /**
   * Find a recipe by ID, scoped to a tenant. Returns only list-level fields.
   * @param id - The recipe ID.
   * @param tenantId - The tenant scope for the query.
   * @returns The recipe list item, or null if not found.
   */
  async findRecipeByIdAsListItem(id: string, tenantId: string): Promise<RecipeListItem | null> {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id, tenantId, deletedAt: null },
    });

    if (!recipe) {
      return null;
    }

    return this.toListItem(recipe);
  }

  /**
   * Create a new recipe with its associated items in a single operation.
   * Re-fetches the created record to return the full typed shape.
   * @param data - Validated create input including items.
   * @param tenantId - The tenant to associate the recipe with.
   * @returns The newly created recipe as a list item.
   */
  async createRecipeWithItems(data: CreateRecipeInput, tenantId: string): Promise<RecipeListItem> {
    const recipe = await this.prisma.recipe.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        labourCostType: data.labourCostType,
        labourAmount: data.labourAmount,
        roundPrice: data.roundPrice,
        roundingMethod: data.roundingMethod,
        totalMaterialsCost: data.totalMaterialsCost,
        labourCost: data.labourCost,
        totalCost: data.totalCost,
        totalRetailPrice: data.totalRetailPrice,
        sellingPrice: data.sellingPrice,
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

    const createdRecipe = await this.findRecipeByIdAsListItem(recipe.id, tenantId);

    if (!createdRecipe) {
      throw new Error('Failed to retrieve created recipe');
    }

    return createdRecipe;
  }

  /**
   * Replace a recipe's items and update its fields atomically in a transaction.
   * @param id - The recipe ID to update.
   * @param tenantId - The tenant scope to prevent cross-tenant mutation.
   * @param data - Validated update input including replacement items.
   * @returns The updated recipe as a list item, or null if not found.
   */
  async updateRecipeWithItems(
    id: string,
    tenantId: string,
    data: UpdateRecipeInput,
  ): Promise<RecipeListItem | null> {
    const updatedRecipe = await this.prisma.$transaction(async (tx) => {
      await tx.recipeItem.deleteMany({
        where: { recipeId: id },
      });

      return tx.recipe.update({
        where: { id, tenantId },
        data: {
          name: data.name,
          description: data.description,
          labourCostType: data.labourCostType,
          labourAmount: data.labourAmount,
          roundPrice: data.roundPrice,
          roundingMethod: data.roundingMethod,
          totalMaterialsCost: data.totalMaterialsCost,
          labourCost: data.labourCost,
          totalCost: data.totalCost,
          totalRetailPrice: data.totalRetailPrice,
          sellingPrice: data.sellingPrice,
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
    });

    if (!updatedRecipe) {
      return null;
    }

    return await this.findRecipeByIdAsListItem(updatedRecipe.id, tenantId);
  }

  /**
   * Soft-delete a recipe by setting its deletedAt timestamp.
   * Scoped to tenantId to prevent cross-tenant deletions.
   * @param id - The recipe ID to soft-delete.
   * @param tenantId - The tenant scope for the deletion.
   * @returns True if the deletion succeeded, false otherwise.
   */
  async softDeleteRecipe(id: string, tenantId: string): Promise<boolean> {
    try {
      await this.prisma.recipe.update({
        where: { id, tenantId },
        data: { deletedAt: new Date() },
      });
      return true;
    } catch {
      return false;
    }
  }
}

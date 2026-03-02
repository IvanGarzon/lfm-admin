import type { Prisma, RecipeGroup, RecipeGroupItem } from '@/prisma/client';
import { prisma } from '@/lib/prisma';
import type { PaginationMeta } from '@/types/pagination';

export type RecipeGroupWithItems = RecipeGroup & {
  items: (RecipeGroupItem & {
    recipe: {
      id: string;
      name: string;
      totalRetailPrice: number;
      totalCost: number;
    };
  })[];
};

export type RecipeGroupListItem = {
  id: string;
  name: string;
  description: string | null;
  totalCost: number;
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
};

interface SearchParams {
  search?: string;
  page?: string;
  perPage?: string;
  sort?: string;
}

export class RecipeGroupRepository {
  async searchAndPaginate(params: SearchParams): Promise<{
    items: RecipeGroupListItem[];
    pagination: PaginationMeta;
  }> {
    const page = Math.max(1, Number(params.page) || 1);
    const perPage = Math.min(100, Math.max(1, Number(params.perPage) || 10));

    const where: Prisma.RecipeGroupWhereInput = {
      deletedAt: null,
    };

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
          orderBy = sortArray.map((s) => ({
            [s.id]: s.desc ? 'desc' : 'asc',
          }));
        }
      } catch {
        // Keep default sort on parse error
      }
    }

    const [items, total] = await Promise.all([
      prisma.recipeGroup.findMany({
        where,
        orderBy,
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          _count: {
            select: { items: true },
          },
        },
      }),
      prisma.recipeGroup.count({ where }),
    ]);

    const totalPages = Math.ceil(total / perPage);

    return {
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        totalCost: Number(item.totalCost),
        itemCount: item._count.items,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
      pagination: {
        totalItems: total,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        nextPage: page < totalPages ? page + 1 : null,
        previousPage: page > 1 ? page - 1 : null,
      },
    };
  }

  async findById(id: string): Promise<RecipeGroupWithItems | null> {
    const recipeGroup = await prisma.recipeGroup.findFirst({
      where: { id, deletedAt: null },
      include: {
        items: {
          include: {
            recipe: {
              select: {
                id: true,
                name: true,
                totalRetailPrice: true,
                totalCost: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!recipeGroup) return null;

    return {
      ...recipeGroup,
      totalCost: Number(recipeGroup.totalCost),
      items: recipeGroup.items.map((item) => ({
        ...item,
        subtotal: Number(item.subtotal),
        recipe: {
          ...item.recipe,
          totalRetailPrice: Number(item.recipe.totalRetailPrice),
          totalCost: Number(item.recipe.totalCost),
        },
      })),
    } as RecipeGroupWithItems;
  }

  async create(data: {
    name: string;
    description?: string | null;
    items: { recipeId: string; quantity: number; order: number }[];
  }): Promise<RecipeGroup> {
    // Fetch recipe prices to calculate subtotals
    const recipeIds = data.items.map((item) => item.recipeId);
    const recipes = await prisma.recipe.findMany({
      where: { id: { in: recipeIds } },
      select: { id: true, totalRetailPrice: true },
    });

    const recipeMap = new Map(recipes.map((r) => [r.id, Number(r.totalRetailPrice)]));

    // Calculate item subtotals and total cost
    const itemsWithSubtotals = data.items.map((item) => {
      const retailPrice = recipeMap.get(item.recipeId) || 0;
      return {
        recipeId: item.recipeId,
        quantity: item.quantity,
        subtotal: retailPrice * item.quantity,
        order: item.order,
      };
    });

    const totalCost = itemsWithSubtotals.reduce((sum, item) => sum + item.subtotal, 0);

    return prisma.recipeGroup.create({
      data: {
        name: data.name,
        description: data.description,
        totalCost,
        items: {
          create: itemsWithSubtotals,
        },
      },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      description?: string | null;
      items?: { recipeId: string; quantity: number; order: number }[];
    },
  ): Promise<RecipeGroup> {
    if (data.items) {
      // Fetch recipe prices to calculate subtotals
      const recipeIds = data.items.map((item) => item.recipeId);
      const recipes = await prisma.recipe.findMany({
        where: { id: { in: recipeIds } },
        select: { id: true, totalRetailPrice: true },
      });

      const recipeMap = new Map(recipes.map((r) => [r.id, Number(r.totalRetailPrice)]));

      // Calculate item subtotals and total cost
      const itemsWithSubtotals = data.items.map((item) => {
        const retailPrice = recipeMap.get(item.recipeId) || 0;
        return {
          recipeId: item.recipeId,
          quantity: item.quantity,
          subtotal: retailPrice * item.quantity,
          order: item.order,
        };
      });

      const totalCost = itemsWithSubtotals.reduce((sum, item) => sum + item.subtotal, 0);

      return prisma.recipeGroup.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          totalCost,
          items: {
            deleteMany: {},
            create: itemsWithSubtotals,
          },
        },
      });
    }

    return prisma.recipeGroup.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
      },
    });
  }

  async delete(id: string): Promise<RecipeGroup> {
    return prisma.recipeGroup.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getAll(): Promise<RecipeGroupListItem[]> {
    const items = await prisma.recipeGroup.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    return items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      totalCost: Number(item.totalCost),
      itemCount: item._count.items,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));
  }
}

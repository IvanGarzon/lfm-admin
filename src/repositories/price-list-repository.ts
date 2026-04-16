import { Prisma, PrismaClient } from '@/prisma/client';
import { BaseRepository, type ModelDelegateOperations } from '@/lib/baseRepository';
import { getPaginationMetadata } from '@/lib/utils';
import { calculateRetailPrice, hasCostChanged } from '@/services/price-list.service';
import type { CreatePriceListItemInput, UpdatePriceListItemInput } from '@/schemas/price-list';
import type {
  PriceListItemListItem,
  PriceListItemWithDetails,
  PriceListFilters,
  PriceListPagination,
  PriceListCostHistoryItem,
  PriceListCostChange,
} from '@/features/inventory/price-list/types';

/**
 * Price List Repository
 * Handles all database operations for price list items
 * Extends BaseRepository for common CRUD operations
 */
export class PriceListRepository extends BaseRepository<Prisma.PriceListItemGetPayload<object>> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected get model(): ModelDelegateOperations<Prisma.PriceListItemGetPayload<object>> {
    return this.prisma.priceListItem as unknown as ModelDelegateOperations<
      Prisma.PriceListItemGetPayload<object>
    >;
  }

  /**
   * Transforms a raw Prisma price list item into a frontend-safe list item.
   */
  private toListItem(
    item: Prisma.PriceListItemGetPayload<object>,
    lastCostChange?: PriceListCostChange | null,
  ): PriceListItemListItem {
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      category: item.category,
      imageUrl: item.imageUrl,
      wholesalePrice: item.wholesalePrice ? Number(item.wholesalePrice) : null,
      costPerUnit: Number(item.costPerUnit),
      multiplier: Number(item.multiplier),
      retailPrice: Number(item.retailPrice),
      retailPriceOverride: item.retailPriceOverride ? Number(item.retailPriceOverride) : null,
      unitType: item.unitType,
      bunchSize: item.bunchSize,
      season: item.season,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      lastCostChange: lastCostChange ?? null,
    };
  }

  /**
   * Search and paginate price list items with advanced filtering.
   * Supports full-text search across name, category filtering, sorting, and pagination.
   * @param params - Filter parameters for the search
   * @returns A promise that resolves to paginated price list items with metadata
   */
  async searchPriceListItems(
    params: PriceListFilters,
    tenantId: string,
  ): Promise<PriceListPagination> {
    const { search, category, page, perPage, sort } = params;

    const where: Prisma.PriceListItemWhereInput = {
      tenantId,
      deletedAt: null,
      ...(search
        ? {
            name: { contains: search, mode: 'insensitive' as Prisma.QueryMode },
          }
        : {}),
      ...(category && category.length > 0 ? { category: { in: category } } : {}),
    };

    // Build orderBy from sort params
    const orderBy: Prisma.PriceListItemOrderByWithRelationInput[] =
      sort && sort.length > 0
        ? sort.map((s) => ({
            [s.id]: s.desc ? ('desc' as const) : ('asc' as const),
          }))
        : [{ createdAt: 'desc' as const }];

    const [items, totalItems] = await Promise.all([
      this.prisma.priceListItem.findMany({
        where,
        orderBy,
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          costHistory: {
            orderBy: { changedAt: 'desc' },
            take: 1,
          },
        },
      }),
      this.prisma.priceListItem.count({ where }),
    ]);

    const pagination = getPaginationMetadata(totalItems, perPage, page);

    return {
      items: items.map((item) => {
        const lastHistory = item.costHistory[0];
        const lastCostChange: PriceListCostChange | null = lastHistory
          ? {
              previousCost: Number(lastHistory.previousCost),
              newCost: Number(lastHistory.newCost),
              changedAt: lastHistory.changedAt,
              trend: Number(lastHistory.newCost) > Number(lastHistory.previousCost) ? 'up' : 'down',
            }
          : null;
        return this.toListItem(item, lastCostChange);
      }),
      pagination,
    };
  }

  /**
   * Find a price list item by its ID with complete details including cost history.
   * @param id - The unique identifier of the item
   * @returns A promise that resolves to the item with details, or null if not found
   */
  async findPriceListItemById(
    id: string,
    tenantId: string,
  ): Promise<PriceListItemWithDetails | null> {
    const item = await this.prisma.priceListItem.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        costHistory: {
          orderBy: { changedAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!item) {
      return null;
    }

    const lastHistory = item.costHistory[0];
    const lastCostChange: PriceListCostChange | null = lastHistory
      ? {
          previousCost: Number(lastHistory.previousCost),
          newCost: Number(lastHistory.newCost),
          changedAt: lastHistory.changedAt,
          trend: Number(lastHistory.newCost) > Number(lastHistory.previousCost) ? 'up' : 'down',
        }
      : null;

    return {
      ...this.toListItem(item, lastCostChange),
      costHistory: item.costHistory.map((h) => ({
        id: h.id,
        previousCost: Number(h.previousCost),
        newCost: Number(h.newCost),
        changedAt: h.changedAt,
      })),
    };
  }

  /**
   * Create a new price list item.
   * Calculates retailPrice from costPerUnit × multiplier, or uses retailPriceOverride if set.
   * @param data - The creation input data
   * @returns A promise that resolves to an object containing the new item ID
   */
  async createPriceListItem(
    data: CreatePriceListItemInput,
    tenantId: string,
  ): Promise<{ id: string }> {
    const retailPrice = calculateRetailPrice({
      costPerUnit: data.costPerUnit,
      multiplier: data.multiplier,
      retailPriceOverride: data.retailPriceOverride,
    });

    const item = await this.prisma.priceListItem.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        category: data.category,
        imageUrl: data.imageUrl,
        wholesalePrice: data.wholesalePrice,
        costPerUnit: data.costPerUnit,
        multiplier: data.multiplier,
        retailPrice,
        retailPriceOverride: data.retailPriceOverride,
        unitType: data.unitType,
        bunchSize: data.bunchSize,
        season: data.season,
      },
      select: { id: true },
    });

    return { id: item.id };
  }

  /**
   * Update an existing price list item.
   * Recalculates retailPrice and records cost history if costPerUnit changed.
   * @param id - The ID of the item to update
   * @param data - The update data
   * @returns A promise that resolves to the updated item, or null if not found
   */
  async updatePriceListItem(
    id: string,
    tenantId: string,
    data: UpdatePriceListItemInput,
  ): Promise<PriceListItemWithDetails | null> {
    const existing = await this.prisma.priceListItem.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!existing) {
      return null;
    }

    const retailPrice = calculateRetailPrice({
      costPerUnit: data.costPerUnit,
      multiplier: data.multiplier,
      retailPriceOverride: data.retailPriceOverride,
    });

    const previousCost = Number(existing.costPerUnit);
    const costChanged = hasCostChanged(previousCost, data.costPerUnit);

    const updated = await this.prisma.$transaction(async (tx) => {
      // Record cost history if costPerUnit changed
      if (costChanged) {
        await tx.priceListCostHistory.create({
          data: {
            priceListItemId: id,
            previousCost: previousCost,
            newCost: data.costPerUnit,
          },
        });
      }

      return tx.priceListItem.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          category: data.category,
          imageUrl: data.imageUrl,
          wholesalePrice: data.wholesalePrice,
          costPerUnit: data.costPerUnit,
          multiplier: data.multiplier,
          retailPrice,
          retailPriceOverride: data.retailPriceOverride,
          unitType: data.unitType,
          bunchSize: data.bunchSize,
          season: data.season,
        },
        include: {
          costHistory: {
            orderBy: { changedAt: 'desc' },
            take: 50,
          },
        },
      });
    });

    const lastHistoryUpdated = updated.costHistory[0];
    const lastCostChangeUpdated: PriceListCostChange | null = lastHistoryUpdated
      ? {
          previousCost: Number(lastHistoryUpdated.previousCost),
          newCost: Number(lastHistoryUpdated.newCost),
          changedAt: lastHistoryUpdated.changedAt,
          trend:
            Number(lastHistoryUpdated.newCost) > Number(lastHistoryUpdated.previousCost)
              ? 'up'
              : 'down',
        }
      : null;

    return {
      ...this.toListItem(updated, lastCostChangeUpdated),
      costHistory: updated.costHistory.map((h) => ({
        id: h.id,
        previousCost: Number(h.previousCost),
        newCost: Number(h.newCost),
        changedAt: h.changedAt,
      })),
    };
  }

  /**
   * Soft-deletes a price list item.
   * @param id - The ID of the item to delete
   * @returns A promise that resolves to true if deleted, false if not found
   */
  async deletePriceListItem(id: string, tenantId: string): Promise<boolean> {
    const item = await this.prisma.priceListItem.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!item) {
      return false;
    }

    await this.prisma.priceListItem.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return true;
  }

  /**
   * Retrieves cost history for a price list item.
   * @param priceListItemId - The ID of the price list item
   * @returns A promise that resolves to an array of cost history entries
   */
  async getPriceListCostHistory(priceListItemId: string): Promise<PriceListCostHistoryItem[]> {
    const history = await this.prisma.priceListCostHistory.findMany({
      where: { priceListItemId },
      orderBy: { changedAt: 'desc' },
      take: 100,
    });

    return history.map((h) => ({
      id: h.id,
      previousCost: Number(h.previousCost),
      newCost: Number(h.newCost),
      changedAt: h.changedAt,
    }));
  }

  /**
   * Retrieves all active price list items for selection in recipes.
   * @returns A promise that resolves to an array of active price list items
   */
  async findActivePriceListItems(tenantId: string): Promise<PriceListItemListItem[]> {
    const items = await this.prisma.priceListItem.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { name: 'asc' },
    });

    return items.map((item) => this.toListItem(item, null));
  }
}

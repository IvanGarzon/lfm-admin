import type { CreatePriceListItemInput, UpdatePriceListItemInput } from '@/schemas/price-list';
import type { PriceListCategory } from '@/features/inventory/price-list/constants/categories';
import type { PaginationMeta } from '@/types/pagination';

export type PriceListItemFormInput = CreatePriceListItemInput | UpdatePriceListItemInput;

export type PriceListCostChange = {
  previousCost: number;
  newCost: number;
  changedAt: Date;
  trend: 'up' | 'down';
};

export type PriceListItemListItem = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  imageUrl: string | null;
  wholesalePrice: number | null;
  costPerUnit: number;
  multiplier: number;
  retailPrice: number;
  retailPriceOverride: number | null;
  unitType: string | null;
  bunchSize: number | null;
  season: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastCostChange: PriceListCostChange | null;
};

export type PriceListItemWithDetails = PriceListItemListItem & {
  costHistory: PriceListCostHistoryItem[];
};

export type PriceListCostHistoryItem = {
  id: string;
  previousCost: number;
  newCost: number;
  changedAt: Date;
};

export interface PriceListFilters {
  search?: string;
  category?: PriceListCategory[];
  page: number;
  perPage: number;
  sort?: { id: string; desc: boolean }[];
}

export type PriceListPagination = {
  items: PriceListItemListItem[];
  pagination: PaginationMeta;
};

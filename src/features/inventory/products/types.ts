import type { CreateProductInput, UpdateProductInput } from '@/schemas/products';
import type { ProductStatus } from '@/zod/schemas/enums/ProductStatus.schema';
import type { PaginationMeta } from '@/types/pagination';

export type ProductFormInput = CreateProductInput | UpdateProductInput;

export type UpdateProductStatusInput = { id: string; status: ProductStatus };
export type UpdateProductStockInput = { id: string; quantity: number };
export type BulkUpdateProductStatusInput = { ids: string[]; status: ProductStatus };

export type ActiveProduct = {
  id: string;
  name: string;
  price: number;
};

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
  pagination: PaginationMeta;
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

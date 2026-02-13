import type { CreateProductInput, UpdateProductInput } from '@/schemas/products';
import type { ProductStatus } from '@/prisma/client';

export type ProductFormInput = CreateProductInput | UpdateProductInput;

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

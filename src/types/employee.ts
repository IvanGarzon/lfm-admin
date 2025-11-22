import type { Employee } from '@/prisma/client';

export type { Employee };

export interface EmployeePagination {
  items: Employee[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextPage: number | null;
    previousPage: number | null;
  };
}

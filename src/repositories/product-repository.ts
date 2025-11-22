import { Prisma, Product } from '@/prisma/client';
import { prisma } from '@/lib/prisma';
import { BaseRepository } from '@/lib/baseRepository';
import { ProductStatusType } from '@/zod/inputTypeSchemas/ProductStatusSchema';

export class ProductRepository extends BaseRepository<Product> {
  constructor() {
    super(prisma.product);
  }

  // Custom method specific to products
  async findWithFilters(filters: {
    search?: string;
    status?: ProductStatusType;
  }): Promise<Product[]> {
    const query: Prisma.ProductFindManyArgs['where'] = {};
    const { search, status } = filters;

    if (search) {
      const queryValue: Prisma.StringFilter = {
        contains: search,
        mode: Prisma.QueryMode.insensitive,
      };

      query['name'] = queryValue;
    }

    if (status) {
      query['status'] = status as ProductStatusType;
    }

    return await prisma.product.findMany({
      where: {
        ...(Object.values(query)?.length ? query : {}),
      },
    });
  }
}

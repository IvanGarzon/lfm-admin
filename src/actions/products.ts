'use server';

import { prisma } from '@/lib/prisma';
import { Product } from '@/prisma/client';
import {
  ProductStatusSchema,
  type ProductStatusType,
} from '@/zod/inputTypeSchemas/ProductStatusSchema';
import { ActiveProduct } from '@/features/products/types';
import type { ActionResult } from '@/types/actions';

export async function getActiveProducts(): Promise<ActionResult<ActiveProduct[]>> {
  try {
    const products = await prisma.product.findMany({
      where: {
        status: ProductStatusSchema.enum.ACTIVE,
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return {
      success: true,
      data: products.map((product) => ({
        ...product,
        price: Number(product.price),
      })),
    };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to fetch customers' };
  }
}

export async function getProducts(params: {
  status?: ProductStatusType;
}): Promise<ActionResult<Product[]>> {
  try {
    const products = await prisma.product.findMany({
      where: {
        status: params.status ? ProductStatusSchema.parse(params.status) : undefined,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return { success: true, data: products };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: 'Failed to fetch products' };
  }
}

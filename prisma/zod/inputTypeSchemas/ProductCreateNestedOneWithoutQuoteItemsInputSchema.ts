import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { ProductCreateWithoutQuoteItemsInputSchema } from './ProductCreateWithoutQuoteItemsInputSchema';
import { ProductUncheckedCreateWithoutQuoteItemsInputSchema } from './ProductUncheckedCreateWithoutQuoteItemsInputSchema';
import { ProductCreateOrConnectWithoutQuoteItemsInputSchema } from './ProductCreateOrConnectWithoutQuoteItemsInputSchema';
import { ProductWhereUniqueInputSchema } from './ProductWhereUniqueInputSchema';

export const ProductCreateNestedOneWithoutQuoteItemsInputSchema: z.ZodType<Prisma.ProductCreateNestedOneWithoutQuoteItemsInput> = z.strictObject({
  create: z.union([ z.lazy(() => ProductCreateWithoutQuoteItemsInputSchema), z.lazy(() => ProductUncheckedCreateWithoutQuoteItemsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => ProductCreateOrConnectWithoutQuoteItemsInputSchema).optional(),
  connect: z.lazy(() => ProductWhereUniqueInputSchema).optional(),
});

export default ProductCreateNestedOneWithoutQuoteItemsInputSchema;

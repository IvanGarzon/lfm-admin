import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { ProductWhereUniqueInputSchema } from './ProductWhereUniqueInputSchema';
import { ProductCreateWithoutQuoteItemsInputSchema } from './ProductCreateWithoutQuoteItemsInputSchema';
import { ProductUncheckedCreateWithoutQuoteItemsInputSchema } from './ProductUncheckedCreateWithoutQuoteItemsInputSchema';

export const ProductCreateOrConnectWithoutQuoteItemsInputSchema: z.ZodType<Prisma.ProductCreateOrConnectWithoutQuoteItemsInput> = z.strictObject({
  where: z.lazy(() => ProductWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => ProductCreateWithoutQuoteItemsInputSchema), z.lazy(() => ProductUncheckedCreateWithoutQuoteItemsInputSchema) ]),
});

export default ProductCreateOrConnectWithoutQuoteItemsInputSchema;

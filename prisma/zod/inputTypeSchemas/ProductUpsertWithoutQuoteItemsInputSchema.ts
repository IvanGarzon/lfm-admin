import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { ProductUpdateWithoutQuoteItemsInputSchema } from './ProductUpdateWithoutQuoteItemsInputSchema';
import { ProductUncheckedUpdateWithoutQuoteItemsInputSchema } from './ProductUncheckedUpdateWithoutQuoteItemsInputSchema';
import { ProductCreateWithoutQuoteItemsInputSchema } from './ProductCreateWithoutQuoteItemsInputSchema';
import { ProductUncheckedCreateWithoutQuoteItemsInputSchema } from './ProductUncheckedCreateWithoutQuoteItemsInputSchema';
import { ProductWhereInputSchema } from './ProductWhereInputSchema';

export const ProductUpsertWithoutQuoteItemsInputSchema: z.ZodType<Prisma.ProductUpsertWithoutQuoteItemsInput> = z.strictObject({
  update: z.union([ z.lazy(() => ProductUpdateWithoutQuoteItemsInputSchema), z.lazy(() => ProductUncheckedUpdateWithoutQuoteItemsInputSchema) ]),
  create: z.union([ z.lazy(() => ProductCreateWithoutQuoteItemsInputSchema), z.lazy(() => ProductUncheckedCreateWithoutQuoteItemsInputSchema) ]),
  where: z.lazy(() => ProductWhereInputSchema).optional(),
});

export default ProductUpsertWithoutQuoteItemsInputSchema;

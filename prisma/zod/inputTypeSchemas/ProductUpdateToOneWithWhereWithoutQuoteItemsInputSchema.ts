import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { ProductWhereInputSchema } from './ProductWhereInputSchema';
import { ProductUpdateWithoutQuoteItemsInputSchema } from './ProductUpdateWithoutQuoteItemsInputSchema';
import { ProductUncheckedUpdateWithoutQuoteItemsInputSchema } from './ProductUncheckedUpdateWithoutQuoteItemsInputSchema';

export const ProductUpdateToOneWithWhereWithoutQuoteItemsInputSchema: z.ZodType<Prisma.ProductUpdateToOneWithWhereWithoutQuoteItemsInput> = z.strictObject({
  where: z.lazy(() => ProductWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => ProductUpdateWithoutQuoteItemsInputSchema), z.lazy(() => ProductUncheckedUpdateWithoutQuoteItemsInputSchema) ]),
});

export default ProductUpdateToOneWithWhereWithoutQuoteItemsInputSchema;

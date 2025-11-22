import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { ProductCreateWithoutQuoteItemsInputSchema } from './ProductCreateWithoutQuoteItemsInputSchema';
import { ProductUncheckedCreateWithoutQuoteItemsInputSchema } from './ProductUncheckedCreateWithoutQuoteItemsInputSchema';
import { ProductCreateOrConnectWithoutQuoteItemsInputSchema } from './ProductCreateOrConnectWithoutQuoteItemsInputSchema';
import { ProductUpsertWithoutQuoteItemsInputSchema } from './ProductUpsertWithoutQuoteItemsInputSchema';
import { ProductWhereInputSchema } from './ProductWhereInputSchema';
import { ProductWhereUniqueInputSchema } from './ProductWhereUniqueInputSchema';
import { ProductUpdateToOneWithWhereWithoutQuoteItemsInputSchema } from './ProductUpdateToOneWithWhereWithoutQuoteItemsInputSchema';
import { ProductUpdateWithoutQuoteItemsInputSchema } from './ProductUpdateWithoutQuoteItemsInputSchema';
import { ProductUncheckedUpdateWithoutQuoteItemsInputSchema } from './ProductUncheckedUpdateWithoutQuoteItemsInputSchema';

export const ProductUpdateOneWithoutQuoteItemsNestedInputSchema: z.ZodType<Prisma.ProductUpdateOneWithoutQuoteItemsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => ProductCreateWithoutQuoteItemsInputSchema), z.lazy(() => ProductUncheckedCreateWithoutQuoteItemsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => ProductCreateOrConnectWithoutQuoteItemsInputSchema).optional(),
  upsert: z.lazy(() => ProductUpsertWithoutQuoteItemsInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => ProductWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => ProductWhereInputSchema) ]).optional(),
  connect: z.lazy(() => ProductWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => ProductUpdateToOneWithWhereWithoutQuoteItemsInputSchema), z.lazy(() => ProductUpdateWithoutQuoteItemsInputSchema), z.lazy(() => ProductUncheckedUpdateWithoutQuoteItemsInputSchema) ]).optional(),
});

export default ProductUpdateOneWithoutQuoteItemsNestedInputSchema;

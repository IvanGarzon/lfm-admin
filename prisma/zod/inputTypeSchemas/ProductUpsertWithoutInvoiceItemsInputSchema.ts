import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { ProductUpdateWithoutInvoiceItemsInputSchema } from './ProductUpdateWithoutInvoiceItemsInputSchema';
import { ProductUncheckedUpdateWithoutInvoiceItemsInputSchema } from './ProductUncheckedUpdateWithoutInvoiceItemsInputSchema';
import { ProductCreateWithoutInvoiceItemsInputSchema } from './ProductCreateWithoutInvoiceItemsInputSchema';
import { ProductUncheckedCreateWithoutInvoiceItemsInputSchema } from './ProductUncheckedCreateWithoutInvoiceItemsInputSchema';
import { ProductWhereInputSchema } from './ProductWhereInputSchema';

export const ProductUpsertWithoutInvoiceItemsInputSchema: z.ZodType<Prisma.ProductUpsertWithoutInvoiceItemsInput> = z.strictObject({
  update: z.union([ z.lazy(() => ProductUpdateWithoutInvoiceItemsInputSchema), z.lazy(() => ProductUncheckedUpdateWithoutInvoiceItemsInputSchema) ]),
  create: z.union([ z.lazy(() => ProductCreateWithoutInvoiceItemsInputSchema), z.lazy(() => ProductUncheckedCreateWithoutInvoiceItemsInputSchema) ]),
  where: z.lazy(() => ProductWhereInputSchema).optional(),
});

export default ProductUpsertWithoutInvoiceItemsInputSchema;

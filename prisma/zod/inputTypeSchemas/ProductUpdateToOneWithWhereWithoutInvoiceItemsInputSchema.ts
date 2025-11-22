import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { ProductWhereInputSchema } from './ProductWhereInputSchema';
import { ProductUpdateWithoutInvoiceItemsInputSchema } from './ProductUpdateWithoutInvoiceItemsInputSchema';
import { ProductUncheckedUpdateWithoutInvoiceItemsInputSchema } from './ProductUncheckedUpdateWithoutInvoiceItemsInputSchema';

export const ProductUpdateToOneWithWhereWithoutInvoiceItemsInputSchema: z.ZodType<Prisma.ProductUpdateToOneWithWhereWithoutInvoiceItemsInput> = z.strictObject({
  where: z.lazy(() => ProductWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => ProductUpdateWithoutInvoiceItemsInputSchema), z.lazy(() => ProductUncheckedUpdateWithoutInvoiceItemsInputSchema) ]),
});

export default ProductUpdateToOneWithWhereWithoutInvoiceItemsInputSchema;

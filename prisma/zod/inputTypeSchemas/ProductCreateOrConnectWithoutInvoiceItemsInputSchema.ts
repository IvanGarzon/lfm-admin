import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { ProductWhereUniqueInputSchema } from './ProductWhereUniqueInputSchema';
import { ProductCreateWithoutInvoiceItemsInputSchema } from './ProductCreateWithoutInvoiceItemsInputSchema';
import { ProductUncheckedCreateWithoutInvoiceItemsInputSchema } from './ProductUncheckedCreateWithoutInvoiceItemsInputSchema';

export const ProductCreateOrConnectWithoutInvoiceItemsInputSchema: z.ZodType<Prisma.ProductCreateOrConnectWithoutInvoiceItemsInput> = z.strictObject({
  where: z.lazy(() => ProductWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => ProductCreateWithoutInvoiceItemsInputSchema), z.lazy(() => ProductUncheckedCreateWithoutInvoiceItemsInputSchema) ]),
});

export default ProductCreateOrConnectWithoutInvoiceItemsInputSchema;

import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { ProductCreateWithoutInvoiceItemsInputSchema } from './ProductCreateWithoutInvoiceItemsInputSchema';
import { ProductUncheckedCreateWithoutInvoiceItemsInputSchema } from './ProductUncheckedCreateWithoutInvoiceItemsInputSchema';
import { ProductCreateOrConnectWithoutInvoiceItemsInputSchema } from './ProductCreateOrConnectWithoutInvoiceItemsInputSchema';
import { ProductWhereUniqueInputSchema } from './ProductWhereUniqueInputSchema';

export const ProductCreateNestedOneWithoutInvoiceItemsInputSchema: z.ZodType<Prisma.ProductCreateNestedOneWithoutInvoiceItemsInput> = z.strictObject({
  create: z.union([ z.lazy(() => ProductCreateWithoutInvoiceItemsInputSchema), z.lazy(() => ProductUncheckedCreateWithoutInvoiceItemsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => ProductCreateOrConnectWithoutInvoiceItemsInputSchema).optional(),
  connect: z.lazy(() => ProductWhereUniqueInputSchema).optional(),
});

export default ProductCreateNestedOneWithoutInvoiceItemsInputSchema;

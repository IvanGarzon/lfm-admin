import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { ProductCreateWithoutInvoiceItemsInputSchema } from './ProductCreateWithoutInvoiceItemsInputSchema';
import { ProductUncheckedCreateWithoutInvoiceItemsInputSchema } from './ProductUncheckedCreateWithoutInvoiceItemsInputSchema';
import { ProductCreateOrConnectWithoutInvoiceItemsInputSchema } from './ProductCreateOrConnectWithoutInvoiceItemsInputSchema';
import { ProductUpsertWithoutInvoiceItemsInputSchema } from './ProductUpsertWithoutInvoiceItemsInputSchema';
import { ProductWhereInputSchema } from './ProductWhereInputSchema';
import { ProductWhereUniqueInputSchema } from './ProductWhereUniqueInputSchema';
import { ProductUpdateToOneWithWhereWithoutInvoiceItemsInputSchema } from './ProductUpdateToOneWithWhereWithoutInvoiceItemsInputSchema';
import { ProductUpdateWithoutInvoiceItemsInputSchema } from './ProductUpdateWithoutInvoiceItemsInputSchema';
import { ProductUncheckedUpdateWithoutInvoiceItemsInputSchema } from './ProductUncheckedUpdateWithoutInvoiceItemsInputSchema';

export const ProductUpdateOneWithoutInvoiceItemsNestedInputSchema: z.ZodType<Prisma.ProductUpdateOneWithoutInvoiceItemsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => ProductCreateWithoutInvoiceItemsInputSchema), z.lazy(() => ProductUncheckedCreateWithoutInvoiceItemsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => ProductCreateOrConnectWithoutInvoiceItemsInputSchema).optional(),
  upsert: z.lazy(() => ProductUpsertWithoutInvoiceItemsInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => ProductWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => ProductWhereInputSchema) ]).optional(),
  connect: z.lazy(() => ProductWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => ProductUpdateToOneWithWhereWithoutInvoiceItemsInputSchema), z.lazy(() => ProductUpdateWithoutInvoiceItemsInputSchema), z.lazy(() => ProductUncheckedUpdateWithoutInvoiceItemsInputSchema) ]).optional(),
});

export default ProductUpdateOneWithoutInvoiceItemsNestedInputSchema;

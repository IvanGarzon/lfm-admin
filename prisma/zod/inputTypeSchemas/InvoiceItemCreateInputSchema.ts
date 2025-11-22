import { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { isValidDecimalInput } from './isValidDecimalInput';
import { DecimalJsLikeSchema } from './DecimalJsLikeSchema';
import { InvoiceCreateNestedOneWithoutItemsInputSchema } from './InvoiceCreateNestedOneWithoutItemsInputSchema';
import { ProductCreateNestedOneWithoutInvoiceItemsInputSchema } from './ProductCreateNestedOneWithoutInvoiceItemsInputSchema';

export const InvoiceItemCreateInputSchema: z.ZodType<Prisma.InvoiceItemCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  description: z.string(),
  quantity: z.number().int(),
  unitPrice: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  total: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  invoice: z.lazy(() => InvoiceCreateNestedOneWithoutItemsInputSchema),
  product: z.lazy(() => ProductCreateNestedOneWithoutInvoiceItemsInputSchema).optional(),
});

export default InvoiceItemCreateInputSchema;

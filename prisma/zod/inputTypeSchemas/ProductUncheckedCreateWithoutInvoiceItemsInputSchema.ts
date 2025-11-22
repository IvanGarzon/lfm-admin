import { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { ProductStatusSchema } from './ProductStatusSchema';
import { isValidDecimalInput } from './isValidDecimalInput';
import { DecimalJsLikeSchema } from './DecimalJsLikeSchema';
import { QuoteItemUncheckedCreateNestedManyWithoutProductInputSchema } from './QuoteItemUncheckedCreateNestedManyWithoutProductInputSchema';

export const ProductUncheckedCreateWithoutInvoiceItemsInputSchema: z.ZodType<Prisma.ProductUncheckedCreateWithoutInvoiceItemsInput> = z.strictObject({
  id: z.cuid().optional(),
  imageUrl: z.string().optional().nullable(),
  name: z.string(),
  description: z.string().optional().nullable(),
  status: z.lazy(() => ProductStatusSchema).optional(),
  price: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  stock: z.number().int().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  availableAt: z.coerce.date().optional().nullable(),
  quoteItems: z.lazy(() => QuoteItemUncheckedCreateNestedManyWithoutProductInputSchema).optional(),
});

export default ProductUncheckedCreateWithoutInvoiceItemsInputSchema;

import { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { isValidDecimalInput } from './isValidDecimalInput';
import { DecimalJsLikeSchema } from './DecimalJsLikeSchema';
import { QuoteItemCreatecolorsInputSchema } from './QuoteItemCreatecolorsInputSchema';

export const QuoteItemCreateManyQuoteInputSchema: z.ZodType<Prisma.QuoteItemCreateManyQuoteInput> = z.strictObject({
  id: z.cuid().optional(),
  description: z.string(),
  quantity: z.number().int(),
  unitPrice: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  total: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  order: z.number().int().optional(),
  productId: z.string().optional().nullable(),
  colors: z.union([ z.lazy(() => QuoteItemCreatecolorsInputSchema), z.string().array() ]).optional(),
  notes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export default QuoteItemCreateManyQuoteInputSchema;

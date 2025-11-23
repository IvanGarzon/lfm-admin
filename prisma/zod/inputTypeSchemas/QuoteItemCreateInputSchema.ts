import { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { isValidDecimalInput } from './isValidDecimalInput';
import { DecimalJsLikeSchema } from './DecimalJsLikeSchema';
import { QuoteItemCreatecolorsInputSchema } from './QuoteItemCreatecolorsInputSchema';
import { QuoteCreateNestedOneWithoutItemsInputSchema } from './QuoteCreateNestedOneWithoutItemsInputSchema';
import { ProductCreateNestedOneWithoutQuoteItemsInputSchema } from './ProductCreateNestedOneWithoutQuoteItemsInputSchema';
import { QuoteItemAttachmentCreateNestedManyWithoutQuoteItemInputSchema } from './QuoteItemAttachmentCreateNestedManyWithoutQuoteItemInputSchema';

export const QuoteItemCreateInputSchema: z.ZodType<Prisma.QuoteItemCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  description: z.string(),
  quantity: z.number().int(),
  unitPrice: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  total: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  order: z.number().int().optional(),
  colors: z.union([ z.lazy(() => QuoteItemCreatecolorsInputSchema), z.string().array() ]).optional(),
  notes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  quote: z.lazy(() => QuoteCreateNestedOneWithoutItemsInputSchema),
  product: z.lazy(() => ProductCreateNestedOneWithoutQuoteItemsInputSchema).optional(),
  attachments: z.lazy(() => QuoteItemAttachmentCreateNestedManyWithoutQuoteItemInputSchema).optional(),
});

export default QuoteItemCreateInputSchema;

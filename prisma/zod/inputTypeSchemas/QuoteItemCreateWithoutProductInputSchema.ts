import { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { isValidDecimalInput } from './isValidDecimalInput';
import { DecimalJsLikeSchema } from './DecimalJsLikeSchema';
import { NullableJsonNullValueInputSchema } from './NullableJsonNullValueInputSchema';
import { InputJsonValueSchema } from './InputJsonValueSchema';
import { QuoteCreateNestedOneWithoutItemsInputSchema } from './QuoteCreateNestedOneWithoutItemsInputSchema';
import { QuoteItemAttachmentCreateNestedManyWithoutQuoteItemInputSchema } from './QuoteItemAttachmentCreateNestedManyWithoutQuoteItemInputSchema';

export const QuoteItemCreateWithoutProductInputSchema: z.ZodType<Prisma.QuoteItemCreateWithoutProductInput> = z.strictObject({
  id: z.cuid().optional(),
  description: z.string(),
  quantity: z.number().int(),
  unitPrice: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  total: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  order: z.number().int().optional(),
  notes: z.string().optional().nullable(),
  colorPalette: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  quote: z.lazy(() => QuoteCreateNestedOneWithoutItemsInputSchema),
  attachments: z.lazy(() => QuoteItemAttachmentCreateNestedManyWithoutQuoteItemInputSchema).optional(),
});

export default QuoteItemCreateWithoutProductInputSchema;

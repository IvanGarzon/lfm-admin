import { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { isValidDecimalInput } from './isValidDecimalInput';
import { DecimalJsLikeSchema } from './DecimalJsLikeSchema';
import { NullableJsonNullValueInputSchema } from './NullableJsonNullValueInputSchema';
import { InputJsonValueSchema } from './InputJsonValueSchema';
import { QuoteItemAttachmentUncheckedCreateNestedManyWithoutQuoteItemInputSchema } from './QuoteItemAttachmentUncheckedCreateNestedManyWithoutQuoteItemInputSchema';

export const QuoteItemUncheckedCreateWithoutQuoteInputSchema: z.ZodType<Prisma.QuoteItemUncheckedCreateWithoutQuoteInput> = z.strictObject({
  id: z.cuid().optional(),
  description: z.string(),
  quantity: z.number().int(),
  unitPrice: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  total: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  order: z.number().int().optional(),
  productId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  colorPalette: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  attachments: z.lazy(() => QuoteItemAttachmentUncheckedCreateNestedManyWithoutQuoteItemInputSchema).optional(),
});

export default QuoteItemUncheckedCreateWithoutQuoteInputSchema;

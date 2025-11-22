import { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteItemWhereInputSchema } from './QuoteItemWhereInputSchema';
import { StringFilterSchema } from './StringFilterSchema';
import { IntFilterSchema } from './IntFilterSchema';
import { DecimalFilterSchema } from './DecimalFilterSchema';
import { isValidDecimalInput } from './isValidDecimalInput';
import { DecimalJsLikeSchema } from './DecimalJsLikeSchema';
import { StringNullableFilterSchema } from './StringNullableFilterSchema';
import { JsonNullableFilterSchema } from './JsonNullableFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';
import { QuoteScalarRelationFilterSchema } from './QuoteScalarRelationFilterSchema';
import { QuoteWhereInputSchema } from './QuoteWhereInputSchema';
import { ProductNullableScalarRelationFilterSchema } from './ProductNullableScalarRelationFilterSchema';
import { ProductWhereInputSchema } from './ProductWhereInputSchema';
import { QuoteItemAttachmentListRelationFilterSchema } from './QuoteItemAttachmentListRelationFilterSchema';

export const QuoteItemWhereUniqueInputSchema: z.ZodType<Prisma.QuoteItemWhereUniqueInput> = z.object({
  id: z.cuid(),
})
.and(z.strictObject({
  id: z.cuid().optional(),
  AND: z.union([ z.lazy(() => QuoteItemWhereInputSchema), z.lazy(() => QuoteItemWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => QuoteItemWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => QuoteItemWhereInputSchema), z.lazy(() => QuoteItemWhereInputSchema).array() ]).optional(),
  quoteId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  description: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  quantity: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  unitPrice: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  total: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  order: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  productId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  notes: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  colorPalette: z.lazy(() => JsonNullableFilterSchema).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  quote: z.union([ z.lazy(() => QuoteScalarRelationFilterSchema), z.lazy(() => QuoteWhereInputSchema) ]).optional(),
  product: z.union([ z.lazy(() => ProductNullableScalarRelationFilterSchema), z.lazy(() => ProductWhereInputSchema) ]).optional().nullable(),
  attachments: z.lazy(() => QuoteItemAttachmentListRelationFilterSchema).optional(),
}));

export default QuoteItemWhereUniqueInputSchema;

import { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { StringFilterSchema } from './StringFilterSchema';
import { IntFilterSchema } from './IntFilterSchema';
import { DecimalFilterSchema } from './DecimalFilterSchema';
import { isValidDecimalInput } from './isValidDecimalInput';
import { DecimalJsLikeSchema } from './DecimalJsLikeSchema';
import { StringNullableFilterSchema } from './StringNullableFilterSchema';
import { StringNullableListFilterSchema } from './StringNullableListFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';
import { QuoteScalarRelationFilterSchema } from './QuoteScalarRelationFilterSchema';
import { QuoteWhereInputSchema } from './QuoteWhereInputSchema';
import { ProductNullableScalarRelationFilterSchema } from './ProductNullableScalarRelationFilterSchema';
import { ProductWhereInputSchema } from './ProductWhereInputSchema';
import { QuoteItemAttachmentListRelationFilterSchema } from './QuoteItemAttachmentListRelationFilterSchema';

export const QuoteItemWhereInputSchema: z.ZodType<Prisma.QuoteItemWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => QuoteItemWhereInputSchema), z.lazy(() => QuoteItemWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => QuoteItemWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => QuoteItemWhereInputSchema), z.lazy(() => QuoteItemWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  quoteId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  description: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  quantity: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  unitPrice: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  total: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  order: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  productId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  colors: z.lazy(() => StringNullableListFilterSchema).optional(),
  notes: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  quote: z.union([ z.lazy(() => QuoteScalarRelationFilterSchema), z.lazy(() => QuoteWhereInputSchema) ]).optional(),
  product: z.union([ z.lazy(() => ProductNullableScalarRelationFilterSchema), z.lazy(() => ProductWhereInputSchema) ]).optional().nullable(),
  attachments: z.lazy(() => QuoteItemAttachmentListRelationFilterSchema).optional(),
});

export default QuoteItemWhereInputSchema;

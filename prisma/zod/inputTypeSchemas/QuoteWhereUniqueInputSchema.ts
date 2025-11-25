import { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteWhereInputSchema } from './QuoteWhereInputSchema';
import { StringFilterSchema } from './StringFilterSchema';
import { EnumQuoteStatusFilterSchema } from './EnumQuoteStatusFilterSchema';
import { QuoteStatusSchema } from './QuoteStatusSchema';
import { IntFilterSchema } from './IntFilterSchema';
import { StringNullableFilterSchema } from './StringNullableFilterSchema';
import { DecimalFilterSchema } from './DecimalFilterSchema';
import { isValidDecimalInput } from './isValidDecimalInput';
import { DecimalJsLikeSchema } from './DecimalJsLikeSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';
import { DateTimeNullableFilterSchema } from './DateTimeNullableFilterSchema';
import { CustomerScalarRelationFilterSchema } from './CustomerScalarRelationFilterSchema';
import { CustomerWhereInputSchema } from './CustomerWhereInputSchema';
import { QuoteNullableScalarRelationFilterSchema } from './QuoteNullableScalarRelationFilterSchema';
import { QuoteListRelationFilterSchema } from './QuoteListRelationFilterSchema';
import { QuoteItemListRelationFilterSchema } from './QuoteItemListRelationFilterSchema';
import { QuoteAttachmentListRelationFilterSchema } from './QuoteAttachmentListRelationFilterSchema';
import { QuoteStatusHistoryListRelationFilterSchema } from './QuoteStatusHistoryListRelationFilterSchema';

export const QuoteWhereUniqueInputSchema: z.ZodType<Prisma.QuoteWhereUniqueInput> = z.union([
  z.object({
    id: z.cuid(),
    quoteNumber: z.string(),
    invoiceId: z.string(),
  }),
  z.object({
    id: z.cuid(),
    quoteNumber: z.string(),
  }),
  z.object({
    id: z.cuid(),
    invoiceId: z.string(),
  }),
  z.object({
    id: z.cuid(),
  }),
  z.object({
    quoteNumber: z.string(),
    invoiceId: z.string(),
  }),
  z.object({
    quoteNumber: z.string(),
  }),
  z.object({
    invoiceId: z.string(),
  }),
])
.and(z.strictObject({
  id: z.cuid().optional(),
  quoteNumber: z.string().optional(),
  invoiceId: z.string().optional(),
  AND: z.union([ z.lazy(() => QuoteWhereInputSchema), z.lazy(() => QuoteWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => QuoteWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => QuoteWhereInputSchema), z.lazy(() => QuoteWhereInputSchema).array() ]).optional(),
  customerId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  status: z.union([ z.lazy(() => EnumQuoteStatusFilterSchema), z.lazy(() => QuoteStatusSchema) ]).optional(),
  versionNumber: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  parentQuoteId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  amount: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  currency: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  gst: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  discount: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  issuedDate: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  validUntil: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  notes: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  terms: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  customer: z.union([ z.lazy(() => CustomerScalarRelationFilterSchema), z.lazy(() => CustomerWhereInputSchema) ]).optional(),
  parentQuote: z.union([ z.lazy(() => QuoteNullableScalarRelationFilterSchema), z.lazy(() => QuoteWhereInputSchema) ]).optional().nullable(),
  versions: z.lazy(() => QuoteListRelationFilterSchema).optional(),
  items: z.lazy(() => QuoteItemListRelationFilterSchema).optional(),
  attachments: z.lazy(() => QuoteAttachmentListRelationFilterSchema).optional(),
  statusHistory: z.lazy(() => QuoteStatusHistoryListRelationFilterSchema).optional(),
}));

export default QuoteWhereUniqueInputSchema;

import { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { StringFilterSchema } from './StringFilterSchema';
import { EnumQuoteStatusFilterSchema } from './EnumQuoteStatusFilterSchema';
import { QuoteStatusSchema } from './QuoteStatusSchema';
import { DecimalFilterSchema } from './DecimalFilterSchema';
import { isValidDecimalInput } from './isValidDecimalInput';
import { DecimalJsLikeSchema } from './DecimalJsLikeSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';
import { DateTimeNullableFilterSchema } from './DateTimeNullableFilterSchema';
import { StringNullableFilterSchema } from './StringNullableFilterSchema';

export const QuoteScalarWhereInputSchema: z.ZodType<Prisma.QuoteScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => QuoteScalarWhereInputSchema), z.lazy(() => QuoteScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => QuoteScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => QuoteScalarWhereInputSchema), z.lazy(() => QuoteScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  quoteNumber: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  customerId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  status: z.union([ z.lazy(() => EnumQuoteStatusFilterSchema), z.lazy(() => QuoteStatusSchema) ]).optional(),
  amount: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  currency: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  gst: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  discount: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  issuedDate: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  validUntil: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  acceptedDate: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  rejectedDate: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  rejectReason: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  convertedDate: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  invoiceId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  notes: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  terms: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
});

export default QuoteScalarWhereInputSchema;

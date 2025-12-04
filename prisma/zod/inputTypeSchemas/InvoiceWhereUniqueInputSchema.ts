import { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { InvoiceWhereInputSchema } from './InvoiceWhereInputSchema';
import { StringFilterSchema } from './StringFilterSchema';
import { EnumInvoiceStatusFilterSchema } from './EnumInvoiceStatusFilterSchema';
import { InvoiceStatusSchema } from './InvoiceStatusSchema';
import { DecimalFilterSchema } from './DecimalFilterSchema';
import { isValidDecimalInput } from './isValidDecimalInput';
import { DecimalJsLikeSchema } from './DecimalJsLikeSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';
import { IntNullableFilterSchema } from './IntNullableFilterSchema';
import { DateTimeNullableFilterSchema } from './DateTimeNullableFilterSchema';
import { StringNullableFilterSchema } from './StringNullableFilterSchema';
import { CustomerScalarRelationFilterSchema } from './CustomerScalarRelationFilterSchema';
import { CustomerWhereInputSchema } from './CustomerWhereInputSchema';
import { InvoiceItemListRelationFilterSchema } from './InvoiceItemListRelationFilterSchema';

export const InvoiceWhereUniqueInputSchema: z.ZodType<Prisma.InvoiceWhereUniqueInput> = z.union([
  z.object({
    id: z.cuid(),
    invoiceNumber: z.string(),
  }),
  z.object({
    id: z.cuid(),
  }),
  z.object({
    invoiceNumber: z.string(),
  }),
])
.and(z.strictObject({
  id: z.cuid().optional(),
  invoiceNumber: z.string().optional(),
  AND: z.union([ z.lazy(() => InvoiceWhereInputSchema), z.lazy(() => InvoiceWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => InvoiceWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => InvoiceWhereInputSchema), z.lazy(() => InvoiceWhereInputSchema).array() ]).optional(),
  customerId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  status: z.union([ z.lazy(() => EnumInvoiceStatusFilterSchema), z.lazy(() => InvoiceStatusSchema) ]).optional(),
  amount: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  currency: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  discount: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  gst: z.union([ z.lazy(() => DecimalFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  issuedDate: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  dueDate: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  remindersSent: z.union([ z.lazy(() => IntNullableFilterSchema), z.number().int() ]).optional().nullable(),
  paidDate: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  paymentMethod: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  cancelledDate: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  cancelReason: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  notes: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  fileName: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  fileSize: z.union([ z.lazy(() => IntNullableFilterSchema), z.number().int() ]).optional().nullable(),
  mimeType: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  s3Key: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  s3Url: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  lastGeneratedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  customer: z.union([ z.lazy(() => CustomerScalarRelationFilterSchema), z.lazy(() => CustomerWhereInputSchema) ]).optional(),
  items: z.lazy(() => InvoiceItemListRelationFilterSchema).optional(),
}));

export default InvoiceWhereUniqueInputSchema;

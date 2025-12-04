import { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { InvoiceStatusSchema } from './InvoiceStatusSchema';
import { isValidDecimalInput } from './isValidDecimalInput';
import { DecimalJsLikeSchema } from './DecimalJsLikeSchema';
import { CustomerCreateNestedOneWithoutInvoicesInputSchema } from './CustomerCreateNestedOneWithoutInvoicesInputSchema';
import { InvoiceItemCreateNestedManyWithoutInvoiceInputSchema } from './InvoiceItemCreateNestedManyWithoutInvoiceInputSchema';

export const InvoiceCreateInputSchema: z.ZodType<Prisma.InvoiceCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  invoiceNumber: z.string(),
  status: z.lazy(() => InvoiceStatusSchema).optional(),
  amount: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  currency: z.string().optional(),
  discount: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gst: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  issuedDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  remindersSent: z.number().int().optional().nullable(),
  paidDate: z.coerce.date().optional().nullable(),
  paymentMethod: z.string().optional().nullable(),
  cancelledDate: z.coerce.date().optional().nullable(),
  cancelReason: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  fileName: z.string().optional().nullable(),
  fileSize: z.number().int().optional().nullable(),
  mimeType: z.string().optional().nullable(),
  s3Key: z.string().optional().nullable(),
  s3Url: z.string().optional().nullable(),
  lastGeneratedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  customer: z.lazy(() => CustomerCreateNestedOneWithoutInvoicesInputSchema),
  items: z.lazy(() => InvoiceItemCreateNestedManyWithoutInvoiceInputSchema).optional(),
});

export default InvoiceCreateInputSchema;

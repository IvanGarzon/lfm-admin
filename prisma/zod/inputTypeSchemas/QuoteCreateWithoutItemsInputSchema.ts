import { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteStatusSchema } from './QuoteStatusSchema';
import { isValidDecimalInput } from './isValidDecimalInput';
import { DecimalJsLikeSchema } from './DecimalJsLikeSchema';
import { CustomerCreateNestedOneWithoutQuotesInputSchema } from './CustomerCreateNestedOneWithoutQuotesInputSchema';
import { QuoteCreateNestedOneWithoutVersionsInputSchema } from './QuoteCreateNestedOneWithoutVersionsInputSchema';
import { QuoteCreateNestedManyWithoutParentQuoteInputSchema } from './QuoteCreateNestedManyWithoutParentQuoteInputSchema';
import { QuoteAttachmentCreateNestedManyWithoutQuoteInputSchema } from './QuoteAttachmentCreateNestedManyWithoutQuoteInputSchema';
import { QuoteStatusHistoryCreateNestedManyWithoutQuoteInputSchema } from './QuoteStatusHistoryCreateNestedManyWithoutQuoteInputSchema';

export const QuoteCreateWithoutItemsInputSchema: z.ZodType<Prisma.QuoteCreateWithoutItemsInput> = z.strictObject({
  id: z.cuid().optional(),
  quoteNumber: z.string(),
  status: z.lazy(() => QuoteStatusSchema).optional(),
  versionNumber: z.number().int().optional(),
  amount: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  currency: z.string().optional(),
  gst: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  discount: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  issuedDate: z.coerce.date(),
  validUntil: z.coerce.date(),
  acceptedDate: z.coerce.date().optional().nullable(),
  rejectedDate: z.coerce.date().optional().nullable(),
  rejectReason: z.string().optional().nullable(),
  convertedDate: z.coerce.date().optional().nullable(),
  invoiceId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  terms: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
  customer: z.lazy(() => CustomerCreateNestedOneWithoutQuotesInputSchema),
  parentQuote: z.lazy(() => QuoteCreateNestedOneWithoutVersionsInputSchema).optional(),
  versions: z.lazy(() => QuoteCreateNestedManyWithoutParentQuoteInputSchema).optional(),
  attachments: z.lazy(() => QuoteAttachmentCreateNestedManyWithoutQuoteInputSchema).optional(),
  statusHistory: z.lazy(() => QuoteStatusHistoryCreateNestedManyWithoutQuoteInputSchema).optional(),
});

export default QuoteCreateWithoutItemsInputSchema;

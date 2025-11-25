import { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { StringFieldUpdateOperationsInputSchema } from './StringFieldUpdateOperationsInputSchema';
import { QuoteStatusSchema } from './QuoteStatusSchema';
import { EnumQuoteStatusFieldUpdateOperationsInputSchema } from './EnumQuoteStatusFieldUpdateOperationsInputSchema';
import { IntFieldUpdateOperationsInputSchema } from './IntFieldUpdateOperationsInputSchema';
import { isValidDecimalInput } from './isValidDecimalInput';
import { DecimalJsLikeSchema } from './DecimalJsLikeSchema';
import { DecimalFieldUpdateOperationsInputSchema } from './DecimalFieldUpdateOperationsInputSchema';
import { DateTimeFieldUpdateOperationsInputSchema } from './DateTimeFieldUpdateOperationsInputSchema';
import { NullableDateTimeFieldUpdateOperationsInputSchema } from './NullableDateTimeFieldUpdateOperationsInputSchema';
import { NullableStringFieldUpdateOperationsInputSchema } from './NullableStringFieldUpdateOperationsInputSchema';
import { QuoteUpdateOneWithoutVersionsNestedInputSchema } from './QuoteUpdateOneWithoutVersionsNestedInputSchema';
import { QuoteUpdateManyWithoutParentQuoteNestedInputSchema } from './QuoteUpdateManyWithoutParentQuoteNestedInputSchema';
import { QuoteItemUpdateManyWithoutQuoteNestedInputSchema } from './QuoteItemUpdateManyWithoutQuoteNestedInputSchema';
import { QuoteAttachmentUpdateManyWithoutQuoteNestedInputSchema } from './QuoteAttachmentUpdateManyWithoutQuoteNestedInputSchema';
import { QuoteStatusHistoryUpdateManyWithoutQuoteNestedInputSchema } from './QuoteStatusHistoryUpdateManyWithoutQuoteNestedInputSchema';

export const QuoteUpdateWithoutCustomerInputSchema: z.ZodType<Prisma.QuoteUpdateWithoutCustomerInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  quoteNumber: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => QuoteStatusSchema), z.lazy(() => EnumQuoteStatusFieldUpdateOperationsInputSchema) ]).optional(),
  versionNumber: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  amount: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  gst: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  discount: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  issuedDate: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  validUntil: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  acceptedDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  rejectedDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  rejectReason: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  convertedDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  invoiceId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  notes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  terms: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentQuote: z.lazy(() => QuoteUpdateOneWithoutVersionsNestedInputSchema).optional(),
  versions: z.lazy(() => QuoteUpdateManyWithoutParentQuoteNestedInputSchema).optional(),
  items: z.lazy(() => QuoteItemUpdateManyWithoutQuoteNestedInputSchema).optional(),
  attachments: z.lazy(() => QuoteAttachmentUpdateManyWithoutQuoteNestedInputSchema).optional(),
  statusHistory: z.lazy(() => QuoteStatusHistoryUpdateManyWithoutQuoteNestedInputSchema).optional(),
});

export default QuoteUpdateWithoutCustomerInputSchema;

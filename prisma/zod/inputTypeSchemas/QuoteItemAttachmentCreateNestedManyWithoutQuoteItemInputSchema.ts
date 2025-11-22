import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteItemAttachmentCreateWithoutQuoteItemInputSchema } from './QuoteItemAttachmentCreateWithoutQuoteItemInputSchema';
import { QuoteItemAttachmentUncheckedCreateWithoutQuoteItemInputSchema } from './QuoteItemAttachmentUncheckedCreateWithoutQuoteItemInputSchema';
import { QuoteItemAttachmentCreateOrConnectWithoutQuoteItemInputSchema } from './QuoteItemAttachmentCreateOrConnectWithoutQuoteItemInputSchema';
import { QuoteItemAttachmentCreateManyQuoteItemInputEnvelopeSchema } from './QuoteItemAttachmentCreateManyQuoteItemInputEnvelopeSchema';
import { QuoteItemAttachmentWhereUniqueInputSchema } from './QuoteItemAttachmentWhereUniqueInputSchema';

export const QuoteItemAttachmentCreateNestedManyWithoutQuoteItemInputSchema: z.ZodType<Prisma.QuoteItemAttachmentCreateNestedManyWithoutQuoteItemInput> = z.strictObject({
  create: z.union([ z.lazy(() => QuoteItemAttachmentCreateWithoutQuoteItemInputSchema), z.lazy(() => QuoteItemAttachmentCreateWithoutQuoteItemInputSchema).array(), z.lazy(() => QuoteItemAttachmentUncheckedCreateWithoutQuoteItemInputSchema), z.lazy(() => QuoteItemAttachmentUncheckedCreateWithoutQuoteItemInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => QuoteItemAttachmentCreateOrConnectWithoutQuoteItemInputSchema), z.lazy(() => QuoteItemAttachmentCreateOrConnectWithoutQuoteItemInputSchema).array() ]).optional(),
  createMany: z.lazy(() => QuoteItemAttachmentCreateManyQuoteItemInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => QuoteItemAttachmentWhereUniqueInputSchema), z.lazy(() => QuoteItemAttachmentWhereUniqueInputSchema).array() ]).optional(),
});

export default QuoteItemAttachmentCreateNestedManyWithoutQuoteItemInputSchema;

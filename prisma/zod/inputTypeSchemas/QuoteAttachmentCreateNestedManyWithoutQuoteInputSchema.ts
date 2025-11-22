import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteAttachmentCreateWithoutQuoteInputSchema } from './QuoteAttachmentCreateWithoutQuoteInputSchema';
import { QuoteAttachmentUncheckedCreateWithoutQuoteInputSchema } from './QuoteAttachmentUncheckedCreateWithoutQuoteInputSchema';
import { QuoteAttachmentCreateOrConnectWithoutQuoteInputSchema } from './QuoteAttachmentCreateOrConnectWithoutQuoteInputSchema';
import { QuoteAttachmentCreateManyQuoteInputEnvelopeSchema } from './QuoteAttachmentCreateManyQuoteInputEnvelopeSchema';
import { QuoteAttachmentWhereUniqueInputSchema } from './QuoteAttachmentWhereUniqueInputSchema';

export const QuoteAttachmentCreateNestedManyWithoutQuoteInputSchema: z.ZodType<Prisma.QuoteAttachmentCreateNestedManyWithoutQuoteInput> = z.strictObject({
  create: z.union([ z.lazy(() => QuoteAttachmentCreateWithoutQuoteInputSchema), z.lazy(() => QuoteAttachmentCreateWithoutQuoteInputSchema).array(), z.lazy(() => QuoteAttachmentUncheckedCreateWithoutQuoteInputSchema), z.lazy(() => QuoteAttachmentUncheckedCreateWithoutQuoteInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => QuoteAttachmentCreateOrConnectWithoutQuoteInputSchema), z.lazy(() => QuoteAttachmentCreateOrConnectWithoutQuoteInputSchema).array() ]).optional(),
  createMany: z.lazy(() => QuoteAttachmentCreateManyQuoteInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => QuoteAttachmentWhereUniqueInputSchema), z.lazy(() => QuoteAttachmentWhereUniqueInputSchema).array() ]).optional(),
});

export default QuoteAttachmentCreateNestedManyWithoutQuoteInputSchema;

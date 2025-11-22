import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteAttachmentCreateWithoutQuoteInputSchema } from './QuoteAttachmentCreateWithoutQuoteInputSchema';
import { QuoteAttachmentUncheckedCreateWithoutQuoteInputSchema } from './QuoteAttachmentUncheckedCreateWithoutQuoteInputSchema';
import { QuoteAttachmentCreateOrConnectWithoutQuoteInputSchema } from './QuoteAttachmentCreateOrConnectWithoutQuoteInputSchema';
import { QuoteAttachmentUpsertWithWhereUniqueWithoutQuoteInputSchema } from './QuoteAttachmentUpsertWithWhereUniqueWithoutQuoteInputSchema';
import { QuoteAttachmentCreateManyQuoteInputEnvelopeSchema } from './QuoteAttachmentCreateManyQuoteInputEnvelopeSchema';
import { QuoteAttachmentWhereUniqueInputSchema } from './QuoteAttachmentWhereUniqueInputSchema';
import { QuoteAttachmentUpdateWithWhereUniqueWithoutQuoteInputSchema } from './QuoteAttachmentUpdateWithWhereUniqueWithoutQuoteInputSchema';
import { QuoteAttachmentUpdateManyWithWhereWithoutQuoteInputSchema } from './QuoteAttachmentUpdateManyWithWhereWithoutQuoteInputSchema';
import { QuoteAttachmentScalarWhereInputSchema } from './QuoteAttachmentScalarWhereInputSchema';

export const QuoteAttachmentUncheckedUpdateManyWithoutQuoteNestedInputSchema: z.ZodType<Prisma.QuoteAttachmentUncheckedUpdateManyWithoutQuoteNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => QuoteAttachmentCreateWithoutQuoteInputSchema), z.lazy(() => QuoteAttachmentCreateWithoutQuoteInputSchema).array(), z.lazy(() => QuoteAttachmentUncheckedCreateWithoutQuoteInputSchema), z.lazy(() => QuoteAttachmentUncheckedCreateWithoutQuoteInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => QuoteAttachmentCreateOrConnectWithoutQuoteInputSchema), z.lazy(() => QuoteAttachmentCreateOrConnectWithoutQuoteInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => QuoteAttachmentUpsertWithWhereUniqueWithoutQuoteInputSchema), z.lazy(() => QuoteAttachmentUpsertWithWhereUniqueWithoutQuoteInputSchema).array() ]).optional(),
  createMany: z.lazy(() => QuoteAttachmentCreateManyQuoteInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => QuoteAttachmentWhereUniqueInputSchema), z.lazy(() => QuoteAttachmentWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => QuoteAttachmentWhereUniqueInputSchema), z.lazy(() => QuoteAttachmentWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => QuoteAttachmentWhereUniqueInputSchema), z.lazy(() => QuoteAttachmentWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => QuoteAttachmentWhereUniqueInputSchema), z.lazy(() => QuoteAttachmentWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => QuoteAttachmentUpdateWithWhereUniqueWithoutQuoteInputSchema), z.lazy(() => QuoteAttachmentUpdateWithWhereUniqueWithoutQuoteInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => QuoteAttachmentUpdateManyWithWhereWithoutQuoteInputSchema), z.lazy(() => QuoteAttachmentUpdateManyWithWhereWithoutQuoteInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => QuoteAttachmentScalarWhereInputSchema), z.lazy(() => QuoteAttachmentScalarWhereInputSchema).array() ]).optional(),
});

export default QuoteAttachmentUncheckedUpdateManyWithoutQuoteNestedInputSchema;

import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteItemAttachmentCreateWithoutQuoteItemInputSchema } from './QuoteItemAttachmentCreateWithoutQuoteItemInputSchema';
import { QuoteItemAttachmentUncheckedCreateWithoutQuoteItemInputSchema } from './QuoteItemAttachmentUncheckedCreateWithoutQuoteItemInputSchema';
import { QuoteItemAttachmentCreateOrConnectWithoutQuoteItemInputSchema } from './QuoteItemAttachmentCreateOrConnectWithoutQuoteItemInputSchema';
import { QuoteItemAttachmentUpsertWithWhereUniqueWithoutQuoteItemInputSchema } from './QuoteItemAttachmentUpsertWithWhereUniqueWithoutQuoteItemInputSchema';
import { QuoteItemAttachmentCreateManyQuoteItemInputEnvelopeSchema } from './QuoteItemAttachmentCreateManyQuoteItemInputEnvelopeSchema';
import { QuoteItemAttachmentWhereUniqueInputSchema } from './QuoteItemAttachmentWhereUniqueInputSchema';
import { QuoteItemAttachmentUpdateWithWhereUniqueWithoutQuoteItemInputSchema } from './QuoteItemAttachmentUpdateWithWhereUniqueWithoutQuoteItemInputSchema';
import { QuoteItemAttachmentUpdateManyWithWhereWithoutQuoteItemInputSchema } from './QuoteItemAttachmentUpdateManyWithWhereWithoutQuoteItemInputSchema';
import { QuoteItemAttachmentScalarWhereInputSchema } from './QuoteItemAttachmentScalarWhereInputSchema';

export const QuoteItemAttachmentUncheckedUpdateManyWithoutQuoteItemNestedInputSchema: z.ZodType<Prisma.QuoteItemAttachmentUncheckedUpdateManyWithoutQuoteItemNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => QuoteItemAttachmentCreateWithoutQuoteItemInputSchema), z.lazy(() => QuoteItemAttachmentCreateWithoutQuoteItemInputSchema).array(), z.lazy(() => QuoteItemAttachmentUncheckedCreateWithoutQuoteItemInputSchema), z.lazy(() => QuoteItemAttachmentUncheckedCreateWithoutQuoteItemInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => QuoteItemAttachmentCreateOrConnectWithoutQuoteItemInputSchema), z.lazy(() => QuoteItemAttachmentCreateOrConnectWithoutQuoteItemInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => QuoteItemAttachmentUpsertWithWhereUniqueWithoutQuoteItemInputSchema), z.lazy(() => QuoteItemAttachmentUpsertWithWhereUniqueWithoutQuoteItemInputSchema).array() ]).optional(),
  createMany: z.lazy(() => QuoteItemAttachmentCreateManyQuoteItemInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => QuoteItemAttachmentWhereUniqueInputSchema), z.lazy(() => QuoteItemAttachmentWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => QuoteItemAttachmentWhereUniqueInputSchema), z.lazy(() => QuoteItemAttachmentWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => QuoteItemAttachmentWhereUniqueInputSchema), z.lazy(() => QuoteItemAttachmentWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => QuoteItemAttachmentWhereUniqueInputSchema), z.lazy(() => QuoteItemAttachmentWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => QuoteItemAttachmentUpdateWithWhereUniqueWithoutQuoteItemInputSchema), z.lazy(() => QuoteItemAttachmentUpdateWithWhereUniqueWithoutQuoteItemInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => QuoteItemAttachmentUpdateManyWithWhereWithoutQuoteItemInputSchema), z.lazy(() => QuoteItemAttachmentUpdateManyWithWhereWithoutQuoteItemInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => QuoteItemAttachmentScalarWhereInputSchema), z.lazy(() => QuoteItemAttachmentScalarWhereInputSchema).array() ]).optional(),
});

export default QuoteItemAttachmentUncheckedUpdateManyWithoutQuoteItemNestedInputSchema;

import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteItemAttachmentWhereInputSchema } from './QuoteItemAttachmentWhereInputSchema';

export const QuoteItemAttachmentListRelationFilterSchema: z.ZodType<Prisma.QuoteItemAttachmentListRelationFilter> = z.strictObject({
  every: z.lazy(() => QuoteItemAttachmentWhereInputSchema).optional(),
  some: z.lazy(() => QuoteItemAttachmentWhereInputSchema).optional(),
  none: z.lazy(() => QuoteItemAttachmentWhereInputSchema).optional(),
});

export default QuoteItemAttachmentListRelationFilterSchema;

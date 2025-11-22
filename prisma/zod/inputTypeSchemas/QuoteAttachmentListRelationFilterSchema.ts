import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteAttachmentWhereInputSchema } from './QuoteAttachmentWhereInputSchema';

export const QuoteAttachmentListRelationFilterSchema: z.ZodType<Prisma.QuoteAttachmentListRelationFilter> = z.strictObject({
  every: z.lazy(() => QuoteAttachmentWhereInputSchema).optional(),
  some: z.lazy(() => QuoteAttachmentWhereInputSchema).optional(),
  none: z.lazy(() => QuoteAttachmentWhereInputSchema).optional(),
});

export default QuoteAttachmentListRelationFilterSchema;

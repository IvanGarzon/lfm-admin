import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const QuoteItemAttachmentOrderByRelationAggregateInputSchema: z.ZodType<Prisma.QuoteItemAttachmentOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export default QuoteItemAttachmentOrderByRelationAggregateInputSchema;

import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const QuoteAttachmentOrderByRelationAggregateInputSchema: z.ZodType<Prisma.QuoteAttachmentOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export default QuoteAttachmentOrderByRelationAggregateInputSchema;

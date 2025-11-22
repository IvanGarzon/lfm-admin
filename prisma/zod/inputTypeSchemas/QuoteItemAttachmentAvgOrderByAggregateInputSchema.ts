import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const QuoteItemAttachmentAvgOrderByAggregateInputSchema: z.ZodType<Prisma.QuoteItemAttachmentAvgOrderByAggregateInput> = z.strictObject({
  fileSize: z.lazy(() => SortOrderSchema).optional(),
});

export default QuoteItemAttachmentAvgOrderByAggregateInputSchema;

import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const QuoteAttachmentAvgOrderByAggregateInputSchema: z.ZodType<Prisma.QuoteAttachmentAvgOrderByAggregateInput> = z.strictObject({
  fileSize: z.lazy(() => SortOrderSchema).optional(),
});

export default QuoteAttachmentAvgOrderByAggregateInputSchema;

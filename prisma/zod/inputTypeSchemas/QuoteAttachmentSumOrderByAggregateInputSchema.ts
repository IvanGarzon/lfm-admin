import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const QuoteAttachmentSumOrderByAggregateInputSchema: z.ZodType<Prisma.QuoteAttachmentSumOrderByAggregateInput> = z.strictObject({
  fileSize: z.lazy(() => SortOrderSchema).optional(),
});

export default QuoteAttachmentSumOrderByAggregateInputSchema;

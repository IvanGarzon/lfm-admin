import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const QuoteItemAttachmentSumOrderByAggregateInputSchema: z.ZodType<Prisma.QuoteItemAttachmentSumOrderByAggregateInput> = z.strictObject({
  fileSize: z.lazy(() => SortOrderSchema).optional(),
});

export default QuoteItemAttachmentSumOrderByAggregateInputSchema;

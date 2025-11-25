import { z } from 'zod';

export const QuoteStatusSchema = z.enum(['DRAFT','SENT','ON_HOLD','ACCEPTED','REJECTED','EXPIRED','CANCELLED','CONVERTED']);

export type QuoteStatusType = `${z.infer<typeof QuoteStatusSchema>}`

export default QuoteStatusSchema;

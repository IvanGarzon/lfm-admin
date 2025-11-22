import { z } from 'zod';

export const QuoteStatusSchema = z.enum(['DRAFT','SENT','ACCEPTED','REJECTED','EXPIRED','CONVERTED']);

export type QuoteStatusType = `${z.infer<typeof QuoteStatusSchema>}`

export default QuoteStatusSchema;

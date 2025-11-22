import { z } from 'zod';

export const InvoiceStatusSchema = z.enum(['PENDING','PAID','CANCELLED','OVERDUE','DRAFT']);

export type InvoiceStatusType = `${z.infer<typeof InvoiceStatusSchema>}`

export default InvoiceStatusSchema;

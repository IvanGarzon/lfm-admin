import { z } from 'zod';

export const CustomerStatusSchema = z.enum(['ACTIVE','INACTIVE','DELETED']);

export type CustomerStatusType = `${z.infer<typeof CustomerStatusSchema>}`

export default CustomerStatusSchema;

import { z } from 'zod';
import { JsonValueSchema } from '../inputTypeSchemas/JsonValueSchema'
import { AuditLevelSchema } from '../inputTypeSchemas/AuditLevelSchema'

/////////////////////////////////////////
// AUDIT SCHEMA
/////////////////////////////////////////

export const AuditSchema = z.object({
  level: AuditLevelSchema,
  id: z.uuid(),
  userId: z.string().nullish(),
  tag: z.string(),
  event: z.string(),
  message: z.string(),
  data: JsonValueSchema.nullable(),
  createdAt: z.coerce.date(),
})

export type Audit = z.infer<typeof AuditSchema>

export default AuditSchema;

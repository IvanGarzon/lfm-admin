import { z } from 'zod';

export const AuditLevelSchema = z.enum(['INFO','WARN','ERROR']);

export type AuditLevelType = `${z.infer<typeof AuditLevelSchema>}`

export default AuditLevelSchema;

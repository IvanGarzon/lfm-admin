import { z } from 'zod';

export const AuditScalarFieldEnumSchema = z.enum(['id','userId','tag','event','message','data','level','createdAt']);

export default AuditScalarFieldEnumSchema;

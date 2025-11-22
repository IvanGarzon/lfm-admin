import { z } from 'zod';

export const CustomerScalarFieldEnumSchema = z.enum(['id','firstName','lastName','gender','email','phone','status','organizationId','createdAt','updatedAt','deletedAt']);

export default CustomerScalarFieldEnumSchema;

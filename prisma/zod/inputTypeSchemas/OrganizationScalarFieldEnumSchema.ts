import { z } from 'zod';

export const OrganizationScalarFieldEnumSchema = z.enum(['id','name','address','city','state','postcode','country','createdAt','updatedAt']);

export default OrganizationScalarFieldEnumSchema;

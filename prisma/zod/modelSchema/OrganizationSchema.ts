import { z } from 'zod';
import { StatesSchema } from '../inputTypeSchemas/StatesSchema'
import { CustomerWithRelationsSchema } from './CustomerSchema'
import type { CustomerWithRelations } from './CustomerSchema'

/////////////////////////////////////////
// ORGANIZATION SCHEMA
/////////////////////////////////////////

export const OrganizationSchema = z.object({
  state: StatesSchema.nullish(),
  id: z.cuid(),
  name: z.string(),
  address: z.string().nullish(),
  city: z.string().nullish(),
  postcode: z.string().nullish(),
  country: z.string().nullish(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Organization = z.infer<typeof OrganizationSchema>

/////////////////////////////////////////
// ORGANIZATION RELATION SCHEMA
/////////////////////////////////////////

export type OrganizationRelations = {
  customers: CustomerWithRelations[];
};

export type OrganizationWithRelations = z.infer<typeof OrganizationSchema> & OrganizationRelations

export const OrganizationWithRelationsSchema: z.ZodType<OrganizationWithRelations> = OrganizationSchema.merge(z.object({
  customers: z.lazy(() => CustomerWithRelationsSchema).array(),
}))

export default OrganizationSchema;

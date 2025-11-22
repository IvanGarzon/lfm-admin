import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { StringFieldUpdateOperationsInputSchema } from './StringFieldUpdateOperationsInputSchema';
import { GenderSchema } from './GenderSchema';
import { EnumGenderFieldUpdateOperationsInputSchema } from './EnumGenderFieldUpdateOperationsInputSchema';
import { NullableStringFieldUpdateOperationsInputSchema } from './NullableStringFieldUpdateOperationsInputSchema';
import { CustomerStatusSchema } from './CustomerStatusSchema';
import { EnumCustomerStatusFieldUpdateOperationsInputSchema } from './EnumCustomerStatusFieldUpdateOperationsInputSchema';
import { DateTimeFieldUpdateOperationsInputSchema } from './DateTimeFieldUpdateOperationsInputSchema';
import { NullableDateTimeFieldUpdateOperationsInputSchema } from './NullableDateTimeFieldUpdateOperationsInputSchema';
import { OrganizationUpdateOneWithoutCustomersNestedInputSchema } from './OrganizationUpdateOneWithoutCustomersNestedInputSchema';
import { InvoiceUpdateManyWithoutCustomerNestedInputSchema } from './InvoiceUpdateManyWithoutCustomerNestedInputSchema';
import { QuoteUpdateManyWithoutCustomerNestedInputSchema } from './QuoteUpdateManyWithoutCustomerNestedInputSchema';

export const CustomerUpdateInputSchema: z.ZodType<Prisma.CustomerUpdateInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  firstName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lastName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  gender: z.union([ z.lazy(() => GenderSchema), z.lazy(() => EnumGenderFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  phone: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.lazy(() => CustomerStatusSchema), z.lazy(() => EnumCustomerStatusFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  deletedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  organization: z.lazy(() => OrganizationUpdateOneWithoutCustomersNestedInputSchema).optional(),
  invoices: z.lazy(() => InvoiceUpdateManyWithoutCustomerNestedInputSchema).optional(),
  quotes: z.lazy(() => QuoteUpdateManyWithoutCustomerNestedInputSchema).optional(),
});

export default CustomerUpdateInputSchema;

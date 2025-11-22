import { z } from 'zod';

export const InvoiceItemScalarFieldEnumSchema = z.enum(['id','invoiceId','description','quantity','unitPrice','total','productId','createdAt','updatedAt']);

export default InvoiceItemScalarFieldEnumSchema;

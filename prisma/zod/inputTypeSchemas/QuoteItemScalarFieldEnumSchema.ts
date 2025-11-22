import { z } from 'zod';

export const QuoteItemScalarFieldEnumSchema = z.enum(['id','quoteId','description','quantity','unitPrice','total','order','productId','notes','colorPalette','createdAt','updatedAt']);

export default QuoteItemScalarFieldEnumSchema;

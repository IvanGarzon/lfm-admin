import { z } from 'zod';

export const QuoteItemScalarFieldEnumSchema = z.enum(['id','quoteId','description','quantity','unitPrice','total','order','productId','colors','notes','createdAt','updatedAt']);

export default QuoteItemScalarFieldEnumSchema;

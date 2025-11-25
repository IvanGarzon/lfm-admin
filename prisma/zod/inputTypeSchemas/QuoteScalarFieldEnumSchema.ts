import { z } from 'zod';

export const QuoteScalarFieldEnumSchema = z.enum(['id','quoteNumber','customerId','status','versionNumber','parentQuoteId','amount','currency','gst','discount','issuedDate','validUntil','acceptedDate','rejectedDate','rejectReason','convertedDate','invoiceId','notes','terms','createdAt','updatedAt','deletedAt']);

export default QuoteScalarFieldEnumSchema;

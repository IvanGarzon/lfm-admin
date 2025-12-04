import { z } from 'zod';

export const InvoiceScalarFieldEnumSchema = z.enum(['id','invoiceNumber','customerId','status','amount','currency','discount','gst','issuedDate','dueDate','remindersSent','paidDate','paymentMethod','cancelledDate','cancelReason','notes','fileName','fileSize','mimeType','s3Key','s3Url','lastGeneratedAt','createdAt','updatedAt','deletedAt']);

export default InvoiceScalarFieldEnumSchema;

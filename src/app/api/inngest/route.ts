/**
 * Inngest API Route
 *
 * This endpoint serves Inngest functions to the Inngest platform.
 * Inngest will call this endpoint to execute background jobs.
 *
 * URL: /api/inngest
 */

import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';
import { sendEmailFunction } from '@/lib/inngest/functions/send-email';

/**
 * Register all Inngest functions here
 */
const functions = [
  sendEmailFunction,
  // Add more functions as needed:
  // generateReportFunction,
  // cleanupOldDataFunction,
  // etc.
];

/**
 * Serve Inngest functions
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
});
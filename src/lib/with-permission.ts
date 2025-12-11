import { auth } from '@/auth';
import { hasActionPermission, requireActionPermission } from '@/lib/permissions';
import type { ActionResult } from '@/types/actions';

/**
 * Higher-order function to wrap server actions with action-level permission checking.
 * This provides a declarative way to protect actions without manual permission checks.
 * 
 * @param action - The action identifier (e.g., 'invoices.createInvoice')
 * @param handler - The actual server action handler
 * @returns A wrapped handler that checks permissions before execution
 * 
 * @example
 * ```typescript
 * export const createInvoice = withActionPermission(
 *   'invoices.createInvoice',
 *   async (data: CreateInvoiceInput) => {
 *     // Your action logic here
 *     const invoice = await invoiceRepo.createInvoiceWithItems(data);
 *     return { success: true, data: invoice };
 *   }
 * );
 * ```
 */
export function withActionPermission<TInput, TOutput>(
  action: string,
  handler: (data: TInput) => Promise<ActionResult<TOutput>>
) {
  return async (data: TInput): Promise<ActionResult<TOutput>> => {
    const session = await auth();
    
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    try {
      requireActionPermission(session.user, action);
      return await handler(data);
    } catch (error) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'Permission denied' };
    }
  };
}

/**
 * Higher-order function to wrap API route handlers with action-level permission checking.
 * Use this for Next.js API routes (app router).
 * 
 * @param action - The action identifier (e.g., 'invoices.createInvoice')
 * @param handler - The API route handler
 * @returns A wrapped handler that checks permissions before execution
 * 
 * @example
 * ```typescript
 * // app/api/invoices/route.ts
 * export const POST = withApiActionPermission(
 *   'invoices.createInvoice',
 *   async (req: Request) => {
 *     const data = await req.json();
 *     // Your API logic here
 *     return Response.json({ success: true });
 *   }
 * );
 * ```
 */
export function withApiActionPermission(
  action: string,
  handler: (req: Request) => Promise<Response>
) {
  return async (req: Request): Promise<Response> => {
    const session = await auth();
    
    if (!session?.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!hasActionPermission(session.user, action)) {
      return new Response(
        JSON.stringify({ error: `Unauthorized: Cannot execute ${action}` }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return handler(req);
  };
}

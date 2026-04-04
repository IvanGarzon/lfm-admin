import { UserRole } from '@/prisma/client';
import { Session } from 'next-auth';

// ============================================================================
// PERMISSION DEFINITIONS
// ============================================================================

/**
 * Define all available permissions with human-readable labels.
 * Permissions follow the pattern: `can${Action}${Resource}`
 */
export const PERMISSIONS = {
  // Invoice Permissions
  canReadInvoices: {
    label: 'Can view invoices',
  },
  canManageInvoices: {
    label: 'Can create, edit, cancel, and delete invoices',
  },
  canRecordPayments: {
    label: 'Can record payments',
  },

  // Quote Permissions
  canReadQuotes: {
    label: 'Can view quotes',
  },
  canManageQuotes: {
    label: 'Can create, edit, and delete quotes',
  },

  // Transaction Permissions
  canReadTransactions: {
    label: 'Can view transactions',
  },
  canManageTransactions: {
    label: 'Can create, edit, and delete transactions',
  },

  // Product Permissions
  canReadProducts: {
    label: 'Can view products',
  },
  canManageProducts: {
    label: 'Can create, edit, and delete products',
  },

  // Vendor Permissions
  canReadVendors: {
    label: 'Can view vendors',
  },
  canManageVendors: {
    label: 'Can create, edit, and delete vendors',
  },

  // Recipe Permissions
  canReadRecipes: {
    label: 'Can view recipes',
  },
  canManageRecipes: {
    label: 'Can create, edit, and delete recipes',
  },

  // Price List Permissions
  canReadPriceList: {
    label: 'Can view price list',
  },
  canManagePriceList: {
    label: 'Can create, edit, and delete price list items',
  },

  // Developer Tools Permissions
  canAccessTools: {
    label: 'Can access developer tools',
  },
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;

// Type-safe list of all permission keys
export const PERMISSION_KEYS: PermissionKey[] = Object.keys(PERMISSIONS) as PermissionKey[];

// ============================================================================
// ROLE POLICIES
// ============================================================================

type RolePolicy = {
  // High-level permissions for UI/business logic
  allow: PermissionKey[];
  deny: PermissionKey[];

  // API endpoint-level permissions for server actions
  // Use action names like 'invoices.create', 'invoices.update', etc.
  actions: {
    allow: string[];
    deny: string[];
  };
};

/**
 * USER role: Read-only access to invoices and quotes
 */
const USER: RolePolicy = {
  allow: [
    'canReadInvoices',
    'canReadQuotes',
    'canReadTransactions',
    'canReadRecipes',
    'canReadProducts',
    'canReadVendors',
    'canReadPriceList',
  ],
  deny: [],
  actions: {
    allow: [
      // Invoice read actions
      'invoices.getInvoices',
      'invoices.getInvoiceById',
      'invoices.getInvoiceStatistics',
      'invoices.getInvoicePdfUrl',

      // Quote read actions
      'quotes.getQuotes',
      'quotes.getQuoteById',
      'quotes.getQuoteStatistics',

      // Product read actions
      'products.getProducts',
      'products.getProductById',
      'products.getProductStatistics',
      'products.getActiveProducts',

      // Vendor read actions
      'vendors.getVendors',
      'vendors.getVendorById',
      'vendors.getVendorStatistics',
      'vendors.getActiveVendors',

      // Recipe read actions
      'recipes.getRecipes',
      'recipes.getRecipeById',

      // Price List read actions
      'priceList.getPriceListItems',
      'priceList.getPriceListItemById',
      'priceList.getPriceListCostHistory',
    ],
    deny: [],
  },
};

/**
 * MANAGER role: Can manage invoices/quotes and record payments
 * Inherits from USER and adds management and payment permissions
 */
const MANAGER: RolePolicy = {
  allow: [
    ...USER.allow,
    'canManageInvoices',
    'canManageQuotes',
    'canManageTransactions',
    'canRecordPayments',
    'canManageProducts',
    'canManageVendors',
    'canManageRecipes',
    'canManagePriceList',
  ],
  deny: [],
  actions: {
    allow: [
      ...USER.actions.allow,

      // Invoice management actions
      'invoices.createInvoice',
      'invoices.updateInvoice',
      'invoices.markInvoiceAsPending',
      'invoices.cancelInvoice',
      'invoices.duplicateInvoice',
      'invoices.bulkUpdateInvoiceStatus',
      'invoices.sendInvoiceReminder',
      'invoices.sendInvoiceReceipt',

      // Payment actions
      'invoices.recordPayment',

      // Quote management actions
      'quotes.createQuote',
      'quotes.updateQuote',
      'quotes.markQuoteAsSent',
      'quotes.markQuoteAsAccepted',
      'quotes.cancelQuote',

      // Product management actions
      'products.createProduct',
      'products.updateProduct',
      'products.updateProductStatus',
      'products.updateProductStock',

      // Vendor management actions
      'vendors.createVendor',
      'vendors.updateVendor',
      'vendors.updateVendorStatus',

      // Recipe management actions
      'recipes.createRecipe',
      'recipes.updateRecipe',

      // Price List management actions
      'priceList.createPriceListItem',
      'priceList.updatePriceListItem',
    ],
    deny: [],
  },
};

/**
 * ADMIN role: Full access to all resources
 * Same as MANAGER plus deletion permissions
 */
const ADMIN: RolePolicy = {
  allow: [...MANAGER.allow, 'canAccessTools'],
  deny: [],
  actions: {
    allow: [
      ...MANAGER.actions.allow,

      // Admin-only actions (deletion)
      'invoices.deleteInvoice',
      'quotes.deleteQuote',
      'products.deleteProduct',
      'vendors.deleteVendor',
      'recipes.deleteRecipe',
      'priceList.deletePriceListItem',
    ],
    deny: [],
  },
};

/**
 * SUPER_ADMIN role: Full platform-wide access, no restrictions
 */
const SUPER_ADMIN: RolePolicy = {
  allow: [...ADMIN.allow],
  deny: [],
  actions: {
    allow: [...ADMIN.actions.allow],
    deny: [],
  },
};

/**
 * Role policies mapping
 */
export const RolePolicies: Record<UserRole, RolePolicy> = {
  SUPER_ADMIN,
  USER,
  MANAGER,
  ADMIN,
};

// ============================================================================
// PERMISSION CHECKING FUNCTIONS
// ============================================================================

/**
 * Checks if a user has the required permission.
 * @param user - The session user object.
 * @param permission - The permission key to check.
 * @returns true if the user has the permission, false otherwise.
 */
export function hasPermission(
  user: Session['user'] | undefined,
  permission: PermissionKey,
): boolean {
  if (!user || !user.role) {
    return false;
  }

  const policy = RolePolicies[user.role as UserRole];
  if (!policy) {
    return false;
  }

  // Check if explicitly denied
  if (policy.deny.includes(permission)) {
    return false;
  }

  // Check if explicitly allowed
  return policy.allow.includes(permission);
}

/**
 * Throws an error if the user does not have the required permission.
 * @param user - The session user object.
 * @param permission - The permission key to check.
 * @throws Error if access is denied.
 */
export function requirePermission(
  user: Session['user'] | undefined,
  permission: PermissionKey,
): void {
  if (!hasPermission(user, permission)) {
    const permissionLabel = PERMISSIONS[permission]?.label || permission;
    throw new Error(`Unauthorized: ${permissionLabel}`);
  }
}

/**
 * Get all permissions for a user's role.
 * Useful for UI rendering (showing/hiding buttons, etc.)
 * @param user - The session user object.
 * @returns Array of permission keys the user has access to.
 */
export function getUserPermissions(user: Session['user'] | undefined): PermissionKey[] {
  if (!user || !user.role) {
    return [];
  }

  const policy = RolePolicies[user.role as UserRole];
  if (!policy) {
    return [];
  }

  // Return allowed permissions minus denied ones
  return policy.allow.filter((p: PermissionKey) => !policy.deny.includes(p));
}

/**
 * Check if a user has permission to execute a specific action/endpoint.
 * Useful for protecting API routes and server actions.
 * @param user - The session user object.
 * @param action - The action identifier (e.g., 'invoices.createInvoice').
 * @returns true if the user can execute the action, false otherwise.
 */
export function hasActionPermission(user: Session['user'] | undefined, action: string): boolean {
  if (!user || !user.role) {
    return false;
  }

  const policy = RolePolicies[user.role as UserRole];
  if (!policy) {
    return false;
  }

  // Check if explicitly denied
  if (policy.actions.deny.includes(action)) {
    return false;
  }

  // Check if explicitly allowed
  return policy.actions.allow.includes(action);
}

/**
 * Throws an error if the user does not have permission to execute an action.
 * @param user - The session user object.
 * @param action - The action identifier to check.
 * @throws Error if access is denied.
 */
export function requireActionPermission(user: Session['user'] | undefined, action: string): void {
  if (!hasActionPermission(user, action)) {
    throw new Error(`Unauthorized: Cannot execute ${action}`);
  }
}

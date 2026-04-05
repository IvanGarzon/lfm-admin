'use client';

import { createContext, useContext } from 'react';
import type { TenantBranding } from '@/actions/tenant/queries';

const TenantBrandingContext = createContext<TenantBranding | null>(null);

export function TenantBrandingProvider({
  branding,
  children,
}: {
  branding: TenantBranding | null;
  children: React.ReactNode;
}) {
  return (
    <TenantBrandingContext.Provider value={branding}>{children}</TenantBrandingContext.Provider>
  );
}

export function useTenantBranding(): TenantBranding | null {
  return useContext(TenantBrandingContext);
}

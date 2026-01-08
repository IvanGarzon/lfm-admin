'use client';

import { PageContainer } from '@/components/Layout/PageContainer';
import { SearchParams } from 'nuqs/server';
import { CustomerPagination } from '@/features/customers/types';

interface CustomerViewProps {
  initialData: CustomerPagination;
  searchParams: SearchParams;
}

export function CustomersList({ initialData, searchParams }: CustomerViewProps) {
  return (
    <PageContainer>
      {initialData.items.map((customer) => (
        <div key={customer.id}>{customer.firstName}</div>
      ))}
    </PageContainer>
  );
}

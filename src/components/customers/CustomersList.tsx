'use client';

import { Customer, Prisma } from '@/prisma/client';
import { CustomerStatusType } from '@/zod/inputTypeSchemas/CustomerStatusSchema';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { TableHead, TableRow, TableHeader, TableBody, Table } from 'src/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'src/components/ui/card';
import { Button } from '@/components/ui/button';
import { CustomerItem } from '@/components/customers/CustomerItem';
import { getCustomers } from '@/actions/customers';
import { PageContainer } from '@/components/Layout/PageContainer';

import { Box } from '@/components/ui/box';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { File, PlusCircle } from 'lucide-react';

export function CustomersList() {
  const [search, setSearch] = useState<string>('');
  const [status, setStatus] = useState<string>('');

  const {
    data: customers,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['customers', { search, status }],
    queryFn: () => getCustomers({ search, status }),
  });

  if (isLoading) {
    return (
      <Box className="flex items-center justify-center bg-white dark:bg-black h-40">
        <span className="animate-spin w-8 h-8 border-4 border-t-transparent border-solid border-primary rounded-full" />
      </Box>
    );
  }

  if (error) {
    return <div>Error fetching customers</div>;
  }

  return (
    <PageContainer>
      <Tabs defaultValue="all">
        <div className="flex items-center">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="draft">Draft</TabsTrigger>
            <TabsTrigger value="archived" className="hidden sm:flex">
              Archived
            </TabsTrigger>
          </TabsList>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" className="h-8 gap-1">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add Customer</span>
            </Button>
          </div>
        </div>
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Customers</CardTitle>
              <CardDescription>Manage your Customers and view their details.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* <input
                type="text"
                placeholder="Search products"
                value={search}
                onChange={handleSearchChange}
              />
              <select value={status} onChange={handleStatusChange}>
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
              </select> */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer: Customer) => (
                    <CustomerItem key={customer.id} customer={customer} />
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

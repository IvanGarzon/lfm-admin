'use client';

import { Product, Prisma } from '@/prisma/client';
import type { ProductStatus } from '@/zod/schemas/enums/ProductStatus.schema';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { TableHead, TableRow, TableHeader, TableBody, Table } from 'src/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'src/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProductItem } from '@/components/products/ProductItem';
import { getProducts, createProduct } from '@/actions/products';
import { PageContainer } from '@/components/Layout/PageContainer';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle } from 'lucide-react';

interface ProductParams {
  search?: string;
  status?: string;
  category?: string;
}

export function ProductsList() {
  const [search, setSearch] = useState<string>('');
  const [status, setStatus] = useState<string>('');

  const {
    data: products,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['products', { search, status }],
    queryFn: () => getProducts({ search, status }),
  });

  const mutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      // Invalidate and refetch
      // queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  // Handle status change (e.g., dropdown or select box)
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value);
  };

  const handleCreateProduct = () => {
    const product = {
      name: 'Headphones',
      description: 'This is a new product.',
      imageUrl: 'https://api.slingacademy.com/public/sample-users/10.png',
      price: new Prisma.Decimal(155),
      stock: 100,
      availableAt: new Date('2024-12-10T00:00:00Z'),
      status: 'ACTIVE' as ProductStatus,
    } as Product;

    mutation.mutate(product);
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error fetching products</div>;

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
            {/* <Button size="sm" variant="outline" className="h-8 gap-1">
              <File className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Export</span>
            </Button> */}
            <Button size="sm" className="h-8 gap-1" onClick={handleCreateProduct}>
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add Product</span>
            </Button>
          </div>
        </div>
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Products</CardTitle>
              <CardDescription>
                Manage your products and view their sales performance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filter Inputs */}
              <input
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
              </select>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="hidden w-[100px] sm:table-cell">
                      <span className="sr-only">Image</span>
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Price</TableHead>
                    <TableHead className="hidden md:table-cell">Total Sales</TableHead>
                    <TableHead className="hidden md:table-cell">Created at</TableHead>
                    <TableHead>
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product: Product) => (
                    <ProductItem key={product.id} product={product} />
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

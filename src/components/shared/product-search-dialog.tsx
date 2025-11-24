'use client';

import { useState, useMemo } from 'react';
import { Package, Check, Loader2 } from 'lucide-react';
import { Box } from '@/components/ui/box';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils';
import type { ActiveProduct } from '@/features/products/types';

interface ProductSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: ActiveProduct[];
  isLoadingProducts: boolean;
  selectedProductId: string | null;
  onProductSelect: (productId: string) => void;
}

export function ProductSearchDialog({
  open,
  onOpenChange,
  products,
  isLoadingProducts,
  selectedProductId,
  onProductSelect,
}: ProductSearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter products based on search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;

    const query = searchQuery.toLowerCase();
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      setSearchQuery('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Product</DialogTitle>
          <DialogDescription>Search and select a product to add to the quote</DialogDescription>
        </DialogHeader>

        {isLoadingProducts ? (
          <Box className="flex flex-col items-center justify-center h-full min-h-[300px] space-y-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p>Loading products...</p>
          </Box>
        ) : null}

        {Array.isArray(filteredProducts) && filteredProducts.length > 0 ? (
          <Box className="flex-1 flex flex-col gap-4 overflow-hidden">
            <Box className="relative">
              <Input
                type="search"
                inputSize="lg"
                placeholder="Search products by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="focus-visible:ring-primary/20 focus-visible:border-primary"
              />
            </Box>
            <Box className="flex-1 border rounded-lg overflow-hidden flex flex-col">
              <Box className="flex-1 overflow-y-auto">
                <Box className="divide-y dark:divide-gray-800">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => product.id && onProductSelect(product.id)}
                      className="w-full px-4 py-3 hover:bg-muted/50 transition-colors text-left flex items-center gap-3 cursor-pointer"
                    >
                      <Box className="shrink-0 w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </Box>
                      <Box className="flex-1 min-w-0">
                        <Box className="font-medium">{product.name}</Box>
                        {product.description ? (
                          <Box className="text-sm text-muted-foreground line-clamp-1">
                            {product.description}
                          </Box>
                        ) : null}
                        <Box className="text-sm font-semibold text-primary mt-1">
                          {formatCurrency({
                            number: product.price,
                          })}
                        </Box>
                      </Box>
                      {selectedProductId === product.id ? (
                        <Check className="h-5 w-5 text-primary shrink-0" />
                      ): null}
                    </button>
                  ))}
                </Box>
              </Box>
            </Box>
          </Box>
        ) : !isLoadingProducts ? (
          <Box className="flex flex-col items-center justify-center h-full min-h-[300px] text-muted-foreground">
            <Package className="h-8 w-8 mb-2" />
            <p>No products found</p>
          </Box>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState, useMemo, useCallback } from 'react';
import { Search, ChefHat } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { cn, formatCurrency } from '@/lib/utils';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getRecipes } from '@/actions/finances/recipes/queries';
import type { RecipeListItem } from '@/features/finances/recipes/types';

interface RecipeSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (recipe: RecipeListItem) => void;
  excludeIds?: string[];
}

const EMPTY_EXCLUDE_IDS: string[] = [];

export function RecipeSearchDialog({
  open,
  onOpenChange,
  onSelect,
  excludeIds = EMPTY_EXCLUDE_IDS,
}: RecipeSearchDialogProps) {
  const [search, setSearch] = useState('');

  const { data: recipesData, isLoading } = useQuery({
    queryKey: ['recipes', 'all'],
    queryFn: async () => {
      const result = await getRecipes({ perPage: '100' });
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data?.items ?? [];
    },
    enabled: open,
    staleTime: 30 * 1000,
  });

  const filteredRecipes = useMemo(() => {
    if (!recipesData) {
      return [];
    }

    let recipes = recipesData;

    if (excludeIds.length > 0) {
      recipes = recipes.filter((r) => !excludeIds.includes(r.id));
    }

    if (search.trim()) {
      const lowerSearch = search.toLowerCase();
      recipes = recipes.filter(
        (r) =>
          r.name.toLowerCase().includes(lowerSearch) ||
          r.description?.toLowerCase().includes(lowerSearch),
      );
    }

    return recipes;
  }, [recipesData, search, excludeIds]);

  const handleSelect = useCallback(
    (recipe: RecipeListItem) => {
      onSelect(recipe);
      setSearch('');
    },
    [onSelect],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Select Recipe</DialogTitle>
          <DialogDescription>Choose a recipe to add to this group</DialogDescription>
        </DialogHeader>

        <Box className="relative">
          <Search
            aria-hidden="true"
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
          />
          <Input
            placeholder="Search recipes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </Box>

        <ScrollArea className="h-[400px] pr-4">
          {isLoading ? (
            <Box className="flex items-center justify-center h-full">
              <Box className="text-sm text-muted-foreground">Loading recipes...</Box>
            </Box>
          ) : filteredRecipes.length === 0 ? (
            <Box className="flex flex-col items-center justify-center h-full text-center p-8">
              <ChefHat
                aria-hidden="true"
                className="h-12 w-12 text-muted-foreground opacity-50 mb-2"
              />
              <p className="text-sm text-muted-foreground">
                {search.trim() ? 'No recipes found matching your search' : 'No recipes available'}
              </p>
            </Box>
          ) : (
            <Box className="space-y-2">
              {filteredRecipes.map((recipe) => (
                <Button
                  key={recipe.id}
                  type="button"
                  variant="outline"
                  className={cn(
                    'w-full h-auto p-3 flex items-start gap-3 text-left hover:bg-accent',
                  )}
                  onClick={() => handleSelect(recipe)}
                >
                  <Box className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{recipe.name}</p>
                    {recipe.description ? (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {recipe.description}
                      </p>
                    ) : null}
                    <Box className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>Cost: {formatCurrency({ number: recipe.totalCost })}</span>
                      <span>•</span>
                      <span>Retail: {formatCurrency({ number: recipe.totalRetailPrice })}</span>
                    </Box>
                  </Box>
                  <Box className="text-sm font-semibold text-primary shrink-0">
                    {formatCurrency({ number: recipe.sellingPrice })}
                  </Box>
                </Button>
              ))}
            </Box>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

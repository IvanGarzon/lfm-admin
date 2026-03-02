'use client';

import { useState, useCallback, useMemo } from 'react';
import { Check, ChefHat, Layers, Minus, Plus, Search } from 'lucide-react';

import { cn, formatCurrency } from '@/lib/utils';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { getRecipeGroupById } from '@/actions/finances/recipe-groups/queries';
import type { RecipeListItem } from '@/features/finances/recipes/types';
import type { RecipeGroupListItem } from '@/features/finances/recipe-groups/types';

type SelectedItem = {
  id: string;
  name: string;
  sellingPrice: number;
  quantity: number;
  type: 'recipe' | 'group';
};

interface AddRecipesDialogProps {
  onAdd: (items: { description: string; quantity: number; unitPrice: number }[]) => void;
  disabled?: boolean;
  recipes: RecipeListItem[] | undefined;
  isLoadingRecipes: boolean;
  recipeGroups: RecipeGroupListItem[] | undefined;
  isLoadingRecipeGroups: boolean;
  onRequestRecipes: () => void;
}

export function AddRecipesDialog({
  onAdd,
  disabled,
  recipes,
  isLoadingRecipes,
  recipeGroups,
  isLoadingRecipeGroups,
  onRequestRecipes,
}: AddRecipesDialogProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedItems, setSelectedItems] = useState<Map<string, SelectedItem>>(new Map());
  const [activeTab, setActiveTab] = useState<'recipes' | 'groups'>('recipes');

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (newOpen) {
        onRequestRecipes();
      }
      setOpen(newOpen);
    },
    [onRequestRecipes],
  );

  const filteredRecipes = useMemo(() => {
    if (!recipes) {
      return [];
    }

    if (!search.trim()) {
      return recipes;
    }

    const lowerSearch = search.toLowerCase();
    return recipes.filter(
      (r) =>
        r.name.toLowerCase().includes(lowerSearch) ||
        r.description?.toLowerCase().includes(lowerSearch),
    );
  }, [recipes, search]);

  const filteredGroups = useMemo(() => {
    if (!recipeGroups) {
      return [];
    }

    if (!search.trim()) {
      return recipeGroups;
    }

    const lowerSearch = search.toLowerCase();
    return recipeGroups.filter(
      (g) =>
        g.name.toLowerCase().includes(lowerSearch) ||
        g.description?.toLowerCase().includes(lowerSearch),
    );
  }, [recipeGroups, search]);

  const handleToggleItem = useCallback(
    (item: RecipeListItem | RecipeGroupListItem, type: 'recipe' | 'group') => {
      setSelectedItems((prev) => {
        const key = `${type}-${item.id}`;
        const newMap = new Map(prev);

        if (newMap.has(key)) {
          newMap.delete(key);
        } else {
          newMap.set(key, {
            id: item.id,
            name: item.name,
            sellingPrice: type === 'recipe' ? item.sellingPrice : item.totalCost,
            quantity: 1,
            type,
          });
        }

        return newMap;
      });
    },
    [],
  );

  const handleUpdateQuantity = useCallback((key: string, delta: number) => {
    setSelectedItems((prev) => {
      const newMap = new Map(prev);
      const item = newMap.get(key);
      if (item) {
        const newQuantity = Math.max(1, item.quantity + delta);
        newMap.set(key, { ...item, quantity: newQuantity });
      }
      return newMap;
    });
  }, []);

  const handleAddToQuote = useCallback(async () => {
    const items: { description: string; quantity: number; unitPrice: number }[] = [];

    for (const [, item] of selectedItems) {
      if (item.type === 'recipe') {
        items.push({
          description: item.name,
          quantity: item.quantity,
          unitPrice: item.sellingPrice,
        });
      } else {
        // For recipe groups, fetch the group details and expand into individual items
        const result = await getRecipeGroupById(item.id);
        if (result.success && result.data) {
          for (const groupItem of result.data.items) {
            items.push({
              description: `${groupItem.recipe.name}`,
              quantity: groupItem.quantity * item.quantity,
              unitPrice:
                (groupItem.recipe as any).sellingPrice ?? groupItem.recipe.totalRetailPrice,
            });
          }
        }
      }
    }

    onAdd(items);
    handleOpenChange(false);
    setSelectedItems(new Map());
    setSearch('');
  }, [selectedItems, onAdd, handleOpenChange]);

  const totalSelected = selectedItems.size;
  const totalValue = useMemo(() => {
    let sum = 0;
    for (const [, item] of selectedItems) {
      sum += item.sellingPrice * item.quantity;
    }
    return sum;
  }, [selectedItems]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-secondary cursor-pointer"
        >
          <ChefHat className="h-4 w-4 mr-1" />
          Add from Recipes
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Add Recipes to Quote</DialogTitle>
          <DialogDescription>
            Select recipes or recipe groups to add to your quote. Items will be added with their
            current selling prices.
          </DialogDescription>
        </DialogHeader>

        <Box className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search recipes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </Box>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'recipes' | 'groups')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recipes" className="flex items-center gap-2">
              <ChefHat className="h-4 w-4" />
              Recipes
              {filteredRecipes.length > 0 ? (
                <Badge variant="secondary" className="ml-1">
                  {filteredRecipes.length}
                </Badge>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="groups" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Groups
              {filteredGroups.length > 0 ? (
                <Badge variant="secondary" className="ml-1">
                  {filteredGroups.length}
                </Badge>
              ) : null}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recipes" className="mt-4">
            <ScrollArea className="h-[300px] pr-4">
              {isLoadingRecipes ? (
                <Box className="flex items-center justify-center h-full">
                  <Box className="text-sm text-muted-foreground">Loading recipes...</Box>
                </Box>
              ) : filteredRecipes.length === 0 ? (
                <Box className="flex items-center justify-center h-full">
                  <Box className="text-sm text-muted-foreground">No recipes found</Box>
                </Box>
              ) : (
                <Box className="space-y-2">
                  {filteredRecipes.map((recipe) => {
                    const key = `recipe-${recipe.id}`;
                    const selected = selectedItems.get(key);
                    const isSelected = !!selected;

                    return (
                      <RecipeItemCard
                        key={recipe.id}
                        name={recipe.name}
                        description={recipe.description}
                        price={recipe.sellingPrice}
                        isSelected={isSelected}
                        quantity={selected?.quantity ?? 1}
                        onToggle={() => handleToggleItem(recipe, 'recipe')}
                        onUpdateQuantity={(delta) => handleUpdateQuantity(key, delta)}
                      />
                    );
                  })}
                </Box>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="groups" className="mt-4">
            <ScrollArea className="h-[300px] pr-4">
              {isLoadingRecipeGroups ? (
                <Box className="flex items-center justify-center h-full">
                  <Box className="text-sm text-muted-foreground">Loading groups...</Box>
                </Box>
              ) : filteredGroups.length === 0 ? (
                <Box className="flex items-center justify-center h-full">
                  <Box className="text-sm text-muted-foreground">No recipe groups found</Box>
                </Box>
              ) : (
                <Box className="space-y-2">
                  {filteredGroups.map((group) => {
                    const key = `group-${group.id}`;
                    const selected = selectedItems.get(key);
                    const isSelected = !!selected;

                    return (
                      <RecipeItemCard
                        key={group.id}
                        name={group.name}
                        description={group.description}
                        price={group.totalCost}
                        badge={`${group.itemCount} items`}
                        isSelected={isSelected}
                        quantity={selected?.quantity ?? 1}
                        onToggle={() => handleToggleItem(group, 'group')}
                        onUpdateQuantity={(delta) => handleUpdateQuantity(key, delta)}
                      />
                    );
                  })}
                </Box>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Box className="flex-1 text-sm text-muted-foreground">
            {totalSelected > 0 ? (
              <>
                {totalSelected} item{totalSelected > 1 ? 's' : ''} selected
                <span className="mx-2">·</span>
                {formatCurrency({ number: totalValue })}
              </>
            ) : null}
          </Box>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddToQuote} disabled={totalSelected === 0}>
            Add to Quote
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RecipeItemCard({
  name,
  description,
  price,
  badge,
  isSelected,
  quantity,
  onToggle,
  onUpdateQuantity,
}: {
  name: string;
  description?: string | null;
  price: number;
  badge?: string;
  isSelected: boolean;
  quantity: number;
  onToggle: () => void;
  onUpdateQuantity: (delta: number) => void;
}) {
  return (
    <Box
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer',
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50',
      )}
      onClick={onToggle}
    >
      <Box
        className={cn(
          'w-5 h-5 rounded border flex items-center justify-center shrink-0',
          isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-gray-300',
        )}
      >
        {isSelected ? <Check className="h-3 w-3" /> : null}
      </Box>

      <Box className="flex-1 min-w-0">
        <Box className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{name}</span>
          {badge ? (
            <Badge variant="outline" className="text-xs shrink-0">
              {badge}
            </Badge>
          ) : null}
        </Box>
        {description ? (
          <Box className="text-xs text-muted-foreground truncate mt-0.5">{description}</Box>
        ) : null}
      </Box>

      <Box className="text-sm font-medium shrink-0">{formatCurrency({ number: price })}</Box>

      {isSelected ? (
        <Box className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => onUpdateQuantity(-1)}
            disabled={quantity <= 1}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="w-8 text-center text-sm font-medium">{quantity}</span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => onUpdateQuantity(1)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </Box>
      ) : null}
    </Box>
  );
}

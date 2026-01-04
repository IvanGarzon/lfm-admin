'use client';

import { useCallback, useState, useTransition } from 'react';
import { Check, ChevronsUpDown, Loader2, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { createTransactionCategory } from '@/actions/transactions/mutations';

export type Category = {
  id: string;
  name: string;
  description: string | null;
};

interface CategoryMultiSelectProps {
  categories: Category[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onCategoryCreated?: (category: Category) => void;
  disabled?: boolean;
}

export function CategoryMultiSelect({
  categories,
  selectedIds,
  onChange,
  onCategoryCreated,
  disabled = false,
}: CategoryMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isPending, startTransition] = useTransition();

  const selectedCategories = categories.filter((cat) => selectedIds.includes(cat.id));
  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSelect = useCallback(
    (categoryId: string) => {
      const newSelection = selectedIds.includes(categoryId)
        ? selectedIds.filter((id) => id !== categoryId)
        : [...selectedIds, categoryId];
      onChange(newSelection);
    },
    [selectedIds, onChange],
  );

  const handleRemove = useCallback(
    (categoryId: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onChange(selectedIds.filter((id) => id !== categoryId));
    },
    [selectedIds, onChange],
  );

  const handleCreateCategory = useCallback(() => {
    if (!search.trim()) return;

    startTransition(async () => {
      const result = await createTransactionCategory(search.trim());
      if (result.success && result.data) {
        const newCategory = result.data;
        // Add to selected categories
        onChange([...selectedIds, newCategory.id]);
        // Notify parent to update the categories list
        onCategoryCreated?.(newCategory);
        // Clear search
        setSearch('');
      }
    });
  }, [search, selectedIds, onChange, onCategoryCreated, startTransition]);

  const showCreateOption =
    search.trim() &&
    !filteredCategories.some((cat) => cat.name.toLowerCase() === search.toLowerCase());

  return (
    <Box className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-[40px] py-2"
            disabled={disabled}
          >
            {selectedCategories.length > 0 ? (
              <Box className="flex flex-wrap gap-1 flex-1">
                {selectedCategories.map((category) => (
                  <Badge key={category.id} variant="secondary" className="text-xs font-normal">
                    {category.name}
                    <span
                      role="button"
                      tabIndex={0}
                      className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleRemove(category.id, e as any);
                        }
                      }}
                      onMouseDown={(e) => handleRemove(category.id, e)}
                      onClick={(e) => handleRemove(category.id, e)}
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </span>
                  </Badge>
                ))}
              </Box>
            ) : (
              <span className="text-muted-foreground">Select categories...</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search or create category..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>
                {isPending ? (
                  <Box className="flex items-center justify-center py-6">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2 text-sm text-muted-foreground">Creating category...</span>
                  </Box>
                ) : (
                  <Box className="py-6 text-center text-sm text-muted-foreground">
                    No categories found
                  </Box>
                )}
              </CommandEmpty>
              <CommandGroup>
                {filteredCategories.map((category) => {
                  const isSelected = selectedIds.includes(category.id);
                  return (
                    <CommandItem
                      key={category.id}
                      value={category.id}
                      onSelect={() => handleSelect(category.id)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn('mr-2 h-4 w-4', isSelected ? 'opacity-100' : 'opacity-0')}
                      />
                      <Box className="flex-1">
                        <Box className="font-medium">{category.name}</Box>
                        {category.description && (
                          <Box className="text-xs text-muted-foreground">
                            {category.description}
                          </Box>
                        )}
                      </Box>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              {showCreateOption && !isPending ? (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem onSelect={handleCreateCategory} className="cursor-pointer">
                      <Plus className="mr-2 h-4 w-4" />
                      Create &quot;{search}&quot;
                    </CommandItem>
                  </CommandGroup>
                </>
              ) : null}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </Box>
  );
}

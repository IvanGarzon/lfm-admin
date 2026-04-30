'use client';

import { MoreHorizontal, Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuLabel,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { RecipeListItem } from '@/features/finances/recipes/types';

interface RecipeActionsProps {
  recipe: RecipeListItem;
  onDelete: (id: string, name: string) => void;
  onEdit: (id: string) => void;
}

export function RecipeActions({ recipe, onDelete, onEdit }: RecipeActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="h-8 w-8 p-0" variant="secondary">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onEdit(recipe.id)}>
          <Edit aria-hidden="true" className="h-4 w-4" />
          Edit recipe
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => onDelete(recipe.id, recipe.name)}
        >
          <Trash aria-hidden="true" className="h-4 w-4" />
          Delete recipe
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

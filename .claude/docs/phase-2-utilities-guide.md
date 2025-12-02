# Quick Reference Guide - Phase 2 Utilities

## 1. Error Handler (`src/lib/error-handler.ts`)

### Basic Usage in Server Actions

```typescript
import { handleActionError } from '@/lib/error-handler';
import type { ActionResult } from '@/types/actions';

export async function myAction(data: MyInput): Promise<ActionResult<MyOutput>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // 1. Validation
    const validated = MySchema.parse(data);

    // 2. Business logic
    const result = await repository.method(validated);
    if (!result) {
      return { success: false, error: 'Not found' };
    }

    // 3. Revalidate paths
    revalidatePath('/my-path');

    // 4. Return success
    return { success: true, data: result };
  } catch (error) {
    // 5. Use standardized error handler
    return handleActionError(error, 'Failed to perform action');
  }
}
```

### Custom Fallback Message

```typescript
try {
  // ... logic
} catch (error) {
  return handleActionError(error, 'Custom error message for this specific action');
}
```

### Type Guards

```typescript
import { isPrismaError, isZodError } from '@/lib/error-handler';

if (isPrismaError(error)) {
  // Handle Prisma-specific error
}

if (isZodError(error)) {
  // Handle Zod validation error
}
```

---

## 2. Unsaved Changes Hook (`src/hooks/use-unsaved-changes.ts`)

### Basic Usage with React Hook Form

```typescript
import { useForm } from 'react-hook-form';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';

export function MyForm() {
  const form = useForm({
    mode: 'onChange',
    // ... other options
  });

  // Warn user before leaving with unsaved changes
  useUnsavedChanges(form.formState.isDirty);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* form fields */}
    </form>
  );
}
```

### With Custom Message

```typescript
useUnsavedChanges(form.formState.isDirty, {
  message: 'You have unsaved changes. Leaving will discard them.',
});
```

### Callback Variant (Advanced)

```typescript
import { useUnsavedChangesCallback } from '@/hooks/use-unsaved-changes';

const hasChanges = useCallback(() => {
  // Custom logic to determine if there are changes
  return someCondition || anotherCondition;
}, [someCondition, anotherCondition]);

useUnsavedChangesCallback(hasChanges);
```

### Dialog Variant (Advanced)

```typescript
import { useUnsavedChangesDialog } from '@/hooks/use-unsaved-changes';

useUnsavedChangesDialog(
  form.formState.isDirty,
  () => {
    // Called when user confirms they want to leave
    console.log('User confirmed navigation');
  },
  () => {
    // Called when user cancels navigation
    console.log('User cancelled navigation');
  }
);
```

---

## 3. Migration Guide for Existing Code

### Before (Old Error Handling)

```typescript
export async function oldAction(data: Input): Promise<ActionResult<Output>> {
  try {
    const validated = Schema.parse(data);
    const result = await repo.method(validated);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, error: 'Validation failed' };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return { success: false, error: 'Already exists' };
      }
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Unknown error' };
  }
}
```

### After (New Error Handling)

```typescript
import { handleActionError } from '@/lib/error-handler';

export async function newAction(data: Input): Promise<ActionResult<Output>> {
  try {
    const validated = Schema.parse(data);
    const result = await repo.method(validated);
    return { success: true, data: result };
  } catch (error) {
    return handleActionError(error, 'Failed to perform action');
  }
}
```

**Benefits**:
- ✅ 15 lines reduced to 3 lines
- ✅ Consistent error messages
- ✅ Better logging
- ✅ Handles more error cases

---

## 4. Common Patterns

### Pattern 1: CRUD Action with Error Handling

```typescript
export async function createResource(
  data: CreateInput
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const validated = CreateSchema.parse(data);
    const resource = await repository.create(validated);
    
    revalidatePath('/resources');
    
    return { success: true, data: { id: resource.id } };
  } catch (error) {
    return handleActionError(error, 'Failed to create resource');
  }
}
```

### Pattern 2: Form with Unsaved Changes Warning

```typescript
export function ResourceForm({ resource, onSubmit }: Props) {
  const form = useForm<FormInput>({
    mode: 'onChange',
    resolver: zodResolver(ResourceSchema),
    defaultValues: resource || defaultValues,
  });

  // Warn about unsaved changes
  useUnsavedChanges(form.formState.isDirty);

  const handleSubmit = async (data: FormInput) => {
    const result = await onSubmit(data);
    if (result.success) {
      form.reset(data); // Reset dirty state
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)}>
      {/* form fields */}
    </form>
  );
}
```

### Pattern 3: Optimistic Update with Error Handling

```typescript
export function useUpdateResource() {
  return useMutation({
    mutationFn: async (data: UpdateInput) => {
      const result = await updateResource(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async (newData) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['resource', newData.id] });
      const previous = queryClient.getQueryData(['resource', newData.id]);
      queryClient.setQueryData(['resource', newData.id], newData);
      return { previous };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(['resource', variables.id], context.previous);
      }
      toast.error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      toast.success('Resource updated successfully');
    },
  });
}
```

---

## 5. Testing Examples

### Testing Error Handler

```typescript
import { handleActionError } from '@/lib/error-handler';
import { ZodError } from 'zod';
import { Prisma } from '@/prisma/client';

describe('handleActionError', () => {
  it('handles Zod validation errors', () => {
    const zodError = new ZodError([
      {
        code: 'invalid_type',
        expected: 'string',
        received: 'number',
        path: ['email'],
        message: 'Expected string, received number',
      },
    ]);

    const result = handleActionError(zodError);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid email');
  });

  it('handles Prisma unique constraint errors', () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      {
        code: 'P2002',
        clientVersion: '5.0.0',
        meta: { target: ['email'] },
      }
    );

    const result = handleActionError(prismaError);

    expect(result.success).toBe(false);
    expect(result.error).toContain('already exists');
  });

  it('handles generic errors', () => {
    const error = new Error('Something went wrong');
    const result = handleActionError(error, 'Custom fallback');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Something went wrong');
  });
});
```

### Testing Unsaved Changes Hook

```typescript
import { renderHook } from '@testing-library/react';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';

describe('useUnsavedChanges', () => {
  it('adds beforeunload listener when dirty', () => {
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    
    renderHook(() => useUnsavedChanges(true));

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'beforeunload',
      expect.any(Function)
    );
  });

  it('removes listener on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    
    const { unmount } = renderHook(() => useUnsavedChanges(true));
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'beforeunload',
      expect.any(Function)
    );
  });
});
```

---

## 6. Troubleshooting

### Error Handler Not Working

**Problem**: Errors not being handled correctly

**Solution**: Make sure you're returning the result of `handleActionError`:
```typescript
// ❌ Wrong
catch (error) {
  handleActionError(error); // Missing return!
}

// ✅ Correct
catch (error) {
  return handleActionError(error);
}
```

### Unsaved Changes Warning Not Showing

**Problem**: Warning doesn't appear when leaving page

**Solution**: Check that `isDirty` is actually true:
```typescript
// Debug
useEffect(() => {
  console.log('Form is dirty:', form.formState.isDirty);
}, [form.formState.isDirty]);

useUnsavedChanges(form.formState.isDirty);
```

### Warning Shows Even After Saving

**Problem**: Warning persists after successful save

**Solution**: Reset the form after successful save:
```typescript
const onSubmit = async (data) => {
  const result = await saveData(data);
  if (result.success) {
    form.reset(data); // This clears the dirty state
  }
};
```

---

## 7. Best Practices

### Error Handling
1. ✅ Always use `handleActionError` in server actions
2. ✅ Provide meaningful fallback messages
3. ✅ Log errors for debugging
4. ✅ Don't expose sensitive information in error messages
5. ✅ Handle auth errors before try-catch blocks

### Form Data Loss Prevention
1. ✅ Use with all forms that have user input
2. ✅ Reset form after successful submission
3. ✅ Don't use on read-only forms
4. ✅ Consider disabling for auto-save forms
5. ✅ Test with browser back button and refresh

### General
1. ✅ Keep utilities small and focused
2. ✅ Document with JSDoc comments
3. ✅ Write tests for utilities
4. ✅ Use TypeScript for type safety
5. ✅ Follow existing code patterns

---

## 8. Related Documentation

- [Error Handling Guide](./error-handling-guide.md)
- [Form Best Practices](./form-best-practices.md)
- [Server Actions Pattern](./server-actions-pattern.md)
- [React Query Integration](./react-query-integration.md)

---

**Last Updated**: 2025-12-02
**Version**: 1.0.0

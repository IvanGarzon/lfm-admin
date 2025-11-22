import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Eye, EyeOff, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const inputVariants = cva(
  [
    'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent px-3 shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
    'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
  ],
  {
    variants: {
      inputSize: {
        sm: 'h-8 py-1 text-sm file:h-6',
        default: 'h-9 py-1 text-sm md:text-sm file:h-7',
        lg: 'h-12 py-2 text-base file:h-8',
        xl: 'h-16 py-2 text-base file:h-10',
      },
      hasError: {
        true: 'aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-red-200 aria-[invalid=true]:border-red-500',
      },
      enableStepper: {
        false:
          '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
      },
    },
    defaultVariants: {
      inputSize: 'default',
    },
  },
);

export interface InputProps
  extends Omit<React.ComponentProps<'input'>, 'size'>,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, inputSize, hasError, enableStepper = true, ...props }, ref) => {
    const isPassword = type === 'password';
    const isSearch = type === 'search';

    const [typeState, setTypeState] = React.useState<'text' | 'password'>('password');

    return (
      <div className={cn('relative w-full', className)}>
        <input
          type={isPassword ? typeState : type}
          data-slot="input"
          className={cn(inputVariants({ inputSize, className }), {
            'pl-8': isSearch,
            'pr-10': isPassword,
          })}
          ref={ref}
          {...props}
        />

        {isSearch ? (
          <div
            className={cn(
              'pointer-events-none absolute bottom-0 left-2 flex h-full items-center justify-center',
              'text-gray-400 dark:text-gray-600',
            )}
          >
            <Search size={16} className="shrink-0" aria-hidden="true" />
          </div>
        ) : null}

        {isPassword ? (
          <div
            className={cn('absolute bottom-0 right-0 flex h-full items-center justify-center px-3')}
          >
            <button
              aria-label="Change password visibility"
              className={cn(
                'h-fit w-fit rounded-sm outline-none transition-all cursor-pointer',
                'text-gray-400 dark:text-gray-600',
                'hover:text-gray-500 hover:dark:text-gray-500',
              )}
              type="button"
              onClick={() => {
                setTypeState(typeState === 'password' ? 'text' : 'password');
              }}
            >
              <span className="sr-only">
                {typeState === 'password' ? 'Show password' : 'Hide password'}
              </span>
              {typeState === 'password' ? (
                <Eye aria-hidden="true" className="size-5 shrink-0" />
              ) : (
                <EyeOff aria-hidden="true" className="size-5 shrink-0" />
              )}
            </button>
          </div>
        ) : null}
      </div>
    );
  },
);
Input.displayName = 'Input';

export { Input };

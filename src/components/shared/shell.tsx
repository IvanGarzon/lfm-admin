import { type VariantProps, cva } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

const shellVariants = cva('grid items-center gap-8 pt-6 pb-8 md:px-6 md:py-8', {
  variants: {
    variant: {
      default: 'container',
      sidebar: '',
      centered: 'container flex h-dvh max-w-2xl flex-col justify-center py-16',
      markdown: 'container max-w-3xl py-8 md:py-10 lg:py-10',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

interface ShellProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof shellVariants> {
  as?: React.ElementType;
  scrollable?: boolean;
}

function Shell({
  className,
  as: Component = 'section',
  variant,
  scrollable = false,
  children,
  ...props
}: ShellProps) {
  const content = (
    <Component className={cn(shellVariants({ variant }), className)} {...props}>
      {children}
    </Component>
  );

  return scrollable ? (
    <ScrollArea className="h-[calc(100dvh-52px)]">
      <div className="flex flex-col h-full">
        <Component className={cn(shellVariants({ variant }), 'min-w-0', className)} {...props}>
          {children}
        </Component>
      </div>
    </ScrollArea>
  ) : (
    <div className="flex flex-col h-full overflow-hidden">{content}</div>
  );
}

export { Shell, shellVariants };

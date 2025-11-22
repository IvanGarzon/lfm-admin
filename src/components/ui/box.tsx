import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BoxProps extends React.HTMLProps<HTMLDivElement> {}

const Box = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn(className)} {...props} />,
);
Box.displayName = 'Box';

export { Box };

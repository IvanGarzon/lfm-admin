import * as DrawerPrimitives from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import * as React from 'react';

import clsx from 'clsx';
import { focusRing } from '@/lib/utils';
import { Button } from './button';

const Drawer = (props: React.ComponentPropsWithoutRef<typeof DrawerPrimitives.Root>) => {
  return <DrawerPrimitives.Root {...props} />;
};
Drawer.displayName = 'Drawer';

const DrawerTrigger = React.forwardRef<
  React.ComponentRef<typeof DrawerPrimitives.Trigger>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitives.Trigger>
>(({ className, ...props }, ref) => {
  return <DrawerPrimitives.Trigger ref={ref} className={clsx(className)} {...props} />;
});
DrawerTrigger.displayName = 'Drawer.Trigger';

const DrawerClose = React.forwardRef<
  React.ComponentRef<typeof DrawerPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitives.Close>
>(({ className, ...props }, ref) => {
  return <DrawerPrimitives.Close ref={ref} className={clsx(className)} {...props} />;
});
DrawerClose.displayName = 'Drawer.Close';

const DrawerPortal = DrawerPrimitives.Portal;

DrawerPortal.displayName = 'DrawerPortal';

const DrawerOverlay = React.forwardRef<
  React.ComponentRef<typeof DrawerPrimitives.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitives.Overlay>
>(({ className, ...props }, forwardedRef) => {
  return (
    <DrawerPrimitives.Overlay
      ref={forwardedRef}
      className={clsx(
        // base
        'fixed inset-0 z-50 overflow-y-auto',
        // background color
        'bg-black/30 dark:bg-black/60',
        // transition
        'data-[state=closed]:animate-hide data-[state=open]:animate-dialogOverlayShow',
        className,
      )}
      {...props}
      style={{
        animationDuration: '400ms',
        animationFillMode: 'backwards',
      }}
    />
  );
});

DrawerOverlay.displayName = 'DrawerOverlay';

const DrawerContent = React.forwardRef<
  React.ComponentRef<typeof DrawerPrimitives.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitives.Content>
>(({ className, ...props }, forwardedRef) => {
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitives.Content
        ref={forwardedRef}
        className={clsx(
          // base
          'fixed inset-y-0 right-0 z-50 flex flex-1 flex-col overflow-y-auto border rounded-none p-6 shadow-lg focus:outline-none',
          // border color
          'border-gray-200 dark:border-gray-900',
          // background color
          'bg-white dark:bg-[#090E1A]',
          // transition
          'data-[state=closed]:animate-drawerSlideRightAndFade data-[state=open]:animate-drawerSlideLeftAndFade',
          focusRing,
          // Fullscreen styles for non-mobile
          'w-full h-full max-w-none max-h-none sm:max-w-2xl sm:h-auto sm:right-2 sm:inset-y-2 sm:rounded-md',
          className,
        )}
        {...props}
      />
    </DrawerPortal>
  );
});

DrawerContent.displayName = 'DrawerContent';

const DrawerHeader = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className="-mx-6 flex items-start justify-between gap-x-4 border-b border-gray-200 px-6 pb-4 dark:border-gray-900"
        {...props}
      >
        <div className={className ?? 'mt-1 flex flex-col gap-y-1'}>{children}</div>
        <DrawerPrimitives.Close asChild>
          <Button
            variant="ghost"
            className="aspect-square p-1 text-gray-500 hover:bg-gray-100 hover:dark:bg-gray-400/10"
          >
            <X className="size-5" aria-hidden="true" />
            <span className="sr-only">Close</span>
          </Button>
        </DrawerPrimitives.Close>
      </div>
    );
  },
);

DrawerHeader.displayName = 'Drawer.Header';

const DrawerTitle = React.forwardRef<
  React.ComponentRef<typeof DrawerPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitives.Title>
>(({ className, ...props }, forwardedRef) => (
  <DrawerPrimitives.Title
    ref={forwardedRef}
    className={clsx(
      // base
      'text-base font-semibold',
      // text color
      'text-gray-900 dark:text-gray-50',
      className,
    )}
    {...props}
  />
));

DrawerTitle.displayName = 'DrawerTitle';

const DrawerBody = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={clsx('flex-1 py-4', className)} {...props} />;
  },
);

DrawerBody.displayName = 'Drawer.Body';

const DrawerDescription = React.forwardRef<
  React.ComponentRef<typeof DrawerPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitives.Description>
>(({ className, ...props }, forwardedRef) => {
  return (
    <DrawerPrimitives.Description
      ref={forwardedRef}
      className={clsx('text-gray-500 dark:text-gray-500', className)}
      {...props}
    />
  );
});

DrawerDescription.displayName = 'DrawerDescription';

const DrawerFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={clsx(
        'flex flex-col-reverse border-t border-gray-200 pt-4 sm:flex-row sm:justify-end sm:space-x-2 dark:border-gray-900',
        className,
      )}
      {...props}
    />
  );
};

DrawerFooter.displayName = 'DrawerFooter';

export {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
};

import { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        outline: 'border border-input bg-background text-primary shadow-xs hover:bg-accent hover:text-accent-foreground aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground',
        ghost: 'text-primary hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline underline-offset-4',
      },
    },
    defaultVariants: { variant: 'outline' },
  },
);

export const Button = forwardRef(function Button({
  className, variant = 'outline', asChild = false, type = 'button', ...props
}, ref) {
  const Component = asChild ? Slot : 'button';
  return (
    <Component ref={ref} data-slot="button" className={cn(buttonVariants({ variant }), className)}
      {...(!asChild && { type })} {...props} />
  );
});

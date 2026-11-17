import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '../../lib/utils';

export function Progress({ className, value = 0, max = 100, ...props }) {
  return (
    <ProgressPrimitive.Root data-slot="progress" value={value} max={max}
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-primary/20', className)} {...props}>
      <ProgressPrimitive.Indicator
        className="h-full w-full bg-primary transition-transform motion-reduce:transition-none"
        style={{ transform: `translateX(-${100 - (value / max) * 100}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

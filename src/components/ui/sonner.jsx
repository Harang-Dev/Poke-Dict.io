import { Toaster as Sonner } from 'sonner';

export function Toaster() {
  return (
    <Sonner
      position="bottom-center"
      containerAriaLabel="알림"
      duration={3000}
      style={{
        '--normal-bg': 'var(--color-popover)',
        '--normal-text': 'var(--color-popover-foreground)',
        '--normal-border': 'var(--color-border)',
      }}
    />
  );
}

import { ChevronDownIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';

export default function Disclosure({ title, className, children }) {
  return (
    <Collapsible className={className}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="disclosure-trigger justify-between">
          <span>{title}</span><ChevronDownIcon aria-hidden="true" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="disclosure-content">{children}</CollapsibleContent>
    </Collapsible>
  );
}

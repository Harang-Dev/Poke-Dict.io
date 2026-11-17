import { useId, useRef, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const emptyOption = '__empty__';

export default function SelectField({ label, value, options, onChange, placeholder }) {
  const id = useId();
  const triggerRef = useRef(null);
  const wasOpenOnPress = useRef(false);
  const [open, setOpen] = useState(false);
  const selected = options.find(([key]) => key === value);
  const selectValue = selected ? (selected[0] || emptyOption) : (placeholder ? '' : (options[0]?.[0] || emptyOption));

  return (
    <div className="select-field">
      <label htmlFor={id}>{label}</label>
      <Select open={open} onOpenChange={setOpen}
        value={selectValue} onValueChange={(next) => onChange(next === emptyOption ? '' : next)}>
        <SelectTrigger id={id} ref={triggerRef} className="data-[state=open]:pointer-events-auto"
          onPointerDown={(event) => {
            wasOpenOnPress.current = open;
            if (open && event.pointerType === 'mouse') event.preventDefault();
          }}
          onClick={(event) => {
            if (!open || !wasOpenOnPress.current) return;
            event.preventDefault();
            setOpen(false);
          }}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent onPointerDownOutside={(event) => {
          // Keep the menu open until the trigger handles the click from this same gesture.
          if (triggerRef.current?.contains(event.detail.originalEvent.target)) event.preventDefault();
        }}>
          {options.map(([key, caption]) => (
            <SelectItem key={key} value={key || emptyOption}>{caption}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

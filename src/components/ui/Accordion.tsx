'use client';

import * as React from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/* shadcn/ui primitives (Radix-based) */
const Accordion = AccordionPrimitive.Root;

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn('border border-border-subtle rounded-xl bg-card overflow-hidden', className)}
    {...props}
  />
));
AccordionItem.displayName = 'AccordionItem';

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        'flex flex-1 items-center justify-between px-5 py-4 text-left font-bold text-sm text-foreground transition-all hover:bg-muted/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring [&[data-state=open]>svg]:rotate-180',
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 text-secondary-foreground transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = 'AccordionTrigger';

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn('px-5 pb-4 text-xs text-secondary-foreground leading-relaxed border-t border-border-subtle/50 pt-3', className)}>
      {children}
    </div>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = 'AccordionContent';

/* Legacy item-based accordion (kept for backward compatibility) */
export interface AccordionItemData {
  id: string;
  title: string;
  content: React.ReactNode;
}

export interface SimpleAccordionProps {
  items: AccordionItemData[];
  allowMultiple?: boolean;
}

export const SimpleAccordion: React.FC<SimpleAccordionProps> = ({
  items,
  allowMultiple = false,
}) => {
  const [openIds, setOpenIds] = React.useState<string[]>([]);

  const handleToggle = (id: string) => {
    if (allowMultiple) {
      setOpenIds((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      );
    } else {
      setOpenIds((prev) => (prev.includes(id) ? [] : [id]));
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => {
        const isOpen = openIds.includes(item.id);
        return (
          <div
            key={item.id}
            className="border border-border-subtle rounded-xl bg-card overflow-hidden transition-all duration-200"
          >
            <button
              onClick={() => handleToggle(item.id)}
              className="w-full px-5 py-4 text-left font-bold text-sm text-foreground flex items-center justify-between hover:bg-muted/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span>{item.title}</span>
              <ChevronDown
                className={cn(
                  'w-4 h-4 text-secondary-foreground shrink-0 transition-transform duration-200',
                  isOpen && 'rotate-180'
                )}
              />
            </button>
            {isOpen && (
              <div className="px-5 pb-4 text-xs text-secondary-foreground leading-relaxed border-t border-border-subtle/50 pt-3 bg-card">
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/* `Accordion` is the Radix root for shadcn-style usage; the legacy
   item-based variant remains available as `SimpleAccordion`. */
export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
export default Accordion;
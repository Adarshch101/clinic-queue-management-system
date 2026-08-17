'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
}

export const Accordion: React.FC<AccordionProps> = ({
  items,
  allowMultiple = false,
}) => {
  const [openIds, setOpenIds] = useState<string[]>([]);

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
            className="border border-border-subtle rounded-xl bg-bg-surface overflow-hidden transition-all duration-200"
          >
            <button
              onClick={() => handleToggle(item.id)}
              className="w-full px-5 py-4 text-left font-bold text-sm text-text-primary flex items-center justify-between hover:bg-bg-muted/30 focus:outline-none"
            >
              <span>{item.title}</span>
              <motion.span
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-text-secondary shrink-0"
              >
                <ChevronDown className="w-4 h-4" />
              </motion.span>
            </button>
            
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                >
                  <div className="px-5 pb-4 text-xs text-text-secondary leading-relaxed border-t border-border-subtle/50 pt-3 bg-bg-surface">
                    {item.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};
export default Accordion;

'use client';

import React from 'react';
import { motion } from 'framer-motion';

export interface TabOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface TabsProps {
  options: TabOption[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  options,
  activeId,
  onChange,
  className = '',
}) => {
  return (
    <div className={`flex border-b border-border-subtle overflow-x-auto whitespace-nowrap scrollbar-none ${className}`}>
      {options.map((tab) => {
        const isActive = activeId === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`px-5 py-3 text-xs font-bold border-b-2 relative flex items-center gap-2 transition focus:outline-none ${
              isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text-secondary'
            }`}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            {tab.label}
            {isActive && (
              <motion.div
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};
export default Tabs;

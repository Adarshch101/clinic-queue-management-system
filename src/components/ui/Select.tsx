'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { inputBaseClass } from './Input';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, className = '', id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
          >
            {label}
          </label>
        )}
        <div className="relative w-full">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={error ? true : undefined}
            className={cn(
              inputBaseClass,
              'appearance-none pr-9 cursor-pointer',
              error && 'border-danger focus:border-danger focus:ring-danger-muted',
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 shrink-0 pointer-events-none" />
        </div>
        {error ? (
          <span className="text-[10px] font-semibold text-destructive flex items-center gap-1" role="alert">
            ⚠️ {error}
          </span>
        ) : helperText ? (
          <span className="text-[10px] text-muted-foreground">{helperText}</span>
        ) : null}
      </div>
    );
  }
);
Select.displayName = 'Select';

export default Select;
'use client';

import React, { forwardRef } from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, className = '', ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`w-full px-3.5 py-2.5 rounded-xl border border-border-subtle bg-bg-surface text-text-primary text-sm transition-all focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-primary-glow disabled:opacity-50 disabled:bg-bg-muted ${
            error ? 'border-danger focus:border-danger focus:ring-danger-muted' : ''
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error ? (
          <span className="text-[10px] font-semibold text-danger flex items-center gap-1">
            ⚠️ {error}
          </span>
        ) : helperText ? (
          <span className="text-[10px] text-text-muted">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;

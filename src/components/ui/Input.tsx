'use client';

import React, { forwardRef } from 'react';
import { Search } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  isSearch?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, isSearch, className = '', ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted">
            {label}
          </label>
        )}
        <div className="relative w-full">
          {isSearch && (
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 shrink-0 pointer-events-none" />
          )}
          <input
            ref={ref}
            className={`w-full px-3.5 py-2.5 rounded-xl border border-border-subtle bg-bg-surface text-text-primary placeholder:text-text-muted text-sm transition-all focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-primary-glow disabled:opacity-50 disabled:bg-bg-muted ${
              isSearch ? 'pl-9' : ''
            } ${error ? 'border-danger focus:border-danger focus:ring-danger-muted' : ''} ${className}`}
            {...props}
          />
        </div>
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

Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`w-full px-3.5 py-2.5 rounded-xl border border-border-subtle bg-bg-surface text-text-primary placeholder:text-text-muted text-sm transition-all focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-primary-glow disabled:opacity-50 disabled:bg-bg-muted ${
            error ? 'border-danger focus:border-danger focus:ring-danger-muted' : ''
          } ${className}`}
          {...props}
        />
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

Textarea.displayName = 'Textarea';
export default Input;

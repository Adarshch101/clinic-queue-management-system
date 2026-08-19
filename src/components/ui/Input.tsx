'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export const inputBaseClass =
  'flex w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-all focus-visible:outline-none focus-visible:border-border-focus focus-visible:ring-2 focus-visible:ring-primary-glow disabled:opacity-50 disabled:bg-muted aria-invalid:border-destructive aria-invalid:ring-destructive/20';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  isSearch?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, isSearch, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
          >
            {label}
          </label>
        )}
        <div className="relative w-full">
          {isSearch && (
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 shrink-0 pointer-events-none" />
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={error ? true : undefined}
            className={cn(
              inputBaseClass,
              isSearch && 'pl-9',
              error && 'border-danger focus:border-danger focus:ring-danger-muted',
              className
            )}
            {...props}
          />
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
Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={error ? true : undefined}
          className={cn(
            inputBaseClass,
            'min-h-[80px]',
            error && 'border-danger focus:border-danger focus:ring-danger-muted',
            className
          )}
          {...props}
        />
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
Textarea.displayName = 'Textarea';

export default Input;
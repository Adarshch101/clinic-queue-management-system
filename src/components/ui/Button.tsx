'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base active:scale-95 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer',
  {
    variants: {
      variant: {
        primary:
          'bg-primary hover:bg-primary-hover text-white focus-visible:ring-primary shadow-sm hover:shadow shadow-primary/20',
        secondary:
          'bg-bg-muted hover:bg-border-subtle text-text-primary focus-visible:ring-border-subtle border border-border-subtle',
        outline:
          'bg-transparent hover:bg-bg-muted text-text-primary border border-border-subtle focus-visible:ring-border-subtle',
        ghost:
          'bg-transparent hover:bg-bg-muted text-text-secondary hover:text-text-primary focus-visible:ring-border-subtle',
        danger:
          'bg-danger hover:bg-red-600 text-white focus-visible:ring-danger shadow-sm shadow-danger/10',
        success:
          'bg-success hover:bg-emerald-600 text-white focus-visible:ring-success shadow-sm shadow-success/10',
      },
      size: {
        sm: 'px-3.5 py-2 text-xs gap-1.5 min-h-[36px]',
        md: 'px-4 py-2.5 text-sm gap-2 min-h-[42px]',
        lg: 'px-6 py-3 text-base gap-2.5 min-h-[48px]',
      },
    },
    defaultVariants: {
      variant: 'secondary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends HTMLMotionProps<'button'>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  asChild?: boolean;
  children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant, size, isLoading = false, asChild, className = '', disabled, ...props }, ref) => {
    const classes = cn(buttonVariants({ variant, size }), className);

    const content = (
      <>
        {isLoading ? (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : null}
        {children}
      </>
    );

    if (asChild) {
      return (
        <Slot
          ref={ref}
          className={classes}
          data-disabled={disabled || isLoading || undefined}
          {...(props as React.HTMLAttributes<HTMLElement>)}
        >
          {content}
        </Slot>
      );
    }

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.97 }}
        disabled={disabled || isLoading}
        className={classes}
        {...props}
      >
        {content}
      </motion.button>
    );
  }
);
Button.displayName = 'Button';

export default Button;
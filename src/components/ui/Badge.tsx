'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center justify-center font-bold rounded-full uppercase tracking-wider text-center shrink-0 select-none',
  {
    variants: {
      variant: {
        primary: 'bg-primary-glow text-primary border border-primary/20',
        secondary: 'bg-muted text-secondary-foreground border border-border-subtle',
        success: 'bg-success-muted text-success border border-success/20',
        warning: 'bg-warning-muted text-warning border border-warning/20',
        danger: 'bg-danger-muted text-danger border border-danger/20',
        info: 'bg-info-muted text-info border border-info/20',
        outline: 'bg-transparent text-foreground border border-border-subtle',
      },
      size: {
        sm: 'px-1.5 py-0.5 text-[9px]',
        md: 'px-2.5 py-1 text-[10px]',
      },
    },
    defaultVariants: {
      variant: 'secondary',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant,
  size,
  className = '',
  ...props
}) => {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {children}
    </span>
  );
};

export { badgeVariants };
export default Badge;
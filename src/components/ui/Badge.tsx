'use client';

import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  className = '',
  ...props
}) => {
  const baseClass =
    'inline-flex items-center justify-center font-bold rounded-full uppercase tracking-wider text-center shrink-0 select-none';
  
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[9px]',
    md: 'px-2.5 py-1 text-[10px]',
  };

  const variantClasses = {
    primary: 'bg-primary-glow text-primary border border-primary/20',
    secondary: 'bg-bg-muted text-text-secondary border border-border-subtle',
    success: 'bg-success-muted text-success border border-success/20',
    warning: 'bg-warning-muted text-warning border border-warning/20',
    danger: 'bg-danger-muted text-danger border border-danger/20',
    info: 'bg-info-muted text-info border border-info/20',
  };

  return (
    <span
      className={`${baseClass} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
export default Badge;

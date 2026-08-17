'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface CardProps extends HTMLMotionProps<'div'> {
  hoverable?: boolean;
  glass?: boolean;
  children?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverable = false,
  glass = false,
  className = '',
  ...props
}) => {
  const baseClass = glass
    ? 'glass-panel p-6'
    : 'bg-bg-surface border border-border-subtle shadow-sm rounded-2xl p-6 transition-all duration-300';
  const hoverClass = hoverable
    ? glass
      ? 'glass-panel-hover hover:-translate-y-1'
      : 'hover:-translate-y-1 hover:shadow-md hover:border-primary/20'
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`${baseClass} ${hoverClass} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export interface StatsCardProps {
  label: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  change,
  isPositive = true,
  icon,
  className = '',
}) => {
  return (
    <Card className={`flex items-center justify-between gap-4 ${className}`}>
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
          {label}
        </span>
        <span className="text-2xl font-extrabold text-text-primary tracking-tight mt-0.5">
          {value}
        </span>
        {change && (
          <span
            className={`text-[10px] font-bold mt-1.5 flex items-center gap-0.5 ${
              isPositive ? 'text-success' : 'text-danger'
            }`}
          >
            {isPositive ? '↑' : '↓'} {change}
          </span>
        )}
      </div>
      {icon && (
        <div className="p-3 bg-primary-glow text-primary rounded-xl shadow-sm border border-primary/10 shrink-0">
          {icon}
        </div>
      )}
    </Card>
  );
};
export default Card;

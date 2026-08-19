'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'rect' | 'circle';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rect',
  width,
  height,
  className = '',
  style,
  ...props
}) => {
  const shapeClass =
    variant === 'circle'
      ? 'rounded-full'
      : variant === 'text'
      ? 'rounded-md h-4'
      : 'rounded-xl';

  return (
    <div
      className={cn(
        'animate-pulse bg-muted border border-border-subtle/50 relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-foreground/5 before:to-transparent',
        shapeClass,
        className
      )}
      style={{
        width: width,
        height: height,
        ...style,
      }}
      {...props}
    />
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-card border border-border-subtle shadow-sm rounded-2xl p-6 flex flex-col gap-4">
      <Skeleton variant="circle" width={48} height={48} />
      <div className="flex flex-col gap-2">
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="90%" />
      </div>
    </div>
  );
};

export const TableSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col gap-3.5">
      <Skeleton variant="rect" height={40} className="w-full" />
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex gap-4 items-center">
          <Skeleton variant="circle" width={32} height={32} />
          <Skeleton variant="text" className="flex-1" />
          <Skeleton variant="text" width="20%" />
        </div>
      ))}
    </div>
  );
};

export default Skeleton;
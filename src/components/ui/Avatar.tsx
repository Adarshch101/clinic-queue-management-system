'use client';

import React from 'react';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  className = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
  };

  const initials = name
    .split(' ')
    .map((n) => n.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

  return (
    <div
      className={`rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-tr from-primary to-indigo-400 text-white font-bold shadow-sm shrink-0 select-none ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Remove src if image fails to load to trigger fallback initials
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
};
export default Avatar;

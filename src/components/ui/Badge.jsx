import React from 'react';
import { twMerge } from 'tailwind-merge';

const Badge = ({
  className,
  variant = 'default',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';
  
  const variants = {
    default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
    secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
    outline: 'text-foreground border-border bg-transparent',
    success: 'border-transparent bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    warning: 'border-transparent bg-amber-500/10 text-amber-400 border border-amber-500/20',
    danger: 'border-transparent bg-red-500/10 text-red-400 border border-red-500/20',
    info: 'border-transparent bg-blue-500/10 text-blue-400 border border-blue-500/20',
    purple: 'border-transparent bg-purple-500/10 text-purple-400 border border-purple-500/20',
  };

  return (
    <div
      className={twMerge(baseStyles, variants[variant], className)}
      {...props}
    />
  );
};

export default Badge;

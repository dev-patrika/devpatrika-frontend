import React from 'react';
import { twMerge } from 'tailwind-merge';

const Button = React.forwardRef(({
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  disabled,
  type = 'button',
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]';
  
  const variants = {
    primary: 'bg-primary text-primary-foreground hover:bg-emerald-600 shadow-sm shadow-emerald-500/10',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-indigo-700 shadow-sm shadow-indigo-500/10',
    outline: 'border border-border bg-transparent hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    accent: 'bg-accent text-accent-foreground hover:bg-zinc-800',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-red-600',
    link: 'text-primary underline-offset-4 hover:underline bg-transparent',
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-9 px-4 text-sm',
    lg: 'h-10 px-8 text-base',
    icon: 'h-9 w-9 p-0',
  };

  return (
    <button
      type={type}
      className={twMerge(baseStyles, variants[variant], sizes[size], className)}
      ref={ref}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {children}
        </>
      ) : children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;

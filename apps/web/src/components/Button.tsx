import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { clsx } from '../utils/clsx';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  children: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accent/90 focus-visible:ring-accent',
  secondary: 'bg-transparent text-gray-600 border-2 border-gray-300 hover:bg-gray-50 focus-visible:ring-gray-400',
  danger: 'bg-danger text-white hover:bg-danger/90 focus-visible:ring-danger',
  ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 focus-visible:ring-gray-400',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm min-h-touch',
  md: 'px-5 py-3 text-base min-h-touch',
  lg: 'px-6 py-4 text-lg min-h-touch-lg',
};

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={clsx(
        'inline-flex items-center justify-center',
        'font-bold rounded-btn',
        'transition-transform active:scale-[0.98]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className,
      )}
    >
      {children}
    </button>
  );
}

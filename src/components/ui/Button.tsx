import { forwardRef } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'whatsapp';
  size?: 'default' | 'sm' | 'lg';
  asChild?: boolean;
}

const variantStyles = {
  primary: 'bg-[#5CE0D2] text-white hover:bg-[#4BCEC0]',
  secondary: 'bg-transparent text-[#1A2F3F] border-2 border-[#1A2F3F] hover:bg-[#1A2F3F]/10',
  ghost: 'bg-transparent text-[#5CE0D2] hover:bg-[#5CE0D2]/10',
  whatsapp: 'bg-[#25D366] text-white hover:bg-[#1EBE57]',
};

const sizeStyles = {
  default: 'h-12 md:h-11 px-6',
  sm: 'h-9 px-4 text-sm',
  lg: 'h-14 px-8 text-lg',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'default', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center rounded-lg font-semibold text-base transition-all duration-150 min-w-[48px] min-h-[48px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5CE0D2] disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;

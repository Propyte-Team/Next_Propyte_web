import Link from 'next/link';

interface LogoProps {
  variant?: 'full' | 'compact' | 'icon';
  className?: string;
}

export default function Logo({ variant = 'full', className = '' }: LogoProps) {
  if (variant === 'icon') {
    return (
      <Link href="/" className={className}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="6" fill="#1A2F3F"/>
          <text x="8" y="23" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="20" fill="white">P</text>
        </svg>
      </Link>
    );
  }

  return (
    <Link href="/" className={`flex flex-col ${className}`}>
      <div className="flex items-baseline">
        <span className="text-xl font-bold tracking-tight" style={{ color: '#1A2F3F' }}>PROP</span>
        <span className="text-xl font-bold tracking-tight" style={{ color: '#5CE0D2' }}>YTE</span>
      </div>
      {variant === 'full' && (
        <span className="text-[9px] text-gray-500 tracking-wider -mt-1">Property + Byte</span>
      )}
    </Link>
  );
}

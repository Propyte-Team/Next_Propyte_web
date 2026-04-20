import Image from 'next/image';
import Link from 'next/link';

type Variant = 'dark' | 'teal' | 'white' | 'icon';

interface LogoProps {
  variant?: Variant;
  className?: string;
  priority?: boolean;
  href?: string;
}

const SRC: Record<Variant, string> = {
  dark: '/img/logos/logo-horizontal-dark.png',
  teal: '/img/logos/logo-horizontal-teal.png',
  white: '/img/logos/logo-horizontal-white.png',
  icon: '/img/logos/logo-icon-white.png',
};

const DIMENSIONS: Record<Variant, { width: number; height: number }> = {
  dark: { width: 2420, height: 452 },
  teal: { width: 2420, height: 452 },
  white: { width: 2420, height: 452 },
  icon: { width: 650, height: 650 },
};

export default function Logo({
  variant = 'dark',
  className = '',
  priority = false,
  href = '/',
}: LogoProps) {
  const { width, height } = DIMENSIONS[variant];
  const isIcon = variant === 'icon';

  return (
    <Link href={href} className={`inline-flex items-center ${className}`} aria-label="Propyte">
      <Image
        src={SRC[variant]}
        alt="Propyte"
        width={width}
        height={height}
        priority={priority}
        className={isIcon ? 'h-9 w-9 object-contain' : 'h-8 md:h-9 w-auto object-contain'}
      />
    </Link>
  );
}

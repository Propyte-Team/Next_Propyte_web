import { useTranslations } from 'next-intl';
import { AlertTriangle } from 'lucide-react';

interface InvestmentDisclaimerProps {
  variant: 'subtle' | 'prominent';
  customText?: string;
  translationKey?: 'default' | 'marketData';
}

export default function InvestmentDisclaimer({
  variant,
  customText,
  translationKey = 'default',
}: InvestmentDisclaimerProps) {
  const t = useTranslations('investmentDisclaimer');
  const text = customText || t(translationKey);

  if (variant === 'subtle') {
    return (
      <p className="text-xs text-gray-400 mt-4 leading-relaxed">
        {text}
      </p>
    );
  }

  return (
    <div className="mt-6 p-4 border border-amber-300/30 bg-amber-50/50 rounded-lg flex items-start gap-3">
      <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
      <p className="text-xs text-gray-600 leading-relaxed">
        {text}
      </p>
    </div>
  );
}

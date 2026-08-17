'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Copy } from '@/lib/icons';

export default function CopyEmailButton({ email, className }: { email: string; className?: string }) {
  const t = useTranslations('common');

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(email);
      toast.success(t('emailCopied'));
    } catch {
      toast.error(t('copyFailed'));
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={t('copyEmail')}
      className={
        className ??
        'inline-flex items-center gap-1 text-xs underline underline-offset-2 opacity-70 hover:opacity-100 transition-opacity'
      }
    >
      <Copy size={12} />
      {t('copyEmail')}
    </button>
  );
}

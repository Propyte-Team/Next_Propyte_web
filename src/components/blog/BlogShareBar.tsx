'use client';

import { useState } from 'react';
import { Link2, Check, MessageCircle } from '@/lib/icons';

interface BlogShareBarProps {
  title: string;
  url: string;
  shareLabel: string;
  copyLabel: string;
  copiedLabel: string;
  whatsappLabel: string;
}

export default function BlogShareBar({ title, url, shareLabel, copyLabel, copiedLabel, whatsappLabel }: BlogShareBarProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API not available
    }
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`;

  return (
    <div className="mt-6 flex items-center gap-3">
      <span className="text-sm text-gray-600">{shareLabel}</span>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 rounded-full bg-[#25D366] text-[#0F1923] hover:opacity-80 transition-opacity"
        aria-label={whatsappLabel}
      >
        <MessageCircle size={16} />
      </a>
      <button
        type="button"
        onClick={handleCopy}
        className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
        aria-label={copied ? copiedLabel : copyLabel}
      >
        {copied ? <Check size={16} className="text-green-500" /> : <Link2 size={16} />}
      </button>
    </div>
  );
}

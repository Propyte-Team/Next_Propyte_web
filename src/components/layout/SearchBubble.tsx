'use client';

import { useState, useRef, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Key, ChevronDown } from 'lucide-react';
import { PiBuilding, PiSearch } from '@/components/icons/PropyteIcons';
import { useSearchType } from '@/context/SearchContext';

interface SearchBubbleProps {
  variant?: 'desktop' | 'mobile';
  dark?: boolean;
  className?: string;
}

export default function SearchBubble({
  variant = 'desktop',
  dark = false,
  className = '',
}: SearchBubbleProps) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations('nav');
  const { type, setType } = useSearchType();

  const [query, setQuery] = useState('');
  const [typeOpen, setTypeOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setTypeOpen(false);
      }
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const path = type === 'propiedades' ? 'propiedades' : 'desarrollos';
    const url = query
      ? `/${locale}/${path}?search=${encodeURIComponent(query)}`
      : `/${locale}/${path}`;
    router.push(url);
  }

  const isMobile = variant === 'mobile';
  const heightCls = isMobile ? 'h-[48px]' : 'h-[52px]';
  const toggleHeightCls = isMobile ? 'h-11' : 'h-10';
  const btnSizeCls = isMobile ? 'w-11 h-11' : 'w-10 h-10';
  const textSizeCls = isMobile ? 'text-xs' : 'text-sm';
  const typeLabel = type === 'propiedades' ? t('searchTypeUnit') : t('searchTypeDev');
  const placeholder = type === 'propiedades' ? t('searchPlaceholderUnit') : t('searchPlaceholderDev');

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className={`propyte-search-bubble ${dark ? 'propyte-search-bubble--dark' : ''} flex items-center ${heightCls} rounded-full pl-1.5 pr-1.5 gap-0 ${className}`}
    >
      {/* Type selector */}
      <div ref={dropdownRef} className="relative shrink-0">
        <button
          type="button"
          onClick={() => setTypeOpen((v) => !v)}
          aria-expanded={typeOpen}
          aria-haspopup="listbox"
          aria-controls={`sb-type-panel-${variant}`}
          className={`search-type-toggle flex items-center gap-1.5 ${toggleHeightCls} ${isMobile ? 'pl-3 pr-2' : 'pl-4 pr-3'} rounded-full ${textSizeCls} font-semibold whitespace-nowrap transition-colors`}
        >
          <span>{typeLabel}</span>
          <ChevronDown
            size={isMobile ? 12 : 14}
            className={`transition-transform ${typeOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {typeOpen && (
          <div
            id={`sb-type-panel-${variant}`}
            role="listbox"
            className={`absolute left-0 top-full mt-2 ${isMobile ? 'w-44' : 'w-48'} bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50`}
          >
            <button
              type="button"
              role="option"
              aria-selected={type === 'desarrollos'}
              onClick={() => {
                setType('desarrollos');
                setTypeOpen(false);
              }}
              className="search-type-option flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-left text-[#2C2C2C] hover:bg-gray-50 transition-colors"
            >
              <PiBuilding size={16} className="shrink-0" />
              {t('searchTypeDev')}
            </button>
            <button
              type="button"
              role="option"
              aria-selected={type === 'propiedades'}
              onClick={() => {
                setType('propiedades');
                setTypeOpen(false);
              }}
              className="search-type-option flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-left text-[#2C2C2C] hover:bg-gray-50 transition-colors"
            >
              <Key size={16} strokeWidth={1.75} className="shrink-0" />
              {t('searchTypeUnit')}
            </button>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className={`search-bubble-divider w-px ${isMobile ? 'h-5' : 'h-6'} mx-1 shrink-0`} />

      {/* Input */}
      <div className="flex-1 flex items-center min-w-0 px-2">
        <label htmlFor={`search-input-${variant}`} className="sr-only">
          {t('search')}
        </label>
        <input
          id={`search-input-${variant}`}
          type="text"
          name="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full h-full bg-transparent ${textSizeCls} ${dark ? 'text-white placeholder:text-white/70' : 'text-gray-700 placeholder:text-gray-600'} focus:outline-none min-w-0`}
        />
      </div>

      {/* Search button */}
      <button
        type="submit"
        aria-label={t('search')}
        className={`search-bubble-btn flex items-center justify-center ${btnSizeCls} rounded-full bg-[#A2F9FF] hover:bg-[#7DEAF2] text-[#0F1923] shrink-0 transition-all hover:scale-105`}
      >
        <PiSearch size={isMobile ? 16 : 18} />
      </button>
    </form>
  );
}

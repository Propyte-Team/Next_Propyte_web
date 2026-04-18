'use client';

import { X } from 'lucide-react';

interface FilterChipProps {
  label: string;
  onRemove: () => void;
}

export default function FilterChip({ label, onRemove }: FilterChipProps) {
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#5CE0D2]/10 text-[#5CE0D2] text-sm font-medium rounded-full">
      {label}
      <button
        onClick={onRemove}
        className="ml-0.5 p-0.5 hover:bg-[#5CE0D2]/20 rounded-full transition-colors min-w-[24px] min-h-[24px] flex items-center justify-center"
        aria-label={`Remove ${label}`}
      >
        <X size={14} />
      </button>
    </span>
  );
}

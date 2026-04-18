export function formatPrice(amount: number, currency: string = 'MXN'): string {
  const formatted = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return `${formatted} ${currency}`;
}

export function formatPriceShort(amount: number, currency: string = 'MXN'): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M ${currency}`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K ${currency}`;
  }
  return `$${amount} ${currency}`;
}

export function formatArea(area: number): string {
  return `${area.toLocaleString('es-MX')} m²`;
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString('es-MX');
}

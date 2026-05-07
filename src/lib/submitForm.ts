import { getCapturedUTMs } from '@/hooks/useUTMCapture';
import { trackGenerateLead } from '@/lib/analytics/track';

export async function submitForm(data: Record<string, unknown>, formType: string) {
  const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('WEBHOOK_URL not configured');
    return { success: false, error: 'Webhook not configured' };
  }

  // Surface attribution captured at landing time so the CRM/Hub gets the
  // original campaign source even if the visitor submits the form pages later.
  const utms = getCapturedUTMs();

  const payload = {
    ...utms,
    ...data, // form data wins over auto-captured UTMs if there's a collision
    formType,
    source: 'propyte-web',
    timestamp: new Date().toISOString(),
    page: typeof window !== 'undefined' ? window.location.href : '',
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (response.ok) {
      const propertyId = typeof data.propertyId === 'string' ? data.propertyId : undefined;
      trackGenerateLead({ formType, propertyId });
    }
    return { success: response.ok };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function submitForm(data: Record<string, unknown>, formType: string) {
  const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('WEBHOOK_URL not configured');
    return { success: false, error: 'Webhook not configured' };
  }

  const payload = {
    ...data,
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
    return { success: response.ok };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

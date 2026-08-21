export default function supabaseImageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  if (src.includes('.supabase.co/storage/v1/object/public/')) {
    const renderUrl = src.replace('/object/public/', '/render/image/public/');
    const params = new URLSearchParams({
      width: String(width),
      quality: String(quality ?? 75),
      resize: 'cover',
    });
    return `${renderUrl}?${params}`;
  }
  // Host externo (no-Supabase): cae al optimizer interno de Next (sharp), igual que hoy.
  const params = new URLSearchParams({ url: src, w: String(width), q: String(quality ?? 75) });
  return `/_next/image?${params}`;
}

import { describe, expect, it } from 'vitest';
import { isExternalVideo, toEmbedUrl } from './embed';

const EMBED = 'https://www.youtube.com/embed/SOqtyv8h2M0';

describe('toEmbedUrl', () => {
  it('convierte el link para compartir de YouTube — la forma que rompía el hero de /unete', () => {
    // El slot `unete.video` tenía exactamente esta URL y el iframe salía en blanco.
    expect(toEmbedUrl('https://youtu.be/SOqtyv8h2M0?si=GZfkVTFhI93PH7k6')).toBe(EMBED);
  });

  it('convierte watch?v= aunque `v` no sea el primer parámetro', () => {
    expect(toEmbedUrl('https://www.youtube.com/watch?v=SOqtyv8h2M0')).toBe(EMBED);
    expect(toEmbedUrl('https://www.youtube.com/watch?app=desktop&v=SOqtyv8h2M0&t=30')).toBe(EMBED);
  });

  it('convierte shorts y live', () => {
    expect(toEmbedUrl('https://www.youtube.com/shorts/SOqtyv8h2M0')).toBe(EMBED);
    expect(toEmbedUrl('https://www.youtube.com/live/SOqtyv8h2M0')).toBe(EMBED);
  });

  it('deja intacta una URL que ya es embebible', () => {
    expect(toEmbedUrl(EMBED)).toBe(EMBED);
    expect(toEmbedUrl('https://player.vimeo.com/video/123456')).toBe('https://player.vimeo.com/video/123456');
  });

  it('convierte Vimeo y Google Drive', () => {
    expect(toEmbedUrl('https://vimeo.com/123456')).toBe('https://player.vimeo.com/video/123456');
    expect(toEmbedUrl('https://drive.google.com/file/d/abc-123_XY/view?usp=sharing')).toBe(
      'https://drive.google.com/file/d/abc-123_XY/preview'
    );
  });

  it('devuelve intacto un archivo propio — se sirve con <video>, no con iframe', () => {
    const mp4 = 'https://oaijxdpevakashxshhvm.supabase.co/storage/v1/object/public/site-media/x/clip.mp4';
    expect(toEmbedUrl(mp4)).toBe(mp4);
    expect(isExternalVideo(mp4)).toBe(false);
  });
});

describe('isExternalVideo', () => {
  it('reconoce los proveedores que se embeben por iframe', () => {
    expect(isExternalVideo('https://youtu.be/SOqtyv8h2M0')).toBe(true);
    expect(isExternalVideo('https://vimeo.com/123456')).toBe(true);
    expect(isExternalVideo('https://drive.google.com/file/d/abc/view')).toBe(true);
  });
});

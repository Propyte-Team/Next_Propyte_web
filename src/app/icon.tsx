import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0F1923',
          borderRadius: 6,
          fontFamily: 'system-ui, sans-serif',
          fontWeight: 900,
          fontSize: 22,
          color: '#5CE0D2',
          letterSpacing: -1,
        }}
      >
        P
      </div>
    ),
    size,
  );
}

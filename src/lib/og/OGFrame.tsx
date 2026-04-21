export interface OGFrameProps {
  title: string;
  location?: string;
  price?: string;
  badge?: string;
  imageUrl?: string;
}

export default function OGFrame({ title, location, price, badge, imageUrl }: OGFrameProps) {
  const titleSize = title.length > 50 ? 34 : title.length > 35 ? 40 : title.length > 20 ? 46 : 54;

  return (
    <div
      style={{
        display: 'flex',
        width: '1200px',
        height: '630px',
        background: '#1A2F3F',
        fontFamily: '"Space Grotesk"',
      }}
    >
      {/* Left content panel */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 44px',
          width: imageUrl ? '660px' : '1100px',
          flexShrink: 0,
        }}
      >
        {/* Logo row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: 36,
              height: 36,
              background: '#5CE0D2',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ color: '#1A2F3F', fontWeight: 700, fontSize: 20, lineHeight: 1 }}>P</span>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600, fontSize: 18 }}>
            propyte.com
          </span>
        </div>

        {/* Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div
            style={{
              color: 'white',
              fontWeight: 700,
              fontSize: titleSize,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </div>
          {location && (
            <div style={{ display: 'flex' }}>
              <span style={{ color: '#5CE0D2', fontWeight: 600, fontSize: 22 }}>{location}</span>
            </div>
          )}
          {(price || badge) && (
            <div style={{ display: 'flex', gap: '10px' }}>
              {price && (
                <div
                  style={{
                    display: 'flex',
                    background: 'rgba(92,224,210,0.15)',
                    borderWidth: 1,
                    borderStyle: 'solid',
                    borderColor: 'rgba(92,224,210,0.35)',
                    borderRadius: '8px',
                    padding: '6px 18px',
                  }}
                >
                  <span style={{ color: '#5CE0D2', fontWeight: 600, fontSize: 17 }}>{price}</span>
                </div>
              )}
              {badge && (
                <div
                  style={{
                    display: 'flex',
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    padding: '6px 18px',
                  }}
                >
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500, fontSize: 15 }}>
                    {badge}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer tagline */}
        <div style={{ display: 'flex' }}>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: 500 }}>
            Real Estate Intelligence — Riviera Maya & Yucatán
          </span>
        </div>
      </div>

      {/* Right: hero image */}
      {imageUrl && (
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
          {/* Gradient feather on left edge */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '120px',
              background: 'linear-gradient(to right, #1A2F3F, transparent)',
              zIndex: 1,
            }}
          />
          <img
            src={imageUrl}
            alt=""
            style={{ width: '100%', height: '630px', objectFit: 'cover' }}
          />
        </div>
      )}
    </div>
  );
}

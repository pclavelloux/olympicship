import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'TrustCode - GitHub Contributions Leaderboard';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Logo/Title */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              fontSize: '80px',
              fontWeight: 'bold',
              color: '#ffffff',
              letterSpacing: '-0.02em',
            }}
          >
            TrustCode
          </div>
        </div>

        {/* Main Title */}
        <div
          style={{
            fontSize: '64px',
            fontWeight: 'bold',
            color: '#ffffff',
            textAlign: 'center',
            marginBottom: '30px',
            lineHeight: '1.2',
          }}
        >
          GitHub Contributions
          <br />
          Leaderboard
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: '32px',
            color: '#8b949e',
            textAlign: 'center',
            maxWidth: '900px',
            lineHeight: '1.4',
          }}
        >
          Comparez vos contributions GitHub avec d'autres développeurs
        </div>

        {/* Decorative elements */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginTop: '60px',
          }}
        >
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: i === 3 ? '#238636' : i < 3 ? '#238636' : '#21262d',
                opacity: i === 3 ? 1 : i < 3 ? 0.8 - i * 0.15 : 0.3,
              }}
            />
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}


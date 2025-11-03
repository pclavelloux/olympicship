import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = {
  width: 64,
  height: 64,
};
export const contentType = 'image/png';

export default async function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '48px',
        }}
      >
        🏆
      </div>
    ),
    {
      ...size,
    }
  );
}


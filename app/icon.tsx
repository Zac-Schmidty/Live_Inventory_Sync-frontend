import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

// Image generation
export default async function Icon() {
  return new ImageResponse(
    (
      // Warehouse Icon SVG
      <div
        style={{
          fontSize: 24,
          background: '#000',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          style={{ width: '24px', height: '24px' }}
        >
          <path d="M3 21V7l9-4 9 4v14h-4v-8H7v8H3Zm2-2h2v-8h10v8h2V8.175l-7-3.11-7 3.11V19Zm6-7h2v2h-2v-2Zm-4 0h2v2H7v-2Zm8 0h2v2h-2v-2ZM7 19v-8h10v8H7Z"/>
        </svg>
      </div>
    ),
    // ImageResponse options
    {
      ...size,
    }
  )
} 
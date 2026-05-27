/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Orbitron', 'system-ui', 'sans-serif'],
      },
      colors: {
        reel: {
          bg: '#1a0838',
          strip: '#fef3d0',
          highlight: '#0f0525',
          accent: '#c9980a',
          gold: '#ffd700',
        },
      },
      keyframes: {
        shimmer: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'neon-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
      },
      animation: {
        shimmer: 'shimmer 1s ease-in-out infinite',
        'neon-pulse': 'neon-pulse 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

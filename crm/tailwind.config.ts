/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui'],
        body: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui']
      },
      colors: {
        crm: {
          ink: '#111114',
          fog: '#F4F2EE',
          accent: '#FF6B35',
          ocean: '#1A365D',
          mint: '#4FD1C5'
        }
      },
      boxShadow: {
        glow: '0 10px 30px rgba(255, 107, 53, 0.22)'
      }
    }
  },
  plugins: []
}

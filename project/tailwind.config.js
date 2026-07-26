/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef0ff',
          100: '#e0e3ff',
          200: '#c7ccff',
          300: '#a5a9ff',
          400: '#8b7fff',
          500: '#6C63FF',
          600: '#7C4DFF',
          700: '#6a3df0',
          800: '#5a30d0',
          900: '#4a25a8',
        },
        accent: {
          cyan: '#00E5FF',
          gold: '#FFD700',
          emerald: '#10B981',
          orange: '#FF8C42',
          pink: '#FF4D8D',
        },
        ink: {
          900: '#0a0a0f',
          800: '#12121a',
          700: '#1a1a26',
          600: '#242433',
          500: '#2e2e40',
          400: '#3a3a52',
          300: '#4a4a66',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        'xl2': '1.25rem',
        'xl3': '1.75rem',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'spin-slow': 'spin 8s linear infinite',
        'fire': 'fire 1.2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%,100%': { opacity: '0.6', filter: 'blur(20px)' },
          '50%': { opacity: '1', filter: 'blur(28px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fire: {
          '0%': { transform: 'scale(1) rotate(-2deg)', filter: 'brightness(1)' },
          '100%': { transform: 'scale(1.08) rotate(2deg)', filter: 'brightness(1.2)' },
        },
      },
      backgroundImage: {
        'grid': "linear-gradient(rgba(108,99,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(108,99,255,0.07) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};

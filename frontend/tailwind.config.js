/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#09090B',
        surface: '#111113',
        card: '#18181B',
        border: '#27272A',
        primary: '#2563EB',
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
      },
      boxShadow: {
        'glow-blue': '0 0 0 1px rgba(37,99,235,0.25), 0 4px 24px rgba(37,99,235,0.08)',
        'glow-blue-lg': '0 0 0 1px rgba(37,99,235,0.4), 0 8px 40px rgba(37,99,235,0.15)',
        'glow-red': '0 0 0 1px rgba(239,68,68,0.25), 0 4px 24px rgba(239,68,68,0.08)',
        'glow-red-lg': '0 0 0 1px rgba(239,68,68,0.4), 0 8px 40px rgba(239,68,68,0.15)',
        'glow-green': '0 0 0 1px rgba(34,197,94,0.25), 0 4px 24px rgba(34,197,94,0.08)',
        'glow-amber': '0 0 0 1px rgba(245,158,11,0.25), 0 4px 24px rgba(245,158,11,0.08)',
        'glass': '0 8px 32px rgba(0,0,0,0.3)',
        'glass-lg': '0 16px 48px rgba(0,0,0,0.4)',
      },
      backdropBlur: {
        'glass': '16px',
      },
      animation: {
        'live-pulse': 'live-pulse 2s ease-in-out infinite',
        'ping-slow': 'ping-slow 2s ease-out infinite',
        'blink': 'blink 1.5s ease-in-out infinite',
        'slide-in': 'slideInUp 0.3s ease-out both',
        'slide-up': 'slideInUp 0.4s ease-out both',
        'fade-in': 'fadeIn 0.4s ease-out both',
        'scale-in': 'scaleIn 0.3s ease-out both',
        'fade-in-up': 'fadeInUp 0.5s ease-out both',
        'sweep': 'sweep 3s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'gradient': 'gradient-shift 4s ease infinite',
      },
      keyframes: {
        'live-pulse': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.2)' },
        },
        'ping-slow': {
          '0%': { transform: 'scale(1)', opacity: '0.8' },
          '100%': { transform: 'scale(2.5)', opacity: '0' },
        },
        'blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        slideInUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        sweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'gradient-shift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
    },
  },
  plugins: [],
};

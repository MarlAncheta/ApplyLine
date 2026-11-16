/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#151923',
        surface: '#202735',
        'surface-2': '#283144',
        border: '#333d51',
        primary: '#B7F36B',
        'primary-dark': '#8FC94A',
        text: '#F4F5F7',
        muted: '#929AAA',
        warning: '#F2B84B',
        danger: '#E76D75',
        success: '#B7F36B',
        info: '#7DB8F5',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.2), 0 8px 24px rgba(0,0,0,0.16)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 160ms ease-out',
      },
    },
  },
  plugins: [],
}

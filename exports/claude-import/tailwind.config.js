/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Sunzi Cerebro Theme inspired by pentest-tools.com
        primary: {
          50: '#f0f7ff',
          100: '#e0edfe',
          200: '#b4d6ff',
          300: '#3e94ff',  // Main brand blue
          400: '#2a76d1',  // Secondary blue
          500: '#00327c',  // Dark blue
          600: '#00286a',
          700: '#001e52',
          800: '#001740',
          900: '#000f2e',
        },
        secondary: {
          50: '#f8faff',
          100: '#f2f5f8',
          200: '#e6ecf2',
          300: '#99adcb',  // Light blue
          400: '#bfccde',  // Border gray
          500: '#404040',  // Text gray
          600: '#353535',
          700: '#2a2a2a',
          800: '#1f1f1f',
          900: '#141414',
        },
        accent: {
          50: '#fef7f3',
          100: '#feede6',
          200: '#fdd8c7',
          300: '#fc9d5a',  // Orange accent
          400: '#ff9b26',  // Brand orange
          500: '#cc7c1e',  // Orange 600
          600: '#a66419',
          700: '#804d13',
          800: '#5a350d',
          900: '#331e08',
        },
        success: {
          50: '#f0fff4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#00ca82',  // Brand green
          500: '#00794e',  // Green 700
          600: '#065f46',
          700: '#064e3b',
          800: '#0c4a30',
          900: '#0a3527',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#fb5454',  // Brand red
          500: '#c94343',  // Red 600
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      fontSize: {
        'heading-1': ['1.5rem', { lineHeight: '2rem', fontWeight: '600' }],
        'heading-2': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        'heading-3': ['1.125rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        'heading-4': ['1rem', { lineHeight: '1.5rem', fontWeight: '600' }],
        'paragraph-regular': ['0.875rem', { lineHeight: '1.375rem', fontWeight: '400' }],
        'paragraph-medium': ['0.875rem', { lineHeight: '1.375rem', fontWeight: '500' }],
        'paragraph-semibold': ['0.875rem', { lineHeight: '1.375rem', fontWeight: '600' }],
        'caption-regular': ['0.75rem', { lineHeight: '1.125rem', fontWeight: '400' }],
        'caption-medium': ['0.75rem', { lineHeight: '1.125rem', fontWeight: '500' }],
      },
      boxShadow: {
        'tool-card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'elevated': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'deep': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
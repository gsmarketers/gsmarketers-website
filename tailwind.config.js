/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'Roboto', 'sans-serif'],
      },
      colors: {
        dark: '#121212',
        'true-black': '#000000',
        'off-black': '#0A0A0A',
        foreground: 'rgb(255 255 255)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'ripple': 'ripple var(--duration,2s) ease calc(var(--i, 0)*.2s) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        ripple: {
          '0%, 100%': {
            transform: 'translate(-50%, -50%) scale(1)',
          },
          '50%': {
            transform: 'translate(-50%, -50%) scale(0.9)',
          },
        }
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: 'rgb(255 255 255 / 0.8)',
            a: {
              color: '#22d3ee',
              '&:hover': {
                color: '#67e8f9',
              },
            },
            strong: {
              color: '#fff',
            },
            hr: {
              borderColor: 'rgb(255 255 255 / 0.2)',
            },
            blockquote: {
              borderLeftColor: '#22d3ee',
              color: 'rgb(255 255 255 / 0.7)',
            },
            h1: {
              color: '#fff',
            },
            h2: {
              color: '#fff',
            },
            h3: {
              color: '#fff',
            },
            h4: {
              color: '#fff',
            },
            code: {
              color: '#22d3ee',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            pre: {
              backgroundColor: 'rgb(255 255 255 / 0.05)',
              color: 'rgb(255 255 255 / 0.8)',
            },
          },
        },
      }
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

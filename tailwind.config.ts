import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      // fontFamily: {
      //   sans: ['soehne-buch', 'ui-sans-serif', 'system-ui'],
      //   heading: ['soehne-halbfett', 'ui-sans-serif', 'system-ui'],
      // },
      colors: {
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'bg-alt': 'var(--bg-alt)',
        'border-primary': 'var(--border-primary)',
        'border-secondary': 'var(--border-secondary)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
      },
    },
  },
  darkMode: 'class',
  plugins: [],
} satisfies Config;

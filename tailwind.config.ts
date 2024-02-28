import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'bg-alt': 'var(--bg-alt)',
        'border-primary': 'var(--border-primary)',
        'border-secondary': 'var(--border-secondary)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-notify': 'var(--color-blue-500)',
      },
    },
  },
  darkMode: 'class',
  plugins: [],
} satisfies Config;

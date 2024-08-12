import type { Config } from 'tailwindcss';

export default {
	content: ['./app/**/*.{js,jsx,ts,tsx}', './node_modules/react-tailwindcss-datepicker/dist/index.esm.js'],
	theme: {
		extend: {
			colors: {
				'bg-primary': 'var(--bg-primary)',
				'bg-secondary': 'var(--bg-secondary)',
				'bg-alt': 'var(--bg-alt)',
				'border-primary': 'var(--border-primary)',
				'border-secondary': 'var(--border-secondary)',
				'border-tertiary': 'var(--border-tertiary)',
				'border-dash': 'var(--border-dash)',
				'text-primary': 'var(--text-primary)',
				'text-secondary': 'var(--text-secondary)',
				'text-notify': 'var(--color-blue-500)',
			},
		},
	},
	darkMode: 'class',
	plugins: [],
} satisfies Config;

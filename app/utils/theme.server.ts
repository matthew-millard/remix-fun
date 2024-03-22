import { createCookieSessionStorage } from '@remix-run/node';
import { Theme } from './theme-provider';

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
	throw new Error('SESSION_SECRET must be set');
}

const themeStorage = createCookieSessionStorage({
	cookie: {
		name: 'BARFLY_pref_theme',
		secure: process.env.NODE_ENV === 'production',
		secrets: [sessionSecret],
		sameSite: 'lax',
		path: '/',
		httpOnly: true,
	},
});

// Define valid theme values
const validThemes = Object.values(Theme);

// Function to check if a value is a valid theme
function isValidTheme(value: unknown): value is Theme {
	return typeof value === 'string' && validThemes.includes(value as Theme);
}

async function getThemeSession(request: Request) {
	const session = await themeStorage.getSession(request.headers.get('Cookie'));

	return {
		getTheme: () => {
			const themeValue = session.get('theme');
			return isValidTheme(themeValue) ? themeValue : null;
		},
		setTheme: (theme: Theme) => session.set('theme', theme),
		commit: () => themeStorage.commitSession(session),
	};
}

export { getThemeSession };

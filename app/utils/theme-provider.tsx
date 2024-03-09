import { useFetcher } from '@remix-run/react';
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode, Dispatch, SetStateAction } from 'react';

enum Theme {
	DARK = 'dark',
	LIGHT = 'light',
}

type ThemeContextType = [Theme | null, Dispatch<SetStateAction<Theme | null>>];
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function ThemeProvider({ children, specifiedTheme }: { children: ReactNode; specifiedTheme: Theme | null }) {
	const [theme, setTheme] = useState<Theme | null>(specifiedTheme ?? Theme.LIGHT);
	const persistTheme = useFetcher();

	useEffect(() => {
		if (theme) {
			persistTheme.submit({ theme }, { action: 'action/set-theme', method: 'post' });
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [theme]);

	return <ThemeContext.Provider value={[theme, setTheme]}>{children}</ThemeContext.Provider>;
}

function useTheme() {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error('useTheme must be used within a ThemeProvider');
	}
	return context;
}

const themes: Array<Theme> = Object.values(Theme);

function isTheme(value: unknown): value is Theme {
	return typeof value === 'string' && themes.includes(value as Theme);
}

export { isTheme, Theme, ThemeProvider, useTheme };

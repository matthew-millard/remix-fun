import type { LoaderFunction, MetaFunction } from '@remix-run/node';
import { cssBundleHref } from '@remix-run/css-bundle';
import { LinksFunction, json } from '@remix-run/node';
import tailwindStylesheet from '~/tailwind.css';
import globalStylesheet from '~/styles/global.css';
import { ThemeProvider, Theme } from '~/utils/theme-provider';
import { getThemeSession } from './utils/theme.server';
import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from '@remix-run/react';
import { NavBar, Footer } from './components';
import clsx from 'clsx';
import { GeneralErrorBoundary } from './components/ErrorBoundary';
import React from 'react';
import { honeypot } from './utils/honeypot.server';
import { HoneypotProvider } from 'remix-utils/honeypot/react';

export type LoaderData = {
	theme: Theme | null;
	honeypotProps: ReturnType<typeof honeypot.getInputProps>;
};

export const loader: LoaderFunction = async ({ request }) => {
	const themeSession = await getThemeSession(request);

	const data: LoaderData = {
		theme: themeSession.getTheme(),
		honeypotProps: honeypot.getInputProps(),
	};

	return json(data);
};

export const links: LinksFunction = () => [
	...(cssBundleHref ? [{ rel: 'stylesheet', href: cssBundleHref }] : []),
	{ rel: 'stylesheet', href: tailwindStylesheet },
	{ rel: 'stylesheet', href: globalStylesheet },
];

function App({ children, theme }: { children: React.ReactNode; theme: Theme | null }) {
	return (
		<html lang="en" className={clsx(theme, 'h-full bg-bg-primary')}>
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body className="flex min-h-screen flex-col">
				{children}
				<ScrollRestoration />
				<Scripts />
				<LiveReload />
			</body>
		</html>
	);
}

export default function AppWithProviders() {
	const { theme, honeypotProps } = useLoaderData<LoaderData>();
	return (
		<ThemeProvider specifiedTheme={theme}>
			<HoneypotProvider {...honeypotProps}>
				<App theme={theme}>
					<NavBar />
					<main className="flex-grow">
						<Outlet />
					</main>
					<Footer />
				</App>
			</HoneypotProvider>
		</ThemeProvider>
	);
}

export const meta: MetaFunction = () => {
	return [{ title: 'BarFly' }, { name: 'description', content: 'Welcome to BarFly!' }];
};

export function ErrorBoundary() {
	return (
		<App theme={null}>
			<GeneralErrorBoundary />
		</App>
	);
}

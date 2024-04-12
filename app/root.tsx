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
import { csrf } from '~/utils/csrf.server';
import { AuthenticityTokenProvider } from 'remix-utils/csrf/react';
import { prisma } from './utils/db.server';
import { getUserId } from './utils/auth.server';

export type LoaderData = {
	theme: Theme | null;
	honeypotProps: ReturnType<typeof honeypot.getInputProps>;
	csrfToken: string;
	user: { id: string; firstName: string; lastName: string; profileImage: { id: string } } | null;
};

export const loader: LoaderFunction = async ({ request }) => {
	const themeSession = await getThemeSession(request);
	const [csrfToken, csrfCookieHeader] = await csrf.commitToken(request);
	const userId = await getUserId(request);

	// Query the database getting the users information
	const user = userId
		? await prisma.user.findUniqueOrThrow({
				where: { id: userId },
				select: { id: true, firstName: true, lastName: true, username: true, profileImage: { select: { id: true } } },
			})
		: null;

	const data: LoaderData = {
		theme: themeSession.getTheme(),
		honeypotProps: honeypot.getInputProps(),
		csrfToken,
		user,
	};

	return json(data, { headers: csrfCookieHeader ? { 'set-cookie': csrfCookieHeader } : {} });
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
			<body className="flex h-screen flex-col">
				{children}
				<ScrollRestoration />
				<Scripts />
				<LiveReload />
			</body>
		</html>
	);
}

export default function AppWithProviders() {
	const { theme, honeypotProps, csrfToken } = useLoaderData<LoaderData>();
	return (
		<ThemeProvider specifiedTheme={theme}>
			<AuthenticityTokenProvider token={csrfToken}>
				<HoneypotProvider {...honeypotProps}>
					<App theme={theme}>
						<NavBar />
						<main className="flex-grow">
							<Outlet />
						</main>
						<Footer />
					</App>
				</HoneypotProvider>
			</AuthenticityTokenProvider>
		</ThemeProvider>
	);
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	const { user } = data;
	const firstName = user ? user.firstName : null;
	return [
		{ title: 'BarFly' },
		{ name: 'description', content: firstName ? `Welcome back to BarFly ${firstName}!` : 'Welcome to BarFly!' },
	];
};

export function ErrorBoundary() {
	return (
		<App theme={null}>
			<GeneralErrorBoundary />
		</App>
	);
}

import { type LoaderFunctionArgs, type MetaFunction, type LinksFunction, json } from '@remix-run/node';
import { cssBundleHref } from '@remix-run/css-bundle';
import tailwindStylesheet from '~/tailwind.css';
import globalStylesheet from '~/styles/global.css';
import { ThemeProvider, Theme } from '~/utils/theme-provider';
import { getThemeSession } from './utils/theme.server';
import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from '@remix-run/react';
import { NavBar, Footer } from './components';
import clsx from 'clsx';
import { GeneralErrorBoundary } from './components/ErrorBoundary';
import React, { useEffect } from 'react';
import { honeypot } from './utils/honeypot.server';
import { HoneypotProvider } from 'remix-utils/honeypot/react';
import { Toaster, toast as showToast } from 'sonner';
import { csrf } from '~/utils/csrf.server';
import { AuthenticityTokenProvider } from 'remix-utils/csrf/react';
import { prisma } from './utils/db.server';
import { getUserId } from './utils/auth.server';
import { getToast, type Toast } from './utils/toast.server';
import { combineHeaders } from './utils/misc';
import { searchUsersByQuery, UsersSchema } from './utils/searchByQuery';
import { z } from 'zod';

export type LoaderData = {
	theme: Theme | null;
	honeypotProps: ReturnType<typeof honeypot.getInputProps>;
	csrfToken: string;
	user: {
		id: string;
		firstName: string;
		lastName: string;
		profileImage: { id: string };
		username: { username: string };
	} | null;
	toast: Toast | null;
};

export type ActionData = {
	searchResults: { filteredUsers: z.infer<typeof UsersSchema> } | null;
};

export async function action({ request }: LoaderFunctionArgs) {
	const formData = await request.formData();
	const query = formData.get('query') as string | null;

	let searchResults = null;
	if (query && query.trim() !== '') {
		searchResults = await searchUsersByQuery(query);
	}

	const data: ActionData = {
		searchResults,
	};

	return json({ ...data });
}

export async function loader({ request }: LoaderFunctionArgs) {
	const themeSession = await getThemeSession(request);
	const [csrfToken, csrfCookieHeader] = await csrf.commitToken(request);
	const { toast, headers: toastHeaders } = await getToast(request);
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
		toast,
		csrfToken,
		user,
	};

	return json(
		{ ...data },
		{
			headers: combineHeaders(csrfCookieHeader ? { 'set-cookie': csrfCookieHeader } : null, toastHeaders),
		},
	);
}

export function links(): ReturnType<LinksFunction> {
	return [
		{ rel: 'stylesheet', href: tailwindStylesheet },
		{ rel: 'stylesheet', href: globalStylesheet },
		...(cssBundleHref ? [{ rel: 'stylesheet', href: cssBundleHref }] : []),
	];
}

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
				<Toaster closeButton richColors expand={true} position="top-right" />
				<ScrollRestoration />
				<Scripts />
				<LiveReload />
			</body>
		</html>
	);
}

export default function AppWithProviders() {
	const { theme, honeypotProps, csrfToken, toast } = useLoaderData<LoaderData>();
	return (
		<ThemeProvider specifiedTheme={theme}>
			<AuthenticityTokenProvider token={csrfToken}>
				<HoneypotProvider {...honeypotProps}>
					<App theme={theme}>
						<NavBar />
						<main className="flex-grow">
							<Outlet />
							{toast ? <ShowToast toast={toast} /> : null}
						</main>
						<Footer />
					</App>
				</HoneypotProvider>
			</AuthenticityTokenProvider>
		</ThemeProvider>
	);
}

function ShowToast({ toast }: { toast: Toast }): null {
	const { id, type, title, description } = toast;
	useEffect(() => {
		setTimeout(() => {
			showToast[type](title, { description, id });
		}, 0);
	}, [description, id, title, type]);
	return null;
}

export function meta({ data }: Parameters<MetaFunction<typeof loader>>[0]): ReturnType<MetaFunction<typeof loader>> {
	const { user } = data;
	const firstName = user ? user.firstName : null;
	return [
		{ title: 'Barfly' },
		{ description: firstName ? `Welcome back to Barfly ${firstName}!` : 'Welcome to BarFly!' },
	];
}

export function ErrorBoundary() {
	return (
		<App theme={null}>
			<GeneralErrorBoundary />
		</App>
	);
}

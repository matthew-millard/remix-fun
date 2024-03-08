import type { LoaderFunction, MetaFunction } from '@remix-run/node';
import { cssBundleHref } from '@remix-run/css-bundle';
import { LinksFunction } from '@remix-run/node';
import tailwindStylesheet from '~/tailwind.css';
import globalStylesheet from '~/styles/global.css';
import { ThemeProvider, Theme } from '~/utils/theme-provider';
import { getThemeSession } from './utils/theme.server';
import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from '@remix-run/react';
import { NavBar } from './components';
import clsx from 'clsx';
import { GeneralErrorBoundary } from './components/ErrorBoundary';
import React from 'react';

export type LoaderData = {
  theme: Theme | null;
};

export const loader: LoaderFunction = async ({ request }) => {
  const themeSession = await getThemeSession(request);

  const data: LoaderData = {
    theme: themeSession.getTheme(),
  };

  return data;
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
      <body className="h-full">
        {children}
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

export default function AppWithProviders() {
  const data = useLoaderData<LoaderData>();
  return (
    <ThemeProvider specifiedTheme={data.theme}>
      <App theme={data.theme}>
        <NavBar />
        <main>
          <Outlet />
        </main>
      </App>
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

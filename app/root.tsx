import { cssBundleHref } from '@remix-run/css-bundle';
import type { LinksFunction, LoaderFunction, MetaFunction } from '@remix-run/node';
import { ThemeProvider, Theme } from '~/utils/theme-provider';
import { getThemeSession } from './utils/theme.server';
import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from '@remix-run/react';
import tailwindStylesheet from '~/tailwind.css';
import globalStylesheet from '~/styles/global.css';
import { NavBar } from './components';
import clsx from 'clsx';

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

export const meta: MetaFunction = () => {
  return [{ title: 'BarFly' }, { name: 'description', content: 'Welcome to BarFly!' }];
};

function App() {
  const data = useLoaderData<LoaderData>();

  return (
    <html lang="en" className={clsx(data.theme, 'h-full bg-bg-primary')}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="h-full">
        <NavBar />
        <main>
          <Outlet />
        </main>

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
      <App />
    </ThemeProvider>
  );
}

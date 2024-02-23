import { cssBundleHref } from '@remix-run/css-bundle';
import type { LinksFunction, LoaderFunction } from '@remix-run/node';
import type { Theme } from '~/utils/theme-provider';
import { getThemeSession } from './utils/theme.server';
import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from '@remix-run/react';
import stylesheet from '~/tailwind.css';
import globalStylesheet from '~/styles/global.css';
import { NavBar } from './components';
import clsx from 'clsx';
import { NonFlashOfWrongThemeEls, ThemeProvider, useTheme } from './utils/theme-provider';

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
  { rel: 'stylesheet', href: stylesheet },
  { rel: 'stylesheet', href: globalStylesheet },
];

function App() {
  const data = useLoaderData<LoaderData>();
  const [theme] = useTheme();
  return (
    <html lang="en" className={clsx(theme, 'h-full bg-bg-primary')}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <NonFlashOfWrongThemeEls ssrTheme={Boolean(data.theme)} />
      </head>
      <body className="h-full">
        {/* Navigation Bar */}
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

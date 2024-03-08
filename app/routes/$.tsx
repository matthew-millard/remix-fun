import { Link, useRouteError, useLocation } from '@remix-run/react';

interface ErrorResponse {
  status: number;
  statusText: string;
  data?: string; // Optional, depending on your error structure
}

export async function loader() {
  throw new Response('Not found', { status: 404 });
}

export default function NotFound() {
  return <ErrorBoundary />;
}

export function ErrorBoundary() {
  const location = useLocation();
  const error = useRouteError() as ErrorResponse;
  console.log(error);

  return (
    <main className="h-full flex justify-center items-center">
      <div className="grid place-items-center bg-bg-primary px-6 py-24 sm:py-32 lg:px-8 lg:py-60 text-center">
        {/* Conditionally render the status if it exists */}
        {error.status && <p className="text-2xl font-semibold text-text-notify sm:text-3xl">{error.status}</p>}
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-text-primary sm:text-5xl">
          We can&apos;t find this page: {location.pathname}
        </h1>

        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link
            to="/"
            className="rounded-md text-text-notify px-3.5 py-2.5 text-sm font-semibold  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Go back home
          </Link>
          <Link to="/" className="text-sm font-semibold text-text-primary">
            Contact support <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </main>
  );
}

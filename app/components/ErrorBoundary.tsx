import { Link, isRouteErrorResponse, useRouteError } from '@remix-run/react';

export function GeneralErrorBoundary() {
	const error = useRouteError();

	if (isRouteErrorResponse(error)) {
		return <ErrorLayout status={error.status} title={error.statusText} message={error.data} />;
	} else if (error instanceof Error) {
		return <ErrorLayout title={error.name} message={error.message} />;
	} else {
		return <ErrorLayout title="Unknown Error" message={null} />;
	}
}

function ErrorLayout({ status, title, message }: { status?: number; title: string; message: string | null }) {
	return (
		<main className="flex h-full items-center justify-center">
			<div className="grid place-items-center bg-bg-primary px-6 py-24 text-center sm:py-32 lg:px-8 lg:py-60">
				{/* Conditionally render the status if it exists */}
				{status && <p className="text-2xl font-semibold text-text-notify sm:text-3xl">{status}</p>}
				<h1 className="mt-4 text-3xl font-bold tracking-tight text-text-primary sm:text-5xl">{title}</h1>
				{/* Ensure message is rendered only if it's not null */}
				{message && <p className="mt-6 text-base leading-7 text-text-secondary">{message}</p>}
				<div className="mt-10 flex items-center justify-center gap-x-6">
					<ActionLinks />
				</div>
			</div>
		</main>
	);
}

function ActionLinks() {
	return (
		<>
			<Link
				to="/"
				className="rounded-md px-3.5 py-2.5 text-sm font-semibold text-text-notify shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
			>
				Go back home
			</Link>
			<Link to="/" className="text-sm font-semibold text-text-primary">
				Contact support <span aria-hidden="true">&rarr;</span>
			</Link>
		</>
	);
}

import { MetaFunction } from '@remix-run/node';
import { isRouteErrorResponse, useRouteError } from '@remix-run/react';
import { Link } from 'react-router-dom';

export default function Index() {
	return (
		<>
			<h1>Main</h1>
		</>
	);
}

export function ErrorBoundary() {
	const error = useRouteError();

	if (isRouteErrorResponse(error)) {
		return (
			<div className="grid min-h-full place-items-center bg-bg-primary px-6 py-24 text-center sm:py-32 lg:px-8 lg:py-60">
				<p className="text-base font-semibold text-text-notify">{error.status}</p>
				<h1 className="mt-4 text-3xl font-bold tracking-tight text-text-primary sm:text-5xl">{error.statusText}</h1>
				<p className="mt-6 text-base leading-7 text-text-secondary">{error.data}</p>
				<div className="mt-10 flex items-center justify-center gap-x-6">
					<Link
						to="#"
						className="rounded-md px-3.5 py-2.5 text-sm font-semibold text-text-notify  shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
					>
						Go back home
					</Link>
					<Link to="/" className="text-sm font-semibold text-text-primary">
						Contact support <span aria-hidden="true">&rarr;</span>
					</Link>
				</div>
			</div>
		);
	} else if (error instanceof Error) {
		return (
			<div>
				<h1>Error</h1>
				<p>{error.message}</p>
				<p>The stack trace is:</p>
				<pre>{error.stack}</pre>
			</div>
		);
	} else {
		return <h1>Unknown Error</h1>;
	}
}

export const meta: MetaFunction = () => {
	return [
		{ title: 'Home | Barfly' },
		{
			name: 'description',
			content: 'Barfly is a community-driven platform for discovering the drinking establishments in Canada.',
		},
	];
};

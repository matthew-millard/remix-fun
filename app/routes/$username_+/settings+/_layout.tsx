import { LoaderFunctionArgs } from '@remix-run/node';
import { Link, Outlet } from '@remix-run/react';

export default function SettingsLayoutRoute() {
	return (
		<main className="px-6">
			<Outlet />
		</main>
	);
}

export const handle = {
	breadcrumb: ({ params: { username } }: LoaderFunctionArgs) => (
		<Link
			prefetch="intent"
			className="ml-1 text-xs text-gray-400 hover:text-gray-500  lg:ml-4 lg:text-sm"
			to={`/${username}/settings`}
		>
			Settings
		</Link>
	),
};

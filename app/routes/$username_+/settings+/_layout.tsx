import { LoaderFunctionArgs } from '@remix-run/node';
import { Link, Outlet } from '@remix-run/react';

export default function SettingsLayoutRoute() {
	return <Outlet />;
}

export const handle = {
	breadcrumb: ({ params: { username } }: LoaderFunctionArgs) => (
		<Link prefetch="intent" className="ml-4 text-sm  text-gray-400 hover:text-gray-500" to={`/${username}/settings`}>
			Settings
		</Link>
	),
};

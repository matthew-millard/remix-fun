import { Link, Outlet } from '@remix-run/react';
import { LoaderFunctionArgs } from 'react-router';

export default function UserLayoutRoute() {
	return <Outlet />;
}

export const handle = {
	breadcrumb: ({ params: { username } }: LoaderFunctionArgs) => (
		<Link
			prefetch="intent"
			className="ml-1 text-xs text-gray-400 hover:text-gray-500  lg:ml-4 lg:text-sm"
			to={`/${username}`}
		>
			{username}
		</Link>
	),
};

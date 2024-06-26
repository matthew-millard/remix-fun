import { Link, Outlet } from '@remix-run/react';

export default function CocktailsLayoutRoute() {
	return (
		<main>
			<Outlet />
		</main>
	);
}

export const handle = {
	breadcrumb: () => (
		<Link
			prefetch="intent"
			className="ml-1 text-xs text-gray-400 hover:text-gray-500  lg:ml-4 lg:text-sm"
			to={`/cocktails`}
		>
			Cocktails
		</Link>
	),
};

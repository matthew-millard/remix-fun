import { LoaderFunctionArgs } from '@remix-run/node';
import { Link } from '@remix-run/react';

export default function FavouriteBars() {
	return (
		<>
			<h1>Favourite Bars</h1>
		</>
	);
}
export const handle = {
	breadcrumb: ({ params: { username } }: LoaderFunctionArgs) => (
		<Link
			prefetch="intent"
			className="ml-1 text-xs text-gray-400 hover:text-gray-500  lg:ml-4 lg:text-sm"
			to={`/${username}/favourite-bars`}
		>
			Favourite Bars
		</Link>
	),
};

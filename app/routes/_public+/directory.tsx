import type { MetaFunction } from '@remix-run/node';
import { Link } from '@remix-run/react';

export const meta: MetaFunction = () => {
	return [
		{ title: 'BarFly | Bar Directory' },
		{ name: 'description', content: 'A-Z directory of the top drinking establishments in Canada.' },
	];
};

export const handle = {
	breadcrumb: () => (
		<Link
			prefetch="intent"
			className="ml-1 text-xs text-gray-400 hover:text-gray-500  lg:ml-4 lg:text-sm"
			to="/directory"
		>
			Directory
		</Link>
	),
};

export default function Directory() {
	return (
		<>
			<h1>Bar Directory</h1>
		</>
	);
}

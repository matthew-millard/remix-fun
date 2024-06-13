import type { MetaFunction } from '@remix-run/node';
import { Link } from '@remix-run/react';

export const meta: MetaFunction = () => {
	return [
		{ title: 'BarFly | Discovery' },
		{ name: 'description', content: 'Search and discover bars from across Canada.' },
	];
};

export const handle = {
	breadcrumb: () => (
		<Link prefetch="intent" className="ml-4 text-sm  text-gray-400 hover:text-gray-500" to="/discovery">
			Discovery
		</Link>
	),
};

export default function Discovery() {
	return <></>;
}

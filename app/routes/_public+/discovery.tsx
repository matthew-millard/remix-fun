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
		<Link
			prefetch="intent"
			className="ml-1 text-xs text-gray-400 hover:text-gray-500  lg:ml-4 lg:text-sm"
			to="/discovery"
		>
			Discovery
		</Link>
	),
};

export default function Discovery() {
	return <></>;
}

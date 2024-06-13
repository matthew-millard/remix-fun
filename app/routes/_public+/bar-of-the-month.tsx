import type { MetaFunction } from '@remix-run/node';
import { Link } from '@remix-run/react';

export const meta: MetaFunction = () => {
	return [
		{ title: 'BarFly | Bar Of The Month' },
		{
			name: 'description',
			content:
				"Explore BarFly's Bar of the Month: Your monthly guide to discovering exceptional bars with unique atmospheres, outstanding drinks, and unforgettable experiences.",
		},
	];
};

export const handle = {
	breadcrumb: () => (
		<Link prefetch="intent" className="ml-4 text-sm  text-gray-400 hover:text-gray-500" to="/bar-of-the-month">
			Bar Of The Month
		</Link>
	),
};

export default function BarOfTheMonth() {
	return (
		<>
			<h1>Bar Of The Month</h1>
		</>
	);
}

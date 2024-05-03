import type { MetaFunction } from '@remix-run/node';

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

export default function BarOfTheMonth() {
	return (
		<>
			<h1>Bar Of The Month</h1>
		</>
	);
}

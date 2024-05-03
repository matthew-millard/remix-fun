import type { MetaFunction } from '@remix-run/node';

export const meta: MetaFunction = () => {
	return [
		{ title: 'BarFly | Bar Directory' },
		{ name: 'description', content: 'A-Z directory of the top drinking establishments in Canada.' },
	];
};

export default function Directory() {
	return (
		<>
			<h1>Bar Directory</h1>
		</>
	);
}

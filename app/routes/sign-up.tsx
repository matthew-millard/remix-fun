import type { MetaFunction } from '@remix-run/node';

export const meta: MetaFunction = () => {
	return [{ title: 'BarFly | Sign up' }, { name: 'description', content: 'Insert page description here!' }];
};

export default function Directory() {
	return (
		<>
			<h1>Sign up</h1>
		</>
	);
}

import type { MetaFunction } from '@remix-run/node'

export const meta: MetaFunction = () => {
	return [
		{ title: 'BarFly | Dashboard' },
		{ name: 'description', content: 'Users dashboard.' },
	]
}

export default function Dashboard() {
	return (
		<>
			<h1 className="text-text-primary">Dashboard</h1>
		</>
	)
}

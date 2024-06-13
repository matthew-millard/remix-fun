import { Link, useRouteLoaderData } from '@remix-run/react';

const team = [
	{
		name: 'Leslie Alexander',
		handle: 'lesliealexander',
		role: 'Co-Founder / CEO',
		imageUrl:
			'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
	},
	{
		name: 'Michael Foster',
		handle: 'michaelfoster',
		role: 'Co-Founder / CTO',
		imageUrl:
			'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
	},
	{
		name: 'Dries Vincent',
		handle: 'driesvincent',
		role: 'Business Relations',
		imageUrl:
			'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
	},
	{
		name: 'Lindsay Walton',
		handle: 'lindsaywalton',
		role: 'Front-end Developer',
		imageUrl:
			'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
	},
];

export default function Profile() {
	const data = useRouteLoaderData('routes/$username_+/profile');
	console.log('data use route data', data);
	const user = data.user;

	return (
		<div>
			<div className="mx-auto mt-6 max-w-5xl px-4 sm:px-6 lg:px-8">
				<dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
					<div className="sm:col-span-1">
						<dt className="text-sm font-medium text-text-secondary">Username</dt>
						<dd className="mt-1 text-sm text-text-primary">{user.username?.username}</dd>
					</div>
					<div className="sm:col-span-1">
						<dt className="text-sm font-medium text-text-secondary">Email</dt>
						<dd className="mt-1 text-sm text-text-primary">{user?.email}</dd>
					</div>
					<div className="sm:col-span-1">
						<dt className="text-sm font-medium text-text-secondary">Location</dt>
						<dd className="mt-1 text-sm text-text-primary">{user.userLocation?.city}</dd>
					</div>
					<div className="sm:col-span-1">
						<dt className="text-sm font-medium text-text-secondary">Find me</dt>
						<dd className="mt-1 text-sm text-text-primary">Giulia Pizza Elgin Street</dd>
					</div>
					<div className="sm:col-span-2">
						<dt className="text-sm font-medium text-text-secondary">About</dt>
						<dd
							className="mt-1 max-w-prose space-y-5 text-sm text-text-primary"
							dangerouslySetInnerHTML={{ __html: user.about?.about }}
						/>
					</div>
				</dl>
			</div>
			{/* Team member list */}
			<div className="mx-auto mt-8 max-w-5xl px-4 pb-12 sm:px-6 lg:px-8">
				<h2 className="text-sm font-medium text-text-secondary">Team members</h2>
				<div className="mt-1 grid grid-cols-1 gap-4 sm:grid-cols-2">
					{team.map(person => (
						<div
							key={person.handle}
							className="relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm focus-within:ring-2 focus-within:ring-pink-500 focus-within:ring-offset-2 hover:border-gray-400"
						>
							<div className="flex-shrink-0">
								<img className="h-10 w-10 rounded-full" src={person.imageUrl} alt="" />
							</div>
							<div className="min-w-0 flex-1">
								<Link to="/" className="focus:outline-none">
									<span className="absolute inset-0" aria-hidden="true" />
									<p className="text-sm font-medium text-text-primary">{person.name}</p>
									<p className="truncate text-sm text-text-secondary">{person.role}</p>
								</Link>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

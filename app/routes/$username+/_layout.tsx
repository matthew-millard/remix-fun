import { useState, useEffect, useRef } from 'react';
import { EnvelopeIcon } from '@heroicons/react/20/solid';
import { Link, Outlet, useLoaderData } from '@remix-run/react';
import { LoaderFunctionArgs } from '@remix-run/node';
import { requireUser } from '~/utils/auth.server';
import { prisma } from '~/utils/db.server';
import { ImageChooser } from '~/components';

function classNames(...classes: string[]) {
	return classes.filter(Boolean).join(' ');
}

export async function loader({ request, params }: LoaderFunctionArgs) {
	await requireUser(request);
	const user = await prisma.user.findFirst({
		select: {
			firstName: true,
			lastName: true,
			createdAt: true,
			profileImage: true,
			coverImage: true,
			userLocation: true,
			about: true,
			username: true,
			email: true,
		},
		where: {
			username: {
				username: params.username,
			},
		},
	});

	if (!user) {
		throw new Response('User not found', { status: 404 });
	}

	return {
		user,
	};
}

export default function ProfileLayoutRoute() {
	const data = useLoaderData<typeof loader>();

	const fullName = data.user.firstName + ' ' + data.user.lastName;
	const activeTab = useRef('Profile');

	const tabs = [
		{
			name: 'Profile',
			href: `/${data.user.username.username}`,
			current: true,
		},
		{ name: 'Favourite Bars', href: `/${data.user.username.username}/favourite-bars`, current: false },
		{ name: 'Reviews', href: `/${data.user.username.username}/reviews`, current: false },
	];

	const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
	const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);

	useEffect(() => {
		if (data.user?.profileImage?.id) {
			setProfileImageUrl(`/resources/images/${data.user.profileImage.id}/profile`);
		} else {
			setProfileImageUrl(null); // reset to null if no profile image is availble
		}
	}, [data.user?.profileImage?.id]);

	useEffect(() => {
		if (data.user?.coverImage?.id) {
			setCoverImageUrl(`/resources/images/${data.user.coverImage.id}/cover`);
		} else {
			setCoverImageUrl(null); // reset to null if no profile image is availble
		}
	}, [data.user?.coverImage?.id]);

	return (
		<>
			<div className="flex h-full">
				<div className="relative z-0 flex flex-1 overflow-hidden">
					<main className="relative z-0 flex-1 overflow-y-auto focus:outline-none xl:order-last">
						<article>
							{/* Profile header */}
							<div>
								<div>
									<span className="flex h-56 w-full items-center justify-center overflow-hidden object-cover lg:h-96">
										<ImageChooser imageUrl={coverImageUrl} />
									</span>
								</div>
								<div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
									<div className="relative -mt-12 sm:-mt-16 sm:flex sm:items-end sm:space-x-5 ">
										<span className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full object-cover ring-4 ring-white sm:h-32 sm:w-32 lg:h-40 lg:w-40">
											<ImageChooser imageUrl={profileImageUrl} />
										</span>

										<div className="mt-6 sm:flex sm:min-w-0 sm:flex-1 sm:items-center sm:justify-end sm:space-x-6 sm:pb-1">
											<div className="mt-6 min-w-0 flex-1 sm:hidden 2xl:block">
												<h1 className="truncate text-2xl font-bold text-text-primary">{fullName}</h1>
											</div>
											<div className="mt-6 flex flex-col justify-stretch space-y-3 sm:flex-row sm:space-x-4 sm:space-y-0">
												<button
													type="button"
													className="inline-flex justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-black shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
												>
													<EnvelopeIcon className="-ml-0.5 h-5 w-5 text-gray-400" aria-hidden="true" />
													Message
												</button>
											</div>
										</div>
									</div>
									<div className="mt-6 hidden min-w-0 flex-1 sm:block 2xl:hidden">
										<h1 className="truncate text-2xl font-bold text-text-primary">{fullName}</h1>
									</div>
								</div>
							</div>

							{/* Tabs */}
							<div className="mt-6 sm:mt-2 2xl:mt-5">
								<div className="border-b border-gray-200">
									<div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
										<nav className="-mb-px flex space-x-8" aria-label="Tabs">
											{tabs.map(tab => (
												<Link
													key={tab.name}
													to={tab.href}
													prefetch="intent"
													className={classNames(
														'whitespace-nowrap px-1 py-4 text-sm font-medium',
														activeTab.current === tab.name
															? 'border-b-2 border-pink-500 text-text-primary'
															: 'border-b-2 border-transparent text-text-secondary hover:border-gray-300 hover:text-gray-700',
													)}
													onClick={() => (activeTab.current = tab.name)}
													aria-current={activeTab.current === tab.name ? 'page' : undefined}
												>
													{tab.name}
												</Link>
											))}
										</nav>
									</div>
								</div>
							</div>
							<Outlet />
						</article>
					</main>
				</div>
			</div>
		</>
	);
}

export const handle = {
	breadcrumb: ({ params: { username } }: LoaderFunctionArgs) => (
		<Link
			prefetch="intent"
			className="ml-1 text-xs text-gray-400 hover:text-gray-500  lg:ml-4 lg:text-sm"
			to={`/${username}`}
		>
			{username}
		</Link>
	),
};

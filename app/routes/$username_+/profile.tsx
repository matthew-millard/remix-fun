import { useState, useEffect, useRef } from 'react';

import { EnvelopeIcon } from '@heroicons/react/20/solid';
import { Link, Outlet, useLoaderData } from '@remix-run/react';
import { LoaderFunctionArgs } from '@remix-run/node';
import { requireUser } from '~/utils/auth.server';
import { prisma } from '~/utils/db.server';

function classNames(...classes: string[]) {
	return classes.filter(Boolean).join(' ');
}

export async function loader({ request }: LoaderFunctionArgs) {
	const { id } = await requireUser(request);

	const user = await prisma.user.findUnique({
		where: { id: id },
		include: { profileImage: true, coverImage: true, userLocation: true, username: true, about: true },
	});

	return {
		user,
	};
}

export default function ProfileRoute() {
	const { user } = useLoaderData<typeof loader>();
	const fullName = user.firstName + ' ' + user.lastName;
	const activeTab = useRef('Profile');

	const tabs = [
		{
			name: 'Profile',
			href: `/${user.username.username}/profile`,
			current: true,
		},
		{ name: 'Favourite Bars', href: `/${user.username.username}/profile/favourite-bars`, current: false },
		{ name: 'Reviews', href: `/${user.username.username}/profile/reviews`, current: false },
	];

	const [profileImagePreviewUrl, setProfileImagePreviewUrl] = useState<string | null>(null);
	const [coverImagePreviewUrl, setCoverImagePreviewUrl] = useState<string | null>(null);

	useEffect(() => {
		if (user?.profileImage?.id) {
			setProfileImagePreviewUrl(`/resources/images/${user.profileImage.id}/profile`);
		} else {
			setProfileImagePreviewUrl(null); // reset to null if no profile image is availble
		}
	}, [user?.profileImage?.id]);

	useEffect(() => {
		if (user?.coverImage?.id) {
			setCoverImagePreviewUrl(`/resources/images/${user.coverImage.id}/cover`);
		} else {
			setCoverImagePreviewUrl(null); // reset to null if no profile image is availble
		}
	}, [user?.coverImage?.id]);

	return (
		<>
			<div className="flex h-full">
				<div className="relative z-0 flex flex-1 overflow-hidden">
					<main className="relative z-0 flex-1 overflow-y-auto focus:outline-none xl:order-last">
						{/* Breadcrumb */}

						<article>
							{/* Profile header */}
							<div>
								<div>
									<img className="h-32 w-full object-cover lg:h-48" src={coverImagePreviewUrl} alt="" />
								</div>
								<div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
									<div className="-mt-12 sm:-mt-16 sm:flex sm:items-end sm:space-x-5">
										<div className="flex">
											<img
												className="h-24 w-24 overflow-hidden rounded-full object-cover ring-4 ring-white sm:h-32 sm:w-32"
												src={profileImagePreviewUrl}
												alt=""
											/>
										</div>
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

import { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLoaderData } from '@remix-run/react';
import { LoaderFunctionArgs } from '@remix-run/node';
import { requireUser } from '~/utils/auth.server';
import { prisma } from '~/utils/db.server';
import { ImageChooser, ProfileOptionsMenu } from '~/components';
import classNames from '~/utils/classNames';

export async function loader({ request, params }: LoaderFunctionArgs) {
	const currentUser = await requireUser(request);
	const userProfile = await prisma.user.findFirst({
		select: {
			id: true,
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

	if (!userProfile) {
		throw new Response('User not found', { status: 404 });
	}

	return {
		userProfile,
		currentUser,
	};
}

export default function ProfileLayoutRoute() {
	const { userProfile, currentUser } = useLoaderData<typeof loader>();
	const [isViewAsPublic, setIsViewAsPublic] = useState(false);

	const [isCurrentUserProfile, setIsCurrentUserProfile] = useState((): boolean => {
		return currentUser?.id === userProfile.id;
	});

	useEffect(() => {
		setIsCurrentUserProfile(currentUser?.id === userProfile.id);
	}, [userProfile, currentUser]);

	const fullName = userProfile?.firstName + ' ' + userProfile?.lastName;
	const activeTab = useRef('Profile');

	const tabs = [
		{
			name: 'Profile',
			href: `/${userProfile.username.username}`,
			current: true,
		},
		{ name: 'Favourite Bars', href: `/${userProfile.username.username}/favourite-bars`, current: false },
		{ name: 'Reviews', href: `/${userProfile.username.username}/reviews`, current: false },
	];

	const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
	const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);

	useEffect(() => {
		if (userProfile?.profileImage?.id) {
			setProfileImageUrl(`/resources/images/${userProfile.profileImage.id}/profile`);
		} else {
			setProfileImageUrl(null); // reset to null if no profile image is availble
		}
	}, [userProfile?.profileImage?.id]);

	useEffect(() => {
		if (userProfile?.coverImage?.id) {
			setCoverImageUrl(`/resources/images/${userProfile.coverImage.id}/cover`);
		} else {
			setCoverImageUrl(null); // reset to null if no profile image is availble
		}
	}, [userProfile?.coverImage?.id]);

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
												<ProfileOptionsMenu
													isViewAsPublic={isViewAsPublic}
													setIsViewAsPublic={setIsViewAsPublic}
													isDisabled={!isCurrentUserProfile}
												/>
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
							<Outlet context={{ isCurrentUserProfile, isViewAsPublic }} />
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

import { LoaderFunctionArgs } from '@remix-run/node';
import { Link, useOutletContext } from '@remix-run/react';
// import { loader } from './_layout';

type Outlet = {
	isCurrentUserProfile: boolean;
	isViewAsPublic: boolean;
};

export default function Profile() {
	const { isCurrentUserProfile, isViewAsPublic } = useOutletContext<Outlet>();
	// const { userProfile } = useRouteLoaderData<typeof loader>('routes/$username+/_layout');

	return <>{!isCurrentUserProfile || isViewAsPublic ? <UserProfilePublicView /> : <UserProfilePrivateView />}</>;
}

export const handle = {
	breadcrumb: ({ params: { username } }: LoaderFunctionArgs) => (
		<Link
			prefetch="intent"
			className="ml-1 text-xs text-gray-400 hover:text-gray-500  lg:ml-4 lg:text-sm"
			to={`/${username}`}
		>
			Profile
		</Link>
	),
};

function UserProfilePublicView() {
	return <h1 className="text-xl font-semibold text-text-primary">User&apos;s profile in public view</h1>;
}

function UserProfilePrivateView() {
	return <h1 className="text-xl font-semibold text-text-primary">User&apos;s profile in private view</h1>;
}

{
	/* <div className="mx-auto mt-6 max-w-5xl px-4 sm:px-6 lg:px-8">
					<dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
						<div className="sm:col-span-1">
							<dt className="text-sm font-medium text-text-secondary">Username</dt>
							<dd className="mt-1 text-sm text-text-primary">{userProfile?.username?.username}</dd>
						</div>
						<div className="sm:col-span-1">
							<dt className="text-sm font-medium text-text-secondary">Email</dt>
							<dd className="mt-1 text-sm text-text-primary">{userProfile?.email}</dd>
						</div>
						<div className="sm:col-span-1">
							<dt className="text-sm font-medium text-text-secondary">Location</dt>
							<dd className="mt-1 text-sm text-text-primary">{userProfile?.userLocation?.city}</dd>
						</div>
						<div className="sm:col-span-1">
							<dt className="text-sm font-medium text-text-secondary">Find me</dt>
							<dd className="mt-1 text-sm text-text-primary">Giulia Pizza Elgin Street</dd>
						</div>
						<div className="sm:col-span-2">
							<dt className="text-sm font-medium text-text-secondary">About</dt>
							<dd
								className="mt-1 max-w-prose space-y-5 text-sm text-text-primary"
								dangerouslySetInnerHTML={{ __html: userProfile?.about?.about }}
							/>
						</div>
					</dl>
				</div> */
}

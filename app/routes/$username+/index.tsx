import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { Link, useOutletContext } from '@remix-run/react';
import { UserEditProfileView } from '~/components';

export const updateCurrentPlaceOfWorkActionIntent = 'updateCurrentPlaceOfWork';

// import { loader } from './_layout';

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData();

	console.log('formData', formData);

	return {};
}

type Outlet = {
	isCurrentUserProfile: boolean;
	isViewAsPublic: boolean;
};

const user = {
	name: 'Matt Millard',
	bio: 'I am a bartender at Giulia Pizza. I have worked at Swift Soho and Panda & Sons. I am a cocktail enthusiast and I love to travel.',
	currentBar: {
		name: 'Giulia Pizza',
		position: 'Bartender',
		url: 'https://giuliapizza.com/',
	},
	pastBars: [
		{
			name: 'Swift Soho',
			position: 'Bartender',
			url: 'https://moonroom.ca/',
		},
		{
			name: 'Panda & Sons',
			position: 'Barback',
			url: 'https://pandaandsons.com',
		},
	],
	findMe: {
		instagram: 'https://www.instagram.com/giuliapizza/',
		x: 'https://twitter.com/giuliapizza',
		facebook: 'https://www.facebook.com/giuliapizza',
	},
	location: {
		city: 'Ottawa',
		province: 'Ontario',
		country: 'Canada',
	},
	availableForFreelance: true,
};

export default function Profile() {
	const { isCurrentUserProfile, isViewAsPublic } = useOutletContext<Outlet>();
	// const { userProfile } = useRouteLoaderData<typeof loader>('routes/$username+/_layout');

	return (
		<main className="mx-auto mt-6 h-screen max-w-5xl px-4 sm:px-6 lg:px-8">
			{!isCurrentUserProfile || isViewAsPublic ? <UserPublicProfileView /> : <UserEditProfileView />}
		</main>
	);
}

function UserPublicProfileView() {
	return <></>;
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

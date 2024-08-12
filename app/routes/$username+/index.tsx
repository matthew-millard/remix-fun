import { ActionFunctionArgs, json, LoaderFunctionArgs } from '@remix-run/node';
import { Link, useOutletContext } from '@remix-run/react';
import { UserEditProfileView } from '~/components';
import { requireUser } from '~/utils/auth.server';
import { checkCSRF } from '~/utils/csrf.server';
import { ProfileActionArgs } from '../$username_+/settings+';
import { parseWithZod } from '@conform-to/zod';
import { CurrentPlaceOfWorkSchema } from '~/components/ui/UserEditProfileView';
import { prisma } from '~/utils/db.server';

export const updateCurrentPlaceOfWorkActionIntent = 'updateCurrentPlaceOfWork';

// import { loader } from './_layout';

export async function action({ request }: ActionFunctionArgs) {
	const user = await requireUser(request);
	const userId = user.id;
	const formData = await request.formData();
	console.log('formData', formData);
	await checkCSRF(formData, request.headers);

	const intent = formData.get('intent');

	switch (intent) {
		case updateCurrentPlaceOfWorkActionIntent: {
			return currentPlaceOfWorkUpdateAction({ formData, userId, request });
		}
		default: {
			throw new Response(`Invalid intent "${intent}"`, { status: 400 });
		}
	}

	async function currentPlaceOfWorkUpdateAction({ formData, userId, request }: ProfileActionArgs) {
		console.log('currentPlaceOfWorkUpdateAction');

		const submission = parseWithZod(formData, { schema: CurrentPlaceOfWorkSchema });

		if (submission.status !== 'success') {
			return json(submission.reply(), {
				status: submission.status === 'error' ? 400 : 200,
			});
		}

		const currentPlaceOfWorkData = {
			userId,
			name: submission.value.name,
			position: submission.value.positions,
			startDate: new Date(submission.value.startDate), // Convert to DateTime type for Prisma
		};

		await prisma.currentPlaceOfWork.upsert({
			where: { userId },
			create: currentPlaceOfWorkData,
			update: currentPlaceOfWorkData,
		});

		return json({ status: 'success' });
	}
}

type Outlet = {
	isCurrentUserProfile: boolean;
	isViewAsPublic: boolean;
};

// const user = {
// 	name: 'Matt Millard',
// 	bio: 'I am a bartender at Giulia Pizza. I have worked at Swift Soho and Panda & Sons. I am a cocktail enthusiast and I love to travel.',
// 	currentBar: {
// 		name: 'Giulia Pizza',
// 		position: 'Bartender',
// 		url: 'https://giuliapizza.com/',
// 	},
// 	pastBars: [
// 		{
// 			name: 'Swift Soho',
// 			position: 'Bartender',
// 			url: 'https://moonroom.ca/',
// 		},
// 		{
// 			name: 'Panda & Sons',
// 			position: 'Barback',
// 			url: 'https://pandaandsons.com',
// 		},
// 	],
// 	findMe: {
// 		instagram: 'https://www.instagram.com/giuliapizza/',
// 		x: 'https://twitter.com/giuliapizza',
// 		facebook: 'https://www.facebook.com/giuliapizza',
// 	},
// 	location: {
// 		city: 'Ottawa',
// 		province: 'Ontario',
// 		country: 'Canada',
// 	},
// 	availableForFreelance: true,
// };

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

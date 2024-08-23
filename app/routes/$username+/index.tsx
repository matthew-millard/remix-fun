import { ActionFunctionArgs, json, LoaderFunctionArgs } from '@remix-run/node';
import { Link, useLoaderData, useOutletContext } from '@remix-run/react';
import { UserEditProfileView } from '~/components';
import { requireUser } from '~/utils/auth.server';
import { checkCSRF } from '~/utils/csrf.server';
import { ProfileActionArgs } from '../$username_+/settings+';
import { parseWithZod } from '@conform-to/zod';
import { CurrentPlaceOfWorkSchema } from '~/components/ui/UserEditProfileView';
import { prisma } from '~/utils/db.server';
import { canadaMajorCities } from '~/utils/canada-data';
import { z } from 'zod';

export const updateCurrentPlaceOfWorkActionIntent = 'updateCurrentPlaceOfWork';
export const deleteCurrentPlaceOfWorkActionIntent = 'deleteCurrentPlaceOfWork';

type Outlet = {
	isCurrentUserProfile: boolean;
	isViewAsPublic: boolean;
};

export type UserProfileProps = {
	currentPlaceOfWork: {
		name: string;
		position: string;
		startDate: string;
		city: string;
		websiteUrl?: string;
	};
};

export async function action({ request }: ActionFunctionArgs) {
	const user = await requireUser(request);
	const userId = user.id;
	const formData = await request.formData();

	await checkCSRF(formData, request.headers);

	const intent = formData.get('intent');

	switch (intent) {
		case updateCurrentPlaceOfWorkActionIntent: {
			return currentPlaceOfWorkUpdateAction({ formData, userId, request });
		}
		case deleteCurrentPlaceOfWorkActionIntent: {
			return currentPlaceOfWorkDeleteAction({ formData, userId, request });
		}
		default: {
			throw new Response(`Invalid intent "${intent}"`, { status: 400 });
		}
	}

	async function currentPlaceOfWorkUpdateAction({ formData, userId }: ProfileActionArgs) {
		const submission = await parseWithZod(formData, {
			async: true,
			schema: CurrentPlaceOfWorkSchema.transform((data, ctx) => {
				const cityName = data.city;

				if (!canadaMajorCities.includes(cityName)) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: 'Invalid city',
						path: ['city'],
					});
				}
				return data;
			}),
		});

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
			city: submission.value.city,
			websiteUrl: submission.value.websiteUrl,
		};

		await prisma.currentPlaceOfWork.upsert({
			where: { userId },
			create: currentPlaceOfWorkData,
			update: currentPlaceOfWorkData,
		});

		return json(submission.reply(), { status: 200 });
	}

	async function currentPlaceOfWorkDeleteAction({ userId }: ProfileActionArgs) {
		const submission = parseWithZod(formData, {
			schema: z.object({ intent: z.literal(deleteCurrentPlaceOfWorkActionIntent) }),
		});

		if (submission.status !== 'success') {
			return json(submission.reply(), {
				status: submission.status === 'error' ? 400 : 200,
			});
		}

		await prisma.currentPlaceOfWork.delete({
			where: { userId },
		});

		return json(submission.reply(), { status: 200 });
	}
}

export async function loader({ request, params }: LoaderFunctionArgs) {
	await requireUser(request);

	const userProfile = await prisma.user.findFirst({
		where: {
			username: {
				username: params.username,
			},
		},
		include: {
			currentPlaceOfWork: true,
		},
	});

	if (!userProfile) {
		throw new Response('User not found', { status: 404 });
	}

	// // Remove http:// from websiteUrl
	if (userProfile.currentPlaceOfWork?.websiteUrl) {
		userProfile.currentPlaceOfWork.websiteUrl = userProfile.currentPlaceOfWork?.websiteUrl?.replace('http://', '');
	}

	return { userProfile };
}

export default function Profile() {
	const { userProfile } = useLoaderData<typeof loader>();
	const { isCurrentUserProfile, isViewAsPublic } = useOutletContext<Outlet>();

	return (
		<main className="mx-auto mt-6 h-screen max-w-5xl px-4 sm:px-6 lg:px-8">
			{!isCurrentUserProfile || isViewAsPublic ? (
				<UserPublicProfileView currentPlaceOfWork={userProfile.currentPlaceOfWork} />
			) : (
				<UserEditProfileView currentPlaceOfWork={userProfile.currentPlaceOfWork} />
			)}
		</main>
	);
}

function UserPublicProfileView({ currentPlaceOfWork }: UserProfileProps) {
	return (
		<>
			<h1 className=" text-lg text-text-primary">{currentPlaceOfWork?.name}</h1>
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
			Profile
		</Link>
	),
};

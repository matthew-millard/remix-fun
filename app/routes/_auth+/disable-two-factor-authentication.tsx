import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from '@remix-run/node';
import { requireUserId } from '~/utils/auth.server';
import { prisma } from '~/utils/db.server';
import { twoFAVerificationType } from '../$username_+/settings+/two-factor-authentication+/_layout';
import { redirectWithToast } from '~/utils/toast.server';

export async function loader({ request }: LoaderFunctionArgs) {
	await requireUserId(request);
	return redirect('/');
}

export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserId(request);

	const { username } = await prisma.user.findUnique({
		where: {
			id: userId,
		},
		select: {
			username: {
				select: {
					username: true,
				},
			},
		},
	});

	await prisma.verification.delete({
		where: {
			target_type: {
				target: userId,
				type: twoFAVerificationType,
			},
		},
	});

	throw await redirectWithToast(`/${username.username}/settings`, {
		title: 'Two-factor authentication disabled',
		description: 'Two-factor authentication has been successfully disabled.',
		type: 'success',
	});
}

import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from '@remix-run/node';
import { requireUserId } from '~/utils/auth.server';
import { deleteUser } from '~/utils/prisma-user-helpers';
import { getSession, sessionStorage } from '~/utils/session.server';

export async function loader({ request }: LoaderFunctionArgs) {
	await requireUserId(request);
	return redirect('/');
}

export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserId(request);
	const session = await getSession(request);

	const deletedUser = await deleteUser(userId);

	if (!deletedUser) {
		throw new Error('Failed to delete user');
	}

	return redirect('/', {
		headers: {
			'Set-Cookie': await sessionStorage.destroySession(session),
		},
	});
}

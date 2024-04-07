import { ActionFunctionArgs, redirect } from '@remix-run/node';
import { get } from 'http';
import { deleteUser } from '~/utils/prisma-user-helpers';
import { getSession, sessionStorage } from '~/utils/session.server';

export async function loader() {
	return redirect('/');
}

export async function action({ request }: ActionFunctionArgs) {
	const session = await getSession(request);
	const userId = session.get('userId');

	const deletedUser = await deleteUser(userId);
	console.log('deletedUser**************************', deletedUser);

	if (!deletedUser) {
		throw new Error('Failed to delete user');
	}

	return redirect('/', {
		headers: {
			'Set-Cookie': await sessionStorage.destroySession(session),
		},
	});
}
